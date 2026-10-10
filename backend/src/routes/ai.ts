import { Router } from "express";
import { z } from "zod";
import { aiController } from "../controllers/ai.controller";
import { authenticate, authorize } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { aiLimiter } from "../middleware/rateLimiter";

const router = Router();

// All AI routes require authentication
router.use(authenticate);

// ─── Validation Schemas ───

const generateLessonSchema = z.object({
  schemeId: z.string().uuid("Invalid scheme ID."),
  weekNumber: z.number().int().min(1, "Week number must be at least 1."),
  force: z.boolean().optional().default(false),
});

const generateAssessmentSchema = z.object({
  schemeId: z.string().uuid("Invalid scheme ID."),
  examType: z.enum(["midterm", "exam"], { message: "examType must be 'midterm' or 'exam'." }),
  formatTemplate: z.string().optional(),
});

const completeWeekSchema = z.object({
  schemeId: z.string().uuid("Invalid scheme ID."),
  weekNumber: z.number().int().min(1, "Week number must be at least 1."),
});

const createSchemeSchema = z.object({
  subjectId: z.string().uuid("Invalid subject ID."),
  classId: z.string().uuid("Invalid class ID."),
  title: z.string().min(1, "Title is required."),
  session: z.string().min(1, "Session is required."),
  term: z.number().int().min(1).max(3),
  weeks: z.any(),
  periodsPerWeek: z.number().int().min(1).max(5).optional(),
  minutesPerPeriod: z.number().int().min(10).max(120).optional(),
});

const generatePastQuestionsSchema = z.object({
  subject: z.string().min(1, "Subject is required."),
  classLevel: z.string().min(1, "Class level is required."),
  topic: z.string().optional(),
  examBody: z.enum(["WAEC", "NECO", "JAMB"], { message: "examBody must be WAEC, NECO, or JAMB." }),
  count: z.number().int().min(1).max(100).optional(),
});

const generateMockExamSchema = z.object({
  examBody: z.enum(["WAEC", "NECO", "JAMB"], { message: "examBody must be WAEC, NECO, or JAMB." }),
  subjects: z.array(z.string()).min(1, "At least one subject is required."),
  classLevel: z.string().optional(),
});

const explainTopicSchema = z.object({
  subject: z.string().min(1, "Subject is required."),
  topic: z.string().min(1, "Topic is required."),
  classLevel: z.string().optional(),
  question: z.string().optional(),
});

const generateCommentSchema = z.object({
  studentName: z.string().min(1, "Student name is required."),
  averageScore: z.number(),
  attendanceRate: z.number(),
  bestSubject: z.string(),
  weakestSubject: z.string(),
  commentType: z.enum(["classTeacher", "principal"]),
  tone: z.string().optional(),
});

const generateSchemeSchema = z.object({
  subject: z.string().min(1, "Subject is required."),
  classLevel: z.string().min(1, "Class level is required."),
  term: z.number().int().min(1).max(3),
  session: z.string().optional(),
  totalWeeks: z.number().int().min(1).max(20).optional(),
});

const saveQuestionsSchema = z.object({
  schemeId: z.string().uuid("Invalid scheme ID."),
  questions: z.any(),
});

// ─── GET Routes ───

router.get("/schemes", (req, res, next) => {
  try {
    aiController.listSchemes(req, res);
  } catch (error) {
    next(error);
  }
});

router.get("/schemes/:id", (req, res, next) => {
  try {
    aiController.getScheme(req, res);
  } catch (error) {
    next(error);
  }
});

router.get("/lesson-notes/:schemeId", (req, res, next) => {
  try {
    aiController.getLessonNotes(req, res);
  } catch (error) {
    next(error);
  }
});

router.get("/lesson-notes/:id/pdf", (req, res, next) => {
  try {
    aiController.downloadLessonNotePdf(req, res);
  } catch (error) {
    next(error);
  }
});

