import { Router } from "express";
import { z } from "zod";
import { authenticate, authorize } from "../middleware/auth";
import { prisma } from "../lib/prisma";
import { AuthenticatedRequest } from "../types";
import { buildAssignments, buildExercises, buildLessonNoteHtml, buildMidtermFocusHtml } from "../utils/lessonNoteContent";
import { buildAiLessonNoteHtml, isAiGenerated } from "../utils/aiLessonNote";
import { sanitizeHtml } from "../utils/sanitize";

const router = Router();
const PROPRIETOR = ["SUPER_ADMIN", "SCHOOL_ADMIN", "PRINCIPAL"] as const;

const saveTimetableSchema = z.object({
  classArmId: z.string().min(1),
  slots: z.array(
    z.object({
      subjectId: z.string().min(1),
      teacherId: z.string().optional(),
      dayOfWeek: z.number().min(0).max(4),
      period: z.number().min(1).max(12),
      startTime: z.string(),
      endTime: z.string(),
      room: z.string().optional(),
    })
  ).min(1),
});

const saveSchemeSchema = z.object({
  subjectId: z.string().min(1),
  classId: z.string().min(1),
  title: z.string().min(2),
  session: z.string().min(4),
  term: z.number().int().min(1).max(3),
  weeks: z.array(z.object({
    week: z.number().int().min(1).max(20),
    topic: z.string().min(2),
  })).min(1),
  periodsPerWeek: z.number().int().min(1).max(10).optional(),
  minutesPerPeriod: z.number().int().min(10).max(120).optional(),
  // Default false so scheme saves never wipe teacher-edited notes unless asked.
  generateNotes: z.boolean().optional().default(false),
  overwriteNotes: z.boolean().optional().default(false),
});

