import { Router } from "express";
import { z } from "zod";
import { complianceController } from "../controllers/compliance.controller";
import { authenticate } from "../middleware/auth";

const router = Router();

// All compliance routes require authentication
router.use(authenticate);

// Validation schemas
const generateReportSchema = z.object({
  reportType: z.enum([
    "STUDENT_NOMINAL_ROLL",
    "STAFF_NOMINAL_ROLL",
    "ATTENDANCE_SUMMARY",
    "FEE_COLLECTION_REPORT",
    "EXAM_REGISTRATION_SUMMARY",
    "INFRASTRUCTURE_CHECKLIST",
  ]),
  filters: z.object({
    session: z.string().optional(),
    term: z.string().optional(),
    classId: z.string().uuid().optional(),
    armId: z.string().uuid().optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
  }).optional(),
  save: z.boolean().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
});

const saveReportSchema = z.object({
  reportType: z.enum([
    "STUDENT_NOMINAL_ROLL",
    "STAFF_NOMINAL_ROLL",
    "ATTENDANCE_SUMMARY",
    "FEE_COLLECTION_REPORT",
    "EXAM_REGISTRATION_SUMMARY",
    "INFRASTRUCTURE_CHECKLIST",
  ]),
  title: z.string().optional(),
  description: z.string().optional(),
  data: z.any(),
});

const querySchema = z.object({
  reportType: z.enum([
    "STUDENT_NOMINAL_ROLL",
    "STAFF_NOMINAL_ROLL",
    "ATTENDANCE_SUMMARY",
    "FEE_COLLECTION_REPORT",
    "EXAM_REGISTRATION_SUMMARY",
    "INFRASTRUCTURE_CHECKLIST",
  ]).optional(),
  limit: z.string().optional(),
  offset: z.string().optional(),
});

// POST /api/compliance/generate — Generate a compliance report
router.post("/generate", async (req, res, next) => {
  try {
    req.body = generateReportSchema.parse(req.body);
    await complianceController.generateReport(req, res);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      const messages = error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(" | ");
      return res.status(400).json({ success: false, error: messages });
    }
    next(error);
  }
});

// POST /api/compliance/reports — Save a generated report
router.post("/reports", async (req, res, next) => {
  try {
    req.body = saveReportSchema.parse(req.body);
    await complianceController.saveReport(req, res);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      const messages = error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(" | ");
      return res.status(400).json({ success: false, error: messages });
    }
    next(error);
  }
});

// GET /api/compliance/reports — Get saved reports
router.get("/reports", async (req, res, next) => {
  try {
    try { Object.assign(req.query, querySchema.parse(req.query)); } catch { (req as any).validatedQuery = querySchema.parse(req.query); }
    await complianceController.getReports(req, res);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      const messages = error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(" | ");
      return res.status(400).json({ success: false, error: messages });
    }
    next(error);
  }
});

// GET /api/compliance/reports/:id — Get report by ID
router.get("/reports/:id", async (req, res, next) => {
  try {
    await complianceController.getReportById(req, res);
  } catch (error: any) {
    next(error);
  }
});

// DELETE /api/compliance/reports/:id — Delete report
router.delete("/reports/:id", async (req, res, next) => {
  try {
    await complianceController.deleteReport(req, res);
  } catch (error: any) {
    next(error);
  }
});

// GET /api/compliance/types — Get available report types
router.get("/types", async (req, res, next) => {
  try {
    await complianceController.getReportTypes(req, res);
  } catch (error: any) {
    next(error);
  }
});

export default router;
