import { Request, Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../types";
import { prisma } from "../lib/prisma";

/**
 * Tenant Isolation Middleware
 *
 * Automatically scopes all database queries to the user's school.
 * SUPER_ADMIN does not get a silent global tenantId: school scoped handlers
 * require an explicit target schoolId (query or body) that is validated as
 * an existing school. Never fall back to req.user.schoolId for SUPER_ADMIN.
 *
 * Attaches `tenantId` to the request for use in services.
 */
export async function tenantIsolation(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: "Authentication required." });
    return;
  }

  if (req.user.role === "SUPER_ADMIN") {
    const explicitSchoolId =
      (typeof req.query.schoolId === "string" && req.query.schoolId) ||
      (typeof req.body?.schoolId === "string" && req.body.schoolId) ||
      null;

    if (!explicitSchoolId) {
      // Explicit cross-tenant mode required; no silent global tenant.
      req.tenantId = null;
      return next();
    }

    const school = await prisma.school.findUnique({
      where: { id: explicitSchoolId },
      select: { id: true },
    });
    if (!school) {
      res.status(404).json({ error: "Target school not found." });
      return;
    }
    req.tenantId = school.id;
    return next();
  }

  if (!req.user.schoolId) {
    res.status(403).json({ error: "No school association. Contact support." });
    return;
  }

  req.tenantId = req.user.schoolId;
  next();
}
