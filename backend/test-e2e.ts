/**
 * End-to-end test script for SchoolHub.
 * Creates a test school with teachers, students, classes, fees,
 * and exercises every major feature.
 *
 * Run: npx tsx test-e2e.ts
 */

const API = process.env.API_URL || "http://localhost:4000";

async function api(method: string, path: string, body?: any, token?: string) {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  return { status: res.status, ...data };
}

let passed = 0;
let failed = 0;
const failures: string[] = [];

function assert(label: string, condition: boolean, detail?: string) {
  if (condition) {
    console.log(`  ✅ ${label}`);
    passed++;
  } else {
    console.log(`  ❌ ${label}${detail ? ` — ${detail}` : ""}`);
    failed++;
    failures.push(label);
  }
}

async function run() {
  console.log("\n🏫 SchoolHub E2E Test Suite\n");
  console.log("=".repeat(50));

  // ─── 1. Health Check ───
  console.log("\n📋 Health Check");
  const health = await api("GET", "/api/health");
  assert("Server is running", health.status === "ok");

  const dbHealth = await api("GET", "/api/health/db");
  assert("Database is connected", dbHealth.status === "ok", JSON.stringify(dbHealth));

  if (dbHealth.status !== "ok") {
    console.log("\n⚠️  Database not connected. Skipping remaining tests.");
    console.log(`\nResults: ${passed} passed, ${failed} failed`);
    return;
  }

  // ─── 2. Register School ───
  console.log("\n🏫 School Registration");
  const registerResult = await api("POST", "/api/auth/register", {
    email: `test-school-${Date.now()}@example.com`,
    password: "TestPass123",
    schoolName: `Test Academy ${Date.now()}`,
    phone: "08012345678",
    schoolType: "SECONDARY",
    ownershipType: "PRIVATE",
    state: "Lagos",
    lga: "Ikeja",
    address: "123 Test Street, Ikeja, Lagos",
  });
  assert("School registered", registerResult.success, JSON.stringify(registerResult.error));
  const schoolToken = registerResult.data?.accessToken;
  const schoolId = registerResult.data?.school?.id;
  const schoolSlug = registerResult.data?.school?.slug;
  assert("Access token received", !!schoolToken);
  assert("School ID received", !!schoolId);
  assert("School slug received", !!schoolSlug);

  if (!schoolToken) {
    console.log("\n⚠️  Registration failed. Skipping remaining tests.");
    console.log(`\nResults: ${passed} passed, ${failed} failed`);
    return;
  }

  // ─── 3. Auth - Login ───
  console.log("\n🔐 Authentication");
  const loginResult = await api("POST", "/api/auth/login", {
    email: registerResult.data.user.email,
    password: "TestPass123",
  });
  assert("Login works", loginResult.success);

  const meResult = await api("GET", "/api/auth/me", undefined, schoolToken);
  assert("GET /api/auth/me returns user", meResult.success && meResult.data?.email);
  assert("User has correct role", meResult.data?.role === "SCHOOL_ADMIN");

  // ─── 4. Create Classes ───
  console.log("\n📚 Classes");
  const classResult = await api("POST", "/api/classes", {
    name: "JSS 1",
  }, schoolToken);
  assert("Class created", classResult.success, JSON.stringify(classResult.error));
  const classId = classResult.data?.id;

  // Create class arm
  const armResult = await api("POST", `/api/classes/${classId}/arms`, {
    name: "A",
  }, schoolToken);
  assert("Class arm created", armResult.success, JSON.stringify(armResult.error));
  const armId = armResult.data?.id;

  // ─── 5. Create Students ───
  console.log("\n👨‍🎓 Students");
  const student1 = await api("POST", "/api/students", {
    admissionNumber: "TST/2025/001",
    fullName: "Adebayo Johnson",
    gender: "male",
    classId,
    armId,
    parentName: "Mr. Johnson",
    parentPhone: "08098765432",
    parentEmail: "johnson@example.com",
  }, schoolToken);
  assert("Student 1 created", student1.success, JSON.stringify(student1.error));
  const student1Id = student1.data?.id;

  const student2 = await api("POST", "/api/students", {
    admissionNumber: "TST/2025/002",
    fullName: "Chioma Okafor",
    gender: "female",
    classId,
    armId,
    parentName: "Mrs. Okafor",
    parentPhone: "08011223344",
  }, schoolToken);
  assert("Student 2 created", student2.success);

  // List students
  const studentList = await api("GET", "/api/students", undefined, schoolToken);
  assert("Students list returns data", studentList.success && studentList.data?.length >= 2);

  // Update student
  const updateStudent = await api("PATCH", `/api/students/${student1Id}`, {
    parentPhone: "08055667788",
  }, schoolToken);
  assert("Student updated", updateStudent.success);

  // ─── 6. Attendance ───
  console.log("\n📋 Attendance");
  const attendanceResult = await api("POST", "/api/attendance", {
    classArmId: armId,
    date: new Date().toISOString(),
    records: [
      { studentId: student1Id, status: "PRESENT" },
      { studentId: student2.data?.id, status: "LATE" },
    ],
  }, schoolToken);
  assert("Attendance recorded", attendanceResult.success, JSON.stringify(attendanceResult.error));

  // ─── 7. Notices ───
  console.log("\n📢 Notices");
  const noticeResult = await api("POST", "/api/notices", {
    title: "Parent-Teacher Meeting",
    body: "Dear parents, we have a parent-teacher meeting scheduled for next Friday.",
    targetType: "ALL",
    publishNow: true,
  }, schoolToken);
  assert("Notice created", noticeResult.success, JSON.stringify(noticeResult.error));
  const noticeId = noticeResult.data?.id;

  const noticeList = await api("GET", "/api/notices", undefined, schoolToken);
  assert("Notices listed", noticeList.success && noticeList.data?.length >= 1);

  // ─── 8. Fee Records ───
  console.log("\n💰 Fee Management");
  const feeResult = await api("POST", "/api/fees", {
    studentId: student1Id,
    amount: 150000,
    description: "Tuition - First Term",
    term: 1,
    session: "2025/2026",
  }, schoolToken);
  assert("Fee record created", feeResult.success, JSON.stringify(feeResult.error));
  const feeId = feeResult.data?.id;

  const fee2 = await api("POST", "/api/fees", {
    studentId: student2.data?.id,
    amount: 150000,
    description: "Tuition - First Term",
    term: 1,
    session: "2025/2026",
  }, schoolToken);
  assert("Fee record 2 created", fee2.success);

  const feeList = await api("GET", "/api/fees", undefined, schoolToken);
  assert("Fee records listed", feeList.success && feeList.data?.length >= 2);

  // Update fee status
  const feeUpdate = await api("PATCH", `/api/fees/${feeId}`, {
    status: "PAID",
    paymentMethod: "transfer",
  }, schoolToken);
  assert("Fee status updated to PAID", feeUpdate.success && feeUpdate.data?.status === "PAID");

  // ─── 9. Payments ───
  console.log("\n💳 Payments");
  const paymentResult = await api("POST", "/api/payments", {
    studentId: student1Id,
    amount: 150000,
    feeItemId: feeId,
    session: "2025/2026",
    channel: "transfer",
  }, schoolToken);
  assert("Payment recorded", paymentResult.success, JSON.stringify(paymentResult.error));

  const paymentList = await api("GET", "/api/payments", undefined, schoolToken);
  assert("Payments listed", paymentList.success && paymentList.data?.length >= 1);

  // ─── 10. Subjects ───
  console.log("\n📖 Subjects");
  const subjectResult = await api("POST", "/api/subjects", {
    name: "Mathematics",
    shortCode: "MTH",
  }, schoolToken);
  assert("Subject created", subjectResult.success, JSON.stringify(subjectResult.error));

  // ─── 11. Dashboard ───
  console.log("\n📊 Dashboard");
  const adminDash = await api("GET", "/api/dashboard/admin", undefined, schoolToken);
  assert("Admin dashboard loads", adminDash.success, JSON.stringify(adminDash.error));

  // ─── 12. Invite System ───
  console.log("\n📧 Invites");
  const inviteResult = await api("POST", "/api/invites/generate", {
    role: "TEACHER",
    fullName: "Mr. Test Teacher",
    email: "teacher@example.com",
    expiresInDays: 7,
  }, schoolToken);
  assert("Invite created", inviteResult.success, JSON.stringify(inviteResult.error));
  const inviteCode = inviteResult.data?.code;

  if (inviteCode) {
    const verifyInvite = await api("POST", "/api/invites/verify", {
      code: inviteCode,
    });
    assert("Invite verified", verifyInvite.success);
  }

  // ─── 13. School Profile ───
  console.log("\n🏫 School Profile");
  const profile = await api("GET", `/api/public/schools/${schoolSlug}`);
  assert("Public school profile loads", profile.success && profile.data?.name);

  // ─── 14. Tenant Isolation Check ───
  console.log("\n🔒 Tenant Isolation");

  // Register a second school
  const school2Result = await api("POST", "/api/auth/register", {
    email: `school2-${Date.now()}@example.com`,
    password: "TestPass123",
    schoolName: `Rival Academy ${Date.now()}`,
    phone: "08099887766",
    schoolType: "PRIMARY",
    ownershipType: "PRIVATE",
    state: "Lagos",
    lga: "Lagos Island",
    address: "456 Another Street",
  });
  const school2Token = school2Result.data?.accessToken;

  if (school2Token) {
    // School 2 should NOT see School 1's students
    const school2Students = await api("GET", "/api/students", undefined, school2Token);
    assert("School 2 cannot see School 1's students",
      school2Students.data?.length === 0 || !school2Students.data?.some((s: any) => s.fullName === "Adebayo Johnson"));

    // School 2 should NOT see School 1's notices
    const school2Notices = await api("GET", "/api/notices", undefined, school2Token);
    assert("School 2 cannot see School 1's notices",
      school2Notices.data?.length === 0 || !school2Notices.data?.some((n: any) => n.title === "Parent-Teacher Meeting"));
  }

  // ─── 15. RBAC Check ───
  console.log("\n🛡️  Role-Based Access Control");

  // Register a teacher in School 1
  const teacherInvite = await api("POST", "/api/invites/generate", {
    role: "TEACHER",
    fullName: "Test Teacher",
  }, schoolToken);

  if (teacherInvite.success && teacherInvite.data?.code) {
    const teacherReg = await api("POST", "/api/auth/register-with-invite", {
      inviteCode: teacherInvite.data.code,
      fullName: "Test Teacher",
      email: `teacher-${Date.now()}@example.com`,
      password: "TestPass123",
    });

    if (teacherReg.success) {
      const teacherToken = teacherReg.data?.accessToken;

      // Teacher should NOT access admin dashboard
      const teacherDashAttempt = await api("GET", "/api/dashboard/admin", undefined, teacherToken);
      assert("Teacher cannot access admin dashboard",
        teacherDashAttempt.status === 403 || !teacherDashAttempt.success);

      // Teacher SHOULD be able to access teacher dashboard
      const teacherDash = await api("GET", "/api/dashboard/teacher", undefined, teacherToken);
      assert("Teacher can access teacher dashboard", teacherDash.success);
    }
  }

  // ─── 16. School Update ───
  console.log("\n✏️  School Management");
  const updateResult = await api("PATCH", `/api/schools/${schoolId}`, {
    motto: "Knowledge is Power",
    address: "789 Updated Street, Ikeja",
  }, schoolToken);
  assert("School profile updated", updateResult.success);

  // ─── Results ───
  console.log("\n" + "=".repeat(50));
  console.log(`\n📊 Results: ${passed} passed, ${failed} failed out of ${passed + failed} tests`);

  if (failures.length > 0) {
    console.log("\n❌ Failed tests:");
    failures.forEach(f => console.log(`   - ${f}`));
  } else {
    console.log("\n🎉 All tests passed!");
  }

  console.log("\n" + "=".repeat(50));
}

run().catch(err => {
  console.error("\n💥 Test runner error:", err);
  process.exit(1);
});
