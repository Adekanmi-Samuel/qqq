/**
 * Ops script: create Tinachristal Schools via platform API.
 * Credentials and secrets come from environment variables only.
 * Required env:
 *   SCHOOLPILOT_API_BASE   (default https://schoolhub-api.vercel.app)
 *   SCHOOLPILOT_SA_EMAIL
 *   SCHOOLPILOT_SA_PASSWORD
 *   SCHOOLPILOT_SCHOOL_ADMIN_EMAIL
 *   SCHOOLPILOT_SCHOOL_ADMIN_PASSWORD
 * Optional:
 *   SCHOOLPILOT_TEACHER_FULL_NAME
 *   SCHOOLPILOT_TEACHER_EMAIL
 *   SCHOOLPILOT_TEACHER_PASSWORD
 */

const API = process.env.SCHOOLPILOT_API_BASE || "https://schoolhub-api.vercel.app";
const cookieJar = new Map();

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    console.error(`Missing required env ${name}. Refusing to continue.`);
    process.exit(1);
  }
  return value;
}

function getCookieHeader() {
  return [...cookieJar.entries()].map(([k, v]) => `${k}=${v}`).join("; ");
}

async function request(path, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };
  if (cookieJar.size) {
    headers.Cookie = getCookieHeader();
  }
  const csrf = cookieJar.get("sh_csrf");
  if (csrf && options.method && options.method !== "GET") {
    headers["X-CSRF-TOKEN"] = csrf;
  }
  const res = await fetch(`${API}${path}`, {
    ...options,
    headers,
    redirect: "manual",
  });
  const setCookies = res.headers.getSetCookie?.() || [];
  for (const line of setCookies) {
    const [pair] = line.split(";");
    const idx = pair.indexOf("=");
    if (idx > 0) {
      cookieJar.set(pair.slice(0, idx).trim(), pair.slice(idx + 1).trim());
    }
  }
  let body = null;
  const text = await res.text();
  try {
    body = JSON.parse(text);
  } catch {
    body = { raw: text.slice(0, 300) };
  }
  return { status: res.status, body };
}

async function login(email, password) {
  cookieJar.clear();
  const res = await request("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password, remember: true }),
  });
  if (!res.body?.success) {
    throw new Error(`Login failed: ${JSON.stringify(res.body)}`);
  }
  return res.body.data;
}

async function main() {
  const saEmail = requireEnv("SCHOOLPILOT_SA_EMAIL");
  const saPassword = requireEnv("SCHOOLPILOT_SA_PASSWORD");
  const schoolAdminEmail = requireEnv("SCHOOLPILOT_SCHOOL_ADMIN_EMAIL");
  const schoolAdminPassword = requireEnv("SCHOOLPILOT_SCHOOL_ADMIN_PASSWORD");

  console.log("Logging in as superadmin...");
  const sa = await login(saEmail, saPassword);
  console.log("Superadmin:", sa.user.email, sa.user.role);

  console.log("Creating Tinachristal Schools...");
  const create = await request("/api/platform/schools", {
    method: "POST",
    body: JSON.stringify({
      schoolName: "Tinachristal Schools",
      adminFullName: process.env.SCHOOLPILOT_SCHOOL_ADMIN_NAME || "School Admin",
      email: schoolAdminEmail,
      password: schoolAdminPassword,
      phone: "08012345678",
      schoolType: "COMBINED",
      ownershipType: "PRIVATE",
      state: "Lagos",
      lga: "Ikeja",
      address: "Tinachristal Schools Campus, Ikeja, Lagos",
      motto: "Knowledge and character",
      status: "ACTIVE",
      verified: true,
    }),
  });

  if (!create.body?.success) {
    if (String(create.body?.error || "").toLowerCase().includes("already")) {
      console.log("School already exists, looking it up...");
      const list = await request("/api/platform/schools?search=Tinachristal&limit=5");
      const school = (list.body?.data || []).find((s) => s.name === "Tinachristal Schools");
      if (!school) throw new Error("School exists but could not be found: " + JSON.stringify(create.body));
      return finish(school.id, school.name);
    }
    throw new Error("Create school failed: " + JSON.stringify(create.body));
  }

  const school = create.body.data.school;
  console.log("Created school:", school.name, school.id);
  return finish(school.id, school.name);
}

async function finish(schoolId, schoolName) {
  const teacherEmail = process.env.SCHOOLPILOT_TEACHER_EMAIL;
  const teacherPassword = process.env.SCHOOLPILOT_TEACHER_PASSWORD;
  const teacherFullName = process.env.SCHOOLPILOT_TEACHER_FULL_NAME || "Teacher";

  const body = {
    schoolId,
    schoolName,
    classes: ["JSS 1", "JSS 2", "JSS 3"],
    session: "2025/2026",
    term: 1,
    weeks: 12,
  };

  if (teacherEmail && teacherPassword) {
    body.teacher = {
      fullName: teacherFullName,
      email: teacherEmail,
      password: teacherPassword,
    };
    console.log("Bootstrapping curriculum with teacher account from env...");
  } else {
    console.log("Bootstrapping curriculum without teacher account (set SCHOOLPILOT_TEACHER_* to create one)...");
  }

  const boot = await request(`/api/platform/schools/${schoolId}/bootstrap-curriculum`, {
    method: "POST",
    body: JSON.stringify(body),
  });

  if (!boot.body?.success) {
    throw new Error("Bootstrap failed: " + JSON.stringify(boot.body));
  }

  console.log("Bootstrap result:", JSON.stringify(boot.body.data, null, 2));

  // Timetable slots are generated during bootstrap for the teacher (Mon-Fri default grid).
  console.log("Timetable slots created during bootstrap:", boot.body.data?.timetableSlotsCreated ?? "n/a");

  console.log("Verifying school admin login...");
  const admin = await login(
    requireEnv("SCHOOLPILOT_SCHOOL_ADMIN_EMAIL"),
    requireEnv("SCHOOLPILOT_SCHOOL_ADMIN_PASSWORD")
  );
  console.log("Admin OK:", admin.user.email, admin.user.role, admin.school?.name);

  if (teacherEmail && teacherPassword) {
    console.log("Verifying teacher login...");
    const teacher = await login(teacherEmail, teacherPassword);
    console.log("Teacher OK:", teacher.user.email, teacher.user.role, teacher.school?.name);

    // Teacher my-slots should not stay empty after bootstrap timetable generation.
    const slots = await request("/api/timetable/my-slots");
    const slotCount = Array.isArray(slots.body?.data) ? slots.body.data.length : 0;
    console.log("Teacher timetable my-slots length:", slotCount);
    if (slotCount === 0) {
      console.warn("WARNING: bootstrap created no timetable slots. Teacher dashboard schedule will be empty.");
    }
  }

  const classes = await request("/api/classes");
  const subjects = await request("/api/subjects");
  const schemes = await request("/api/ai/schemes");
  console.log("Classes:", classes.body?.data?.map?.((c) => c.name) || classes.body);
  console.log("Subjects count:", subjects.body?.data?.length);
  const schemeData = schemes.body?.data || [];
  console.log("Schemes:", schemeData.length);
  const notes = schemeData.reduce((acc, s) => acc + (s.lessonNotes?.length || 0), 0);
  console.log("Lesson notes attached to schemes:", notes);
  console.log("DONE");
}

main().catch((err) => {
  console.error("FAILED:", err.message || err);
  process.exit(1);
});
