import { Router } from "express";
import { z } from "zod";
import { schoolController } from "../controllers/school.controller";
import { authorize } from "../middleware/auth";
import { validate } from "../middleware/validate";

const router = Router();

// ─── Validation Schemas ───

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  address: z.string().min(5).optional(),
  phone: z.string().min(10).optional(),
  email: z.string().email().optional(),
  logoUrl: z.string().url().optional().or(z.literal("")),
  description: z.string().optional(),
  state: z.string().min(2).optional(),
  lga: z.string().min(1).optional(),
  motto: z.string().optional(),
  website: z.string().optional(),
  schoolType: z.string().optional(),
});

const verifySchema = z.object({
  schoolId: z.string().uuid(),
});

// ─── Routes ───

// PATCH /api/schools/:id -- update school (authenticated)
router.patch("/:id", authorize("SUPER_ADMIN", "SCHOOL_ADMIN"), validate({ body: updateSchema }), async (req, res, next) => {
  try {
    await schoolController.update(req, res);
  } catch (error) {
    next(error);
  }
});

// POST /api/schools/verify -- super admin only
router.post("/verify", authorize("SUPER_ADMIN"), validate({ body: verifySchema }), async (req, res, next) => {
  try {
    await schoolController.verify(req, res);
  } catch (error) {
    next(error);
  }
});

// GET /api/schools -- list schools (SUPER_ADMIN all; SCHOOL_ADMIN own school only)
router.get("/", authorize("SUPER_ADMIN", "SCHOOL_ADMIN"), (req, res, next) => {
  try {
    schoolController.listAll(req, res);
  } catch (error) {
    next(error);
  }
});

// GET /api/schools/academic-calendar/current -- get current session
router.get(
  "/academic-calendar/current",
  authorize("SUPER_ADMIN", "SCHOOL_ADMIN", "PRINCIPAL", "TEACHER", "BURSAR", "STUDENT", "PARENT"),
  (req, res, next) => {
    try {
      schoolController.getCurrentSession(req, res);
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/schools/:slug -- authenticated profile lookup
router.get("/:slug", (req, res, next) => {
  try {
    schoolController.getBySlug(req, res);
  } catch (error) {
    next(error);
  }
});

export default router;
