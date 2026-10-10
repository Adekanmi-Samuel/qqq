import { Router } from "express";
import { z } from "zod";
import { studentController } from "../controllers/student.controller";
import { authorize } from "../middleware/auth";
import { subscriptionGuard } from "../middleware/subscriptionGuard";
import { validate } from "../middleware/validate";

const ADMIN_TEACHER = ["SUPER_ADMIN", "SCHOOL_ADMIN", "PRINCIPAL", "TEACHER"] as const;

const router = Router();

// ─── Validation Schemas ───

const createStudentSchema = z.object({
  admissionNumber: z.string().min(1, "Admission number is required."),
  fullName: z.string().min(2, "Full name is required."),
  dob: z.string().optional(),
  gender: z.enum(["male", "female"]).optional(),
  classId: z.string().uuid().optional(),
  armId: z.string().uuid().optional(),
  parentName: z.string().optional(),
  parentPhone: z.string().min(10).optional(),
  parentEmail: z.string().email().optional().or(z.literal("")),
  passportUrl: z.string().optional(),
  house: z.string().optional(),
  bloodGroup: z.string().optional(),
  allergies: z.string().optional(),
  medicalNotes: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  previousSchool: z.string().optional(),
  stateOfOrigin: z.string().optional(),
  nationality: z.string().optional(),
  notes: z.string().optional(),
});

const bulkSchema = z.object({
  students: z.array(z.object({
    admissionNumber: z.string().min(1),
    fullName: z.string().min(2),
    className: z.string().optional(),
    armName: z.string().optional(),
    gender: z.string().optional(),
    parentName: z.string().optional(),
    parentPhone: z.string().optional(),
    parentEmail: z.string().optional(),
  })).min(1, "At least one student is required."),
});

const promoteSchema = z.object({
  studentIds: z.array(z.string().uuid()).min(1),
  newClassId: z.string().uuid(),
  newArmId: z.string().uuid().optional(),
});

const updateStudentSchema = z.object({
  fullName: z.string().min(2).optional(),
  dob: z.string().optional(),
  gender: z.enum(["male", "female"]).optional(),
  classId: z.string().uuid().optional(),
  armId: z.string().uuid().optional(),
  parentName: z.string().optional(),
  parentPhone: z.string().min(10).optional(),
  parentEmail: z.string().email().optional().or(z.literal("")),
  passportUrl: z.string().optional(),
  house: z.string().optional(),
  bloodGroup: z.string().optional(),
  allergies: z.string().optional(),
  medicalNotes: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  previousSchool: z.string().optional(),
  stateOfOrigin: z.string().optional(),
  nationality: z.string().optional(),
  notes: z.string().optional(),
});

const createAccountSchema = z.object({
  email: z.string().email("Valid email is required."),
  password: z.string().min(8).optional(),
});

// ─── Routes ───

// GET /api/students -- all authenticated users
router.get("/", (req, res, next) => {
  try {
    studentController.list(req, res);
  } catch (error) {
    next(error);
  }
});

// GET /api/students/:id -- full profile with school history
router.get("/:id", (req, res, next) => {
  try {
    studentController.getById(req, res);
  } catch (error) {
    next(error);
  }
});

// POST /api/students (admin/teacher + subscription limit)
router.post("/", authorize(...ADMIN_TEACHER), subscriptionGuard("student"), validate({ body: createStudentSchema }), async (req, res, next) => {
  try {
    await studentController.create(req, res);
  } catch (error) {
    next(error);
  }
});

// POST /api/students/bulk
router.post("/bulk", authorize(...ADMIN_TEACHER), subscriptionGuard("student"), validate({ body: bulkSchema }), async (req, res, next) => {
  try {
    await studentController.bulkCreate(req, res);
  } catch (error) {
    next(error);
  }
});

// POST /api/students/promote -- admin/teacher
router.post("/promote", authorize(...ADMIN_TEACHER), validate({ body: promoteSchema }), async (req, res, next) => {
  try {
    await studentController.promote(req, res);
  } catch (error) {
    next(error);
  }
});

// PATCH /api/students/:id -- admin/teacher
router.patch("/:id", authorize(...ADMIN_TEACHER), validate({ body: updateStudentSchema }), async (req, res, next) => {
  try {
    await studentController.update(req, res);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/students/:id (archive) -- admin/teacher
router.delete("/:id", authorize(...ADMIN_TEACHER), (req, res, next) => {
  try {
    studentController.archive(req, res);
  } catch (error) {
    next(error);
  }
});

// POST /api/students/:id/create-account -- admin only
router.post("/:id/create-account", authorize("SUPER_ADMIN", "SCHOOL_ADMIN", "PRINCIPAL"), validate({ body: createAccountSchema }), async (req, res, next) => {
  try {
    await studentController.createAccount(req, res);
  } catch (error) {
    next(error);
  }
});

export default router;
