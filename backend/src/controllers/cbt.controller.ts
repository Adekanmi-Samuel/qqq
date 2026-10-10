import { Request, Response, NextFunction } from "express";
import { cbtService } from "../services/cbt.service";
import { AuthenticatedRequest } from "../types";

export class CBTController {
  // ===== CBT Subject =====
  async createSubject(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.user!.schoolId!;
      const subject = await cbtService.createSubject(schoolId, req.body);
      res.status(201).json({ success: true, data: subject });
    } catch (error) {
      next(error);
    }
  }

  async getSubjects(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.user!.schoolId!;
      const { examType } = req.query;
      const subjects = await cbtService.getSubjects(schoolId, examType as string);
      res.json({ success: true, data: subjects });
    } catch (error) {
      next(error);
    }
  }

  async getSubjectById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.user!.schoolId!;
      const id = req.params.id as string;
      const subject = await cbtService.getSubjectById(id, schoolId);
      if (!subject) {
        return res.status(404).json({ success: false, error: "Subject not found" });
      }
      res.json({ success: true, data: subject });
    } catch (error) {
      next(error);
    }
  }

  async updateSubject(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.user!.schoolId!;
      const id = req.params.id as string;
      const subject = await cbtService.updateSubject(id, schoolId, req.body);
      res.json({ success: true, data: subject });
    } catch (error) {
      next(error);
    }
  }

  async deleteSubject(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.user!.schoolId!;
      const id = req.params.id as string;
      await cbtService.deleteSubject(id, schoolId);
      res.json({ success: true, message: "Subject deleted" });
    } catch (error) {
      next(error);
    }
  }

  // ===== CBT Topic =====
  async createTopic(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.user!.schoolId!;
      const topic = await cbtService.createTopic(schoolId, req.body);
      res.status(201).json({ success: true, data: topic });
    } catch (error) {
      next(error);
    }
  }

  async getTopics(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.user!.schoolId!;
      const subjectId = req.params.subjectId as string;
      const topics = await cbtService.getTopics(schoolId, subjectId);
      res.json({ success: true, data: topics });
    } catch (error) {
      next(error);
    }
  }

  async getTopicById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.user!.schoolId!;
      const id = req.params.id as string;
      const topic = await cbtService.getTopicById(id, schoolId);
      if (!topic) {
        return res.status(404).json({ success: false, error: "Topic not found" });
      }
      res.json({ success: true, data: topic });
    } catch (error) {
      next(error);
    }
  }

  async updateTopic(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.user!.schoolId!;
      const id = req.params.id as string;
      const topic = await cbtService.updateTopic(id, schoolId, req.body);
      res.json({ success: true, data: topic });
    } catch (error) {
      next(error);
    }
  }

  async deleteTopic(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.user!.schoolId!;
      const id = req.params.id as string;
      await cbtService.deleteTopic(id, schoolId);
      res.json({ success: true, message: "Topic deleted" });
    } catch (error) {
      next(error);
    }
  }

  // ===== CBT Question =====
  async createQuestion(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.user!.schoolId!;
      const question = await cbtService.createQuestion(schoolId, req.body);
      res.status(201).json({ success: true, data: question });
    } catch (error) {
      next(error);
    }
  }

  async bulkCreateQuestions(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.user!.schoolId!;
      const { questions } = req.body;
      if (!Array.isArray(questions) || questions.length === 0) {
        return res.status(400).json({ success: false, error: "Questions array is required" });
      }
      const result = await cbtService.bulkCreateQuestions(schoolId, questions);
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async getQuestions(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.user!.schoolId!;
      const { subjectId, topicId, examType, year, difficulty, limit, offset } = req.query;

      const { questions, total } = await cbtService.getQuestions(schoolId, {
        subjectId: subjectId as string,
        topicId: topicId as string,
        examType: examType as string,
        year: year ? parseInt(year as string) : undefined,
        difficulty: difficulty as string,
        limit: limit ? parseInt(limit as string) : 50,
        offset: offset ? parseInt(offset as string) : 0,
      });

      res.json({ success: true, data: questions, total });
    } catch (error) {
      next(error);
    }
  }

  async getQuestionById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.user!.schoolId!;
      const id = req.params.id as string;
      const question = await cbtService.getQuestionById(id, schoolId);
      if (!question) {
        return res.status(404).json({ success: false, error: "Question not found" });
      }
      res.json({ success: true, data: question });
    } catch (error) {
      next(error);
    }
  }

  async getRandomQuestions(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.user!.schoolId!;
      const { subjectId, count, examType, year, topicId, difficulty } = req.query;

      if (!subjectId || !count) {
        return res.status(400).json({ success: false, error: "subjectId and count are required" });
      }

      const questions = await cbtService.getRandomQuestions(
        schoolId,
        subjectId as string,
        parseInt(count as string),
        {
          examType: examType as string,
          year: year ? parseInt(year as string) : undefined,
          topicId: topicId as string,
          difficulty: difficulty as string,
        }
      );

      res.json({ success: true, data: questions });
    } catch (error) {
      next(error);
    }
  }

  async getQuestionStats(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.user!.schoolId!;
      const subjectId = req.params.subjectId as string;
      const stats = await cbtService.getQuestionStats(schoolId, subjectId);
      res.json({ success: true, data: stats });
    } catch (error) {
      next(error);
    }
  }

  async updateQuestion(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.user!.schoolId!;
      const id = req.params.id as string;
      const question = await cbtService.updateQuestion(id, schoolId, req.body);
      res.json({ success: true, data: question });
    } catch (error) {
      next(error);
    }
  }

  async deleteQuestion(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.user!.schoolId!;
      const id = req.params.id as string;
      await cbtService.deleteQuestion(id, schoolId);
      res.json({ success: true, message: "Question deleted" });
    } catch (error) {
      next(error);
    }
  }

  // ===== CBT Attempt =====
  async createAttempt(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.user!.schoolId!;
      const attempt = await cbtService.createAttempt(schoolId, req.body);
      res.status(201).json({ success: true, data: attempt });
    } catch (error) {
      next(error);
    }
  }

  async submitAttempt(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.user!.schoolId!;
      const attemptId = req.params.attemptId as string;
      const { answers } = req.body;
      const attempt = await cbtService.submitAttempt(attemptId, schoolId, answers);
      res.json({ success: true, data: attempt });
    } catch (error) {
      next(error);
    }
  }

  async getAttempts(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.user!.schoolId!;
      const { studentId, subjectId, examType, mode, limit, offset } = req.query;

      const { attempts, total } = await cbtService.getAttempts(schoolId, {
        studentId: studentId as string,
        subjectId: subjectId as string,
        examType: examType as string,
        mode: mode as string,
        limit: limit ? parseInt(limit as string) : 20,
        offset: offset ? parseInt(offset as string) : 0,
      });

      res.json({ success: true, data: attempts, total });
    } catch (error) {
      next(error);
    }
  }

  async getAttemptById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.user!.schoolId!;
      const id = req.params.id as string;
      const attempt = await cbtService.getAttemptById(id, schoolId);
      if (!attempt) {
        return res.status(404).json({ success: false, error: "Attempt not found" });
      }
      res.json({ success: true, data: attempt });
    } catch (error) {
      next(error);
    }
  }

  async getStudentStats(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.user!.schoolId!;
      const studentId = req.params.studentId as string;
      const stats = await cbtService.getStudentStats(schoolId, studentId);
      res.json({ success: true, data: stats });
    } catch (error) {
      next(error);
    }
  }

  async getMyStats(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.user!.schoolId!;
      const studentId = req.user!.userId!;
      const stats = await cbtService.getStudentStats(schoolId, studentId);
      res.json({ success: true, data: stats });
    } catch (error) {
      next(error);
    }
  }

  // ===== CBT Session =====
  async createSession(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.user!.schoolId!;
      const session = await cbtService.createSession(schoolId, req.body);
      res.status(201).json({ success: true, data: session });
    } catch (error) {
      next(error);
    }
  }

  async getSessionById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.user!.schoolId!;
      const id = req.params.id as string;
      const session = await cbtService.getSessionById(id, schoolId);
      if (!session) {
        return res.status(404).json({ success: false, error: "Session not found" });
      }
      res.json({ success: true, data: session });
    } catch (error) {
      next(error);
    }
  }

  async getActiveSession(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.user!.schoolId!;
      const studentId = req.user!.role === "STUDENT" ? req.user!.userId : req.query.studentId as string;

      if (!studentId) {
        return res.status(400).json({ success: false, error: "studentId is required" });
      }

      const session = await cbtService.getActiveSession(studentId, schoolId);
      res.json({ success: true, data: session });
    } catch (error) {
      next(error);
    }
  }

  async updateSessionAnswers(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.user!.schoolId!;
      const id = req.params.id as string;
      const { answers, currentQuestionIndex } = req.body;
      const session = await cbtService.updateSessionAnswers(id, schoolId, answers, currentQuestionIndex);
      res.json({ success: true, data: session });
    } catch (error) {
      next(error);
    }
  }

  async completeSession(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.user!.schoolId!;
      const id = req.params.id as string;
      await cbtService.completeSession(id, schoolId);
      res.json({ success: true, message: "Session completed" });
    } catch (error) {
      next(error);
    }
  }

  async getStudentSessions(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.user!.schoolId!;
      const studentId = req.user!.role === "STUDENT" ? req.user!.userId : req.query.studentId as string;
      const { limit, offset } = req.query;

      if (!studentId) {
        return res.status(400).json({ success: false, error: "studentId is required" });
      }

      const { sessions, total } = await cbtService.getStudentSessions(
        schoolId,
        studentId,
        limit ? parseInt(limit as string) : 20,
        offset ? parseInt(offset as string) : 0
      );

      res.json({ success: true, data: sessions, total });
    } catch (error) {
      next(error);
    }
  }
}

export const cbtController = new CBTController();
