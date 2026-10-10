"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth/CookieAuthProvider";

/**
 * Checks whether the current user has completed onboarding.
 *
 * - If the user is not logged in, does nothing (let auth middleware handle it).
 * - If the user is logged in but has no school set up, redirects to /onboarding.
 * - If the user has a school, allows access.
 *
 * Usage: call this hook at the top of any page/layout that should gate
 * behind onboarding completion (e.g., the dashboard layout).
 */
export function useOnboardingStatus() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (loading) return;

    // Not logged in -- let auth guards handle redirect
    if (!user) {
      setChecked(true);
      return;
    }

    // Already on onboarding page -- don't redirect
    if (pathname.startsWith("/onboarding")) {
      setChecked(true);
      return;
    }

    // Check if onboarding is needed:
    // A user without a school (schoolId is null/undefined) needs onboarding.
    // Also check localStorage for explicit onboarding completion flag.
    const hasSchool = !!user.schoolId;
    const onboardingComplete = localStorage.getItem("schoolhub_onboarding_complete") === "true";

    if (!hasSchool && !onboardingComplete) {
      router.replace("/onboarding");
      return;
    }

    setChecked(true);
  }, [user, loading, router, pathname]);

  return { checked, loading };
}

/**
 * Mark onboarding as complete in localStorage.
 * Call this when the user finishes the onboarding wizard.
 */
export function markOnboardingComplete() {
  localStorage.setItem("schoolhub_onboarding_complete", "true");
}

/**
 * Clear onboarding completion status.
 * Useful for testing or if a user needs to redo onboarding.
 */
export function clearOnboardingStatus() {
  localStorage.removeItem("schoolhub_onboarding_complete");
  localStorage.removeItem("schoolhub_onboarding_progress");
}
