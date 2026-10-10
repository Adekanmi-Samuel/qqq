import { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma";
import { sendError } from "../utils/response";
import { AuthenticatedRequest } from "../types";

/**
 * Suspicious login detection middleware
 * Checks if the login is from a new/unrecognized device or location
 */
export interface KnownDevice {
  id: string;
  deviceId: string;
  userAgent: string;
  ipAddress: string;
  lastActiveAt: Date;
  isTrusted: boolean;
}

declare global {
  namespace Express {
    interface Request {
      suspiciousLogin?: {
        isNewDevice: boolean;
        isNewLocation: boolean;
        knownDevices: KnownDevice[];
      };
    }
  }
}

/**
 * Check if a device is known for the user
 */
async function isKnownDevice(userId: string, deviceId: string): Promise<{ isKnown: boolean; device?: KnownDevice }> {
  // Check if we have a refresh token/session with this deviceId
  const session = await prisma.refreshToken.findFirst({
    where: {
      userId,
      deviceId,
      revokedAt: null,
    },
    orderBy: { lastActiveAt: 'desc' },
    select: {
      id: true,
      deviceId: true,
      userAgent: true,
      ipAddress: true,
      lastActiveAt: true,
      isCurrent: true,
    },
  });

  if (session) {
    return {
      isKnown: true,
      device: {
        id: session.id,
        deviceId: session.deviceId || '',
        userAgent: session.userAgent || 'unknown',
        ipAddress: session.ipAddress || 'unknown',
        lastActiveAt: session.lastActiveAt || new Date(),
        isTrusted: true,
      },
    };
  }

  return { isKnown: false };
}

/**
 * Get all known devices for a user
 */
async function getKnownDevices(userId: string): Promise<KnownDevice[]> {
  const sessions = await prisma.refreshToken.findMany({
    where: {
      userId,
      revokedAt: null,
    },
    orderBy: { lastActiveAt: 'desc' },
    select: {
      id: true,
      deviceId: true,
      userAgent: true,
      ipAddress: true,
      lastActiveAt: true,
      isCurrent: true,
    },
  });

  return sessions.map(s => ({
    id: s.id,
    deviceId: s.deviceId || '',
    userAgent: s.userAgent || 'unknown',
    ipAddress: s.ipAddress || 'unknown',
    lastActiveAt: s.lastActiveAt || new Date(),
    isTrusted: true,
  }));
}

/**
 * Check if IP address is from a new location
 * Simple implementation - in production, use a geoip service
 */
async function isNewLocation(userId: string, ipAddress: string): Promise<boolean> {
  // Get all known IPs for this user
  const knownIps = await prisma.refreshToken.findMany({
    where: {
      userId,
      revokedAt: null,
      ipAddress: { not: null },
    },
    select: { ipAddress: true },
    distinct: ['ipAddress'],
  });

  const knownIpSet = new Set(knownIps.map(s => s.ipAddress));
  return !knownIpSet.has(ipAddress);
}

/**
 * Suspicious login detection middleware
 * Runs after authentication but before sensitive operations
 */
export async function suspiciousLoginDetection(req: AuthenticatedRequest, _res: Response, next: NextFunction): Promise<void> {
  try {
    // Skip if not authenticated or no user
    if (!req.user?.userId || !req.deviceId) {
      return next();
    }

    const userId = req.user.userId;
    const deviceId = req.deviceId;
    const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';

    // Check if device is known
    const { isKnown, device } = await isKnownDevice(userId, deviceId);

    // Check if location is new
    const isNewLocationResult = await isNewLocation(userId, ipAddress);

    // Get all known devices for context
    const knownDevices = await getKnownDevices(userId);

    // Attach suspicious login info to request
    req.suspiciousLogin = {
      isNewDevice: !isKnown,
      isNewLocation: isNewLocationResult,
      knownDevices,
    };

    // Log security event if new device or location
    if (!isKnown || isNewLocationResult) {
      console.warn(`[Security] Suspicious login detected for user ${userId}:`, {
        isNewDevice: !isKnown,
        isNewLocation: isNewLocationResult,
        deviceId,
        ipAddress,
        userAgent: req.headers['user-agent'],
      });

      // In production, send email notification to user
      // await sendSecurityAlertEmail(userId, { isNewDevice: !isKnown, isNewLocation: isNewLocationResult });
    }

    next();
  } catch (error) {
    console.error('[SuspiciousLogin] Error checking suspicious login:', error);
    // Don't block the request on error - log and continue
    next();
  }
}

/**
 * Middleware to require confirmation for suspicious logins
 * Use for sensitive operations (password change, email change, etc.)
 */
export function requireSuspiciousLoginConfirmation(req: Request, res: Response, next: NextFunction): void {
  if (!req.suspiciousLogin) {
    return next();
  }

  const { isNewDevice, isNewLocation } = req.suspiciousLogin;

  if (isNewDevice || isNewLocation) {
    // Check if confirmation was provided
    const confirmation = req.body?.suspiciousLoginConfirmation;
    if (!confirmation) {
      sendError(res, 403, "SUSPICIOUS_LOGIN_CONFIRMATION_REQUIRED", "This action requires confirmation due to a suspicious login. Please check your email for a verification code.");
      return;
    }
  }

  next();
}