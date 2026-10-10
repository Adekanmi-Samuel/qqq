"use client";

import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import type { ReactNode } from "react";
import { initApiClient } from "@/lib/api";
import { API_URL } from "@/lib/config";
import { createClient } from "@/lib/supabase/client";
import { getAuthCallbackUrl, redirectToProductionIfStale } from "@/lib/authOrigins";
import type { Session, User as SupabaseUser } from "@supabase/supabase-js";

export type Role = "SUPER_ADMIN" | "SCHOOL_ADMIN" | "PRINCIPAL" | "TEACHER" | "BURSAR" | "PARENT" | "STUDENT";

export interface AuthUser {
  id: string;
  fullName: string;
  email: string;
  role: Role;
  schoolId?: string | null;
  school?: {
    id: string;
    name: string;
    slug: string;
    verified: boolean;
    logoUrl?: string | null;
    motto?: string | null;
  } | null;
}

interface SessionData {
  id: string;
  deviceId: string;
  userAgent: string;
  ipAddress: string;
  lastActiveAt: string;
  isCurrent: boolean;
  createdAt: string;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null; // Cookie-based: always null, kept for backward compatibility
  loading: boolean;
  login: (email: string, password: string, remember?: boolean) => Promise<{ user: AuthUser; message?: string }>;
  logout: () => Promise<void>;
  getSessions: () => Promise<{ sessions: SessionData[]; currentSessionId?: string }>;
  revokeSession: (sessionId: string) => Promise<void>;
  revokeAllSessions: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  supabaseSession: Session | null;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function CookieAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [supabaseSession, setSupabaseSession] = useState<Session | null>(null);
  const isRefreshingRef = useRef(false);
  const refreshPromiseRef = useRef<Promise<boolean> | null>(null);
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const supabase = createClient();

  /**
   * Get CSRF token from cookie for mutating requests
   */
  const getCsrfToken = useCallback(() => {
    if (typeof document === "undefined") return null;
    const cookies = document.cookie.split(";");
    const csrfCookie = cookies.find(c => c.trim().startsWith("sh_csrf="));
    return csrfCookie ? csrfCookie.split("=")[1].trim() : null;
  }, []);

  /**
   * Create headers with CSRF token for mutations
   */
  const createMutationHeaders = useCallback(() => {
    const csrfToken = getCsrfToken();
    return {
      "Content-Type": "application/json",
      ...(csrfToken ? { "X-CSRF-TOKEN": csrfToken } : {}),
    };
  }, [getCsrfToken]);

  /**
   * Attempt to refresh the access token using the refresh token cookie
   */
  const performRefresh = useCallback(async (): Promise<boolean> => {
    if (isRefreshingRef.current && refreshPromiseRef.current) {
      return refreshPromiseRef.current;
    }

    isRefreshingRef.current = true;
    refreshPromiseRef.current = (async () => {
      try {
        const res = await fetch(`${API_URL}/api/auth/refresh`, {
          method: "POST",
          headers: createMutationHeaders(),
          credentials: "include", // Important: send cookies
        });

        if (!res.ok) {
          return false;
        }

        const data = await res.json();
        if (data.success) {
          // Cookies are automatically set by the server response
          // We just need to fetch the user data
          return true;
        }
      } catch {
        // Network error
      }
      return false;
    })();

    const result = await refreshPromiseRef.current;
    isRefreshingRef.current = false;
    refreshPromiseRef.current = null;
    return result;
  }, [createMutationHeaders]);

