import { Router } from "express";
import { z } from "zod";
import { timesheetController } from "../controllers/timesheet.controller";
import { authenticate } from "../middleware/auth";

const router = Router();

// All timesheet routes require authentication
router.use(authenticate);

// Validation schemas
const upsertTimesheetSchema = z.object({
  teacherId: z.string().uuid("Invalid teacher ID"),
  weekStart: z.string().datetime("Invalid weekStart date"),
  weekEnd: z.string().datetime("Invalid weekEnd date"),
  periodsTaught: z.number().int().min(0).optional(),
  periodsScheduled: z.number().int().min(0).optional(),
  notes: z.string().optional(),
});

const weekStartQuerySchema = z.object({
  weekStart: z.string().datetime("Invalid weekStart date").optional(),
});

// POST /api/timesheets — Create or update timesheet (admin or teacher)
router.post("/", async (req, res, next) => {
  try {
    req.body = upsertTimesheetSchema.parse(req.body);
    await timesheetController.upsertTimesheet(req, res);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      const messages = error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(" | ");
      return res.status(400).json({ success: false, error: messages });
    }
    next(error);
  }
});

// POST /api/timesheets/:id/submit — Submit timesheet for approval (teacher)
router.post("/:id/submit", async (req, res, next) => {
  try {
    await timesheetController.submitTimesheet(req, res);
  } catch (error: any) {
    next(error);
  }
});

// POST /api/timesheets/:id/approve — Approve timesheet (admin/bursar)
router.post("/:id/approve", async (req, res, next) => {
  try {
    await timesheetController.approveTimesheet(req, res);
  } catch (error: any) {
    next(error);
  }
});

// GET /api/timesheets/me/current — Get current week's timesheet (teacher)
router.get("/me/current", async (req, res, next) => {
  try {
    await timesheetController.getCurrentWeekTimesheet(req, res);
  } catch (error: any) {
    next(error);
  }
});

// GET /api/timesheets/me — Get current user's timesheets (teacher)
router.get("/me", async (req, res, next) => {
  try {
    await timesheetController.getMyTimesheets(req, res);
  } catch (error: any) {
    next(error);
  }
});

// GET /api/timesheets/dashboard — Teacher dashboard with timesheet info
router.get("/dashboard", async (req, res, next) => {
  try {
    await timesheetController.getDashboard(req, res);
  } catch (error: any) {
    next(error);
  }
});

// GET /api/timesheets/school — Get all timesheets for school (admin)
router.get("/school", async (req, res, next) => {
  try {
    try { Object.assign(req.query, weekStartQuerySchema.parse(req.query)); } catch { (req as any).validatedQuery = weekStartQuerySchema.parse(req.query); }
    await timesheetController.getSchoolTimesheets(req, res);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      const messages = error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(" | ");
      return res.status(400).json({ success: false, error: messages });
    }
    next(error);
  }
});

// GET /api/timesheets/teachers/status — Get all teachers with timesheet status (admin)
router.get("/teachers/status", async (req, res, next) => {
  try {
    await timesheetController.getTeachersTimesheetStatus(req, res);
  } catch (error: any) {
    next(error);
  }
});

// GET /api/timesheets/:id — Get timesheet by ID
router.get("/:id", async (req, res, next) => {
  try {
    await timesheetController.getTimesheetById(req, res);
  } catch (error: any) {
    next(error);
  }
});

export default router;
