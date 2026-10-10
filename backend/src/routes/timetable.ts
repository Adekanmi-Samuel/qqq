import { Router } from "express";
import { z } from "zod";
import { timetableController } from "../controllers/timetable.controller";
import { authorize } from "../middleware/auth";

const ADMIN_TEACHER = ["SUPER_ADMIN", "SCHOOL_ADMIN", "PRINCIPAL", "TEACHER"] as const;

const router = Router();

// Validation schemas
const upsertSlotSchema = z.object({
  classArmId: z.string().uuid(),
  subjectId: z.string().uuid(),
  teacherId: z.string().uuid(),
  dayOfWeek: z.number().min(0).max(4),
  period: z.number().min(1).max(10),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "Must be HH:mm format"),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, "Must be HH:mm format"),
  room: z.string().optional(),
});

const batchSchema = z.object({
  classArmId: z.string().uuid(),
  slots: z.array(upsertSlotSchema).min(1),
});

// GET /api/timetable?classArmId=xxx — all authenticated
router.get("/", (req, res) => timetableController.getByClassArm(req, res));
router.get("/available-subjects", (req, res) => timetableController.getAvailableSubjects(req, res));

// POST /api/timetable — admin/teacher
router.post("/", authorize(...ADMIN_TEACHER), async (req, res, next) => {
  try {
    req.body = upsertSlotSchema.parse(req.body);
    await timetableController.upsertSlot(req, res);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: error.errors.map(e => e.message).join(" | ") });
    }
    next(error);
  }
});

// POST /api/timetable/batch — admin/teacher
router.post("/batch", authorize(...ADMIN_TEACHER), async (req, res, next) => {
  try {
    req.body = batchSchema.parse(req.body);
    await timetableController.batchUpsert(req, res);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: error.errors.map(e => e.message).join(" | ") });
    }
    next(error);
  }
});

// DELETE /api/timetable/:id — admin/teacher
router.delete("/:id", authorize(...ADMIN_TEACHER), (req, res) => timetableController.deleteSlot(req, res));

// GET /api/timetable/my-slots — teacher's own timetable
router.get("/my-slots", (req, res) => timetableController.getMySlots(req, res));

export default router;
