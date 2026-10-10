import { prisma } from "../lib/prisma";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { config } from "../config/env";
import { BadRequestError, NotFoundError, UnauthorizedError } from "../utils/errors";
import { JwtPayload, RefreshTokenPayload } from "../types";

const JWT_SECRET = config.JWT_SECRET;
const JWT_ACCESS_EXPIRES_IN = config.JWT_ACCESS_EXPIRES_IN;
const JWT_REFRESH_EXPIRES_IN = config.JWT_REFRESH_EXPIRES_IN;
const JWT_ROTATION_DAYS = config.JWT_ROTATION_DAYS;

export interface SessionData {
  id: string;
  deviceId: string;
  userAgent: string;
  ipAddress: string;
  lastActiveAt: Date;
  isCurrent: boolean;
  createdAt: Date;
}

export interface SessionListResponse {
  sessions: SessionData[];
  currentSessionId?: string;
}

/**
 * Session management service
 * Handles session creation, refresh, revocation, and listing
 */
export class SessionService {
  /**
   * Create a new session for a user
   * Issues access and refresh tokens, stores session in DB
   */
  async createSession(
    userId: string,
    schoolId: string,
    role: string,
    deviceId: string,
    userAgent: string,
    ipAddress: string,
    remember: boolean = false,
    impersonatorId?: string
  ): Promise<{
    accessToken: string;
    refreshToken: string;
    session: SessionData;
  }> {
    // Generate payload
    const payload: JwtPayload = {
      userId,
      schoolId,
      role: role as JwtPayload["role"],
      ...(impersonatorId ? { impersonatorId } : {}),
    };

    // Generate access token (short-lived)
    const accessToken = this.generateAccessToken(payload);

    // Generate and store refresh token with session info
    const refreshToken = await this.generateAndStoreRefreshToken(
      payload,
      deviceId,
      userAgent,
      ipAddress,
      remember
    );

    // Get the created session
    const session = await this.getSessionByRefreshToken(refreshToken);

    return {
      accessToken,
      refreshToken,
      session,
    };
  }

