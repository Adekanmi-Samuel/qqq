"use client";

import { useAuth } from "@/lib/auth/CookieAuthProvider";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";
import { getGrade } from "@/lib/utils";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Clock, BookOpen, AlertCircle, FileText,
  ChevronRight, CalendarDays, GraduationCap,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface SubjectResult {
  subjectName: string;
  subjectId?: string;
  caScore: number;
  examScore: number;
  total: number;
  grade?: string;
}

interface TimetableSlot {
  id: string;
  time: string;
  subject: string;
  teacher?: string;
}

interface Assignment {
  id: string;
  title: string;
  subject: string;
  dueDate: string;
  status?: string;
}

interface StudentDashboardData {
  fullName: string;
  admissionNumber: string;
  className?: string;
  armName?: string;
  subjectResults: SubjectResult[];
  todaySchedule: TimetableSlot[];
  pendingAssignments?: Assignment[];
  notices?: Array<{ id: string; title: string; createdAt: string }>;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function getFirstName(fullName: string): string {
  return fullName?.split(" ")[0] || "Student";
}

/* ------------------------------------------------------------------ */
/*  Subject emoji map                                                  */
/* ------------------------------------------------------------------ */

const SUBJECT_EMOJI: Record<string, string> = {
  mathematics: "🧮",
  math: "🧮",
  english: "📖",
  englishlanguage: "📖",
  science: "🧬",
  biology: "🧬",
  chemistry: "🧪",
  physics: "⚛️",
  socialstudies: "🌍",
  civic: "🌍",
  history: "🏛️",
  fineart: "🎨",
  art: "🎨",
  music: "🎵",
  ict: "💻",
  computerstudies: "💻",
  homeeconomics: "🍳",
  agriculturalscience: "🌾",
  french: "🇫🇷",
  yoruba: "🇾🇹",
  igbo: "🇳🇬",
  hausaa: "🇳🇵",
  literature: "📚",
  crs: "✝️",
  basictech: "🔧",
  default: "📚",
};

function getSubjectEmoji(subjectName: string): string {
  const key = subjectName.toLowerCase().replace(/[\s-]/g, "");
  return SUBJECT_EMOJI[key] || SUBJECT_EMOJI.default;
}

/* ------------------------------------------------------------------ */
/*  Grade color helper                                                 */
/* ------------------------------------------------------------------ */

function getGradeColor(score: number): { color: string; bg: string } {
  if (score >= 75) return { color: "var(--brand)", bg: "rgba(11,110,79,0.1)" };
  if (score >= 60) return { color: "#4a7fa5", bg: "rgba(74,127,165,0.1)" };
  if (score >= 50) return { color: "#b45309", bg: "rgba(245,158,11,0.1)" };
  if (score >= 40) return { color: "#c2410c", bg: "rgba(194,65,12,0.1)" };
  return { color: "#dc2626", bg: "rgba(220,38,38,0.1)" };
}

function formatNigerianDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/* ------------------------------------------------------------------ */
/*  Animation variants                                                 */
/* ------------------------------------------------------------------ */

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } },
};

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function StudentDashboard() {
  const { user } = useAuth();

  /* ---- Fetch dashboard data ---- */
  const { data, isLoading, isError } = useQuery({
    queryKey: queryKeys.dashboard.stats("student"),
    queryFn: () => api.get<StudentDashboardData>("/api/dashboard/student"),
    staleTime: 30_000,
  });

  const firstName = getFirstName(data?.fullName || user?.fullName || "Student");

  /* ---- Compute average ---- */
  const averageScore =
    data?.subjectResults && data.subjectResults.length > 0
      ? Math.round(data.subjectResults.reduce((s, r) => s + r.total, 0) / data.subjectResults.length)
      : 0;

  /* ---- Loading skeleton ---- */
  if (isLoading) {
    return (
      <div style={{ maxWidth: 800, margin: "0 auto" }} className="space-y-6">
        <div>
          <div className="skeleton h-12 w-56 mb-2" />
          <div className="skeleton h-4 w-40" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton h-36 w-full rounded-xl" />
          ))}
        </div>
        <div className="space-y-3 mt-8">
          {[1, 2].map((i) => (
            <div key={i} className="skeleton h-16 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  /* ---- Error state ---- */
  if (isError || !data) {
    return (
      <div style={{ maxWidth: 800, margin: "0 auto" }} className="text-center py-20">
        <div style={{ width: 56, height: 56, borderRadius: 16, background: "rgba(244,63,94,0.1)", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
          <AlertCircle style={{ width: 28, height: 28, color: "#f43f5e" }} />
        </div>
        <p style={{ fontSize: 15, color: "var(--body-color)", fontFamily: "var(--font-sans)" }}>
          Could not load student data. Please try again.
        </p>
      </div>
    );
  }

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
      style={{ maxWidth: 800, margin: "0 auto" }}
      className="space-y-8"
    >
      {/* ── Greeting ─────────────────────────────────────────── */}
      <motion.div variants={fadeUp}>
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(1.75rem, 5vw, 2.25rem)",
            fontWeight: 600,
            color: "var(--heading-color)",
            lineHeight: 1.15,
          }}
        >
          Hi {firstName} {"👋"}
        </h1>
        {data.className && (
          <p
            style={{
              fontSize: 14,
              color: "var(--body-color)",
              fontFamily: "var(--font-sans)",
              marginTop: 8,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <GraduationCap style={{ width: 15, height: 15 }} />
            {data.className}
            {data.armName ? ` - ${data.armName}` : ""}
            {data.admissionNumber ? (
              <span style={{ color: "var(--muted-color)", marginLeft: 4 }}>
                ({data.admissionNumber})
              </span>
            ) : null}
          </p>
        )}
        <p
          style={{
            fontSize: 13,
            color: "var(--muted-color)",
            fontFamily: "var(--font-sans)",
            marginTop: 4,
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <CalendarDays style={{ width: 13, height: 13 }} />
          {new Date().toLocaleDateString("en-NG", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>
      </motion.div>

      {/* ── SUBJECT CARDS GRID ───────────────────────────────── */}
      {data.subjectResults && data.subjectResults.length > 0 && (
        <motion.section variants={fadeUp}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 600, color: "var(--heading-color)" }}>
              My Subjects
            </h2>
            {averageScore > 0 && (
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  fontFamily: "var(--font-sans)",
                  color: getGradeColor(averageScore).color,
                  background: getGradeColor(averageScore).bg,
                  padding: "3px 10px",
                  borderRadius: 999,
                }}
              >
                Avg: {averageScore}%
              </span>
            )}
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))",
              gap: 12,
            }}
          >
            {data.subjectResults.map((subject, i) => {
              const grade = getGrade(subject.total);
              const colors = getGradeColor(subject.total);
              const emoji = getSubjectEmoji(subject.subjectName);

              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05, type: "spring" as const, stiffness: 300 }}
                  whileHover={{ y: -3, scale: 1.02 }}
                  style={{
                    background: "var(--card-bg)",
                    border: "1px solid var(--card-border)",
                    borderRadius: 16,
                    padding: 16,
                    position: "relative",
                    overflow: "hidden",
                    cursor: "pointer",
                  }}
                >
                  {/* Subtle pattern */}
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      opacity: 0.03,
                      backgroundImage: "radial-gradient(circle at 2px 2px, black 1px, transparent 0)",
                      backgroundSize: "16px 16px",
                      pointerEvents: "none",
                    }}
                  />

                  {/* Emoji */}
                  <div style={{ fontSize: 28, marginBottom: 8, lineHeight: 1 }}>
                    {emoji}
                  </div>

                  {/* Subject name */}
                  <p
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: "var(--body-color)",
                      fontFamily: "var(--font-sans)",
                      marginBottom: 6,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {subject.subjectName}
                  </p>

                  {/* Score */}
                  <p
                    style={{
                      fontSize: 28,
                      fontWeight: 800,
                      fontFamily: "var(--font-sans)",
                      color: colors.color,
                      lineHeight: 1,
                      marginBottom: 4,
                    }}
                  >
                    {subject.total}
                  </p>

                  {/* Grade badge */}
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      fontSize: 11,
                      fontWeight: 700,
                      fontFamily: "var(--font-sans)",
                      color: colors.color,
                      background: colors.bg,
                      padding: "2px 8px",
                      borderRadius: 6,
                      marginBottom: 8,
                    }}
                  >
                    {grade.grade} - {grade.remark}
                  </div>

                  {/* Progress bar */}
                  <div
                    style={{
                      width: "100%",
                      height: 4,
                      borderRadius: 99,
                      background: "rgba(0,0,0,0.06)",
                      overflow: "hidden",
                    }}
                  >
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(subject.total, 100)}%` }}
                      transition={{ delay: i * 0.05 + 0.3, duration: 0.6, ease: "easeOut" }}
                      style={{
                        height: "100%",
                        borderRadius: 99,
                        background: `linear-gradient(90deg, ${colors.color}, ${colors.color}cc)`,
                      }}
                    />
                  </div>

                  {/* CA / Exam */}
                  <p style={{ fontSize: 10, color: "var(--muted-color)", fontFamily: "var(--font-sans)", marginTop: 6 }}>
                    CA: {subject.caScore} / Exam: {subject.examScore}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </motion.section>
      )}

      {/* ── TODAY section ────────────────────────────────────── */}
      {data.todaySchedule && data.todaySchedule.length > 0 && (
        <motion.section variants={fadeUp}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 8,
                background: "rgba(11,110,79,0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Clock style={{ width: 14, height: 14, color: "var(--brand)" }} />
            </div>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 600, color: "var(--heading-color)" }}>
              Today
            </h2>
          </div>

          <div className="space-y-2">
            {data.todaySchedule.map((cls, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "12px 14px",
                  borderRadius: 12,
                  background: "var(--card-bg)",
                  border: "1px solid var(--card-border)",
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: "rgba(11,110,79,0.06)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 18,
                    flexShrink: 0,
                  }}
                >
                  {getSubjectEmoji(cls.subject)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 600, fontFamily: "var(--font-sans)", color: "var(--heading-color)" }}>
                    {cls.subject}
                  </p>
                  <p style={{ fontSize: 12, color: "var(--muted-color)", fontFamily: "var(--font-sans)" }}>
                    {cls.time}
                    {cls.teacher ? ` - ${cls.teacher}` : ""}
                  </p>
                </div>
                <ChevronRight style={{ width: 16, height: 16, color: "#c8d5cc", flexShrink: 0 }} />
              </motion.div>
            ))}
          </div>
        </motion.section>
      )}

      {/* ── DUE SOON section ─────────────────────────────────── */}
      {data.pendingAssignments && data.pendingAssignments.length > 0 && (
        <motion.section variants={fadeUp}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 8,
                background: "rgba(245,158,11,0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <FileText style={{ width: 14, height: 14, color: "#f59e0b" }} />
            </div>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 600, color: "var(--heading-color)" }}>
              Due Soon
            </h2>
          </div>

          <div className="space-y-2">
            {data.pendingAssignments.map((assignment, i) => (
              <motion.div
                key={assignment.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "12px 14px",
                  borderRadius: 12,
                  background: "rgba(245,158,11,0.03)",
                  border: "1px solid rgba(245,158,11,0.12)",
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: "rgba(245,158,11,0.1)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <FileText style={{ width: 16, height: 16, color: "#f59e0b" }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 600, fontFamily: "var(--font-sans)", color: "var(--heading-color)" }}>
                    {assignment.title}
                  </p>
                  <p style={{ fontSize: 12, color: "var(--muted-color)", fontFamily: "var(--font-sans)" }}>
                    {assignment.subject} - Due {formatNigerianDate(assignment.dueDate)}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>
      )}

      {/* ── Empty state when no data at all ──────────────────── */}
      {data.subjectResults.length === 0 && (!data.todaySchedule || data.todaySchedule.length === 0) && (
        <motion.div variants={fadeUp} style={{ textAlign: "center", padding: "48px 24px" }}>
          <BookOpen style={{ width: 40, height: 40, color: "#c8d5cc", margin: "0 auto 16px" }} />
          <p style={{ fontSize: 15, color: "var(--muted-color)", fontFamily: "var(--font-sans)" }}>
            Welcome to your dashboard. Your results and schedule will appear here.
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}
