import { Router } from "express";
import { prisma } from "../lib/prisma";
import { sendSuccess, sendError } from "../utils/response";

const router = Router();

/**
 * GET /api/reviews/public
 * Approved school reviews for marketing pages.
 * Public. No auth. No unpublished data.
 */
router.get("/public", async (req, res) => {
  try {
    const reviews = await prisma.schoolReview.findMany({
      where: { status: "APPROVED" },
      orderBy: { createdAt: "desc" },
      take: 12,
      select: {
        id: true,
        rating: true,
        quote: true,
        authorName: true,
        authorRole: true,
        schoolName: true,
        state: true,
        createdAt: true,
      },
    });
    sendSuccess(res, reviews);
  } catch (error: any) {
    // Marketing page must not hard fail if table is missing in some envs.
    console.error("[reviews/public]", error?.message || error);
    sendSuccess(res, []);
  }
});

export default router;
