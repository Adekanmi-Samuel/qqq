import { Response } from "express";
import { resultService } from "../services/result.service";
import { AuthenticatedRequest } from "../types";
import { prisma } from "../lib/prisma";

export class ResultController {
  /**
   * GET /api/results?session=&term=
   * List results for the teacher's assigned subjects/arms, or all results for admins.
   */
  async listResults(req: AuthenticatedRequest, res: Response) {
    try {
      const schoolId = req.tenantId || req.user?.schoolId;
      const userId = req.user?.userId;
      const role = req.user?.role;
      if (!schoolId) return res.status(400).json({ success: false, error: "Tenant not identified." });

      const { session, term } = req.query;
      const where: any = { classArm: { schoolId } };
      if (session) where.session = session as string;
      if (term) where.term = parseInt(term as string);

      // For teachers, only show results from their assigned arms/subjects
      let armFilter = "";
      let subjectFilter = "";
      const params: any[] = [schoolId];
      let paramIdx = 2;

      if (role === "TEACHER") {
        const assignments = await prisma.subjectTeacher.findMany({
          where: { teacherId: userId },
          select: { classArmId: true, subjectId: true },
        });
        if (assignments.length === 0) {
          return res.json({ success: true, data: [] });
        }
        const armIds = assignments.map(a => a.classArmId);
        const subjectIds = assignments.map(a => a.subjectId);
        armFilter = `AND tr."classArmId" IN (${armIds.map((_, i) => `$${paramIdx + i}`).join(",")})`;
        params.push(...armIds);
        paramIdx += armIds.length;
        subjectFilter = `AND tr."subjectId" IN (${subjectIds.map((_, i) => `$${paramIdx + i}`).join(",")})`;
        params.push(...subjectIds);
      }

      let sessionFilter = "";
      let termFilter = "";
      if (session) {
        sessionFilter = `AND tr.session = $${paramIdx}`;
        params.push(session);
        paramIdx++;
      }
      if (term) {
        termFilter = `AND tr.term = $${paramIdx}`;
        params.push(parseInt(term as string));
        paramIdx++;
      }

      const results = await prisma.$queryRawUnsafe(`
        SELECT tr.id, tr."caScore", tr."examScore", tr."totalScore",
               tr.grade, tr.term, tr.session,
               st."fullName" AS "studentName",
               st."admissionNumber" AS "admissionNumber",
               sub.name AS subject,
               cls.name AS class,
               ca.id AS "classArmId",
               tr."subjectId" AS "subjectId",
               tr."studentId" AS "studentId"
        FROM term_results tr
        JOIN students st ON st.id = tr."studentId"
        JOIN subjects sub ON sub.id = tr."subjectId"
        JOIN class_arms ca ON ca.id = tr."classArmId"
        JOIN classes cls ON cls.id = ca."classId"
        WHERE cls."schoolId" = $1 ${armFilter} ${subjectFilter} ${sessionFilter} ${termFilter}
        ORDER BY tr."createdAt" DESC
        LIMIT 500
      `, ...params);

      res.json({ success: true, data: results });
    } catch (error: any) {
      console.error("[results/list]", error?.message || error);
      res.status(500).json({ success: false, error: "Failed to fetch results." });
    }
  }

  /**
   * GET /api/results/sessions
   */
  async getSessions(req: AuthenticatedRequest, res: Response) {
    try {
      const schoolId = req.tenantId || req.user?.schoolId;
      if (!schoolId) return res.status(400).json({ success: false, error: "Tenant not identified." });

      const sessions = await resultService.getSessions(schoolId);
      res.json({ success: true, data: sessions });
    } catch (error: any) {
      res.status(500).json({ success: false, error: "Failed to fetch sessions." });
    }
  }

  /**
   * GET /api/results/load-sheet?classArmId=&subjectId=&session=&term=
   */
  async getLoadSheet(req: AuthenticatedRequest, res: Response) {
    try {
      const schoolId = req.tenantId || req.user?.schoolId;
      if (!schoolId) return res.status(400).json({ success: false, error: "Tenant not identified." });

      const { classArmId, subjectId, session, term } = req.query;
      if (!classArmId || !subjectId || !session || !term) {
        return res.status(400).json({ success: false, error: "classArmId, subjectId, session, and term are required." });
      }

      const sheet = await resultService.getLoadSheet({
        schoolId,
        classArmId: classArmId as string,
        subjectId: subjectId as string,
        session: session as string,
        term: parseInt(term as string),
      });

      res.json({ success: true, data: sheet });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        error: error.message || "Failed to load sheet.",
      });
    }
  }

  /**
   * PUT /api/results/batch — bulk save scores
   */
  async batchSave(req: AuthenticatedRequest, res: Response) {
    try {
      const schoolId = req.tenantId || req.user?.schoolId;
      if (!schoolId) return res.status(400).json({ success: false, error: "Tenant not identified." });

      const { classArmId, subjectId, session, term, scores } = req.body;
      const results = await resultService.batchSave({
        schoolId,
        classArmId,
        subjectId,
        session,
        term,
        scores,
      });

      res.json({ success: true, message: `${results.length} scores saved.`, data: results });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        error: error.message || "Failed to save scores.",
      });
    }
  }

  /**
   * POST /api/results/lock
   */
  async lock(req: AuthenticatedRequest, res: Response) {
    try {
      const { classArmId, subjectId, session, term } = req.body;
      const result = await resultService.lock({ classArmId, subjectId, session, term });
      res.json({ success: true, ...result });
    } catch (error: any) {
      res.status(500).json({ success: false, error: "Failed to lock results." });
    }
  }

  /**
   * POST /api/results/unlock
   */
  async unlock(req: AuthenticatedRequest, res: Response) {
    try {
      const { classArmId, subjectId, session, term } = req.body;
      const result = await resultService.unlock({ classArmId, subjectId, session, term });
      res.json({ success: true, ...result });
    } catch (error: any) {
      res.status(500).json({ success: false, error: "Failed to unlock results." });
    }
  }

  /**
   * GET /api/results/subjects?classArmId=
   */
  async getSubjectsForArm(req: AuthenticatedRequest, res: Response) {
    try {
      const { classArmId } = req.query;
      if (!classArmId) return res.status(400).json({ success: false, error: "classArmId is required." });
      const subjects = await resultService.getSubjectsForArm(classArmId as string);
      res.json({ success: true, data: subjects });
    } catch (error: any) {
      res.status(500).json({ success: false, error: "Failed to fetch subjects." });
    }
  }
}

export const resultController = new ResultController();
