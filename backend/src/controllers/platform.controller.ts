import { Response } from "express";
import { platformService } from "../services/platform.service";
import { AuthenticatedRequest } from "../types";
import { sendSuccess, sendError } from "../utils/response";
import { prisma } from "../lib/prisma";

export class PlatformController {
  private handle(req: AuthenticatedRequest, res: Response, fn: () => Promise<any>) {
    return fn().then((data) => {
      if (data && typeof data === "object" && "data" in data && "meta" in data) {
        res.json({ success: true, data: data.data, meta: data.meta });
        return;
      }
      res.json({ success: true, data });
    }).catch((error: any) => {
      console.error("[platform] action failed:", error?.message || error);
      // Never leak Prisma/validation internals to clients.
      const status = error.message?.includes("not found") ? 404 : 400;
      const clientMsg =
        error.statusCode && error.message
          ? error.message
          : "Platform action failed. Please check the request and try again.";
      res.status(status).json({ success: false, error: clientMsg });
    });
  }

  async getStats(_req: AuthenticatedRequest, res: Response) {
    try {
      const stats = await platformService.getStats();
      res.json({ success: true, data: stats });
    } catch {
      res.status(500).json({ success: false, error: "Failed to fetch platform stats." });
    }
  }

  async listSchools(req: AuthenticatedRequest, res: Response) {
    try {
      const { page, limit, search, status, planType } = req.query as Record<string, string | undefined>;
      const result = await platformService.listSchools({
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
        search,
        status,
        planType,
      });
      res.json({ success: true, data: result.data, meta: result.meta });
    } catch (error: any) {
      console.error("[platform] listSchools failed:", error?.message || error);
      res.status(500).json({ success: false, error: "Failed to fetch schools." });
    }
  }

  async getSchool(req: AuthenticatedRequest, res: Response) {
    try {
      const school = await platformService.getSchool(req.params.id as string);
      res.json({ success: true, data: school });
    } catch (error: any) {
      console.error("[platform] getSchool failed:", error?.message || error);
      const status = error.message?.includes("not found") ? 404 : 500;
      res.status(status).json({ success: false, error: error.message?.includes("not found") ? error.message : "Failed to fetch school." });
    }
  }

  async createSchool(req: AuthenticatedRequest, res: Response) {
    try {
      const result = await platformService.createSchool(req.body);
      res.status(201).json({ success: true, message: "School created.", data: result });
    } catch (error: any) {
      console.error("[platform] createSchool failed:", error?.message || error);
      res.status(400).json({ success: false, error: error.message?.includes("exists") ? error.message : "Failed to create school." });
    }
  }

  async updateSchool(req: AuthenticatedRequest, res: Response) {
    try {
      const school = await platformService.updateSchool(req.params.id as string, req.body);
      res.json({ success: true, message: "School updated.", data: school });
    } catch (error: any) {
      console.error("[platform] updateSchool failed:", error?.message || error);
      res.status(400).json({ success: false, error: error.message || "Failed to update school." });
    }
  }

