import { prisma } from "../lib/prisma";
import { NotFoundError, BadRequestError, ForbiddenError } from "../utils/errors";
import { generateUniqueSlug } from "../utils/slug";
import { JwtPayload } from "../types";

export class SchoolService {
  /**
   * Get all schools (admin overview).
   * SCHOOL_ADMIN only sees their own school; SUPER_ADMIN sees all.
   */
  async listAll(actor?: { role: string; schoolId?: string | null }) {
    const where =
      actor && actor.role === "SUPER_ADMIN"
        ? {}
        : actor?.schoolId
          ? { id: actor.schoolId }
          : { id: "__none__" };

    return prisma.school.findMany({
      where,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        slug: true,
        schoolType: true,
        ownershipType: true,
        state: true,
        lga: true,
        verified: true,
        createdAt: true,
        _count: { select: { students: true, users: true } },
      },
    });
  }

  /**
   * Get school by slug (public profile).
   */
  async getBySlug(slug: string) {
    const school = await prisma.school.findUnique({
      where: { slug },
      include: {
        _count: { select: { students: true } },
        classes: {
          include: {
            arms: {
              include: { _count: { select: { students: true } } },
            },
          },
        },
        notices: {
          where: { publishedAt: { not: null } },
          orderBy: { publishedAt: "desc" },
          take: 10,
        },
      },
    });

    if (!school) {
      throw new NotFoundError("School");
    }

    return school;
  }

  /**
   * Update school profile.
   */
  async update(id: string, data: {
    name?: string;
    address?: string;
    phone?: string;
    email?: string;
    logoUrl?: string;
    description?: string;
    state?: string;
    lga?: string;
    motto?: string;
    website?: string;
    schoolType?: any;
  }, actor: JwtPayload) {
    const school = await prisma.school.findUnique({ where: { id } });
    if (!school) {
      throw new NotFoundError("School");
    }

    if (actor.role !== "SUPER_ADMIN" && actor.schoolId !== id) {
      throw new ForbiddenError("You can only update your own school profile.");
    }

    // Whitelist allowed fields — never pass raw request bodies into prisma
    const allowed = {
      name: data.name,
      address: data.address,
      phone: data.phone,
      email: data.email,
      logoUrl: data.logoUrl,
      description: data.description,
      state: data.state,
      lga: data.lga,
      motto: data.motto,
      website: data.website,
      schoolType: data.schoolType,
    } as Record<string, unknown>;

    const updateData: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(allowed)) {
      if (value !== undefined) updateData[key] = value;
    }

    return prisma.school.update({
      where: { id },
      data: updateData as any,
    });
  }

  /**
   * Verify a school (super admin only).
   */
  async verify(schoolId: string) {
    const school = await prisma.school.findUnique({ where: { id: schoolId } });
    if (!school) {
      throw new NotFoundError("School");
    }

    if (school.verified) {
      throw new BadRequestError("This school is already verified.");
    }

    return prisma.school.update({
      where: { id: schoolId },
      data: { verified: true, verifiedAt: new Date() },
    });
  }

  /**
   * Create a new school (used during registration).
   */
  async create(data: {
    name: string;
    schoolType: string;
    ownershipType: string;
    state: string;
    lga: string;
    address: string;
    email: string;
    phone: string;
    cacNumber?: string;
  }) {
    const slug = await generateUniqueSlug(data.name, async (s) => {
      const existing = await prisma.school.findUnique({ where: { slug: s } });
      return !!existing;
    });

    return prisma.school.create({
      data: {
        ...data,
        slug,
        schoolType: data.schoolType as any,
        ownershipType: data.ownershipType as any,
      },
    });
  }

  /**
   * Get current academic session/calendar for a school
   */
  async getCurrentSession(schoolId: string) {
    const calendar = await prisma.academicCalendar.findFirst({
      where: { schoolId, isCurrent: true },
    });
    
    if (!calendar) {
      throw new NotFoundError("Current academic session");
    }
    
    return calendar;
  }
}

export const schoolService = new SchoolService();
