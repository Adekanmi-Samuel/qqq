import { prisma } from "../lib/prisma";

type ComplianceReportType =
  | "STUDENT_NOMINAL_ROLL"
  | "STAFF_NOMINAL_ROLL"
  | "ATTENDANCE_SUMMARY"
  | "FEE_COLLECTION_REPORT"
  | "EXAM_REGISTRATION_SUMMARY"
  | "INFRASTRUCTURE_CHECKLIST";

interface ReportFilters {
  session?: string;
  term?: string;
  classId?: string;
  armId?: string;
  startDate?: Date;
  endDate?: Date;
}

export class ComplianceService {
  /**
   * Generate Student Nominal Roll Report
   */
  async generateStudentNominalRoll(schoolId: string, filters: ReportFilters) {
    const where: any = { schoolId, active: true };
    if (filters.classId) where.classId = filters.classId;
    if (filters.armId) where.armId = filters.armId;

    const students = await prisma.student.findMany({
      where,
      include: {
        arm: { include: { class: true } },
        parentLinks: { include: { parent: { select: { fullName: true, email: true } } } },
      },
      orderBy: [{ arm: { name: "asc" } }, { fullName: "asc" }],
    });

    const data = students.map((s, index) => ({
      sno: index + 1,
      admissionNumber: s.admissionNumber,
      fullName: s.fullName,
      gender: s.gender || "",
      dateOfBirth: s.dob?.toISOString().split("T")[0] || "",
      class: `${s.arm?.class?.name || ""} ${s.arm?.name || ""}`.trim(),
      arm: s.arm?.name || "",
      parentName: s.parentLinks[0]?.parent?.fullName || "",
      parentPhone: s.parentPhone || "",
      parentEmail: s.parentLinks[0]?.parent?.email || "",
      address: "",
      enrollmentDate: s.createdAt.toISOString().split("T")[0],
      status: s.active ? "Active" : "Inactive",
    }));

    return {
      reportType: "STUDENT_NOMINAL_ROLL",
      title: "Student Nominal Roll",
      generatedAt: new Date().toISOString(),
      totalRecords: data.length,
      filters,
      data,
    };
  }

  /**
   * Generate Staff Nominal Roll Report
   */
  async generateStaffNominalRoll(schoolId: string) {
    const staff = await prisma.user.findMany({
      where: { schoolId, active: true, role: { in: ["TEACHER", "BURSAR", "PRINCIPAL", "SCHOOL_ADMIN"] } },
      select: {
        id: true,
        fullName: true,
        email: true,
        
        role: true,
        createdAt: true,
        subjectTeachers: { include: { subject: true, arm: { include: { class: true } } } },
      },
      orderBy: [{ role: "asc" }, { fullName: "asc" }],
    });

    const data = staff.map((s, index) => ({
      sno: index + 1,
      staffId: s.id.slice(0, 8).toUpperCase(),
      fullName: s.fullName,
      role: s.role,
      email: s.email,
      phone: "",
      subjects: s.subjectTeachers.map((st) => st.subject.name).join(", "),
      classes: [...new Set(s.subjectTeachers.map((st) => `${st.arm.class.name} ${st.arm.name}`))].join(", "),
      dateJoined: s.createdAt.toISOString().split("T")[0],
      status: "Active",
    }));

    return {
      reportType: "STAFF_NOMINAL_ROLL",
      title: "Staff Nominal Roll",
      generatedAt: new Date().toISOString(),
      totalRecords: data.length,
      data,
    };
  }

  /**
   * Generate Attendance Summary Report
   */
  async generateAttendanceSummary(schoolId: string, filters: ReportFilters) {
    const startDate = filters.startDate || new Date(new Date().setDate(1)); // Start of month
    const endDate = filters.endDate || new Date();

    const where: any = {
      schoolId,
      date: { gte: startDate, lte: endDate },
    };
    if (filters.classId) where.student = { classId: filters.classId };
    if (filters.armId) where.student = { armId: filters.armId };

    const records = await prisma.attendanceRecord.findMany({
      where,
      include: {
        student: { include: { arm: { include: { class: true } } } },
      },
    });

    // Group by student
    const studentMap = new Map();
    records.forEach((r) => {
      const key = r.studentId;
      if (!studentMap.has(key)) {
        studentMap.set(key, {
          student: r.student,
          present: 0,
          absent: 0,
          late: 0,
          excused: 0,
          total: 0,
        });
      }
      const s = studentMap.get(key);
      s.total++;
      if (r.status === "PRESENT") s.present++;
      else if (r.status === "ABSENT") s.absent++;
      else if (r.status === "LATE") s.late++;
      else if (r.status === "EXCUSED") s.excused++;
    });

    const data = Array.from(studentMap.values()).map((s, index) => ({
      sno: index + 1,
      admissionNumber: s.student.admissionNumber,
      fullName: s.student.fullName,
      class: `${s.student.arm?.class?.name || ""} ${s.student.arm?.name || ""}`,
      present: s.present,
      absent: s.absent,
      late: s.late,
      excused: s.excused,
      totalDays: s.total,
      attendanceRate: s.total > 0 ? Math.round((s.present / s.total) * 100) : 0,
    }));

    // Overall summary
    const totalPresent = data.reduce((sum, d) => sum + d.present, 0);
    const totalAbsent = data.reduce((sum, d) => sum + d.absent, 0);
    const totalLate = data.reduce((sum, d) => sum + d.late, 0);
    const totalExcused = data.reduce((sum, d) => sum + d.excused, 0);
    const grandTotal = data.reduce((sum, d) => sum + d.totalDays, 0);

    return {
      reportType: "ATTENDANCE_SUMMARY",
      title: "Attendance Summary Report",
      generatedAt: new Date().toISOString(),
      period: { start: startDate.toISOString().split("T")[0], end: endDate.toISOString().split("T")[0] },
      summary: {
        totalStudents: data.length,
        totalPresent,
        totalAbsent,
        totalLate,
        totalExcused,
        grandTotal,
        overallRate: grandTotal > 0 ? Math.round((totalPresent / grandTotal) * 100) : 0,
      },
      filters,
      data,
    };
  }

