import { Response } from "express";
import { classService } from "../services/class.service";
import { AuthenticatedRequest } from "../types";
import { getParam } from "../utils/getParam";

export class ClassController {
  /**
   * GET /api/classes — list classes for a school
   */
  async list(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = (req.tenantId || req.user?.schoolId) as string;
      if (!tenantId) {
        return res.status(400).json({ success: false, error: "Tenant not identified." });
      }
      const classes = await classService.list(tenantId);
      res.json({ success: true, data: classes });
    } catch (error: any) {
      res.status(500).json({ success: false, error: "Failed to fetch classes." });
    }
  }

  /**
   * POST /api/classes — create class
   */
  async create(req: AuthenticatedRequest, res: Response) {
    try {
      const { name, arms } = req.body;
      const tenantId = (req.tenantId || req.user?.schoolId) as string;
      if (!tenantId) return res.status(400).json({ success: false, error: "Tenant not identified." });
      const cls = await classService.create(tenantId, name, arms);
      res.status(201).json({
        success: true,
        message: "Class created.",
        data: cls,
      });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        error: error.message || "Failed to create class.",
      });
    }
  }

  /**
   * POST /api/classes/arms — add arm
   */
  async addArm(req: AuthenticatedRequest, res: Response) {
    try {
      const schoolId = req.tenantId || req.user?.schoolId;
      if (!schoolId) return res.status(400).json({ success: false, error: "Tenant not identified." });
      const payload = req.body as { classId?: string; name?: string; classTeacherId?: string };
      const arm = await classService.addArm(schoolId, payload.classId!, payload.name!, payload.classTeacherId);
      res.status(201).json({
        success: true,
        message: "Arm added.",
        data: arm,
      });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        error: error.message || "Failed to add arm.",
      });
    }
  }

  /**
   * PATCH /api/classes/arms/:id — assign class teacher
   */
  async assignClassTeacher(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = (req.tenantId || req.user?.schoolId) as string;
      if (!tenantId) return res.status(400).json({ success: false, error: "Tenant not identified." });
      const { classTeacherId } = req.body as { classTeacherId?: string };
      const armId = getParam(req, "id");
      const arm = await classService.assignClassTeacher(tenantId, armId, classTeacherId!);
      res.json({
        success: true,
        message: "Class teacher assigned.",
        data: arm,
      });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        error: error.message || "Failed to assign class teacher.",
      });
    }
  }

  /**
   * PATCH /api/classes/:id — rename class
   */
  async renameClass(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = (req.tenantId || req.user?.schoolId) as string;
      if (!tenantId) return res.status(400).json({ success: false, error: "Tenant not identified." });
      const classId = getParam(req, "id");
      const { name } = req.body as { name?: string };
      const cls = await classService.renameClass(tenantId, classId, name!);
      res.json({ success: true, message: "Class updated.", data: cls });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        error: error.message || "Failed to rename class.",
      });
    }
  }

  /**
   * PATCH /api/classes/arms/:id — rename arm when name provided,
   * otherwise assign class teacher.
   */
  async updateArm(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = (req.tenantId || req.user?.schoolId) as string;
      if (!tenantId) return res.status(400).json({ success: false, error: "Tenant not identified." });
      const armId = getParam(req, "id");
      const body = req.body as { name?: string; classTeacherId?: string };
      if (body.name) {
        const arm = await classService.renameArm(tenantId, armId, body.name);
        return res.json({ success: true, message: "Arm updated.", data: arm });
      }
      if (body.classTeacherId) {
        const arm = await classService.assignClassTeacher(tenantId, armId, body.classTeacherId);
        return res.json({ success: true, message: "Class teacher assigned.", data: arm });
      }
      return res.status(400).json({ success: false, error: "Provide name or classTeacherId." });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        error: error.message || "Failed to update arm.",
      });
    }
  }

  /**
   * DELETE /api/classes/arms/:id — delete arm
   */
  async deleteArm(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = (req.tenantId || req.user?.schoolId) as string;
      if (!tenantId) return res.status(400).json({ success: false, error: "Tenant not identified." });
      const armId = getParam(req, "id");
      await classService.deleteArm(tenantId, armId);
      res.json({ success: true, message: "Arm deleted." });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        error: error.message || "Failed to delete arm.",
      });
    }
  }
}

export const classController = new ClassController();