router.get("/curriculum-tracking", authorize("SUPER_ADMIN", "SCHOOL_ADMIN", "PRINCIPAL"), (req, res, next) => {
  try {
    aiController.getCurriculumTracking(req, res);
  } catch (error) {
    next(error);
  }
});

// ─── POST Routes (teacher/admin only, with AI rate limiting) ───

router.post("/schemes", authorize("SUPER_ADMIN", "SCHOOL_ADMIN", "PRINCIPAL", "TEACHER"), validate({ body: createSchemeSchema }), async (req, res, next) => {
  try {
    await aiController.createScheme(req, res);
  } catch (error) {
    next(error);
  }
});

router.post("/generate-lesson", authorize("SUPER_ADMIN", "SCHOOL_ADMIN", "PRINCIPAL", "TEACHER"), aiLimiter, validate({ body: generateLessonSchema }), async (req, res, next) => {
  try {
    await aiController.generateLessonNote(req, res);
  } catch (error) {
    next(error);
  }
});

router.post("/complete-week", authorize("SUPER_ADMIN", "SCHOOL_ADMIN", "PRINCIPAL", "TEACHER"), validate({ body: completeWeekSchema }), async (req, res, next) => {
  try {
    await aiController.completeWeek(req, res);
  } catch (error) {
    next(error);
  }
});

router.post("/generate-assessment", authorize("SUPER_ADMIN", "SCHOOL_ADMIN", "PRINCIPAL", "TEACHER"), aiLimiter, validate({ body: generateAssessmentSchema }), async (req, res, next) => {
  try {
    await aiController.generateAssessment(req, res);
  } catch (error) {
    next(error);
  }
});

router.post("/generate-past-questions", authorize("TEACHER", "STUDENT", "SUPER_ADMIN", "SCHOOL_ADMIN", "PRINCIPAL"), aiLimiter, validate({ body: generatePastQuestionsSchema }), async (req, res, next) => {
  try {
    await aiController.generatePastQuestions(req, res);
  } catch (error) {
    next(error);
  }
});

router.post("/generate-mock-exam", authorize("TEACHER", "STUDENT", "SUPER_ADMIN", "SCHOOL_ADMIN", "PRINCIPAL"), aiLimiter, validate({ body: generateMockExamSchema }), async (req, res, next) => {
  try {
    await aiController.generateMockExam(req, res);
  } catch (error) {
    next(error);
  }
});

router.post("/explain-topic", authorize("TEACHER", "STUDENT", "SUPER_ADMIN", "SCHOOL_ADMIN", "PRINCIPAL"), aiLimiter, validate({ body: explainTopicSchema }), async (req, res, next) => {
  try {
    await aiController.explainTopic(req, res);
  } catch (error) {
    next(error);
  }
});

router.post("/generate-comment", authorize("SUPER_ADMIN", "SCHOOL_ADMIN", "PRINCIPAL", "TEACHER"), aiLimiter, validate({ body: generateCommentSchema }), async (req, res, next) => {
  try {
    await aiController.generateComment(req, res);
  } catch (error) {
    next(error);
  }
});

router.post("/generate-scheme", authorize("SUPER_ADMIN", "SCHOOL_ADMIN", "PRINCIPAL", "TEACHER"), aiLimiter, validate({ body: generateSchemeSchema }), async (req, res, next) => {
  try {
    await aiController.generateScheme(req, res);
  } catch (error) {
    next(error);
  }
});

router.post("/save-midterm-questions", authorize("SUPER_ADMIN", "SCHOOL_ADMIN", "PRINCIPAL", "TEACHER"), aiLimiter, validate({ body: saveQuestionsSchema }), async (req, res, next) => {
  try {
    await aiController.saveMidtermQuestions(req, res);
  } catch (error) {
    next(error);
  }
});

router.post("/save-exam-questions", authorize("SUPER_ADMIN", "SCHOOL_ADMIN", "PRINCIPAL", "TEACHER"), aiLimiter, validate({ body: saveQuestionsSchema }), async (req, res, next) => {
  try {
    await aiController.saveExamQuestions(req, res);
  } catch (error) {
    next(error);
  }
});

export default router;
