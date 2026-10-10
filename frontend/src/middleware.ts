import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Force every auth surface onto the production SchoolPilot origin.
 *
 * Supabase OAuth was sending people to schoolpilot.vercel.app because
 * that host was configured as the Site URL. This middleware only runs
 * on the current deployment, so it cannot fix that host directly, but
 * it guarantees that any preview or alias host that does serve this app
 * always hands auth traffic back to schoolpilot-work.vercel.app.
 */

const PRODUCTION_ORIGIN = "https://schoolpilot-work.vercel.app";
const PRODUCTION_HOST = "schoolpilot-work.vercel.app";

const ALLOWED_HOSTS = new Set([
  PRODUCTION_HOST,
  "schoolpilot-theta.vercel.app",
  "localhost:3000",
  "127.0.0.1:3000",
]);

const AUTH_PATHS = ["/login", "/signup", "/auth", "/forgot-password", "/reset-password", "/verify-email", "/onboarding"];

export function middleware(request: NextRequest) {
  const host = request.headers.get("host") || "";
  const { pathname, search } = request.nextUrl;

  // Unknown host serving this app: send users to production, keep path.
  if (!ALLOWED_HOSTS.has(host)) {
    const url = new URL(`${PRODUCTION_ORIGIN}${pathname}${search}`);
    return NextResponse.redirect(url, 307);
  }

  // Known production host is fine.
  if (host === PRODUCTION_HOST) {
    return NextResponse.next();
  }

  // Allowed non-production host (preview / legacy alias that still
  // runs this build): keep working, but never let OAuth land here.
  const isAuthPath = AUTH_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`) || pathname.startsWith(`${p}?`));
  if (isAuthPath || pathname.startsWith("/auth/")) {
    const url = new URL(`${PRODUCTION_ORIGIN}${pathname}${search}`);
    return NextResponse.redirect(url, 307);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|images/|sitemap.xml|robots.txt|llms.txt).*)"],
};