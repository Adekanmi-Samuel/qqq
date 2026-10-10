import { Response } from "express";
import { dashboardService } from "../services/dashboard.service";
import { AuthenticatedRequest } from "../types";
import { prisma } from "../lib/prisma";
import { sendSuccess, sendError } from "../utils/response";

export class DashboardController {
  /**
   * GET /api/dashboard/admin
   */
  async getAdminStats(req: AuthenticatedRequest, res: Response) {
    try {
      const schoolId = req.tenantId || req.user?.schoolId;
      if (!schoolId) {
        sendError(res, 400, "BAD_REQUEST", "Tenant not identified.", undefined, req.requestId);
        return;
      }

      const session = req.query.session as string | undefined;
      const stats = await dashboardService.getAdminStats(schoolId, session);
      sendSuccess(res, stats);
    } catch (error: any) {
      sendError(res, 500, "SERVER_ERROR", error.message || "Failed to load dashboard.", undefined, req.requestId);
    }
  }

  /**
   * GET /api/dashboard/teacher
   */
  async getTeacherStats(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        sendError(res, 401, "AUTH_REQUIRED", "Unauthorized.", undefined, req.requestId);
        return;
      }

      const stats = await dashboardService.getTeacherStats(userId);
      sendSuccess(res, stats);
    } catch (error: any) {
      sendError(res, 500, "SERVER_ERROR", error.message || "Failed to load dashboard.", undefined, req.requestId);
    }
  }

  /**
   * GET /api/dashboard/student
   */
  async getStudentStats(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        sendError(res, 401, "AUTH_REQUIRED", "Unauthorized.", undefined, req.requestId);
        return;
      }

      const student = await prisma.student.findFirst({
        where: { user: { id: userId } },
        select: { id: true },
      });
      if (!student) {
        sendError(res, 404, "RESOURCE_NOT_FOUND", "Student profile not found.", undefined, req.requestId);
        return;
      }

      const stats = await dashboardService.getStudentStats(student.id);
      sendSuccess(res, stats);
    } catch (error: any) {
      sendError(res, 500, "SERVER_ERROR", error.message || "Failed to load dashboard.", undefined, req.requestId);
    }
  }

  /**
   * GET /api/dashboard/parent
   */
  async getParentStats(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        sendError(res, 401, "AUTH_REQUIRED", "Unauthorized.", undefined, req.requestId);
        return;
      }

      const stats = await dashboardService.getParentStats(userId);
      sendSuccess(res, stats);
    } catch (error: any) {
      sendError(res, 500, "SERVER_ERROR", error.message || "Failed to load dashboard.", undefined, req.requestId);
    }
  }

  /**
   * GET /api/dashboard/staff
   */
  async getStaffStats(req: AuthenticatedRequest, res: Response) {
    try {
      const schoolId = req.tenantId || req.user?.schoolId;
      if (!schoolId) {
        sendError(res, 400, "BAD_REQUEST", "Tenant not identified.", undefined, req.requestId);
        return;
      }

      const session = req.query.session as string | undefined;
      const stats = await dashboardService.getStaffStats(schoolId, session);
      sendSuccess(res, stats);
    } catch (error: any) {
      sendError(res, 500, "SERVER_ERROR", error.message || "Failed to load dashboard.", undefined, req.requestId);
    }
  }
}

export const dashboardController = new DashboardController();
