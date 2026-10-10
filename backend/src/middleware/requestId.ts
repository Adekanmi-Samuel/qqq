/**
 * Request ID Middleware
 *
 * Generates a unique request ID for every incoming request.
 * Attaches it to the request object and sets X-Request-Id response header.
 * This enables distributed tracing across the application.
 */

import { Request, Response, NextFunction } from "express";

// Extend Express Request to include requestId
declare global {
  namespace Express {
    interface Request {
      requestId?: string;
    }
  }
}

/**
 * Middleware that generates a unique request ID (UUID) for each request.
 * The ID is:
 *   - Attached as req.requestId for downstream use
 *   - Set as X-Request-Id response header for client-side tracing
 *   - Used in structured logging
 */
export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Use client-provided request ID if present (for distributed tracing), otherwise generate one
  const clientRequestId = req.headers["x-request-id"] as string | undefined;
  const requestId = clientRequestId || crypto.randomUUID();

  req.requestId = requestId;
  res.setHeader("X-Request-Id", requestId);

  next();
}
