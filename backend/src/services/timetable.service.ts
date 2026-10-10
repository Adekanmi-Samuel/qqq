import { prisma } from "../lib/prisma";

export class TimetableService {
  /**
   * GET /api/timetable?classArmId=xxx
   * Fetch all timetable slots for a class arm, enriched with subject & teacher names.
   */
  async getByClassArm(classArmId: string, schoolId?: string) {
    return prisma.timetableSlot.findMany({
      where: schoolId ? { classArmId, schoolId } : { classArmId },
      include: {
        subject: { select: { id: true, name: true, shortCode: true } },
        teacher: { select: { id: true, fullName: true } },
      },
      orderBy: [{ dayOfWeek: "asc" }, { period: "asc" }],
    });
  }

  /**
   * POST /api/timetable — create or update a slot
   * Uses upsert to handle unique constraint on (classArmId, dayOfWeek, period)
   */
  async upsertSlot(data: {
    schoolId: string;
    classArmId: string;
    subjectId: string;
    teacherId: string;
    dayOfWeek: number;
    period: number;
    startTime: string;
    endTime: string;
    room?: string;
  }) {
    const where = {
      classArmId_dayOfWeek_period: {
        classArmId: data.classArmId,
        dayOfWeek: data.dayOfWeek,
        period: data.period,
      },
    };

    return prisma.timetableSlot.upsert({
      where,
      create: data,
      update: {
        subjectId: data.subjectId,
        teacherId: data.teacherId,
        startTime: data.startTime,
        endTime: data.endTime,
        room: data.room || null,
      },
    });
  }

  /**
   * POST /api/timetable/batch — batch upsert a full timetable
   */
  async batchUpsert(schoolId: string, classArmId: string, slots: any[]) {
    const results = [];
    for (const slot of slots) {
      const result = await this.upsertSlot({ schoolId, classArmId, ...slot });
      results.push(result);
    }
    return results;
  }

  /**
   * DELETE /api/timetable/:id — delete a slot
   */
  async deleteSlot(id: string) {
    return prisma.timetableSlot.delete({ where: { id } });
  }

  /**
   * GET /api/timetable/available-subjects?classArmId=xxx
   * Returns subjects with assigned teachers for a class arm (drag source).
   */
  async getAvailableSubjects(classArmId: string) {
    // Get subjects assigned to this class arm
    const assignments = await prisma.subjectTeacher.findMany({
      where: { classArmId },
      include: {
        subject: { select: { id: true, name: true, shortCode: true } },
        teacher: { select: { id: true, fullName: true } },
      },
    });

    // Get subjects already placed in timetable
    const placedSubjectIds = (
      await prisma.timetableSlot.findMany({
        where: { classArmId },
        select: { subjectId: true },
        distinct: ["subjectId"],
      })
    ).map((s) => s.subjectId);

    return {
      assigned: assignments.map((a) => ({
        subjectId: a.subject.id,
        subjectName: a.subject.name,
        shortCode: a.subject.shortCode,
        teacherId: a.teacher.id,
        teacherName: a.teacher.fullName,
      })),
      placedSubjectIds,
    };
  }

  /**
   * GET /api/timetable/teachers — list teachers for a school
   */
  async getTeachers(schoolId: string) {
    return prisma.user.findMany({
      where: { schoolId, role: "TEACHER", active: true },
      select: { id: true, fullName: true, email: true },
      orderBy: { fullName: "asc" },
    });
  }

  /**
   * GET /api/timetable/subjects — list subjects for a school
   */
  async getSubjects(schoolId: string) {
    return prisma.subject.findMany({
      where: { schoolId },
      orderBy: { name: "asc" },
    });
  }

  /**
   * GET /api/timetable/class-arms — list class arms for a school
   */
  async getClassArms(schoolId: string) {
    return prisma.classArm.findMany({
      where: { class: { schoolId } },
      include: {
        class: { select: { id: true, name: true } },
        classTeacher: { select: { id: true, fullName: true } },
        _count: { select: { students: true } },
      },
      orderBy: [{ class: { name: "asc" } }, { name: "asc" }],
    });
  }

  /**
   * GET /api/timetable/my-slots
   * Fetch timetable slots for the logged-in teacher.
   * Returns both nested `arm` and flattened `classArm` / `class`
   * so dashboard and attendance UI can read either shape safely.
   */
  async getMySlots(teacherId: string) {
    const slots = await prisma.timetableSlot.findMany({
      where: { teacherId },
      include: {
        subject: { select: { id: true, name: true, shortCode: true } },
        arm: { select: { id: true, name: true, class: { select: { id: true, name: true } } } },
      },
      orderBy: [{ dayOfWeek: "asc" }, { period: "asc" }],
    });

    return slots.map((slot) => {
      const arm = slot.arm as any;
      const classInfo = arm?.class || null;
      return {
        ...slot,
        classArm: arm ? { id: arm.id, name: arm.name } : null,
        class: classInfo ? { id: classInfo.id, name: classInfo.name } : null,
      };
    });
  }
}

export const timetableService = new TimetableService();
