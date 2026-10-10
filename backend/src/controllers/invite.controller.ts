import crypto from "crypto";
import { Response } from "express";
import { prisma } from "../lib/prisma";
import { AuthenticatedRequest } from "../types";
import { sendSuccess, sendError } from "../utils/response";

export class InviteController {
  /**
   * POST /api/invites/generate -- generate invite codes for staff
   * Requires: SCHOOL_ADMIN or PRINCIPAL
   */
  async generate(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        sendError(res, 401, "AUTH_REQUIRED", "Not authenticated.", undefined, req.requestId);
        return;
      }

      const { count = 1, role = "TEACHER", schoolId } = req.body;
      const validRoles = ["TEACHER", "BURSAR", "PRINCIPAL", "STUDENT", "PARENT"];
      if (!validRoles.includes(role)) {
        sendError(res, 422, "VALIDATION_ERROR", "Invalid role.", undefined, req.requestId);
        return;
      }

      const allowedRoles = ["SUPER_ADMIN", "SCHOOL_ADMIN", "PRINCIPAL"];
      if (!allowedRoles.includes(req.user.role)) {
        sendError(res, 403, "FORBIDDEN", "Only school leadership can generate invites.", undefined, req.requestId);
        return;
      }

      // SUPER_ADMIN has no schoolId on the token; require an explicit target school.
      const targetSchoolId =
        req.user.role === "SUPER_ADMIN"
          ? schoolId || req.user.schoolId
          : req.user.schoolId || schoolId;

      if (!targetSchoolId) {
        sendError(res, 400, "BAD_REQUEST", "schoolId is required to generate invites.", undefined, req.requestId);
        return;
      }

      const school = await prisma.school.findUnique({ where: { id: targetSchoolId } });
      if (!school) {
        sendError(res, 404, "RESOURCE_NOT_FOUND", "School not found.", undefined, req.requestId);
        return;
      }

      const codes = [];
      // 128-bit entropy, not the previous 32-bit randomBytes(4)
      for (let i = 0; i < Math.min(count, 50); i++) {
        const code = crypto.randomBytes(16).toString("hex").toUpperCase().slice(0, 32);
        const invite = await prisma.schoolInvite.create({
          data: {
            schoolId: targetSchoolId,
            code: `SH-${code}`,
            role,
            createdBy: req.user.userId,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          },
        });
        codes.push({ code: invite.code, role: invite.role, expiresAt: invite.expiresAt, schoolId: targetSchoolId });
      }

      sendSuccess(res, codes);
    } catch (error: any) {
      sendError(res, 500, "SERVER_ERROR", "Failed to generate invite codes.", undefined, req.requestId);
    }
  }

  /**
   * GET /api/invites -- list all invites for the school
   */
  async list(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        sendError(res, 401, "AUTH_REQUIRED", "Not authenticated.", undefined, req.requestId);
        return;
      }

      const schoolId = req.user.schoolId;
      if (!schoolId) {
        sendError(res, 400, "BAD_REQUEST", "No school association.", undefined, req.requestId);
        return;
      }

      const invites = await prisma.schoolInvite.findMany({
        where: { schoolId },
        orderBy: { createdAt: "desc" },
        take: 100,
        select: {
          id: true,
          role: true,
          used: true,
          usedAt: true,
          expiresAt: true,
          createdAt: true,
          // Full codes are returned only from the generate response (and platform superadmin listing).
          // Leadership list view masks codes to reduce harvest risk.
          code: true,
        },
      });

      // Mask codes for non-superadmin leadership viewers
      const masked = invites.map((invite) => {
        if (req.user?.role === "SUPER_ADMIN") return invite;
        const code = invite.code;
        return {
          ...invite,
          code: code.length > 8 ? `${code.slice(0, 3)}****${code.slice(-2)}` : "****",
        };
      });

      sendSuccess(res, masked);
    } catch (error: any) {
      sendError(res, 500, "SERVER_ERROR", "Failed to list invites.", undefined, req.requestId);
    }
  }

  /**
   * POST /api/invites/verify -- check if an invite code is valid
   */
  async verify(req: AuthenticatedRequest, res: Response) {
    try {
      const { code } = req.body;
      if (!code) {
        sendError(res, 422, "VALIDATION_ERROR", "Invite code is required.", undefined, req.requestId);
        return;
      }

      const invite = await prisma.schoolInvite.findUnique({
        where: { code },
        include: { school: { select: { name: true } } },
      });
      if (!invite) {
        sendError(res, 404, "RESOURCE_NOT_FOUND", "Invalid invite code. Please check and try again.", undefined, req.requestId);
        return;
      }
      if (invite.used) {
        sendError(res, 409, "CONFLICT", "This invite code has already been used.", undefined, req.requestId);
        return;
      }
      if (invite.expiresAt && invite.expiresAt < new Date()) {
        sendError(res, 400, "BAD_REQUEST", "This invite code has expired.", undefined, req.requestId);
        return;
      }

      // Public verify must not leak school identity, role, email, or invitee name.
      // Registration resolves those details server-side from the code alone.
      sendSuccess(res, { valid: true });
    } catch (error: any) {
      sendError(res, 500, "SERVER_ERROR", "Failed to verify invite code.", undefined, req.requestId);
    }
  }
}

export const inviteController = new InviteController();
