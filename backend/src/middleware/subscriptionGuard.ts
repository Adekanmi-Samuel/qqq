import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../types";
import { prisma } from "../lib/prisma";

type ResourceType = "student" | "staff";

/** Default limits used when the school has no linked plan. */
const DEFAULT_PLAN_LIMITS: Record<string, { maxStudents: number; maxStaff: number }> = {
  FREE: { maxStudents: 50, maxStaff: 10 },
  BASIC: { maxStudents: 200, maxStaff: 25 },
  PREMIUM: { maxStudents: 500, maxStaff: 50 },
  ENTERPRISE: { maxStudents: 99999, maxStaff: 500 },
};

/**
 * Subscription Guard Middleware
 *
 * Checks if the school has reached its plan limit for a resource type.
 * Limits are read from the school's linked SubscriptionPlan record (via subscriptionPlanId).
 * Falls back to DEFAULT_PLAN_LIMITS by planType if no plan is linked.
 * Must be used AFTER authenticate + tenantIsolation middleware.
 */
export function subscriptionGuard(resourceType: ResourceType) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    const schoolId = req.tenantId || req.user?.schoolId;
    if (!schoolId) {
      res.status(403).json({ success: false, error: "No school association." });
      return;
    }

    // SUPER_ADMIN bypasses limits
    if (req.user?.role === "SUPER_ADMIN") {
      next();
      return;
    }

    try {
      const school = await prisma.school.findUnique({
        where: { id: schoolId },
        select: {
          planType: true,
          subscriptionPlanId: true,
          subscriptionPlan: {
            select: { maxStudents: true, maxStaff: true },
          },
        },
      });

      if (!school) {
        res.status(404).json({ success: false, error: "School not found." });
        return;
      }

      // Prefer limits from linked plan record, fall back to defaults by planType
      let maxStudents: number;
      let maxStaff: number;

      if (school.subscriptionPlanId && school.subscriptionPlan) {
        // Use limits from the actual SubscriptionPlan record
        maxStudents = school.subscriptionPlan.maxStudents ?? DEFAULT_PLAN_LIMITS.ENTERPRISE.maxStudents;
        maxStaff = school.subscriptionPlan.maxStaff ?? DEFAULT_PLAN_LIMITS.ENTERPRISE.maxStaff;
      } else {
        // Fall back to defaults by planType
        const defaults = DEFAULT_PLAN_LIMITS[school.planType] || DEFAULT_PLAN_LIMITS.FREE;
        maxStudents = defaults.maxStudents;
        maxStaff = defaults.maxStaff;
      }

      if (resourceType === "student") {
        const count = await prisma.student.count({ where: { schoolId, active: true } });
        if (count >= maxStudents) {
          res.status(403).json({
            success: false,
            error: `Student limit reached (${maxStudents}). Please upgrade your plan to add more students.`,
          });
          return;
        }
      } else if (resourceType === "staff") {
        const count = await prisma.user.count({
          where: { schoolId, role: { not: "SUPER_ADMIN" }, active: true },
        });
        if (count >= maxStaff) {
          res.status(403).json({
            success: false,
            error: `Staff limit reached (${maxStaff}). Please upgrade your plan to add more staff.`,
          });
          return;
        }
      }

      next();
    } catch (error) {
      console.error("[subscriptionGuard] Error verifying limits:", error);
      res.status(500).json({ success: false, error: "Failed to verify subscription limits." });
    }
  };
}
