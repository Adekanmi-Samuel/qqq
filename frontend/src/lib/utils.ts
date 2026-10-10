import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// ─── Core ────────────────────────────────────────────────────────────────────

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ─── Formatting ──────────────────────────────────────────────────────────────

/** Nigerian Naira format: ₦30,000 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  }).format(amount);
}

/** Backwards-compatible alias */
export const formatNaira = formatCurrency;

/** Nigerian date format: 25 Aug 2026 */
export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat("en-NG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

/** Nigerian phone format: +234 801 234 5678 */
export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, "");
  let raw: string;
  if (cleaned.startsWith("234") && cleaned.length === 13) {
    raw = cleaned;
  } else if (cleaned.startsWith("0") && cleaned.length === 11) {
    raw = `234${cleaned.slice(1)}`;
  } else if (cleaned.startsWith("234")) {
    raw = cleaned;
  } else {
    return phone;
  }
  return `+${raw.slice(0, 3)} ${raw.slice(3, 7)} ${raw.slice(7)}`;
}

/** Normalise any Nigerian phone to +234XXXXXXXXXX */
export function normalizePhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.startsWith("234") && cleaned.length === 13) return `+${cleaned}`;
  if (cleaned.startsWith("0") && cleaned.length === 11)
    return `+234${cleaned.slice(1)}`;
  if (cleaned.startsWith("+234")) return cleaned;
  return phone;
}

// ─── Text ────────────────────────────────────────────────────────────────────

/**
 * Double-submit CSRF headers for cookie-authenticated mutating requests.
 * Backend csrfProtection requires X-CSRF-TOKEN to match sh_csrf cookie.
 */
export function getCsrfHeaders(extra: Record<string, string> = {}): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...extra,
  };
  if (typeof document !== "undefined") {
    const csrfCookie = document.cookie
      .split(";")
      .map((c) => c.trim())
      .find((c) => c.startsWith("sh_csrf="));
    if (csrfCookie) {
      headers["X-CSRF-TOKEN"] = decodeURIComponent(csrfCookie.slice("sh_csrf=".length));
    }
  }
  return headers;
}

/**
 * Extract a user-facing message from a backend API error body.
 * Backend sendError returns { success: false, error: { code, message } }.
 * Some legacy clients return a plain string. Never pass an object into Error.
 */
export function extractApiErrorMessage(
  error: unknown,
  fallback = "Something went wrong. Please try again.",
): string {
  if (error == null) return fallback;

  if (typeof error === "string") {
    const trimmed = error.trim();
    return trimmed || fallback;
  }

  if (typeof error === "object") {
    const err = error as {
      message?: unknown;
      error?: unknown;
      code?: unknown;
    };

    if (typeof err.message === "string" && err.message.trim()) {
      return err.message.trim();
    }

    // Nested backend shape: { error: { code, message } }
    if (err.error != null && typeof err.error === "object") {
      const nested = err.error as { message?: unknown };
      if (typeof nested.message === "string" && nested.message.trim()) {
        return nested.message.trim();
      }
    }

    if (typeof err.error === "string" && err.error.trim()) {
      return err.error.trim();
    }
  }

  return fallback;
}

/** URL-safe slug from text */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Backwards-compatible alias */
export const generateSlug = slugify;

/** Truncate text with ellipsis */
export function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.slice(0, length).trimEnd() + "...";
}

// ─── Functions ───────────────────────────────────────────────────────────────

/** Debounce a function by `ms` milliseconds */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  ms: number,
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

// ─── School-specific helpers (legacy) ────────────────────────────────────────

export function generateAdmissionNumber(
  schoolCode: string,
  year: number,
  sequence: number,
): string {
  const seq = String(sequence).padStart(4, "0");
  return `${schoolCode}/${year}/${seq}`;
}

export function getGrade(score: number): { grade: string; remark: string } {
  if (score >= 75) return { grade: "A1", remark: "Excellent" };
  if (score >= 70) return { grade: "B2", remark: "Very Good" };
  if (score >= 65) return { grade: "B3", remark: "Good" };
  if (score >= 60) return { grade: "C4", remark: "Credit" };
  if (score >= 55) return { grade: "C5", remark: "Credit" };
  if (score >= 50) return { grade: "C6", remark: "Credit" };
  if (score >= 45) return { grade: "D7", remark: "Pass" };
  if (score >= 40) return { grade: "E8", remark: "Pass" };
  return { grade: "F9", remark: "Fail" };
}

export function getSchoolTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    nursery: "Nursery",
    primary: "Primary",
    secondary: "Secondary",
    combined: "Nursery, Primary & Secondary",
  };
  return labels[type] || type;
}

export function getOwnershipTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    private: "Private School",
    government: "Government School",
  };
  return labels[type] || type;
}

/** Read sh_csrf double-submit cookie for mutating API calls. */
export function getCsrfToken(): string | null {
  if (typeof document === "undefined") return null;
  const cookies = document.cookie.split(";");
  const csrfCookie = cookies.find((c) => c.trim().startsWith("sh_csrf="));
  return csrfCookie ? csrfCookie.split("=")[1].trim() : null;
}

/** Headers for authenticated mutating fetches (JSON + CSRF). */
export function csrfHeaders(extra?: Record<string, string>): Record<string, string> {
  const token = getCsrfToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { "X-CSRF-TOKEN": token } : {}),
    ...(extra || {}),
  };
}
