import { prisma } from "../lib/prisma";
import { NotFoundError } from "../utils/errors";

export class ClassService {
  /**
   * List classes for a school with arms and student counts.
   * Arms include student names so admins can manage rosters.
   */
  async list(schoolId: string) {
    return prisma.class.findMany({
      where: { schoolId },
      include: {
        arms: {
          include: {
            _count: { select: { students: true } },
            classTeacher: { select: { id: true, fullName: true } },
            students: {
              select: {
                id: true,
                fullName: true,
                admissionNumber: true,
                gender: true,
                active: true,
              },
              orderBy: { fullName: "asc" },
              take: 200,
            },
          },
          orderBy: { name: "asc" },
        },
        _count: { select: { students: true } },
      },
      orderBy: { name: "asc" },
    });
  }

  /**
   * Create a class with optional arms.
   * Accepts custom names such as JSS 1 A or JSS1B.
   */
  async create(schoolId: string, name: string, arms?: string[]) {
    const cleanName = String(name || "").trim();
    if (!cleanName) throw new Error("Class name is required.");

    const existing = await prisma.class.findFirst({
      where: { schoolId, name: { equals: cleanName, mode: "insensitive" } },
    });
    if (existing) throw new Error(`Class "${cleanName}" already exists.`);

    return prisma.class.create({
      data: {
        schoolId,
        name: cleanName,
        arms: arms?.length
          ? { create: arms.map((a) => ({ name: String(a).trim() })).filter((a) => a.name) }
          : undefined,
      },
      include: {
        arms: {
          include: {
            _count: { select: { students: true } },
            students: {
              select: { id: true, fullName: true, admissionNumber: true },
              orderBy: { fullName: "asc" },
              take: 200,
            },
          },
        },
      },
    });
  }

  /**
   * Add an arm to a class, scoped by schoolId.
   */
  async addArm(schoolId: string, classId: string, name: string, classTeacherId?: string) {
    const cleanName = String(name || "").trim();
    if (!cleanName) throw new Error("Arm name is required.");

    const cls = await prisma.class.findFirst({
      where: { id: classId, schoolId },
    });
    if (!cls) throw new NotFoundError("Class");

    const clash = await prisma.classArm.findFirst({
      where: {
        classId,
        name: { equals: cleanName, mode: "insensitive" },
      },
    });
    if (clash) throw new Error(`Arm "${cleanName}" already exists in this class.`);

    if (classTeacherId) {
      const teacher = await prisma.user.findFirst({
        where: {
          id: classTeacherId,
          schoolId,
          role: { in: ["TEACHER", "PRINCIPAL"] },
          active: true,
        },
        select: { id: true },
      });
      if (!teacher) throw new NotFoundError("Class teacher");
    }

    return prisma.classArm.create({
      data: {
        classId,
        name: cleanName,
        classTeacherId: classTeacherId || null,
      },
      include: {
        class: { select: { id: true, name: true } },
        classTeacher: { select: { id: true, fullName: true } },
        students: {
          select: { id: true, fullName: true, admissionNumber: true },
          orderBy: { fullName: "asc" },
          take: 200,
        },
        _count: { select: { students: true } },
      },
    });
  }

  /**
   * Assign a class teacher to an arm, scoped by schoolId.
   */
  async assignClassTeacher(schoolId: string, armId: string, classTeacherId: string) {
    const arm = await prisma.classArm.findFirst({
      where: { id: armId, class: { schoolId } },
    });
    if (!arm) throw new NotFoundError("Class arm");

    const teacher = await prisma.user.findFirst({
      where: {
        id: classTeacherId,
        schoolId,
        role: { in: ["TEACHER", "PRINCIPAL"] },
        active: true,
      },
      select: { id: true },
    });
    if (!teacher) throw new NotFoundError("Class teacher");

    return prisma.classArm.update({
      where: { id: armId },
      data: { classTeacherId },
      include: {
        class: { select: { id: true, name: true } },
        classTeacher: { select: { id: true, fullName: true } },
        students: {
          select: { id: true, fullName: true, admissionNumber: true },
          orderBy: { fullName: "asc" },
          take: 200,
        },
        _count: { select: { students: true } },
      },
    });
  }

  /**
   * Rename a class. Scoped by schoolId.
   */
  async renameClass(schoolId: string, classId: string, name: string) {
    const cleanName = String(name || "").trim();
    if (!cleanName) throw new Error("Class name is required.");

    const cls = await prisma.class.findFirst({
      where: { id: classId, schoolId },
    });
    if (!cls) throw new NotFoundError("Class");

    const clash = await prisma.class.findFirst({
      where: {
        schoolId,
        name: { equals: cleanName, mode: "insensitive" },
        NOT: { id: classId },
      },
    });
    if (clash) throw new Error(`Class "${cleanName}" already exists.`);

    return prisma.class.update({
      where: { id: classId },
      data: { name: cleanName },
      include: {
        arms: {
          include: {
            _count: { select: { students: true } },
            students: {
              select: { id: true, fullName: true, admissionNumber: true },
              orderBy: { fullName: "asc" },
              take: 200,
            },
          },
        },
      },
    });
  }

  /**
   * Rename an arm. Scoped by schoolId.
   */
  async renameArm(schoolId: string, armId: string, name: string) {
    const cleanName = String(name || "").trim();
    if (!cleanName) throw new Error("Arm name is required.");

    const arm = await prisma.classArm.findFirst({
      where: { id: armId, class: { schoolId } },
    });
    if (!arm) throw new NotFoundError("Class arm");

    const clash = await prisma.classArm.findFirst({
      where: {
        classId: arm.classId,
        name: { equals: cleanName, mode: "insensitive" },
        NOT: { id: armId },
      },
    });
    if (clash) throw new Error(`Arm "${cleanName}" already exists in this class.`);

    return prisma.classArm.update({
      where: { id: armId },
      data: { name: cleanName },
      include: {
        class: { select: { id: true, name: true } },
        classTeacher: { select: { id: true, fullName: true } },
        students: {
          select: { id: true, fullName: true, admissionNumber: true },
          orderBy: { fullName: "asc" },
          take: 200,
        },
        _count: { select: { students: true } },
      },
    });
  }

  /**
   * Delete a class arm, scoped by schoolId.
   */
  async deleteArm(schoolId: string, armId: string) {
    const arm = await prisma.classArm.findFirst({
      where: { id: armId, class: { schoolId } },
      include: { _count: { select: { students: true } } },
    });
    if (!arm) throw new NotFoundError("Class arm");
    if ((arm._count?.students || 0) > 0) {
      throw new Error("This arm still has students. Move or remove them before deleting the arm.");
    }

    await prisma.classArm.delete({ where: { id: armId } });
    return { success: true };
  }
}

export const classService = new ClassService();
