"use client";

import { useAuth } from "@/lib/auth/CookieAuthProvider";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";
import { getGrade } from "@/lib/utils";
import { motion } from "framer-motion";
import {
  Award, BookOpen, TrendingUp, TrendingDown, Minus,
  AlertCircle, Trophy, Target, BarChart3,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface SubjectResult {
  subjectName: string;
  caScore: number;
  examScore: number;
  totalScore: number;
  total?: number;
  grade?: string;
  remark?: string;
}

interface StudentData {
  subjectResults: SubjectResult[];
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function getGradeColor(score: number): { color: string; bg: string } {
  if (score >= 75) return { color: "var(--brand)", bg: "rgba(11,110,79,0.1)" };
  if (score >= 60) return { color: "#4a7fa5", bg: "rgba(74,127,165,0.1)" };
  if (score >= 50) return { color: "#b45309", bg: "rgba(245,158,11,0.1)" };
  if (score >= 40) return { color: "#c2410c", bg: "rgba(194,65,12,0.1)" };
  return { color: "#dc2626", bg: "rgba(220,38,38,0.1)" };
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

export default function StudentResultsPage() {
  const { user } = useAuth();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: queryKeys.dashboard.stats("student-results"),
    queryFn: () => api.get<StudentData>("/api/dashboard/student"),
    staleTime: 30_000,
  });

  const results = data?.subjectResults || [];

  /* ---- Computed stats ---- */
  const overallAvg = results.length
    ? Math.round(results.reduce((s, r) => s + (r.totalScore ?? r.total ?? 0), 0) / results.length)
    : 0;

  const highest = results.length
    ? Math.max(...results.map((r) => r.totalScore ?? r.total ?? 0))
    : 0;

  const lowest = results.length
    ? Math.min(...results.map((r) => r.totalScore ?? r.total ?? 0))
    : 0;

  const bestSubject = results.find(
    (r) => (r.totalScore ?? r.total ?? 0) === highest
  );
  const worstSubject = results.find(
    (r) => (r.totalScore ?? r.total ?? 0) === lowest
  );

  /* ---- Loading skeleton ---- */
  if (isLoading) {
    return (
      <div style={{ maxWidth: 800, margin: "0 auto" }} className="space-y-6">
        <div>
          <div className="skeleton h-8 w-48 mb-2" />
          <div className="skeleton h-4 w-64" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton h-20 w-full rounded-xl" />
          ))}
        </div>
        <div className="space-y-3 mt-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton h-14 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  /* ---- Error state ---- */
  if (isError) {
    return (
      <div style={{ maxWidth: 800, margin: "0 auto" }} className="text-center py-20">
        <div style={{ width: 56, height: 56, borderRadius: 16, background: "rgba(244,63,94,0.1)", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
          <AlertCircle style={{ width: 28, height: 28, color: "#f43f5e" }} />
        </div>
        <p style={{ fontSize: 15, color: "var(--body-color)", fontFamily: "var(--font-sans)" }}>
          {(error as Error)?.message || "Failed to load results."}
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
      {/* ── Header ──────────────────────────────────────────── */}
      <motion.div variants={fadeUp}>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(1.25rem, 3vw, 1.75rem)", fontWeight: 600, color: "var(--heading-color)" }}>
          My Results
        </h1>
        <p style={{ fontSize: 13, color: "var(--body-color)", fontFamily: "var(--font-sans)", marginTop: 4 }}>
          Your academic performance across all subjects
        </p>
      </motion.div>

      {/* ── Summary stats cards ─────────────────────────────── */}
      <motion.div variants={fadeUp} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Overall average */}
        <div
          style={{
            background: results.length > 0
              ? `linear-gradient(135deg, ${getGradeColor(overallAvg).bg}, var(--card-bg))`
              : "var(--card-bg)",
            border: "1px solid var(--card-border)",
            borderRadius: 14,
            padding: 18,
            textAlign: "center",
          }}
        >
          <BarChart3 style={{ width: 18, height: 18, color: getGradeColor(overallAvg).color, margin: "0 auto 6px" }} />
          <p style={{ fontSize: 11, fontWeight: 600, color: "var(--muted-color)", fontFamily: "var(--font-sans)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>
            Overall Average
          </p>
          <p style={{ fontSize: 32, fontWeight: 800, fontFamily: "var(--font-sans)", color: getGradeColor(overallAvg).color, lineHeight: 1 }}>
            {overallAvg}%
          </p>
        </div>

        {/* Subjects count */}
        <div style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)", borderRadius: 14, padding: 18, textAlign: "center" }}>
          <BookOpen style={{ width: 18, height: 18, color: "var(--brand)", margin: "0 auto 6px" }} />
          <p style={{ fontSize: 11, fontWeight: 600, color: "var(--muted-color)", fontFamily: "var(--font-sans)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>
            Subjects
          </p>
          <p style={{ fontSize: 32, fontWeight: 800, fontFamily: "var(--font-sans)", color: "var(--brand)", lineHeight: 1 }}>
            {results.length}
          </p>
        </div>

        {/* Highest */}
        <div style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)", borderRadius: 14, padding: 18, textAlign: "center" }}>
          <Trophy style={{ width: 18, height: 18, color: "#f59e0b", margin: "0 auto 6px" }} />
          <p style={{ fontSize: 11, fontWeight: 600, color: "var(--muted-color)", fontFamily: "var(--font-sans)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>
            Highest
          </p>
          <p style={{ fontSize: 32, fontWeight: 800, fontFamily: "var(--font-sans)", color: "#f59e0b", lineHeight: 1 }}>
            {highest}%
          </p>
          {bestSubject && (
            <p style={{ fontSize: 10, color: "var(--muted-color)", fontFamily: "var(--font-sans)", marginTop: 4 }}>
              {bestSubject.subjectName}
            </p>
          )}
        </div>

        {/* Lowest */}
        <div style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)", borderRadius: 14, padding: 18, textAlign: "center" }}>
          <Target style={{ width: 18, height: 18, color: lowest >= 50 ? "#4a7fa5" : "#f43f5e", margin: "0 auto 6px" }} />
          <p style={{ fontSize: 11, fontWeight: 600, color: "var(--muted-color)", fontFamily: "var(--font-sans)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>
            Lowest
          </p>
          <p style={{ fontSize: 32, fontWeight: 800, fontFamily: "var(--font-sans)", color: lowest >= 50 ? "#4a7fa5" : "#f43f5e", lineHeight: 1 }}>
            {lowest}%
          </p>
          {worstSubject && (
            <p style={{ fontSize: 10, color: "var(--muted-color)", fontFamily: "var(--font-sans)", marginTop: 4 }}>
              {worstSubject.subjectName}
            </p>
          )}
        </div>
      </motion.div>

      {/* ── Results table ───────────────────────────────────── */}
      {results.length === 0 ? (
        <motion.div variants={fadeUp} style={{ textAlign: "center", padding: "64px 24px" }}>
          <Award style={{ width: 40, height: 40, color: "#c8d5cc", margin: "0 auto 16px" }} />
          <p style={{ fontSize: 15, color: "var(--muted-color)", fontFamily: "var(--font-sans)" }}>
            No results published yet.
          </p>
        </motion.div>
      ) : (
        <motion.section variants={fadeUp}>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 600, color: "var(--heading-color)", marginBottom: 14 }}>
            Subject Breakdown
          </h2>

          {/* Desktop table */}
          <div
            style={{
              background: "var(--card-bg)",
              border: "1px solid var(--card-border)",
              borderRadius: 16,
              overflow: "hidden",
            }}
            className="hidden sm:block"
          >
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, fontFamily: "var(--font-sans)" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--card-border)" }}>
                  {["Subject", "CA", "Exam", "Total", "Grade", "Remark"].map((h) => (
                    <th
                      key={h}
                      style={{
                        textAlign: h === "Subject" ? "left" : "center",
                        padding: "12px 14px",
                        fontSize: 11,
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        color: "var(--muted-color)",
                        borderBottom: "1px solid var(--card-border)",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {results.map((r, i) => {
                  const total = r.totalScore ?? r.total ?? 0;
                  const grade = getGrade(total);
                  const colors = getGradeColor(total);
                  const icon =
                    total >= 75 ? (
                      <TrendingUp style={{ width: 14, height: 14 }} />
                    ) : total >= 50 ? (
                      <Minus style={{ width: 14, height: 14 }} />
                    ) : (
                      <TrendingDown style={{ width: 14, height: 14 }} />
                    );

                  return (
                    <tr
                      key={i}
                      style={{
                        borderBottom: i < results.length - 1 ? "1px solid var(--card-border)" : "none",
                        transition: "background 0.1s ease",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(11,110,79,0.03)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <td style={{ padding: "12px 14px", fontWeight: 600, color: "var(--heading-color)" }}>
                        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <BookOpen style={{ width: 14, height: 14, color: "var(--brand)", flexShrink: 0 }} />
                          {r.subjectName}
                        </span>
                      </td>
                      <td style={{ textAlign: "center", padding: "12px 14px", color: "var(--body-color)" }}>
                        {r.caScore ?? "--"}
                      </td>
                      <td style={{ textAlign: "center", padding: "12px 14px", color: "var(--body-color)" }}>
                        {r.examScore ?? "--"}
                      </td>
                      <td style={{ textAlign: "center", padding: "12px 14px", fontWeight: 700, color: colors.color }}>
                        {total}
                      </td>
                      <td style={{ textAlign: "center", padding: "12px 14px" }}>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                            padding: "3px 10px",
                            borderRadius: 999,
                            fontSize: 12,
                            fontWeight: 600,
                            color: colors.color,
                            background: colors.bg,
                          }}
                        >
                          {icon} {grade.grade}
                        </span>
                      </td>
                      <td style={{ textAlign: "center", padding: "12px 14px", color: "var(--muted-color)", fontSize: 12 }}>
                        {grade.remark}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="space-y-3 sm:hidden">
            {results.map((r, i) => {
              const total = r.totalScore ?? r.total ?? 0;
              const grade = getGrade(total);
              const colors = getGradeColor(total);

              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  style={{
                    background: "var(--card-bg)",
                    border: "1px solid var(--card-border)",
                    borderRadius: 14,
                    padding: 14,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <BookOpen style={{ width: 16, height: 16, color: "var(--brand)" }} />
                      <span style={{ fontSize: 14, fontWeight: 600, fontFamily: "var(--font-sans)", color: "var(--heading-color)" }}>
                        {r.subjectName}
                      </span>
                    </div>
                    <span
                      style={{
                        padding: "3px 10px",
                        borderRadius: 999,
                        fontSize: 12,
                        fontWeight: 600,
                        fontFamily: "var(--font-sans)",
                        color: colors.color,
                        background: colors.bg,
                      }}
                    >
                      {grade.grade}
                    </span>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 8 }}>
                    {[
                      { label: "CA", value: r.caScore ?? "--" },
                      { label: "Exam", value: r.examScore ?? "--" },
                      { label: "Total", value: total },
                    ].map((item) => (
                      <div key={item.label} style={{ textAlign: "center" }}>
                        <p style={{ fontSize: 10, fontWeight: 500, color: "var(--muted-color)", fontFamily: "var(--font-sans)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                          {item.label}
                        </p>
                        <p
                          style={{
                            fontSize: 18,
                            fontWeight: 800,
                            fontFamily: "var(--font-sans)",
                            color: item.label === "Total" ? colors.color : "var(--heading-color)",
                          }}
                        >
                          {item.value}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Progress bar */}
                  <div style={{ width: "100%", height: 4, borderRadius: 99, background: "rgba(0,0,0,0.06)", overflow: "hidden" }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(total, 100)}%` }}
                      transition={{ delay: i * 0.05 + 0.2, duration: 0.5, ease: "easeOut" }}
                      style={{ height: "100%", borderRadius: 99, background: `linear-gradient(90deg, ${colors.color}, ${colors.color}cc)` }}
                    />
                  </div>

                  <p style={{ fontSize: 11, color: "var(--muted-color)", fontFamily: "var(--font-sans)", marginTop: 6, textAlign: "right" }}>
                    {grade.remark}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </motion.section>
      )}
    </motion.div>
  );
}
