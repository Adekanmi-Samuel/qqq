"use client";

import { useAuth } from "@/lib/auth/CookieAuthProvider";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";
import { motion } from "framer-motion";
import Link from "next/link";
import { useMemo } from "react";
import {
  Clock, Users, ClipboardCheck, FileText,
  AlertCircle, CheckCircle, Bell, BookOpen,
  Loader2, ChevronRight, CalendarDays,
  Sparkles, ArrowRight,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface TimetableSlot {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  period?: number;
  subject: { id: string; name: string };
  class: { id: string; name: string };
  classArm: { id: string; name: string };
  attendanceMarked?: boolean;
}

interface NoticeItem {
  id: string;
  title: string;
  body?: string;
  createdAt: string;
}

interface DashboardData {
  teacherName?: string;
  todaySchedule: TimetableSlot[];
  pendingResultsCount: number;
  pendingHomeworkCount: number;
  unreadNoticesCount: number;
  myClassesCount: number;
  myStudentsCount: number;
  resultsPublishedCount: number;
  notices?: NoticeItem[];
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function formatNigerianDate(): string {
  return new Date().toLocaleDateString("en-NG", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function timeToMinutes(t: string): number {
  const [h, m] = String(t || "").split(":").map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return 0;
  return h * 60 + m;
}

function isSlotPast(endTime: string): boolean {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  return currentMinutes > timeToMinutes(endTime);
}

function isSlotCurrent(startTime: string, endTime: string): boolean {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  return currentMinutes >= timeToMinutes(startTime) && currentMinutes <= timeToMinutes(endTime);
}

function formatTime12(time24: string): string {
  const [h, m] = String(time24 || "").split(":");
  const hour = parseInt(h, 10);
  if (!Number.isFinite(hour)) return String(time24 || "");
  const ampm = hour >= 12 ? "PM" : "AM";
  const h12 = hour % 12 || 12;
  return `${h12}:${m || "00"} ${ampm}`;
}

function classLabel(slot: TimetableSlot): string {
  return `${slot.class?.name || "Class"}${slot.classArm?.name ? ` ${slot.classArm.name}` : ""}`;
}

/* ------------------------------------------------------------------ */
/*  Animation variants                                                 */
/* ------------------------------------------------------------------ */

const stagger = {
  hidden: { opacity: 1 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const fadeUp = {
  hidden: { opacity: 1, y: 0 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } },
};

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function TeacherDashboard() {
  const { user } = useAuth();

  const { data: dashData, isLoading: dashLoading, isError: dashError } = useQuery({
    queryKey: queryKeys.dashboard.stats("teacher"),
    queryFn: () => api.get<DashboardData>("/api/dashboard/teacher"),
    staleTime: 30_000,
  });

  const today = (new Date().getDay() + 6) % 7; // Monday=0
  const now = new Date();

  const todaySlots = useMemo(() => {
    const list = dashData?.todaySchedule || [];
    return [...list].sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
  }, [dashData]);

  const currentSlot = todaySlots.find((s) => isSlotCurrent(s.startTime, s.endTime));
  const nextSlot = todaySlots.find((s) => !isSlotPast(s.endTime) && !isSlotCurrent(s.startTime, s.endTime));
  const focusSlot = currentSlot || nextSlot;

  const pendingItems: Array<{ icon: React.ReactNode; label: string; count: number; href: string }> = [];
  if (dashData && dashData.pendingResultsCount > 0) {
    pendingItems.push({
      icon: <FileText className="w-4 h-4" />,
      label: "Results pending entry",
      count: dashData.pendingResultsCount,
      href: "/dashboard/teacher/results",
    });
  }
  if (dashData && dashData.unreadNoticesCount > 0) {
    pendingItems.push({
      icon: <Bell className="w-4 h-4" />,
      label: "School notices",
      count: dashData.unreadNoticesCount,
      href: "/dashboard/teacher/notices",
    });
  }
  if (dashData && dashData.myClassesCount > 0) {
    pendingItems.push({
      icon: <BookOpen className="w-4 h-4" />,
      label: "My classes",
      count: dashData.myClassesCount,
      href: "/dashboard/teacher/classes",
    });
  }
  if (dashData && dashData.myStudentsCount > 0) {
    pendingItems.push({
      icon: <Users className="w-4 h-4" />,
      label: "My students",
      count: dashData.myStudentsCount,
      href: "/dashboard/teacher/classes",
    });
  }

  if (dashLoading) {
    return (
      <div style={{ maxWidth: 800, margin: "0 auto" }} className="space-y-6">
        <div className="skeleton h-10 w-56 mb-2" />
        <div className="skeleton h-4 w-40" />
        <div className="skeleton h-40 rounded-2xl" />
        <div className="skeleton h-28 rounded-2xl" />
        <div className="skeleton h-28 rounded-2xl" />
      </div>
    );
  }

  if (dashError) {
    return (
      <div style={{ maxWidth: 720, margin: "0 auto" }} className="text-center py-20">
        <AlertCircle className="w-10 h-10 mx-auto mb-3" style={{ color: "var(--color-danger, #f43f5e)" }} />
        <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>
          Failed to load your today workspace.
        </p>
        <button type="button" className="btn-primary" onClick={() => window.location.reload()}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
      style={{ maxWidth: 800, margin: "0 auto" }}
      className="space-y-6"
    >
      {/* Setup gate */}
      {dashData && dashData.myClassesCount === 0 && (
        <motion.section variants={fadeUp} className="sh-card p-6">
          <h2 className="text-base font-semibold mb-2" style={{ color: "var(--heading-color)" }}>
            Set up your teaching
          </h2>
          <p className="text-sm mb-4" style={{ color: "var(--body-color)" }}>
            Select the classes and subjects you take. Then today&apos;s workspace will show your real periods.
          </p>
          <div className="flex flex-wrap gap-2">
            <Link href="/dashboard/teacher/setup" className="btn-primary inline-flex px-4 py-2">
              Complete setup
            </Link>
            <Link href="/dashboard/teacher/attendance" className="btn-secondary inline-flex px-4 py-2">
              Open attendance
            </Link>
          </div>
        </motion.section>
      )}

      {/* Greeting */}
      <motion.div variants={fadeUp}>
        <h1
          className="font-semibold"
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(1.4rem, 4vw, 1.9rem)",
            color: "var(--heading-color)",
            lineHeight: 1.2,
          }}
        >
          {getGreeting()}, {user?.fullName?.split(" ")[0] || "Teacher"}
        </h1>
        <p
          className="flex items-center gap-2 mt-1"
          style={{ fontFamily: "var(--font-sans)", fontSize: 14, color: "var(--body-color)" }}
        >
          <CalendarDays size={14} />
          {formatNigerianDate()}
        </p>
      </motion.div>

      {/* Focus card: current or next class */}
      {focusSlot && (
        <motion.section variants={fadeUp}>
          <div
            className="sh-card"
            style={{
              padding: 20,
              border: isSlotCurrent(focusSlot.startTime, focusSlot.endTime)
                ? "1.5px solid var(--brand)"
                : "1px solid var(--card-border)",
            }}
          >
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div style={{ minWidth: 0 }}>
                <div className="flex items-center gap-2 mb-2">
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      letterSpacing: "0.04em",
                      textTransform: "uppercase",
                      color: isSlotCurrent(focusSlot.startTime, focusSlot.endTime)
                        ? "var(--brand)"
                        : "var(--body-color)",
                    }}
                  >
                    {isSlotCurrent(focusSlot.startTime, focusSlot.endTime) ? "Happening now" : "Up next"}
                  </span>
                  <span style={{ fontSize: 12, color: "var(--muted-color)" }}>
                    {formatTime12(focusSlot.startTime)} – {formatTime12(focusSlot.endTime)}
                  </span>
                </div>
                <h2
                  className="font-semibold"
                  style={{ fontFamily: "var(--font-display)", fontSize: 22, color: "var(--heading-color)" }}
                >
                  {focusSlot.subject?.name || "Subject"}
                </h2>
                <p className="text-sm mt-1" style={{ color: "var(--body-color)" }}>
                  {classLabel(focusSlot)}
                </p>
              </div>
              <div className="flex flex-col gap-2" style={{ minWidth: 160 }}>
                <Link
                  href={`/dashboard/teacher/attendance?armId=${focusSlot.classArm?.id || ""}&slotId=${focusSlot.id || ""}`}
                  className="btn-primary inline-flex justify-center items-center gap-2 px-4 py-2.5"
                  style={{ minHeight: 44, textDecoration: "none", fontWeight: 600 }}
                >
                  <ClipboardCheck size={16} />
                  {focusSlot.attendanceMarked ? "View attendance" : "Mark attendance"}
                </Link>
                <div className="flex gap-2">
                  <Link
                    href="/dashboard/teacher/lesson-notes"
                    className="btn-secondary inline-flex justify-center items-center gap-1.5 px-3 py-2 flex-1"
                    style={{ minHeight: 40, textDecoration: "none", fontSize: 12 }}
                  >
                    <Sparkles size={14} />
                    Lesson notes
                  </Link>
                  <Link
                    href="/dashboard/teacher/results"
                    className="btn-secondary inline-flex justify-center items-center gap-1.5 px-3 py-2 flex-1"
                    style={{ minHeight: 40, textDecoration: "none", fontSize: 12 }}
                  >
                    <FileText size={14} />
                    Results
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </motion.section>
      )}

      {/* Pending strip */}
      {pendingItems.length > 0 && (
        <motion.section variants={fadeUp}>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {pendingItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="sh-card"
                style={{
                  padding: 14,
                  textDecoration: "none",
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                }}
              >
                <div className="flex items-center justify-between">
                  <span style={{ color: "var(--body-color)" }}>{item.icon}</span>
                  <span
                    className="font-semibold"
                    style={{ fontSize: 20, color: "var(--heading-color)", lineHeight: 1 }}
                  >
                    {item.count}
                  </span>
                </div>
                <span style={{ fontSize: 12, color: "var(--body-color)", lineHeight: 1.3 }}>
                  {item.label}
                </span>
              </Link>
            ))}
          </div>
        </motion.section>
      )}

      {/* Today's classes */}
      <motion.section variants={fadeUp}>
        <div className="flex items-center gap-2 mb-4">
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 10,
              background: "var(--surface-2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Clock size={16} style={{ color: "var(--body-color)" }} />
          </div>
          <h2 className="text-base font-semibold" style={{ color: "var(--heading-color)" }}>
            Today&apos;s classes
          </h2>
          <span
            className="ml-auto text-xs font-medium"
            style={{ color: "var(--body-color)", border: "1px solid var(--card-border)", padding: "2px 10px", borderRadius: 999 }}
          >
            {todaySlots.length} {todaySlots.length === 1 ? "period" : "periods"}
          </span>
        </div>

        {todaySlots.length === 0 ? (
          <div
            className="sh-card"
            style={{ padding: "40px 20px", textAlign: "center" }}
          >
            <CalendarDays size={32} style={{ color: "var(--muted-color)", margin: "0 auto 10px" }} />
            <p className="text-sm" style={{ color: "var(--muted-color)" }}>
              No classes scheduled for today.
            </p>
            <Link
              href="/dashboard/teacher/classes"
              className="btn-secondary inline-flex mt-4 px-4 py-2"
              style={{ textDecoration: "none" }}
            >
              View my classes
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {todaySlots.map((slot, i) => {
              const past = isSlotPast(slot.endTime);
              const current = isSlotCurrent(slot.startTime, slot.endTime);
              return (
                <motion.div
                  key={slot.id}
                  initial={{ opacity: 1, y: 0 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="sh-card"
                  style={{
                    padding: 16,
                    border: current ? "1.5px solid var(--brand)" : "1px solid var(--card-border)",
                    opacity: past ? 0.75 : 1,
                  }}
                >
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span style={{ fontSize: 12, fontWeight: 600, color: "var(--body-color)" }}>
                          {formatTime12(slot.startTime)} – {formatTime12(slot.endTime)}
                        </span>
                        {past && (
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 600,
                              color: "var(--brand)",
                              border: "1px solid var(--card-border)",
                              padding: "1px 8px",
                              borderRadius: 999,
                            }}
                          >
                            Done
                          </span>
                        )}
                        {current && (
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 600,
                              color: "var(--brand)",
                              border: "1px solid var(--brand)",
                              padding: "1px 8px",
                              borderRadius: 999,
                            }}
                          >
                            Now
                          </span>
                        )}
                        {slot.attendanceMarked && (
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 600,
                              color: "var(--body-color)",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
                            }}
                          >
                            <CheckCircle size={12} style={{ color: "var(--brand)" }} />
                            Marked
                          </span>
                        )}
                      </div>
                      <p className="font-semibold" style={{ fontSize: 15, color: "var(--heading-color)" }}>
                        {slot.subject?.name || "Subject"}
                      </p>
                      <p className="text-sm" style={{ color: "var(--body-color)" }}>
                        {classLabel(slot)}
                      </p>
                    </div>
                    <div className="flex flex-col gap-2" style={{ minWidth: 148 }}>
                      <Link
                        href={`/dashboard/teacher/attendance?armId=${slot.classArm?.id || ""}&slotId=${slot.id || ""}`}
                        className="btn-primary inline-flex justify-center items-center gap-2 px-3 py-2"
                        style={{
                          minHeight: 40,
                          textDecoration: "none",
                          fontWeight: 600,
                          fontSize: 13,
                          background: past ? "transparent" : undefined,
                          color: past ? "var(--brand)" : undefined,
                          border: past ? "1px solid var(--card-border)" : undefined,
                        }}
                      >
                        <ClipboardCheck size={14} />
                        {slot.attendanceMarked ? "Attendance" : "Mark attendance"}
                      </Link>
                      <div className="flex gap-2">
                        <Link
                          href="/dashboard/teacher/lesson-notes"
                          className="btn-secondary inline-flex justify-center items-center gap-1 px-2.5 py-1.5 flex-1"
                          style={{ minHeight: 36, textDecoration: "none", fontSize: 11 }}
                        >
                          <Sparkles size={12} />
                          Notes
                        </Link>
                        <Link
                          href="/dashboard/teacher/results"
                          className="btn-secondary inline-flex justify-center items-center gap-1 px-2.5 py-1.5 flex-1"
                          style={{ minHeight: 36, textDecoration: "none", fontSize: 11 }}
                        >
                          <FileText size={12} />
                          Results
                        </Link>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.section>

      {/* Notices */}
      {dashData?.notices && dashData.notices.length > 0 && (
        <motion.section variants={fadeUp}>
          <div className="flex items-center gap-2 mb-3">
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 10,
                background: "var(--surface-2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Bell size={16} style={{ color: "var(--body-color)" }} />
            </div>
            <h2 className="text-base font-semibold" style={{ color: "var(--heading-color)" }}>
              Latest notices
            </h2>
            <Link
              href="/dashboard/teacher/notices"
              className="ml-auto text-sm inline-flex items-center gap-1"
              style={{ color: "var(--body-color)", textDecoration: "none" }}
            >
              View all
              <ArrowRight size={14} />
            </Link>
          </div>
          <div className="space-y-2">
            {dashData.notices.slice(0, 3).map((n) => (
              <div key={n.id} className="sh-card" style={{ padding: 14 }}>
                <p className="font-medium text-sm" style={{ color: "var(--heading-color)" }}>
                  {n.title}
                </p>
                {n.body && (
                  <p className="text-sm mt-1" style={{ color: "var(--body-color)", lineHeight: 1.5 }}>
                    {n.body.length > 140 ? `${n.body.slice(0, 140)}…` : n.body}
                  </p>
                )}
                <p className="text-xs mt-2" style={{ color: "var(--muted-color)" }}>
                  {new Date(n.createdAt).toLocaleDateString("en-NG", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              </div>
            ))}
          </div>
        </motion.section>
      )}

      {/* Quick links */}
      <motion.section variants={fadeUp}>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Link href="/dashboard/teacher/attendance" className="sh-card" style={{ padding: 14, textDecoration: "none" }}>
            <ClipboardCheck size={18} style={{ color: "var(--body-color)", marginBottom: 8 }} />
            <p className="text-sm font-medium" style={{ color: "var(--heading-color)" }}>Attendance</p>
          </Link>
          <Link href="/dashboard/teacher/lesson-notes" className="sh-card" style={{ padding: 14, textDecoration: "none" }}>
            <Sparkles size={18} style={{ color: "var(--body-color)", marginBottom: 8 }} />
            <p className="text-sm font-medium" style={{ color: "var(--heading-color)" }}>Lesson notes</p>
          </Link>
          <Link href="/dashboard/teacher/results" className="sh-card" style={{ padding: 14, textDecoration: "none" }}>
            <FileText size={18} style={{ color: "var(--body-color)", marginBottom: 8 }} />
            <p className="text-sm font-medium" style={{ color: "var(--heading-color)" }}>Results</p>
          </Link>
          <Link href="/dashboard/teacher/classes" className="sh-card" style={{ padding: 14, textDecoration: "none" }}>
            <Users size={18} style={{ color: "var(--body-color)", marginBottom: 8 }} />
            <p className="text-sm font-medium" style={{ color: "var(--heading-color)" }}>My classes</p>
          </Link>
        </div>
      </motion.section>
    </motion.div>
  );
}
