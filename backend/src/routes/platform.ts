import { Router } from "express";
import { z } from "zod";
import { platformController } from "../controllers/platform.controller";
import { authorize } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { csrfProtection } from "../middleware/csrf";
import { platformWriteLimiter, inviteLimiter } from "../middleware/rateLimiter";

const router = Router();

const superAdminOnly = authorize("SUPER_ADMIN");

// Same policy as auth register/setPassword/reset
const strongPassword = z
  .string()
  .min(8, "Password must be at least 8 characters.")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter.")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter.")
  .regex(/[0-9]/, "Password must contain at least one number.");

const createSchoolSchema = z.object({
  schoolName: z.string().min(2, "School name is required"),
  email: z.string().email("Valid admin email is required"),
  password: strongPassword,
  phone: z.string().min(10, "Valid phone number is required"),
  schoolType: z.enum(["NURSERY", "PRIMARY", "SECONDARY", "COMBINED"]).optional(),
  ownershipType: z.enum(["PRIVATE", "GOVERNMENT"]).optional(),
  state: z.string().optional(),
  lga: z.string().optional(),
  address: z.string().optional(),
  cacNumber: z.string().optional(),
  adminFullName: z.string().optional(),
  motto: z.string().optional(),
  schoolMotto: z.string().optional(),
  website: z.string().optional(),
  websiteUrl: z.string().optional(),
  logoUrl: z.string().optional(),
  schoolLogoUrl: z.string().optional(),
  schoolEmail: z.string().email().optional().or(z.literal("")),
  schoolPhone: z.string().optional(),
  principalName: z.string().optional(),
  foundingYear: z.string().optional(),
  curriculum: z.string().optional(),
  levels: z.array(z.string()).optional(),
  classes: z.array(z.string()).optional(),
  status: z.enum(["PENDING_VERIFICATION", "ACTIVE", "SUSPENDED", "TRIAL"]).optional(),
  verified: z.boolean().optional(),
});

const updateSchoolSchema = z.object({
  status: z.enum(["PENDING_VERIFICATION", "ACTIVE", "SUSPENDED", "TRIAL"]).optional(),
  planId: z.string().uuid().optional(),
  planType: z.enum(["FREE", "PREMIUM", "ENTERPRISE"]).optional(),
  verified: z.boolean().optional(),
  suspensionReason: z.string().optional(),
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  phone: z.string().min(10).optional(),
  state: z.string().optional(),
  lga: z.string().optional(),
  address: z.string().optional(),
  motto: z.string().optional(),
  website: z.string().optional(),
  currency: z.string().optional(),
  cacNumber: z.string().optional(),
});

const createUserSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  email: z.string().email("Valid email is required"),
  password: strongPassword,
  role: z.enum(["SCHOOL_ADMIN", "TEACHER", "PRINCIPAL", "BURSAR", "STUDENT", "PARENT"]),
  schoolId: z.string().min(1, "schoolId is required"),
});

const updateUserSchema = z.object({
  fullName: z.string().min(2).optional(),
  email: z.string().email().optional(),
  role: z.enum(["SUPER_ADMIN", "SCHOOL_ADMIN", "TEACHER", "PRINCIPAL", "BURSAR", "STUDENT", "PARENT"]).optional(),
  active: z.boolean().optional(),
  schoolId: z.string().nullable().optional(),
  password: strongPassword.optional(),
  passwordResetRequired: z.boolean().optional(),
});

const setUserPasswordSchema = z.object({
  password: strongPassword,
});

const impersonateSchema = z.object({
  userId: z.string().min(1, "userId is required"),
});

const bootstrapSchema = z.object({
  schoolId: z.string().min(1).optional(),
  classes: z.array(z.string()).optional(),
  levels: z.array(z.string()).optional(),
  subjects: z.array(z.string()).optional(),
  teacher: z
    .object({
      fullName: z.string().min(2),
      email: z.string().email(),
      password: strongPassword,
    })
    .optional(),
  session: z.string().optional(),
  term: z.number().int().min(1).max(3).optional(),
  weeks: z.number().int().min(1).max(20).optional(),
  schoolName: z.string().optional(),
});

const fillLessonNotesSchema = z.object({
  session: z.string().optional(),
  term: z.number().int().min(1).max(3).optional(),
  schoolName: z.string().optional(),
  teacherName: z.string().optional(),
  overwrite: z.boolean().optional().default(false),
});

const importCurriculumSchema = z.object({
  subjects: z.array(z.string()).optional(),
  classes: z
    .array(z.object({ name: z.string().min(1), arms: z.array(z.string()).optional() }))
    .optional(),
  schemes: z
    .array(
      z.object({
        className: z.string().min(1),
        subjectName: z.string().min(1),
        title: z.string().optional(),
        session: z.string().optional(),
        term: z.number().int().min(1).max(3).optional(),
        weeks: z.array(z.object({ week: z.number().int().min(1).max(20), topic: z.string().min(2) })).min(1),
      })
    )
    .optional(),
  timetables: z
    .array(
      z.object({
        className: z.string().min(1),
        dept: z.string().nullable().optional(),
        slots: z
          .array(
            z.object({
              dayOfWeek: z.number().int().min(0).max(6),
              period: z.number().int().min(1).max(20),
              startTime: z.string().min(1),
              endTime: z.string().min(1),
              subjectName: z.string().min(1),
              room: z.string().optional(),
            })
          )
          .min(1),
      })
    )
    .optional(),
  teacherEmail: z.string().email().optional(),
});

