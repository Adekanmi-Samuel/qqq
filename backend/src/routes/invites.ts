import { Router } from "express";
import { z } from "zod";
import { inviteController } from "../controllers/invite.controller";
import { validate } from "../middleware/validate";
import { authorize } from "../middleware/auth";
import { inviteLimiter } from "../middleware/rateLimiter";

const router = Router();

// ─── Validation Schemas ───

const generateInviteSchema = z.object({
  count: z.number().int().min(1).max(50).optional().default(1),
  role: z.enum(["TEACHER", "BURSAR", "PRINCIPAL", "STUDENT", "PARENT"]).optional().default("TEACHER"),
  schoolId: z.string().uuid().optional(),
});

// ─── Routes ───

// POST /api/invites/generate -- admin only
router.post("/generate", authorize("SUPER_ADMIN", "SCHOOL_ADMIN", "PRINCIPAL"), inviteLimiter, validate({ body: generateInviteSchema }), async (req, res, next) => {
  try {
    await inviteController.generate(req, res);
  } catch (error) {
    next(error);
  }
});

// GET /api/invites -- only school leadership may list invite codes
router.get("/", authorize("SUPER_ADMIN", "SCHOOL_ADMIN", "PRINCIPAL"), (req, res, next) => {
  try {
    inviteController.list(req, res);
  } catch (error) {
    next(error);
  }
});

export default router;
