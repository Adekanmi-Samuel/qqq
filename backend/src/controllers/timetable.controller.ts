import { Response } from "express";
import { timetableService } from "../services/timetable.service";
import { AuthenticatedRequest } from "../types";
import { getParam } from "../utils/getParam";

export class TimetableController {
  /**
   * GET /api/timetable?classArmId=xxx
   */
  async getByClassArm(req: AuthenticatedRequest, res: Response) {
    try {
      const schoolId = req.tenantId || req.user?.schoolId;
      if (!schoolId) return res.status(400).json({ success: false, error: "Tenant not identified." });

      const { classArmId } = req.query;
      if (!classArmId) {
        return res.status(400).json({ success: false, error: "classArmId is required." });
      }
      // Scope to caller school to prevent cross-tenant timetable reads by UUID
      const slots = await timetableService.getByClassArm(classArmId as string, schoolId);
      res.json({ success: true, data: slots });
    } catch (error: any) {
      res.status(500).json({ success: false, error: "Failed to fetch timetable." });
    }
  }

  /**
   * POST /api/timetable — upsert a single slot
   */
  async upsertSlot(req: AuthenticatedRequest, res: Response) {
    try {
      const schoolId = req.tenantId || req.user?.schoolId;
      if (!schoolId) return res.status(400).json({ success: false, error: "Tenant not identified." });

      // tenant fields must win over any client-supplied schoolId
      const { schoolId: _bodySchoolId, ...rest } = req.body || {};
      const slot = await timetableService.upsertSlot({ ...rest, schoolId });
      res.status(200).json({ success: true, message: "Slot saved.", data: slot });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        error: error.message || "Failed to save slot.",
      });
    }
  }

  /**
   * POST /api/timetable/batch — batch upsert slots
   */
  async batchUpsert(req: AuthenticatedRequest, res: Response) {
    try {
      const schoolId = req.tenantId || req.user?.schoolId;
      if (!schoolId) return res.status(400).json({ success: false, error: "Tenant not identified." });

      const { classArmId, slots } = req.body;
      const result = await timetableService.batchUpsert(schoolId, classArmId, slots);
      res.json({ success: true, message: `${result.length} slot(s) saved.`, data: result });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        error: error.message || "Failed to save slots.",
      });
    }
  }

  /**
   * DELETE /api/timetable/:id
   */
  async deleteSlot(req: AuthenticatedRequest, res: Response) {
    try {
      await timetableService.deleteSlot(getParam(req, "id"));
      res.json({ success: true, message: "Slot deleted." });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        error: error.message || "Failed to delete slot.",
      });
    }
  }

  /**
   * GET /api/timetable/available-subjects?classArmId=xxx
   */
  async getAvailableSubjects(req: AuthenticatedRequest, res: Response) {
    try {
      const { classArmId } = req.query;
      if (!classArmId) return res.status(400).json({ success: false, error: "classArmId is required." });
      const data = await timetableService.getAvailableSubjects(classArmId as string);
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, error: "Failed to fetch subjects." });
    }
  }

  /**
   * GET /api/timetable/teachers
   */
  async getTeachers(req: AuthenticatedRequest, res: Response) {
    try {
      const schoolId = req.tenantId || req.user?.schoolId;
      if (!schoolId) return res.status(400).json({ success: false, error: "Tenant not identified." });
      const teachers = await timetableService.getTeachers(schoolId);
      res.json({ success: true, data: teachers });
    } catch (error: any) {
      res.status(500).json({ success: false, error: "Failed to fetch teachers." });
    }
  }

  /**
   * GET /api/timetable/subjects
   */
  async getSubjects(req: AuthenticatedRequest, res: Response) {
    try {
      const schoolId = req.tenantId || req.user?.schoolId;
      if (!schoolId) return res.status(400).json({ success: false, error: "Tenant not identified." });
      const subjects = await timetableService.getSubjects(schoolId);
      res.json({ success: true, data: subjects });
    } catch (error: any) {
      res.status(500).json({ success: false, error: "Failed to fetch subjects." });
    }
  }

  /**
   * GET /api/timetable/class-arms
   */
  async getClassArms(req: AuthenticatedRequest, res: Response) {
    try {
      const schoolId = req.tenantId || req.user?.schoolId;
      if (!schoolId) return res.status(400).json({ success: false, error: "Tenant not identified." });
      const arms = await timetableService.getClassArms(schoolId);
      res.json({ success: true, data: arms });
    } catch (error: any) {
      res.status(500).json({ success: false, error: "Failed to fetch class arms." });
    }
  }

  /**
   * GET /api/timetable/my-slots
   * Get timetable slots for the logged-in teacher.
   */
  async getMySlots(req: AuthenticatedRequest, res: Response) {
    try {
      const teacherId = req.user?.userId;
      if (!teacherId) return res.status(401).json({ success: false, error: "Not authenticated." });
      const slots = await timetableService.getMySlots(teacherId);
      res.json({ success: true, data: slots });
    } catch (error: any) {
      res.status(500).json({ success: false, error: "Failed to fetch your slots." });
    }
  }
}

export const timetableController = new TimetableController();
