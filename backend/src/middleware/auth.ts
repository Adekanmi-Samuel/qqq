import { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AuthenticatedRequest, JwtPayload } from "../types";
import { config } from "../config/env";
import { sendError } from "../utils/response";
import { prisma } from "../lib/prisma";

const JWT_SECRET = config.JWT_SECRET;

/**
 * Extract access token from Authorization header or sh_access cookie.
 * Cookie auth is required for the browser (HttpOnly cookies set at login).
 */
function extractToken(req: AuthenticatedRequest): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.split(" ")[1];
  }

  const cookies = (req as any).cookies;
  if (cookies && typeof cookies.sh_access === "string" && cookies.sh_access) {
    return cookies.sh_access;
  }

  return null;
}

/**
 * Revalidate JWT against the database so deactivated or demoted
 * users lose access before the access token expires.
 */
async function loadFreshUser(userId: string): Promise<{
  id: string;
  role: string;
  schoolId: string | null;
  active: boolean;
  passwordResetRequired?: boolean;
} | null> {
  return prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, schoolId: true, active: true, passwordResetRequired: true },
  });
}

/**
 * Routes a user with passwordResetRequired may still call.
 * Invite users must complete set-password before tenant APIs, but they can
 * always reach their own account: profile, logout, session refresh and the
 * Google link flow.
 */
const PASSWORD_RESET_ALLOWED_PREFIXES = [
  "/api/auth/set-password",
  "/api/auth/logout",
  "/api/auth/me",
  "/api/auth/refresh",
  "/api/auth/sessions",
  "/api/auth/supabase-sync",
  "/api/auth/join-school",
  "/api/profile",
];

/**
 * Verify JWT token and attach user to request.
 * All protected routes should use this middleware.
 * Accepts Bearer header or sh_access HttpOnly cookie.
 */
export async function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const token = extractToken(req);

    if (!token) {
      sendError(res, 401, "AUTH_REQUIRED", "Authentication required. Please provide a valid token.", undefined, req.requestId);
      return;
    }

    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

    // Reject password-reset / setup tokens used as API sessions
    if ((decoded as any).tokenPurpose && (decoded as any).tokenPurpose !== "access") {
      sendError(res, 401, "AUTH_REQUIRED", "Invalid authentication token.", undefined, req.requestId);
      return;
    }

    const fresh = await loadFreshUser(decoded.userId);
    if (!fresh || !fresh.active) {
      sendError(res, 401, "AUTH_REQUIRED", "This account is inactive. Contact your school admin.", undefined, req.requestId);
      return;
    }

    // Block invite/setup users until they complete password change
    if (fresh.passwordResetRequired) {
      // Use the full request path. Inside a mounted router req.path is
      // router-relative ("/set-password"), which never matches these
      // "/api/auth/..." prefixes and locked users out of the very routes
      // they are meant to reach.
      const rawPath = (req.originalUrl || req.path || req.url || "");
      const path = rawPath.split("?")[0];
      const allowed = PASSWORD_RESET_ALLOWED_PREFIXES.some((p) => path.startsWith(p));
      if (!allowed) {
        sendError(
          res,
          403,
          "PASSWORD_RESET_REQUIRED",
          "You must set a password before using this account.",
          undefined,
          req.requestId
        );
        return;
      }
    }

    req.user = {
      ...decoded,
      userId: fresh.id,
      role: fresh.role as JwtPayload["role"],
      schoolId: fresh.schoolId,
    };
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      sendError(res, 401, "AUTH_REQUIRED", "Your session has expired. Please sign in again.", undefined, req.requestId);
      return;
    }
    sendError(res, 401, "AUTH_REQUIRED", "Invalid authentication token.", undefined, req.requestId);
  }
}

/**
 * Optional auth -- attaches user to request if token is present,
 * but does not block unauthenticated requests.
 */
export async function optionalAuth(req: AuthenticatedRequest, _res: Response, next: NextFunction): Promise<void> {
  try {
    const token = extractToken(req);

    if (token) {
      const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
      if (!(decoded as any).tokenPurpose || (decoded as any).tokenPurpose === "access") {
        const fresh = await loadFreshUser(decoded.userId);
        if (fresh && fresh.active) {
          req.user = {
            ...decoded,
            userId: fresh.id,
            role: fresh.role as JwtPayload["role"],
            schoolId: fresh.schoolId,
          };
        }
      }
    }
  } catch {
    // Token invalid or expired -- continue without user
  }

  next();
}

/**
 * Role-based access control middleware factory.
 * Use after authenticate() to restrict access by role.
 *
 * @example
 *   router.get("/admin", authenticate, authorize("SUPER_ADMIN"), handler)
 */
export function authorize(...allowedRoles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError(res, 401, "AUTH_REQUIRED", "Authentication required.", undefined, req.requestId);
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      sendError(res, 403, "FORBIDDEN", "You don't have permission to perform this action. Contact your school admin.", undefined, req.requestId);
      return;
    }

    next();
  };
}
