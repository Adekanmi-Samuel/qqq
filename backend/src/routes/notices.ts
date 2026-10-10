import { Router } from "express";
import { z } from "zod";
import { noticeController } from "../controllers/notice.controller";
import { authorize } from "../middleware/auth";
import { validate } from "../middleware/validate";

const ADMIN_TEACHER = ["SUPER_ADMIN", "SCHOOL_ADMIN", "PRINCIPAL", "TEACHER"] as const;

const router = Router();

// ─── Validation Schemas ───

const createNoticeSchema = z.object({
  title: z.string().min(2, "Notice title is required."),
  body: z.string().min(2, "Notice body is required."),
  attachmentUrl: z.string().url().optional().or(z.literal("")),
  targetType: z.enum(["ALL", "CLASS", "ARM"]).default("ALL"),
  targetId: z.string().uuid().optional(),
  publishNow: z.boolean().default(true),
});

// ─── Routes ───

// GET /api/notices -- all authenticated users
router.get("/", (req, res, next) => {
  try {
    noticeController.list(req, res);
  } catch (error) {
    next(error);
  }
});

// POST /api/notices -- admin/teacher
router.post("/", authorize(...ADMIN_TEACHER), validate({ body: createNoticeSchema }), async (req, res, next) => {
  try {
    await noticeController.create(req, res);
  } catch (error) {
    next(error);
  }
});

// POST /api/notices/:id/publish -- admin/teacher
router.post("/:id/publish", authorize(...ADMIN_TEACHER), (req, res, next) => {
  try {
    noticeController.publish(req, res);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/notices/:id -- admin/teacher
router.delete("/:id", authorize(...ADMIN_TEACHER), (req, res, next) => {
  try {
    noticeController.delete(req, res);
  } catch (error) {
    next(error);
  }
});

export default router;
