"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart3, Users, DollarSign, ClipboardCheck,
  Download, FileText, FileSpreadsheet,
  ChevronDown, Loader2, Award,
  ArrowUpRight, ArrowDownRight,
} from "lucide-react";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { useToast } from "@/components/ToastProvider";

/* ================================================================== */
/*  Recharts Color Palette                                             */
/* ================================================================== */

const COLORS = {
  primary: "#0b6e4f",
  secondary: "#17ab7d",
  amber: "#f59e0b",
  danger: "#f43f5e",
  info: "#38bdf8",
  slate: "#6b7c72",
} as const;

const PIE_COLORS = [COLORS.primary, COLORS.secondary, COLORS.amber, COLORS.info, COLORS.danger, COLORS.slate];

/* ================================================================== */
/*  Types                                                              */
/* ================================================================== */

type ReportTab = "report-cards" | "fees" | "attendance" | "performance";
type Period = "term" | "month" | "year" | "custom";

interface KeyMetrics {
  totalStudents: number;
  feeCollectionRate: number;
  attendanceRate: number;
  averagePerformance: number;
}

interface FeeData {
  month: string;
  collected: number;
  expected: number;
}

interface AttendanceData {
  date: string;
  rate: number;
  present: number;
  absent: number;
}

interface PerformanceData {
  grade: string;
  count: number;
  color: string;
}

interface ReportCardRow {
  id: string;
  studentName: string;
  class: string;
  arm: string;
  average: number;
  rank: number;
  status: "pass" | "fail" | "borderline";
}

/* ================================================================== */
/*  Mock Data   structured for easy API swap                           */
/* ================================================================== */

const MOCK_KEY_METRICS: KeyMetrics = {
  totalStudents: 847,
  feeCollectionRate: 78.4,
  attendanceRate: 91.2,
  averagePerformance: 72.6,
};

const MOCK_FEE_DATA: FeeData[] = [
  { month: "Sep", collected: 4200000, expected: 5000000 },
  { month: "Oct", collected: 3800000, expected: 5000000 },
  { month: "Nov", collected: 4600000, expected: 5000000 },
  { month: "Dec", collected: 2100000, expected: 5000000 },
  { month: "Jan", collected: 4800000, expected: 5000000 },
  { month: "Feb", collected: 3900000, expected: 5000000 },
  { month: "Mar", collected: 5100000, expected: 5000000 },
  { month: "Apr", collected: 4400000, expected: 5000000 },
];

const MOCK_ATTENDANCE_DATA: AttendanceData[] = [
  { date: "01/09", rate: 94.2, present: 798, absent: 49 },
  { date: "08/09", rate: 92.8, present: 786, absent: 61 },
  { date: "15/09", rate: 95.1, present: 806, absent: 41 },
  { date: "22/09", rate: 89.5, present: 758, absent: 89 },
  { date: "29/09", rate: 93.4, present: 791, absent: 56 },
  { date: "06/10", rate: 91.7, present: 777, absent: 70 },
  { date: "13/10", rate: 96.3, present: 816, absent: 31 },
  { date: "20/10", rate: 90.8, present: 769, absent: 78 },
  { date: "27/10", rate: 94.6, present: 801, absent: 46 },
  { date: "03/11", rate: 88.9, present: 753, absent: 94 },
  { date: "10/11", rate: 93.1, present: 789, absent: 58 },
  { date: "17/11", rate: 95.8, present: 812, absent: 35 },
];

const MOCK_PERFORMANCE_DATA: PerformanceData[] = [
  { grade: "A (70-100)", count: 189, color: COLORS.primary },
  { grade: "B (60-69)", count: 267, color: COLORS.secondary },
  { grade: "C (50-59)", count: 213, color: COLORS.amber },
  { grade: "D (40-49)", count: 118, color: COLORS.info },
  { grade: "F (0-39)", count: 60, color: COLORS.danger },
];

