"use client";

import { useAuth, getRoleRedirect } from "@/lib/auth/CookieAuthProvider";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";



export default function RoleGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
      return;
    }

    const role = user.role;
    const redirectPath = getRoleRedirect(role, pathname);
    if (redirectPath) {
      router.replace(redirectPath);
    }
  }, [user, loading, pathname, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[var(--bg)]">
        <div className="text-center space-y-4">
          <div className="w-10 h-10 border-4 border-sh-green-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-gray-500 font-sans">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return <>{children}</>;
}
