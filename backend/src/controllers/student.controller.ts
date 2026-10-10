import { Response } from "express";
import { studentService } from "../services/student.service";
import { AuthenticatedRequest } from "../types";
import { getParam } from "../utils/getParam";
import { prisma } from "../lib/prisma";
import { sendSuccess, sendError } from "../utils/response";

export class StudentController {
  /**
   * GET /api/students -- list students
   */
  async list(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = (req.tenantId || req.user?.schoolId) as string;
      if (!tenantId) {
        sendError(res, 400, "BAD_REQUEST", "Tenant not identified.", undefined, req.requestId);
        return;
      }
      const { classId, armId } = req.query;
      const students = await studentService.list({
        schoolId: tenantId,
        classId: classId as string,
        armId: armId as string,
      });
      sendSuccess(res, students);
    } catch (error: any) {
      sendError(res, error.statusCode || 500, error.code || "SERVER_ERROR", error.message || "Failed to fetch students.", undefined, req.requestId);
    }
  }

  /**
   * GET /api/students/:id -- full student profile
   */
  async getById(req: AuthenticatedRequest, res: Response) {
    try {
      const id = getParam(req, "id")!;
      const tenantId = (req.tenantId || req.user?.schoolId) as string;
      if (!tenantId) {
        sendError(res, 400, "BAD_REQUEST", "Tenant not identified.", undefined, req.requestId);
        return;
      }
      const student = await studentService.getById(id, tenantId);
      sendSuccess(res, student);
    } catch (error: any) {
      sendError(res, error.statusCode || 500, error.code || "SERVER_ERROR", error.message || "Failed to fetch student.", undefined, req.requestId);
    }
  }

  /**
   * POST /api/students -- add student
   */
  async create(req: AuthenticatedRequest, res: Response) {
    try {
      const payload = { ...req.body, schoolId: (req.tenantId || req.user?.schoolId) as string };
      const student = await studentService.create(payload);
      res.status(201);
      sendSuccess(res, student);
    } catch (error: any) {
      sendError(res, error.statusCode || 500, error.code || "SERVER_ERROR", error.message || "Failed to add student.", undefined, req.requestId);
    }
  }

  /**
   * POST /api/students/bulk -- bulk import
   */
  async bulkCreate(req: AuthenticatedRequest, res: Response) {
    try {
      const students = req.body.students as Array<Record<string, any>>;
      const schoolId = (req.tenantId || req.user?.schoolId) as string;
      if (!schoolId) {
        sendError(res, 400, "BAD_REQUEST", "Tenant not identified.", undefined, req.requestId);
        return;
      }

      // Resolve class/arm names to IDs
      const classNames: string[] = [...new Set(students.filter((s: any) => s.className).map((s: any) => s.className))];
      const armNames: string[] = [...new Set(students.filter((s: any) => s.armName && s.className).map((s: any) => `${s.className}:${s.armName}`))];

      const classes = await prisma.class.findMany({
        where: { schoolId, name: { in: classNames } },
        select: { id: true, name: true },
      });
      const classMap = new Map(classes.map(c => [c.name, c.id]));

      const arms = await prisma.classArm.findMany({
        where: { class: { schoolId }, name: { in: armNames.map(a => a.split(":")[1]) } },
        select: { id: true, name: true, class: { select: { name: true } } },
      });
      const armMap = new Map(arms.map(a => [`${a.class.name}:${a.name}`, a.id]));

      const enriched = students.map((s: any) => ({
        schoolId,
        admissionNumber: s.admissionNumber,
        fullName: s.fullName,
        gender: s.gender || undefined,
        classId: s.className ? classMap.get(s.className) || undefined : undefined,
        armId: (s.className && s.armName) ? armMap.get(`${s.className}:${s.armName}`) || undefined : undefined,
        parentName: s.parentName || undefined,
        parentPhone: s.parentPhone || undefined,
        parentEmail: s.parentEmail || undefined,
      }));

      const result = await studentService.bulkCreate(schoolId, enriched);
      res.status(201);
      sendSuccess(res, result);
    } catch (error: any) {
      sendError(res, error.statusCode || 500, error.code || "SERVER_ERROR", error.message || "Failed to import students.", undefined, req.requestId);
    }
  }

  /**
   * PATCH /api/students/:id -- update student
   */
  async update(req: AuthenticatedRequest, res: Response) {
    try {
      const id = getParam(req, "id")!;
      const schoolId = (req.tenantId || req.user?.schoolId) as string;
      const student = await studentService.update(id, schoolId, req.body);
      sendSuccess(res, student);
    } catch (error: any) {
      sendError(res, error.statusCode || 500, error.code || "SERVER_ERROR", error.message || "Failed to update student.", undefined, req.requestId);
    }
  }

  /**
   * DELETE /api/students/:id -- archive (soft delete)
   */
  async archive(req: AuthenticatedRequest, res: Response) {
    try {
      const id = getParam(req, "id")!;
      const schoolId = (req.tenantId || req.user?.schoolId) as string;
      await studentService.archive(id, schoolId);
      sendSuccess(res, null);
    } catch (error: any) {
      sendError(res, error.statusCode || 500, error.code || "SERVER_ERROR", error.message || "Failed to archive student.", undefined, req.requestId);
    }
  }

  /**
   * POST /api/students/promote -- promote students
   */
  async promote(req: AuthenticatedRequest, res: Response) {
    try {
      const { studentIds, newClassId, newArmId } = req.body as { studentIds: string[]; newClassId: string; newArmId?: string };
      const schoolId = req.tenantId || req.user?.schoolId;
      const result = await studentService.promote(studentIds, newClassId, newArmId, schoolId);
      sendSuccess(res, result);
    } catch (error: any) {
      sendError(res, error.statusCode || 500, error.code || "SERVER_ERROR", error.message || "Failed to promote students.", undefined, req.requestId);
    }
  }

  /**
   * POST /api/students/:id/create-account -- create login account for student
   */
  async createAccount(req: AuthenticatedRequest, res: Response) {
    try {
      const id = getParam(req, "id")!;
      const tenantId = (req.tenantId || req.user?.schoolId) as string;
      if (!tenantId) {
        sendError(res, 400, "BAD_REQUEST", "Tenant not identified.", undefined, req.requestId);
        return;
      }

      const { email, password } = req.body;
      const result = await studentService.createStudentAccount(id, tenantId, email, password);
      res.status(201);
      sendSuccess(res, result);
    } catch (error: any) {
      sendError(res, error.statusCode || 500, error.code || "SERVER_ERROR", error.message || "Failed to create student account.", undefined, req.requestId);
    }
  }
}

export const studentController = new StudentController();