  /**
   * Refresh a session using a refresh token
   * Implements refresh token rotation with device tracking
   */
  async refreshSession(
    refreshToken: string,
    deviceId: string,
    userAgent: string,
    ipAddress: string
  ): Promise<{
    accessToken: string;
    refreshToken: string;
    session: SessionData;
    remember: boolean;
  }> {
    // 1. Verify the refresh token JWT
    let decoded: RefreshTokenPayload;
    try {
      decoded = jwt.verify(refreshToken, JWT_SECRET) as RefreshTokenPayload;
    } catch {
      throw new UnauthorizedError("Invalid or expired refresh token.");
    }

    // Reject access/reset/setup tokens presented as refresh tokens
    const purpose = (decoded as { tokenPurpose?: string }).tokenPurpose;
    if (purpose && purpose !== "refresh") {
      throw new UnauthorizedError("Invalid refresh token purpose.");
    }

    // 2. Find the stored refresh token hash
    const tokenHash = crypto.createHash("sha256").update(refreshToken).digest("hex");
    const storedToken = await prisma.refreshToken.findFirst({
      where: {
        tokenHash,
        userId: decoded.userId,
      },
    });

    if (!storedToken || storedToken.revokedAt) {
      throw new UnauthorizedError("Refresh token has been revoked or is invalid.");
    }

    if (storedToken.expiresAt < new Date()) {
      throw new UnauthorizedError("Refresh token has expired. Please sign in again.");
    }

    // 3. Check rotation window
    const daysSinceCreation = (Date.now() - storedToken.createdAt.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceCreation > JWT_ROTATION_DAYS) {
      // Token too old — revoke and force re-login
      await prisma.refreshToken.update({
        where: { id: storedToken.id },
        data: { revokedAt: new Date() },
      });
      throw new UnauthorizedError("Session expired. Please sign in again.");
    }

    // 4. Verify user still exists and is active
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, active: true, role: true, schoolId: true },
    });

    if (!user || !user.active) {
      throw new UnauthorizedError("Account not found or deactivated.");
    }

    // 5. Device mismatch is treated as suspicious: revoke this refresh token
    // and force re-login rather than rotating a possibly stolen cookie.
    if (storedToken.deviceId && storedToken.deviceId !== deviceId) {
      console.warn(`[Security] Device mismatch on token refresh for user ${user.id}:`, {
        storedDeviceId: storedToken.deviceId,
        providedDeviceId: deviceId,
      });
      await prisma.refreshToken.update({
        where: { id: storedToken.id },
        data: { revokedAt: new Date() },
      });
      throw new UnauthorizedError("Session security check failed. Please sign in again.");
    }

    // 6. Rotate: revoke old token, issue new pair
    await prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: {
        revokedAt: new Date(),
        lastActiveAt: new Date(),
      },
    });

    // Generate new tokens
    const newAccessToken = this.generateAccessToken({
      userId: user.id,
      schoolId: user.schoolId,
      role: user.role,
    });

    const remember = storedToken.expiresAt.getTime() - Date.now() > 24 * 60 * 60 * 1000; // If > 24h left, it was a "remember" token

    const newRefreshToken = await this.generateAndStoreRefreshToken(
      { userId: user.id, schoolId: user.schoolId, role: user.role },
      deviceId,
      userAgent,
      ipAddress,
      remember
    );

    // Get the new session
    const session = await this.getSessionByRefreshToken(newRefreshToken);

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      session,
      remember,
    };
  }

  /**
   * Revoke a specific session by session ID
   */
  async revokeSession(sessionId: string, userId: string): Promise<void> {
    const session = await prisma.refreshToken.findFirst({
      where: { id: sessionId, userId },
    });

    if (!session) {
      throw new NotFoundError("Session not found.");
    }

    await prisma.refreshToken.update({
      where: { id: sessionId },
      data: { revokedAt: new Date() },
    });
  }

  /**
   * Revoke all sessions for a user except the current one
   */
  async revokeAllSessions(userId: string, exceptSessionId?: string): Promise<number> {
    const where: any = {
      userId,
      revokedAt: null,
    };

    if (exceptSessionId) {
      where.NOT = { id: exceptSessionId };
    }

    const result = await prisma.refreshToken.updateMany({
      where,
      data: { revokedAt: new Date() },
    });

    return result.count;
  }

  /**
   * Get all active sessions for a user
   */
  async getActiveSessions(userId: string, currentSessionId?: string): Promise<SessionListResponse> {
    const sessions = await prisma.refreshToken.findMany({
      where: {
        userId,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { lastActiveAt: "desc" },
      select: {
        id: true,
        deviceId: true,
        userAgent: true,
        ipAddress: true,
        lastActiveAt: true,
        isCurrent: true,
        createdAt: true,
      },
    });

    return {
      sessions: sessions.map(s => ({
        id: s.id,
        deviceId: s.deviceId || "",
        userAgent: s.userAgent || "unknown",
        ipAddress: s.ipAddress || "unknown",
        lastActiveAt: s.lastActiveAt,
        isCurrent: s.isCurrent || s.id === currentSessionId,
        createdAt: s.createdAt,
      })),
      currentSessionId,
    };
  }

  /**
   * Update session last active timestamp
   */
  async updateSessionActivity(sessionId: string): Promise<void> {
    await prisma.refreshToken.update({
      where: { id: sessionId },
      data: { lastActiveAt: new Date() },
    });
  }

  /**
   * Mark a session as current
   */
  async setCurrentSession(sessionId: string, userId: string): Promise<void> {
    // First, unset all current flags for this user
    await prisma.refreshToken.updateMany({
      where: { userId, isCurrent: true },
      data: { isCurrent: false },
    });

    // Then set the new current session
    await prisma.refreshToken.update({
      where: { id: sessionId },
      data: { isCurrent: true },
    });
  }

  /**
   * Get session by refresh token (for internal use)
   */
  private async getSessionByRefreshToken(refreshToken: string): Promise<SessionData> {
    const tokenHash = crypto.createHash("sha256").update(refreshToken).digest("hex");
    const storedToken = await prisma.refreshToken.findUnique({
      where: { tokenHash },
    });

    if (!storedToken) {
      throw new NotFoundError("Session not found.");
    }

    return {
      id: storedToken.id,
      deviceId: storedToken.deviceId || "",
      userAgent: storedToken.userAgent || "unknown",
      ipAddress: storedToken.ipAddress || "unknown",
      lastActiveAt: storedToken.lastActiveAt,
      isCurrent: storedToken.isCurrent,
      createdAt: storedToken.createdAt,
    };
  }

  /**
   * Generate access token (short-lived, 15 minutes)
   */
  private generateAccessToken(payload: JwtPayload): string {
    return jwt.sign({ ...payload, tokenPurpose: "access" } as JwtPayload, JWT_SECRET, {
      expiresIn: JWT_ACCESS_EXPIRES_IN as any,
      jwtid: crypto.randomUUID(),
    });
  }

  /**
   * Generate refresh token and store in database with session info
   */
  private async generateAndStoreRefreshToken(
    payload: JwtPayload,
    deviceId: string,
    userAgent: string,
    ipAddress: string,
    remember: boolean
  ): Promise<string> {
    const refreshExpiry = remember ? "7d" : "24h";
    const dbExpiryDays = remember ? 7 : 1;

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + dbExpiryDays);

    const rawToken = jwt.sign(
      { ...payload, tokenVersion: Date.now(), tokenPurpose: "refresh" } as RefreshTokenPayload,
      JWT_SECRET,
      { expiresIn: refreshExpiry as any, jwtid: crypto.randomUUID() }
    );

    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

    await prisma.refreshToken.create({
      data: {
        userId: payload.userId,
        tokenHash,
        expiresAt,
        deviceId,
        userAgent,
        ipAddress,
        lastActiveAt: new Date(),
        isCurrent: true,
      },
    });

    return rawToken;
  }
}

export const sessionService = new SessionService();