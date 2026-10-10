import { prisma } from "../lib/prisma";
import { NotFoundError, BadRequestError, ForbiddenError } from "../utils/errors";

export class NoticeService {
  /**
   * List notices for a school, optionally filtered by target.
   */
  async list(schoolId: string, targetType?: string, targetId?: string) {
    const where: any = { schoolId };
    if (targetType) where.targetType = targetType;
    if (targetId) where.targetId = targetId;

    return prisma.notice.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 50,
    });
  }

  /**
   * Create a new notice.
   */
  async create(data: {
    schoolId: string;
    title: string;
    body: string;
    attachmentUrl?: string;
    targetType?: string;
    targetId?: string;
    publishNow?: boolean;
  }) {
    if (!data.title.trim()) {
      throw new BadRequestError("Notice title is required.");
    }
    if (!data.body.trim()) {
      throw new BadRequestError("Notice body is required.");
    }

    const school = await prisma.school.findUnique({ where: { id: data.schoolId } });
    if (!school) throw new NotFoundError("School");

    return prisma.notice.create({
      data: {
        schoolId: data.schoolId,
        title: data.title,
        body: data.body,
        attachmentUrl: data.attachmentUrl || null,
        targetType: (data.targetType as any) || "ALL",
        targetId: data.targetId || null,
        publishedAt: data.publishNow ? new Date() : null,
      },
    });
  }

  /**
   * Publish a notice immediately.
   */
  async publish(id: string, schoolId: string) {
    const notice = await prisma.notice.findUnique({ where: { id } });
    if (!notice) throw new NotFoundError("Notice");
    if (notice.schoolId !== schoolId) throw new ForbiddenError("Access denied.");

    const updated = await prisma.notice.update({
      where: { id },
      data: { publishedAt: new Date() },
    });

    // Broadcast notification to the school topic
    const { ntfyService } = await import("./ntfy.service");
    ntfyService.sendNotification(
      `sh_${notice.schoolId}`,
      `New Announcement: ${notice.title}`,
      notice.body.substring(0, 100) + (notice.body.length > 100 ? "..." : ""),
      "loudspeaker"
    ).catch(console.error);

    return updated;
  }

  /**
   * Delete a notice.
   */
  async delete(id: string, schoolId: string) {
    const notice = await prisma.notice.findUnique({ where: { id } });
    if (!notice) throw new NotFoundError("Notice");
    if (notice.schoolId !== schoolId) throw new ForbiddenError("Access denied.");

    await prisma.notice.delete({ where: { id } });
    return { success: true };
  }
}

export const noticeService = new NoticeService();
