import { Request, Response, NextFunction } from "express";
import crypto from "crypto";

/**
 * Device fingerprinting middleware
 * Extracts device characteristics from request headers and creates a device ID
 */
export interface DeviceFingerprint {
  deviceId: string;
  userAgent: string;
  acceptLanguage: string;
  acceptEncoding: string;
  screenResolution?: string;
  timezone?: string;
  platform?: string;
}

declare global {
  namespace Express {
    interface Request {
      deviceId?: string;
      deviceFingerprint?: DeviceFingerprint;
    }
  }
}

/**
 * Generate a device fingerprint hash from request characteristics
 * Uses multiple browser/client attributes for better accuracy
 */
function generateDeviceFingerprint(req: Request): DeviceFingerprint {
  // Extract headers
  const userAgent = req.headers['user-agent'] || 'unknown';
  const acceptLanguage = req.headers['accept-language'] || 'unknown';
  const acceptEncoding = req.headers['accept-encoding'] || 'unknown';

  // Extract custom headers from frontend (set by device fingerprinting script)
  const screenResolution = req.headers['x-screen-resolution'] as string | undefined;
  const timezone = req.headers['x-timezone'] as string | undefined;
  const platform = req.headers['x-platform'] as string | undefined;

  // Create fingerprint string from all attributes
  const fingerprintData = [
    userAgent,
    acceptLanguage,
    acceptEncoding,
    screenResolution || '',
    timezone || '',
    platform || '',
  ].join('|');

  // Hash to create device ID (SHA-256, truncated for readability)
  const hash = crypto.createHash('sha256').update(fingerprintData).digest('hex');
  const deviceId = hash.substring(0, 32);

  return {
    deviceId,
    userAgent,
    acceptLanguage,
    acceptEncoding,
    screenResolution,
    timezone,
    platform,
  };
}

/**
 * Device tracking middleware
 * Attaches deviceId and deviceFingerprint to request
 */
export function deviceTracking(req: Request, _res: Response, next: NextFunction): void {
  try {
    const fingerprint = generateDeviceFingerprint(req);
    req.deviceId = fingerprint.deviceId;
    req.deviceFingerprint = fingerprint;
    next();
  } catch (error) {
    console.error('[DeviceTracking] Error generating device fingerprint:', error);
    // Fallback to a basic ID
    req.deviceId = crypto.randomUUID().substring(0, 32);
    next();
  }
}

/**
 * Extract device info from request for logging/storage
 */
export function extractDeviceInfo(req: Request): {
  deviceId: string;
  userAgent: string;
  ipAddress: string;
} {
  return {
    deviceId: req.deviceId || 'unknown',
    userAgent: req.headers['user-agent'] || 'unknown',
    ipAddress: req.ip || req.socket.remoteAddress || 'unknown',
  };
}