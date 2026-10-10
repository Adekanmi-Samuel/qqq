import bcrypt from "bcryptjs";
import crypto from "crypto";
import { prisma } from "../lib/prisma";
import { generateSlug } from "../utils/slug";
import {
  buildAssignments,
  buildExercises,
  buildLessonNoteHtml,
  buildMidtermFocusHtml,
  expandLevelToClasses,
  SCHOOL_CLASS_LEVELS,
} from "../utils/lessonNoteContent";
import { sanitizeHtml } from "../utils/sanitize";
import { sessionService } from "./session.service";
import { authService } from "./auth.service";
import { Response } from "express";

/** Timetable aligned junior secondary subjects for Nigerian private schools. */
export const DEFAULT_JSS_SUBJECTS = [
  "English Studies",
  "Mathematics",
  "Yoruba",
  "Physical and Health Education",
  "Cultural and Creative Arts",
  "Digital Technologies",
  "Social and Citizenship Studies",
  "Christian Religious Studies",
  "Intermediate Science",
  "Business Studies",
  "Nigerian History",
  "Prevocational Studies",
];

/** Week by week topics for first term, aligned to timetable subjects. */
export const TERM_TOPICS: Record<string, string[]> = {
  "English Studies": [
    "Revision of key language skills",
    "Parts of speech: nouns and pronouns",
    "Parts of speech: verbs and adverbs",
    "Parts of speech: adjectives and prepositions",
    "Sentence structure and punctuation",
    "Comprehension and close reading",
    "Summary writing",
    "Formal letter writing",
    "Essay writing: my school",
    "Spelling, dictation and vocabulary",
    "Oral English and pronunciation",
    "Revision and continuous assessment",
  ],
  Mathematics: [
    "Revision of number work",
    "Number bases",
    "Fractions and equivalent fractions",
    "Decimals and rounding off",
    "Percentages",
    "Ratio and proportion",
    "Indices and standard form",
    "Algebraic expressions",
    "Simple linear equations",
    "Geometry: shapes and angles",
    "Mensuration: perimeter and area",
    "Statistics: mean, median and mode",
  ],
  Yoruba: [
    "Revision of Yoruba language skills",
    "Alphabet and pronunciation",
    "Greetings and introductions",
    "Family members in Yoruba",
    "Numbers and days",
    "Simple sentence construction",
    "Comprehension passages",
    "Oral literature and folktales",
    "Essay writing: my school in Yoruba",
    "Dictation and spelling",
    "Cultural values in Yoruba language",
    "Revision and continuous assessment",
  ],
  "Physical and Health Education": [
    "Revision and fitness check",
    "Meaning and importance of physical education",
    "Warm up and cool down routines",
    "Athletics skills",
    "Ball games: basic skills",
    "Gymnastics and body management",
    "Nutrition for learners",
    "Personal hygiene habits",
    "Disease prevention in schools",
    "First aid basics",
    "Recreation and leisure activities",
    "Revision and practical assessment",
  ],
  "Cultural and Creative Arts": [
    "Revision of art basics",
    "Meaning of motifs in Nigerian art",
    "Motifs I: meaning and uses",
    "Motifs II: types of motifs",
    "Nigerian musical instruments",
    "Drama and theatre skills",
    "Visual arts and drawing techniques",
    "Craft and design projects",
    "Dance and movement",
    "Folktales and oral literature",
    "Festivals in Nigeria",
    "Revision and creative project",
  ],
  "Digital Technologies": [
    "Revision and lab safety",
    "Introduction to digital technologies",
    "Computer hardware",
    "Computer software",
    "Operating systems",
    "Word processing skills",
    "Internet and email basics",
    "Keyboarding and file management",
    "Spreadsheet introduction",
    "Computer ethics and online safety",
    "Simple coding concepts",
    "Revision and practical test",
  ],
  "Social and Citizenship Studies": [
    "Revision of last term",
    "Meaning and importance of social and citizenship studies",
    "The family as the first social group",
    "Community organisation and leadership",
    "Nigerian political system",
    "Map reading skills",
    "Nigeria physical features",
    "Economic activities in Nigeria",
    "National symbols and their meanings",
    "Cultural diversity in Nigeria",
    "Population and migration",
    "Revision and assessment",
  ],
  "Christian Religious Studies": [
    "Revision and devotion",
    "Meaning of religion and faith",
    "God as the creator",
    "Creation stories in the Bible",
    "Man's relationship with God",
    "Obedience and faithfulness",
    "Prayer life and worship",
    "Christian living and moral choices",
    "Values that build good character",
    "Leadership in the Christian faith",
    "Love, forgiveness and reconciliation",
    "Revision and spiritual quiz",
  ],
  "Intermediate Science": [
    "Revision of previous term work",
    "Scientific method and investigation",
    "Living and non living things",
    "Parts of plants and their functions",
    "Animals and classification",
    "Human body systems",
    "Water cycle and weather",
    "Types of soil",
    "Sources of energy",
    "Force and motion",
    "Light and sound",
    "Health, hygiene and disease prevention",
  ],
  "Business Studies": [
    "Revision and business talk",
    "Meaning of business and commerce",
    "Production and consumers",
    "Forms of business ownership",
    "Money and banking basics",
    "Shop keeping and stock",
    "Advertising and selling",
    "Entrepreneurship skills",
    "Record keeping",
    "Consumer rights",
    "Business plan outline",
    "Revision and assessment",
  ],
  "Nigerian History": [
    "Revision and meaning of Nigerian history",
    "Early societies in Nigeria",
    "The Sokoto Caliphate",
    "The Benin Kingdom",
    "British colonisation of Nigeria",
    "Amalgamation of Nigeria",
    "Independence and the First Republic",
    "Military eras and return to democracy",
    "Nigerian heroes and nationalists",
    "Oil and the Nigerian economy",
    "National unity and challenges",
    "Revision and assessment",
  ],
  Prevocational: [
    "Revision and career talk",
    "Meaning of pre vocational studies",
    "Career awareness and exploration",
    "Foods and nutrition",
    "Clothing and textiles",
    "Child care and development",
    "Home management skills",
    "Small scale business ideas",
    "Agricultural practices for beginners",
    "Entrepreneurship and saving",
    "Safety at work and in the home",
    "Revision and mini enterprise project",
  ],
  "Prevocational Studies": [
    "Revision and career talk",
    "Meaning of pre vocational studies",
    "Career awareness and exploration",
    "Foods and nutrition",
    "Clothing and textiles",
    "Child care and development",
    "Home management skills",
    "Small scale business ideas",
    "Agricultural practices for beginners",
    "Entrepreneurship and saving",
    "Safety at work and in the home",
    "Revision and mini enterprise project",
  ],
};

