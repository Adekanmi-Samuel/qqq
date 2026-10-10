import { Response } from "express";
import { authService } from "../services/auth.service";
import { AuthenticatedRequest } from "../types";
import { sendSuccess, sendSuccessWithMessage, sendError } from "../utils/response";
import { prisma } from "../lib/prisma";
import crypto from "crypto";

export class AuthController {
  /**
   * POST /api/auth/register
   * Sets auth cookies instead of returning tokens in body
   */
  async register(req: AuthenticatedRequest, res: Response) {
    try {
      const { remember, ...body } = req.body;
      const deviceId = req.deviceId || 'unknown';
      const userAgent = req.headers['user-agent'] || 'unknown';
      const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';

      const result = await authService.register({ ...body, remember }, res, deviceId, userAgent, ipAddress);

      res.status(201);
      sendSuccessWithMessage(res, result, "Your school has been registered! We'll review your details shortly.");
    } catch (error: any) {
      sendError(res, error.statusCode || 500, error.code || "SERVER_ERROR", error.message || "Registration failed. Please try again.", undefined, req.requestId);
    }
  }

  /**
   * POST /api/auth/register-with-invite
   * Sets auth cookies instead of returning tokens in body
   */
  async registerWithInvite(req: AuthenticatedRequest, res: Response) {
    try {
      const deviceId = req.deviceId || 'unknown';
      const userAgent = req.headers['user-agent'] || 'unknown';
      const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';

      const result = await authService.registerWithInvite(req.body, res, deviceId, userAgent, ipAddress);

      res.status(201);
      sendSuccessWithMessage(res, result, "Welcome aboard! Your account is ready.");
    } catch (error: any) {
      sendError(res, error.statusCode || 500, error.code || "SERVER_ERROR", error.message || "Registration failed. Please try again.", undefined, req.requestId);
    }
  }

  /**
   * POST /api/auth/login
   * Sets auth cookies instead of returning tokens in body
   */
  async login(req: AuthenticatedRequest, res: Response) {
    try {
      const { email, password, remember } = req.body;
      const deviceId = req.deviceId || 'unknown';
      const userAgent = req.headers['user-agent'] || 'unknown';
      const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';

      const result = await authService.login(email, password, remember, res, deviceId, userAgent, ipAddress);

      // Clear failed-attempt counters on successful login
      if (req.loginAttempts) {
        req.loginAttempts.recordSuccess();
      }

      sendSuccessWithMessage(res, result, "Welcome back!");
    } catch (error: any) {
      // Record failed login attempt for tracking
      if (req.loginAttempts) {
        req.loginAttempts.recordFailure();
      }
      sendError(res, error.statusCode || 500, error.code || "SERVER_ERROR", error.message || "Login failed. Please try again.", undefined, req.requestId);
    }
  }

  /**
   * POST /api/auth/set-password -- set new password (for passwordResetRequired flow)
   */
  async setPassword(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        sendError(res, 401, "AUTH_REQUIRED", "Not authenticated.", undefined, req.requestId);
        return;
      }

      const { currentPassword, newPassword } = req.body;
      if (!currentPassword || !newPassword || newPassword.length < 8) {
        sendError(res, 422, "VALIDATION_ERROR", "Current password and new password (min 8 chars) are required.", undefined, req.requestId);
        return;
      }

