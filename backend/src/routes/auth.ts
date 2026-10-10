import { Router } from "express";
import { z } from "zod";
import { authController } from "../controllers/auth.controller";
import { authenticate } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { loginLimiter, registerLimiter, passwordResetLimiter } from "../middleware/rateLimiter";
import { loginAttemptTracking } from "../middleware/loginAttempts";
import { csrfProtection } from "../middleware/csrf";
import { prisma } from "../lib/prisma";
import crypto from "crypto";

const router = Router();

// Password validation: min 8 chars, at least 1 uppercase, 1 lowercase, 1 number
const strongPassword = z.string()
  .min(8, "Password must be at least 8 characters.")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter.")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter.")
  .regex(/[0-9]/, "Password must contain at least one number.");

// ─── Validation Schemas ───

const registerSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
  password: strongPassword,
  schoolName: z.string().min(2, "School name is required."),
  phone: z.string().min(10, "Please enter a valid phone number."),
  schoolType: z.enum(["NURSERY", "PRIMARY", "SECONDARY", "COMBINED"]),
  ownershipType: z.enum(["PRIVATE", "GOVERNMENT"]),
  state: z.string().min(2, "State is required."),
  lga: z.string().min(1, "LGA is required."),
  address: z.string().min(5, "Address is required."),
  cacNumber: z.string().optional(),
  remember: z.boolean().optional().default(false),
  adminFullName: z.string().optional(),
  schoolMotto: z.string().optional(),
  motto: z.string().optional(),
  websiteUrl: z.string().optional(),
  website: z.string().optional(),
  schoolEmail: z.string().email().optional().or(z.literal("")),
  principalName: z.string().optional(),
  schoolPhone: z.string().optional(),
  foundingYear: z.string().optional(),
  curriculum: z.string().optional(),
  numberOfStudents: z.string().optional(),
  numberOfStaff: z.string().optional(),
  schoolLogoUrl: z.string().optional(),
  logoUrl: z.string().optional(),
  academicYear: z.string().optional(),
  selectedLevels: z.array(z.string()).optional(),
  customClasses: z.array(z.string()).optional(),
  terms: z.array(z.object({
    termNumber: z.number().min(1).max(3),
    termName: z.string(),
    startDate: z.string(),
    endDate: z.string(),
    resumptionDate: z.string().optional(),
  })).optional(),
});

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
  password: z.string().min(1, "Password is required."),
  remember: z.boolean().optional().default(false),
});

const registerWithInviteSchema = z.object({
  inviteCode: z.string().min(1, "Invite code is required."),
  fullName: z.string().min(2, "Full name is required."),
  email: z.string().email("Please enter a valid email address."),
  password: strongPassword,
  admissionNumber: z.string().optional(),
  phone: z.string().min(10, "Please enter a valid phone number.").optional(),
  role: z.enum(["TEACHER", "BURSAR", "PRINCIPAL", "STUDENT", "PARENT"]).optional(),
});

const setPasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required."),
  newPassword: strongPassword,
});

const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1, "Reset token is required."),
  newPassword: strongPassword,
});

const refreshSchema = z.object({
  remember: z.boolean().optional().default(false),
});

const revokeSessionSchema = z.object({
  id: z.string().uuid("Invalid session ID."),
});

const joinSchoolSchema = z.object({
  inviteCode: z.string().min(1, "Invite code is required."),
  admissionNumber: z.string().optional(),
});

// ─── Routes ───

// POST /api/auth/register (rate limited: 3/hour per IP)
// Apply login attempt tracking and CSRF protection
router.post("/register",
  registerLimiter,
  loginAttemptTracking,
  validate({ body: registerSchema }),
  async (req, res, next) => {
    try {
      await authController.register(req, res);
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/auth/register-with-invite (rate limited)
router.post("/register-with-invite",
  registerLimiter,
  validate({ body: registerWithInviteSchema }),
  async (req, res, next) => {
    try {
      await authController.registerWithInvite(req, res);
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/auth/login (rate limited: 5/15min per IP)
// Apply login attempt tracking and CSRF protection
router.post("/login",
  loginLimiter,
  loginAttemptTracking,
  validate({ body: loginSchema }),
  async (req, res, next) => {
    try {
      await authController.login(req, res);
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/auth/set-password -- authenticated, set password (for initial setup flow)
router.post("/set-password",
  authenticate,
  validate({ body: setPasswordSchema }),
  async (req, res, next) => {
    try {
      await authController.setPassword(req, res);
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/auth/forgot-password (rate limited: 3/hour per email)
router.post("/forgot-password",
  passwordResetLimiter,
  validate({ body: forgotPasswordSchema }),
  async (req, res, next) => {
    try {
      await authController.forgotPassword(req, res);
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/auth/reset-password (rate limited)
router.post("/reset-password",
  passwordResetLimiter,
  validate({ body: resetPasswordSchema }),
  async (req, res, next) => {
    try {
      await authController.resetPassword(req, res);
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/auth/me -- get current user (no rate limit needed)
router.get("/me", authenticate, (req, res, next) => {
  try {
    authController.me(req, res);
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/refresh -- issue new access token from refresh token (cookie-based)
// Apply CSRF protection for mutating endpoint
router.post("/refresh",
  csrfProtection,
  validate({ body: refreshSchema }),
  async (req, res, next) => {
    try {
      await authController.refresh(req, res);
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/auth/logout -- revoke refresh token and clear cookies
// Does NOT require authenticate: logout must work with only the refresh cookie
// when the access token has already expired.
router.post("/logout",
  csrfProtection,
  async (req, res, next) => {
    try {
      await authController.logout(req, res);
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/auth/join-school -- link the signed-in account to a school via invite code
// For Google/OAuth signups that have no school yet. Authenticated but CSRF protected.
router.post("/join-school",
  authenticate,
  csrfProtection,
  validate({ body: joinSchoolSchema }),
  async (req, res, next) => {
    try {
      await authController.joinSchool(req, res);
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/auth/sessions -- list active sessions
router.get("/sessions",
  authenticate,
  async (req, res, next) => {
    try {
      await authController.getSessions(req, res);
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /api/auth/sessions/:id -- revoke specific session
router.delete("/sessions/:id",
  authenticate,
  csrfProtection,
  validate({ params: revokeSessionSchema }),
  async (req, res, next) => {
    try {
      await authController.revokeSession(req, res);
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /api/auth/sessions -- revoke all other sessions
router.delete("/sessions",
  authenticate,
  csrfProtection,
  async (req, res, next) => {
    try {
      await authController.revokeAllSessions(req, res);
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/auth/supabase-sync -- sync Supabase OAuth user with backend
// Rate limited: identity comes only from a verified Supabase JWT
router.post("/supabase-sync",
  loginLimiter,
  csrfProtection,
  async (req, res, next) => {
    try {
      await authController.supabaseSync(req, res);
    } catch (error) {
      next(error);
    }
  }
);

export default router;