import { Response } from "express";
import { examService } from "../services/exam.service";
import { AuthenticatedRequest } from "../types";

export class ExamController {
  /**
   * POST /api/exams — create exam
   */
  async create(req: AuthenticatedRequest, res: Response) {
    try {
      const schoolId = req.tenantId || req.user?.schoolId;
      if (!schoolId) return res.status(400).json({ success: false, error: "Tenant not identified." });

      // tenant fields must win over any client-supplied schoolId (mass assignment / tenant escape)
      const { schoolId: _bodySchoolId, ...rest } = req.body || {};
      const exam = await examService.create({ ...rest, schoolId });
      res.status(201).json({ success: true, message: "Exam created.", data: exam });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        error: error.message || "Failed to create exam.",
      });
    }
  }

  /**
   * PUT /api/exams/:id — update exam
   */
  async update(req: AuthenticatedRequest, res: Response) {
    try {
      const exam = await examService.update(req.params.id as string, req.body);
      res.json({ success: true, data: exam });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        error: error.message || "Failed to update exam.",
      });
    }
  }

  /**
   * GET /api/exams — list exams
   */
  async list(req: AuthenticatedRequest, res: Response) {
    try {
      const schoolId = req.tenantId || req.user?.schoolId;
      if (!schoolId) return res.status(400).json({ success: false, error: "Tenant not identified." });

      const { classArmId } = req.query;
      const exams = await examService.list(schoolId, classArmId as string);
      res.json({ success: true, data: exams });
    } catch (error: any) {
      res.status(500).json({ success: false, error: "Failed to fetch exams." });
    }
  }

  /**
   * GET /api/exams/:id — get exam with questions
   */
  async getById(req: AuthenticatedRequest, res: Response) {
    try {
      const includeAnswers = req.query.includeAnswers === "true";
      const exam = await examService.getById(req.params.id as string, includeAnswers);
      if (!exam) return res.status(404).json({ success: false, error: "Exam not found." });
      res.json({ success: true, data: exam });
    } catch (error: any) {
      res.status(500).json({ success: false, error: "Failed to fetch exam." });
    }
  }

  /**
   * POST /api/exams/:id/questions — add question
   */
  async addQuestion(req: AuthenticatedRequest, res: Response) {
    try {
      const question = await examService.addQuestion(req.params.id as string, req.body);
      res.status(201).json({ success: true, data: question });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        error: error.message || "Failed to add question.",
      });
    }
  }

  /**
   * POST /api/exams/:id/questions/bulk — bulk add questions
   */
  async bulkAddQuestions(req: AuthenticatedRequest, res: Response) {
    try {
      const { questions } = req.body;
      const result = await examService.bulkAddQuestions(req.params.id as string, questions);
      res.status(201).json({ success: true, message: `${result.count} question(s) added.` });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        error: error.message || "Failed to add questions.",
      });
    }
  }

  /**
   * DELETE /api/exams/questions/:id
   */
  async deleteQuestion(req: AuthenticatedRequest, res: Response) {
    try {
      const result = await examService.deleteQuestion(req.params.id as string);
      res.json({ success: true, ...result });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        error: error.message || "Failed to delete question.",
      });
    }
  }

  /**
   * POST /api/exams/:id/submit — submit exam
   */
  async submit(req: AuthenticatedRequest, res: Response) {
    try {
      const { studentId, answers } = req.body;
      const attempt = await examService.submitExam(req.params.id as string, studentId, answers);
      res.json({ success: true, data: attempt });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        error: error.message || "Failed to submit exam.",
      });
    }
  }

  /**
   * GET /api/exams/:id/attempts
   */
  async getAttempts(req: AuthenticatedRequest, res: Response) {
    try {
      const attempts = await examService.getAttempts(req.params.id as string);
      res.json({ success: true, data: attempts });
    } catch (error: any) {
      res.status(500).json({ success: false, error: "Failed to fetch attempts." });
    }
  }

  /**
   * GET /api/exams/student/:studentId — student's exams
   */
  async getStudentExams(req: AuthenticatedRequest, res: Response) {
    try {
      const exams = await examService.getStudentExams(req.params.studentId as string);
      res.json({ success: true, data: exams });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        error: error.message || "Failed to fetch exams.",
      });
    }
  }
}

export const examController = new ExamController();
