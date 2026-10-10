import { Response } from "express";
import { noticeService } from "../services/notice.service";
import { AuthenticatedRequest } from "../types";
import { getParam } from "../utils/getParam";
import { sendSuccess, sendError } from "../utils/response";

export class NoticeController {
  /**
   * GET /api/notices -- list notices
   */
  async list(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = (req.tenantId || req.user?.schoolId) as string;
      if (!tenantId) {
        sendError(res, 400, "BAD_REQUEST", "Tenant not identified.", undefined, req.requestId);
        return;
      }
      const { targetType, targetId } = req.query;
      const notices = await noticeService.list(
        tenantId,
        targetType as string,
        targetId as string
      );
      sendSuccess(res, notices);
    } catch (error: any) {
      sendError(res, 500, "SERVER_ERROR", "Failed to fetch notices.", undefined, req.requestId);
    }
  }

  /**
   * POST /api/notices -- create notice
   */
  async create(req: AuthenticatedRequest, res: Response) {
    try {
      const payload = { ...req.body, schoolId: (req.tenantId || req.user?.schoolId) as string };
      const notice = await noticeService.create(payload);
      res.status(201);
      sendSuccess(res, notice);
    } catch (error: any) {
      sendError(res, error.statusCode || 500, error.code || "SERVER_ERROR", error.message || "Failed to create notice.", undefined, req.requestId);
    }
  }

  /**
   * POST /api/notices/:id/publish -- publish a draft notice
   */
  async publish(req: AuthenticatedRequest, res: Response) {
    try {
      const noticeId = getParam(req, "id")!;
      const schoolId = (req.tenantId || req.user?.schoolId) as string;
      const notice = await noticeService.publish(noticeId, schoolId);
      sendSuccess(res, notice);
    } catch (error: any) {
      sendError(res, error.statusCode || 500, error.code || "SERVER_ERROR", error.message || "Failed to publish notice.", undefined, req.requestId);
    }
  }

  /**
   * DELETE /api/notices/:id -- delete notice
   */
  async delete(req: AuthenticatedRequest, res: Response) {
    try {
      const noticeId = getParam(req, "id")!;
      const schoolId = (req.tenantId || req.user?.schoolId) as string;
      await noticeService.delete(noticeId, schoolId);
      sendSuccess(res, null);
    } catch (error: any) {
      sendError(res, error.statusCode || 500, error.code || "SERVER_ERROR", error.message || "Failed to delete notice.", undefined, req.requestId);
    }
  }
}

export const noticeController = new NoticeController();