// GET /api/school/curriculum — proprietor workspace data
router.get("/curriculum", authenticate, authorize(...PROPRIETOR), async (req: AuthenticatedRequest, res) => {
  try {
    const schoolId = req.tenantId || req.user?.schoolId;
    if (!schoolId) return res.status(400).json({ success: false, error: "Tenant not identified." });

    const [classes, subjects, teachers, arms] = await Promise.all([
      prisma.class.findMany({
        where: { schoolId },
        include: {
          arms: {
            include: {
              classTeacher: { select: { id: true, fullName: true } },
              _count: { select: { students: true, timetableSlots: true } },
            },
          },
        },
        orderBy: { name: "asc" },
      }),
      prisma.subject.findMany({
        where: { schoolId },
        select: { id: true, name: true, shortCode: true },
        orderBy: { name: "asc" },
      }),
      prisma.user.findMany({
        where: { schoolId, role: { in: ["TEACHER", "PRINCIPAL"] }, active: true },
        select: { id: true, fullName: true, email: true },
        orderBy: { fullName: "asc" },
      }),
      prisma.classArm.findMany({
        where: { class: { schoolId } },
        include: {
          class: { select: { id: true, name: true } },
          classTeacher: { select: { id: true, fullName: true } },
          timetableSlots: {
            include: {
              subject: { select: { id: true, name: true } },
              teacher: { select: { id: true, fullName: true } },
            },
            orderBy: [{ dayOfWeek: "asc" }, { period: "asc" }],
          },
        },
      }),
    ]);

    const schemes = await prisma.schemeOfWork.findMany({
      where: { schoolId },
      include: {
        subject: { select: { id: true, name: true } },
        class: { select: { id: true, name: true } },
        lessonNotes: { select: { id: true, weekNumber: true, topic: true } },
      },
      orderBy: [{ class: { name: "asc" } }, { subject: { name: "asc" } }],
    });

    const assignments = await prisma.subjectTeacher.findMany({
      where: { schoolId },
      select: {
        subjectId: true,
        classArmId: true,
        teacherId: true,
        teacher: { select: { id: true, fullName: true, email: true } },
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

    const coverage = arms.map((arm) => {
      const armSubjects = assignments.filter((a) => a.classArmId === arm.id);
      const coveredSubjectIds = new Set(armSubjects.map((a) => a.subjectId));
      const missing = subjects
        .filter((s) => !coveredSubjectIds.has(s.id))
        .map((s) => s.name);
      return {
        classArmId: arm.id,
        className: arm.class?.name || "Class",
        armName: arm.name,
        totalSubjects: subjects.length,
        covered: coveredSubjectIds.size,
        missing,
        teacher: arm.classTeacher
          ? { id: arm.classTeacher.id, fullName: arm.classTeacher.fullName }
          : null,
      };
    });

    const missingTeacherSubjects = coverage.flatMap((c) =>
      c.missing.map((name) => ({
        className: c.className,
        armName: c.armName,
        subject: name,
      }))
    );

    res.json({
      success: true,
      data: {
        classes,
        subjects,
        teachers,
        arms,
        schemes,
        coverage,
        missingTeacherSubjects,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: "Failed to load curriculum workspace." });
  }
});

// POST /api/school/timetable — proprietor saves a class arm timetable
router.post("/timetable", authenticate, authorize(...PROPRIETOR), async (req: AuthenticatedRequest, res) => {
  try {
    const schoolId = req.tenantId || req.user?.schoolId;
    if (!schoolId) return res.status(400).json({ success: false, error: "Tenant not identified." });

    const parsed = saveTimetableSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: parsed.error.errors.map((e) => e.message).join(" "),
      });
    }

    const { classArmId, slots } = parsed.data;
    const arm = await prisma.classArm.findFirst({
      where: { id: classArmId, class: { schoolId } },
    });
    if (!arm) return res.status(404).json({ success: false, error: "Class arm not found." });

    let saved = 0;
    const skippedSubjects: string[] = [];
    for (const slot of slots) {
      const subject = await prisma.subject.findFirst({
        where: { id: slot.subjectId, schoolId },
      });
      if (!subject) {
        skippedSubjects.push(slot.subjectId);
        continue;
      }

      const teacherId = slot.teacherId || arm.classTeacherId;
      if (teacherId) {
        const teacherOk = await prisma.user.findFirst({
          where: {
            id: teacherId,
            schoolId,
            role: { in: ["TEACHER", "PRINCIPAL"] },
            active: true,
          },
          select: { id: true },
        });
        if (!teacherOk) {
          return res.status(400).json({ success: false, error: "Teacher not found in this school." });
        }
      }
      await prisma.timetableSlot.upsert({
        where: {
          classArmId_dayOfWeek_period: {
            classArmId,
            dayOfWeek: slot.dayOfWeek,
            period: slot.period,
          },
        },
        update: {
          subjectId: subject.id,
          teacherId: teacherId || "",
          startTime: slot.startTime,
          endTime: slot.endTime,
          room: slot.room || null,
        },
        create: {
          schoolId,
          classArmId,
          subjectId: subject.id,
          teacherId: teacherId || "",
          dayOfWeek: slot.dayOfWeek,
          period: slot.period,
          startTime: slot.startTime,
          endTime: slot.endTime,
          room: slot.room || null,
        } as any,
      });
      saved += 1;
    }

    const message = skippedSubjects.length
      ? `Saved ${saved} timetable slots. ${skippedSubjects.length} slot(s) skipped because the subject is not in this school.`
      : `Saved ${saved} timetable slots.`;
    res.json({ success: true, message, data: { saved, skipped: skippedSubjects.length, skippedSubjectIds: skippedSubjects } });
  } catch (error: any) {
    console.error("[school-curriculum] timetable save failed:", error);
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || "Failed to save timetable.",
      code: "TIMETABLE_SAVE_FAILED",
    });
  }
});

