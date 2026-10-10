import { Router } from "express";
import { z } from "zod";
import { resultController } from "../controllers/result.controller";

const router = Router();

// Validation schemas
const batchSaveSchema = z.object({
  classArmId: z.string().uuid(),
  subjectId: z.string().uuid(),
  session: z.string().min(4),
  term: z.number().min(1).max(3),
  scores: z.array(
    z.object({
      studentId: z.string().uuid(),
      caScore: z.number().min(0).max(100).optional().nullable(),
      examScore: z.number().min(0).max(100).optional().nullable(),
    })
  ).min(1),
});

const lockSchema = z.object({
  classArmId: z.string().uuid(),
  subjectId: z.string().uuid(),
  session: z.string().min(4),
  term: z.number().min(1).max(3),
});

// GET /api/results/load-sheet?classArmId=&subjectId=&session=&term=
router.get("/load-sheet", (req, res) => resultController.getLoadSheet(req, res));

// GET /api/results?session=&term= — list results
router.get("/", (req, res) => resultController.listResults(req, res));

// GET /api/results/sessions
router.get("/sessions", (req, res) => resultController.getSessions(req, res));

// GET /api/results/subjects?classArmId=
router.get("/subjects", (req, res) => resultController.getSubjectsForArm(req, res));

// PUT /api/results/batch — bulk save scores
router.put("/batch", async (req, res, next) => {
  try {
    req.body = batchSaveSchema.parse(req.body);
    await resultController.batchSave(req, res);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: error.errors.map(e => e.message).join(" | ") });
    }
    next(error);
  }
});

// POST /api/results/lock
router.post("/lock", async (req, res, next) => {
  try {
    req.body = lockSchema.parse(req.body);
    await resultController.lock(req, res);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: error.errors.map(e => e.message).join(" | ") });
    }
    next(error);
  }
});

// POST /api/results/unlock
router.post("/unlock", async (req, res, next) => {
  try {
    req.body = lockSchema.parse(req.body);
    await resultController.unlock(req, res);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: error.errors.map(e => e.message).join(" | ") });
    }
    next(error);
  }
});

export default router;