  async listUsers(req: AuthenticatedRequest, res: Response) {
    try {
      const { page, limit, search, role, schoolId, active } = req.query as Record<string, string | undefined>;
      const result = await platformService.listUsers({
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
        search,
        role,
        schoolId,
        active: active === undefined || active === "" ? undefined : active === "true",
      });
      res.json({ success: true, data: result.data, meta: result.meta });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message || "Failed to fetch users." });
    }
  }

  async createUser(req: AuthenticatedRequest, res: Response) {
    try {
      const user = await platformService.createUser(req.body);
      res.status(201).json({ success: true, message: "User created.", data: user });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message || "Failed to create user." });
    }
  }

  async updateUser(req: AuthenticatedRequest, res: Response) {
    try {
      const user = await platformService.updateUser(req.params.id as string, req.body);
      res.json({ success: true, message: "User updated.", data: user });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message || "Failed to update user." });
    }
  }

  async setUserPassword(req: AuthenticatedRequest, res: Response) {
    try {
      const { password } = req.body;
      const strong = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
      if (!password || !strong.test(password)) {
        return res.status(400).json({
          success: false,
          error: "Password must be at least 8 characters with uppercase, lowercase, and a number.",
        });
      }
      const result = await platformService.setUserPassword(req.params.id as string, password);
      res.json({ success: true, message: result.message, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message || "Failed to set password." });
    }
  }

  async deleteUser(req: AuthenticatedRequest, res: Response) {
    try {
      const result = await platformService.deleteUser(req.params.id as string);
      res.json({ success: true, message: result.message });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message || "Failed to delete user." });
    }
  }

  async impersonate(req: AuthenticatedRequest, res: Response) {
    try {
      const targetUserId = req.body?.userId || req.params.userId;
      if (!targetUserId) {
        return res.status(400).json({ success: false, error: "userId is required." });
      }
      const result = await platformService.impersonate(
        targetUserId,
        res,
        req.deviceId || "unknown",
        (req.headers["user-agent"] as string) || "unknown",
        req.ip || "unknown",
        { userId: req.user?.userId, role: req.user?.role }
      );
      res.json({ success: true, message: "Signed in as selected user.", data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message || "Impersonation failed." });
    }
  }

  async bootstrapCurriculum(req: AuthenticatedRequest, res: Response) {
    try {
      const schoolId = req.params.id || req.body?.schoolId;
      if (!schoolId) {
        return res.status(400).json({ success: false, error: "schoolId is required." });
      }
      const result = await platformService.bootstrapSchoolCurriculum(schoolId, {
        classes: req.body?.classes,
        levels: req.body?.levels,
        subjects: req.body?.subjects,
        teacher: req.body?.teacher,
        session: req.body?.session,
        term: req.body?.term,
        weeks: req.body?.weeks,
        schoolName: req.body?.schoolName,
      });
      res.status(201).json({ success: true, message: "Curriculum ready.", data: result });
    } catch (error: any) {
      console.error("[platform] bootstrapCurriculum failed:", error?.message || error);
      res.status(400).json({ success: false, error: error.message || "Failed to bootstrap curriculum." });
    }
  }

  async fillLessonNotes(req: AuthenticatedRequest, res: Response) {
    try {
      // Prefer path param so platform ops stay on the school in the URL.
      const schoolId = req.params.id || req.body?.schoolId;
      if (!schoolId) {
        return res.status(400).json({ success: false, error: "schoolId is required." });
      }
      const result = await platformService.fillMissingLessonNotes(schoolId, {
        session: req.body?.session,
        term: req.body?.term,
        schoolName: req.body?.schoolName,
        teacherName: req.body?.teacherName,
        // Only overwrite when explicitly requested.
        overwrite: req.body?.overwrite === true,
      });
      res.json({ success: true, message: "Lesson notes filled.", data: result });
    } catch (error: any) {
      console.error("[platform] fillLessonNotes failed:", error?.message || error);
      res.status(400).json({ success: false, error: error.message || "Failed to fill lesson notes." });
    }
  }

  async listAuditLogs(req: AuthenticatedRequest, res: Response) {
    try {
      const { page, limit, action, resource, schoolId, result } = req.query as Record<string, string | undefined>;
      const pageNum = Math.max(1, Number(page) || 1);
      const limitNum = Math.min(200, Math.max(1, Number(limit) || 50));
      const where: any = {};
      if (action) where.action = { contains: action, mode: "insensitive" };
      if (resource) where.resource = { contains: resource, mode: "insensitive" };
      if (schoolId) where.schoolId = schoolId;
      if (result === "success" || result === "failure") where.result = result;

      const [total, logs] = await Promise.all([
        prisma.auditLog.count({ where }),
        prisma.auditLog.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip: (pageNum - 1) * limitNum,
          take: limitNum,
        }),
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

      res.json({
        success: true,
        data,
        meta: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.max(1, Math.ceil(total / limitNum)),
        },
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message || "Failed to fetch audit logs." });
    }
  }

  async importSchemesAndTimetables(req: AuthenticatedRequest, res: Response) {
    try {
      const schoolId = req.params.id || req.body?.schoolId;
      if (!schoolId) {
        return res.status(400).json({ success: false, error: "schoolId is required." });
      }
      const result = await platformService.importSchemesAndTimetables(schoolId, req.body || {});
      res.json({ success: true, message: "Import complete.", data: result });
    } catch (error: any) {
      console.error("[platform] importCurriculum failed:", error?.message || error);
      res.status(400).json({ success: false, error: error.message || "Import failed." });
    }
  }

  async generateSchoolInvites(req: AuthenticatedRequest, res: Response) {
    try {
      const schoolId = req.params.id as string;
      const data = await platformService.generateSchoolInvites(schoolId, {
        count: req.body?.count,
        role: req.body?.role,
        createdBy: req.user?.userId,
      });
      res.status(201).json({ success: true, message: "Invite codes created.", data });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message || "Failed to generate invites." });
    }
  }

  async listSchoolInvites(req: AuthenticatedRequest, res: Response) {
    try {
      const data = await platformService.listSchoolInvites(req.params.id as string);
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message || "Failed to list invites." });
    }
  }

  async listPlans(_req: AuthenticatedRequest, res: Response) {
    try {
      const plans = await platformService.listPlans();
      res.json({ success: true, data: plans });
    } catch {
      res.status(500).json({ success: false, error: "Failed to fetch plans." });
    }
  }

  async createPlan(req: AuthenticatedRequest, res: Response) {
    try {
      const plan = await platformService.createPlan(req.body);
      res.status(201).json({ success: true, message: "Plan created.", data: plan });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message || "Failed to create plan." });
    }
  }

  async updatePlan(req: AuthenticatedRequest, res: Response) {
    try {
      const plan = await platformService.updatePlan(req.params.id as string, req.body);
      res.json({ success: true, message: "Plan updated.", data: plan });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message || "Failed to update plan." });
    }
  }

  async getSettings(_req: AuthenticatedRequest, res: Response) {
    try {
      const settings = await platformService.getSettings();
      res.json({ success: true, data: settings });
    } catch {
      res.status(500).json({ success: false, error: "Failed to fetch settings." });
    }
  }

  async updateSettings(req: AuthenticatedRequest, res: Response) {
    try {
      const settings = await platformService.updateSettings(req.body);
      res.json({ success: true, message: "Settings updated.", data: settings });
    } catch (error: any) {
      console.error("[platform] updateSettings failed:", error?.message || error);
      res.status(500).json({ success: false, error: "Failed to update settings." });
    }
  }

  async listAudit(req: AuthenticatedRequest, res: Response) {
    try {
      const { page, limit, action, userId, schoolId, result } = req.query as Record<string, string | undefined>;
      const data = await platformService.listAuditLogs({
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
        action,
        userId,
        schoolId,
        result,
      });
      res.json({ success: true, data: data.data, meta: data.meta });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message || "Failed to fetch audit logs." });
    }
  }
}

export const platformController = new PlatformController();
