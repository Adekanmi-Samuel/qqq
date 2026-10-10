import "dotenv/config";
import { prisma } from "./lib/prisma";
import bcrypt from "bcryptjs";

async function main() {
  const school = await prisma.school.findFirst({ where: { slug: "test-academy" } });
  if (!school) {
    console.log("Test Academy not found.");
    return;
  }

  const passwordHash = await bcrypt.hash("Test@12345", 12);

  // Create class if needed
  let testClass = await prisma.class.findFirst({ where: { schoolId: school.id, name: "JSS 1" } });
  if (!testClass) {
    testClass = await prisma.class.create({ data: { schoolId: school.id, name: "JSS 1" } });
  }

  let testArm = await prisma.classArm.findFirst({ where: { classId: testClass.id, name: "Gold" } });
  if (!testArm) {
    testArm = await prisma.classArm.create({ data: { classId: testClass.id, name: "Gold" } });
  }

  // Create student
  let student = await prisma.student.findFirst({ where: { schoolId: school.id, fullName: "Test Student" } });
  if (!student) {
    student = await prisma.student.create({
      data: {
        schoolId: school.id, fullName: "Test Student",
        admissionNumber: "TEST/2026/001", classId: testClass.id,
        armId: testArm.id, gender: "MALE", dob: new Date("2012-01-15"),
      },
    });
    console.log("Student created: Test Student (TEST/2026/001)");
  }

  // Create student user
  const existingStudentUser = await prisma.user.findFirst({ where: { email: "student@testschool.com" } });
  if (!existingStudentUser) {
    await prisma.user.create({
      data: { fullName: "Test Student", email: "student@testschool.com", passwordHash, role: "STUDENT", schoolId: school.id, studentId: student.id },
    });
    console.log("Student user created: student@testschool.com / Test@12345");
  }

  // Create parent user
  const existingParent = await prisma.user.findFirst({ where: { email: "parent@testschool.com" } });
  if (!existingParent) {
    const parentUser = await prisma.user.create({
      data: { fullName: "Test Parent", email: "parent@testschool.com", passwordHash, role: "PARENT", schoolId: school.id },
    });
    const existingLink = await prisma.parentStudentLink.findFirst({ where: { parentId: parentUser.id, studentId: student.id } });
    if (!existingLink) {
      await prisma.parentStudentLink.create({ data: { parentId: parentUser.id, studentId: student.id } });
    }
    console.log("Parent user created: parent@testschool.com / Test@12345");
  }

  console.log("Done!");
}

main().catch(console.error).finally(() => prisma.$disconnect());