function shortCodeFor(name: string): string {
  const clean = name.replace(/[^a-zA-Z ]/g, "").trim();
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].substring(0, 4).toUpperCase();
  return parts.map((p) => p[0]).join("").substring(0, 5).toUpperCase();
}

function topicsFor(subject: string): string[] {
  return TERM_TOPICS[subject] || TERM_TOPICS.Mathematics.map((t) => `${subject}: ${t}`);
}

export class PlatformService {
  async getStats() {
    const [
      totalSchools,
      activeSchools,
      totalStudents,
      totalStaff,
      totalRevenue,
      recentSchools,
      totalUsers,
      pendingSchools,
    ] = await Promise.all([
      prisma.school.count(),
      prisma.school.count({ where: { status: "ACTIVE" } }),
      prisma.student.count({ where: { active: true } }),
      prisma.user.count({
        where: { active: true, role: { in: ["TEACHER", "PRINCIPAL", "BURSAR", "SCHOOL_ADMIN"] } },
      }),
      prisma.paymentTransaction.aggregate({
        _sum: { amount: true },
        where: { status: "success" },
      }),
      prisma.school.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        select: { id: true, name: true, slug: true, status: true, planType: true, createdAt: true },
      }),
      prisma.user.count(),
      prisma.school.count({ where: { status: "PENDING_VERIFICATION" } }),
    ]);

    return {
      totalSchools,
      activeSchools,
      pendingSchools,
      totalStudents,
      totalStaff,
      totalRevenue: totalRevenue._sum.amount || 0,
      totalUsers,
      recentSchools,
    };
  }

  async listSchools(params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    planType?: string;
  }) {
    const page = params.page || 1;
    const limit = Math.min(params.limit || 20, 100);
    const skip = (page - 1) * limit;

    const where: any = {};
    if (params.search) {
      where.OR = [
        { name: { contains: params.search, mode: "insensitive" } },
        { email: { contains: params.search, mode: "insensitive" } },
        { slug: { contains: params.search, mode: "insensitive" } },
      ];
    }
    if (params.status) where.status = params.status;
    if (params.planType) where.planType = params.planType;

    const [schools, total] = await Promise.all([
      prisma.school.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          _count: { select: { students: true, users: true } },
          users: {
            where: { role: "SCHOOL_ADMIN" },
            select: { id: true, fullName: true, email: true, active: true },
            take: 3,
          },
        },
      }),
      prisma.school.count({ where }),
    ]);

    return {
      data: schools,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getSchool(id: string) {
    const school = await prisma.school.findUnique({
      where: { id },
      include: {
        users: {
          select: { id: true, fullName: true, email: true, role: true, active: true, createdAt: true },
          orderBy: { createdAt: "desc" },
        },
        classes: { select: { id: true, name: true } },
        _count: { select: { students: true, users: true } },
      },
    });
    if (!school) throw new Error("School not found");
    return school;
  }

  /**
   * Superadmin creates a school and its admin user directly.
   * Faster than public onboarding and free of rate limits.
   */
  async createSchool(data: {
    schoolName: string;
    email: string;
    password: string;
    phone: string;
    schoolType?: string;
    ownershipType?: string;
    state?: string;
    lga?: string;
    address?: string;
    cacNumber?: string;
    adminFullName?: string;
    motto?: string;
    status?: string;
    verified?: boolean;
  }) {
    const slug = generateSlug(data.schoolName);
    const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
    if (existingUser) throw new Error("An account with this email already exists.");

    const existingSchool = await prisma.school.findUnique({ where: { slug } });
    if (existingSchool) throw new Error("A school with this name is already registered.");

    const passwordHash = await bcrypt.hash(data.password, 12);
    // Match public onboarding defaults unless the operator explicitly chooses otherwise.
    const status = (data.status as any) || "PENDING_VERIFICATION";
    const verified = data.verified ?? false;

    const result = await prisma.$transaction(async (tx) => {
      const school = await tx.school.create({
        data: {
          name: data.schoolName,
          slug,
          cacNumber: data.cacNumber || null,
          schoolType: (data.schoolType as any) || "SECONDARY",
          ownershipType: (data.ownershipType as any) || "PRIVATE",
          state: data.state || "Lagos",
          lga: data.lga || "Ikeja",
          address: data.address || "Nigeria",
          email: data.email,
          phone: data.phone,
          motto: data.motto || null,
          planType: "FREE",
          status,
          verified,
          verifiedAt: verified ? new Date() : null,
          activatedAt: status === "ACTIVE" ? new Date() : null,
        },
      });

      const user = await tx.user.create({
        data: {
          schoolId: school.id,
          fullName: data.adminFullName || "School Admin",
          email: data.email,
          passwordHash,
          role: "SCHOOL_ADMIN",
        },
        select: { id: true, fullName: true, email: true, role: true, schoolId: true },
      });

      await tx.academicCalendar.createMany({
        data: [
          {
            schoolId: school.id,
            academicYear: "2025/2026",
            term: 1,
            termName: "First Term",
            startDate: new Date("2025-09-08"),
            endDate: new Date("2025-12-12"),
            resumptionDate: new Date("2025-09-08"),
            isCurrent: true,
          },
          {
            schoolId: school.id,
            academicYear: "2025/2026",
            term: 2,
            termName: "Second Term",
            startDate: new Date("2026-01-12"),
            endDate: new Date("2026-04-02"),
            resumptionDate: new Date("2026-01-12"),
            isCurrent: false,
          },
          {
            schoolId: school.id,
            academicYear: "2025/2026",
            term: 3,
            termName: "Third Term",
            startDate: new Date("2026-04-27"),
            endDate: new Date("2026-07-17"),
            resumptionDate: new Date("2026-04-27"),
            isCurrent: false,
          },
        ],
      });

      for (const name of ["JSS 1", "JSS 2", "JSS 3"]) {
        await tx.class.create({ data: { schoolId: school.id, name } });
      }

      return { school, user };
    });

    return {
      school: result.school,
      admin: result.user,
    };
  }

  async updateSchool(
    id: string,
    data: {
      status?: string;
      planId?: string;
      planType?: string;
      verified?: boolean;
      suspensionReason?: string;
      name?: string;
      email?: string;
      phone?: string;
      state?: string;
      lga?: string;
      address?: string;
      motto?: string;
      website?: string;
      currency?: string;
      cacNumber?: string;
    }
  ) {
    const updateData: any = {};
    if (data.status) updateData.status = data.status;
    if (data.planId) updateData.planId = data.planId;
    if (data.planType) updateData.planType = data.planType;
    if (data.name) updateData.name = data.name;
    if (data.email) updateData.email = data.email;
    if (data.phone) updateData.phone = data.phone;
    if (data.state) updateData.state = data.state;
    if (data.lga) updateData.lga = data.lga;
    if (data.address) updateData.address = data.address;
    if (data.motto !== undefined) updateData.motto = data.motto;
    if (data.website !== undefined) updateData.website = data.website;
    if (data.currency) updateData.currency = data.currency;
    if (data.cacNumber !== undefined) updateData.cacNumber = data.cacNumber;
    if (data.verified !== undefined) {
      updateData.verified = data.verified;
      updateData.verifiedAt = data.verified ? new Date() : null;
    }
    if (data.suspensionReason !== undefined) updateData.suspensionReason = data.suspensionReason;
    if (data.status === "ACTIVE") {
      updateData.activatedAt = new Date();
      updateData.suspensionReason = null;
    }
    if (data.status === "SUSPENDED") {
      updateData.suspendedAt = new Date();
    }

    return prisma.school.update({
      where: { id },
      data: updateData,
    });
  }

  async listUsers(params: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    schoolId?: string;
    active?: boolean;
  }) {
    const page = params.page || 1;
    const limit = Math.min(params.limit || 50, 200);
    const skip = (page - 1) * limit;

    const where: any = {};
    if (params.search) {
      where.OR = [
        { fullName: { contains: params.search, mode: "insensitive" } },
        { email: { contains: params.search, mode: "insensitive" } },
      ];
    }
    if (params.role) where.role = params.role;
    if (params.schoolId) where.schoolId = params.schoolId;
    if (params.active !== undefined) where.active = params.active;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          fullName: true,
          email: true,
          role: true,
          active: true,
          schoolId: true,
          passwordResetRequired: true,
          createdAt: true,
          school: { select: { id: true, name: true, slug: true } },
        },
      }),
      prisma.user.count({ where }),
    ]);

    return {
      data: users,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async createUser(data: {
    fullName: string;
    email: string;
    password: string;
    role: string;
    schoolId: string;
  }) {
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) throw new Error("An account with this email already exists.");

    const school = await prisma.school.findUnique({ where: { id: data.schoolId } });
    if (!school) throw new Error("School not found.");

    const passwordHash = await bcrypt.hash(data.password, 12);
    return prisma.user.create({
      data: {
        schoolId: data.schoolId,
        fullName: data.fullName,
        email: data.email,
        passwordHash,
        role: data.role as any,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        active: true,
        schoolId: true,
        school: { select: { id: true, name: true } },
      },
    });
  }

  async updateUser(
    id: string,
    data: {
      fullName?: string;
      email?: string;
      role?: string;
      active?: boolean;
      schoolId?: string | null;
      password?: string;
      passwordResetRequired?: boolean;
    }
  ) {
    const updateData: any = {};
    if (data.fullName) updateData.fullName = data.fullName;
    if (data.email) updateData.email = data.email;
    if (data.role) updateData.role = data.role as any;
    if (data.active !== undefined) updateData.active = data.active;
    if (data.schoolId !== undefined) updateData.schoolId = data.schoolId;
    if (data.passwordResetRequired !== undefined) updateData.passwordResetRequired = data.passwordResetRequired;
    if (data.password) {
      updateData.passwordHash = await bcrypt.hash(data.password, 12);
      updateData.passwordResetRequired = false;
    }

    return prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        active: true,
        schoolId: true,
        passwordResetRequired: true,
        school: { select: { id: true, name: true } },
      },
    });
  }

  async setUserPassword(id: string, password: string) {
    const passwordHash = await bcrypt.hash(password, 12);
    await prisma.user.update({
      where: { id },
      data: { passwordHash, passwordResetRequired: false },
    });
    await sessionService.revokeAllSessions(id);
    return { success: true, message: "Password updated for this user." };
  }

  async deactivateUser(id: string, active = false) {
    return prisma.user.update({
      where: { id },
      data: { active },
      select: { id: true, email: true, active: true },
    });
  }

  async deleteUser(id: string) {
    await prisma.user.update({
      where: { id },
      data: { active: false, passwordResetRequired: true },
    });
    await sessionService.revokeAllSessions(id);
    return { success: true, message: "User deactivated and sessions revoked." };
  }

  /**
   * Superadmin signs in as any user. Sets the same auth cookies.
   * Blocked against impersonating another SUPER_ADMIN. Writes an audit event
   * so impersonation sessions are attributable.
   */
  async impersonate(
    targetUserId: string,
    res: Response,
    deviceId: string,
    userAgent: string,
    ipAddress: string,
    actor?: { userId?: string; role?: string }
  ) {
    const target = await prisma.user.findUnique({
      where: { id: targetUserId },
      include: { school: { select: { id: true, name: true, slug: true, verified: true, logoUrl: true, motto: true } } },
    });
    if (!target) throw new Error("User not found.");
    if (!target.active) throw new Error("User is inactive.");
    if (target.role === "SUPER_ADMIN") {
      throw new Error("Cannot impersonate another Super Admin.");
    }

    const { accessToken, refreshToken } = await sessionService.createSession(
      target.id,
      target.schoolId,
      target.role,
      deviceId,
      userAgent,
      ipAddress,
      false,
      actor?.userId
    );

    authService.setAuthCookies(res, accessToken, refreshToken, false);

    // Audit trail for enter-impersonation (fire and forget).
    prisma.auditLog
      .create({
        data: {
          userId: actor?.userId || null,
          schoolId: target.schoolId,
          action: "platform.impersonate.enter",
          resource: "user",
          resourceId: target.id,
          method: "POST",
          path: "/api/platform/impersonate",
          ipAddress,
          userAgent,
          result: "success",
          metadata: {
            targetUserId: target.id,
            targetEmail: target.email,
            targetRole: target.role,
            actorRole: actor?.role,
          },
        },
      })
      .catch(() => {});

    return {
      user: {
        id: target.id,
        fullName: target.fullName,
        email: target.email,
        role: target.role,
        passwordResetRequired: target.passwordResetRequired,
      },
      school: target.school,
    };
  }

  async listPlans() {
    const plans = await prisma.subscriptionPlan.findMany({
      orderBy: { price: "asc" },
    });
    // Map interval -> billingCycle and derive planType for the UI contract.
    // SubscriptionPlan stores interval + price only; planType is derived from price bands.
    return plans.map((plan) => ({
      ...plan,
      billingCycle: plan.interval === "yearly" ? "yearly" : "monthly",
      planType: plan.price <= 0 ? "FREE" : plan.price >= 10000 ? "ENTERPRISE" : "PREMIUM",
    }));
  }

  async createPlan(data: {
    name: string;
    planType?: string;
    price: number;
    maxStudents: number;
    maxStaff: number;
    features: string[];
    billingCycle: string;
  }) {
    return prisma.subscriptionPlan.create({
      data: {
        name: data.name,
        price: data.price,
        maxStudents: data.maxStudents,
        maxStaff: data.maxStaff,
        features: data.features,
        interval: data.billingCycle,
      },
    });
  }

  async updatePlan(id: string, data: any) {
    const allowed: any = {};
    if (data.name !== undefined) allowed.name = data.name;
    if (data.description !== undefined) allowed.description = data.description;
    if (data.price !== undefined) allowed.price = data.price;
    if (data.maxStudents !== undefined) allowed.maxStudents = data.maxStudents;
    if (data.maxStaff !== undefined) allowed.maxStaff = data.maxStaff;
    if (data.features !== undefined) allowed.features = data.features;
    if (data.billingCycle !== undefined) allowed.interval = data.billingCycle;
    if (data.interval !== undefined) allowed.interval = data.interval;
    if (data.active !== undefined) allowed.active = data.active;
    return prisma.subscriptionPlan.update({
      where: { id },
      data: allowed,
    });
  }

  async getSettings() {
    let configRow = await prisma.platformConfig.findFirst();
    if (!configRow) {
      configRow = await prisma.platformConfig.create({
        data: { key: "global", value: {} },
      });
    }
    return configRow;
  }

  async updateSettings(data: any) {
    let configRow = await prisma.platformConfig.findFirst();
    if (!configRow) {
      configRow = await prisma.platformConfig.create({
        data: { key: "global", value: data },
      });
      return configRow;
    }
    return prisma.platformConfig.update({
      where: { id: configRow.id },
      data: {
        value: {
          ...((configRow.value as Record<string, any>) || {}),
          ...data,
        },
      },
    });
  }

  /**
   * Full curriculum bootstrap for a school:
   * subjects, class arms, teacher account, subject assignments,
   * schemes of work and ChatGPT style lesson notes for every week.
   */
  async bootstrapSchoolCurriculum(schoolId: string, options: {
    classes?: string[];
    levels?: string[];
    subjects?: string[];
    teacher?: {
      fullName: string;
      email: string;
      password: string;
    };
    session?: string;
    term?: number;
    weeks?: number;
    schoolName?: string;
  }) {
    const school = await prisma.school.findUnique({ where: { id: schoolId } });
    if (!school) throw new Error("School not found.");

    const fromLevels = (options.levels || []).flatMap((l) => expandLevelToClasses(l));
    const rawClasses = options.classes?.length ? options.classes : fromLevels.length ? fromLevels : ["JSS 1", "JSS 2", "JSS 3"];
    const classNames = Array.from(new Set(
      rawClasses.flatMap((c) => {
        const up = String(c || "").toUpperCase().replace(/\s+/g, "");
        if (up === "KG" || up === "KINDERGARTEN") return ["KG 1", "KG 2", "KG 3"];
        if (up === "NURSERY") return ["Nursery 1", "Nursery 2", "Nursery 3"];
        if (up === "PRIMARY") return ["Primary 1", "Primary 2", "Primary 3", "Primary 4", "Primary 5", "Primary 6"];
        if (up === "JSS") return ["JSS 1", "JSS 2", "JSS 3"];
        if (up === "SS") return ["SS 1", "SS 2", "SS 3"];
        return expandLevelToClasses(c);
      })
    ));
    const subjectNames = options.subjects && options.subjects.length ? options.subjects : DEFAULT_JSS_SUBJECTS;
    const session = options.session || "2025/2026";
    const term = options.term || 1;
    const weekCount = Math.min(Math.max(options.weeks || 12, 1), 20);
    const schoolName = options.schoolName || school.name;

    // Ensure classes exist
    const classRecords: { id: string; name: string }[] = [];
    for (const name of classNames) {
      const existing = await prisma.class.findFirst({
        where: { schoolId, name },
      });
      if (existing) {
        classRecords.push(existing);
      } else {
        const created = await prisma.class.create({ data: { schoolId, name } });
        classRecords.push(created);
      }
    }

    // Ensure arms + class teacher once teacher exists
    // Subjects
    const subjectRecords: { id: string; name: string }[] = [];
    for (const name of subjectNames) {
      const existing = await prisma.subject.findFirst({
        where: { schoolId, name: { equals: name, mode: "insensitive" } },
      });
      if (existing) {
        subjectRecords.push(existing);
      } else {
        const created = await prisma.subject.create({
          data: { schoolId, name, shortCode: shortCodeFor(name) },
        });
        subjectRecords.push(created);
      }
    }

    // Teacher
    let teacherId: string | null = null;
    if (options.teacher?.email) {
      const existingTeacher = await prisma.user.findUnique({ where: { email: options.teacher.email } });
      if (existingTeacher) {
        if (existingTeacher.schoolId !== schoolId) {
          throw new Error("Teacher email already belongs to another school.");
        }
        teacherId = existingTeacher.id;
        await prisma.user.update({
          where: { id: teacherId },
          data: {
            fullName: options.teacher.fullName,
            role: "TEACHER",
            active: true,
            passwordResetRequired: false,
          },
        });
      } else {
        const passwordHash = await bcrypt.hash(options.teacher.password, 12);
        const created = await prisma.user.create({
          data: {
            schoolId,
            fullName: options.teacher.fullName,
            email: options.teacher.email,
            passwordHash,
            role: "TEACHER",
          },
        });
        teacherId = created.id;
      }
    }

    // Class arms + subject teacher links
    const armIds: string[] = [];
    for (const cls of classRecords) {
      let arm = await prisma.classArm.findFirst({
        where: { classId: cls.id, name: "A" },
      });
      if (!arm) {
        arm = await prisma.classArm.create({
          data: {
            classId: cls.id,
            name: "A",
            classTeacherId: teacherId,
          },
        });
      } else if (teacherId && arm.classTeacherId !== teacherId) {
        arm = await prisma.classArm.update({
          where: { id: arm.id },
          data: { classTeacherId: teacherId },
        });
      }
      armIds.push(arm.id);

      if (teacherId) {
        for (const subject of subjectRecords) {
          const existingLink = await prisma.subjectTeacher.findFirst({
            where: { schoolId, subjectId: subject.id, classArmId: arm.id },
          });
          if (!existingLink) {
            await prisma.subjectTeacher.create({
              data: {
                schoolId,
                subjectId: subject.id,
                classArmId: arm.id,
                teacherId,
              },
            });
          } else if (existingLink.teacherId !== teacherId) {
            await prisma.subjectTeacher.update({
              where: { id: existingLink.id },
              data: { teacherId },
            });
          }
        }
      }
    }

    // Schemes + lesson notes
    let schemesCreated = 0;
    let notesCreated = 0;
    let timetableSlotsCreated = 0;

    // Default Mon-Fri grid from SubjectTeacher links so teacher my-slots/dashboard work after bootstrap.
    const DEFAULT_PERIODS = [
      { period: 1, startTime: "08:00", endTime: "08:40" },
      { period: 2, startTime: "08:40", endTime: "09:20" },
      { period: 3, startTime: "09:20", endTime: "10:00" },
      { period: 4, startTime: "10:20", endTime: "11:00" },
      { period: 5, startTime: "11:00", endTime: "11:40" },
      { period: 6, startTime: "11:40", endTime: "12:20" },
    ];
    const DAY_OF_WEEK_COUNT = 5; // Mon-Fri
    if (teacherId) {
      const links = await prisma.subjectTeacher.findMany({
        where: { schoolId, teacherId },
        select: { subjectId: true, classArmId: true },
      });
      const byArm = new Map<string, string[]>();
      for (const link of links) {
        const list = byArm.get(link.classArmId) || [];
        list.push(link.subjectId);
        byArm.set(link.classArmId, list);
      }
      for (const [classArmId, subjectIds] of byArm.entries()) {
        let subjectIndex = 0;
        for (let day = 0; day < DAY_OF_WEEK_COUNT; day++) {
          for (const period of DEFAULT_PERIODS) {
            if (!subjectIds.length) break;
            const subjectId = subjectIds[subjectIndex % subjectIds.length];
            subjectIndex += 1;
            const existing = await prisma.timetableSlot.findUnique({
              where: {
                classArmId_dayOfWeek_period: {
                  classArmId,
                  dayOfWeek: day,
                  period: period.period,
                },
              },
              select: { id: true },
            });
            if (existing) continue;
            await prisma.timetableSlot.create({
              data: {
                schoolId,
                classArmId,
                subjectId,
                teacherId,
                dayOfWeek: day,
                period: period.period,
                startTime: period.startTime,
                endTime: period.endTime,
              } as any,
            });
            timetableSlotsCreated += 1;
          }
        }
      }
    }

    for (const cls of classRecords) {
      for (const subject of subjectRecords) {
        const topics = topicsFor(subject.name).slice(0, weekCount);
        const weeks = topics.map((topic, index) => ({
          week: index + 1,
          topic,
          isCompleted: false,
          completedAt: null,
        }));

        let scheme = await prisma.schemeOfWork.findFirst({
          where: {
            schoolId,
            subjectId: subject.id,
            classId: cls.id,
            session,
            term,
          },
        });

        if (!scheme) {
          scheme = await prisma.schemeOfWork.create({
            data: {
              schoolId,
              subjectId: subject.id,
              classId: cls.id,
              title: `${subject.name} Scheme of Work ${cls.name} ${session}`,
              session,
              term,
              weeks: weeks as any,
              periodsPerWeek: 2,
              minutesPerPeriod: 40,
            } as any,
          });
          schemesCreated += 1;
        }

        for (const week of weeks) {
          const existingNote = await prisma.lessonNote.findUnique({
            where: { schemeId_weekNumber: { schemeId: scheme.id, weekNumber: week.week } },
          });
          if (existingNote) continue;

          const content = sanitizeHtml(buildLessonNoteHtml({
            schoolName,
            subject: subject.name,
            classLevel: cls.name,
            topic: week.topic,
            weekNumber: week.week,
            session,
            term,
            teacherName: options.teacher?.fullName || "Class Teacher",
            periodsPerWeek: 2,
            minutesPerPeriod: 40,
          }));

          await prisma.lessonNote.create({
            data: {
              schemeId: scheme.id,
              weekNumber: week.week,
              topic: week.topic,
              content,
              exercises: buildExercises(subject.name, week.topic, cls.name) as any,
              assignments: buildAssignments(week.topic, subject.name) as any,
            },
          });
          notesCreated += 1;
        }
      }
    }

    return {
      school: { id: school.id, name: school.name },
      teacherId,
      classes: classRecords.map((c) => c.name),
      subjects: subjectRecords.map((s) => s.name),
      schemesCreated,
      notesCreated,
      timetableSlotsCreated,
      weeksPerScheme: weekCount,
      session,
      term,
    };
  }

  /**
   * Fill lesson notes for schemes that have week topics but missing notes.
   * Uses the same ChatGPT style template as bootstrap (no external AI needed).
   */
  async fillMissingLessonNotes(schoolId: string, options: { session?: string; term?: number; schoolName?: string; teacherName?: string; overwrite?: boolean } = {}) {
    const school = await prisma.school.findUnique({ where: { id: schoolId } });
    if (!school) throw new Error("School not found.");

    const session = options.session || "2025/2026";
    const term = options.term || 1;
    const schoolName = options.schoolName || school.name;
    const teacherName = options.teacherName || "Class Teacher";
    const overwrite = options.overwrite === true;

    const schemes = await prisma.schemeOfWork.findMany({
      where: { schoolId, session, term },
      include: {
        subject: { select: { name: true } },
        class: { select: { name: true } },
      },
    });

    let created = 0;
    let skipped = 0;
    let updated = 0;
    for (const scheme of schemes) {
      const weeks = (scheme.weeks as any[]) || [];
      for (const week of weeks) {
        const weekNumber = Number(week.week);
        const topic = String(week.topic || `Week ${weekNumber}`);
        if (!weekNumber || weekNumber < 1) continue;
        const existing = await prisma.lessonNote.findUnique({
          where: { schemeId_weekNumber: { schemeId: scheme.id, weekNumber } },
        });
        if (existing?.content && !overwrite) {
          skipped += 1;
          continue;
        }
        const wasExisting = Boolean(existing?.content);
        const isMidterm = weekNumber === 5;
        const rawContent = buildLessonNoteHtml({
          schoolName,
          subject: scheme.subject.name,
          classLevel: scheme.class.name,
          topic,
          weekNumber,
          session,
          term,
          teacherName,
          periodsPerWeek: (scheme as any).periodsPerWeek ?? 2,
          minutesPerPeriod: (scheme as any).minutesPerPeriod ?? 40,
        });
        let combined = rawContent;
        if (isMidterm) {
          combined = rawContent + "\n" + buildMidtermFocusHtml(scheme.subject.name, scheme.class.name, topic);
        }
        const content = sanitizeHtml(combined);
        const exercises = buildExercises(scheme.subject.name, topic, scheme.class.name);
        const assignments = buildAssignments(topic, scheme.subject.name);
        if (isMidterm) {
          exercises.push({
            question: "Midterm revision: answer five past questions from weeks 1 to 4.",
            answer: "Answers drawn from earlier lesson notes in this scheme.",
          });
          assignments.push({
            question: "Prepare for the midterm test for Week 5 in " + scheme.subject.name + ".",
          });
        }
        await prisma.lessonNote.upsert({
          where: { schemeId_weekNumber: { schemeId: scheme.id, weekNumber } },
          update: { topic, content, exercises: exercises as any, assignments: assignments as any },
          create: {
            schemeId: scheme.id,
            weekNumber,
            topic,
            content,
            exercises: exercises as any,
            assignments: assignments as any,
          },
        });
        if (wasExisting) {
          updated += 1;
        } else {
          created += 1;
        }
      }
    }

    return {
      schemes: schemes.length,
      notesCreated: created,
      notesUpdated: updated,
      notesExisting: skipped,
      session,
      term,
    };
  }

  /**
   * Import NAPPS style schemes and timetables for a school.
   */
  async importSchemesAndTimetables(schoolId: string, payload: {
    subjects?: string[];
    classes?: Array<{ name: string; arms?: string[] }>;
    schemes?: Array<{
      className: string;
      subjectName: string;
      title?: string;
      session?: string;
      term?: number;
      weeks: Array<{ week: number; topic: string; content?: string }>;
    }>;
    timetables?: Array<{
      className: string;
      dept?: string | null;
      slots: Array<{
        dayOfWeek: number;
        period: number;
        startTime: string;
        endTime: string;
        subjectName: string;
        room?: string;
      }>;
    }>;
    teacherEmail?: string;
  }) {
    const school = await prisma.school.findUnique({ where: { id: schoolId } });
    if (!school) throw new Error("School not found.");

    const prettyClass = (raw: string) => {
      const s = String(raw || "").toUpperCase().replace(/\s+/g, "");
      if (s.startsWith("JSS")) return `JSS ${s.slice(-1)}`;
      if (s.startsWith("SS")) return `SS ${s.slice(-1)}`;
      return raw;
    };

    const ensureSubject = async (name: string) => {
      const existing = await prisma.subject.findFirst({
        where: { schoolId, name: { equals: name, mode: "insensitive" } },
      });
      if (existing) return existing;
      return prisma.subject.create({
        data: {
          schoolId,
          name,
          shortCode: name.replace(/[^a-zA-Z ]/g, "").split(/\s+/).filter(Boolean).map((p) => p[0]).join("").slice(0, 5).toUpperCase() || name.slice(0, 4).toUpperCase(),
        },
      });
    };

    const ensureClass = async (name: string) => {
      const existing = await prisma.class.findFirst({
        where: { schoolId, name: { equals: name, mode: "insensitive" } },
      });
      if (existing) return existing;
      return prisma.class.create({ data: { schoolId, name } });
    };

    const ensureArm = async (classId: string, armName: string, teacherId?: string | null) => {
      const existing = await prisma.classArm.findFirst({ where: { classId, name: armName } });
      if (existing) return existing;
      return prisma.classArm.create({
        data: { classId, name: armName, classTeacherId: teacherId || null },
      });
    };

    let teacher = null as any;
    if (payload.teacherEmail) {
      teacher = await prisma.user.findUnique({ where: { email: payload.teacherEmail } });
      if (teacher && teacher.schoolId !== schoolId) teacher = null;
    }

    const subjectMap = new Map<string, any>();
    for (const raw of payload.subjects || []) {
      const subj = await ensureSubject(raw);
      subjectMap.set(raw, subj);
      subjectMap.set(raw.toLowerCase(), subj);
    }

    const classMap = new Map<string, any>();
    for (const c of payload.classes || []) {
      const cls = await ensureClass(c.name);
      classMap.set(c.name, cls);
      for (const armName of c.arms || ["A"]) {
        await ensureArm(cls.id, armName, teacher?.id);
      }
    }
    // Ensure SS 1-3 with department arms even if not listed
    for (const name of ["SS 1", "SS 2", "SS 3", "JSS 1", "JSS 2", "JSS 3"]) {
      if (!classMap.has(name)) {
        const cls = await ensureClass(name);
        classMap.set(name, cls);
        if (name.startsWith("SS")) {
          for (const armName of ["ART", "SCIENCE", "COMMERCIAL"]) {
            await ensureArm(cls.id, armName, teacher?.id);
          }
        } else {
          await ensureArm(cls.id, "A", teacher?.id);
        }
      }
    }

    let schemesCreated = 0;
    let schemesUpdated = 0;
    for (const s of payload.schemes || []) {
      const className = prettyClass(s.className);
      const subjectName = s.subjectName;
      const cls = classMap.get(className) || (await ensureClass(className));
      classMap.set(className, cls);
      let subj = subjectMap.get(subjectName);
      if (!subj) {
        subj = await ensureSubject(subjectName);
        subjectMap.set(subjectName, subj);
      }
      const session = s.session || "2025/2026";
      const term = s.term || 1;
      const weeks = (s.weeks || []).slice(0, 12).map((w) => ({
        week: Number(w.week),
        topic: String(w.topic || `Week ${w.week}`),
        isCompleted: false,
      }));
      if (!weeks.length) continue;

      let scheme = await prisma.schemeOfWork.findFirst({
        where: { schoolId, subjectId: subj.id, classId: cls.id, session, term },
      });
      if (!scheme) {
        scheme = await prisma.schemeOfWork.create({
          data: {
            schoolId,
            subjectId: subj.id,
            classId: cls.id,
            title: s.title || `${subjectName} Scheme of Work ${className} ${session}`,
            session,
            term,
            weeks: weeks as any,
            periodsPerWeek: 2,
            minutesPerPeriod: 40,
          } as any,
        });
        schemesCreated += 1;
      } else {
        await prisma.schemeOfWork.update({
          where: { id: scheme.id },
          data: { weeks: weeks as any, title: s.title || scheme.title },
        });
        schemesUpdated += 1;
      }
    }

    let slotsSaved = 0;
    let slotsFailed = 0;
    for (const t of payload.timetables || []) {
      const className = prettyClass(t.className);
      const cls = classMap.get(className) || (await ensureClass(className));
      classMap.set(className, cls);
      let armName = t.dept || "A";
      let arm = await prisma.classArm.findFirst({ where: { classId: cls.id, name: armName } });
      if (!arm) arm = await ensureArm(cls.id, armName, teacher?.id);
      for (const slot of t.slots || []) {
        let subj = subjectMap.get(slot.subjectName);
        if (!subj) {
          subj = await ensureSubject(slot.subjectName);
          subjectMap.set(slot.subjectName, subj);
        }
        try {
          await prisma.timetableSlot.upsert({
            where: {
              classArmId_dayOfWeek_period: {
                classArmId: arm.id,
                dayOfWeek: slot.dayOfWeek,
                period: slot.period,
              },
            },
            update: {
              subjectId: subj.id,
              teacherId: teacher?.id || null,
              startTime: slot.startTime,
              endTime: slot.endTime,
              room: slot.room || null,
            },
            create: {
              schoolId,
              classArmId: arm.id,
              subjectId: subj.id,
              teacherId: teacher?.id || null,
              dayOfWeek: slot.dayOfWeek,
              period: slot.period,
              startTime: slot.startTime,
              endTime: slot.endTime,
              room: slot.room || null,
            } as any,
          });
          slotsSaved += 1;
        } catch {
          slotsFailed += 1;
        }
      }
    }

    // Fill notes for imported schemes
    const notes = await this.fillMissingLessonNotes(schoolId, {
      schoolName: school.name,
      teacherName: teacher?.fullName || "Class Teacher",
    });

    return {
      school: { id: school.id, name: school.name },
      subjects: subjectMap.size,
      classes: classMap.size,
      schemesCreated,
      schemesUpdated,
      slotsSaved,
      slotsFailed,
      lessonNotes: notes,
      teacher: teacher ? { id: teacher.id, email: teacher.email } : null,
    };
  }

  /**
   * Superadmin generate invite codes for any school.
   */
  async generateSchoolInvites(schoolId: string, options: { count?: number; role?: string; createdBy?: string }) {
    const school = await prisma.school.findUnique({ where: { id: schoolId } });
    if (!school) throw new Error("School not found.");
    const count = Math.min(Math.max(options.count || 1, 1), 50);
    const role = options.role || "TEACHER";
    const validRoles = ["TEACHER", "BURSAR", "PRINCIPAL", "STUDENT", "PARENT"];
    if (!validRoles.includes(role)) throw new Error("Invalid invite role.");

    const codes = [];
    for (let i = 0; i < count; i++) {
      // 128-bit entropy for invite codes
      const raw = crypto.randomBytes(16).toString("hex").toUpperCase().slice(0, 32);
      const code = `SH-${raw}`;
      const invite = await prisma.schoolInvite.create({
        data: {
          schoolId,
          code,
          role: role as any,
          createdBy: options.createdBy || null,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });
      codes.push({ code: invite.code, role: invite.role, expiresAt: invite.expiresAt, schoolId });
    }
    return codes;
  }

  async listSchoolInvites(schoolId: string) {
    const school = await prisma.school.findUnique({ where: { id: schoolId } });
    if (!school) throw new Error("School not found.");
    const invites = await prisma.schoolInvite.findMany({
      where: { schoolId },
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        role: true,
        used: true,
        usedAt: true,
        expiresAt: true,
        createdAt: true,
        code: true,
      },
    });
    // Superadmin platform listing keeps full codes; mask elsewhere is handled by caller roles.
    return invites;
  }

  /**
   * Superadmin audit log listing.
   */
  async listAuditLogs(params: {
    page?: number;
    limit?: number;
    action?: string;
    userId?: string;
    schoolId?: string;
    result?: string;
  }) {
    const page = Math.max(params.page || 1, 1);
    const limit = Math.min(Math.max(params.limit || 25, 1), 100);
    const skip = (page - 1) * limit;

    const where: any = {};
    if (params.action) where.action = { contains: params.action, mode: "insensitive" };
    if (params.userId) where.userId = params.userId;
    if (params.schoolId) where.schoolId = params.schoolId;
    if (params.result) where.result = params.result;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        select: {
          id: true,
          userId: true,
          schoolId: true,
          action: true,
          resource: true,
          resourceId: true,
          method: true,
          path: true,
          ipAddress: true,
          userAgent: true,
          result: true,
          errorMessage: true,
          oldValues: true,
          newValues: true,
          metadata: true,
          createdAt: true,
        },
      }),
      prisma.auditLog.count({ where }),
    ]);

    const userIds = [...new Set(logs.map((l) => l.userId).filter(Boolean))] as string[];
    const users = userIds.length
      ? await prisma.user.findMany({
          where: { id: { in: userIds } },
          select: { id: true, fullName: true, email: true },
        })
      : [];
    const userMap = new Map(users.map((u) => [u.id, u]));

    const data = logs.map((log) => {
      const user = log.userId ? userMap.get(log.userId) : null;
      const success = log.metadata && typeof log.metadata === "object"
        ? Boolean((log.metadata as any).success)
        : log.result !== "failure";
      return {
        id: log.id,
        timestamp: log.createdAt,
        userId: log.userId || "",
        userName: user?.fullName || user?.email || "System",
        action: log.action,
        resource: log.resource,
        resourceId: log.resourceId || "",
        ipAddress: log.ipAddress || "",
        result: success ? "success" : "failure",
        method: log.method || "",
        path: log.path || "",
        schoolId: log.schoolId || null,
        oldValues: log.oldValues,
        newValues: log.newValues,
        errorMessage: log.errorMessage || null,
        metadata: log.metadata,
      };
    });

    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }
}

export const platformService = new PlatformService();