  /**
   * Schedule automatic token refresh 60 seconds before access token expiry
   */
  const scheduleRefresh = useCallback(() => {
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }

    // Access token is 15 minutes; refresh just before expiry.
    // Also re-check on visibility/focus so background tabs recover.
    const refreshIn = 14 * 60 * 1000;

    const runRefresh = async () => {
      const refreshed = await performRefresh();
      if (refreshed) {
        scheduleRefresh();
      } else {
        // Only clear client state after refresh actually failed
        setUser(null);
      }
    };

    refreshTimeoutRef.current = setTimeout(runRefresh, refreshIn);

    if (typeof document !== "undefined") {
      const onVisible = () => {
        if (document.visibilityState === "visible") {
          void performRefresh().then((ok) => {
            if (ok) scheduleRefresh();
          });
        }
      };
      const onFocus = () => {
        void performRefresh().then((ok) => {
          if (ok) scheduleRefresh();
        });
      };
      document.addEventListener("visibilitychange", onVisible);
      window.addEventListener("focus", onFocus);
    }
  }, [performRefresh]);

  /**
   * Fetch current user from the API
   */
  const fetchUser = useCallback(async (): Promise<AuthUser | null> => {
    try {
      const res = await fetch(`${API_URL}/api/auth/me`, {
        credentials: "include", // Send cookies
      });

      if (!res.ok) {
        return null;
      }

      const data = await res.json();
      if (data.success && data.data) {
        return data.data;
      }
    } catch {
      // Silent
    }
    return null;
  }, []);

  /**
   * Initialize auth state on mount
   */
  useEffect(() => {
    const init = async () => {
      try {
        // Check for Supabase session first (only if client available)
        if (supabase) {
          const { data: { session: supaSession } } = await supabase.auth.getSession();
          if (supaSession) {
            await handleSupabaseSession(supaSession);
            setLoading(false);
            return;
          }
        }

        // Call /api/auth/me only when it can succeed.
        // sh_csrf is a CSRF double submit cookie, not proof of login.
        // Access session cookie is HttpOnly so we cannot read it.
        // Auth routes always probe. Marketing pages never probe.
        // Other non marketing paths probe only if sh_csrf is present.
        const pathname = typeof window !== "undefined" ? window.location.pathname : "";
        const isAuthRoute =
          /^\/(dashboard|login|signup|onboarding|forgot-password|reset-password|staff-signup|student-signup|auth|verify-email)(\/|$)/.test(
            pathname
          );
        const isMarketingPath =
          pathname === "/" ||
          /^\/(about|pricing|contact|terms|privacy)(\/|$)/.test(pathname);
        const hasCsrfHint =
          typeof document !== "undefined" && document.cookie.includes("sh_csrf=");
        const shouldFetchUser =
          typeof window !== "undefined" &&
          (isAuthRoute || (!isMarketingPath && hasCsrfHint));

        if (shouldFetchUser) {
          const userData = await fetchUser();
          if (userData) {
            setUser(userData);
            scheduleRefresh();
          }
        }
      } catch {
        // Silent
      }
      setLoading(false);
    };

    init();

    // Listen for Supabase auth state changes (only if client available)
    let unsubscribe: (() => void) | null = null;
    if (supabase) {
      const { data } = supabase.auth.onAuthStateChange(async (event: string, session: Session | null) => {
        if (event === "SIGNED_IN" && session) {
          await handleSupabaseSession(session);
        } else if (event === "SIGNED_OUT") {
          setSupabaseSession(null);
          setUser(null);
          // Only leave dashboard routes. Never bounce marketing pages
          // or the OAuth callback to the homepage mid-flow.
          if (typeof window !== "undefined") {
            const path = window.location.pathname;
            if (path.startsWith("/dashboard") || path.startsWith("/onboarding")) {
              window.location.replace("/login");
            }
          }
        }
      });
      unsubscribe = typeof data?.subscription?.unsubscribe === "function"
        ? data.subscription.unsubscribe.bind(data.subscription)
        : null;
    }

    return () => {
      if (typeof unsubscribe === "function") unsubscribe();
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, [fetchUser, scheduleRefresh, supabase]);

  /**
   * Handle Supabase OAuth: sync with backend, set cookies
   */
  const handleSupabaseSession = useCallback(async (session: Session) => {
    setSupabaseSession(session);
    const accessToken = session?.access_token;

    if (!accessToken) return;

    // Try to sync with our backend using the verified Supabase JWT only.
    // Email and user id are derived server-side from the token claims.
    try {
      const res = await fetch(`${API_URL}/api/auth/supabase-sync`, {
        method: "POST",
        headers: createMutationHeaders(),
        credentials: "include",
        body: JSON.stringify({ accessToken }),
      });

      const data = await res.json();
      if (data.success && data.data) {
        const { user: userData, school } = data.data;
        setUser({ ...userData, school: school || null });
        scheduleRefresh();
      }
    } catch (err) {
      console.error("[Auth] Supabase sync failed:", err);
    }
  }, [createMutationHeaders, scheduleRefresh]);

  /**
   * Login with email and password
   * Server sets HttpOnly cookies automatically
   */
  const login = useCallback(async (
    email: string,
    password: string,
    remember: boolean = false
  ): Promise<{ user: AuthUser; message?: string }> => {
    const res = await fetch(`${API_URL}/api/auth/login`, {
      method: "POST",
      headers: createMutationHeaders(),
      credentials: "include",
      body: JSON.stringify({ email, password, remember }),
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      throw new Error(data.error?.message || "Login failed");
    }

    const { user: userData, message } = data.data;
    setUser(userData);
    scheduleRefresh();

    return { user: userData, message };
  }, [createMutationHeaders, scheduleRefresh]);

  /**
   * Logout - clears cookies on server and client state
   */
  const logout = useCallback(async () => {
    try {
      // Sign out from Supabase if connected
      if (supabase) await supabase.auth.signOut();

      // Call logout endpoint to clear cookies on server
      await fetch(`${API_URL}/api/auth/logout`, {
        method: "POST",
        headers: createMutationHeaders(),
        credentials: "include",
      });
    } catch {
      // Silent - we still clear client state
    }

    // Clear client state
    setUser(null);
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }
  }, [createMutationHeaders, supabase]);

  /**
   * Get active sessions
   */
  const getSessions = useCallback(async (): Promise<{ sessions: SessionData[]; currentSessionId?: string }> => {
    try {
      const res = await fetch(`${API_URL}/api/auth/sessions`, {
        credentials: "include",
      });

      const data = await res.json();
      if (data.success && data.data) {
        return data.data;
      }
    } catch {
      // Silent
    }
    return { sessions: [] };
  }, []);

  /**
   * Revoke a specific session
   */
  const revokeSession = useCallback(async (sessionId: string) => {
    const res = await fetch(`${API_URL}/api/auth/sessions/${sessionId}`, {
      method: "DELETE",
      headers: createMutationHeaders(),
      credentials: "include",
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error?.message || "Failed to revoke session");
    }
  }, [createMutationHeaders]);

  /**
   * Revoke all other sessions
   */
  const revokeAllSessions = useCallback(async () => {
    const res = await fetch(`${API_URL}/api/auth/sessions`, {
      method: "DELETE",
      headers: createMutationHeaders(),
      credentials: "include",
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error?.message || "Failed to revoke sessions");
    }
  }, [createMutationHeaders]);

  /**
   * Sign in with Google via Supabase
   * Always return to the production alias so OAuth never sticks to a
   * temporary deployment host or a non canonical project URL.
   */
  const signInWithGoogle = useCallback(async () => {
    // If this page is on an old host, leave for production first.
    redirectToProductionIfStale();

    if (!supabase) {
      throw new Error("Google sign-in is not configured on this deployment.");
    }
    const redirectTo = getAuthCallbackUrl();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
        // Keep the user on our host after Google even if Supabase
        // Site URL is misconfigured.
        skipBrowserRedirect: false,
        queryParams: {
          access_type: "offline",
          prompt: "consent",
        },
      },
    });
    if (error) {
      console.error("[Auth] Google sign-in error:", error);
      throw error;
    }
  }, [supabase]);

  // Initialize API client with logout function for 401 handling
  useEffect(() => {
    initApiClient(async () => null, logout);
  }, [logout]);

  return (
    <AuthContext.Provider value={{
      user,
      token: null, // Cookie-based auth   tokens sent automatically
      loading,
      login,
      logout,
      getSessions,
      revokeSession,
      revokeAllSessions,
      signInWithGoogle,
      supabaseSession,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within CookieAuthProvider");
  return ctx;
}

/** Get dashboard route for a given role */
export function getDashboardRoute(role: Role): string {
  switch (role) {
    case "SUPER_ADMIN": return "/dashboard/platform";
    case "TEACHER": return "/dashboard/teacher";
    case "STUDENT": return "/dashboard/student";
    case "PARENT": return "/dashboard/parent";
    case "BURSAR": return "/dashboard/staff";
    default: return "/dashboard/admin";
  }
}

/** Human-readable role label */
export function getRoleLabel(role: Role): string {
  const labels: Record<Role, string> = {
    SUPER_ADMIN: "Platform Admin",
    SCHOOL_ADMIN: "School Admin",
    PRINCIPAL: "Principal",
    TEACHER: "Teacher",
    BURSAR: "Bursar",
    STUDENT: "Student",
    PARENT: "Parent",
  };
  return labels[role] || role;
}

/** Check if role is allowed on current path and return redirect path if not */
export function getRoleRedirect(role: Role, pathname: string): string | null {
  const isPlatformAdmin = role === "SUPER_ADMIN";
  const isAdmin = ["SUPER_ADMIN", "SCHOOL_ADMIN", "PRINCIPAL"].includes(role);
  const isTeacher = role === "TEACHER";
  const isBursar = role === "BURSAR";
  const isStudent = role === "STUDENT";
  const isParent = role === "PARENT";

  if (pathname.startsWith("/dashboard/platform") && !isPlatformAdmin) return getDashboardRoute(role);
  if (pathname.startsWith("/dashboard/admin") && !isAdmin) return getDashboardRoute(role);
  if (pathname.startsWith("/dashboard/teacher") && !isTeacher) return getDashboardRoute(role);
  if (pathname.startsWith("/dashboard/staff") && !isBursar) return getDashboardRoute(role);
  if (pathname.startsWith("/dashboard/student") && !isStudent) return getDashboardRoute(role);
  if (pathname.startsWith("/dashboard/parent") && !isParent) return getDashboardRoute(role);

  return null;
}