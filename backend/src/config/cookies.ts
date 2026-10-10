import { Request, Response } from "express";

/**
 * Cookie options factory
 * @param isRefresh - Whether this is a refresh token cookie
 * @param remember - Whether to use long-lived refresh cookie (7 days) or short-lived (24 hours)
 * @returns Cookie options object
 */
export function getCookieOptions(isRefresh: boolean, remember: boolean) {
  return {
    httpOnly: true,
    // Secure is always required. Frontend proxies /api on same origin,
    // so Lax/Strict is preferred over None for CSRF resistance.
    secure: true,
    // Lax: cookies sent on same-site navigations and same-origin XHR with credentials.
    sameSite: 'lax' as const,
    maxAge: (remember ? (isRefresh ? 7 * 24 * 60 * 60 : 24 * 60 * 60) : (isRefresh ? 24 * 60 * 60 : 15 * 60)) * 1000,
    path: isRefresh ? '/api/auth/refresh' : '/',
  };
}

/**
 * Generate CSRF token and set cookie
 * @returns CSRF token string
 */
export function generateCsrfToken(): string {
  return crypto.randomUUID();
}
