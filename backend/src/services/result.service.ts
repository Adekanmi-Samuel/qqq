import { prisma } from "../lib/prisma";

export class ResultService {
  /**
   * GET /api/results/sessions — list distinct academic years for a school
   */
  async getSessions(schoolId: string) {
    // Get from academic calendars
    const calendars = await prisma.academicCalendar.findMany({
      where: { schoolId },
      select: { academicYear: true },
      distinct: ["academicYear"],
      orderBy: { academicYear: "desc" },
    });
    return calendars.map((c) => c.academicYear);
  }

  /**
   * GET /api/results/load-sheet — fetch students + existing scores for a class/subject
   */
  async getLoadSheet(params: {
    schoolId: string;
    classArmId: string;
    subjectId: string;
    session: string;
    term: number;
  }) {
    const { schoolId, classArmId, subjectId, session, term } = params;

    // Verify class arm belongs to school
    const arm = await prisma.classArm.findFirst({
      where: { id: classArmId, class: { schoolId } },
    });
    if (!arm) throw { statusCode: 404, message: "Class arm not found." };

    // Get students in this class arm
    const students = await prisma.student.findMany({
      where: { armId: classArmId, active: true },
      select: { id: true, admissionNumber: true, fullName: true, gender: true },
      orderBy: { fullName: "asc" },
    });

    // Get existing results for this class/subject/session/term
    const existingResults = await prisma.termResult.findMany({
      where: { classArmId, subjectId, session, term },
      select: {
        studentId: true,
        caScore: true,
        examScore: true,
        totalScore: true,
        grade: true,
        locked: true,
      },
    });
    const resultMap = new Map(existingResults.map((r) => [r.studentId, r]));

    // Merge
    return students.map((s) => ({
      studentId: s.id,
      admissionNumber: s.admissionNumber,
      fullName: s.fullName,
      gender: s.gender,
      caScore: resultMap.get(s.id)?.caScore ?? null,
      examScore: resultMap.get(s.id)?.examScore ?? null,
      totalScore: resultMap.get(s.id)?.totalScore ?? null,
      grade: resultMap.get(s.id)?.grade ?? null,
      locked: resultMap.get(s.id)?.locked ?? false,
    }));
  }

  /**
   * PUT /api/results/batch — bulk save scores
   */
  async batchSave(params: {
    schoolId: string;
    classArmId: string;
    subjectId: string;
    session: string;
    term: number;
    scores: Array<{
      studentId: string;
      caScore?: number | null;
      examScore?: number | null;
    }>;
  }) {
    const { schoolId, classArmId, subjectId, session, term, scores } = params;

    // Get grading config (defaults)
    const caPercent = 40;
    const examPercent = 60;
    const passMark = 40;

    const results = [];

    for (const score of scores) {
      const ca = score.caScore ?? 0;
      const exam = score.examScore ?? 0;
      const total = (ca * caPercent) / 100 + (exam * examPercent) / 100;
      const grade = this.calculateGrade(total);
      const remark = this.getRemark(grade);

      const result = await prisma.termResult.upsert({
        where: {
          studentId_classArmId_session_term_subjectId: {
            studentId: score.studentId,
            classArmId,
            session,
            term,
            subjectId,
          },
        },
        create: {
          studentId: score.studentId,
          classArmId,
          session,
          term,
          subjectId,
          caScore: ca || null,
          examScore: exam || null,
          totalScore: total,
          grade,
          remark,
        },
        update: {
          caScore: ca || null,
          examScore: exam || null,
          totalScore: total,
          grade,
          remark,
        },
      });

      results.push(result);
    }

    return results;
  }

