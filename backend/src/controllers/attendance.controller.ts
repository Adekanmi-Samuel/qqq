import { Response } from "express";
import { attendanceService } from "../services/attendance.service";
import { AuthenticatedRequest } from "../types";
import { prisma } from "../lib/prisma";

const SCHOOL_WIDE_ROLES = new Set(["SUPER_ADMIN", "SCHOOL_ADMIN", "PRINCIPAL"]);

export class AttendanceController {
  /**
   * Role-aware access check for attendance reads inside a school.
   * Returns null when allowed, or a Response payload describing the denial.
   */
  private async canReadClassArm(req: AuthenticatedRequest, schoolId: string, classArmId: string): Promise<Response | null> {
    const role = req.user?.role;
    const userId = req.user?.userId;
    if (!role || !userId) {
      return req.res!.status(401).json({ success: false, error: "Unauthorized." });
    }
    if (SCHOOL_WIDE_ROLES.has(role)) return null;

    const arm = await prisma.classArm.findFirst({
      where: {
        id: classArmId,
        class: { schoolId },
      },
      select: {
        id: true,
        classTeacherId: true,
      },
    });
    if (!arm) {
      return req.res!.status(403).json({ success: false, error: "You do not have permission for this class arm." });
    }
    if (role === "TEACHER") {
      const assignment = await prisma.subjectTeacher.findFirst({
        where: {
          classArmId: arm.id,
          teacherId: userId,
          schoolId,
        },
        select: { id: true },
      });
      if (!assignment && arm.classTeacherId !== userId) {
        return req.res!.status(403).json({ success: false, error: "You do not have permission for this class arm." });
      }
    }
    return null;
  }

  private async canReadStudent(req: AuthenticatedRequest, schoolId: string, studentId: string): Promise<Response | null> {
    const role = req.user?.role;
    const userId = req.user?.userId;
    if (!role || !userId) {
      return req.res!.status(401).json({ success: false, error: "Unauthorized." });
    }
    if (SCHOOL_WIDE_ROLES.has(role)) return null;

    const student = await prisma.student.findFirst({
      where: { id: studentId, schoolId },
      select: { id: true, armId: true },
    });
    if (!student) {
      return req.res!.status(403).json({ success: false, error: "You do not have permission for this student." });
    }
    if (role === "TEACHER") {
      if (student.armId) {
        const assignment = await prisma.subjectTeacher.findFirst({
          where: {
            classArmId: student.armId,
            teacherId: userId,
            schoolId,
          },
          select: { id: true },
        });
        if (!assignment) {
          return req.res!.status(403).json({ success: false, error: "You do not have permission for this student." });
        }
      } else {
        return req.res!.status(403).json({ success: false, error: "You do not have permission for this student." });
      }
    }
    if (role === "BURSAR") {
      return req.res!.status(403).json({ success: false, error: "You do not have permission for this student." });
    }
    return null;
  }

  /**
   * GET /api/attendance — get attendance records
   */
  async get(req: AuthenticatedRequest, res: Response) {
    try {
      const schoolId = req.tenantId || req.user?.schoolId;
      if (!schoolId) return res.status(400).json({ success: false, error: "Tenant not identified." });

      const { classArmId, date, studentId } = req.query;

      if (studentId) {
        const denied = await this.canReadStudent(req, schoolId, studentId as string);
        if (denied) return denied;
        const records = await attendanceService.getByStudent(
          schoolId,
          studentId as string,
          req.query.startDate as string,
          req.query.endDate as string
        );
        return res.json({ success: true, data: records });
      }

      if (!classArmId) {
        return res.status(400).json({
          success: false,
          error: "classArmId or studentId is required.",
        });
      }

      const denied = await this.canReadClassArm(req, schoolId, classArmId as string);
      if (denied) return denied;

      const records = await attendanceService.get(schoolId, classArmId as string, date as string);
      res.json({ success: true, data: records });
    } catch (error: any) {
      res.status(500).json({ success: false, error: "Failed to fetch attendance." });
    }
  }

  /**
   * POST /api/attendance — mark attendance
   */
  async mark(req: AuthenticatedRequest, res: Response) {
    try {
      const schoolId = req.tenantId || req.user?.schoolId;
      if (!schoolId) return res.status(400).json({ success: false, error: "Tenant not identified." });

      const userId = req.user?.userId;
      if (!userId) return res.status(401).json({ success: false, error: "Unauthorized." });

      const incoming = Array.isArray(req.body?.records) ? req.body.records : [];
      if (!incoming.length) {
        return res.status(400).json({
          success: false,
          error: "No attendance records to save. Mark at least one student first.",
        });
      }

      const records = incoming
        .filter((r: any) => r?.studentId && r?.classArmId)
        .map((r: any) => ({
          studentId: r.studentId,
          classArmId: r.classArmId,
          status: r.status || "PRESENT",
          date: r.date,
          markedById: userId,
        }));

      if (!records.length) {
        return res.status(400).json({
          success: false,
          error: "Attendance records are missing student or class arm ids.",
        });
      }

      const result = await attendanceService.mark(schoolId, records);
      res.status(200).json({
        success: true,
        message: "Attendance saved.",
        data: result,
      });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        error: error.message || "Failed to save attendance.",
      });
    }
  }

  /**
   * GET /api/attendance/report — attendance report
   */
  async report(req: AuthenticatedRequest, res: Response) {
    try {
      const schoolId = req.tenantId || req.user?.schoolId;
      if (!schoolId) return res.status(400).json({ success: false, error: "Tenant not identified." });

      const { classArmId, startDate, endDate } = req.query;

      if (!classArmId) {
        return res.status(400).json({
          success: false,
          error: "classArmId is required.",
        });
      }

      const denied = await this.canReadClassArm(req, schoolId, classArmId as string);
      if (denied) return denied;

      const report = await attendanceService.report(
        schoolId,
        classArmId as string,
        startDate as string,
        endDate as string
      );
      res.json({ success: true, data: report });
    } catch (error: any) {
      res.status(500).json({ success: false, error: "Failed to generate report." });
    }
  }
}

export const attendanceController = new AttendanceController();
