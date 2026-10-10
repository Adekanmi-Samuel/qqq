/**
 * Rate Limiter Middleware
 *
 * Per-operation rate limiting using an in-memory Map store.
 * Returns 429 with Retry-After header when limit is exceeded.
 *
 * Security notes:
 *   - Password reset is capped per email AND per IP (limits DoS against a victim
 *     email and IP rotation to hammer accounts).
 *   - Login is capped per IP AND per email (limits credential stuffing and
 *     enumeration from a single IP).
 *   - State is still process-local. For multi-instance / serverless (Vercel)
 *     deployments, migrate the store to Redis/Upstash before production traffic.
 *
 * Limits:
 *   - Login: 5 attempts / 15min per IP AND per email
 *   - Register: 3 / hour per IP
 *   - Password reset: 3 / hour per email AND per IP
 *   - OTP: 5 / hour per phone
 *   - API read: 100 / min per user
 *   - API write: 30 / min per user
 *   - AI endpoints: 20 / 15min per user
 */

import { Request, Response, NextFunction } from "express";

interface RateLimitEntry {
  count: number;
  resetAt: number; // timestamp in ms
}

interface RateLimitConfig {
  windowMs: number;   // time window in milliseconds
  max: number;        // max requests per window
  keyPrefix: string;  // prefix for the rate limit key
  message?: string;   // custom error message
  /**
   * When set, rate limits are enforced on each listed key dimension
   * (e.g. ["ip", "email"]). The request is rejected if ANY dimension
   * exceeds its max. Omit for a single default identifier.
   */
  dimensions?: Array<"ip" | "email" | "phone" | "user">;
}

// In-memory store — Map<key, RateLimitEntry>
const store = new Map<string, RateLimitEntry>();

// Periodic cleanup of expired entries (every 5 minutes)
const CLEANUP_INTERVAL = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanupExpiredEntries(): void {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;

  for (const [key, entry] of store.entries()) {
    if (entry.resetAt <= now) {
      store.delete(key);
    }
  }
}

/**
 * Extract a single dimension value for rate limiting based on context.
 */
function getDimensionValue(req: Request, dimension: "ip" | "email" | "phone" | "user"): string | null {
  // For user-scoped limits, try to use user ID from JWT
  if (dimension === "user") {
    const userId = (req as any).user?.userId;
    return userId || null;
  }

  // For email-based limits, try to use email from body
  if (dimension === "email" && req.body?.email) {
    return String(req.body.email).toLowerCase();
  }

  // For phone-based limits (OTP), try to use phone from body
  if (dimension === "phone" && req.body?.phone) {
    return String(req.body.phone);
  }

  // Default: use IP address
  if (dimension === "ip") {
    return req.ip || req.socket.remoteAddress || "unknown";
  }

  return null;
}

/**
 * Creates a rate limiter middleware with the given config.
 * When config.dimensions is provided, every listed dimension is checked
 * and incremented; exceeding any one of them returns 429.
 */
function createRateLimiter(config: RateLimitConfig) {
  return (req: Request, res: Response, next: NextFunction): void => {
    cleanupExpiredEntries();

    const now = Date.now();
    const dimensions =
      config.dimensions && config.dimensions.length > 0
        ? config.dimensions
        : null;

    // Build keys for each dimension that has a resolvable identifier
    const keys: string[] = [];
    if (dimensions) {
      for (const dim of dimensions) {
        const value = getDimensionValue(req, dim);
        // Skip dimensions we cannot identify (e.g. login without email body yet)
        if (!value) continue;
        keys.push(`${config.keyPrefix}:${dim}:${value}`);
      }
    } else {
      const identifier =
        getDimensionValue(req, "user") ||
        getDimensionValue(req, "ip") ||
        "unknown";
      keys.push(`${config.keyPrefix}:${identifier}`);
    }

    // If we have no keys, allow the request (nothing to enforce against)
    if (keys.length === 0) {
      next();
      return;
    }

    // Check all keys first — reject if any is already over limit
    for (const key of keys) {
      const entry = store.get(key);
      if (entry && entry.resetAt > now && entry.count >= config.max) {
        const retryAfterSeconds = Math.ceil((entry.resetAt - now) / 1000);
        res.setHeader("Retry-After", retryAfterSeconds.toString());
        setRateLimitHeaders(res, entry.count, config.max, entry.resetAt);
        res.status(429).json({
          success: false,
          error: {
            code: "RATE_LIMITED",
            message: config.message || "Too many requests. Please try again later.",
            retryAfter: retryAfterSeconds,
          },
        });
        return;
      }
    }

    // Increment all keys within the current window
    for (const key of keys) {
      let entry = store.get(key);

      if (!entry || entry.resetAt <= now) {
        entry = { count: 1, resetAt: now + config.windowMs };
        store.set(key, entry);
      } else {
        entry.count++;
        if (entry.count > config.max) {
          entry.count = config.max; // cap display value
        }
      }

      if (key === keys[0]) {
        setRateLimitHeaders(res, entry.count, config.max, entry.resetAt);
      }
    }

    next();
  };
}

