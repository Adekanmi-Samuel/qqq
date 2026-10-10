"use client";

/**
 * Shared helpers for platform superadmin pages.
 * Adds CSRF token from the sh_csrf cookie and unwraps structured API errors.
 */
import { API_URL } from "./config";
import { extractApiErrorMessage } from "./utils";

function getCsrfToken(): string | null {
  if (typeof document === "undefined") return null;
  const cookies = document.cookie.split(";");
  const csrfCookie = cookies.find((c) => c.trim().startsWith("sh_csrf="));
  return csrfCookie ? csrfCookie.split("=")[1].trim() : null;
}

export function platformHeaders(): Record<string, string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const csrf = getCsrfToken();
  if (csrf) headers["X-CSRF-TOKEN"] = csrf;
  return headers;
}

export async function platformFetch(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const method = (options.method || "GET").toUpperCase();
  const headers = platformHeaders();
  const existing = (options.headers as Record<string, string>) || {};
  return fetch(`${API_URL}${path}`, {
    credentials: "include",
    ...options,
    headers: { ...headers, ...existing },
    method,
  });
}

export { extractApiErrorMessage };
