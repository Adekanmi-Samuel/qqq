import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { prisma } from "../lib/prisma";
import { BadRequestError, ConflictError, NotFoundError, UnauthorizedError } from "../utils/errors";
import { generateSlug } from "../utils/slug";
import { JwtPayload, RefreshTokenPayload } from "../types";
import { config } from "../config/env";
import { getCookieOptions } from "../config/cookies";
import { sessionService } from "./session.service";
import { Response } from "express";

const JWT_SECRET = config.JWT_SECRET;
const JWT_ACCESS_EXPIRES_IN = config.JWT_ACCESS_EXPIRES_IN;
const JWT_REFRESH_EXPIRES_IN = config.JWT_REFRESH_EXPIRES_IN;
const JWT_ROTATION_DAYS = config.JWT_ROTATION_DAYS;

// Warn at startup if JWT_SECRET is weak (env.ts already enforces >= 32, defense in depth)
if (JWT_SECRET.length < 32) {
  console.warn("[Auth] WARNING: JWT_SECRET is shorter than 32 characters. This is a security risk.");
}

export class AuthService {
  /**
   * Register a new school and create the admin user account.
   * Sets cookies instead of returning tokens in body.
   */
  async register(
    data: {
      email: string;
      password: string;
      schoolName: string;
      phone: string;
      schoolType: string;
      ownershipType: string;
      state: string;
      lga: string;
      address: string;
      cacNumber?: string;
      remember?: boolean;
    },
    res: Response,
    deviceId: string,
    userAgent: string,
    ipAddress: string
  ) {
    // Check if email is already in use
    const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
    if (existingUser) {
      throw new ConflictError("An account with this email already exists. Please sign in instead.");
    }

    // Check if school name is already taken
    const slug = generateSlug(data.schoolName);
    const existingSchool = await prisma.school.findUnique({ where: { slug } });
    if (existingSchool) {
      throw new ConflictError("A school with this name is already registered. Please contact support if this is your school.");
    }

    // Hash password
    const passwordHash = await bcrypt.hash(data.password, 12);

    // Create school and admin user in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const school = await tx.school.create({
        data: {
          name: data.schoolName,
          slug,
          cacNumber: data.cacNumber || null,
          schoolType: data.schoolType as any,
          ownershipType: data.ownershipType as any,
          state: data.state,
          lga: data.lga,
          address: data.address,
          email: data.email,
          phone: data.phone,
        },
      });

      const user = await tx.user.create({
        data: {
          schoolId: school.id,
          fullName: "School Admin",
          email: data.email,
          passwordHash,
          role: "SCHOOL_ADMIN",
        },
        select: {
          id: true,
          fullName: true,
          email: true,
          role: true,
          schoolId: true,
        },
      });

      return { school, user };
    });

    // Create session and set cookies
    const { accessToken, refreshToken, session } = await sessionService.createSession(
      result.user.id,
      result.school.id,
      result.user.role,
      deviceId,
      userAgent,
      ipAddress,
      data.remember ?? false
    );

    // Set cookies
    this.setAuthCookies(res, accessToken, refreshToken, data.remember ?? false);

    // Return user data only (no tokens in body)
    return {
      user: result.user,
      school: {
        id: result.school.id,
        name: result.school.name,
        slug: result.school.slug,
        verified: result.school.verified,
        logoUrl: result.school.logoUrl,
        motto: result.school.motto,
      },
      session,
    };
  }

  /**
   * Authenticate a user with email and password.
   * Sets cookies instead of returning tokens in body.
   */
  async login(
    email: string,
    password: string,
    remember: boolean,
    res: Response,
    deviceId: string,
    userAgent: string,
    ipAddress: string
  ) {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { school: { select: { id: true, name: true, slug: true, verified: true, logoUrl: true, motto: true } } },
    });

    // Generic message for unknown email and bad password — prevents user enumeration.
    // Detailed reasons stay in server logs only.
    if (!user) {
      console.warn(`[Auth] Login failed: no account for email=${email} ip=${ipAddress}`);
      throw new UnauthorizedError("Invalid email or password.");
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      console.warn(`[Auth] Login failed: bad password for email=${email} ip=${ipAddress}`);
      throw new UnauthorizedError("Invalid email or password.");
    }

    // Deactivated accounts are only revealed after a valid password (legitimate owner).
    if (!user.active) {
      console.warn(`[Auth] Login blocked: deactivated account email=${email} ip=${ipAddress}`);
      throw new UnauthorizedError("This account has been deactivated. Contact your school admin.");
    }

    // Create session and set cookies
    const { accessToken, refreshToken, session } = await sessionService.createSession(
      user.id,
      user.schoolId,
      user.role,
      deviceId,
      userAgent,
      ipAddress,
      remember
    );

    // Set cookies
    this.setAuthCookies(res, accessToken, refreshToken, remember);

    // Return user data only (no tokens in body)
    return {
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        passwordResetRequired: user.passwordResetRequired,
      },
      school: user.school,
      session,
    };
  }

  /**
   * Set a new password for the authenticated user (used when passwordResetRequired is true).
   * Clears the passwordResetRequired flag after success.
   */
  async setPassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundError("User");

    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) throw new UnauthorizedError("Current password is incorrect.");

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash, passwordResetRequired: false },
    });

    // Revoke all refresh tokens on password change (force re-login on other devices)
    await sessionService.revokeAllSessions(userId);

    return { success: true, message: "Password updated successfully." };
  }

  /**
   * Register staff using an invite code (no existing account needed).
   * Sets cookies instead of returning tokens in body.
   */
  async registerWithInvite(
    data: {
      inviteCode: string;
      fullName: string;
      email: string;
      password: string;
      admissionNumber?: string;
      phone?: string;
      role?: string;
    },
    res: Response,
    deviceId: string,
    userAgent: string,
    ipAddress: string
  ) {
    // 1. Find and validate the invite
    const invite = await prisma.schoolInvite.findUnique({
      where: { code: data.inviteCode },
    });

    if (!invite) {
      throw new NotFoundError("Invalid invite code.");
    }
    if (invite.used) {
      throw new BadRequestError("This invite code has already been used.");
    }
    if (invite.expiresAt && invite.expiresAt < new Date()) {
      throw new BadRequestError("This invite code has expired.");
    }

    const validRoles = ["TEACHER", "BURSAR", "PRINCIPAL", "STUDENT", "PARENT"];
    // Role always comes from the invite, never from the client body.
    if (!validRoles.includes(invite.role)) {
      throw new BadRequestError("Invalid invite role.");
    }

    // 2. Check email not already taken
    const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
    if (existingUser) {
      throw new ConflictError("An account with this email already exists.");
    }

    // 3. Hash password
    const passwordHash = await bcrypt.hash(data.password, 12);

    // 4. Create user and mark the invite as used (in a transaction).
    // The invitee chose their own password during signup, so no forced reset
    // is required. Forcing one locked teachers out of every API on first login.
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          schoolId: invite.schoolId,
          fullName: data.fullName,
          email: data.email,
          passwordHash,
          // Role is fixed by the invite; client-supplied role cannot elevate
          role: invite.role as any,
          passwordResetRequired: false,
        },
        select: {
          id: true,
          fullName: true,
          email: true,
          role: true,
          schoolId: true,
        },
      });

      await tx.schoolInvite.update({
        where: { id: invite.id },
        data: { used: true, usedAt: new Date(), usedBy: user.id },
      });

      return user;
    });

    // 4b. Auto-link STUDENT user to existing Student record
    if (invite.role === "STUDENT") {
      const students = await prisma.student.findMany({
        where: {
          schoolId: invite.schoolId,
          OR: [
            { parentEmail: data.email },
            { fullName: data.fullName },
          ],
        },
        include: { user: true },
      });
      const student = students.find(s => !s.user);
      if (student) {
        await prisma.user.update({
          where: { id: result.id },
          data: { studentId: student.id },
        });
      }
    }

    // 4c. Auto-link PARENT user to student via admissionNumber
    if (invite.role === "PARENT" && data.admissionNumber) {
      const student = await prisma.student.findFirst({
        where: {
          schoolId: invite.schoolId,
          admissionNumber: data.admissionNumber,
        },
      });
      if (student) {
        await prisma.parentStudentLink.create({
          data: { parentId: result.id, studentId: student.id },
        });
      }
    }

    // 5. Generate short-lived token for password setup email
    const setupToken = this.generateToken(
      {
        userId: result.id,
        schoolId: result.schoolId!,
        role: result.role as JwtPayload["role"],
      },
      "setup"
    );

    // 6. Create session and set cookies
    const { accessToken, refreshToken, session } = await sessionService.createSession(
      result.id,
      result.schoolId!,
      result.role,
      deviceId,
      userAgent,
      ipAddress,
      false // Don't remember for invite registration (they'll set password)
    );

    // Set cookies
    this.setAuthCookies(res, accessToken, refreshToken, false);

    // 7. Fetch school data
    const school = await prisma.school.findUnique({
      where: { id: result.schoolId! },
      select: { id: true, name: true, slug: true, verified: true, logoUrl: true, motto: true },
    });

    // 8. Send setup link email (fire-and-forget)
    try {
      const { sendSetupLink } = await import("./emailService");
      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
      const setupUrl = `${frontendUrl}/set-password?token=${setupToken}`;
      await sendSetupLink({
        email: data.email,
        fullName: data.fullName,
        role: result.role,
        schoolName: school?.name || "SchoolPilot",
        setupUrl,
      });
    } catch (emailErr) {
      console.error("[Auth] Failed to send setup email:", emailErr);
    }

    // Return user data only (no tokens in body)
    return {
      user: result,
      school,
      session,
    };
  }

  /**
   * Forgot password — generate a password reset token.
   */
  async forgotPassword(email: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Don't reveal whether email exists
      return { success: true, message: "If that email exists, a reset link has been sent." };
    }

    const token = this.generateToken(
      {
        userId: user.id,
        schoolId: user.schoolId,
        role: user.role,
      },
      "reset"
    );
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    const resetUrl = `${frontendUrl}/reset-password?token=${token}`;

    try {
      // Email only. Never publish reset URLs to third-party notification channels.
      const { sendPasswordReset } = await import("./emailService");
      await sendPasswordReset({ email: user.email, fullName: user.fullName, resetUrl });
    } catch (emailErr) {
      console.error("[Auth] Failed to send reset email:", emailErr);
    }

    return { success: true, message: "If that email exists, a reset link has been sent." };
  }

  /**
   * Reset password using a valid JWT token.
   */
  async resetPassword(token: string, newPassword: string) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
      // Only password-reset tokens may change the password.
      if (decoded.tokenPurpose !== "reset") {
        throw new Error("Invalid token purpose");
      }
      const passwordHash = await bcrypt.hash(newPassword, 12);
      await prisma.user.update({
        where: { id: decoded.userId },
        data: { passwordHash, passwordResetRequired: false },
      });
      // Revoke all refresh tokens on password reset (force re-login on all devices)
      await sessionService.revokeAllSessions(decoded.userId);
      return { success: true, message: "Password reset successfully." };
    } catch {
      throw new UnauthorizedError("Invalid or expired reset token.");
    }
  }

  /**
   * Refresh access token using a valid refresh token from cookie.
   * Implements refresh token rotation: the old refresh token is revoked
   * and a new pair (access + refresh) is issued.
   * Sets new cookies.
   */
  async refreshToken(
    refreshToken: string,
    res: Response,
    deviceId: string,
    userAgent: string,
    ipAddress: string
  ) {
    try {
      const {
        accessToken,
        refreshToken: newRefreshToken,
        session,
        remember,
      } = await sessionService.refreshSession(
        refreshToken,
        deviceId,
        userAgent,
        ipAddress
      );

      // Set new cookies using server-derived remember (not client body)
      this.setAuthCookies(res, accessToken, newRefreshToken, remember);

      return { session };
    } catch (error) {
      // Clear cookies on refresh failure
      this.clearAuthCookies(res);
      throw error;
    }
  }

  /**
   * Logout - revoke session and clear cookies
   */
  async logout(
    refreshToken: string | undefined,
    res: Response,
    userId?: string
  ) {
    // Revoke specific session if token provided
    if (refreshToken) {
      try {
        const decoded = jwt.verify(refreshToken, JWT_SECRET) as RefreshTokenPayload;
        const tokenHash = crypto.createHash("sha256").update(refreshToken).digest("hex");

        await prisma.refreshToken.updateMany({
          where: {
            tokenHash,
            userId: decoded.userId,
            revokedAt: null,
          },
          data: { revokedAt: new Date() },
        });
      } catch {
        // Token already invalid — no-op
      }
    }

    // Clear cookies
    this.clearAuthCookies(res);

    return { success: true, message: "Logged out successfully." };
  }

  /**
   * Sync Supabase OAuth user with backend
   * Requires a verified Supabase access token. Email is taken from verified
   * claims only — never from the client request body.
   */
  async supabaseSync(
    data: {
      accessToken: string;
    },
    res: Response,
    deviceId: string,
    userAgent: string,
    ipAddress: string
  ) {
    const { verifySupabaseToken } = await import("./supabaseAuth.service");
    const claims = await verifySupabaseToken(data.accessToken);
    if (!claims.email) {
      throw new UnauthorizedError("Invalid Supabase token.");
    }

    const { syncSupabaseUser } = await import("./supabaseAuth.service");

    const result = await syncSupabaseUser({
      supabaseUserId: claims.sub,
      email: claims.email,
      fullName: claims.user_metadata?.full_name || "",
      avatarUrl: claims.user_metadata?.avatar_url,
    });

    // Create session and set cookies
    const { accessToken, refreshToken, session } = await sessionService.createSession(
      result.user.id,
      result.school?.id || null,
      result.user.role,
      deviceId,
      userAgent,
      ipAddress,
      false
    );

    this.setAuthCookies(res, accessToken, refreshToken, false);

    return {
      user: result.user,
      school: result.school,
      session,
    };
  }

  /**
   * Get active sessions for a user
   */
  async getSessions(userId: string, currentSessionId?: string) {
    return sessionService.getActiveSessions(userId, currentSessionId);
  }

  /**
   * Revoke a specific session
   */
  async revokeSession(sessionId: string, userId: string) {
    return sessionService.revokeSession(sessionId, userId);
  }

  /**
   * Revoke all sessions except current
   */
  async revokeAllSessions(userId: string, exceptSessionId?: string) {
    return sessionService.revokeAllSessions(userId, exceptSessionId);
  }

  /**
   * Set authentication cookies on response
   * Public so onboarding (and other non-auth controllers) can reuse the same cookie path.
   */
  /**
   * Attach an already signed-in account to a school using an invite code.
   * Used by Google/OAuth signups, which start with no school and therefore
   * cannot reach any dashboard. The role comes from the invite, never the client.
   */
  async joinSchool(
    data: {
      userId: string;
      inviteCode: string;
      admissionNumber?: string;
    },
    res: Response,
    deviceId: string,
    userAgent: string,
    ipAddress: string
  ) {
    const user = await prisma.user.findUnique({
      where: { id: data.userId },
      select: { id: true, email: true, fullName: true, schoolId: true, role: true, active: true },
    });

    if (!user) {
      throw new UnauthorizedError("Account not found.");
    }
    if (!user.active) {
      throw new UnauthorizedError("This account has been deactivated. Contact your school admin.");
    }
    if (user.schoolId) {
      throw new ConflictError("Your account is already linked to a school.");
    }

    const invite = await prisma.schoolInvite.findUnique({
      where: { code: data.inviteCode },
      include: { school: { select: { id: true, name: true, slug: true, verified: true, logoUrl: true } } },
    });

    if (!invite) {
      throw new NotFoundError("Invalid invite code. Please check and try again.");
    }
    if (invite.used) {
      throw new BadRequestError("This invite code has already been used.");
    }
    if (invite.expiresAt && invite.expiresAt < new Date()) {
      throw new BadRequestError("This invite code has expired.");
    }

    const validRoles = ["TEACHER", "BURSAR", "PRINCIPAL", "STUDENT", "PARENT"];
    if (!validRoles.includes(invite.role)) {
      throw new BadRequestError("This invite code is not valid for joining a school.");
    }

    // Claim the invite and link the account in one transaction.
    // The conditional update guards against two people racing the same code.
    const claimed = await prisma.$transaction(async (tx) => {
      const claim = await tx.schoolInvite.updateMany({
        where: { id: invite.id, used: false },
        data: { used: true, usedAt: new Date(), usedBy: user.id },
      });
      if (claim.count === 0) {
        throw new BadRequestError("This invite code has already been used.");
      }

      return tx.user.update({
        where: { id: user.id },
        data: {
          schoolId: invite.schoolId,
          role: invite.role as any,
          passwordResetRequired: false,
        },
        select: { id: true, fullName: true, email: true, role: true, schoolId: true },
      });
    });

    // Link to existing Student record where the invite says so.
    if (invite.role === "STUDENT") {
      const students = await prisma.student.findMany({
        where: {
          schoolId: invite.schoolId,
          OR: [{ parentEmail: user.email }, { fullName: user.fullName }],
        },
        include: { user: true },
      });
      const student = students.find((s) => !s.user);
      if (student) {
        await prisma.user.update({ where: { id: user.id }, data: { studentId: student.id } });
      }
    }

    if (invite.role === "PARENT" && data.admissionNumber) {
      const student = await prisma.student.findFirst({
        where: { schoolId: invite.schoolId, admissionNumber: data.admissionNumber },
      });
      if (student) {
        await prisma.parentStudentLink.create({
          data: { parentId: user.id, studentId: student.id },
        });
      }
    }

    // The role change must be reflected in a fresh session, so reissue cookies.
    const { accessToken, refreshToken } = await sessionService.createSession(
      claimed.id,
      invite.schoolId,
      claimed.role,
      deviceId,
      userAgent,
      ipAddress,
      false
    );
    this.setAuthCookies(res, accessToken, refreshToken, false);

    return {
      user: {
        id: claimed.id,
        fullName: claimed.fullName,
        email: claimed.email,
        role: claimed.role,
      },
      school: invite.school,
    };
  }

  setAuthCookies(
    res: Response,
    accessToken: string,
    refreshToken: string,
    remember: boolean
  ): void {
    // Access token cookie (15 minutes)
    res.cookie("sh_access", accessToken, getCookieOptions(false, remember));

    // Refresh token cookie (24h or 7d based on remember)
    res.cookie("sh_refresh", refreshToken, getCookieOptions(true, remember));

    // CSRF token cookie aligned with refresh lifetime (non-HttpOnly for double-submit pattern)
    const csrfToken = crypto.randomUUID();
    res.cookie("sh_csrf", csrfToken, {
      httpOnly: false,
      secure: true,
      sameSite: "lax",
      maxAge: (remember ? 7 * 24 * 60 * 60 : 24 * 60 * 60) * 1000,
      path: "/",
    });
  }

  /**
   * Clear authentication cookies
   */
  private clearAuthCookies(res: Response): void {
    const sameSite = "lax" as const;

    res.clearCookie("sh_access", {
      httpOnly: true,
      secure: true,
      sameSite,
      path: "/",
    });

    res.clearCookie("sh_refresh", {
      httpOnly: true,
      secure: true,
      sameSite,
      path: "/api/auth/refresh",
    });

    res.clearCookie("sh_csrf", {
      httpOnly: false,
      secure: true,
      sameSite,
      path: "/",
    });
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
   * Short-lived token generation (for password reset, setup links — expires in 1 hour).
   * tokenPurpose is required so authenticate() can reject non-access tokens.
   */
  private generateToken(payload: JwtPayload, purpose: "reset" | "setup"): string {
    return jwt.sign({ ...payload, tokenPurpose: purpose } as JwtPayload, JWT_SECRET, {
      expiresIn: "1h" as any,
      jwtid: crypto.randomUUID(),
    });
  }
}

export const authService = new AuthService();