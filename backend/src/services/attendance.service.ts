import { prisma } from "../lib/prisma";
import { NotFoundError, BadRequestError } from "../utils/errors";

export class AttendanceService {
  /**
   * Get attendance records for a class arm on a specific date.
   */
  async get(schoolId: string, classArmId: string, date?: string) {
    // Verify the arm belongs to the caller's school
    const arm = await prisma.classArm.findFirst({
      where: { id: classArmId, class: { schoolId } },
      select: { id: true },
    });
    if (!arm) throw new NotFoundError("Class arm not found.");

    const where: any = { classArmId };
    if (date) {
      where.date = new Date(date);
    }

    return prisma.attendanceRecord.findMany({
      where,
      include: {
        student: { select: { id: true, fullName: true, admissionNumber: true } },
        markedBy: { select: { id: true, fullName: true } },
      },
      orderBy: { student: { fullName: "asc" } },
    });
  }

  /**
   * Get attendance for a specific student.
   */
  async getByStudent(schoolId: string, studentId: string, startDate?: string, endDate?: string) {
    // Verify the student belongs to the caller's school
    const student = await prisma.student.findFirst({
      where: { id: studentId, schoolId },
      select: { id: true },
    });
    if (!student) throw new NotFoundError("Student not found.");

    const where: any = { studentId };
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    return prisma.attendanceRecord.findMany({
      where,
      include: {
        arm: { select: { id: true, name: true } },
        markedBy: { select: { id: true, fullName: true } },
      },
      orderBy: { date: "desc" },
    });
  }

  /**
   * Mark attendance for multiple students.
   * Upserts — updates existing records or creates new ones.
   */
  async mark(
    schoolId: string,
    records: Array<{
      studentId: string;
      classArmId: string;
      status: "PRESENT" | "ABSENT" | "LATE";
      markedById: string;
      date?: string;
    }>
  ) {
    if (!records.length) {
      throw new BadRequestError("At least one attendance record is required.");
    }

    // Verify ALL students and class arms belong to the caller's school before writing
    const studentIds = [...new Set(records.map(r => r.studentId))];
    const classArmIds = [...new Set(records.map(r => r.classArmId))];

    const [validStudents, validArms] = await Promise.all([
      prisma.student.findMany({
        where: { id: { in: studentIds }, schoolId },
        select: { id: true },
      }),
      prisma.classArm.findMany({
        where: { id: { in: classArmIds }, class: { schoolId } },
        select: { id: true },
      }),
    ]);

    const validStudentSet = new Set(validStudents.map(s => s.id));
    const validArmSet = new Set(validArms.map(a => a.id));

    for (const r of records) {
      if (!validStudentSet.has(r.studentId)) {
        throw new NotFoundError(`Student ${r.studentId} not found in this school.`);
      }
      if (!validArmSet.has(r.classArmId)) {
        throw new NotFoundError(`Class arm ${r.classArmId} not found in this school.`);
      }
    }

    const results = await Promise.all(
      records.map((r) =>
        prisma.attendanceRecord.upsert({
          where: {
            studentId_classArmId_date: {
              studentId: r.studentId,
              classArmId: r.classArmId,
              date: r.date ? new Date(r.date) : new Date(),
            },
          },
          update: { status: r.status, markedById: r.markedById },
          create: {
            studentId: r.studentId,
            classArmId: r.classArmId,
            status: r.status,
            markedById: r.markedById,
            date: r.date ? new Date(r.date) : new Date(),
          },
        })
      )
    );

    return { count: results.length, records: results };
  }

  /**
   * Generate attendance report for a class arm over a date range.
   */
  async report(schoolId: string, classArmId: string, startDate?: string, endDate?: string) {
    // Verify the arm belongs to the caller's school
    const arm = await prisma.classArm.findFirst({
      where: { id: classArmId, class: { schoolId } },
      select: { id: true },
    });
    if (!arm) throw new NotFoundError("Class arm not found.");

    const where: any = { classArmId };
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    const records = await prisma.attendanceRecord.findMany({
      where,
      include: {
        student: { select: { id: true, fullName: true, admissionNumber: true } },
      },
      orderBy: [{ student: { fullName: "asc" } }, { date: "desc" }],
    });

    // Summarize: count PRESENT, ABSENT, LATE per student
    const summaryMap = new Map<string, {
      studentId: string;
      fullName: string;
      present: number;
      absent: number;
      late: number;
      total: number;
    }>();

    for (const record of records) {
      const key = record.studentId;
      if (!summaryMap.has(key)) {
        summaryMap.set(key, {
          studentId: record.studentId,
          fullName: record.student.fullName,
          present: 0,
          absent: 0,
          late: 0,
          total: 0,
        });
      }
      const summary = summaryMap.get(key)!;
      summary[record.status.toLowerCase() as "present" | "absent" | "late"]++;
      summary.total++;
    }

    return {
      records,
      summary: Array.from(summaryMap.values()),
      dateRange: { startDate, endDate },
    };
  }
}

export const attendanceService = new AttendanceService();
