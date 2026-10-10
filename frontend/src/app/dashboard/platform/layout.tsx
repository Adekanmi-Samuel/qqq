"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth/CookieAuthProvider";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Building2, Users, CreditCard, Settings,
  ChevronRight, Activity, Menu, X, ShieldCheck,
} from "lucide-react";
import WheelIcon from "@/components/WheelIcon";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

export default function PlatformLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems: NavItem[] = [
    { href: "/dashboard/platform", label: "Overview", icon: <LayoutDashboard className="w-5 h-5" /> },
    { href: "/dashboard/platform/schools", label: "Schools", icon: <Building2 className="w-5 h-5" /> },
    { href: "/dashboard/platform/users", label: "Users", icon: <Users className="w-5 h-5" /> },
    { href: "/dashboard/platform/plans", label: "Plans & Billing", icon: <CreditCard className="w-5 h-5" /> },
    { href: "/dashboard/platform/settings", label: "Platform Settings", icon: <Settings className="w-5 h-5" /> },
    { href: "/dashboard/platform/audit", label: "Audit Logs", icon: <Activity className="w-5 h-5" /> },
    { href: "/dashboard/admin", label: "Back to School", icon: <ChevronRight className="w-5 h-5 rotate-180" /> },
  ];

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <div className="space-y-6">
      <div className="relative">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 mr-2 md:mr-4 shrink-0">
            <WheelIcon size={32} variant="light" />
            <span className="text-sm font-semibold text-[var(--text)] flex items-center gap-1">
              Platform Admin
              <ShieldCheck className="w-4 h-4 text-emerald-500" aria-label="Superadmin" />
            </span>
          </div>

          <div className="hidden md:flex items-center gap-1 flex-wrap">
            {navItems.map((item) => {
              const isActive = item.href === "/dashboard/platform"
                ? pathname === "/dashboard/platform"
                : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? "bg-[var(--color-warning)]/10 text-[var(--color-warning)]"
                      : "text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)]"
                  }`}
                >
                  <span className="w-4 h-4">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden ml-auto p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)] transition-colors"
            aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {mobileOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 mt-2 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl shadow-lg z-40 overflow-hidden">
            <nav className="flex flex-col p-2" role="navigation" aria-label="Platform navigation">
              {navItems.map((item) => {
                const isActive = item.href === "/dashboard/platform"
                  ? pathname === "/dashboard/platform"
                  : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all min-h-[44px] ${
                      isActive
                        ? "bg-[var(--color-warning)]/10 text-[var(--color-warning)]"
                        : "text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)]"
                    }`}
                  >
                    <span className="w-5 h-5 shrink-0">{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        )}
      </div>

      {children}
    </div>
  );
}
