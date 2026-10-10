"use client";

import { useAuth } from "@/lib/auth/CookieAuthProvider";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  GraduationCap,
  Loader2,
  CreditCard,
  Bell,
  ChevronRight,
  Calendar,
  BookOpen,
  CheckCircle,
  AlertCircle,
  Clock,
  Eye,
  Megaphone,
} from "lucide-react";
import { API_URL } from "@/lib/config";

interface ChildData {
  id: string;
  fullName: string;
  admissionNumber?: string;
  armName?: string;
  className?: string;
  results?: Array<{
    subject: string;
    total: number;
    grade?: string;
  }>;
  attendance?: {
    present: number;
    total: number;
    percentage: number;
  };
  fees?: {
    status: "cleared" | "partial" | "owed";
    amountDue?: number;
    amountPaid?: number;
  };
}

interface Notice {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  publishedAt?: string;
}

export default function ParentDashboard() {
  const { user } = useAuth();
  const [children, setChildren] = useState<ChildData[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const token =
          localStorage.getItem("schoolhub_token") ||
          sessionStorage.getItem("schoolhub_token");
  // cookie auth
        const [dashRes, noticesRes] = await Promise.all([
          fetch(`${API_URL}/api/dashboard/parent`, {
            credentials: "include",
          }),
          fetch(`${API_URL}/api/notices`, {
            credentials: "include",
          }).catch(() => null),
        ]);

        const dashData = await dashRes.json();
        if (dashData.success) {
          setChildren(dashData.data.children || []);
        }

        if (noticesRes) {
          const noticesData = await noticesRes.json();
          if (noticesData.success) {
            setNotices((noticesData.data || []).slice(0, 3));
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="text-center py-20">
        <Loader2
          className="w-8 h-8 animate-spin mx-auto"
          style={{ color: "var(--brand)" }}
        />
        <p
          className="mt-3 text-sm"
          style={{ color: "var(--body-color)", fontFamily: "var(--font-sans)" }}
        >
          Loading your dashboard...
        </p>
      </div>
    );
  }

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const firstName = user?.fullName?.split(" ")[0] || "Parent";

  return (
    <div
      className="space-y-8 animate-fade-in max-w-4xl mx-auto pb-8"
      style={{ fontFamily: "var(--font-sans)" }}
    >
      {/* Greeting */}
      <div>
        <h1
          className="text-2xl md:text-3xl font-semibold tracking-tight"
          style={{ fontFamily: "var(--font-display)", color: "var(--heading-color)" }}
        >
          {greeting()}, {firstName}
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--body-color)" }}>
          Here is a quick overview of your children&apos;s progress.
        </p>
      </div>

      {/* Children */}
      {children.length === 0 ? (
        <div
          className="text-center py-16 rounded-2xl border"
          style={{
            background: "var(--card-bg)",
            borderColor: "var(--card-border)",
          }}
        >
          <GraduationCap
            className="w-14 h-14 mx-auto mb-4"
            style={{ color: "#c8d5cc" }}
          />
          <p
            className="font-medium text-base"
            style={{ color: "var(--heading-color)" }}
          >
            No children linked yet
          </p>
          <p className="mt-1 text-sm" style={{ color: "var(--muted-color)" }}>
            Contact your child&apos;s school to link their profile to your account.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {children.map((child, idx) => (
            <ChildCard key={child.id} child={child} index={idx} />
          ))}
        </div>
      )}

      {/* Latest from School */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2
            className="text-lg font-semibold tracking-tight"
            style={{ fontFamily: "var(--font-display)", color: "var(--heading-color)" }}
          >
            Latest from School
          </h2>
          <Link
            href="/dashboard/parent/notices"
            className="text-sm font-medium flex items-center gap-1 hover:underline"
            style={{ color: "var(--brand)" }}
          >
            View all
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {notices.length === 0 ? (
          <div
            className="text-center py-10 rounded-2xl border"
            style={{
              background: "var(--card-bg)",
              borderColor: "var(--card-border)",
            }}
          >
            <Megaphone
              className="w-10 h-10 mx-auto mb-3"
              style={{ color: "#c8d5cc" }}
            />
            <p className="text-sm" style={{ color: "var(--muted-color)" }}>
              No notices at the moment.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {notices.map((notice) => (
              <div
                key={notice.id}
                className="rounded-2xl border p-4 md:p-5 transition-shadow hover:shadow-md"
                style={{
                  background: "var(--card-bg)",
                  borderColor: "var(--card-border)",
                }}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ background: "rgba(11, 110, 79, 0.08)" }}
                  >
                    <Bell className="w-4 h-4" style={{ color: "var(--brand)" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3
                      className="text-sm font-semibold"
                      style={{ color: "var(--heading-color)" }}
                    >
                      {notice.title}
                    </h3>
                    <p
                      className="text-xs mt-0.5 flex items-center gap-1"
                      style={{ color: "var(--muted-color)" }}
                    >
                      <Calendar className="w-3 h-3" />
                      {new Date(
                        notice.publishedAt || notice.createdAt
                      ).toLocaleDateString("en-NG", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                    <p
                      className="text-sm mt-2 line-clamp-2 leading-relaxed"
                      style={{ color: "var(--body-color)" }}
                    >
                      {notice.body}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div>
        <h2
          className="text-lg font-semibold tracking-tight mb-4"
          style={{ fontFamily: "var(--font-display)", color: "var(--heading-color)" }}
        >
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            href="/dashboard/parent/fees"
            className="group rounded-2xl border p-5 flex flex-col items-center gap-3 text-center transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
            style={{
              background: "var(--card-bg)",
              borderColor: "var(--card-border)",
            }}
          >
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105"
              style={{ background: "rgba(245, 158, 11, 0.1)" }}
            >
              <CreditCard className="w-5 h-5" style={{ color: "#f59e0b" }} />
            </div>
            <p
              className="text-sm font-medium"
              style={{ color: "var(--heading-color)" }}
            >
              Fee Status
            </p>
          </Link>
          <Link
            href="/dashboard/parent/notices"
            className="group rounded-2xl border p-5 flex flex-col items-center gap-3 text-center transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
            style={{
              background: "var(--card-bg)",
              borderColor: "var(--card-border)",
            }}
          >
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105"
              style={{ background: "rgba(11, 110, 79, 0.08)" }}
            >
              <Bell className="w-5 h-5" style={{ color: "var(--brand)" }} />
            </div>
            <p
              className="text-sm font-medium"
              style={{ color: "var(--heading-color)" }}
            >
              School Notices
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Child Card                                                         */
/* ------------------------------------------------------------------ */

function StatusLight({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: "green" | "amber" | "red";
}) {
  const colors = {
    green: { dot: "var(--brand)", bg: "rgba(11, 110, 79, 0.08)", text: "var(--brand)" },
    amber: { dot: "#f59e0b", bg: "rgba(245, 158, 11, 0.1)", text: "#92400e" },
    red: { dot: "#ef4444", bg: "rgba(239, 68, 68, 0.1)", text: "#dc2626" },
  };
  const c = colors[color];

  return (
    <div
      className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs"
      style={{ background: c.bg }}
    >
      <span
        className="w-2 h-2 rounded-full flex-shrink-0"
        style={{
          background: c.dot,
          boxShadow: `0 0 6px ${c.dot}40`,
          animation: "pulse-dot 2s ease-in-out infinite",
        }}
      />
      <span className="font-medium" style={{ color: c.text }}>
        {label}
      </span>
      <span style={{ color: c.text, opacity: 0.7 }}>{value}</span>
    </div>
  );
}

function ChildCard({ child, index }: { child: ChildData; index: number }) {
  const avgScore =
    child.results && child.results.length > 0
      ? Math.round(
          child.results.reduce((s, r) => s + r.total, 0) /
            child.results.length
        )
      : null;

  const attendancePct = child.attendance?.percentage ?? null;
  const feeStatus = child.fees?.status ?? null;

  const attendanceColor =
    attendancePct === null
      ? "amber"
      : attendancePct >= 75
        ? "green"
        : attendancePct >= 50
          ? "amber"
          : "red";

  const academicsColor =
    avgScore === null
      ? "amber"
      : avgScore >= 75
        ? "green"
        : avgScore >= 50
          ? "amber"
          : "red";

  const feesColor =
    feeStatus === "cleared"
      ? "green"
      : feeStatus === "partial"
        ? "amber"
        : "red";

  const feesLabel =
    feeStatus === "cleared"
      ? "Cleared"
      : feeStatus === "partial"
        ? "Partial"
        : feeStatus === "owed"
          ? "Owed"
          : "Unknown";

  const attendanceLabel =
    attendancePct !== null ? `${attendancePct}%` : "No data";
  const academicsLabel =
    avgScore !== null ? `Avg ${avgScore}%` : "No results";

  const initials = child.fullName
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      className="rounded-2xl border overflow-hidden transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
      style={{
        background:
          "linear-gradient(135deg, rgba(11,110,79,0.03) 0%, var(--card-bg) 40%)",
        borderColor: "var(--card-border)",
        animationDelay: `${index * 80}ms`,
      }}
    >
      {/* Child header */}
      <div className="p-5 pb-3">
        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{
              background:
                "linear-gradient(135deg, var(--brand) 0%, #12926a 100%)",
              boxShadow: "0 2px 8px rgba(11,110,79,0.25)",
            }}
          >
            <span
              className="text-lg font-bold"
              style={{
                color: "#ffffff",
                fontFamily: "var(--font-display)",
              }}
            >
              {initials || "?"}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <h3
              className="text-lg font-semibold truncate"
              style={{
                color: "var(--heading-color)",
                fontFamily: "var(--font-display)",
              }}
            >
              {child.fullName}
            </h3>
            <p className="text-xs mt-0.5" style={{ color: "var(--body-color)" }}>
              {child.className || child.armName || "Class"}{" "}
              {child.armName && child.className ? `· ${child.armName}` : ""}
              {child.admissionNumber && (
                <>
                  {" · "}
                  <span style={{ color: "var(--muted-color)" }}>
                    {child.admissionNumber}
                  </span>
                </>
              )}
            </p>
          </div>
        </div>

        {/* Status lights */}
        <div className="flex flex-wrap gap-2 mb-4">
          <StatusLight
            label="Attendance"
            value={attendanceLabel}
            color={attendanceColor}
          />
          <StatusLight
            label="Academics"
            value={academicsLabel}
            color={academicsColor}
          />
          <StatusLight label="Fees" value={feesLabel} color={feesColor} />
        </div>

        {/* Subject preview */}
        {child.results && child.results.length > 0 && (
          <div className="space-y-1.5">
            <p
              className="text-[10px] font-semibold uppercase tracking-widest"
              style={{ color: "var(--muted-color)" }}
            >
              Top Subjects
            </p>
            <div className="flex flex-wrap gap-1.5">
              {child.results.slice(0, 4).map((r, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-lg"
                  style={{
                    background:
                      r.total >= 75
                        ? "rgba(11,110,79,0.08)"
                        : r.total >= 50
                          ? "rgba(245,158,11,0.1)"
                          : "rgba(239,68,68,0.08)",
                    color:
                      r.total >= 75
                        ? "var(--brand)"
                        : r.total >= 50
                          ? "#92400e"
                          : "#dc2626",
                  }}
                >
                  <span className="font-medium">{r.subject}</span>
                  <span style={{ opacity: 0.7 }}>{r.total}%</span>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* View details button */}
      <div
        className="px-5 py-3 border-t"
        style={{ borderColor: "var(--card-border)" }}
      >
        <Link
          href={`/dashboard/parent`}
          className="inline-flex items-center gap-1.5 text-sm font-medium transition-colors hover:gap-2.5"
          style={{ color: "var(--sh-green-500)" }}
        >
          <Eye className="w-4 h-4" />
          View child
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