// POST /api/school/schemes — proprietor creates or updates a scheme of work
router.post("/schemes", authenticate, authorize(...PROPRIETOR), async (req: AuthenticatedRequest, res) => {
  try {
    const schoolId = req.tenantId || req.user?.schoolId;
    if (!schoolId) return res.status(400).json({ success: false, error: "Tenant not identified." });

    const parsed = saveSchemeSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: parsed.error.errors.map((e) => e.message).join(" "),
      });
    }

    const body = parsed.data;
    const [subject, classRec] = await Promise.all([
      prisma.subject.findFirst({ where: { id: body.subjectId, schoolId } }),
      prisma.class.findFirst({ where: { id: body.classId, schoolId } }),
    ]);
    if (!subject || !classRec) {
      return res.status(404).json({ success: false, error: "Subject or class not found." });
    }

    const school = await prisma.school.findUnique({ where: { id: schoolId } });
    const weeks = body.weeks.map((w) => ({ week: w.week, topic: w.topic, isCompleted: false }));

    let scheme = await prisma.schemeOfWork.findFirst({
      where: { schoolId, subjectId: subject.id, classId: classRec.id, session: body.session, term: body.term },
    });

    if (!scheme) {
      scheme = await prisma.schemeOfWork.create({
        data: {
          schoolId,
          subjectId: subject.id,
          classId: classRec.id,
          title: body.title,
          session: body.session,
          term: body.term,
          weeks: weeks as any,
          periodsPerWeek: body.periodsPerWeek ?? 2,
          minutesPerPeriod: body.minutesPerPeriod ?? 40,
        } as any,
      });
    } else {
      scheme = await prisma.schemeOfWork.update({
        where: { id: scheme.id },
        data: {
          title: body.title,
          weeks: weeks as any,
          periodsPerWeek: body.periodsPerWeek ?? scheme.periodsPerWeek,
          minutesPerPeriod: body.minutesPerPeriod ?? scheme.minutesPerPeriod,
        },
      });
    }

    let notesCreated = 0;
    // AI notes are slow (~5 to 15s each). Cap per request to stay inside the
    // serverless time budget; remaining weeks are upgraded on demand.
    const AI_NOTES_PER_REQUEST = 3;
    let aiAttempts = 0;
    if (body.generateNotes === true) {
      const existingNotes = await prisma.lessonNote.findMany({
        where: { schemeId: scheme.id },
        select: { weekNumber: true, content: true, exercises: true, assignments: true },
      });
      const existingByWeek = new Map(existingNotes.map((n) => [n.weekNumber, n]));

      for (const week of weeks) {
        const existing = existingByWeek.get(week.week);
        const hasTeacherContent =
          !!existing &&
          ((existing.content && existing.content.trim().length > 0) ||
            (Array.isArray(existing.exercises) && existing.exercises.length > 0) ||
            (Array.isArray(existing.assignments) && existing.assignments.length > 0));

        // Never overwrite teacher-edited notes unless overwriteNotes is explicitly true.
        if (hasTeacherContent && body.overwriteNotes !== true) {
          continue;
        }

        const topicPayload = {
          schoolName: school?.name || "School",
          subject: subject.name,
          classLevel: classRec.name,
          topic: week.topic,
          weekNumber: week.week,
          session: body.session,
          term: body.term,
        };

        // Prefer a real AI written note, unique to this school and topic.
        // Fall back to the deterministic template so generation never blocks.
        // AI calls are slow, so only a few are attempted per request; the
        // rest are filled by the "Generate with AI" endpoint or on first open.
        let content = "";
        if (aiAttempts < AI_NOTES_PER_REQUEST) {
          aiAttempts += 1;
          const aiHtml = await buildAiLessonNoteHtml(topicPayload);
          if (aiHtml) {
            content = aiHtml;
          }
        }
        if (!content) {
          content = buildLessonNoteHtml(topicPayload) + (week.week === 5 ? "\n" + buildMidtermFocusHtml(subject.name, classRec.name, week.topic) : "");
        }

        await prisma.lessonNote.upsert({
          where: { schemeId_weekNumber: { schemeId: scheme.id, weekNumber: week.week } },
          update: {
            topic: week.topic,
            content: sanitizeHtml(content),
            exercises: buildExercises(subject.name, week.topic, classRec.name) as any,
            assignments: buildAssignments(week.topic, subject.name) as any,
          },
          create: {
            schemeId: scheme.id,
            weekNumber: week.week,
            topic: week.topic,
            content: sanitizeHtml(content),
            exercises: buildExercises(subject.name, week.topic, classRec.name) as any,
            assignments: buildAssignments(week.topic, subject.name) as any,
          },
        });
        notesCreated += 1;
      }
    }

    res.status(201).json({
      success: true,
      message: "Scheme saved.",
      data: { schemeId: scheme.id, weeks: weeks.length, notesCreated },
    });
  } catch (error: any) {
    console.error("[school-curriculum] scheme save failed:", error);
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || "Failed to save scheme.",
      code: "SCHEME_SAVE_FAILED",
    });
  }
});