  /**
   * Generate Fee Collection Report
   */
  async generateFeeCollectionReport(schoolId: string, filters: ReportFilters) {
    const session = filters.session || (await this.getCurrentSession(schoolId));

    const where: any = { schoolId, session };
    if (filters.classId) where.student = { arm: { classId: filters.classId } };
    if (filters.armId) where.student = { armId: filters.armId };

    const fees = await prisma.feeRecord.findMany({
      where,
      include: { student: { include: { arm: { include: { class: true } } } } },
      orderBy: { createdAt: "desc" },
    });

    const data = fees.map((f, index) => ({
      sno: index + 1,
      receiptNumber: f.id.slice(0, 8).toUpperCase(),
      date: f.createdAt.toISOString().split("T")[0],
      admissionNumber: f.student?.admissionNumber || "",
      studentName: f.student?.fullName || "",
      class: f.student?.arm ? `${f.student.arm.class.name} ${f.student.arm.name}` : "",
      description: f.description,
      amount: f.amount,
      status: f.status,
      paymentMethod: f.paymentMethod || "",
      paidAt: f.paidAt?.toISOString().split("T")[0] || "",
    }));

    const totalExpected = fees.reduce((sum, f) => sum + f.amount, 0);
    const totalCollected = fees.filter((f) => f.status === "PAID").reduce((sum, f) => sum + f.amount, 0);
    const totalPending = fees.filter((f) => f.status === "PENDING").reduce((sum, f) => sum + f.amount, 0);
    const totalOverdue = fees.filter((f) => f.status === "OVERDUE").reduce((sum, f) => sum + f.amount, 0);

    return {
      reportType: "FEE_COLLECTION_REPORT",
      title: "Fee Collection Report",
      generatedAt: new Date().toISOString(),
      session,
      summary: {
        totalRecords: fees.length,
        totalExpected,
        totalCollected,
        totalPending,
        totalOverdue,
        collectionRate: totalExpected > 0 ? Math.round((totalCollected / totalExpected) * 100) : 0,
      },
      filters,
      data,
    };
  }

  /**
   * Generate Exam Registration Summary
   */
  async generateExamRegistrationSummary(schoolId: string, filters: ReportFilters) {
    const exams = await prisma.exam.findMany({
      where: { schoolId, ...(filters.session ? { session: filters.session } : {}) },
      include: {
        arm: { include: { class: true } },
        subject: true,
        _count: { select: { attempts: true } },
      },
      orderBy: [{ session: "desc" }, { term: "desc" }, { arm: { name: "asc" } }],
    });

    const data = exams.map((e, index) => ({
      sno: index + 1,
      examName: e.title,
      session: e.session,
      term: e.term,
      class: e.arm?.class.name || "",
      subject: e.subject?.name || "",
      examType: "",
      date: e.createdAt.toISOString().split("T")[0] || "",
      maxScore: e.totalMarks,
      registeredStudents: e._count.attempts,
      status: e.active ? "Published" : "Draft",
    }));

    return {
      reportType: "EXAM_REGISTRATION_SUMMARY",
      title: "Exam Registration Summary",
      generatedAt: new Date().toISOString(),
      totalExams: exams.length,
      filters,
      data,
    };
  }

