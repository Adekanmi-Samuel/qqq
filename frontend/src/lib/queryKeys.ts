/**
 * Query key factory for TanStack Query.
 * Provides consistent cache keys across the application.
 */
export const queryKeys = {
  // Auth
  auth: {
    all: ["auth"] as const,
    me: () => [...queryKeys.auth.all, "me"] as const,
    school: (slug: string) => [...queryKeys.auth.all, "school", slug] as const,
  },
  // Students
  students: {
    all: ["students"] as const,
    list: (filters?: Record<string, string>) => [...queryKeys.students.all, "list", filters] as const,
    detail: (id: string) => [...queryKeys.students.all, "detail", id] as const,
    byClass: (classId: string) => [...queryKeys.students.all, "class", classId] as const,
  },
  // Attendance
  attendance: {
    all: ["attendance"] as const,
    list: (filters?: Record<string, unknown>) => [...queryKeys.attendance.all, "list", filters] as const,
    summary: (filters?: Record<string, unknown>) => [...queryKeys.attendance.all, "summary", filters] as const,
  },
  // Fees / Finance
  fees: {
    all: ["fees"] as const,
    records: (filters?: Record<string, unknown>) => [...queryKeys.fees.all, "records", filters] as const,
    debtors: (filters?: Record<string, unknown>) => [...queryKeys.fees.all, "debtors", filters] as const,
    summary: (filters?: Record<string, unknown>) => [...queryKeys.fees.all, "summary", filters] as const,
  },
  // Results / Grades
  results: {
    all: ["results"] as const,
    list: (filters?: Record<string, unknown>) => [...queryKeys.results.all, "list", filters] as const,
    byStudent: (studentId: string) => [...queryKeys.results.all, "student", studentId] as const,
  },
  // Classes
  classes: {
    all: ["classes"] as const,
    list: (schoolId?: string) => [...queryKeys.classes.all, "list", schoolId] as const,
    arms: (classId: string) => [...queryKeys.classes.all, "arms", classId] as const,
  },
  // Subjects
  subjects: {
    all: ["subjects"] as const,
    list: (schoolId?: string) => [...queryKeys.subjects.all, "list", schoolId] as const,
  },
  // Notices
  notices: {
    all: ["notices"] as const,
    list: (filters?: Record<string, unknown>) => [...queryKeys.notices.all, "list", filters] as const,
  },
  // Dashboard / Analytics
  dashboard: {
    all: ["dashboard"] as const,
    stats: (role: string) => [...queryKeys.dashboard.all, "stats", role] as const,
    analytics: (filters?: Record<string, unknown>) => [...queryKeys.dashboard.all, "analytics", filters] as const,
  },
  // CBT / Exams
  cbt: {
    all: ["cbt"] as const,
    subjects: () => [...queryKeys.cbt.all, "subjects"] as const,
    topics: (subjectId: string) => [...queryKeys.cbt.all, "topics", subjectId] as const,
    sessions: (filters?: Record<string, unknown>) => [...queryKeys.cbt.all, "sessions", filters] as const,
    analytics: (filters?: Record<string, unknown>) => [...queryKeys.cbt.all, "analytics", filters] as const,
  },
  // Teacher
  teacher: {
    all: ["teacher"] as const,
    timesheets: (filters?: Record<string, unknown>) => [...queryKeys.teacher.all, "timesheets", filters] as const,
    lessons: (filters?: Record<string, unknown>) => [...queryKeys.teacher.all, "lessons", filters] as const,
  },
  // Settings
  settings: {
    all: ["settings"] as const,
    profile: () => [...queryKeys.settings.all, "profile"] as const,
    school: () => [...queryKeys.settings.all, "school"] as const,
  },
  // Platform (Super Admin)
  platform: {
    all: ["platform"] as const,
    schools: (filters?: Record<string, unknown>) => [...queryKeys.platform.all, "schools", filters] as const,
    plans: () => [...queryKeys.platform.all, "plans"] as const,
    stats: () => [...queryKeys.platform.all, "stats"] as const,
  },
} as const;

export type QueryKeys = typeof queryKeys;