/**
 * Upgrade one week's lesson note to a full AI written note.
 *
 * Notes are created from the deterministic template when a scheme is saved
 * (AI is slow, so only a few weeks are upgraded inline). This endpoint lets
 * the UI turn the remaining weeks into AI notes one at a time, which keeps
 * every request inside the serverless time budget.
 *
 * Never overwrites a note a teacher has edited: AI output is marked, and a
 * note without the marker is treated as teacher content.
 */
router.post("/lesson-notes/:noteId/generate", authenticate, authorize(...PROPRIETOR, "TEACHER"), async (req: AuthenticatedRequest, res) => {
  try {
    const schoolId = req.tenantId || req.user?.schoolId;
    if (!schoolId) return res.status(400).json({ success: false, error: "Tenant not identified." });

    const noteId = String((req.params as any).noteId || "");
    const note: any = await prisma.lessonNote.findUnique({
      where: { id: noteId },
      include: { scheme: { include: { subject: true, class: true, school: true } } },
    });

    if (!note) return res.status(404).json({ success: false, error: "Lesson note not found." });
    if (note.scheme.schoolId !== schoolId) {
      return res.status(403).json({ success: false, error: "Unauthorized." });
    }

    const hasTeacherContent = !!note.content && note.content.trim().length > 0;

    // A note is safe to regenerate when it is empty, was written by AI, or is
    // still exactly the deterministic template (untouched by a teacher).
    // Anything else is treated as teacher content and needs force.
    let isUntouchedTemplate = false;
    if (hasTeacherContent && !isAiGenerated(note.content)) {
      const templateHtml = sanitizeHtml(
        buildLessonNoteHtml({
          schoolName: note.scheme.school?.name || "School",
          subject: note.scheme.subject.name,
          classLevel: note.scheme.class.name,
          topic: note.topic,
          weekNumber: note.weekNumber,
          session: note.scheme.session,
          term: note.scheme.term,
        })
      );
      const strip = (s: string) => s.replace(/\s+/g, " ").trim();
      isUntouchedTemplate = strip(note.content) === strip(templateHtml) ||
        strip(note.content).startsWith(strip(templateHtml).slice(0, 300));
    }

    const force = req.body?.force === true;
    if (hasTeacherContent && !isAiGenerated(note.content) && !isUntouchedTemplate && !force) {
      return res.status(409).json({
        success: false,
        error: "This note has been edited by a teacher. Pass force to overwrite.",
        code: "TEACHER_EDITED",
      });
    }

    const html = await buildAiLessonNoteHtml({
      schoolName: note.scheme.school?.name || "School",
      subject: note.scheme.subject.name,
      classLevel: note.scheme.class.name,
      topic: note.topic,
      weekNumber: note.weekNumber,
      session: note.scheme.session,
      term: note.scheme.term,
    });

    if (!html) {
      return res.status(503).json({
        success: false,
        error: "AI is unavailable right now. Please try again shortly.",
        code: "AI_UNAVAILABLE",
      });
    }

    const updated = await prisma.lessonNote.update({
      where: { id: note.id },
      data: { content: sanitizeHtml(html) },
      select: { id: true, weekNumber: true, topic: true, content: true, updatedAt: true },
    });

    res.json({ success: true, message: "Lesson note generated.", data: updated });
  } catch (error: any) {
    console.error("[school-curriculum] AI note generation failed:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to generate note." });
  }
});

export default router;
