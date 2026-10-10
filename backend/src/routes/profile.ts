import { Router } from "express";
import { z } from "zod";
import { authController } from "../controllers/auth.controller";
import { validate } from "../middleware/validate";

const router = Router();

// Accept fullName or name from clients; both map to the user's full name.
const updateProfileSchema = z
  .object({
    fullName: z.string().min(2, "Full name must be at least 2 characters.").max(100).optional(),
    name: z.string().min(2, "Full name must be at least 2 characters.").max(100).optional(),
    email: z.string().email("Please enter a valid email address.").optional(),
  })
  .transform((v) => ({
    fullName: v.fullName ?? v.name,
    email: v.email,
  }));

// GET /api/profile -- signed-in user's own profile (all roles)
router.get("/", (req, res, next) => {
  try {
    authController.getProfile(req as any, res);
  } catch (error) {
    next(error);
  }
});

// PATCH /api/profile -- update own profile (all roles)
router.patch(
  "/",
  validate({ body: updateProfileSchema }),
  async (req, res, next) => {
    try {
      await authController.updateProfile(req as any, res);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
