import { createBrowserClient } from '@supabase/ssr';

/**
 * Supabase browser client.
 *
 * Returns null (never throws) when the public env vars are missing or
 * invalid. This keeps marketing pages and prerender from crashing when
 * Supabase is not configured or env values are placeholders.
 * Callers must null-check the result before using it.
 */

/** Production Supabase project. Never let a stale env bounce OAuth. */
const PRODUCTION_SUPABASE_URL = "https://kcqjxtkwiuvzrcqkvqst.supabase.co";

export function createClient() {
  const url = (
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
    PRODUCTION_SUPABASE_URL
  ).replace(/\/+$/, "");
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!anonKey) {
    return null as any;
  }

  // Reject placeholders and non HTTP(S) values before Supabase throws.
  if (!/^https?:\/\/[^\s/$.?#].[^\s]*$/i.test(url)) {
    return null as any;
  }

  // Always use the production project host when a known project URL is set.
  // A wrong NEXT_PUBLIC_SUPABASE_URL is what sent OAuth to the wrong app.
  const safeUrl = /schoolpilot|kcqjxtkwiuvzrcqkvqst/i.test(url)
    ? PRODUCTION_SUPABASE_URL
    : url;

  return createBrowserClient(safeUrl, anonKey, {
    auth: {
      // Keep OAuth callbacks on SchoolPilot, never on a random deployment host.
      detectSessionInUrl: true,
      persistSession: true,
      autoRefreshToken: true,
      flowType: "pkce",
    },
  });
}