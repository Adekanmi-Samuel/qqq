"use client";

/**
 * Canonical SchoolPilot origins.
 *
 * Google sign in was bouncing people to schoolpilot.vercel.app because
 * Supabase Site URL still points at that old host. Auth redirects must
 * always resolve to the production alias so cookies stay same-origin.
 */

export const PRODUCTION_ORIGIN = "https://schoolpilot-work.vercel.app";
export const PRODUCTION_HOST = "schoolpilot-work.vercel.app";

/** Hosts that are allowed to complete SchoolPilot auth. */
const ALLOWED_HOSTS = new Set([
  PRODUCTION_HOST,
  "schoolpilot-theta.vercel.app",
  "localhost:3000",
  "127.0.0.1:3000",
]);

/**
 * Origin to use for OAuth redirects and post-auth navigation.
 * Unknown hosts always fall back to production.
 */
export function getAuthOrigin(): string {
  if (typeof window === "undefined") return PRODUCTION_ORIGIN;
  const { host, origin } = window.location;
  if (ALLOWED_HOSTS.has(host)) return origin;
  return PRODUCTION_ORIGIN;
}

/** Absolute OAuth callback URL on the canonical origin. */
export function getAuthCallbackUrl(): string {
  return `${getAuthOrigin()}/auth/callback`;
}

/**
 * If the browser is on a stale host (schoolpilot.vercel.app and friends),
 * send it to production while preserving path and query.
 */
export function redirectToProductionIfStale(): void {
  if (typeof window === "undefined") return;
  const { host, pathname, search } = window.location;
  if (ALLOWED_HOSTS.has(host)) return;
  window.location.replace(`${PRODUCTION_ORIGIN}${pathname}${search}`);
}

/** True when the current host may complete SchoolPilot auth. */
export function isAllowedAuthHost(): boolean {
  if (typeof window === "undefined") return true;
  return ALLOWED_HOSTS.has(window.location.host);
}