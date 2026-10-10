import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";
import { ConflictError } from "../utils/errors";
import { generateSlug } from "../utils/slug";

/**
 * Sensible 2025/2026 academic calendar fallbacks when the client omits term dates.
 * Nigerian school year pattern: first term starts September, third term ends July.
 */
const DEFAULT_TERM_DATES: Record<number, { start: string; end: string; resumption: string }> = {
  1: { start: "2025-09-08", end: "2025-12-12", resumption: "2025-09-08" },
  2: { start: "2026-01-12", end: "2026-04-02", resumption: "2026-01-12" },
  3: { start: "2026-04-27", end: "2026-07-17", resumption: "2026-04-27" },
};

function isValidDate(value: string | undefined | null): value is string {
  return typeof value === "string" && value.trim() !== "" && !Number.isNaN(new Date(value).getTime());
}

/**
 * Parse a term date; fall back to the default 2025/2026 slot for that term number
 * when the value is empty or invalid (avoids Invalid Date / Prisma failures).
 */
function parseTermDate(
  value: string | undefined | null,
  termNumber: number,
  kind: "start" | "end" | "resumption"
): Date {
  const defaults = DEFAULT_TERM_DATES[termNumber] || DEFAULT_TERM_DATES[1];
  if (isValidDate(value)) {
    return new Date(value);
  }
  if (kind === "end") {
    return new Date(defaults.end);
  }
  if (kind === "resumption") {
    return new Date(defaults.resumption);
  }
  return new Date(defaults.start);
}

export class OnboardingService {
  /**
   * Full 5-step onboarding registration.
   * Creates school, admin user, academic calendar(s), classes, and onboarding progress.
   * Auth cookies are set by the controller after this succeeds.
   */
  async onboard(data: any) {
    const slug = generateSlug(data.schoolName);

    // Check duplicate email
    const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
    if (existingUser) {
      throw new ConflictError("An account with this email already exists.");
    }

    // Check duplicate school slug
    const existingSchool = await prisma.school.findUnique({ where: { slug } });
    if (existingSchool) {
      throw new ConflictError("A school with this name is already registered.");
    }

    const passwordHash = await bcrypt.hash(data.password, 12);

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create school
      const school = await tx.school.create({
        data: {
          name: data.schoolName,
          slug,
          cacNumber: data.cacNumber || null,
          schoolType: data.schoolType as any,
          ownershipType: data.ownershipType as any,
          state: data.state,
          lga: data.lga,
          address: data.address,
          email: data.schoolEmail || data.email,
          phone: data.schoolPhone || data.phone,
          motto: data.schoolMotto || data.motto || null,
          website: data.websiteUrl || data.website || null,
          logoUrl: data.schoolLogoUrl || data.logoUrl || null,
          planType: "FREE",
          status: "PENDING_VERIFICATION",
        },
      });

      // 2. Create admin user
      const user = await tx.user.create({
        data: {
          schoolId: school.id,
          fullName: data.adminFullName || "School Admin",
          email: data.email,
          passwordHash,
          role: "SCHOOL_ADMIN",
        },
        select: {
          id: true, fullName: true, email: true, role: true, schoolId: true,
        },
      });

      // 3. Create academic calendar entries (empty dates fall back to 2025/2026 defaults)
      if (data.terms && Array.isArray(data.terms)) {
        for (const term of data.terms) {
          const termNumber = Number(term.termNumber) || 1;
          const defaults = DEFAULT_TERM_DATES[termNumber] || DEFAULT_TERM_DATES[1];

          await tx.academicCalendar.create({
            data: {
              schoolId: school.id,
              academicYear: data.academicYear || "2025/2026",
              term: termNumber,
              termName: term.termName,
              startDate: parseTermDate(term.startDate, termNumber, "start"),
              endDate: parseTermDate(term.endDate, termNumber, "end"),
              resumptionDate: term.resumptionDate
                ? parseTermDate(term.resumptionDate, termNumber, "resumption")
                : new Date(defaults.resumption),
              isCurrent: termNumber === 1,
            },
          });
        }
      }

      // 4. Create classes
      const classLevels = data.selectedLevels as string[];
      const classNames: string[] = [];

      for (const level of classLevels) {
        const up = String(level || "").toUpperCase().replace(/\s+/g, "");
        if (up === "CRECHE") {
          classNames.push("Creche");
        } else if (up === "KG" || up === "KINDERGARTEN") {
          for (let i = 1; i <= 3; i++) classNames.push(`KG ${i}`);
        } else if (up === "NURSERY") {
          for (let i = 1; i <= 3; i++) classNames.push(`Nursery ${i}`);
        } else if (up === "PRIMARY") {
          for (let i = 1; i <= 6; i++) classNames.push(`Primary ${i}`);
        } else if (up === "JSS") {
          for (let i = 1; i <= 3; i++) classNames.push(`JSS ${i}`);
        } else if (up === "SS") {
          for (let i = 1; i <= 3; i++) classNames.push(`SS ${i}`);
        } else if (/^KG[123]$/.test(up)) {
          classNames.push(`KG ${up.slice(-1)}`);
        } else if (/^NURSERY[123]$/.test(up)) {
          classNames.push(`Nursery ${up.slice(-1)}`);
        } else if (/^PRIMARY[1-6]$/.test(up)) {
          classNames.push(`Primary ${up.slice(-1)}`);
        } else if (/^JSS[123]$/.test(up)) {
          classNames.push(`JSS ${up.slice(-1)}`);
        } else if (/^SS[123]$/.test(up)) {
          classNames.push(`SS ${up.slice(-1)}`);
        }
      }

      // Add custom classes
      if (data.customClasses && Array.isArray(data.customClasses)) {
        classNames.push(...data.customClasses);
      }

      for (const name of classNames) {
        await tx.class.create({
          data: {
            schoolId: school.id,
            name,
          },
        });
      }

      // 5. Create onboarding progress record
      await tx.onboardingProgress.create({
        data: {
          schoolId: school.id,
          currentStep: 4,
          completed: true,
          step1Data: {
            schoolName: data.schoolName,
            schoolType: data.schoolType,
            ownershipType: data.ownershipType,
            state: data.state,
            lga: data.lga,
            address: data.address,
          },
          step2Data: { email: data.email, phone: data.phone, adminName: data.adminFullName },
          step3Data: { academicYear: data.academicYear, terms: data.terms },
          step4Data: { levels: data.selectedLevels, caPercentage: data.caPercentage, examPercentage: data.examPercentage, passMark: data.passMark },
        },
      });

      return { school, user };
    });

    // Session cookies are created by the controller (sessionService + authService.setAuthCookies)
    return {
      user: result.user,
      school: {
        id: result.school.id,
        name: result.school.name,
        slug: result.school.slug,
        verified: result.school.verified,
        status: result.school.status,
        planType: result.school.planType,
      },
    };
  }
}

export const onboardingService = new OnboardingService();
