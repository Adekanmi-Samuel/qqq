import { Response } from "express";
import { timesheetService } from "../services/timesheet.service";
import { AuthenticatedRequest } from "../types";
import { prisma } from "../lib/prisma";

export class TimesheetController {
  /**
   * POST /api/timesheets — Create or update timesheet
   */
  async upsertTimesheet(req: AuthenticatedRequest, res: Response) {
    try {
      const schoolId = req.tenantId || req.user?.schoolId;
      if (!schoolId) return res.status(400).json({ success: false, error: "Tenant not identified." });

      const { teacherId, weekStart, weekEnd, periodsTaught, periodsScheduled, notes } = req.body;
      if (!teacherId || !weekStart || !weekEnd) {
        return res.status(400).json({ success: false, error: "teacherId, weekStart, and weekEnd are required" });
      }

      // Verify teacher belongs to school
      const teacher = await prisma?.user.findFirst({
        where: { id: teacherId, schoolId },
      });
      if (!teacher) return res.status(404).json({ success: false, error: "Teacher not found in this school" });

      const timesheet = await timesheetService.upsertTimesheet({
        schoolId,
        teacherId,
        weekStart: new Date(weekStart),
        periodsTaught,
        periodsScheduled,
        notes,
      });

      res.json({ success: true, data: timesheet });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message || "Failed to save timesheet" });
    }
  }

  /**
   * POST /api/timesheets/:id/submit — Submit timesheet for approval
   */
  async submitTimesheet(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) return res.status(401).json({ success: false, error: "Unauthorized" });

      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const timesheet = await timesheetService.submitTimesheet(id, userId);
      res.json({ success: true, data: timesheet });
    } catch (error: any) {
      if (error.statusCode) {
        return res.status(error.statusCode).json({ success: false, error: error.message });
      }
      res.status(500).json({ success: false, error: error.message || "Failed to submit timesheet" });
    }
  }

  /**
   * POST /api/timesheets/:id/approve — Approve timesheet (admin/bursar)
   */
  async approveTimesheet(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      const role = req.user?.role;
      if (!userId) return res.status(401).json({ success: false, error: "Unauthorized" });
      if (!["SCHOOL_ADMIN", "PRINCIPAL", "BURSAR"].includes(role || "")) {
        return res.status(403).json({ success: false, error: "Not authorized to approve timesheets" });
      }

      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const timesheet = await timesheetService.approveTimesheet(id, userId);
      res.json({ success: true, data: timesheet });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message || "Failed to approve timesheet" });
    }
  }

  /**
   * GET /api/timesheets/:id — Get timesheet by ID
   */
  async getTimesheetById(req: AuthenticatedRequest, res: Response) {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const timesheet = await timesheetService.getTimesheetById(id);
      if (!timesheet) return res.status(404).json({ success: false, error: "Timesheet not found" });
      res.json({ success: true, data: timesheet });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message || "Failed to fetch timesheet" });
    }
  }

  /**
   * GET /api/timesheets/me — Get current user's timesheets
   */
  async getMyTimesheets(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) return res.status(401).json({ success: false, error: "Unauthorized" });

      const timesheets = await timesheetService.getTeacherTimesheets(userId);
      res.json({ success: true, data: timesheets });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message || "Failed to fetch timesheets" });
    }
  }

  /**
   * GET /api/timesheets/me/current — Get current week's timesheet
   */
  async getCurrentWeekTimesheet(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) return res.status(401).json({ success: false, error: "Unauthorized" });

      const timesheet = await timesheetService.getCurrentWeekTimesheet(userId);
      res.json({ success: true, data: timesheet });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message || "Failed to fetch current timesheet" });
    }
  }

  /**
   * GET /api/timesheets/dashboard — Teacher dashboard with timesheet info
   */
  async getDashboard(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) return res.status(401).json({ success: false, error: "Unauthorized" });

      const dashboard = await timesheetService.getTeacherDashboard(userId);
      res.json({ success: true, data: dashboard });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message || "Failed to fetch dashboard" });
    }
  }

  /**
   * GET /api/timesheets/school — Get all timesheets for school (admin)
   */
  async getSchoolTimesheets(req: AuthenticatedRequest, res: Response) {
    try {
      const schoolId = req.tenantId || req.user?.schoolId;
      if (!schoolId) return res.status(400).json({ success: false, error: "Tenant not identified." });

      const { weekStart } = req.query;
      const timesheets = await timesheetService.getSchoolTimesheets(schoolId, weekStart ? new Date(weekStart as string) : undefined);
      res.json({ success: true, data: timesheets });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message || "Failed to fetch school timesheets" });
    }
  }

  /**
   * GET /api/timesheets/teachers/status — Get all teachers with timesheet status (admin)
   */
  async getTeachersTimesheetStatus(req: AuthenticatedRequest, res: Response) {
    try {
      const schoolId = req.tenantId || req.user?.schoolId;
      if (!schoolId) return res.status(400).json({ success: false, error: "Tenant not identified." });

      const status = await timesheetService.getAllTeachersTimesheetStatus(schoolId);
      res.json({ success: true, data: status });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message || "Failed to fetch teachers status" });
    }
  }
}

export const timesheetController = new TimesheetController();
