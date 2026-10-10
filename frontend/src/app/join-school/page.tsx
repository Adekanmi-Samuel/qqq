"use client";

import { useState, useEffect, ChangeEvent, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { UserCheck, ArrowRight, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth, getDashboardRoute } from "@/lib/auth/CookieAuthProvider";
import { supportWhatsAppUrl } from "@/lib/constants";

interface JoinResult {
  user: { id: string; fullName: string; email: string; role: string };
  school: { id: string; name: string; slug: string } | null;
}

export default function JoinSchoolPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [inviteCode, setInviteCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Already belongs to a school: send them to their dashboard.
  useEffect(() => {
    if (!authLoading && user?.schoolId) {
      router.replace(getDashboardRoute(user.role));
    }
  }, [authLoading, user, router]);

  function handleCodeChange(e: ChangeEvent<HTMLInputElement>) {
    let val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "");
    // Keep the SH- prefix as the user types, matching the staff signup field.
    if (val.startsWith("SH") && val.length > 2 && val[2] !== "-") {
      val = "SH-" + val.slice(2);
    }
    setInviteCode(val);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    const cleaned = inviteCode.replace(/^(SH-|sh-)/i, "").trim().toUpperCase();
    if (cleaned.length < 4) {
      setError("Enter the invite code from your school (for example SH-A1B2C3).");
      return;
    }

    setSubmitting(true);
    try {
      const code = `SH-${cleaned}`;
      const result = await api.post<JoinResult>("/api/auth/join-school", { inviteCode: code });

      // Role and school changed, so use a hard navigation: the auth provider
      // re-reads the session on mount and picks up the new role.
      const dest = result?.user?.role ? getDashboardRoute(result.user.role as any) : "/dashboard";
      window.location.assign(dest);
    } catch (err: any) {
      const msg = err?.message || "We could not verify that invite code. Please check it and try again.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  if (authLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto py-10 px-4">
      <div className="text-center mb-8">
        <div className="w-12 h-12 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center mx-auto mb-4">
          <UserCheck className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Join your school</h1>
        <p className="text-sm text-gray-500">
          {user?.fullName ? `Welcome, ${user.fullName}. ` : ""}
          Enter the invite code your school shared with you to open your dashboard.
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="mb-4 text-sm rounded-lg border border-red-200 bg-red-50 text-red-700 px-4 py-3"
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div>
          <label htmlFor="inviteCode" className="label">Invite code</label>
          <input
            id="inviteCode"
            name="inviteCode"
            type="text"
            inputMode="text"
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            className="input-field text-center tracking-widest uppercase"
            placeholder="SH-A1B2C3"
            value={inviteCode}
            onChange={handleCodeChange}
            disabled={submitting}
            required
          />
          <p className="text-xs text-gray-400 mt-1">
            Ask your school admin for this code if you do not have one.
          </p>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="btn-primary w-full inline-flex items-center justify-center gap-2"
        >
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Checking code...
            </>
          ) : (
            <>
              Join school
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      <div className="mt-6 text-center text-sm text-gray-500">
        Wrong account?{" "}
        <a href="/login" className="text-brand-600 hover:underline">
          Sign in with a different email
        </a>
      </div>

      <div className="mt-3 text-center text-xs text-gray-400">
        Need help?{" "}
        <a
          href={supportWhatsAppUrl("Hi, I need help joining my school on SchoolPilot")}
          target="_blank"
          rel="noopener noreferrer"
          className="text-brand-600 hover:underline"
        >
          Contact support
        </a>
      </div>
    </div>
  );
}