      const { message } = await authService.setPassword(userId, currentPassword, newPassword);
      sendSuccessWithMessage(res, { success: true }, message);
    } catch (error: any) {
      sendError(res, error.statusCode || 500, error.code || "SERVER_ERROR", error.message || "Failed to update password.", undefined, req.requestId);
    }
  }

  /**
   * POST /api/auth/forgot-password
   */
  async forgotPassword(req: AuthenticatedRequest, res: Response) {
    try {
      const { email } = req.body;
      if (!email) {
        sendError(res, 422, "VALIDATION_ERROR", "Email is required.", undefined, req.requestId);
        return;
      }

      const { message } = await authService.forgotPassword(email);
      sendSuccessWithMessage(res, { success: true }, message);
    } catch (error: any) {
      sendError(res, error.statusCode || 500, error.code || "SERVER_ERROR", error.message || "Failed to process request.", undefined, req.requestId);
    }
  }

  /**
   * POST /api/auth/reset-password
   */
  async resetPassword(req: AuthenticatedRequest, res: Response) {
    try {
      const { token, newPassword } = req.body;
      if (!token || !newPassword || newPassword.length < 6) {
        sendError(res, 422, "VALIDATION_ERROR", "Token and new password (min 6 chars) are required.", undefined, req.requestId);
        return;
      }

      const { message } = await authService.resetPassword(token, newPassword);
      sendSuccessWithMessage(res, { success: true }, message);
    } catch (error: any) {
      sendError(res, error.statusCode || 500, error.code || "SERVER_ERROR", error.message || "Failed to reset password.", undefined, req.requestId);
    }
  }

  /**
   * POST /api/auth/refresh
   * Reads refresh token from cookie, rotates tokens, sets new cookies
   */
  async refresh(req: AuthenticatedRequest, res: Response) {
    try {
      // Read refresh token from cookie
      const refreshToken = req.cookies['sh_refresh'];
      if (!refreshToken) {
        sendError(res, 422, "VALIDATION_ERROR", "Refresh token is required.", undefined, req.requestId);
        return;
      }

      const deviceId = req.deviceId || 'unknown';
      const userAgent = req.headers['user-agent'] || 'unknown';
      const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';
      // Remember is derived server-side from the stored session expiry.
      // Ignore any client-supplied remember flag to avoid cookie/DB desync.

      const result = await authService.refreshToken(refreshToken, res, deviceId, userAgent, ipAddress);
      sendSuccess(res, result);
    } catch (error: any) {
      sendError(res, error.statusCode || 401, error.code || "UNAUTHORIZED", error.message || "Failed to refresh token.", undefined, req.requestId);
    }
  }

  /**
   * POST /api/auth/logout
   * Clears auth cookies
   */
  async logout(req: AuthenticatedRequest, res: Response) {
    try {
      const refreshToken = req.cookies['sh_refresh'];
      const userId = req.user?.userId;

      // Always clear cookies even if revocation fails; logout must work
      // even when only the refresh cookie is present (expired access token).
      try {
        const result = await authService.logout(refreshToken, res, userId);
        sendSuccessWithMessage(res, result, result.message);
      } catch (err) {
        // Fall through to cookie clear on failure
        sendError(res, 500, "SERVER_ERROR", "Logout failed.", undefined, req.requestId);
      }
    } catch (error: any) {
      sendError(res, 500, "SERVER_ERROR", "Logout failed.", undefined, req.requestId);
    }
  }

  /**
   * GET /api/auth/me -- get current user profile
   * Works with cookie-based auth (reads from Authorization header for backward compatibility)
   */
  async me(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        sendError(res, 401, "AUTH_REQUIRED", "Not authenticated.", undefined, req.requestId);
        return;
      }

      const user = await prisma.user.findUnique({
        where: { id: req.user.userId },
        select: {
          id: true,
          fullName: true,
          email: true,
          role: true,
          active: true,
          passwordResetRequired: true,
          school: {
            select: {
              id: true,
              name: true,
              slug: true,
              verified: true,
              logoUrl: true,
              motto: true,
            },
          },
        },
      });

      if (!user) {
        sendError(res, 404, "RESOURCE_NOT_FOUND", "User not found.", undefined, req.requestId);
        return;
      }

      sendSuccess(res, user);
    } catch (error: any) {
      sendError(res, 500, "SERVER_ERROR", "Failed to fetch user profile.", undefined, req.requestId);
    }
  }

  /**
   * GET /api/profile -- get the signed-in user's own profile
   * Available to every role (admin, teacher, staff, student, parent).
   */
  async getProfile(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        sendError(res, 401, "AUTH_REQUIRED", "Authentication required.", undefined, req.requestId);
        return;
      }

      const user = await prisma.user.findUnique({
        where: { id: req.user.userId },
        select: {
          id: true,
          fullName: true,
          email: true,
          role: true,
          active: true,
          createdAt: true,
          school: {
            select: { id: true, name: true, slug: true, verified: true, logoUrl: true },
          },
        },
      });

      if (!user) {
        sendError(res, 404, "RESOURCE_NOT_FOUND", "User profile not found.", undefined, req.requestId);
        return;
      }

      sendSuccess(res, {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        active: user.active,
        createdAt: user.createdAt,
        schoolId: user.school?.id ?? null,
        schoolName: user.school?.name ?? null,
        schoolSlug: user.school?.slug ?? null,
        schoolLogoUrl: user.school?.logoUrl ?? null,
      });
    } catch (error: any) {
      sendError(res, 500, "SERVER_ERROR", "Failed to fetch profile.", undefined, req.requestId);
    }
  }

  /**
   * PATCH /api/profile -- update the signed-in user's own profile
   * Body: { fullName?, email? }
   * Every role can edit their own profile; no cross-user editing.
   */
  async updateProfile(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        sendError(res, 401, "AUTH_REQUIRED", "Authentication required.", undefined, req.requestId);
        return;
      }

      const { fullName, email } = req.body as { fullName?: string; email?: string };

      if (!fullName && !email) {
        sendError(
          res,
          400,
          "VALIDATION_ERROR",
          "Provide at least one field to update (fullName or email).",
          undefined,
          req.requestId
        );
        return;
      }

      const data: { fullName?: string; email?: string } = {};

      if (fullName !== undefined) {
        const trimmed = String(fullName).trim();
        if (trimmed.length < 2 || trimmed.length > 100) {
          sendError(
            res,
            400,
            "VALIDATION_ERROR",
            "Full name must be between 2 and 100 characters.",
            undefined,
            req.requestId
          );
          return;
        }
        data.fullName = trimmed;
      }

      if (email !== undefined) {
        const trimmed = String(email).trim().toLowerCase();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(trimmed) || trimmed.length > 191) {
          sendError(res, 400, "VALIDATION_ERROR", "Enter a valid email address.", undefined, req.requestId);
          return;
        }
        // Uniqueness: another user may not already own this email
        const existing = await prisma.user.findFirst({
          where: { email: trimmed, NOT: { id: req.user.userId } },
          select: { id: true },
        });
        if (existing) {
          sendError(
            res,
            409,
            "EMAIL_TAKEN",
            "That email is already in use by another account.",
            undefined,
            req.requestId
          );
          return;
        }
        data.email = trimmed;
      }

      const updated = await prisma.user.update({
        where: { id: req.user.userId },
        data,
        select: {
          id: true,
          fullName: true,
          email: true,
          role: true,
          school: { select: { id: true, name: true, slug: true, logoUrl: true } },
        },
      });

      sendSuccessWithMessage(
        res,
        {
          id: updated.id,
          fullName: updated.fullName,
          email: updated.email,
          role: updated.role,
          schoolId: updated.school?.id ?? null,
          schoolName: updated.school?.name ?? null,
        },
        "Profile updated successfully."
      );
    } catch (error: any) {
      sendError(res, 500, "SERVER_ERROR", "Failed to update profile.", undefined, req.requestId);
    }
  }

  /**
   * POST /api/auth/join-school -- link the signed-in account to a school via invite code.
   * Intended for Google/OAuth signups that start with no school.
   */
  async joinSchool(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        sendError(res, 401, "AUTH_REQUIRED", "Authentication required.", undefined, req.requestId);
        return;
      }

      const { inviteCode, admissionNumber } = req.body as {
        inviteCode?: string;
        admissionNumber?: string;
      };

      if (!inviteCode || typeof inviteCode !== "string") {
        sendError(res, 400, "VALIDATION_ERROR", "Invite code is required.", undefined, req.requestId);
        return;
      }

      const deviceId = req.deviceId || "unknown";
      const userAgent = req.headers["user-agent"] || "unknown";
      const ipAddress = req.ip || req.socket.remoteAddress || "unknown";

      const result = await authService.joinSchool(
        { userId: req.user.userId, inviteCode: inviteCode.trim(), admissionNumber },
        res,
        deviceId,
        userAgent,
        ipAddress
      );

      sendSuccessWithMessage(res, result, "You have joined your school.");
    } catch (error: any) {
      sendError(
        res,
        error.statusCode || 500,
        error.code || "SERVER_ERROR",
        error.message || "Could not join your school.",
        undefined,
        req.requestId
      );
    }
  }

  /**
   * GET /api/auth/sessions -- list active sessions
   */
  async getSessions(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        sendError(res, 401, "AUTH_REQUIRED", "Not authenticated.", undefined, req.requestId);
        return;
      }

      // Get current session ID by looking up the refresh token
      const refreshToken = req.cookies['sh_refresh'];
      let currentSessionId: string | undefined;

      if (refreshToken) {
        const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
        const session = await prisma.refreshToken.findFirst({
          where: { tokenHash, userId: req.user.userId },
          select: { id: true }
        });
        currentSessionId = session?.id;
      }

      const result = await authService.getSessions(req.user.userId, currentSessionId);
      sendSuccess(res, result);
    } catch (error: any) {
      sendError(res, error.statusCode || 500, error.code || "SERVER_ERROR", error.message || "Failed to fetch sessions.", undefined, req.requestId);
    }
  }

  /**
   * DELETE /api/auth/sessions/:id -- revoke specific session
   */
  async revokeSession(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        sendError(res, 401, "AUTH_REQUIRED", "Not authenticated.", undefined, req.requestId);
        return;
      }

      const id = String(req.params.id);
      await authService.revokeSession(id, req.user.userId);

      sendSuccessWithMessage(res, { success: true }, "Session revoked successfully.");
    } catch (error: any) {
      sendError(res, error.statusCode || 500, error.code || "SERVER_ERROR", error.message || "Failed to revoke session.", undefined, req.requestId);
    }
  }

  /**
   * DELETE /api/auth/sessions -- revoke all other sessions
   */
  async revokeAllSessions(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        sendError(res, 401, "AUTH_REQUIRED", "Not authenticated.", undefined, req.requestId);
        return;
      }

      // Get current session ID from cookie
      const currentRefreshToken = req.cookies['sh_refresh'];
      let currentSessionId: string | undefined;

      if (currentRefreshToken) {
        // We'd need to look up the session ID from the token
        // For now, we'll just revoke all except we don't have easy access
        // In practice, we'd decode the token and find the session
        const tokenHash = crypto.createHash('sha256').update(currentRefreshToken).digest('hex');
        const session = await prisma.refreshToken.findFirst({
          where: { tokenHash, userId: req.user.userId },
          select: { id: true }
        });
        currentSessionId = session?.id;
      }

      const count = await authService.revokeAllSessions(req.user.userId, currentSessionId);

      sendSuccessWithMessage(res, { success: true, count }, `Revoked ${count} session(s).`);
    } catch (error: any) {
      sendError(res, error.statusCode || 500, error.code || "SERVER_ERROR", error.message || "Failed to revoke sessions.", undefined, req.requestId);
    }
  }

  /**
   * POST /api/auth/supabase-sync
   * Sync a Supabase OAuth user with our backend. Sets auth cookies.
   */
  async supabaseSync(req: AuthenticatedRequest, res: Response) {
    try {
      // Require a Supabase access token. Never trust client-supplied email/userId alone.
      const accessToken =
        req.body?.accessToken || req.body?.access_token || req.headers["x-supabase-token"];
      if (!accessToken || typeof accessToken !== "string") {
        sendError(res, 400, "INVALID_INPUT", "Supabase access token is required.", undefined, req.requestId);
        return;
      }

      const deviceId = req.deviceId || 'unknown';
      const userAgent = req.headers['user-agent'] || 'unknown';
      const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';

      const result = await authService.supabaseSync(
        { accessToken },
        res,
        deviceId,
        userAgent,
        ipAddress
      );

      sendSuccess(res, result);
    } catch (error: any) {
      sendError(res, error.statusCode || 500, error.code || "SERVER_ERROR", error.message || "Supabase sync failed.", undefined, req.requestId);
    }
  }
}

export const authController = new AuthController();