import { Router } from "express";
import { z } from "zod";
import { examController } from "../controllers/exam.controller";

const router = Router();

// Validation schemas
const createExamSchema = z.object({
  title: z.string().min(2, "Title is required."),
  instructions: z.string().optional(),
  duration: z.number().min(1, "Duration must be at least 1 minute."),
  classArmId: z.string().uuid(),
  subjectId: z.string().uuid(),
  session: z.string().min(4),
  term: z.number().min(1).max(3),
});

const addQuestionSchema = z.object({
  questionText: z.string().min(5, "Question text is required."),
  optionA: z.string().min(1),
  optionB: z.string().min(1),
  optionC: z.string().min(1),
  optionD: z.string().min(1),
  correctAnswer: z.enum(["A", "B", "C", "D"]),
  marks: z.number().min(1).default(1),
});

const bulkQuestionsSchema = z.object({
  questions: z.array(addQuestionSchema).min(1),
});

const submitSchema = z.object({
  studentId: z.string().uuid(),
  answers: z.record(z.string(), z.string()),
});

// GET /api/exams — list
router.get("/", (req, res) => examController.list(req, res));

// POST /api/exams — create
router.post("/", async (req, res, next) => {
  try {
    req.body = createExamSchema.parse(req.body);
    await examController.create(req, res);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: error.errors.map(e => e.message).join(" | ") });
    }
    next(error);
  }
});

// GET /api/exams/student/:studentId — student's exams (must be before :id)
router.get("/student/:studentId", (req, res) => examController.getStudentExams(req, res));

// GET /api/exams/:id — get with questions
router.get("/:id", (req, res) => examController.getById(req, res));

// PUT /api/exams/:id — update
router.put("/:id", async (req, res, next) => {
  try {
    await examController.update(req, res);
  } catch (error) {
    next(error);
  }
});

// POST /api/exams/:id/questions — add question
router.post("/:id/questions", async (req, res, next) => {
  try {
    req.body = addQuestionSchema.parse(req.body);
    await examController.addQuestion(req, res);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: error.errors.map(e => e.message).join(" | ") });
    }
    next(error);
  }
});

// POST /api/exams/:id/questions/bulk — bulk add
router.post("/:id/questions/bulk", async (req, res, next) => {
  try {
    req.body = bulkQuestionsSchema.parse(req.body);
    await examController.bulkAddQuestions(req, res);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: error.errors.map(e => e.message).join(" | ") });
    }
    next(error);
  }
});

// DELETE /api/exams/questions/:id
router.delete("/questions/:id", (req, res) => examController.deleteQuestion(req, res));

// POST /api/exams/:id/submit
router.post("/:id/submit", async (req, res, next) => {
  try {
    req.body = submitSchema.parse(req.body);
    await examController.submit(req, res);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: error.errors.map(e => e.message).join(" | ") });
    }
    next(error);
  }
});

// GET /api/exams/:id/attempts
router.get("/:id/attempts", (req, res) => examController.getAttempts(req, res));

export default router;
