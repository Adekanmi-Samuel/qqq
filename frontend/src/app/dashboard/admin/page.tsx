"use client";

import { useAuth } from "@/lib/auth/CookieAuthProvider";
import { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, GraduationCap, DollarSign, ClipboardCheck, Bell,
  TrendingUp, TrendingDown, AlertTriangle, UserCog, FileText,
  Sparkles, UserPlus, BookOpen, BarChart3, ArrowRight, Clock,
  Activity, ChevronRight, Loader2,
} from "lucide-react";
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { API_URL } from "@/lib/config";

/* ================================================================== */
/*  Types                                                              */
/* ================================================================== */

interface DashboardData {
  totalStudents: number;
  totalStaff: number;
  activeClasses: number;
  feeCollectionRate: number;
  attendanceRate: number;
  totalFeesCollected: number;
  totalFeesExpected: number;
  newStudentsThisTerm: number;
  staffOnDuty: number;
  noticesThisTerm: number;
  resultPublicationRate: number;
  recentActivity: ActivityEvent[];
  attendanceHistory: AttendanceDay[];
}

interface ActivityEvent {
  id: string;
  type: string;
  message: string;
  timestamp: string;
  icon?: string;
}

interface AttendanceDay {
  date: string;
  rate: number;
  label: string;
}

interface SessionInfo {
  termName: string;
  academicYear: string;
}

/* ================================================================== */
/*  Helpers                                                            */
/* ================================================================== */

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function formatTimeAgo(timestamp: string): string {
  const now = Date.now();
  const then = new Date(timestamp).getTime();
  const diff = now - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function getHealthColor(score: number): string {
  if (score > 75) return "#0b6e4f";
  if (score >= 50) return "#f59e0b";
  return "#dc2626";
}

function getHealthLabel(score: number): string {
  if (score >= 80) return "Excellent";
  if (score >= 65) return "Good";
  if (score >= 50) return "Fair";
  return "Needs attention";
}

/* ================================================================== */
/*  Skeleton Components                                                */
/* ================================================================== */

function OverviewSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Header skeleton */}
      <div className="space-y-3">
        <div className="skeleton h-8 w-72 rounded-lg" />
        <div className="skeleton h-4 w-48 rounded-lg" />
      </div>
      {/* Health + Stats skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-1 skeleton h-64 rounded-2xl" />
        <div className="lg:col-span-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton h-36 rounded-xl" />
          ))}
        </div>
      </div>
      {/* Chart skeleton */}
      <div className="skeleton h-64 rounded-2xl" />
      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="skeleton h-80 rounded-2xl" />
        <div className="skeleton h-80 rounded-2xl" />
      </div>
    </div>
  );
}

/* ================================================================== */
/*  Health Score Widget (200px circular SVG gauge)                      */
/* ================================================================== */

function HealthScoreGauge({ score }: { score: number }) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const color = getHealthColor(score);
  const radius = 85;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (animatedScore / 100) * circumference;

  useEffect(() => {
    let start: number;
    const duration = 1400;
    const animate = (now: number) => {
      if (!start) start = now;
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      setAnimatedScore(Math.round(eased * score));
      if (progress < 1) requestAnimationFrame(animate);
    };
    const raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [score]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring" as const, stiffness: 200, damping: 20, delay: 0.2 }}
      className="sh-card flex flex-col items-center justify-center p-6 text-center"
      style={{ minHeight: 280 }}
    >
      <p
        style={{
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "var(--text-muted)",
          fontFamily: "var(--font-sans)",
          marginBottom: 20,
        }}
      >
        School Health Score
      </p>

      <div style={{ position: "relative", width: 200, height: 200 }}>
        <svg
          width="200"
          height="200"
          viewBox="0 0 200 200"
          style={{ transform: "rotate(-90deg)" }}
        >
          {/* Track */}
          <circle
            cx="100"
            cy="100"
            r={radius}
            fill="none"
            stroke="var(--border)"
            strokeWidth="12"
          />
          {/* Animated arc */}
          <circle
            cx="100"
            cy="100"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            style={{
              transition: "stroke-dashoffset 0.05s linear",
              filter: `drop-shadow(0 0 8px ${color}44)`,
            }}
          />
        </svg>

        {/* Center content */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span
            className="sh-numeral"
            style={{ fontSize: 48, color, lineHeight: 1 }}
          >
            {animatedScore}
          </span>
          <span
            style={{
              fontSize: 12,
              fontWeight: 500,
              color: "var(--text-muted)",
              fontFamily: "var(--font-sans)",
              marginTop: 4,
            }}
          >
            out of 100
          </span>
        </div>
      </div>

      {/* Breakdown dots */}
      <div
        style={{
          display: "flex",
          gap: 4,
          marginTop: 16,
          marginBottom: 8,
        }}
      >
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              background:
                i <= Math.round(score / 20) ? color : "var(--border)",
              transition: "background 0.4s ease",
            }}
          />
        ))}
      </div>

      <p
        style={{
          fontSize: 13,
          fontWeight: 600,
          color,
          fontFamily: "var(--font-sans)",
          marginTop: 4,
        }}
      >
        {getHealthLabel(score)}
      </p>

      {/* Weighting note */}
      <p
        style={{
          fontSize: 10,
          color: "var(--text-muted)",
          fontFamily: "var(--font-sans)",
          marginTop: 8,
          lineHeight: 1.4,
        }}
      >
        Attendance 40% + Fees 30% + Results 30%
      </p>
    </motion.div>
  );
}

