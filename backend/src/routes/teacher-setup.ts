import { Router } from "express";
import { z } from "zod";
import { authenticate, authorize } from "../middleware/auth";
import { prisma } from "../lib/prisma";
import { AuthenticatedRequest } from "../types";

const router = Router();

const setupSchema = z.object({
  classArmIds: z.array(z.string()).min(1, "Select at least one class."),
  subjectIds: z.array(z.string()).min(1, "Select at least one subject."),
  replaceAll: z.boolean().optional().default(false),
});

// GET /api/teacher/setup — options + current assignments
router.get("/setup", authenticate, authorize("TEACHER"), async (req: AuthenticatedRequest, res) => {
  try {
    const schoolId = req.user?.schoolId;
    const teacherId = req.user?.userId;
    if (!schoolId || !teacherId) {
      return res.status(400).json({ success: false, error: "Teacher school not found." });
    }

    const [classes, subjects, assignments] = await Promise.all([
      prisma.class.findMany({
        where: { schoolId },
        include: { arms: { select: { id: true, name: true, classTeacherId: true } } },
        orderBy: { name: "asc" },
      }),
      prisma.subject.findMany({
        where: { schoolId },
        select: { id: true, name: true, shortCode: true },
        orderBy: { name: "asc" },
      }),
      prisma.subjectTeacher.findMany({
        where: { teacherId, schoolId },
        select: {
          id: true,
          subjectId: true,
          classArmId: true,
          subject: { select: { id: true, name: true } },
          arm: {
            select: {
              id: true,
              name: true,
              class: { select: { id: true, name: true } },
            },
          },
        },
      }),
    ]);

    res.json({
      success: true,
      data: {
        classes,
        subjects,
        assignments,
        hasSetup: assignments.length > 0,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: "Failed to load teacher setup." });
  }
});

// POST /api/teacher/setup — save selected classes and subjects
router.post("/setup", authenticate, authorize("TEACHER"), async (req: AuthenticatedRequest, res) => {
  try {
    const schoolId = req.user?.schoolId;
    const teacherId = req.user?.userId;
    if (!schoolId || !teacherId) {
      return res.status(400).json({ success: false, error: "Teacher school not found." });
    }

    const parsed = setupSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: parsed.error.errors.map((e) => e.message).join(" "),
      });
    }

    const { classArmIds, subjectIds, replaceAll } = parsed.data;

    const [arms, subjects] = await Promise.all([
      prisma.classArm.findMany({
        where: { id: { in: classArmIds }, class: { schoolId } },
        select: { id: true },
      }),
      prisma.subject.findMany({
        where: { id: { in: subjectIds }, schoolId },
        select: { id: true },
      }),
    ]);

    if (arms.length !== classArmIds.length) {
      return res.status(400).json({ success: false, error: "One or more classes are invalid." });
    }
    if (subjects.length !== subjectIds.length) {
      return res.status(400).json({ success: false, error: "One or more subjects are invalid." });
    }

    if (replaceAll) {
      await prisma.subjectTeacher.deleteMany({ where: { teacherId, schoolId } });
      // Only claim free arms; never seize classTeacherId from another teacher.
      for (const arm of arms) {
        const current = await prisma.classArm.findUnique({
          where: { id: arm.id },
          select: { classTeacherId: true },
        });
        if (!current?.classTeacherId || current.classTeacherId === teacherId) {
          await prisma.classArm.update({
            where: { id: arm.id },
            data: { classTeacherId: teacherId },
          });
        }
      }
    }

    let created = 0;
    let conflicts = 0;
    for (const arm of arms) {
      // Only claim class teacher role when the arm is free.
      const current = await prisma.classArm.findUnique({
        where: { id: arm.id },
        select: { classTeacherId: true },
      });
      if (!current?.classTeacherId || current.classTeacherId === teacherId) {
        await prisma.classArm.update({
          where: { id: arm.id },
          data: { classTeacherId: teacherId },
        });
      }
      for (const subject of subjects) {
        const existing = await prisma.subjectTeacher.findFirst({
          where: { schoolId, subjectId: subject.id, classArmId: arm.id },
        });
        if (!existing) {
          await prisma.subjectTeacher.create({
            data: {
              schoolId,
              subjectId: subject.id,
              classArmId: arm.id,
              teacherId,
            },
          });
          created += 1;
        } else if (existing.teacherId !== teacherId) {
          // Do not steal subjects from other teachers.
          conflicts += 1;
        }
      }
    }

    const assignments = await prisma.subjectTeacher.findMany({
      where: { teacherId, schoolId },
      select: {
        id: true,
        subjectId: true,
        classArmId: true,
        subject: { select: { id: true, name: true } },
        arm: {
          select: {
            id: true,
            name: true,
            class: { select: { id: true, name: true } },
          },
        },
      },
    });

    res.json({
      success: true,
      message: conflicts
        ? `Teaching setup saved. ${conflicts} subject(s) already assigned to another teacher were left unchanged.`
        : "Teaching setup saved.",
      data: {
        assignments,
        classes: arms.length,
        subjects: subjects.length,
        linksCreated: created,
        conflicts,
      },
    });
  } catch (error: any) {
    console.error("[teacher-setup] save failed:", error);
    if (error?.statusCode || error?.code) {
      res.status(error.statusCode || 400).json({ success: false, error: error.message || "Failed to save teacher setup." });
      return;
    }
    res.status(500).json({ success: false, error: "Failed to save teacher setup.", code: "TEACHER_SETUP_FAILED" });
  }
});

export default router;