const schoolInvitesSchema = z.object({
  count: z.number().int().min(1).max(50).optional(),
  role: z.enum(["TEACHER", "BURSAR", "PRINCIPAL", "STUDENT", "PARENT"]).optional(),
});

const createPlanSchema = z.object({
  name: z.string().min(2),
  planType: z.enum(["FREE", "PREMIUM", "ENTERPRISE"]).optional(),
  price: z.number().min(0),
  maxStudents: z.number().min(1),
  maxStaff: z.number().min(1),
  features: z.array(z.string()),
  billingCycle: z.enum(["monthly", "yearly"]).default("monthly"),
});

const updatePlanSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().optional(),
  price: z.number().min(0).optional(),
  maxStudents: z.number().min(1).optional(),
  maxStaff: z.number().min(1).optional(),
  features: z.array(z.string()).optional(),
  billingCycle: z.enum(["monthly", "yearly"]).optional(),
  interval: z.enum(["monthly", "yearly"]).optional(),
  active: z.boolean().optional(),
});

const updateSettingsSchema = z.object({
  portalFeePercent: z.number().min(0).max(100).optional(),
  maintenanceMode: z.boolean().optional(),
  smsProvider: z.string().optional(),
  smsApiKey: z.string().optional(),
  smsSenderId: z.string().optional(),
});

const auditQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(200).optional(),
  search: z.string().optional(),
  result: z.enum(["success", "failure"]).optional(),
  action: z.string().optional(),
  schoolId: z.string().optional(),
});

// CSRF + write rate limiters on all authenticated platform mutations
router.use(csrfProtection);

// Stats
router.get("/stats", superAdminOnly, (req, res) => platformController.getStats(req, res));

// Schools full control
router.get("/schools", superAdminOnly, (req, res) => platformController.listSchools(req, res));
router.post("/schools", superAdminOnly, platformWriteLimiter, validate({ body: createSchoolSchema }), (req, res) => platformController.createSchool(req, res));
router.get("/schools/:id", superAdminOnly, (req, res) => platformController.getSchool(req, res));
router.patch("/schools/:id", superAdminOnly, platformWriteLimiter, validate({ body: updateSchoolSchema }), (req, res) => platformController.updateSchool(req, res));
router.post("/schools/:id/bootstrap-curriculum", superAdminOnly, platformWriteLimiter, validate({ body: bootstrapSchema }), (req, res) => platformController.bootstrapCurriculum(req, res));
router.post("/schools/:id/fill-lesson-notes", superAdminOnly, platformWriteLimiter, validate({ body: fillLessonNotesSchema }), (req, res) => platformController.fillLessonNotes(req, res));
router.post("/schools/:id/import-curriculum", superAdminOnly, platformWriteLimiter, validate({ body: importCurriculumSchema }), (req, res) => platformController.importSchemesAndTimetables(req, res));
router.post("/schools/:id/invites", superAdminOnly, inviteLimiter, validate({ body: schoolInvitesSchema }), (req, res) => platformController.generateSchoolInvites(req, res));
router.get("/schools/:id/invites", superAdminOnly, (req, res) => platformController.listSchoolInvites(req, res));

// Users full control
router.get("/users", superAdminOnly, (req, res) => platformController.listUsers(req, res));
router.post("/users", superAdminOnly, platformWriteLimiter, validate({ body: createUserSchema }), (req, res) => platformController.createUser(req, res));
router.patch("/users/:id", superAdminOnly, platformWriteLimiter, validate({ body: updateUserSchema }), (req, res) => platformController.updateUser(req, res));
router.post("/users/:id/password", superAdminOnly, platformWriteLimiter, validate({ body: setUserPasswordSchema }), (req, res) => platformController.setUserPassword(req, res));
router.delete("/users/:id", superAdminOnly, platformWriteLimiter, (req, res) => platformController.deleteUser(req, res));

// Impersonate any non-super-admin user
router.post("/impersonate", superAdminOnly, platformWriteLimiter, validate({ body: impersonateSchema }), (req, res) => platformController.impersonate(req, res));
router.post("/impersonate/:userId", superAdminOnly, platformWriteLimiter, validate({ body: impersonateSchema.partial() }), (req, res) => platformController.impersonate(req, res));

// Plans
router.get("/plans", superAdminOnly, (req, res) => platformController.listPlans(req, res));
router.post("/plans", superAdminOnly, platformWriteLimiter, validate({ body: createPlanSchema }), (req, res) => platformController.createPlan(req, res));
router.patch("/plans/:id", superAdminOnly, platformWriteLimiter, validate({ body: updatePlanSchema }), (req, res) => platformController.updatePlan(req, res));

// Settings
router.get("/settings", superAdminOnly, (req, res) => platformController.getSettings(req, res));
router.patch("/settings", superAdminOnly, platformWriteLimiter, validate({ body: updateSettingsSchema }), (req, res) => platformController.updateSettings(req, res));

// Audit logs (superadmin)
router.get("/audit", superAdminOnly, validate({ query: auditQuerySchema }), (req, res) => platformController.listAudit(req, res));

export default router;