/**
 * Extract the identifier for rate limiting based on context.
 * Kept for backward compatibility with createRateLimiter default path.
 */
function getIdentifier(req: Request, prefix: string): string {
  // For user-scoped limits, try to use user ID from JWT
  if (
    prefix === "api:read" ||
    prefix === "api:write" ||
    prefix === "ai" ||
    prefix === "platform:write" ||
    prefix === "invite" ||
    prefix === "attendance:write" ||
    prefix === "curriculum:write"
  ) {
    const userId = (req as any).user?.userId;
    if (userId) return userId;
  }

  // Password reset: key on email AND IP so a single email cannot be
  // locked out from one attacker IP alone, and one IP cannot hammer many emails.
  if (prefix === "reset") {
    const email = req.body?.email ? String(req.body.email).toLowerCase() : "unknown";
    const ip = req.ip || req.socket.remoteAddress || "unknown";
    return `${email}|${ip}`;
  }

  // Login: key on email AND IP to slow credential stuffing.
  if (prefix === "login") {
    const email = req.body?.email ? String(req.body.email).toLowerCase() : "unknown";
    const ip = req.ip || req.socket.remoteAddress || "unknown";
    return `${email}|${ip}`;
  }

  // For phone-based limits (OTP), try to use phone from body
  if (prefix === "otp" && req.body?.phone) {
    return req.body.phone;
  }

  // Default: use IP address
  return req.ip || req.socket.remoteAddress || "unknown";
}

/**
 * Set standard rate limit headers on the response.
 */
function setRateLimitHeaders(res: Response, count: number, max: number, resetAt: number): void {
  res.setHeader("X-RateLimit-Limit", max.toString());
  res.setHeader("X-RateLimit-Remaining", Math.max(0, max - count).toString());
  res.setHeader("X-RateLimit-Reset", Math.ceil(resetAt / 1000).toString());
}

// ─── Pre-configured Rate Limiters ───

/** Login: 5 attempts / 15min per IP AND per email */
export const loginLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
  keyPrefix: "login",
  dimensions: ["ip", "email"],
  message: "Too many login attempts. Please try again after 15 minutes.",
});

/** Register: 3 / hour per IP */
export const registerLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 3,
  keyPrefix: "register",
  dimensions: ["ip"],
  message: "Too many registration attempts. Please try again in an hour.",
});

/** Password reset: 3 / hour per email AND per IP */
export const passwordResetLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 3,
  keyPrefix: "reset",
  dimensions: ["email", "ip"],
  message: "Too many password reset requests. Please try again in an hour.",
});

/** OTP: 5 / hour per phone */
export const otpLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 5,
  keyPrefix: "otp",
  dimensions: ["phone"],
  message: "Too many OTP requests. Please try again in an hour.",
});

/** API read: 100 / min per user */
export const apiReadLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 100,
  keyPrefix: "api:read",
  dimensions: ["user"],
  message: "Too many read requests. Please slow down.",
});

/** API write: 30 / min per user */
export const apiWriteLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 30,
  keyPrefix: "api:write",
  dimensions: ["user"],
  message: "Too many write requests. Please slow down.",
});

/** AI endpoints: 20 / 15min per user */
export const aiLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 20,
  keyPrefix: "ai",
  dimensions: ["user"],
  message: "AI generation limit reached. Please try again later.",
});

/** Invite code generation: 10 / hour per user (or IP if unauthenticated context) */
export const inviteLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 10,
  keyPrefix: "invite",
  dimensions: ["user", "ip"],
  message: "Too many invite requests. Please try again later.",
});

/** Platform admin writes: 30 / 15min per user */
export const platformWriteLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 30,
  keyPrefix: "platform:write",
  dimensions: ["user", "ip"],
  message: "Too many platform write requests. Please try again later.",
});

/** Public invite verify: 20 / 15min per IP (prevents code enumeration) */
export const inviteVerifyLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 20,
  keyPrefix: "invite:verify",
  dimensions: ["ip"],
  message: "Too many invite code checks. Please try again later.",
});

export { createRateLimiter };
