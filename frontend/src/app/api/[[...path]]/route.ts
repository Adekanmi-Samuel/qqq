/**
 * Same-origin API proxy (Next.js Route Handler).
 *
 * Chrome blocks third-party cookies across *.vercel.app sites.
 * Every /api/* request hits this handler, which forwards to the
 * backend and passes Set-Cookie through so the browser stores
 * cookies for the frontend origin.
 */

import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

const BACKEND_ORIGIN =
  process.env.BACKEND_ORIGIN ||
  process.env.BACKEND_URL ||
  "https://schoolpilot-work-api.vercel.app";

/**
 * Canonical browser origin for this deployment.
 * VERCEL_URL is the per-deployment host (changes every deploy) and must NOT
 * be used here: the backend only allows the production alias. Prefer the
 * production project URL, then NEXT_PUBLIC_SITE_URL, then the known alias.
 */
const CANONICAL_FRONTEND = "https://schoolpilot-work.vercel.app";
// Production aliases only. Never let a deployment host or arbitrary
// NEXT_PUBLIC_SITE_URL win: the backend only allows the production alias,
// and Google OAuth must always return here.
const PRODUCTION_ALIAS_HOSTS = new Set([
  "schoolpilot-work.vercel.app",
  "schoolpilot-theta.vercel.app",
  "localhost:3000",
]);
const FRONTEND_ORIGIN =
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.SITE_URL ||
  CANONICAL_FRONTEND;
const originHost = FRONTEND_ORIGIN.replace(/^https?:\/\//, "");
const SAFE_FRONTEND_ORIGIN = PRODUCTION_ALIAS_HOSTS.has(originHost)
  ? FRONTEND_ORIGIN
  : CANONICAL_FRONTEND;

if (!process.env.BACKEND_ORIGIN && process.env.NODE_ENV === "production") {
  console.error(
    "[proxy] BACKEND_ORIGIN is not set. Set BACKEND_ORIGIN to the backend API origin."
  );
}

const HOP_BY_HOP = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
  "host",
  "content-length",
]);

async function proxyRequest(request: NextRequest): Promise<Response> {
  const pathParts = request.nextUrl.pathname.replace(/^\/api\/?/, "");
  const search = request.nextUrl.search || "";
  const target = `${BACKEND_ORIGIN}/api/${pathParts}${search}`;

  const headers = new Headers();
  request.headers.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (HOP_BY_HOP.has(lower)) return;
    if (lower === "origin") return;
    headers.set(key, value);
  });
  headers.set("origin", SAFE_FRONTEND_ORIGIN);
  headers.set("x-forwarded-host", SAFE_FRONTEND_ORIGIN.replace(/^https?:\/\//, ""));
  headers.set("x-schoolhub-proxy", "1");

  const method = request.method.toUpperCase();
  const hasBody = !["GET", "HEAD", "OPTIONS"].includes(method);
  const body = hasBody ? await request.arrayBuffer() : undefined;

  let upstream: Response;
  try {
    upstream = await fetch(target, {
      method,
      headers,
      body: body && body.byteLength > 0 ? body : undefined,
      redirect: "manual",
      cache: "no-store",
    });
  } catch {
    return Response.json(
      {
        success: false,
        error: {
          code: "UPSTREAM_UNAVAILABLE",
          message: "Connection lost. Please check your internet.",
        },
      },
      { status: 502, headers: { "Cache-Control": "private, no-store" } }
    );
  }

  const responseHeaders = new Headers();
  const setCookies =
    typeof upstream.headers.getSetCookie === "function"
      ? upstream.headers.getSetCookie()
      : upstream.headers.get("set-cookie")
        ? [upstream.headers.get("set-cookie") as string]
        : [];

  upstream.headers.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (lower === "set-cookie") return;
    if (HOP_BY_HOP.has(lower)) return;
    if (lower === "content-encoding") return;
    if (lower === "content-length") return;
    if (lower === "cache-control") return;
    responseHeaders.set(key, value);
  });
  responseHeaders.set("cache-control", "private, no-store");

  if (setCookies.length > 0) {
    setCookies.forEach((cookie) => {
      if (cookie) responseHeaders.append("Set-Cookie", cookie);
    });
  }

  const buf = await upstream.arrayBuffer();
  return new Response(buf, {
    status: upstream.status,
    headers: responseHeaders,
  });
}

export async function GET(request: NextRequest) {
  return proxyRequest(request);
}
export async function POST(request: NextRequest) {
  return proxyRequest(request);
}
export async function PUT(request: NextRequest) {
  return proxyRequest(request);
}
export async function PATCH(request: NextRequest) {
  return proxyRequest(request);
}
export async function DELETE(request: NextRequest) {
  return proxyRequest(request);
}
export async function HEAD(request: NextRequest) {
  return proxyRequest(request);
}
export async function OPTIONS(request: NextRequest) {
  return proxyRequest(request);
}
