"use client";

import { useAuth, getDashboardRoute } from "@/lib/auth/CookieAuthProvider";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import WheelIcon from "@/components/WheelIcon";

export default function DashboardIndex() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      const route = getDashboardRoute(user.role);
      router.replace(route);
    }
  }, [user, loading, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-theme-page">
      <div className="text-center">
        <div className="mx-auto mb-4 animate-pulse">
          <WheelIcon size={48} variant="light" />
        </div>
        <p className="text-sm text-theme-muted font-sans">Redirecting you to your dashboard...</p>
      </div>
    </div>
  );
}
