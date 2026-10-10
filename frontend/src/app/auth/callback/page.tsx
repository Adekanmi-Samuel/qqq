"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuth, getDashboardRoute } from "@/lib/auth/CookieAuthProvider";
import { API_URL } from "@/lib/config";
import { Suspense } from "react";

function getCsrfToken(): string | null {
  if (typeof document === "undefined") return null;
  const cookies = document.cookie.split(";");
  const csrfCookie = cookies.find((c) => c.trim().startsWith("sh_csrf="));
  return csrfCookie ? csrfCookie.split("=")[1].trim() : null;
}

/** Full page navigation. Next router.replace mishandles absolute URLs and can dump users on /. */
function go(path: string, delayMs = 0) {
  const run = () => {
    if (typeof window === "undefined") return;
    window.location.assign(path.startsWith("http") ? path : `${window.location.origin}${path}`);
  };
  if (delayMs > 0) window.setTimeout(run, delayMs);
  else run();
}

function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [status, setStatus] = useState("Processing Google sign in...");
  const ranRef = useRef(false);

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;

    // Production origin only. Never trust NEXT_PUBLIC_SITE_URL here:
    // that is how people got bounced to schoolpilot.vercel.app.
    const home = "https://schoolpilot-work.vercel.app";

    const handleCallback = async () => {
      // If this page was somehow served on a stale host, leave immediately.
      if (typeof window !== "undefined" && window.location.host !== "schoolpilot-work.vercel.app") {
        const qs = window.location.search || "";
        window.location.replace(`${home}/auth/callback${qs}`);
        return;
      }

      const supabase = createClient();
      const code = searchParams.get("code");
      const error = searchParams.get("error");
      const errorDescription = searchParams.get("error_description");

      if (error) {
        setStatus("Google sign in was cancelled or failed.");
        if (supabase) {
          try {
            await supabase.auth.signOut();
          } catch {}
        }
        go(`${home}/login?error=${encodeURIComponent(errorDescription || error || "google_failed")}`, 1200);
        return;
      }

      if (!supabase) {
        setStatus("Google sign in is not configured on this deployment.");
        go(`${home}/login`, 1200);
        return;
      }

      if (!code) {
        setStatus("No Google authorization code received.");
        go(`${home}/login?error=no_auth_code`, 1200);
        return;
      }

      setStatus("Completing sign in...");
      const { data: exchangeData, error: exchangeError } =
        await supabase.auth.exchangeCodeForSession(code);

      if (exchangeError || !exchangeData?.session) {
        setStatus("Google sign in failed. Please try again.");
        try {
          await supabase.auth.signOut();
        } catch {}
        go(`${home}/login?error=${encodeURIComponent(exchangeError?.message || "auth_failed")}`, 1200);
        return;
      }

      // Sync with SchoolPilot backend so HttpOnly cookies are set on THIS origin.
      setStatus("Opening your dashboard...");
      const accessToken = exchangeData.session.access_token;

      // Ask for a CSRF cookie first so the sync POST is not rejected.
      try {
        await fetch(`${API_URL}/api/auth/me`, { credentials: "include" });
      } catch {}

      try {
        const res = await fetch(`${API_URL}/api/auth/supabase-sync`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(getCsrfToken() ? { "x-csrf-token": getCsrfToken() as string } : {}),
          },
          credentials: "include",
          body: JSON.stringify({ accessToken }),
        });
        const data = await res.json().catch(() => ({ success: false }));

        if (!res.ok || !data?.success) {
          const msg =
            data?.error?.message ||
            "Google sign in failed. Please try email login or sign up first.";
          setStatus(msg);
          try {
            await supabase.auth.signOut();
          } catch {}
          go(`${home}/login?error=${encodeURIComponent(msg)}`, 1600);
          return;
        }

        const role = data.data?.user?.role;
        // The sync response carries the school at the top level. School roles
        // need one to reach a dashboard; a fresh Google signup has none.
        const hasSchool = !!data.data?.school;
        const needsSchool =
          !!role && ["TEACHER", "BURSAR", "PRINCIPAL", "STUDENT", "PARENT"].includes(role);

        if (!hasSchool && needsSchool) {
          setStatus("Almost there. Let's link you to your school...");
          go(`${home}/join-school`, 400);
          return;
        }

        const dest = role ? getDashboardRoute(role) : "/dashboard";
        const path = dest.startsWith("/") ? dest : `/${dest}`;
        setStatus("Signed in. Opening your dashboard...");
        // Hard navigation so HttpOnly cookies are present on the next page.
        go(`${home}${path}`, 400);
      } catch (err) {
        console.error("[Auth callback] backend sync failed:", err);
        setStatus("Could not finish signing in. Please try email login.");
        try {
          await supabase.auth.signOut();
        } catch {}
        go(`${home}/login?error=sync_failed`, 1500);
      }
    };

    handleCallback();
  }, [searchParams, router, user]);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        backgroundColor: "var(--bg)",
        padding: 24,
      }}
    >
      <div style={{ textAlign: "center", maxWidth: 360 }}>
        <div
          style={{
            width: 40,
            height: 40,
            border: "3px solid var(--brand)",
            borderTopColor: "transparent",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
            margin: "0 auto 16px",
          }}
        />
        <p style={{ color: "var(--text)", fontSize: 14, lineHeight: 1.5 }}>{status}</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "100vh",
          }}
        >
          <p>Loading...</p>
        </div>
      }
    >
      <CallbackHandler />
    </Suspense>
  );
}