/* ================================================================== */
/*  Stat Tile                                                          */
/* ================================================================== */

function DashStatTile({
  label,
  value,
  icon,
  delay = 0,
  accentColor = "var(--brand)",
  sub,
  trend,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  delay?: number;
  accentColor?: string;
  sub?: string;
  trend?: "up" | "down" | "neutral";
}) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => {
      const duration = 1200;
      const start = performance.now();
      const tick = (now: number) => {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 4);
        setDisplay(Math.round(eased * value));
        if (progress < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, delay);
    return () => clearTimeout(t);
  }, [value, delay]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        type: "spring" as const,
        stiffness: 300,
        damping: 28,
        delay: delay / 1000,
      }}
      whileHover={{ y: -3 }}
      className="sh-card"
      style={{
        position: "relative",
        overflow: "hidden",
        padding: "20px 22px",
        cursor: "default",
      }}
    >
      {/* Top accent bar */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 2,
          background: `linear-gradient(90deg, ${accentColor}, ${accentColor}66)`,
          borderRadius: "16px 16px 0 0",
        }}
      />

      {/* Corner glow */}
      <div
        style={{
          position: "absolute",
          top: -24,
          right: -24,
          width: 80,
          height: 80,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${accentColor}18 0%, transparent 70%)`,
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 14,
        }}
      >
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            color: "var(--text-muted)",
            fontFamily: "var(--font-sans)",
          }}
        >
          {label}
        </span>
        <div
          style={{
            width: 30,
            height: 30,
            borderRadius: 8,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: `${accentColor}1f`,
            color: accentColor,
            fontSize: 14,
            lineHeight: 1,
          }}
        >
          {icon}
        </div>
      </div>

      <p
        className="sh-numeral"
        style={{
          fontSize: 36,
          color: "var(--heading-color)",
          margin: 0,
          marginBottom: sub ? 6 : 0,
        }}
      >
        {display.toLocaleString()}
      </p>

      {sub && (
        <p
          style={{
            margin: 0,
            fontSize: 12,
            color: "var(--text-muted)",
            fontFamily: "var(--font-sans)",
            lineHeight: 1.4,
          }}
        >
          {sub}
        </p>
      )}

      {trend && (
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            marginTop: 8,
            padding: "3px 10px",
            borderRadius: 9999,
            background:
              trend === "up"
                ? "rgba(11,110,79,0.10)"
                : trend === "down"
                ? "rgba(220,38,38,0.10)"
                : "rgba(107,124,114,0.10)",
            color:
              trend === "up"
                ? "var(--brand)"
                : trend === "down"
                ? "#dc2626"
                : "var(--body-color)",
            fontSize: 12,
            fontWeight: 600,
            fontFamily: "var(--font-sans)",
            lineHeight: 1.3,
          }}
        >
          {trend === "up" && <TrendingUp style={{ fontSize: 13 }} />}
          {trend === "down" && <TrendingDown style={{ fontSize: 13 }} />}
          {trend === "neutral" && (
            <span style={{ fontSize: 13 }}>&rarr;</span>
          )}
          {sub}
        </div>
      )}
    </motion.div>
  );
}

/* ================================================================== */
/*  Attendance Chart (inline SVG bar chart, last 7 school days)        */
/* ================================================================== */

function AttendanceChart({ days }: { days: AttendanceDay[] }) {
  const chartData = days.length > 0 ? days : generatePlaceholderDays();
  const maxRate = 100;
  const barWidth = 36;
  const gap = 12;
  const chartHeight = 200;
  const totalWidth = chartData.length * (barWidth + gap) - gap;
  const svgWidth = Math.max(totalWidth + 60, 400);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6, duration: 0.5 }}
      className="sh-card"
      style={{ padding: "24px 28px", overflow: "hidden" }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 24,
        }}
      >
        <div>
          <h3
            style={{
              fontSize: 16,
              fontWeight: 600,
              color: "var(--heading-color)",
              fontFamily: "var(--font-display)",
              margin: 0,
            }}
          >
            Attendance Trend
          </h3>
          <p
            style={{
              fontSize: 12,
              color: "var(--text-muted)",
              fontFamily: "var(--font-sans)",
              marginTop: 2,
            }}
          >
            Last {chartData.length} school days
          </p>
        </div>
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: 3,
                background: "#0b6e4f",
              }}
            />
            <span
              style={{
                fontSize: 11,
                color: "var(--text-muted)",
                fontFamily: "var(--font-sans)",
              }}
            >
              80%+
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: 3,
                background: "#f59e0b",
              }}
            />
            <span
              style={{
                fontSize: 11,
                color: "var(--text-muted)",
                fontFamily: "var(--font-sans)",
              }}
            >
              Below 80%
            </span>
          </div>
        </div>
      </div>

      <div style={{ overflowX: "auto", paddingBottom: 8 }}>
        <svg
          width={svgWidth}
          height={chartHeight + 50}
          viewBox={`0 0 ${svgWidth} ${chartHeight + 50}`}
          style={{ display: "block" }}
        >
          {/* Y-axis labels */}
          {[0, 25, 50, 75, 100].map((val) => {
            const y = chartHeight - (val / maxRate) * chartHeight + 10;
            return (
              <g key={val}>
                <text
                  x="20"
                  y={y + 4}
                  textAnchor="end"
                  style={{
                    fontSize: 10,
                    fill: "var(--text-muted)",
                    fontFamily: "var(--font-sans)",
                  }}
                >
                  {val}%
                </text>
                <line
                  x1="28"
                  y1={y}
                  x2={svgWidth - 10}
                  y2={y}
                  stroke="var(--border)"
                  strokeWidth="1"
                  strokeDasharray="4,4"
                />
              </g>
            );
          })}

          {/* 80% reference line */}
          <line
            x1="28"
            y1={chartHeight - (80 / maxRate) * chartHeight + 10}
            x2={svgWidth - 10}
            y2={chartHeight - (80 / maxRate) * chartHeight + 10}
            stroke="#f59e0b"
            strokeWidth="1.5"
            strokeDasharray="6,3"
            opacity={0.5}
          />

          {/* Bars */}
          {chartData.map((day, i) => {
            const x = 40 + i * (barWidth + gap);
            const barH = Math.max((day.rate / maxRate) * chartHeight, 4);
            const y = chartHeight - barH + 10;
            const color = day.rate >= 80 ? "#0b6e4f" : "#f59e0b";

            return (
              <g key={i}>
                {/* Bar with animation */}
                <motion.rect
                  x={x}
                  y={y}
                  width={barWidth}
                  rx={6}
                  ry={6}
                  fill={color}
                  initial={{ height: 0, y: chartHeight + 10 }}
                  animate={{ height: barH, y }}
                  transition={{
                    delay: 0.8 + i * 0.08,
                    duration: 0.6,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  style={{ filter: `drop-shadow(0 2px 4px ${color}33)` }}
                />
                {/* Value label */}
                <motion.text
                  x={x + barWidth / 2}
                  y={y - 8}
                  textAnchor="middle"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.0 + i * 0.08 }}
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    fill: color,
                    fontFamily: "var(--font-sans)",
                  }}
                >
                  {day.rate}%
                </motion.text>
                {/* Day label */}
                <text
                  x={x + barWidth / 2}
                  y={chartHeight + 30}
                  textAnchor="middle"
                  style={{
                    fontSize: 10,
                    fill: "var(--text-muted)",
                    fontFamily: "var(--font-sans)",
                  }}
                >
                  {day.label}
                </text>
                {/* Date */}
                <text
                  x={x + barWidth / 2}
                  y={chartHeight + 44}
                  textAnchor="middle"
                  style={{
                    fontSize: 9,
                    fill: "var(--text-muted)",
                    fontFamily: "var(--font-sans)",
                    opacity: 0.7,
                  }}
                >
                  {new Date(day.date).toLocaleDateString("en-NG", {
                    month: "short",
                    day: "numeric",
                  })}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </motion.div>
  );
}

function generatePlaceholderDays(): AttendanceDay[] {
  const days: AttendanceDay[] = [];
  const today = new Date();
  let count = 0;
  let d = new Date(today);

  while (count < 7) {
    const dow = d.getDay();
    if (dow !== 0 && dow !== 6) {
      days.unshift({
        date: d.toISOString().split("T")[0],
        rate: 75 + Math.floor(Math.random() * 20),
        label: d.toLocaleDateString("en-NG", { weekday: "short" }),
      });
      count++;
    }
    d.setDate(d.getDate() - 1);
  }
  return days;
}

/* ================================================================== */
/*  Activity Feed                                                      */
/* ================================================================== */

function ActivityFeed({ events }: { events: ActivityEvent[] }) {
  const iconMap: Record<string, React.ReactNode> = {
    attendance: <ClipboardCheck style={{ width: 16, height: 16 }} />,
    result: <FileText style={{ width: 16, height: 16 }} />,
    notice: <Bell style={{ width: 16, height: 16 }} />,
    student: <Users style={{ width: 16, height: 16 }} />,
    fee: <DollarSign style={{ width: 16, height: 16 }} />,
    staff: <UserCog style={{ width: 16, height: 16 }} />,
    default: <Activity style={{ width: 16, height: 16 }} />,
  };

  const colorMap: Record<string, string> = {
    attendance: "var(--brand)",
    result: "#38bdf8",
    notice: "#f59e0b",
    student: "var(--brand)",
    fee: "#f59e0b",
    staff: "var(--body-color)",
    default: "var(--brand)",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.7, duration: 0.5 }}
      className="sh-card"
      style={{ padding: 0, overflow: "hidden" }}
    >
      <div
        style={{
          padding: "20px 24px 12px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Clock style={{ width: 16, height: 16, color: "var(--brand)" }} />
          <h3
            style={{
              fontSize: 16,
              fontWeight: 600,
              color: "var(--heading-color)",
              fontFamily: "var(--font-display)",
              margin: 0,
            }}
          >
            Recent Activity
          </h3>
        </div>
        {events.length > 0 && (
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: "var(--brand)",
              background: "rgba(11,110,79,0.10)",
              padding: "2px 10px",
              borderRadius: 9999,
              fontFamily: "var(--font-sans)",
            }}
          >
            {events.length} events
          </span>
        )}
      </div>

      {events.length === 0 ? (
        <div
          style={{
            padding: "40px 24px",
            textAlign: "center",
            color: "var(--text-muted)",
            fontFamily: "var(--font-sans)",
            fontSize: 13,
          }}
        >
          <Activity
            style={{
              width: 32,
              height: 32,
              margin: "0 auto 12px",
              opacity: 0.4,
            }}
          />
          No recent activity yet.
        </div>
      ) : (
        <div>
          {events.slice(0, 10).map((event, i) => {
            const type = event.type || "default";
            return (
              <motion.div
                key={event.id || i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8 + i * 0.05 }}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 12,
                  padding: "12px 24px",
                  borderTop: i > 0 ? "1px solid var(--border)" : "none",
                  transition: "background 0.15s ease",
                  cursor: "default",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "var(--surface-2)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "transparent")
                }
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: `${colorMap[type] || colorMap.default}14`,
                    color: colorMap[type] || colorMap.default,
                    flexShrink: 0,
                  }}
                >
                  {iconMap[type] || iconMap.default}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p
                    style={{
                      fontSize: 13,
                      color: "var(--text)",
                      fontFamily: "var(--font-sans)",
                      lineHeight: 1.4,
                      margin: 0,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {event.message}
                  </p>
                  <p
                    style={{
                      fontSize: 11,
                      color: "var(--text-muted)",
                      fontFamily: "var(--font-sans)",
                      margin: "2px 0 0",
                    }}
                  >
                    {formatTimeAgo(event.timestamp)}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}

/* ================================================================== */
/*  Quick Actions Grid (2x3)                                           */
/* ================================================================== */

const QUICK_ACTIONS = [
  {
    href: "/dashboard/admin/attendance",
    icon: <ClipboardCheck style={{ width: 22, height: 22 }} />,
    label: "Mark Attendance",
    accent: "#0b6e4f",
  },
  {
    href: "/dashboard/admin/results",
    icon: <FileText style={{ width: 22, height: 22 }} />,
    label: "Enter Results",
    accent: "#0b6e4f",
  },
  {
    href: "/dashboard/admin/reports",
    icon: <BarChart3 style={{ width: 22, height: 22 }} />,
    label: "Report Cards",
    accent: "#0b6e4f",
  },
  {
    href: "/dashboard/admin/notices",
    icon: <Bell style={{ width: 22, height: 22 }} />,
    label: "Post Notice",
    accent: "#f59e0b",
  },
  {
    href: "/dashboard/admin/students",
    icon: <UserPlus style={{ width: 22, height: 22 }} />,
    label: "Add Student",
    accent: "#0b6e4f",
  },
  {
    href: "/dashboard/teacher/lesson-notes",
    icon: <Sparkles style={{ width: 22, height: 22 }} />,
    label: "AI Lesson Notes",
    accent: "#f59e0b",
  },
];

function QuickActionsGrid() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.5 }}
    >
      <h3
        style={{
          fontSize: 16,
          fontWeight: 600,
          color: "var(--heading-color)",
          fontFamily: "var(--font-display)",
          marginBottom: 16,
        }}
      >
        Quick Actions
      </h3>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: 12,
        }}
      >
        {QUICK_ACTIONS.map((action, i) => (
          <motion.div
            key={action.href}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 + i * 0.06 }}
          >
            <Link
              href={action.href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "14px 16px",
                background: "var(--card-bg)",
                border: "1px solid var(--card-border)",
                borderRadius: 12,
                textDecoration: "none",
                transition: "all 0.2s cubic-bezier(0.16,1,0.3,1)",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = action.accent;
                e.currentTarget.style.boxShadow = `0 0 0 1px ${action.accent}30, 0 4px 16px ${action.accent}18`;
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--card-border)";
                e.currentTarget.style.boxShadow = "none";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: `${action.accent}14`,
                  color: action.accent,
                  flexShrink: 0,
                }}
              >
                {action.icon}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: "var(--heading-color)",
                    fontFamily: "var(--font-sans)",
                    margin: 0,
                  }}
                >
                  {action.label}
                </p>
              </div>
              <ChevronRight
                style={{
                  width: 16,
                  height: 16,
                  color: "var(--text-muted)",
                  flexShrink: 0,
                }}
              />
            </Link>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

/* ================================================================== */
/*  Error State                                                        */
/* ================================================================== */

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        textAlign: "center",
        padding: "60px 24px",
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: "50%",
          background: "rgba(244,63,94,0.10)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 16px",
        }}
      >
        <AlertTriangle style={{ width: 28, height: 28, color: "#f43f5e" }} />
      </div>
      <h3
        style={{
          fontSize: 18,
          fontWeight: 600,
          color: "var(--heading-color)",
          fontFamily: "var(--font-display)",
          marginBottom: 8,
        }}
      >
        Failed to load dashboard
      </h3>
      <p
        style={{
          fontSize: 13,
          color: "var(--text-muted)",
          fontFamily: "var(--font-sans)",
          marginBottom: 20,
          maxWidth: 360,
          margin: "0 auto 20px",
        }}
      >
        {message || "An unexpected error occurred. Please try again."}
      </p>
      <button onClick={onRetry} className="btn btn-primary">
        Retry
      </button>
    </motion.div>
  );
}

/* ================================================================== */
/*  Enrollment Trend Chart (recharts LineChart)                         */
/* ================================================================== */

// Mock data   swap with API response when available
const ENROLLMENT_TREND_DATA = [
  { month: "Jul", students: 320 },
  { month: "Aug", students: 345 },
  { month: "Sep", students: 380 },
  { month: "Oct", students: 395 },
  { month: "Nov", students: 410 },
  { month: "Dec", students: 432 },
];

function EnrollmentTrendChart() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.9, duration: 0.5 }}
      className="sh-card"
      style={{ padding: "24px 28px" }}
    >
      <h3
        style={{
          fontSize: 16,
          fontWeight: 600,
          color: "var(--heading-color)",
          fontFamily: "var(--font-display)",
          margin: 0,
          marginBottom: 4,
        }}
      >
        Enrollment Trend
      </h3>
      <p
        style={{
          fontSize: 12,
          color: "var(--text-muted)",
          fontFamily: "var(--font-sans)",
          margin: 0,
          marginBottom: 20,
        }}
      >
        Student enrollment over the last 6 months
      </p>

      <ResponsiveContainer width="100%" height={260}>
        <AreaChart data={ENROLLMENT_TREND_DATA} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
          <defs>
            <linearGradient id="enrollmentGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#12926a" stopOpacity={0.28} />
              <stop offset="95%" stopColor="#12926a" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 12, fill: "var(--text-muted)", fontFamily: "var(--font-sans)" }}
            axisLine={{ stroke: "var(--border)" }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 12, fill: "var(--text-muted)", fontFamily: "var(--font-sans)" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              background: "var(--card-bg)",
              border: "1px solid var(--card-border)",
              borderRadius: 8,
              fontSize: 13,
              fontFamily: "var(--font-sans)",
              color: "var(--heading-color)",
              boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
            }}
            labelStyle={{ color: "var(--text-muted)", fontWeight: 600 }}
            formatter={(value) => [`${value} students`, "Enrolled"]}
          />
          <Area
            type="monotone"
            dataKey="students"
            stroke="#12926a"
            strokeWidth={2.5}
            fill="url(#enrollmentGradient)"
            dot={{ r: 4, fill: "#0b6e4f", strokeWidth: 2, stroke: "var(--card-bg)" }}
            activeDot={{ r: 6, fill: "#0b6e4f", stroke: "var(--card-bg)", strokeWidth: 2 }}
            animationDuration={1200}
          />
        </AreaChart>
      </ResponsiveContainer>
    </motion.div>
  );
}

/* ================================================================== */
/*  Fee Collection Chart (recharts BarChart)                            */
/* ================================================================== */

// Mock data   swap with API response when available
const FEE_COLLECTION_DATA = [
  { month: "Jul", collected: 2800000, projected: 3000000 },
  { month: "Aug", collected: 3100000, projected: 3200000 },
  { month: "Sep", collected: 2950000, projected: 3400000 },
  { month: "Oct", collected: 3400000, projected: 3500000 },
  { month: "Nov", collected: 3600000, projected: 3700000 },
  { month: "Dec", collected: 2500000, projected: 3800000 },
];

function formatFeeValue(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
  return String(value);
}

function FeeCollectionChart() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.0, duration: 0.5 }}
      className="sh-card"
      style={{ padding: "24px 28px" }}
    >
      <h3
        style={{
          fontSize: 16,
          fontWeight: 600,
          color: "var(--heading-color)",
          fontFamily: "var(--font-display)",
          margin: 0,
          marginBottom: 4,
        }}
      >
        Fee Collection
      </h3>
      <p
        style={{
          fontSize: 12,
          color: "var(--text-muted)",
          fontFamily: "var(--font-sans)",
          margin: 0,
          marginBottom: 20,
        }}
      >
        Monthly fee collection vs projection
      </p>

      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={FEE_COLLECTION_DATA} margin={{ top: 5, right: 10, left: -10, bottom: 0 }} barGap={4}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 12, fill: "var(--text-muted)", fontFamily: "var(--font-sans)" }}
            axisLine={{ stroke: "var(--border)" }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 12, fill: "var(--text-muted)", fontFamily: "var(--font-sans)" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={formatFeeValue}
          />
          <Tooltip
            contentStyle={{
              background: "var(--card-bg)",
              border: "1px solid var(--card-border)",
              borderRadius: 8,
              fontSize: 13,
              fontFamily: "var(--font-sans)",
              color: "var(--heading-color)",
              boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
            }}
            labelStyle={{ color: "var(--text-muted)", fontWeight: 600 }}
            formatter={(value, name) => [
              `₦${Number(value).toLocaleString()}`,
              name === "collected" ? "Collected" : "Projected",
            ]}
          />
          <Legend
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: 12, fontFamily: "var(--font-sans)", color: "var(--text-muted)" }}
          />
          <Bar
            dataKey="collected"
            name="Collected"
            fill="#12926a"
            radius={[4, 4, 0, 0]}
            maxBarSize={32}
            animationDuration={1200}
          />
          <Bar
            dataKey="projected"
            name="Projected"
            fill="#f59e0b"
            radius={[4, 4, 0, 0]}
            maxBarSize={32}
            opacity={0.55}
            animationDuration={1200}
          />
        </BarChart>
      </ResponsiveContainer>
    </motion.div>
  );
}

/* ================================================================== */
/*  Main Page Component                                                */
/* ================================================================== */

export default function AdminDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Cookie auth
      const headers = {};

      // Parallel fetch session + dashboard data
      const [sessionRes, dashRes] = await Promise.allSettled([
        fetch(`${API_URL}/api/schools/academic-calendar/current`, { headers, credentials: "include" }),
        fetch(`${API_URL}/api/dashboard/admin`, { headers, credentials: "include" }),
      ]);

      // Handle session
      if (sessionRes.status === "fulfilled" && sessionRes.value.ok) {
        const sData = await sessionRes.value.json();
        if (sData.success && sData.data) {
          setSession({
            termName: sData.data.termName,
            academicYear: sData.data.academicYear,
          });
        }
      }

      // Handle dashboard data
      if (dashRes.status === "fulfilled" && dashRes.value.ok) {
        const dData = await dashRes.value.json();
        if (dData.success) {
          const d = dData.data;
          setData({
            totalStudents: d.totalStudents ?? 0,
            totalStaff: d.totalStaff ?? 0,
            activeClasses: d.activeClasses ?? 0,
            feeCollectionRate: d.feeCollectionRate ?? 0,
            attendanceRate: d.attendanceRate ?? 0,
            totalFeesCollected: d.totalFeesCollected ?? 0,
            totalFeesExpected: d.totalFeesExpected ?? 0,
            newStudentsThisTerm: d.newStudentsThisTerm ?? 0,
            staffOnDuty: d.staffOnDuty ?? d.totalStaff ?? 0,
            noticesThisTerm: d.noticesThisTerm ?? 0,
            resultPublicationRate: d.resultPublicationRate ?? 75,
            recentActivity: d.recentActivity ?? [],
            attendanceHistory: d.attendanceHistory ?? [],
          });
        } else {
          setError(dData.error || "Failed to load dashboard data.");
        }
      } else {
        const reason =
          dashRes.status === "rejected" ? dashRes.reason : "Network error";
        setError(String(reason));
      }
    } catch (e: any) {
      setError(e.message || "Network error. Check your connection.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Compute health score: attendance 40% + fees 30% + results 30%
  const healthScore = useMemo(() => {
    if (!data) return 0;
    return Math.min(
      100,
      Math.round(
        data.attendanceRate * 0.4 +
          data.feeCollectionRate * 0.3 +
          data.resultPublicationRate * 0.3
      )
    );
  }, [data]);

  const firstName = user?.fullName?.split(" ")[0] || "Admin";
  const schoolName = user?.school?.name || "Your School";

  if (loading) {
    return <OverviewSkeleton />;
  }

  if (error && !data) {
    return <ErrorState message={error} onRetry={loadData} />;
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* ── Header ─────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div>
            <h1
              style={{
                fontSize: 28,
                fontWeight: 600,
                color: "var(--heading-color)",
                fontFamily: "var(--font-display)",
                margin: 0,
                lineHeight: 1.2,
              }}
            >
              {getGreeting()}, {firstName}
            </h1>
            <p
              style={{
                fontSize: 14,
                color: "var(--text-muted)",
                fontFamily: "var(--font-sans)",
                marginTop: 6,
              }}
            >
              {schoolName}
              {session && (
                <>
                  {" "}
                  &mdash; {session.termName} {session.academicYear}
                </>
              )}
            </p>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 14px",
              borderRadius: 9999,
              background: "rgba(11,110,79,0.08)",
              border: "1px solid rgba(11,110,79,0.15)",
            }}
          >
            <div
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: "var(--brand)",
                animation: "pulse-glow 2s ease-in-out infinite",
              }}
            />
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: "var(--brand)",
                fontFamily: "var(--font-sans)",
              }}
            >
              Live Dashboard
            </span>
          </div>
        </div>

        {/* Error banner (non-fatal) */}
        {error && data && (
          <div
            style={{
              marginTop: 12,
              padding: "10px 16px",
              borderRadius: 10,
              background: "rgba(245,158,11,0.08)",
              border: "1px solid rgba(245,158,11,0.2)",
              fontSize: 13,
              color: "#b45309",
              fontFamily: "var(--font-sans)",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <AlertTriangle style={{ width: 14, height: 14, flexShrink: 0 }} />
            Some data may be outdated.{" "}
            <button
              onClick={loadData}
              style={{
                background: "none",
                border: "none",
                color: "#b45309",
                fontWeight: 600,
                textDecoration: "underline",
                cursor: "pointer",
                fontFamily: "var(--font-sans)",
                fontSize: 13,
                padding: 0,
              }}
            >
              Refresh
            </button>
          </div>
        )}
      </motion.div>

      {/* ── Row 1: Health Score + Stat Tiles ──────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Health gauge */}
        <div className="lg:col-span-1">
          <HealthScoreGauge score={healthScore} />
        </div>

        {/* 4 stat tiles */}
        <div className="lg:col-span-4 grid grid-cols-2 md:grid-cols-4 gap-3.5">
          <DashStatTile
            label="Total Students"
            value={data?.totalStudents ?? 0}
            icon={<Users style={{ width: 16, height: 16 }} />}
            delay={100}
            accentColor="var(--brand)"
            sub={
              data?.newStudentsThisTerm
                ? `+${data.newStudentsThisTerm} this term`
                : undefined
            }
            trend={data?.newStudentsThisTerm ? "up" : "neutral"}
          />
          <DashStatTile
            label="Today's Attendance"
            value={data?.attendanceRate ?? 0}
            icon={<ClipboardCheck style={{ width: 16, height: 16 }} />}
            delay={200}
            accentColor={
              (data?.attendanceRate ?? 0) >= 80 ? "var(--brand)" : "#f59e0b"
            }
            sub={`${data?.attendanceRate ?? 0}%`}
            trend={
              (data?.attendanceRate ?? 0) >= 80 ? "up" : "down"
            }
          />
          <DashStatTile
            label="Staff on Duty"
            value={data?.staffOnDuty ?? data?.totalStaff ?? 0}
            icon={<UserCog style={{ width: 16, height: 16 }} />}
            delay={300}
            accentColor="var(--brand)"
            sub={`of ${data?.totalStaff ?? 0} total`}
            trend="neutral"
          />
          <DashStatTile
            label="Notices This Term"
            value={data?.noticesThisTerm ?? 0}
            icon={<Bell style={{ width: 16, height: 16 }} />}
            delay={400}
            accentColor="#f59e0b"
            sub="Active notices"
            trend="neutral"
          />
        </div>
      </div>

      {/* ── Row 2: Attendance Chart + Quick Actions ─ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <AttendanceChart days={data?.attendanceHistory ?? []} />
        </div>
        <div className="lg:col-span-1">
          <QuickActionsGrid />
        </div>
      </div>

      {/* ── Row 3: Activity Feed ──────────────────── */}
      <ActivityFeed events={data?.recentActivity ?? []} />

      {/* ── Row 4: Enrollment & Fee Charts ────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <EnrollmentTrendChart />
        <FeeCollectionChart />
      </div>
    </div>
  );
}