  /**
   * Generate Infrastructure Checklist
   */
  async generateInfrastructureChecklist(schoolId: string) {
    const school = await prisma.school.findUnique({
      where: { id: schoolId },
      select: {
        name: true,
        address: true,
        state: true,
        lga: true,
        schoolType: true,
        ownershipType: true,
        classes: { include: { arms: { include: { _count: { select: { students: true } } } } } },
        users: { where: { active: true, role: { in: ["TEACHER", "BURSAR", "PRINCIPAL"] } }, select: { role: true } },
      },
    });

    if (!school) throw { statusCode: 404, message: "School not found" };

    const teacherCount = school.users.filter((u) => u.role === "TEACHER").length;
    const adminCount = school.users.filter((u) => u.role === "PRINCIPAL" || u.role === "SCHOOL_ADMIN").length;
    const bursarCount = school.users.filter((u) => u.role === "BURSAR").length;
    const totalStudents = school.classes.reduce((sum, c) => sum + c.arms.reduce((s, a) => s + a._count.students, 0), 0);
    const totalClassrooms = school.classes.reduce((sum, c) => sum + c.arms.length, 0);
    const studentTeacherRatio = teacherCount > 0 ? Math.round(totalStudents / teacherCount) : 0;

    const checklist = [
      { category: "Basic Information", item: "School Name", status: school.name ? "✓" : "✗", details: school.name || "Not set" },
      { category: "Basic Information", item: "Address", status: school.address ? "✓" : "✗", details: school.address || "Not set" },
      { category: "Basic Information", item: "State/LGA", status: school.state && school.lga ? "✓" : "✗", details: `${school.state || ""} / ${school.lga || ""}` },
      { category: "Basic Information", item: "School Type", status: school.schoolType ? "✓" : "✗", details: school.schoolType || "Not set" },
      { category: "Basic Information", item: "Ownership Type", status: school.ownershipType ? "✓" : "✗", details: school.ownershipType || "Not set" },
      { category: "Staffing", item: "Principal/Admin", status: adminCount > 0 ? "✓" : "✗", details: `${adminCount} admin(s)` },
      { category: "Staffing", item: "Teachers", status: teacherCount > 0 ? "✓" : "✗", details: `${teacherCount} teacher(s)` },
      { category: "Staffing", item: "Bursar", status: bursarCount > 0 ? "✓" : "✗", details: `${bursarCount} bursar(s)` },
      { category: "Staffing", item: "Student-Teacher Ratio", status: studentTeacherRatio <= 40 ? "✓" : "⚠", details: `${studentTeacherRatio}:1 (Target: ≤40:1)` },
      { category: "Infrastructure", item: "Classrooms", status: totalClassrooms > 0 ? "✓" : "✗", details: `${totalClassrooms} classroom(s)/arm(s)` },
      { category: "Infrastructure", item: "Total Students", status: totalStudents > 0 ? "✓" : "✗", details: `${totalStudents} student(s)` },
      { category: "Academic", item: "Classes Configured", status: school.classes.length > 0 ? "✓" : "✗", details: `${school.classes.length} class(es)` },
      { category: "Academic", item: "Subjects Offered", status: "✓", details: "To be verified" },
      { category: "Compliance", item: "CAC Registration", status: "⚠", details: "Manual verification required" },
      { category: "Compliance", item: "Government Approval", status: "⚠", details: "Manual verification required" },
      { category: "Compliance", item: "Tax Compliance", status: "⚠", details: "Manual verification required" },
      { category: "Safety", item: "First Aid Kit", status: "⚠", details: "Manual verification required" },
      { category: "Safety", item: "Fire Safety Equipment", status: "⚠", details: "Manual verification required" },
      { category: "Safety", item: "Emergency Exits", status: "⚠", details: "Manual verification required" },
    ];

    const passed = checklist.filter((c) => c.status === "✓").length;
    const warning = checklist.filter((c) => c.status === "⚠").length;
    const failed = checklist.filter((c) => c.status === "✗").length;

    return {
      reportType: "INFRASTRUCTURE_CHECKLIST",
      title: "Infrastructure & Compliance Checklist",
      generatedAt: new Date().toISOString(),
      schoolName: school.name,
      summary: { totalItems: checklist.length, passed, warning, failed, complianceScore: Math.round((passed / checklist.length) * 100) },
      data: checklist,
    };
  }

  /**
   * Save generated report
   */
  async saveReport(
    schoolId: string,
    reportType: ComplianceReportType,
    title: string,
    description: string | undefined,
    data: any,
    generatedById: string
  ) {
    return prisma.complianceReport.create({
      data: {
        schoolId,
        reportType,
        title,
        description,
        data,
        generatedById,
      },
    });
  }

  /**
   * Get saved reports
   */
  async getReports(schoolId: string, reportType?: ComplianceReportType, limit = 20, offset = 0) {
    const where: any = { schoolId };
    if (reportType) where.reportType = reportType;

    const [reports, total] = await Promise.all([
      prisma.complianceReport.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
        include: { generatedBy: { select: { fullName: true } } },
      }),
      prisma.complianceReport.count({ where }),
    ]);

    return { reports, total };
  }

  /**
   * Get report by ID
   */
  async getReportById(reportId: string) {
    return prisma.complianceReport.findUnique({
      where: { id: reportId },
      include: { generatedBy: { select: { fullName: true } }, school: { select: { name: true } } },
    });
  }

  /**
   * Delete report
   */
  async deleteReport(reportId: string) {
    return prisma.complianceReport.delete({ where: { id: reportId } });
  }

  private async getCurrentSession(schoolId: string): Promise<string> {
    const cal = await prisma.academicCalendar.findFirst({
      where: { schoolId, isCurrent: true },
      select: { academicYear: true },
    });
    return cal?.academicYear || "2025/2026";
  }
}

export const complianceService = new ComplianceService();
