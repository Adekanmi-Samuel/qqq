import { Router, Response } from "express";
import { prisma } from "../lib/prisma";
import { AuthenticatedRequest } from "../types";

const router = Router();

// GET /api/users?role=TEACHER
// NOTE: This route is already protected by authenticate + tenantIsolation
// middleware in index.ts, so we use req.user.schoolId for tenant scoping.
router.get("/", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const schoolId = req.user?.schoolId;
    if (!schoolId) {
      res.status(403).json({ success: false, error: "No school association." });
      return;
    }

    const { role } = req.query;
    const where: any = { schoolId };
    if (role) where.role = role as string;

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        active: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 200, // Limit results to prevent abuse
    });

    res.json({ success: true, data: users });
  } catch (error: any) {
    res.status(500).json({ success: false, error: "Failed to fetch users." });
  }
});

export default router;
