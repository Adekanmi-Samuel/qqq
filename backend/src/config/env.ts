/**
 * Centralized environment configuration.
 * All secrets and config values should be imported from here
 * to enforce existence checks and avoid fallback defaults.
 */

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value || value.length < 32) {
    console.error(`[Config] FATAL: ${name} is missing or too short (< 32 chars). Server cannot start safely.`);
    process.exit(1);
  }
  return value;
}

function optionalEnv(name: string, fallback: string): string {
  return process.env[name] || fallback;
}

export const config = {
  /** JWT signing secret — must be at least 32 characters, never has a fallback. */
  get JWT_SECRET(): string {
    return requiredEnv("JWT_SECRET");
  },

  /** JWT access token expiry — short-lived for security (default 15m). */
  get JWT_ACCESS_EXPIRES_IN(): string {
    return optionalEnv("JWT_ACCESS_EXPIRES_IN", "15m");
  },

  /** JWT refresh token expiry — long-lived for session persistence (default 30d). */
  get JWT_REFRESH_EXPIRES_IN(): string {
    return optionalEnv("JWT_REFRESH_EXPIRES_IN", "30d");
  },

  /** JWT refresh token rotation period — after this many days, force re-login (default 30). */
  get JWT_ROTATION_DAYS(): number {
    return parseInt(process.env.JWT_ROTATION_DAYS || "30", 10);
  },

  /** Frontend URL for CORS and redirects. */
  get FRONTEND_URL(): string {
    return optionalEnv("FRONTEND_URL", "http://localhost:3000");
  },

  /** API database URL. */
  get DATABASE_URL(): string {
    return requiredEnv("DATABASE_URL");
  },

  /** Supabase JWT secret used to verify OAuth access tokens server-side. */
  get SUPABASE_JWT_SECRET(): string | undefined {
    return process.env.SUPABASE_JWT_SECRET;
  },

  /** Cohere API key (optional — generation falls back to Gemini). */
  get COHERE_API_KEY(): string | undefined {
    return process.env.COHERE_API_KEY;
  },

  /** Gemini API key (optional — used if Cohere unavailable). */
  get GEMINI_API_KEY(): string | undefined {
    return process.env.GEMINI_API_KEY;
  },

  /** SMTP config for email — all required for sending to work. */
  get SMTP_HOST(): string { return optionalEnv("SMTP_HOST", "smtp.gmail.com"); },
  get SMTP_PORT(): number { return parseInt(process.env.SMTP_PORT || "587", 10); },
  get SMTP_USER(): string { return process.env.SMTP_USER || ""; },
  get SMTP_PASS(): string { return process.env.SMTP_PASS || ""; },
  get SMTP_FROM(): string { return optionalEnv("SMTP_FROM", "noreply@schoolhub.com"); },
};
