import { prisma } from "../lib/prisma";

export class DashboardService {
  /**
   * Get current academic session for a school
   */
  private async getCurrentSession(schoolId: string): Promise<string> {
    const cal = await prisma.academicCalendar.findFirst({
      where: { schoolId, isCurrent: true },
      select: { academicYear: true }
    });
    if (cal?.academicYear) return cal.academicYear;
    const now = new Date();
    const startYear = now.getMonth() >= 8 ? now.getFullYear() : now.getFullYear() - 1;
    return `${startYear}/${startYear + 1}`;
  }

  /**
   * Get current term start date for a school
   */
  private async getCurrentTermStart(schoolId: string): Promise<Date> {
    const cal = await prisma.academicCalendar.findFirst({
      where: { schoolId, isCurrent: true },
      select: { startDate: true }
    });
    if (cal?.startDate) return cal.startDate;
    const now = new Date();
    const startYear = now.getMonth() >= 8 ? now.getFullYear() : now.getFullYear() - 1;
    return new Date(startYear, 8, 1); // September 1st of the academic year start
  }

  /**
   * Get attendance history for last 7 school days
   */
  private async getAttendanceHistory(schoolId: string): Promise<Array<{ date: string; rate: number; label: string }>> {
    const days: Array<{ date: string; rate: number; label: string }> = [];
    const today = new Date();

    let count = 0;
    let d = new Date(today);

    while (count < 7) {
      const dow = d.getDay();
      if (dow !== 0 && dow !== 6) { // Skip weekends
        const dayStart = new Date(d);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(d);
        dayEnd.setHours(23, 59, 59, 999);

        const attendance = await prisma.attendanceRecord.findMany({
          where: { date: { gte: dayStart, lte: dayEnd }, student: { schoolId } },
          select: { status: true },
        });

        const present = attendance.filter(a => a.status === "PRESENT").length;
        const total = attendance.length;
        const rate = total > 0 ? Math.round((present / total) * 100) : 0;

        days.unshift({
          date: d.toISOString().split("T")[0],
          rate,
          label: d.toLocaleDateString("en-NG", { weekday: "short" }),
        });
        count++;
      }
      d.setDate(d.getDate() - 1);
    }
    return days;
  }

