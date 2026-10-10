import { Response } from "express";
import { schoolService } from "../services/school.service";
import { AuthenticatedRequest } from "../types";
import { getParam } from "../utils/getParam";
import { sendSuccess, sendError } from "../utils/response";

export class SchoolController {
  /**
   * GET /api/schools -- list all schools (admin)
   */
  async listAll(req: AuthenticatedRequest, res: Response) {
    try {
      const schools = await schoolService.listAll(req.user);
      sendSuccess(res, schools);
    } catch (error: any) {
      sendError(res, 500, "SERVER_ERROR", "Failed to fetch schools.", undefined, req.requestId);
    }
  }

  /**
   * GET /api/schools/:slug -- public school profile
   */
  async getBySlug(req: AuthenticatedRequest, res: Response) {
    try {
      const slug = getParam(req, "slug");
      const school = await schoolService.getBySlug(slug);
      sendSuccess(res, school);
    } catch (error: any) {
      sendError(res, error.statusCode || 500, error.code || "SERVER_ERROR", error.message || "School not found.", undefined, req.requestId);
    }
  }

  /**
   * PATCH /api/schools/:id -- update school
   */
  async update(req: AuthenticatedRequest, res: Response) {
    try {
      const id = getParam(req, "id");
      const school = await schoolService.update(id, req.body, req.user!);
      sendSuccess(res, school);
    } catch (error: any) {
      sendError(res, error.statusCode || 500, error.code || "SERVER_ERROR", error.message || "Failed to update school.", undefined, req.requestId);
    }
  }

  /**
   * POST /api/schools/verify -- verify school (super admin)
   */
  async verify(req: AuthenticatedRequest, res: Response) {
    try {
      const body = req.body as { schoolId?: string };
      const school = await schoolService.verify(body.schoolId!);
      sendSuccess(res, school);
    } catch (error: any) {
      sendError(res, error.statusCode || 500, error.code || "SERVER_ERROR", error.message || "Failed to verify school.", undefined, req.requestId);
    }
  }

  /**
   * GET /api/schools/academic-calendar/current
   */
  async getCurrentSession(req: AuthenticatedRequest, res: Response) {
    try {
      const schoolId = (req.tenantId || req.user?.schoolId) as string;
      if (!schoolId) {
        sendError(res, 400, "BAD_REQUEST", "Tenant not identified.", undefined, req.requestId);
        return;
      }
      const calendar = await schoolService.getCurrentSession(schoolId);
      sendSuccess(res, calendar);
    } catch (error: any) {
      sendError(res, error.statusCode || 500, error.code || "SERVER_ERROR", error.message || "Failed to fetch current session.", undefined, req.requestId);
    }
  }
}

export const schoolController = new SchoolController();
