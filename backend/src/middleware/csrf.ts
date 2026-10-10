import crypto from "crypto";
import { Request, Response, NextFunction } from "express";
import { getCookieOptions } from "../config/cookies";
import { sendError } from "../utils/response";

function setCsrfCookie(res: Response): string {
  const token = crypto.randomUUID();
  res.cookie("sh_csrf", token, {
    httpOnly: false,
    secure: true,
    sameSite: "lax",
    maxAge: 24 * 60 * 60 * 1000,
    path: "/",
  });
  return token;
}

/**
 * Ensure a readable CSRF cookie exists for double-submit clients.
 * Safe on every request; only sets the cookie when missing.
 */
export function ensureCsrfCookie(req: Request, res: Response, next: NextFunction): void {
  if (!req.cookies?.sh_csrf) {
    setCsrfCookie(res);
  }
  next();
}

/**
 * CSRF protection middleware
 * Implements double-submit cookie pattern
 *
 * Security considerations:
 * - Rejects mutating requests when the cookie or header token is missing
 * - Does NOT mint-and-allow (that was a bypass)
 * - Compares cookie value to X-CSRF-TOKEN / csrf_token body field
 */
export function csrfProtection(req: Request, res: Response, next: NextFunction): void {
  // Skip CSRF protection for GET/HEAD/OPTIONS requests
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    return next();
  }

  const csrfToken = req.cookies["sh_csrf"];

  if (!csrfToken) {
    // Set cookie for a subsequent successful request, but reject this one.
    setCsrfCookie(res);
    sendError(res, 403, "CSRF_INVALID", "CSRF token missing. Refresh the page and try again.");
    return;
  }

  const body = req.body || {};
  const requestToken =
    body["X-CSRF-TOKEN"] ||
    req.headers["x-csrf-token"] ||
    body["csrf_token"];

  if (!requestToken) {
    sendError(res, 403, "CSRF_INVALID", "CSRF token missing");
    return;
  }

  const expectedToken = Array.isArray(requestToken) ? requestToken[0] : requestToken;
  if (csrfToken !== expectedToken) {
    sendError(res, 403, "CSRF_INVALID", "CSRF token mismatch");
    return;
  }

  next();
}

/**
 * CSRF protection for file uploads and other multipart requests
 * Need to parse form data first
 */
export function csrfFileUpload(req: Request, res: Response, next: NextFunction): void {
  if (!["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) {
    return next();
  }

  const body = req.body || {};
  let formToken = body["csrf_token"] || body["X-CSRF-TOKEN"];
  if (!formToken) {
    const headerToken = req.headers["x-csrf-token"];
    if (headerToken) {
      formToken = Array.isArray(headerToken) ? headerToken[0] : headerToken;
    }
  }

  if (!formToken) {
    sendError(res, 403, "CSRF_INVALID", "CSRF token missing from request");
    return;
  }

  const csrfToken = req.cookies["sh_csrf"];
  const expectedToken = Array.isArray(formToken) ? formToken[0] : formToken;
  if (!csrfToken || csrfToken !== expectedToken) {
    sendError(res, 403, "CSRF_INVALID", "CSRF token mismatch");
    return;
  }

  next();
}
