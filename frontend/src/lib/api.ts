"use client";

/**
 * API Client   wraps fetch with automatic cookie-based auth and CSRF protection.
 *
 * Usage:
 *   import { api } from "@/lib/api";
 *   const data = await api.get("/api/students");
 *   const created = await api.post("/api/students", { name: "..." });
 *
 * Authentication is handled via HttpOnly cookies (sh_access, sh_refresh)
 * sent automatically with each request via credentials: "include".
 */

import { API_URL } from "./config";

let logoutFn: (() => Promise<void>) | null = null;

/**
 * Initialize the API client with logout callback from AuthContext.
 * Called once by the CookieAuthProvider on mount.
 */
export function initApiClient(
  _getAccessToken: () => Promise<string | null>,
  logout: () => Promise<void>
) {
  logoutFn = logout;
}

/**
 * Get CSRF token from cookie for mutating requests
 */
function getCsrfToken(): string | null {
  if (typeof document === "undefined") return null;
  const cookies = document.cookie.split(";");
  const csrfCookie = cookies.find(c => c.trim().startsWith("sh_csrf="));
  return csrfCookie ? csrfCookie.split("=")[1].trim() : null;
}

interface ApiOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  params?: Record<string, string>;
  __isAuthRetry?: boolean;
}

interface ApiError {
  success: false;
  error: string;
  status: number;
}

interface ApiSuccess<T = unknown> {
  success: true;
  data: T;
  message?: string;
}

type ApiResponse<T = unknown> = ApiSuccess<T> | ApiError;

class ApiClientError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
  }
}

/**
 * Check if a request is a mutating operation (POST, PUT, PATCH, DELETE)
 */
function isMutatingRequest(method: string): boolean {
  return ["POST", "PUT", "PATCH", "DELETE"].includes(method.toUpperCase());
}

async function request<T = unknown>(
  method: string,
  path: string,
  options: ApiOptions = {}
): Promise<T> {
  const { body, params, ...fetchOptions } = options;

  // Build URL with query params.
  // API_URL is "" (same-origin proxy), resolve against page origin.
  const base =
    typeof window !== "undefined" ? window.location.origin : "http://localhost";
  const url = new URL(`${API_URL}${path}`, base);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
  }

  // Build headers
  const headers: Record<string, string> = {
    ...(fetchOptions.headers as Record<string, string>),
  };

  // Set content type for JSON bodies
  if (body && !(body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  // Add CSRF token for mutating requests (double-submit pattern)
  if (isMutatingRequest(method)) {
    const csrfToken = getCsrfToken();
    if (csrfToken) {
      headers["X-CSRF-TOKEN"] = csrfToken;
    }
  }

  // Make the request with credentials: "include" to send HttpOnly cookies
  const res = await fetch(url.toString(), {
    method,
    headers,
    body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
    credentials: "include", // Important: send cookies with cross-origin requests
    ...fetchOptions,
  });

  // Handle 401: attempt a single refresh, then retry once before logout
  if (res.status === 401 && logoutFn && !fetchOptions.__isAuthRetry) {
    try {
      const csrfToken = getCsrfToken();
      const refreshRes = await fetch(`${API_URL}/api/auth/refresh`, {
        method: "POST",
        headers: csrfToken ? { "X-CSRF-TOKEN": csrfToken } : undefined,
        credentials: "include",
      });
      if (refreshRes.ok) {
        // Retry original request once after successful refresh
        return request<T>(method, path, {
          ...options,
          __isAuthRetry: true,
        } as ApiOptions & { __isAuthRetry?: boolean });
      }
    } catch {
      // Fall through to logout
    }
    await logoutFn();
    throw new ApiClientError("Session expired. Please sign in again.", 401);
  }

  // Handle 403 CSRF errors specifically
  if (res.status === 403) {
    const data = await res.json().catch(() => ({ success: false, error: {} }));
    if (data.error?.code === "CSRF_INVALID") {
      // CSRF token mismatch - might need to refresh the page
      throw new ApiClientError("Security token mismatch. Please refresh the page.", 403);
    }
  }

  // Handle 429 rate limits with a clear wait message
  if (res.status === 429) {
    const data = await res.json().catch(() => ({ success: false, error: {} }));
    const retryAfter = Number(data.error?.retryAfter || res.headers.get("Retry-After") || 0);
    const waitSec = Number.isFinite(retryAfter) && retryAfter > 0 ? Math.ceil(retryAfter) : 60;
    const message =
      typeof data.error?.message === "string" && data.error.message
        ? data.error.message
        : `Too many requests. Please wait about ${waitSec} seconds and try again.`;
    throw new ApiClientError(message, 429);
  }

  // Parse response
  const data = await res.json().catch(() => ({ success: false, error: "Invalid response from server" }));

  if (!res.ok || data.success === false) {
    throw new ApiClientError(data.error?.message || data.error || `Request failed (${res.status})`, res.status);
  }

  return data.data ?? data;
}

export const api = {
  get: <T = unknown>(path: string, options?: ApiOptions) =>
    request<T>("GET", path, options),

  post: <T = unknown>(path: string, body?: unknown, options?: ApiOptions) =>
    request<T>("POST", path, { ...options, body }),

  put: <T = unknown>(path: string, body?: unknown, options?: ApiOptions) =>
    request<T>("PUT", path, { ...options, body }),

  patch: <T = unknown>(path: string, body?: unknown, options?: ApiOptions) =>
    request<T>("PATCH", path, { ...options, body }),

  delete: <T = unknown>(path: string, options?: ApiOptions) =>
    request<T>("DELETE", path, options),
};

export { ApiClientError };
export type { ApiResponse, ApiError, ApiSuccess };