  /**
   * POST /api/results/lock — lock results for a class/subject/term
   */
  async lock(params: {
    classArmId: string;
    subjectId: string;
    session: string;
    term: number;
  }) {
    const { classArmId, subjectId, session, term } = params;

    const { count } = await prisma.termResult.updateMany({
      where: { classArmId, subjectId, session, term },
      data: { locked: true },
    });

    // Send email notification to parents (fire-and-forget)
    if (count > 0) {
      this.notifyParentsOnLock({ classArmId, subjectId, session, term }).catch(() => {});
    }

    return { message: `${count} result(s) locked.` };
  }

  private async notifyParentsOnLock(params: {
    classArmId: string;
    subjectId: string;
    session: string;
    term: number;
  }) {
    try {
      const { classArmId, subjectId, session, term } = params;

      // Get the class arm and subject info
      const [arm, subject] = await Promise.all([
        prisma.classArm.findUnique({
          where: { id: classArmId },
          include: { class: { select: { name: true, schoolId: true, school: { select: { name: true } } } } },
        }),
        prisma.subject.findUnique({ where: { id: subjectId }, select: { name: true } }),
      ]);

      if (!arm || !subject) return;

      // Get students with results
      const results = await prisma.termResult.findMany({
        where: { classArmId, subjectId, session, term, locked: true },
        select: {
          studentId: true,
          totalScore: true,
          grade: true,
        },
      });

      // Get parent links for these students
      const parentLinks = await prisma.parentStudentLink.findMany({
        where: { studentId: { in: results.map(r => r.studentId) } },
        include: {
          parent: { select: { fullName: true, email: true } },
          student: { select: { fullName: true } },
        },
      });

      if (parentLinks.length === 0) return;

      // Import and send
      const { sendResult } = await import("../services/emailService");
      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";

      for (const link of parentLinks) {
        const result = results.find(r => r.studentId === link.studentId);
        if (!result || !link.parent.email) continue;

        sendResult({
          parentEmail: link.parent.email,
          parentName: link.parent.fullName || "Parent",
          studentName: link.student.fullName,
          term: `Term ${term}`,
          session,
          schoolName: arm.class.school.name,
          resultUrl: `${frontendUrl}/dashboard/parent`,
        });
      }
    } catch (error) {
      console.error("[Email] Failed to notify parents on lock:", error);
    }
  }

  /**
   * POST /api/results/unlock — unlock results
   */
  async unlock(params: {
    classArmId: string;
    subjectId: string;
    session: string;
    term: number;
  }) {
    const { classArmId, subjectId, session, term } = params;

    const { count } = await prisma.termResult.updateMany({
      where: { classArmId, subjectId, session, term },
      data: { locked: false },
    });

    return { message: `${count} result(s) unlocked.` };
  }

  /**
   * GET /api/results/subjects?classArmId=
   * Get subjects available for a class arm (for dropdown)
   */
  async getSubjectsForArm(classArmId: string) {
    const assignments = await prisma.subjectTeacher.findMany({
      where: { classArmId },
      include: {
        subject: { select: { id: true, name: true, shortCode: true } },
        teacher: { select: { id: true, fullName: true } },
      },
    });

    return assignments.map((a) => ({
      subjectId: a.subject.id,
      subjectName: a.subject.name,
      shortCode: a.subject.shortCode,
      teacherId: a.teacher.id,
      teacherName: a.teacher.fullName,
    }));
  }

  private calculateGrade(total: number): string {
    if (total >= 75) return "A1";
    if (total >= 70) return "B2";
    if (total >= 65) return "B3";
    if (total >= 60) return "C4";
    if (total >= 55) return "C5";
    if (total >= 50) return "C6";
    if (total >= 45) return "D7";
    if (total >= 40) return "E8";
    return "F9";
  }

  private getRemark(grade: string): string {
    switch (grade) {
      case "A1": return "Excellent";
      case "B2": return "Very Good";
      case "B3": return "Good";
      case "C4":
      case "C5":
      case "C6": return "Credit";
      case "D7":
      case "E8": return "Pass";
      case "F9": return "Fail";
      default: return "";
    }
  }
}

export const resultService = new ResultService();