const MOCK_REPORT_CARDS: ReportCardRow[] = [
  { id: "1", studentName: "Adebayo Oladipo", class: "JSS 3", arm: "A", average: 89.2, rank: 1, status: "pass" },
  { id: "2", studentName: "Chidinma Eze", class: "JSS 3", arm: "A", average: 86.7, rank: 2, status: "pass" },
  { id: "3", studentName: "Fatima Abubakar", class: "JSS 3", arm: "A", average: 84.1, rank: 3, status: "pass" },
  { id: "4", studentName: "Emeka Nwosu", class: "JSS 3", arm: "A", average: 78.5, rank: 4, status: "pass" },
  { id: "5", studentName: "Amina Bello", class: "JSS 3", arm: "A", average: 72.3, rank: 5, status: "pass" },
  { id: "6", studentName: "Tunde Bakare", class: "JSS 3", arm: "A", average: 65.8, rank: 6, status: "pass" },
  { id: "7", studentName: "Ngozi Okoro", class: "JSS 3", arm: "A", average: 58.4, rank: 7, status: "borderline" },
  { id: "8", studentName: "Yusuf Abdullahi", class: "JSS 3", arm: "A", average: 42.1, rank: 8, status: "fail" },
  { id: "9", studentName: "Blessing Igbinedion", class: "JSS 3", arm: "A", average: 38.9, rank: 9, status: "fail" },
  { id: "10", studentName: "Kola Thompson", class: "JSS 3", arm: "A", average: 35.2, rank: 10, status: "fail" },
];

const CLASS_OPTIONS = [
  "JSS 1", "JSS 2", "JSS 3", "SSS 1", "SSS 2", "SSS 3",
];

const TERM_OPTIONS = [
  { value: "first", label: "First Term 2025/2026" },
  { value: "second", label: "Second Term 2025/2026" },
  { value: "third", label: "Third Term 2025/2026" },
];

/* ================================================================== */
/*  Helpers                                                            */
/* ================================================================== */

function formatNaira(amount: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function getPerformanceColor(rate: number): string {
  if (rate >= 80) return COLORS.primary;
  if (rate >= 60) return COLORS.amber;
  return COLORS.danger;
}

/* ================================================================== */
/*  Custom Recharts Tooltip                                            */
/* ================================================================== */

function CustomTooltip({
  active, payload, label, isCurrency,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
  isCurrency?: boolean;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: "var(--card-bg)",
        border: "1px solid var(--card-border)",
        borderRadius: 10,
        padding: "10px 14px",
        boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
      }}
    >
      <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 6, fontWeight: 600 }}>
        {label}
      </p>
      {payload.map((entry, i) => (
        <p key={i} style={{ fontSize: 13, color: entry.color, fontWeight: 500, lineHeight: 1.6 }}>
          {entry.name}: {isCurrency ? formatNaira(entry.value) : entry.value}
          {!isCurrency && entry.name.toLowerCase().includes("rate") ? "%" : ""}
        </p>
      ))}
    </div>
  );
}

/* ================================================================== */
/*  Animation Variants                                                 */
/* ================================================================== */

const FADE_UP = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
} as const;

const FADE_UP_TRANSITION = { duration: 0.35, ease: [0.16, 1, 0.3, 1] as const };

const STAGGER = {
  animate: { transition: { staggerChildren: 0.06 } },
};

const STAGGER_CHILD = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] as const } },
};

/* ================================================================== */
/*  Page Component                                                     */
/* ================================================================== */

