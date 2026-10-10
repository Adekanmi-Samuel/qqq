import { Router } from "express";
import { z } from "zod";
import { attendanceController } from "../controllers/attendance.controller";
import { authorize } from "../middleware/auth";
import { createRateLimiter } from "../middleware/rateLimiter";

const ADMIN_TEACHER = ["SUPER_ADMIN", "SCHOOL_ADMIN", "PRINCIPAL", "TEACHER"] as const;

const router = Router();

// Validation schemas
const markAttendanceSchema = z.object({
  records: z.array(z.object({
    studentId: z.string().uuid(),
    classArmId: z.string().uuid(),
    status: z.enum(["PRESENT", "ABSENT", "LATE"]),
    date: z.string().optional(),
  })).min(1, "At least one attendance record is required."),
});

// GET /api/attendance — staff only (teacher/admin). Students and parents use student scoped routes.
router.get("/", authorize("SUPER_ADMIN", "SCHOOL_ADMIN", "PRINCIPAL", "TEACHER", "BURSAR"), (req, res) => attendanceController.get(req, res));

const attendanceMarkLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 30,
  keyPrefix: "attendance:mark",
  dimensions: ["user", "ip"],
  message: "Too many attendance updates. Please slow down.",
});

// POST /api/attendance — admin/teacher
router.post("/", authorize(...ADMIN_TEACHER), attendanceMarkLimiter, async (req, res, next) => {
  try {
    req.body = markAttendanceSchema.parse(req.body);
    await attendanceController.mark(req, res);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      const messages = error.errors.map((e) => e.message).join(" ");
      return res.status(400).json({ success: false, error: messages });
    }
    next(error);
  }
});

// GET /api/attendance/report
router.get("/report", authorize("SUPER_ADMIN", "SCHOOL_ADMIN", "PRINCIPAL", "TEACHER"), (req, res) => attendanceController.report(req, res));

export default router;
