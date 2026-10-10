import { prisma } from "../lib/prisma";
import { NotFoundError, BadRequestError, ConflictError, ForbiddenError } from "../utils/errors";
import bcrypt from "bcryptjs";
import crypto from "crypto";

export class StudentService {
  /**
   * List students for a school, optionally filtered by class/arm.
   */
  async list(filters: { schoolId?: string; classId?: string; armId?: string; active?: boolean }) {
    const where: any = {};
    if (filters.schoolId) where.schoolId = filters.schoolId;
    if (filters.classId) where.classId = filters.classId;
    if (filters.armId) where.armId = filters.armId;
    if (filters.active !== undefined) where.active = filters.active;

    return prisma.student.findMany({
      where,
      include: {
        class: { select: { id: true, name: true } },
        arm: { select: { id: true, name: true } },
        user: { select: { id: true, email: true, role: true, active: true } },
      },
      orderBy: { fullName: "asc" },
    });
  }

  /**
   * Get one student with full school history for the profile page.
   */
  async getById(id: string, schoolId: string) {
    const student = await prisma.student.findFirst({
      where: { id, schoolId },
      include: {
        class: { select: { id: true, name: true } },
        arm: { select: { id: true, name: true } },
        user: { select: { id: true, email: true, role: true, active: true } },
        parentLinks: {
          include: {
            parent: {
              select: { id: true, fullName: true, email: true, role: true, active: true },
            },
          },
        },
      },
    });
    if (!student) throw new NotFoundError("Student");

    const studentId = student.id;

    const [attendanceRows, feeRecords, payments, termResults, cbtAttempts, examAttempts] =
      await Promise.all([
        prisma.attendanceRecord.findMany({
          where: { studentId },
          orderBy: { date: "desc" },
          take: 60,
          select: { id: true, date: true, status: true },
        }),
        prisma.feeRecord.findMany({
          where: { studentId },
          orderBy: { createdAt: "desc" },
          take: 40,
          select: {
            id: true,
            term: true,
            session: true,
            amount: true,
            description: true,
            status: true,
            paymentMethod: true,
            paidAt: true,
            createdAt: true,
          },
        }),
        prisma.payment.findMany({
          where: { studentId },
          orderBy: { createdAt: "desc" },
          take: 40,
          select: {
            id: true,
            amount: true,
            reference: true,
            status: true,
            channel: true,
            paidAt: true,
            session: true,
            createdAt: true,
          },
        }),
        prisma.termResult.findMany({
          where: { studentId },
          orderBy: [{ session: "desc" }, { term: "desc" }],
          take: 80,
        }),
        prisma.cBTAttempt.findMany({
          where: { studentId },
          orderBy: { startedAt: "desc" },
          take: 20,
          select: {
            id: true,
            examType: true,
            year: true,
            mode: true,
            score: true,
            total: true,
            correctCount: true,
            wrongCount: true,
            startedAt: true,
            completedAt: true,
            subject: { select: { name: true } },
          },
        }),
        prisma.examAttempt.findMany({
          where: { studentId },
          orderBy: { submittedAt: "desc" },
          take: 20,
          select: {
            id: true,
            score: true,
            total: true,
            startedAt: true,
            submittedAt: true,
            exam: { select: { id: true, title: true } },
          },
        }),
      ]);

    // Attach subject names to term results without a schema relation.
    const subjectIds = [...new Set(termResults.map((r) => r.subjectId).filter(Boolean))] as string[];
    const subjects = subjectIds.length
      ? await prisma.subject.findMany({
          where: { id: { in: subjectIds } },
          select: { id: true, name: true, shortCode: true },
        })
      : [];
    const subjectMap = new Map(subjects.map((s) => [s.id, s]));
    const termResultsWithSubjects = termResults.map((r) => ({
      ...r,
      subject: subjectMap.get(r.subjectId) || null,
    }));

    const attendanceCounts = attendanceRows.reduce(
      (acc, row) => {
        acc[row.status] = (acc[row.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );
    const totalMarked = attendanceRows.length;
    const presentish =
      (attendanceCounts.PRESENT || 0) +
      (attendanceCounts.LATE || 0) +
      (attendanceCounts.EXCUSED || 0);
    const attendanceRate = totalMarked
      ? Math.round((presentish / totalMarked) * 100)
      : null;

    const feeExpected = feeRecords.reduce((sum, f) => sum + (Number(f.amount) || 0), 0);
    const feePaid = feeRecords
      .filter((f) => f.status === "PAID")
      .reduce((sum, f) => sum + (Number(f.amount) || 0), 0);
    const paymentsTotal = payments
      .filter((p) => p.status === "success" || p.status === "paid" || p.status === "completed")
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

    const linkedParents = student.parentLinks.map((link) => link.parent);
    const parents = linkedParents.length
      ? linkedParents
      : student.parentName || student.parentPhone || student.parentEmail
        ? [
            {
              id: null,
              fullName: student.parentName || "Guardian",
              email: student.parentEmail,
              role: "PARENT",
              active: true,
            },
          ]
        : [];

    const {
      parentLinks: _parentLinks,
      ...studentCore
    } = student as any;

    return {
      ...studentCore,
      dateOfBirth: student.dob ? student.dob.toISOString() : null,
      parents,
      attendance: {
        rate: attendanceRate,
        totalMarked,
        counts: attendanceCounts,
        recent: attendanceRows,
      },
      fees: {
        expected: feeExpected,
        paid: feePaid,
        balance: Math.max(0, feeExpected - feePaid),
        paymentsTotal,
        records: feeRecords,
        payments,
      },
      results: {
        termResults: termResultsWithSubjects,
        examAttempts,
        cbtAttempts,
      },
    };
  }

  /**
   * Add a single student.
   */
  async create(data: {
    schoolId: string;
    admissionNumber: string;
    fullName: string;
    dob?: string;
    gender?: string;
    classId?: string;
    armId?: string;
    parentName?: string;
    parentPhone?: string;
    parentEmail?: string;
    passportUrl?: string;
    house?: string;
    bloodGroup?: string;
    allergies?: string;
    medicalNotes?: string;
    emergencyContactName?: string;
    emergencyContactPhone?: string;
    previousSchool?: string;
    stateOfOrigin?: string;
    nationality?: string;
    notes?: string;
  }) {
    // Check school exists
    const school = await prisma.school.findUnique({ where: { id: data.schoolId } });
    if (!school) throw new NotFoundError("School");

    return prisma.student.create({
      data: {
        schoolId: data.schoolId,
        admissionNumber: data.admissionNumber,
        fullName: data.fullName,
        dob: data.dob ? new Date(data.dob) : null,
        gender: data.gender || null,
        classId: data.classId || null,
        armId: data.armId || null,
        parentName: data.parentName || null,
        parentPhone: data.parentPhone || null,
        parentEmail: data.parentEmail || null,
        passportUrl: data.passportUrl || null,
        house: data.house || null,
        bloodGroup: data.bloodGroup || null,
        allergies: data.allergies || null,
        medicalNotes: data.medicalNotes || null,
        emergencyContactName: data.emergencyContactName || null,
        emergencyContactPhone: data.emergencyContactPhone || null,
        previousSchool: data.previousSchool || null,
        stateOfOrigin: data.stateOfOrigin || null,
        nationality: data.nationality || null,
        notes: data.notes || null,
      },
      include: {
        class: { select: { id: true, name: true } },
        arm: { select: { id: true, name: true } },
      },
    });
  }

  /**
   * Bulk import students from CSV data.
   */
  async bulkCreate(schoolId: string, students: Array<{
    admissionNumber: string;
    fullName: string;
    classId?: string;
    armId?: string;
    parentName?: string;
    parentPhone?: string;
  }>) {
    const school = await prisma.school.findUnique({ where: { id: schoolId } });
    if (!school) throw new NotFoundError("School");

    const result = await prisma.student.createMany({
      data: students.map((s) => ({
        schoolId,
        admissionNumber: s.admissionNumber,
        fullName: s.fullName,
        classId: s.classId || null,
        armId: s.armId || null,
        parentName: s.parentName || null,
        parentPhone: s.parentPhone || null,
      })),
      skipDuplicates: true,
    });

    return { count: result.count };
  }

  /**
   * Update student details.
   */
  async update(id: string, schoolId: string, data: Partial<{
    fullName: string;
    dob: string;
    gender: string;
    classId: string;
    armId: string;
    parentName: string;
    parentPhone: string;
    parentEmail: string;
    passportUrl: string;
    house: string;
    bloodGroup: string;
    allergies: string;
    medicalNotes: string;
    emergencyContactName: string;
    emergencyContactPhone: string;
    previousSchool: string;
    stateOfOrigin: string;
    nationality: string;
    notes: string;
  }>) {
    const student = await prisma.student.findUnique({ where: { id } });
    if (!student) throw new NotFoundError("Student");
    if (student.schoolId !== schoolId) throw new ForbiddenError("Access denied.");

    const updateData: any = { ...data };
    if (data.dob) updateData.dob = new Date(data.dob);

    return prisma.student.update({
      where: { id },
      data: updateData,
      include: {
        class: { select: { id: true, name: true } },
        arm: { select: { id: true, name: true } },
      },
    });
  }

  /**
   * Soft-delete (archive) a student.
   */
  async archive(id: string, schoolId: string) {
    const student = await prisma.student.findUnique({ where: { id } });
    if (!student) throw new NotFoundError("Student");
    if (student.schoolId !== schoolId) throw new ForbiddenError("Access denied.");

    return prisma.student.update({
      where: { id },
      data: { active: false },
    });
  }

  /**
   * Promote students from one class to another.
   */
  async promote(studentIds: string[], newClassId: string, newArmId?: string, schoolId?: string) {
    const cls = await prisma.class.findUnique({ where: { id: newClassId } });
    if (!cls) throw new NotFoundError("Class");

    // Verify all students belong to this school
    if (schoolId) {
      const students = await prisma.student.findMany({
        where: { id: { in: studentIds }, schoolId },
      });
      if (students.length !== studentIds.length) {
        throw new BadRequestError("Some students don't belong to your school.");
      }
    }

    const result = await prisma.student.updateMany({
      where: { id: { in: studentIds } },
      data: {
        classId: newClassId,
        armId: newArmId || null,
      },
    });

    return { count: result.count };
  }

  /**
   * Create a login account (User) for an existing student record.
   */
  async createStudentAccount(studentId: string, schoolId: string, email: string, password?: string) {
    const student = await prisma.student.findFirst({
      where: { id: studentId, schoolId },
      include: { user: true },
    });
    if (!student) throw new NotFoundError("Student");
    if (student.user) throw new BadRequestError("This student already has a login account.");

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) throw new ConflictError("A user with this email already exists.");

    const rawPassword = password || crypto.randomBytes(8).toString("hex");
    const passwordHash = await bcrypt.hash(rawPassword, 12);

    const user = await prisma.user.create({
      data: {
        schoolId,
        email,
        fullName: student.fullName,
        passwordHash,
        role: "STUDENT",
        studentId: student.id,
      },
    });

    return {
      userId: user.id,
      email: user.email,
      fullName: user.fullName,
      password: rawPassword,
      autoGenerated: !password,
    };
  }
}

export const studentService = new StudentService();
