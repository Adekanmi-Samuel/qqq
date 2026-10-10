/**
 * Centralized Error Handler Middleware
 *
 * Catches all errors and returns consistent JSON responses using the
 * standardized error format. Includes request ID for distributed tracing.
 * Never leaks internal error details to clients in production.
 *
 * Handles:
 *   - Custom AppError subclasses (with code, statusCode, details)
 *   - Prisma known request errors (P2002 = unique constraint, P2025 = not found, etc.)
 *   - Prisma validation errors
 *   - JSON parse errors
 *   - Unexpected/fallback errors
 */

import { Request, Response, NextFunction } from "express";
import { Prisma } from "@prisma/client";
import { AppError } from "../utils/errors";

/**
 * Centralized error handler middleware.
 * Catches all errors and returns consistent JSON responses.
 */
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const requestId = req.requestId;
  const isProduction = process.env.NODE_ENV === "production";

  // Log error (always in non-production, only errors in production)
  if (!isProduction) {
    console.error(`[Error] [${requestId || "no-id"}]`, err);
  } else if (err instanceof AppError && err.statusCode >= 500) {
    console.error(`[Error] [${requestId || "no-id"}]`, err.message);
  }

  // Known application errors
  if (err instanceof AppError) {
    const body: any = {
      success: false,
      error: {
        code: err.code,
        message: err.message,
      },
    };
    if (requestId) body.error.requestId = requestId;
    if (err.details) body.error.details = err.details;

    // Set Retry-After header for rate limited errors
    if (err.code === "RATE_LIMITED" && "retryAfter" in err) {
      res.setHeader("Retry-After", (err as any).retryAfter.toString());
    }

    res.status(err.statusCode).json(body);
    return;
  }

  // Prisma known request errors (e.g., unique constraint violation, not found)
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case "P2002": {
        const fields = (err.meta?.target as string[])?.join(", ") || "field";
        const body: any = {
          success: false,
          error: {
            code: "CONFLICT",
            message: `A record with this ${fields} already exists.`,
          },
        };
        if (requestId) body.error.requestId = requestId;
        res.status(409).json(body);
        return;
      }
      case "P2025": {
        const body: any = {
          success: false,
          error: {
            code: "RESOURCE_NOT_FOUND",
            message: "The requested record was not found.",
          },
        };
        if (requestId) body.error.requestId = requestId;
        res.status(404).json(body);
        return;
      }
      case "P2003": {
        const body: any = {
          success: false,
          error: {
            code: "BAD_REQUEST",
            message: "Referenced record does not exist. Please check your input.",
          },
        };
        if (requestId) body.error.requestId = requestId;
        res.status(400).json(body);
        return;
      }
      default: {
        const body: any = {
          success: false,
          error: {
            code: "DATABASE_ERROR",
            message: "A database error occurred. Please try again.",
          },
        };
        if (requestId) body.error.requestId = requestId;
        res.status(500).json(body);
        return;
      }
    }
  }

  // Prisma validation errors
  if (err instanceof Prisma.PrismaClientValidationError) {
    const body: any = {
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid data provided. Please check your input.",
      },
    };
    if (requestId) body.error.requestId = requestId;
    res.status(422).json(body);
    return;
  }

  // JSON parse errors
  if (err instanceof SyntaxError && "body" in err) {
    const body: any = {
      success: false,
      error: {
        code: "BAD_REQUEST",
        message: "Invalid JSON in request body.",
      },
    };
    if (requestId) body.error.requestId = requestId;
    res.status(400).json(body);
    return;
  }

  // Fallback -- unexpected errors
  const body: any = {
    success: false,
    error: {
      code: "SERVER_ERROR",
      message: isProduction
        ? "Something went wrong. Please try again later."
        : err.message || "Internal server error",
    },
  };
  if (requestId) body.error.requestId = requestId;
  res.status(500).json(body);
}
