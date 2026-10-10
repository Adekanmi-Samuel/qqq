import { prisma } from "../lib/prisma";

export class TimesheetService {
  /**
   * Create or update a teacher's timesheet for a week
   */
  async upsertTimesheet(data: {
    schoolId: string;
    teacherId: string;
    weekStart: Date;
    periodsTaught?: number;
    periodsScheduled?: number;
    notes?: string;
  }) {
    return prisma.teacherTimesheet.upsert({
      where: {
        teacherId_weekStart: {
          teacherId: data.teacherId,
          weekStart: data.weekStart,
        },
      },
      create: {
        schoolId: data.schoolId,
        teacherId: data.teacherId,
        weekStart: data.weekStart,
        periodsTaught: data.periodsTaught || 0,
        periodsScheduled: data.periodsScheduled || 0,
        notes: data.notes,
        status: "DRAFT",
      },
      update: {
        periodsTaught: data.periodsTaught || 0,
        periodsScheduled: data.periodsScheduled || 0,
        notes: data.notes,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Submit timesheet for approval
   */
  async submitTimesheet(timesheetId: string, teacherId: string) {
    const timesheet = await prisma.teacherTimesheet.findUnique({
      where: { id: timesheetId },
    });

    if (!timesheet) throw { statusCode: 404, message: "Timesheet not found" };
    if (timesheet.teacherId !== teacherId) throw { statusCode: 403, message: "Not authorized" };
    if (timesheet.status !== "DRAFT") throw { statusCode: 400, message: "Timesheet already submitted" };

    return prisma.teacherTimesheet.update({
      where: { id: timesheetId },
      data: {
        status: "SUBMITTED",
        submittedAt: new Date(),
      },
    });
  }

  /**
   * Approve timesheet (admin/bursar)
   */
  async approveTimesheet(timesheetId: string, approvedBy: string) {
    return prisma.teacherTimesheet.update({
      where: { id: timesheetId },
      data: {
        status: "APPROVED",
        approvedAt: new Date(),
        approvedBy: { connect: { id: approvedBy } },
      },
    });
  }

  /**
   * Get timesheet by ID
   */
  async getTimesheetById(timesheetId: string) {
    return prisma.teacherTimesheet.findUnique({
      where: { id: timesheetId },
      include: {
        teacher: { select: { id: true, fullName: true, email: true } },
        school: { select: { id: true, name: true } },
      },
    });
  }

  /**
   * Get teacher's timesheets
   */
  async getTeacherTimesheets(teacherId: string, limit = 10) {
    return prisma.teacherTimesheet.findMany({
      where: { teacherId },
      orderBy: { weekStart: "desc" },
      take: limit,
      include: {
        teacher: { select: { fullName: true } },
      },
    });
  }

  /**
   * Get current week's timesheet for teacher
   */
  async getCurrentWeekTimesheet(teacherId: string) {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay() + 1); // Monday
    weekStart.setHours(0, 0, 0, 0);

    return prisma.teacherTimesheet.findUnique({
      where: {
        teacherId_weekStart: {
          teacherId,
          weekStart,
        },
      },
      include: {
        teacher: { select: { fullName: true } },
      },
    });
  }

  /**
   * Get all timesheets for a school (admin view)
   */
  async getSchoolTimesheets(schoolId: string, weekStart?: Date) {
    const where: any = { schoolId };
    if (weekStart) where.weekStart = weekStart;

    return prisma.teacherTimesheet.findMany({
      where,
      orderBy: [{ weekStart: "desc" }, { teacher: { fullName: "asc" } }],
      include: {
        teacher: { select: { id: true, fullName: true, email: true } },
      },
    });
  }

  /**
   * Get teacher dashboard with timesheet info
   */
  async getTeacherDashboard(teacherId: string) {
    const teacher = await prisma.user.findUnique({
      where: { id: teacherId },
      select: { schoolId: true, fullName: true },
    });

    if (!teacher) throw { statusCode: 404, message: "Teacher not found" };

    // Current week timesheet
    const currentWeekTimesheet = await this.getCurrentWeekTimesheet(teacherId);

    // Recent timesheets
    const recentTimesheets = await this.getTeacherTimesheets(teacherId, 5);

    // Get this week's scheduled periods from timetable
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay() + 1);
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 4); // Friday
    weekEnd.setHours(23, 59, 59, 999);

    const scheduledSlots = await prisma.timetableSlot.findMany({
      where: {
        teacherId,
        dayOfWeek: { gte: 0, lte: 4 }, // Mon-Fri
      },
      include: {
        arm: { select: { name: true, class: { select: { name: true } } } },
        subject: { select: { name: true, shortCode: true } },
      },
      orderBy: [{ dayOfWeek: "asc" }, { period: "asc" }],
    });

    const periodsScheduled = scheduledSlots.length;

    return {
      teacherName: teacher.fullName,
      currentWeek: {
        weekStart,
        weekEnd,
        timesheet: currentWeekTimesheet
          ? {
              id: currentWeekTimesheet.id,
              periodsTaught: currentWeekTimesheet.periodsTaught,
              periodsScheduled: currentWeekTimesheet.periodsScheduled,
              status: currentWeekTimesheet.status,
              submittedAt: currentWeekTimesheet.submittedAt,
              completionRate:
                currentWeekTimesheet.periodsScheduled > 0
                  ? Math.round(
                      (currentWeekTimesheet.periodsTaught / currentWeekTimesheet.periodsScheduled) * 100
                    )
                  : 0,
            }
          : null,
        scheduledPeriods: periodsScheduled,
        todaySchedule: this.getTodaySchedule(scheduledSlots),
      },
      recentTimesheets: recentTimesheets.map((t) => ({
        id: t.id,
        weekStart: t.weekStart,
        periodsTaught: t.periodsTaught,
        periodsScheduled: t.periodsScheduled,
        status: t.status,
        submittedAt: t.submittedAt,
        completionRate:
          t.periodsScheduled > 0 ? Math.round((t.periodsTaught / t.periodsScheduled) * 100) : 0,
      })),
    };
  }

  private getTodaySchedule(slots: any[]) {
    const dayIndex = (new Date().getDay() + 6) % 7; // Monday=0, Sunday=6
    return slots
      .filter((s) => s.dayOfWeek === dayIndex)
      .map((s) => ({
        id: s.id,
        time: `${8 + s.period}:00`,
        subject: s.subject.name,
        class: `${s.arm.class.name} ${s.arm.name}`,
      }));
  }

  /**
   * Get all teachers with their timesheet status for admin
   */
  async getAllTeachersTimesheetStatus(schoolId: string) {
    const teachers = await prisma.user.findMany({
      where: { schoolId, role: "TEACHER", active: true },
      select: { id: true, fullName: true, email: true },
    });

    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay() + 1);
    weekStart.setHours(0, 0, 0, 0);

    const timesheets = await prisma.teacherTimesheet.findMany({
      where: { schoolId, weekStart },
      select: { teacherId: true, status: true, periodsTaught: true, periodsScheduled: true, submittedAt: true },
    });

    const timesheetMap = new Map(timesheets.map((t) => [t.teacherId, t]));

    return teachers.map((t) => {
      const ts = timesheetMap.get(t.id);
      return {
        teacherId: t.id,
        teacherName: t.fullName,
        teacherEmail: t.email,
        status: ts?.status || "NOT_STARTED",
        periodsTaught: ts?.periodsTaught || 0,
        periodsScheduled: ts?.periodsScheduled || 0,
        submittedAt: ts?.submittedAt || null,
        completionRate: ts?.periodsScheduled
          ? Math.round((ts.periodsTaught / ts.periodsScheduled) * 100)
          : 0,
      };
    });
  }
}

export const timesheetService = new TimesheetService();
