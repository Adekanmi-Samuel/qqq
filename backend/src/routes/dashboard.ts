import { Router } from "express";
import { dashboardController } from "../controllers/dashboard.controller";
import { authorize } from "../middleware/auth";

const router = Router();

// GET /api/dashboard/admin — supports optional ?session= query param
router.get("/admin", authorize("SUPER_ADMIN", "SCHOOL_ADMIN", "PRINCIPAL"), (req, res) => dashboardController.getAdminStats(req, res));

// GET /api/dashboard/teacher
router.get("/teacher", authorize("TEACHER"), (req, res) => dashboardController.getTeacherStats(req, res));

// GET /api/dashboard/student
router.get("/student", authorize("STUDENT"), (req, res) => dashboardController.getStudentStats(req, res));

// GET /api/dashboard/parent
router.get("/parent", authorize("PARENT"), (req, res) => dashboardController.getParentStats(req, res));

// GET /api/dashboard/staff — supports optional ?session= query param
router.get("/staff", authorize("BURSAR", "SCHOOL_ADMIN"), (req, res) => dashboardController.getStaffStats(req, res));

export default router;
