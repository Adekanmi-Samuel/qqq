/**
 * Audit Trail Middleware
 *
 * Logs WHO (userId), WHAT (action), WHEN (timestamp), WHERE (ip, route), RESULT (success/failure).
 * Captures on: auth actions, payment actions, admin actions, permission changes, CRUD on sensitive data.
 *
 * Fire-and-forget: audit logging never blocks or breaks the main flow.
 */

import { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma";

export interface AuditLogData {
  userId?: string;
  schoolId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  method: string;
  path: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: any;
}

/**
 * Audit middleware that intercepts write operations and logs them.
 * Only logs POST, PUT, PATCH, DELETE requests.
 */
export function auditMiddleware(req: Request, res: Response, next: NextFunction) {
  const startTime = Date.now();

  // Capture response
  const originalJson = res.json.bind(res);
  res.json = function (body: any) {
    const duration = Date.now() - startTime;

    // Log audit entry for write operations
    if (["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) {
      const userId = (req as any).user?.userId;
      const schoolId = (req as any).tenantId || (req as any).user?.schoolId;

      // Only log if we have meaningful context
      if (userId || schoolId) {
        const auditData: AuditLogData = {
          userId: userId || undefined,
          schoolId: schoolId || undefined,
          action: `${req.method} ${req.path}`,
          resource: extractResource(req.path),
          resourceId: extractResourceId(req.path),
          method: req.method,
          path: req.path,
          ipAddress: req.ip || req.socket.remoteAddress,
          userAgent: req.headers["user-agent"],
          metadata: {
            duration,
            success: res.statusCode < 400,
            requestId: (req as any).requestId,
          },
        };

        // Fire-and-forget: audit logging should never break the main flow
        prisma.auditLog?.create({ data: auditData as any }).catch(() => {});
      }
    }

    return originalJson(body);
  };

  next();
}

/**
 * Helper to extract the resource name from the request path.
 */
function extractResource(path: string): string {
  const segments = path.split("/").filter(Boolean);
  // Skip "api" prefix
  if (segments[0] === "api") segments.shift();
  return segments[0] || "unknown";
}

/**
 * Helper to extract a UUID resource ID from the request path.
 */
function extractResourceId(path: string): string | undefined {
  const segments = path.split("/").filter(Boolean);
  const lastSegment = segments[segments.length - 1];
  if (lastSegment && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(lastSegment)) {
    return lastSegment;
  }
  return undefined;
}

/**
 * Create an audit log entry manually.
 * Use this in services for fine-grained audit logging.
 * Fire-and-forget: never throws, never blocks.
 */
export async function createAuditLog(data: AuditLogData) {
  try {
    await prisma.auditLog?.create({ data: data as any });
  } catch {
    // Silent fail - audit logging should never break the main flow
  }
}
