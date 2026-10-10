import { Router } from "express";
import { z } from "zod";
import { cbtController } from "../controllers/cbt.controller";
import { authenticate } from "../middleware/auth";

const router = Router();

// All CBT routes require authentication
router.use(authenticate);

// Validation schemas
const createSubjectSchema = z.object({
  name: z.string().min(1, "Subject name is required"),
  code: z.string().optional(),
  description: z.string().optional(),
});

const createTopicSchema = z.object({
  name: z.string().min(1, "Topic name is required"),
  description: z.string().optional(),
  order: z.number().int().min(0).optional(),
});

const createQuestionSchema = z.object({
  questionText: z.string().min(5, "Question text is required"),
  questionType: z.enum(["MULTIPLE_CHOICE", "TRUE_FALSE", "ESSAY"]).optional().default("MULTIPLE_CHOICE"),
  options: z.array(z.object({
    text: z.string().min(1),
    isCorrect: z.boolean(),
  })).min(2).optional(),
  correctAnswer: z.string().optional(),
  explanation: z.string().optional(),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]).optional().default("MEDIUM"),
  marks: z.number().int().min(1).optional().default(1),
  subjectId: z.string().uuid(),
  topicId: z.string().uuid().optional(),
  year: z.number().int().optional(),
  examType: z.string().optional(),
});

const bulkQuestionsSchema = z.object({
  questions: z.array(createQuestionSchema).min(1, "At least one question is required"),
});

const createAttemptSchema = z.object({
  subjectId: z.string().uuid(),
  examType: z.string().optional(),
  mode: z.enum(["PRACTICE", "EXAM"]).optional().default("PRACTICE"),
});

const submitAttemptSchema = z.object({
  answers: z.record(z.string(), z.string()),
});

const createSessionSchema = z.object({
  subjectId: z.string().uuid(),
  topicId: z.string().uuid().optional(),
  questionCount: z.number().int().min(1).max(100).optional().default(10),
  timeLimit: z.number().int().min(1).max(300).optional(),
});

const updateAnswersSchema = z.object({
  answers: z.record(z.string(), z.string()),
  currentQuestionIndex: z.number().int().min(0).optional(),
});

// ===== CBT Subject Routes =====
router.post("/subjects", async (req, res, next) => {
  try {
    req.body = createSubjectSchema.parse(req.body);
    await cbtController.createSubject(req, res, next);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: error.errors.map(e => e.message).join(" | ") });
    }
    next(error);
  }
});
router.get("/subjects", (req, res, next) => cbtController.getSubjects(req, res, next));
router.get("/subjects/:id", (req, res, next) => cbtController.getSubjectById(req, res, next));
router.put("/subjects/:id", async (req, res, next) => {
  try {
    req.body = createSubjectSchema.partial().parse(req.body);
    await cbtController.updateSubject(req, res, next);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: error.errors.map(e => e.message).join(" | ") });
    }
    next(error);
  }
});
router.delete("/subjects/:id", (req, res, next) => cbtController.deleteSubject(req, res, next));

// ===== CBT Topic Routes =====
router.post("/subjects/:subjectId/topics", async (req, res, next) => {
  try {
    req.body = createTopicSchema.parse(req.body);
    await cbtController.createTopic(req, res, next);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: error.errors.map(e => e.message).join(" | ") });
    }
    next(error);
  }
});
router.get("/subjects/:subjectId/topics", (req, res, next) => cbtController.getTopics(req, res, next));
router.get("/topics/:id", (req, res, next) => cbtController.getTopicById(req, res, next));
router.put("/topics/:id", async (req, res, next) => {
  try {
    req.body = createTopicSchema.partial().parse(req.body);
    await cbtController.updateTopic(req, res, next);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: error.errors.map(e => e.message).join(" | ") });
    }
    next(error);
  }
});
router.delete("/topics/:id", (req, res, next) => cbtController.deleteTopic(req, res, next));

// ===== CBT Question Routes =====
router.post("/questions", async (req, res, next) => {
  try {
    req.body = createQuestionSchema.parse(req.body);
    await cbtController.createQuestion(req, res, next);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: error.errors.map(e => e.message).join(" | ") });
    }
    next(error);
  }
});
router.post("/questions/bulk", async (req, res, next) => {
  try {
    req.body = bulkQuestionsSchema.parse(req.body);
    await cbtController.bulkCreateQuestions(req, res, next);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: error.errors.map(e => e.message).join(" | ") });
    }
    next(error);
  }
});
router.get("/questions", (req, res, next) => cbtController.getQuestions(req, res, next));
router.get("/questions/random", (req, res, next) => cbtController.getRandomQuestions(req, res, next));
router.get("/questions/stats/:subjectId", (req, res, next) => cbtController.getQuestionStats(req, res, next));
router.get("/questions/:id", (req, res, next) => cbtController.getQuestionById(req, res, next));
router.put("/questions/:id", async (req, res, next) => {
  try {
    req.body = createQuestionSchema.partial().parse(req.body);
    await cbtController.updateQuestion(req, res, next);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: error.errors.map(e => e.message).join(" | ") });
    }
    next(error);
  }
});
router.delete("/questions/:id", (req, res, next) => cbtController.deleteQuestion(req, res, next));

// ===== CBT Attempt Routes =====
router.post("/attempts", async (req, res, next) => {
  try {
    req.body = createAttemptSchema.parse(req.body);
    await cbtController.createAttempt(req, res, next);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: error.errors.map(e => e.message).join(" | ") });
    }
    next(error);
  }
});
router.post("/attempts/:attemptId/submit", async (req, res, next) => {
  try {
    req.body = submitAttemptSchema.parse(req.body);
    await cbtController.submitAttempt(req, res, next);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: error.errors.map(e => e.message).join(" | ") });
    }
    next(error);
  }
});
router.get("/attempts", (req, res, next) => cbtController.getAttempts(req, res, next));
router.get("/attempts/:id", (req, res, next) => cbtController.getAttemptById(req, res, next));
router.get("/students/me/stats", (req, res, next) => cbtController.getMyStats(req, res, next));
router.get("/students/:studentId/stats", (req, res, next) => cbtController.getStudentStats(req, res, next));

// ===== CBT Session Routes =====
router.post("/sessions", async (req, res, next) => {
  try {
    req.body = createSessionSchema.parse(req.body);
    await cbtController.createSession(req, res, next);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: error.errors.map(e => e.message).join(" | ") });
    }
    next(error);
  }
});
router.get("/sessions", (req, res, next) => cbtController.getStudentSessions(req, res, next));
router.get("/sessions/active", (req, res, next) => cbtController.getActiveSession(req, res, next));
router.get("/sessions/:id", (req, res, next) => cbtController.getSessionById(req, res, next));
router.put("/sessions/:id/answers", async (req, res, next) => {
  try {
    req.body = updateAnswersSchema.parse(req.body);
    await cbtController.updateSessionAnswers(req, res, next);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: error.errors.map(e => e.message).join(" | ") });
    }
    next(error);
  }
});
router.post("/sessions/:id/complete", (req, res, next) => cbtController.completeSession(req, res, next));

export default router;
