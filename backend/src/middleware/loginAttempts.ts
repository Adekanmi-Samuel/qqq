import { Request, Response, NextFunction } from "express";
import { sendError } from "../utils/response";

/**
 * Login attempt tracking middleware
 * Tracks failed login attempts per IP and per email
 * Implements lockout after threshold
 *
 * SECURITY NOTE: state is process-local (in-memory Map). For multi-instance
 * or serverless deployments, move lockout state to Redis/Upstash keyed by
 * IP + email before production traffic.
 */

interface AttemptRecord {
  count: number;
  firstAttempt: number;
  lockedUntil: number;
}

interface AttemptsMap {
  [key: string]: AttemptRecord;
}

// In-memory storage (use Redis in production / multi-instance)
const ipAttempts: AttemptsMap = {};
const emailAttempts: AttemptsMap = {};

// Configuration
const MAX_ATTEMPTS = 5;
const IP_LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes
const EMAIL_LOCKOUT_DURATION = 30 * 60 * 1000; // 30 minutes
const WINDOW_DURATION = 15 * 60 * 1000; // 15 minute window for attempt counting

/**
 * Clean up expired entries periodically
 */
setInterval(() => {
  const now = Date.now();
  Object.keys(ipAttempts).forEach(key => {
    if (ipAttempts[key].lockedUntil < now && ipAttempts[key].firstAttempt + WINDOW_DURATION < now) {
      delete ipAttempts[key];
    }
  });
  Object.keys(emailAttempts).forEach(key => {
    if (emailAttempts[key].lockedUntil < now && emailAttempts[key].firstAttempt + WINDOW_DURATION < now) {
      delete emailAttempts[key];
    }
  });
}, 5 * 60 * 1000); // Clean every 5 minutes

/**
 * Check if an attempt record is locked
 */
function isLocked(record: AttemptRecord): boolean {
  return record.lockedUntil > Date.now();
}

/**
 * Get remaining lockout time in seconds
 */
function getLockoutRemaining(record: AttemptRecord): number {
  return Math.ceil((record.lockedUntil - Date.now()) / 1000);
}

/**
 * Record a failed login attempt
 */
function recordAttempt(attempts: AttemptsMap, key: string, lockoutDuration: number): AttemptRecord {
  const now = Date.now();
  const existing = attempts[key];

  if (!existing || now - existing.firstAttempt > WINDOW_DURATION) {
    // New window
    const record: AttemptRecord = {
      count: 1,
      firstAttempt: now,
      lockedUntil: 0,
    };
    attempts[key] = record;
    return record;
  }

  // Increment existing
  existing.count += 1;
  if (existing.count >= MAX_ATTEMPTS) {
    existing.lockedUntil = now + lockoutDuration;
  }
  return existing;
}

/**
 * Record a successful login (clear attempts)
 */
function recordSuccess(attempts: AttemptsMap, key: string): void {
  delete attempts[key];
}

/**
 * Get current attempt status
 */
function getAttemptStatus(attempts: AttemptsMap, key: string): { count: number; locked: boolean; remainingSeconds: number } | null {
  const record = attempts[key];
  if (!record) return null;

  if (isLocked(record)) {
    return {
      count: record.count,
      locked: true,
      remainingSeconds: getLockoutRemaining(record),
    };
  }

  // Check if window expired
  if (Date.now() - record.firstAttempt > WINDOW_DURATION) {
    return null;
  }

  return {
    count: record.count,
    locked: false,
    remainingSeconds: 0,
  };
}

/**
 * Login attempt tracking middleware
 * Checks for lockouts before processing login
 * Uses both IP and email keys (lockout applies if either is locked)
 */
export function loginAttemptTracking(req: Request, res: Response, next: NextFunction): void {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const email = (req.body?.email || '').toLowerCase();

  // Check IP lockout
  const ipStatus = getAttemptStatus(ipAttempts, ip);
  if (ipStatus?.locked) {
    sendError(res, 429, "LOGIN_LOCKED_IP", `Too many failed attempts from this IP. Try again in ${ipStatus.remainingSeconds} seconds.`);
    return;
  }

  // Check email lockout
  if (email) {
    const emailStatus = getAttemptStatus(emailAttempts, email);
    if (emailStatus?.locked) {
      sendError(res, 429, "LOGIN_LOCKED_EMAIL", `Too many failed attempts for this email. Try again in ${emailStatus.remainingSeconds} seconds.`);
      return;
    }
  }

  // Attach tracking functions to request for use in auth controller
  req.loginAttempts = {
    recordFailure: () => {
      recordAttempt(ipAttempts, ip, IP_LOCKOUT_DURATION);
      if (email) recordAttempt(emailAttempts, email, EMAIL_LOCKOUT_DURATION);
    },
    recordSuccess: () => {
      recordSuccess(ipAttempts, ip);
      if (email) recordSuccess(emailAttempts, email);
    },
    getIpStatus: () => getAttemptStatus(ipAttempts, ip),
    getEmailStatus: () => email ? getAttemptStatus(emailAttempts, email) : null,
  };

  next();
}

/**
 * Export for testing or manual reset
 */
export const loginAttemptsStorage = {
  ipAttempts,
  emailAttempts,
  clear: (ip?: string, email?: string) => {
    if (ip) delete ipAttempts[ip];
    if (email) delete emailAttempts[email.toLowerCase()];
    if (!ip && !email) {
      Object.keys(ipAttempts).forEach(k => delete ipAttempts[k]);
      Object.keys(emailAttempts).forEach(k => delete emailAttempts[k]);
    }
  },
};

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      loginAttempts?: {
        recordFailure: () => void;
        recordSuccess: () => void;
        getIpStatus: () => { count: number; locked: boolean; remainingSeconds: number } | null;
        getEmailStatus: () => { count: number; locked: boolean; remainingSeconds: number } | null;
      };
    }
  }
}
