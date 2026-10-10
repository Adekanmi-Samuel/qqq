"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth/CookieAuthProvider";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Building2, Users, GraduationCap, DollarSign, CreditCard, Settings,
  School, AlertTriangle, Loader2,
} from "lucide-react";
import { API_URL } from "@/lib/config";


interface PlatformStats {
  totalSchools: number;
  activeSchools: number;
  pendingSchools: number;
  totalStudents: number;
  totalStaff: number;
  totalRevenue: number;
  recentSchools: Array<{
    id: string;
    name: string;
    slug: string;
    status: string;
    planType: string;
    createdAt: string;
  }>;
}

export default function PlatformOverviewPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user || user.role !== "SUPER_ADMIN") {
      router.push("/dashboard/admin");
      return;
    }
    fetchStats();
  }, [user]);

  const getAuthHeaders = (): Record<string, string> => ({});

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/platform/stats`, {
        credentials: "include",
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        setStats(data.data);
      } else {
        setError(data.error || "Failed to load stats");
      }
    } catch (err) {
      setError("Could not connect to server");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-[var(--color-warning)] animate-spin mx-auto mb-4" />
          <p className="text-[var(--text-muted)]">Loading platform data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-[var(--color-danger)] mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-[var(--text)] mb-2">Connection Error</h2>
          <p className="text-[var(--text-muted)] mb-4">{error}</p>
          <button onClick={fetchStats} className="px-4 py-2 bg-[var(--color-warning)] text-white rounded-lg hover:opacity-90">
            Retry
          </button>
        </div>
      </div>
    );
  }

  const kpiCards = [
    {
      label: "Total Schools",
      value: stats?.totalSchools || 0,
      sub: `${stats?.activeSchools || 0} active · ${stats?.pendingSchools || 0} pending`,
      icon: <School className="w-6 h-6" />,
      bg: "bg-blue-500/10",
      textColor: "text-blue-500",
    },
    {
      label: "Active Students",
      value: stats?.totalStudents || 0,
      sub: "Across all schools",
      icon: <Users className="w-6 h-6" />,
      bg: "bg-emerald-500/10",
      textColor: "text-emerald-500",
    },
    {
      label: "Total Staff",
      value: stats?.totalStaff || 0,
      sub: "Teachers & administrators",
      icon: <GraduationCap className="w-6 h-6" />,
      bg: "bg-purple-500/10",
      textColor: "text-purple-500",
    },
    {
      label: "Platform Revenue",
      value: `₦${(stats?.totalRevenue || 0).toLocaleString()}`,
      sub: "From portal fees & subscriptions",
      icon: <DollarSign className="w-6 h-6" />,
      bg: "bg-[var(--color-warning)]/10",
      textColor: "text-[var(--color-warning)]",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--text)]">Platform Overview</h1>
        <p className="text-[var(--text-muted)] mt-1">Super Admin dashboard for managing all schools on SchoolPilot.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((card) => (
          <div key={card.label} className="bg-[var(--surface)] rounded-xl border border-[var(--border)] p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className={`p-2.5 rounded-lg ${card.bg}`}>
                <div className={card.textColor}>{card.icon}</div>
              </div>
            </div>
            <p className="text-sm text-[var(--text-muted)] font-medium">{card.label}</p>
            <p className="text-2xl font-bold text-[var(--text)] mt-1">{card.value}</p>
            <p className="text-xs text-[var(--text-muted)]/60 mt-1">{card.sub}</p>
          </div>
        ))}
      </div>

      {/* Recent Schools */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-[var(--text)]">Recent Registrations</h2>
            <Link href="/dashboard/platform/schools" className="text-sm text-[var(--color-warning)] hover:opacity-80 font-medium">
              View all
            </Link>
          </div>
          <div className="space-y-3">
            {stats?.recentSchools?.map((school) => (
              <div key={school.id} className="flex items-center justify-between py-2 border-b border-[var(--border)] last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[var(--surface-2)] flex items-center justify-center">
                    <Building2 className="w-4 h-4 text-[var(--text-muted)]" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[var(--text)]">{school.name}</p>
                    <p className="text-xs text-[var(--text-muted)]">
                      {new Date(school.createdAt).toLocaleDateString()} · {school.planType}
                    </p>
                  </div>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  school.status === "ACTIVE" ? "bg-emerald-500/10 text-emerald-500" :
                  school.status === "SUSPENDED" ? "bg-[var(--color-danger)]/10 text-[var(--color-danger)]" :
                  "bg-[var(--color-warning)]/10 text-[var(--color-warning)]"
                }`}>
                  {school.status}
                </span>
              </div>
            ))}
            {(!stats?.recentSchools || stats.recentSchools.length === 0) && (
              <p className="text-sm text-[var(--text-muted)] text-center py-4">No schools registered yet</p>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] p-6">
          <h2 className="text-lg font-semibold text-[var(--text)] mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <Link
              href="/dashboard/platform/schools"
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-[var(--surface-2)] transition-colors border border-[var(--border)]"
            >
              <div className="p-2 rounded-lg bg-blue-500/10"><Building2 className="w-5 h-5 text-blue-500" /></div>
              <div>
                <p className="text-sm font-medium text-[var(--text)]">School Directory</p>
                <p className="text-xs text-[var(--text-muted)]">View, verify, and manage all schools</p>
              </div>
            </Link>
            <Link
              href="/dashboard/platform/plans"
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-[var(--surface-2)] transition-colors border border-[var(--border)]"
            >
              <div className="p-2 rounded-lg bg-purple-500/10"><CreditCard className="w-5 h-5 text-purple-500" /></div>
              <div>
                <p className="text-sm font-medium text-[var(--text)]">Subscription Plans</p>
                <p className="text-xs text-[var(--text-muted)]">Manage pricing and plan features</p>
              </div>
            </Link>
            <Link
              href="/dashboard/platform/settings"
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-[var(--surface-2)] transition-colors border border-[var(--border)]"
            >
              <div className="p-2 rounded-lg bg-[var(--color-warning)]/10"><Settings className="w-5 h-5 text-[var(--color-warning)]" /></div>
              <div>
                <p className="text-sm font-medium text-[var(--text)]">Platform Settings</p>
                <p className="text-xs text-[var(--text-muted)]">Configure portal fees, email and in-app alerts, and maintenance mode</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