export default function AdminReportsPage() {
  const toast = useToast();

  /* ── State ── */
  const [activeTab, setActiveTab] = useState<ReportTab>("report-cards");
  const [period, setPeriod] = useState<Period>("term");
  const [selectedClass, setSelectedClass] = useState("JSS 3");
  const [selectedTerm, setSelectedTerm] = useState("first");
  const [generating, setGenerating] = useState(false);

  /* ── Derived ── */
  const metrics = MOCK_KEY_METRICS;

  const tabs: { key: ReportTab; label: string; icon: React.ReactNode }[] = [
    { key: "report-cards", label: "Report Cards", icon: <FileText className="w-4 h-4" /> },
    { key: "fees", label: "Fee Collection", icon: <DollarSign className="w-4 h-4" /> },
    { key: "attendance", label: "Attendance", icon: <ClipboardCheck className="w-4 h-4" /> },
    { key: "performance", label: "Performance", icon: <BarChart3 className="w-4 h-4" /> },
  ];

  /* ── Handlers ── */
  function handleExportPDF() {
    toast({ message: "PDF report is being generated. It will download shortly.", type: "info" });
  }

  function handleExportCSV() {
    toast({ message: "CSV export started. Your file will download in a moment.", type: "success" });
  }

  async function handleGenerateReportCards() {
    setGenerating(true);
    // Simulate API call
    await new Promise((r) => setTimeout(r, 2000));
    setGenerating(false);
    toast({
      message: `Report cards for ${selectedClass} (${TERM_OPTIONS.find((t) => t.value === selectedTerm)?.label}) generated successfully.`,
      type: "success",
    });
  }

  /* ── Metric Cards Config ── */
  const metricCards = [
    {
      label: "Total Students",
      value: metrics.totalStudents.toLocaleString(),
      icon: <Users className="w-5 h-5" />,
      color: COLORS.info,
      bgTint: "rgba(56,189,248,0.08)",
      change: "+12%",
      up: true,
    },
    {
      label: "Fee Collection",
      value: `${metrics.feeCollectionRate}%`,
      icon: <DollarSign className="w-5 h-5" />,
      color: COLORS.primary,
      bgTint: "rgba(11,110,79,0.08)",
      change: "+4.2%",
      up: true,
    },
    {
      label: "Attendance Rate",
      value: `${metrics.attendanceRate}%`,
      icon: <ClipboardCheck className="w-5 h-5" />,
      color: COLORS.amber,
      bgTint: "rgba(245,158,11,0.08)",
      change: "-1.3%",
      up: false,
    },
    {
      label: "Avg Performance",
      value: `${metrics.averagePerformance}%`,
      icon: <Award className="w-5 h-5" />,
      color: COLORS.secondary,
      bgTint: "rgba(23,171,125,0.08)",
      change: "+2.8%",
      up: true,
    },
  ];

  return (
    <div>
      {/* ── Page Header ── */}
      <motion.div
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6"
        initial={FADE_UP.initial}
        animate={FADE_UP.animate}
        transition={FADE_UP_TRANSITION}
      >
        <div>
          <h1 className="text-xl font-semibold font-[family-name:var(--font-display)]" style={{ color: "var(--heading-color)" }}>
            Reports & Analytics
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
            Comprehensive school performance insights
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Period Selector */}
          <div className="relative">
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as Period)}
              className="btn btn-secondary text-sm pr-8 appearance-none"
              style={{ minWidth: 130 }}
            >
              <option value="term">This Term</option>
              <option value="month">This Month</option>
              <option value="year">This Year</option>
              <option value="custom">Custom</option>
            </select>
            <ChevronDown
              className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color: "var(--text-muted)" }}
            />
          </div>

          {/* Export Buttons */}
          <button onClick={handleExportPDF} className="btn btn-secondary text-sm">
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">Export PDF</span>
          </button>
          <button onClick={handleExportCSV} className="btn btn-secondary text-sm">
            <FileSpreadsheet className="w-4 h-4" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
        </div>
      </motion.div>

      {/* ── Key Metrics ── */}
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6"
        variants={STAGGER}
        initial="initial"
        animate="animate"
      >
        {metricCards.map((card) => (
          <motion.div
            key={card.label}
            className="sh-card rounded-2xl p-5"
            variants={STAGGER_CHILD}
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>
                {card.label}
              </p>
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: card.bgTint, color: card.color }}
              >
                {card.icon}
              </div>
            </div>
            <p className="text-2xl font-bold" style={{ color: "var(--heading-color)" }}>
              {card.value}
            </p>
            <div className="flex items-center gap-1 mt-1.5">
              {card.up ? (
                <ArrowUpRight className="w-3.5 h-3.5" style={{ color: COLORS.primary }} />
              ) : (
                <ArrowDownRight className="w-3.5 h-3.5" style={{ color: COLORS.danger }} />
              )}
              <span
                className="text-xs font-medium"
                style={{ color: card.up ? COLORS.primary : COLORS.danger }}
              >
                {card.change}
              </span>
              <span className="text-xs" style={{ color: "var(--muted-color)" }}>
                vs last term
              </span>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* ── Tab Navigation ── */}
      <motion.div
        className="sh-card rounded-2xl mb-6 overflow-hidden"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div
          className="flex overflow-x-auto"
          style={{ borderBottom: "1px solid var(--card-border)" }}
        >
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className="flex items-center gap-2 px-5 py-3.5 text-sm font-medium whitespace-nowrap transition-all duration-200 relative"
              style={{
                color: activeTab === tab.key ? COLORS.primary : "var(--text-muted)",
                background: activeTab === tab.key ? "rgba(11,110,79,0.05)" : "transparent",
              }}
            >
              {tab.icon}
              {tab.label}
              {activeTab === tab.key && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5"
                  style={{ background: COLORS.primary }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
            </button>
          ))}
        </div>

        {/* ── Tab Content ── */}
        <div className="p-5">
          <AnimatePresence mode="wait">
            {activeTab === "report-cards" && (
              <motion.div
                key="report-cards"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <ReportCardsTab
                  selectedClass={selectedClass}
                  setSelectedClass={setSelectedClass}
                  selectedTerm={selectedTerm}
                  setSelectedTerm={setSelectedTerm}
                  generating={generating}
                  onGenerate={handleGenerateReportCards}
                />
              </motion.div>
            )}

            {activeTab === "fees" && (
              <motion.div
                key="fees"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <FeeCollectionTab />
              </motion.div>
            )}

            {activeTab === "attendance" && (
              <motion.div
                key="attendance"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <AttendanceTab />
              </motion.div>
            )}

            {activeTab === "performance" && (
              <motion.div
                key="performance"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <PerformanceTab />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}

/* ================================================================== */
/*  Tab: Report Cards                                                  */
/* ================================================================== */

function ReportCardsTab({
  selectedClass,
  setSelectedClass,
  selectedTerm,
  setSelectedTerm,
  generating,
  onGenerate,
}: {
  selectedClass: string;
  setSelectedClass: (v: string) => void;
  selectedTerm: string;
  setSelectedTerm: (v: string) => void;
  generating: boolean;
  onGenerate: () => void;
}) {
  return (
    <div>
      {/* Generation Section */}
      <div
        className="rounded-xl p-5 mb-5"
        style={{
          background: "linear-gradient(135deg, rgba(11,110,79,0.06) 0%, rgba(23,171,125,0.04) 100%)",
          border: "1px solid rgba(11,110,79,0.12)",
        }}
      >
        <div className="flex flex-col sm:flex-row sm:items-end gap-4">
          <div className="flex-1">
            <h3 className="text-sm font-semibold mb-1" style={{ color: "var(--heading-color)" }}>
              Generate Report Cards
            </h3>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              Select a class and term to generate report cards for all students.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Class Selector */}
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "var(--label-color)" }}>
                Class
              </label>
              <div className="relative">
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="input-field text-sm pr-8 appearance-none"
                  style={{ minHeight: 36, minWidth: 120 }}
                >
                  {CLASS_OPTIONS.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <ChevronDown
                  className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ color: "var(--text-muted)" }}
                />
              </div>
            </div>

            {/* Term Selector */}
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "var(--label-color)" }}>
                Term
              </label>
              <div className="relative">
                <select
                  value={selectedTerm}
                  onChange={(e) => setSelectedTerm(e.target.value)}
                  className="input-field text-sm pr-8 appearance-none"
                  style={{ minHeight: 36, minWidth: 180 }}
                >
                  {TERM_OPTIONS.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
                <ChevronDown
                  className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ color: "var(--text-muted)" }}
                />
              </div>
            </div>

            {/* Generate Button */}
            <button
              onClick={onGenerate}
              disabled={generating}
              className="btn btn-primary text-sm"
              style={{ minHeight: 36 }}
            >
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Generate
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Report Card Table */}
      <div className="overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ textAlign: "left" }}>Rank</th>
              <th style={{ textAlign: "left" }}>Student Name</th>
              <th style={{ textAlign: "left" }}>Class</th>
              <th style={{ textAlign: "right" }}>Average (%)</th>
              <th style={{ textAlign: "center" }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {MOCK_REPORT_CARDS.map((row) => (
              <tr key={row.id}>
                <td>
                  <span
                    className="inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold"
                    style={{
                      background: row.rank <= 3 ? "rgba(11,110,79,0.1)" : "var(--surface-2)",
                      color: row.rank <= 3 ? COLORS.primary : "var(--text-muted)",
                    }}
                  >
                    {row.rank}
                  </span>
                </td>
                <td style={{ fontWeight: 500 }}>{row.studentName}</td>
                <td>{row.class} {row.arm}</td>
                <td style={{ textAlign: "right", fontWeight: 600 }}>{row.average.toFixed(1)}%</td>
                <td style={{ textAlign: "center" }}>
                  <span
                    className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium"
                    style={{
                      background:
                        row.status === "pass" ? "rgba(11,110,79,0.1)" :
                        row.status === "borderline" ? "rgba(245,158,11,0.1)" :
                        "rgba(244,63,94,0.1)",
                      color:
                        row.status === "pass" ? COLORS.primary :
                        row.status === "borderline" ? COLORS.amber :
                        COLORS.danger,
                    }}
                  >
                    {row.status === "pass" ? "Pass" : row.status === "borderline" ? "Borderline" : "Fail"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  Tab: Fee Collection                                                */
/* ================================================================== */

function FeeCollectionTab() {
  const totalCollected = MOCK_FEE_DATA.reduce((s, d) => s + d.collected, 0);
  const totalExpected = MOCK_FEE_DATA.reduce((s, d) => s + d.expected, 0);
  const collectionRate = ((totalCollected / totalExpected) * 100).toFixed(1);

  return (
    <div>
      {/* Summary Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
        <div className="rounded-xl p-4" style={{ background: "var(--surface-2)" }}>
          <p className="text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>Total Collected</p>
          <p className="text-lg font-bold" style={{ color: COLORS.primary }}>{formatNaira(totalCollected)}</p>
        </div>
        <div className="rounded-xl p-4" style={{ background: "var(--surface-2)" }}>
          <p className="text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>Total Expected</p>
          <p className="text-lg font-bold" style={{ color: "var(--heading-color)" }}>{formatNaira(totalExpected)}</p>
        </div>
        <div className="rounded-xl p-4" style={{ background: "var(--surface-2)" }}>
          <p className="text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>Collection Rate</p>
          <p className="text-lg font-bold" style={{ color: getPerformanceColor(parseFloat(collectionRate)) }}>
            {collectionRate}%
          </p>
        </div>
      </div>

      {/* Bar Chart */}
      <div style={{ width: "100%", height: 340 }}>
        <ResponsiveContainer>
          <BarChart data={MOCK_FEE_DATA} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 12, fill: "var(--text-muted)" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 12, fill: "var(--text-muted)" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `${(v / 1_000_000).toFixed(0)}M`}
            />
            <Tooltip content={<CustomTooltip isCurrency />} />
            <Legend
              wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
              iconType="circle"
              iconSize={8}
            />
            <Bar
              dataKey="expected"
              name="Expected"
              fill={COLORS.slate}
              radius={[4, 4, 0, 0]}
              opacity={0.3}
            />
            <Bar
              dataKey="collected"
              name="Collected"
              fill={COLORS.primary}
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  Tab: Attendance                                                    */
/* ================================================================== */

function AttendanceTab() {
  const avgRate = (
    MOCK_ATTENDANCE_DATA.reduce((s, d) => s + d.rate, 0) / MOCK_ATTENDANCE_DATA.length
  ).toFixed(1);

  return (
    <div>
      {/* Summary */}
      <div className="flex items-center gap-4 mb-5 flex-wrap">
        <div className="rounded-xl px-4 py-3" style={{ background: "rgba(11,110,79,0.06)" }}>
          <p className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>Average Attendance</p>
          <p className="text-xl font-bold" style={{ color: COLORS.primary }}>{avgRate}%</p>
        </div>
        <div className="rounded-xl px-4 py-3" style={{ background: "var(--surface-2)" }}>
          <p className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>Best Day</p>
          <p className="text-xl font-bold" style={{ color: COLORS.primary }}>96.3%</p>
        </div>
        <div className="rounded-xl px-4 py-3" style={{ background: "var(--surface-2)" }}>
          <p className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>Lowest Day</p>
          <p className="text-xl font-bold" style={{ color: COLORS.danger }}>88.9%</p>
        </div>
      </div>

      {/* Line Chart */}
      <div style={{ width: "100%", height: 340 }}>
        <ResponsiveContainer>
          <LineChart data={MOCK_ATTENDANCE_DATA} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: "var(--text-muted)" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              domain={[80, 100]}
              tick={{ fontSize: 12, fill: "var(--text-muted)" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `${v}%`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
              iconType="circle"
              iconSize={8}
            />
            <Line
              type="monotone"
              dataKey="rate"
              name="Attendance Rate"
              stroke={COLORS.primary}
              strokeWidth={2.5}
              dot={{ fill: COLORS.primary, r: 4, strokeWidth: 0 }}
              activeDot={{ r: 6, stroke: COLORS.primary, strokeWidth: 2, fill: "var(--card-bg)" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  Tab: Student Performance                                           */
/* ================================================================== */

function PerformanceTab() {
  const totalStudents = MOCK_PERFORMANCE_DATA.reduce((s, d) => s + d.count, 0);

  return (
    <div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <div>
          <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--heading-color)" }}>
            Grade Distribution
          </h3>
          <div style={{ width: "100%", height: 300 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={MOCK_PERFORMANCE_DATA}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={110}
                  paddingAngle={3}
                  dataKey="count"
                  nameKey="grade"
                  stroke="none"
                >
                  {MOCK_PERFORMANCE_DATA.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0].payload as PerformanceData;
                    const pct = ((d.count / totalStudents) * 100).toFixed(1);
                    return (
                      <div
                        style={{
                          background: "var(--card-bg)",
                          border: "1px solid var(--card-border)",
                          borderRadius: 10,
                          padding: "10px 14px",
                          boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
                        }}
                      >
                        <p style={{ fontSize: 12, fontWeight: 600, color: d.color, marginBottom: 4 }}>
                          {d.grade}
                        </p>
                        <p style={{ fontSize: 13, color: "var(--text)", fontWeight: 500 }}>
                          {d.count} students ({pct}%)
                        </p>
                      </div>
                    );
                  }}
                />
                <Legend
                  wrapperStyle={{ fontSize: 12 }}
                  iconType="circle"
                  iconSize={8}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Breakdown Table */}
        <div>
          <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--heading-color)" }}>
            Performance Breakdown
          </h3>
          <div className="space-y-3">
            {MOCK_PERFORMANCE_DATA.map((item) => {
              const pct = (item.count / totalStudents) * 100;
              return (
                <div key={item.grade}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium" style={{ color: "var(--text)" }}>
                      {item.grade}
                    </span>
                    <span className="text-sm font-semibold" style={{ color: "var(--heading-color)" }}>
                      {item.count} <span className="font-normal" style={{ color: "var(--text-muted)" }}>({pct.toFixed(1)}%)</span>
                    </span>
                  </div>
                  <div
                    className="w-full rounded-full overflow-hidden"
                    style={{ height: 8, background: "var(--surface-2)" }}
                  >
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: item.color }}
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Summary Stats */}
          <div
            className="rounded-xl p-4 mt-5"
            style={{ background: "var(--surface-2)" }}
          >
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>Pass Rate</p>
                <p className="text-lg font-bold" style={{ color: COLORS.primary }}>
                  {(((MOCK_PERFORMANCE_DATA[0].count + MOCK_PERFORMANCE_DATA[1].count + MOCK_PERFORMANCE_DATA[2].count) / totalStudents) * 100).toFixed(1)}%
                </p>
              </div>
              <div>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>Fail Rate</p>
                <p className="text-lg font-bold" style={{ color: COLORS.danger }}>
                  {((MOCK_PERFORMANCE_DATA[4].count / totalStudents) * 100).toFixed(1)}%
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
