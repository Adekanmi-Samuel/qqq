import { Router } from "express";
import { AuthenticatedRequest } from "../types";
import { prisma } from "../lib/prisma";
import { Response } from "express";
import { authorize } from "../middleware/auth";
import { getParam } from "../utils/getParam";

const ADMIN_TEACHER = ["SUPER_ADMIN", "SCHOOL_ADMIN", "PRINCIPAL", "TEACHER"] as const;

const router = Router();

// GET /api/subjects — list all subjects for the school
router.get("/", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const schoolId = req.tenantId || req.user?.schoolId;
    if (!schoolId) {
      return res.status(403).json({ success: false, error: "No school association." });
    }

    const subjects = await prisma.subject.findMany({
      where: { schoolId },
      orderBy: { name: "asc" },
    });

    res.json({ success: true, data: subjects });
  } catch (error: any) {
    console.error("[subjects] Error listing:", error);
    res.status(500).json({ success: false, error: "Failed to fetch subjects." });
  }
});

// POST /api/subjects — create a new subject (admin/teacher)
router.post("/", authorize(...ADMIN_TEACHER), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const schoolId = req.tenantId || req.user?.schoolId;
    if (!schoolId) {
      return res.status(403).json({ success: false, error: "No school association." });
    }

    const { name, shortCode } = req.body as { name?: string; shortCode?: string };
    if (!name) {
      return res.status(400).json({ success: false, error: "Subject name is required." });
    }

    const existing = await prisma.subject.findFirst({
      where: { schoolId, name: { equals: name, mode: "insensitive" } },
    });
    if (existing) {
      return res.status(409).json({ success: false, error: "Subject already exists." });
    }

    const subject = await prisma.subject.create({
      data: {
        schoolId,
        name,
        shortCode: shortCode || name.substring(0, 4).toUpperCase(),
      },
    });

    res.status(201).json({ success: true, data: subject });
  } catch (error: any) {
    console.error("[subjects] Error creating:", error);
    res.status(500).json({ success: false, error: "Failed to create subject." });
  }
});

// DELETE /api/subjects/:id — admin/proprietor only
router.delete("/:id", authorize("SUPER_ADMIN", "SCHOOL_ADMIN", "PRINCIPAL"), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const schoolId = req.tenantId || req.user?.schoolId;
    if (!schoolId) {
      return res.status(403).json({ success: false, error: "No school association." });
    }

    const id = getParam(req, "id");
    const subject = await prisma.subject.findFirst({
      where: { id, schoolId },
    });
    if (!subject) {
      return res.status(404).json({ success: false, error: "Subject not found." });
    }

    await prisma.subject.delete({ where: { id } });
    res.json({ success: true, message: "Subject deleted." });
  } catch (error: any) {
    console.error("[subjects] Error deleting:", error);
    res.status(500).json({ success: false, error: "Failed to delete subject." });
  }
});

export default router;
