import { Router } from "express";
import { z } from "zod";
import { classController } from "../controllers/class.controller";
import { authorize } from "../middleware/auth";

const ADMIN_TEACHER = ["SUPER_ADMIN", "SCHOOL_ADMIN", "PRINCIPAL", "TEACHER"] as const;
const ADMIN_ONLY = ["SUPER_ADMIN", "SCHOOL_ADMIN", "PRINCIPAL"] as const;
// Class teacher reassignment is leadership-only
const LEADERSHIP = ["SUPER_ADMIN", "SCHOOL_ADMIN", "PRINCIPAL"] as const;

const router = Router();

// Validation schemas
const createClassSchema = z.object({
  name: z.string().min(1, "Class name is required."),
  arms: z.array(z.string()).optional(),
});

const addArmSchema = z.object({
  classId: z.string().uuid(),
  name: z.string().min(1, "Arm name is required."),
  classTeacherId: z.string().uuid().optional(),
});

const assignTeacherSchema = z.object({
  classTeacherId: z.string().uuid(),
});

const renameClassSchema = z.object({
  name: z.string().min(1, "Class name is required."),
});

const updateArmSchema = z.object({
  name: z.string().min(1, "Arm name is required.").optional(),
  classTeacherId: z.string().uuid().optional(),
});

// GET /api/classes — all authenticated users can read
router.get("/", (req, res) => classController.list(req, res));

// POST /api/classes — admin/teacher
router.post("/", authorize(...ADMIN_TEACHER), async (req, res, next) => {
  try {
    req.body = createClassSchema.parse(req.body);
    await classController.create(req, res);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      const messages = error.errors.map((e) => e.message).join(" ");
      return res.status(400).json({ success: false, error: messages });
    }
    next(error);
  }
});

// PATCH /api/classes/:id — leadership can rename class
router.patch("/:id", authorize(...ADMIN_ONLY), async (req, res, next) => {
  try {
    req.body = renameClassSchema.parse(req.body);
    await classController.renameClass(req, res);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      const messages = error.errors.map((e) => e.message).join(" ");
      return res.status(400).json({ success: false, error: messages });
    }
    next(error);
  }
});

// POST /api/classes/arms — admin/teacher
router.post("/arms", authorize(...ADMIN_TEACHER), async (req, res, next) => {
  try {
    req.body = addArmSchema.parse(req.body);
    await classController.addArm(req, res);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      const messages = error.errors.map((e) => e.message).join(" ");
      return res.status(400).json({ success: false, error: messages });
    }
    next(error);
  }
});

// PATCH /api/classes/arms/:id — leadership only (rename arm or reassign class teacher)
router.patch("/arms/:id", authorize(...ADMIN_ONLY), async (req, res, next) => {
  try {
    req.body = updateArmSchema.parse(req.body);
    await classController.updateArm(req, res);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      const messages = error.errors.map((e) => e.message).join(" ");
      return res.status(400).json({ success: false, error: messages });
    }
    next(error);
  }
});

// DELETE /api/classes/arms/:id — admin only
router.delete("/arms/:id", authorize(...ADMIN_ONLY), (req, res) => classController.deleteArm(req, res));

export default router;