  /**
   * GET /api/dashboard/admin — aggregated school stats
   */
  async getAdminStats(schoolId: string, session?: string) {
    // Use provided session or fetch current academic session
    const activeSession = session || await this.getCurrentSession(schoolId);
    const termStart = await this.getCurrentTermStart(schoolId);

    const [students, users, classes, attendanceHistory, noticesThisTerm] = await Promise.all([
      prisma.student.findMany({ where: { schoolId, active: true }, select: { id: true, createdAt: true, armId: true } }),
      prisma.user.findMany({ where: { schoolId, role: { in: ["TEACHER", "BURSAR"] }, active: true }, select: { id: true } }),
      prisma.class.findMany({ where: { schoolId }, select: { id: true, name: true, _count: { select: { arms: true } } } }),
      this.getAttendanceHistory(schoolId),
      prisma.notice.count({
        where: {
          schoolId,
          publishedAt: { not: null },
          createdAt: { gte: termStart }
        }
      }),
    ]);

    // Fee records for this session
    const feeRecords = await prisma.feeRecord.findMany({
      where: { schoolId, session: activeSession },
      select: { id: true, amount: true, status: true },
    });

    const totalFeesExpected = feeRecords.reduce((s, f) => s + f.amount, 0);
    const totalFeesCollected = feeRecords.filter(f => f.status === "PAID").reduce((s, f) => s + f.amount, 0);

    // Attendance today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const attendance = await prisma.attendanceRecord.findMany({
      where: { date: { gte: today, lt: tomorrow }, student: { schoolId } },
      select: { status: true, id: true },
    });
    const presentToday = attendance.filter(a => a.status === "PRESENT").length;
    const totalToday = attendance.length;

    // New students this term
    const newStudents = students.filter(s => new Date(s.createdAt) >= termStart).length;

    // Recent fee records
    const recentFeeRecords = await prisma.feeRecord.findMany({
      where: { schoolId, session: activeSession },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, amount: true, status: true, description: true, createdAt: true, student: { select: { fullName: true, admissionNumber: true } } },
    });

    const recentStudents = await prisma.student.findMany({
      where: { schoolId },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        fullName: true,
        admissionNumber: true,
        createdAt: true,
        arm: { select: { name: true, class: { select: { name: true } } } },
      },
    });

    // Recent notices
    const recentNotices = await prisma.notice.findMany({
      where: { schoolId, publishedAt: { not: null } },
      orderBy: { publishedAt: "desc" },
      take: 5,
      select: { id: true, title: true, publishedAt: true },
    });

    // Build structured activity events
    const recentActivity = [
      ...recentFeeRecords.map(f => ({
        id: `fee-${f.id}`,
        type: "fee" as const,
        message: `${f.status === "PAID" ? "Payment received" : "Payment pending"}: ₦${f.amount.toLocaleString()} ${f.description} — ${f.student?.fullName || "Unknown"}`,
        timestamp: f.createdAt,
      })),
      ...recentStudents.map(s => ({
        id: `student-${s.id}`,
        type: "student" as const,
        message: `New student enrolled: ${s.fullName} — ${s.arm?.class?.name || ""} ${s.arm?.name || ""}`,
        timestamp: s.createdAt,
      })),
      ...recentNotices.map(n => ({
        id: `notice-${n.id}`,
        type: "notice" as const,
        message: `Notice published: ${n.title}`,
        timestamp: n.publishedAt!,
      })),
    ]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 10);

    // Result publication rate (mock - would need TermResult counts)
    const resultPublicationRate = 75; // placeholder

    // Staff on duty (today's attendance marked by teachers)
    const staffOnDuty = await prisma.user.count({
      where: {
        schoolId,
        role: { in: ["TEACHER", "BURSAR", "PRINCIPAL", "SCHOOL_ADMIN"] },
        active: true,
        attendance: {
          some: {
            date: { gte: today, lt: tomorrow },
          },
        },
      },
    });

    return {
      totalStudents: students.length,
      totalStaff: users.length,
      activeClasses: classes.reduce((s, c) => s + c._count.arms, 0),
      totalFeesCollected,
      totalFeesExpected,
      feeCollectionRate: totalFeesExpected > 0 ? Math.round((totalFeesCollected / totalFeesExpected) * 100) : 0,
      attendanceRate: totalToday > 0 ? Math.round((presentToday / totalToday) * 100) : 0,
      newStudentsThisTerm: newStudents,
      staffOnDuty,
      noticesThisTerm,
      resultPublicationRate,
      recentActivity,
      attendanceHistory,
      classBreakdown: classes.map(c => ({
        className: c.name,
        arms: c._count.arms,
      })),
    };
  }

  /**
   * GET /api/dashboard/teacher — teacher's schedule, classes, pending items
   */
  async getTeacherStats(teacherId: string) {
    const teacher = await prisma.user.findUnique({
      where: { id: teacherId },
      select: { schoolId: true, fullName: true },
    });

    const [slots, classesTeaching] = await Promise.all([
      prisma.timetableSlot.findMany({
        where: { teacherId },
        include: {
          arm: { select: { id: true, name: true, class: { select: { id: true, name: true } } } },
          subject: { select: { id: true, name: true, shortCode: true } },
        },
        orderBy: [{ dayOfWeek: "asc" }, { period: "asc" }],
      }),
      prisma.subjectTeacher.findMany({
        where: { teacherId },
        include: {
          arm: { select: { id: true, name: true, class: { select: { id: true, name: true } } } },
          subject: { select: { id: true, name: true } },
        },
      }),
    ]);

    // Classes today
    const dayIndex = (new Date().getDay() + 6) % 7; // Monday=0, Sunday=6
    const todaySlots = slots.filter(s => s.dayOfWeek === dayIndex);

    // Attendance marked today for each of today's class arms
    const todayArmIds = [...new Set(todaySlots.map(s => s.arm?.id).filter(Boolean))] as string[];
    const dayStart = new Date();
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);

    const markedArms = todayArmIds.length
      ? await prisma.attendanceRecord.findMany({
          where: {
            classArmId: { in: todayArmIds },
            date: { gte: dayStart, lt: dayEnd },
          },
          select: { classArmId: true },
        })
      : [];
    const markedArmSet = new Set(markedArms.map(m => m.classArmId));

    // Pending results (unlocked)
    const classArmIds = classesTeaching.map(ct => ct.classArmId);
    const subjectIds = classesTeaching.map(ct => ct.subjectId);
    const [pendingResults, studentCount, noticeCount, publishedResults, notices] = await Promise.all([
      prisma.termResult.findMany({
        where: {
          classArmId: { in: classArmIds },
          subjectId: { in: subjectIds },
          locked: false,
        },
        select: { id: true },
        take: 5,
      }),
      classArmIds.length
        ? prisma.student.count({
            where: { schoolId: teacher?.schoolId, armId: { in: classArmIds } },
          })
        : Promise.resolve(0),
      teacher?.schoolId
        ? prisma.notice.count({
            where: { schoolId: teacher.schoolId },
          })
        : Promise.resolve(0),
      prisma.termResult.count({
        where: {
          classArmId: { in: classArmIds },
          subjectId: { in: subjectIds },
          locked: true,
        },
      }),
      teacher?.schoolId
        ? prisma.notice.findMany({
            where: { schoolId: teacher.schoolId },
            orderBy: { createdAt: "desc" },
            take: 5,
            select: { id: true, title: true, body: true, createdAt: true },
          })
        : Promise.resolve([]),
    ]);

    return {
      teacherName: teacher?.fullName || "Teacher",
      todaySchedule: todaySlots.map(s => {
        const arm = s.arm as any;
        const classInfo = arm?.class || null;
        return {
          id: s.id,
          startTime: s.startTime,
          endTime: s.endTime,
          dayOfWeek: s.dayOfWeek,
          period: s.period,
          subject: s.subject
            ? { id: s.subject.id, name: s.subject.name }
            : { id: "", name: "Subject" },
          class: classInfo ? { id: classInfo.id, name: classInfo.name } : { id: "", name: "Class" },
          classArm: arm ? { id: arm.id, name: arm.name } : { id: "", name: "A" },
          attendanceMarked: markedArmSet.has(arm?.id),
        };
      }),
      classes: classesTeaching.map(ct => {
        const arm = ct.arm as any;
        const classInfo = arm?.class || null;
        return {
          classArmId: ct.classArmId,
          className: classInfo ? `${classInfo.name} ${arm?.name || ""}`.trim() : "Class",
          subjectName: ct.subject?.name || "Subject",
          subjectId: ct.subjectId,
        };
      }),
      pendingResultsCount: pendingResults.length,
      // No Assignment table in schema; schemes of work are the live pending curriculum signal.
      pendingHomeworkCount: 0,
      unreadNoticesCount: noticeCount,
      myClassesCount: classesTeaching.length,
      myStudentsCount: studentCount,
      resultsPublishedCount: publishedResults,
      notices,
    };
  }

  /**
   * GET /api/dashboard/student/:studentId
   */
  async getStudentStats(studentId: string) {
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      select: { id: true, fullName: true, armId: true, admissionNumber: true, schoolId: true },
    });
    if (!student) throw { statusCode: 404, message: "Student not found." };

    const [results, timetable] = await Promise.all([
      prisma.termResult.findMany({
        where: { studentId },
      }),
      prisma.timetableSlot.findMany({
        where: { classArmId: student.armId! },
        include: { subject: { select: { name: true, shortCode: true } } },
        orderBy: [{ dayOfWeek: "asc" }, { period: "asc" }],
      }),
    ]);

    // Fetch subject names for results
    const subjectIds = [...new Set(results.map(r => r.subjectId))];
    const subjects = await prisma.subject.findMany({
      where: { id: { in: subjectIds } },
      select: { id: true, name: true },
    });
    const subjectMap = new Map(subjects.map(s => [s.id, s.name]));

    const dayIndex = (new Date().getDay() + 6) % 7;

    return {
      fullName: student.fullName,
      admissionNumber: student.admissionNumber,
      subjectResults: results.map(r => ({
        subjectName: subjectMap.get(r.subjectId) || "Unknown",
        caScore: r.caScore ?? 0,
        examScore: r.examScore ?? 0,
        total: r.totalScore ?? 0,
        grade: r.grade || "—",
        locked: r.locked,
      })),
      todaySchedule: timetable
        .filter(s => s.dayOfWeek === dayIndex)
        .map(s => ({
          subject: s.subject.name,
          time: `${8 + s.period}:00`,
        })),
    };
  }

  /**
   * GET /api/dashboard/parent — children + their stats
   */
  async getParentStats(parentId: string) {
    const links = await prisma.parentStudentLink.findMany({
      where: { parentId },
      include: {
        student: {
          select: {
            id: true, fullName: true, admissionNumber: true,
            arm: { select: { name: true, class: { select: { name: true } } } },
          },
        },
      },
    });

    const childrenWithResults = await Promise.all(
      links.map(async (link) => {
        const results = await prisma.termResult.findMany({
          where: { studentId: link.student.id },
        });

        const subjectIds = [...new Set(results.map(r => r.subjectId))];
        const subjects = await prisma.subject.findMany({
          where: { id: { in: subjectIds } },
          select: { id: true, name: true },
        });
        const subjectMap = new Map(subjects.map(s => [s.id, s.name]));

        return {
          id: link.student.id,
          fullName: link.student.fullName,
          admissionNumber: link.student.admissionNumber,
          armName: `${link.student.arm?.class?.name || ""} ${link.student.arm?.name || ""}`,
          results: results.map(r => ({
            subject: subjectMap.get(r.subjectId) || "Unknown",
            total: r.totalScore ?? 0,
            grade: r.grade || "—",
          })),
        };
      })
    );

    return { children: childrenWithResults };
  }

  /**
   * GET /api/dashboard/staff — bursar view
   */
  async getStaffStats(schoolId: string, session?: string) {
    // Use provided session or fetch current academic session
    const activeSession = session || await this.getCurrentSession(schoolId);

    // Fee records for this session
    const feeRecords = await prisma.feeRecord.findMany({
      where: { schoolId, session: activeSession },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { id: true, amount: true, status: true, description: true, createdAt: true, student: { select: { fullName: true, admissionNumber: true } } },
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayFeeRecords = await prisma.feeRecord.findMany({
      where: {
        schoolId,
        session: activeSession,
        createdAt: { gte: today },
      },
    });

    return {
      todayCollections: todayFeeRecords.filter(f => f.status === "PAID").reduce((s, f) => s + f.amount, 0),
      todayTransactions: todayFeeRecords.filter(f => f.status === "PAID").length,
      totalFeesExpected: feeRecords.reduce((s, f) => s + f.amount, 0),
      totalFeesCollected: feeRecords.filter(f => f.status === "PAID").reduce((s, f) => s + f.amount, 0),
      feeCollectionRate: feeRecords.length > 0
        ? Math.round((feeRecords.filter(f => f.status === "PAID").reduce((s, f) => s + f.amount, 0) / feeRecords.reduce((s, f) => s + f.amount, 0)) * 100)
        : 0,
      feeRecords: feeRecords.map(f => ({
        id: f.id,
        amount: f.amount,
        status: f.status,
        description: f.description,
        studentName: f.student?.fullName,
        studentAdmission: f.student?.admissionNumber,
        date: f.createdAt,
      })),
    };
  }
}

export const dashboardService = new DashboardService();
