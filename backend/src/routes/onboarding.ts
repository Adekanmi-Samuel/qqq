import { Router } from "express";
import { z } from "zod";
import { onboardingController } from "../controllers/onboarding.controller";
import { validate } from "../middleware/validate";
import { registerLimiter } from "../middleware/rateLimiter";

const router = Router();

// ─── Validation Schemas ───

const onboardingRegisterSchema = z.object({
  // Step 1: Institutional Profile
  schoolName: z.string().min(2, "School name is required"),
  cacNumber: z.string().optional(),
  schoolType: z.enum(["NURSERY", "PRIMARY", "SECONDARY", "COMBINED"]),
  ownershipType: z.enum(["PRIVATE", "GOVERNMENT"]),
  state: z.string().min(2, "State is required"),
  lga: z.string().min(1, "LGA is required"),
  address: z.string().min(5, "Address is required"),
  schoolMotto: z.string().optional(),
  websiteUrl: z.string().url("Invalid URL").optional().or(z.literal("")),
  currency: z.enum(["NGN", "USD", "GBP"]).default("NGN"),

  // Step 2: Contact & Admin
  email: z.string().email("Valid email is required"),
  phone: z.string().min(10, "Valid phone number is required"),
  password: z.string()
    .min(8, "Password must be at least 8 characters.")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter.")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter.")
    .regex(/[0-9]/, "Password must contain at least one number."),
  adminFullName: z.string().min(2, "Admin full name is required"),
  whatsappNumber: z.string().optional(),

  // Step 3: Academic Calendar
  academicYear: z.string().min(4, "Academic year is required"),
  terms: z.array(z.object({
    termNumber: z.number().min(1).max(3),
    termName: z.string(),
    startDate: z.string(),
    endDate: z.string(),
    resumptionDate: z.string().optional(),
  })).min(1, "At least one term is required"),

  // Step 4: Classes & Grading
  selectedLevels: z.array(z.string()).min(1, "Select at least one class level"),
  customClasses: z.array(z.string()).optional(),
  caPercentage: z.number().min(0).max(100).default(40),
  examPercentage: z.number().min(0).max(100).default(60),
  passMark: z.number().min(0).max(100).default(40),
  schoolEmail: z.string().email("Valid school email is required").optional().or(z.literal("")),
  principalName: z.string().optional(),
  schoolPhone: z.string().optional(),
  foundingYear: z.string().optional(),
  curriculum: z.string().optional(),
  numberOfStudents: z.string().optional(),
  numberOfStaff: z.string().optional(),
  schoolLogoUrl: z.string().optional(),
  motto: z.string().optional(),
  website: z.string().optional(),
  logoUrl: z.string().optional(),
});

// ─── Routes ───

// POST /api/onboarding/register -- 4-step registration (rate limited: 3/hour per IP)
router.post("/register", registerLimiter, validate({ body: onboardingRegisterSchema }), async (req, res, next) => {
  try {
    await onboardingController.register(req, res);
  } catch (error) {
    next(error);
  }
});

export default router;
