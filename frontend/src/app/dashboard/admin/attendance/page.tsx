"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "@/lib/auth/CookieAuthProvider";
import { motion, AnimatePresence } from "framer-motion";
import {
  ClipboardCheck, Search, Loader2, AlertCircle, CheckCircle,
  CalendarDays, Users, UserCheck, UserX, Clock,
  ChevronLeft, ChevronRight, History, BarChart3, Download,
} from "lucide-react";
import { api } from "@/lib/api";

/* ================================================================== */
/*  Types                                                              */
/* ================================================================== */

interface ClassOption {
  id: string;
  name: string;
  arms: { id: string; name: string }[];
}

interface Student {
  id: string;
  admissionNumber: string;
  fullName: string;
}

type AttendanceStatus = "PRESENT" | "ABSENT" | "LATE";

interface AttendanceRecord {
  studentId: string;
  status: AttendanceStatus;
}

interface HistoryRow {
  date: string;
  className: string;
  armName: string;
  present: number;
  absent: number;
  late: number;
  total: number;
  rate: number;
}

/* ================================================================== */
/*  Helpers                                                            */
/* ================================================================== */

function toISODate(d: Date): string {
  return d.toISOString().split("T")[0];
}

function formatNigerianDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function formatLongDate(d: Date): string {
  return d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

function getTodayISO(): string {
  return toISODate(new Date());
}

function getDayLabel(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-GB", { weekday: "short" });
}

/** Generate mock history data for last 10 school days */
function generateMockHistory(classes: ClassOption[]): HistoryRow[] {
  const rows: HistoryRow[] = [];
  const today = new Date();
  let dayOffset = 0;

  for (let i = 0; i < 10; i++) {
    dayOffset++;
    while (dayOffset < 30) {
      const d = new Date(today);
      d.setDate(d.getDate() - dayOffset);
      const dow = d.getDay();
      if (dow >= 1 && dow <= 5) break;
      dayOffset++;
    }
    if (dayOffset >= 30) break;

    const d = new Date(today);
    d.setDate(d.getDate() - dayOffset);

    const cls = classes.length > 0 ? classes[i % classes.length] : { name: "JSS 1", arms: [{ name: "A" }] };
    const armName = cls.arms?.[0]?.name ?? "A";
    const total = 25 + Math.floor(Math.random() * 15);
    const present = Math.floor(total * (0.65 + Math.random() * 0.3));
    const late = Math.floor(Math.random() * (total - present) * 0.5);
    const absent = total - present - late;

    rows.push({
      date: toISODate(d),
      className: cls.name,
      armName,
      present,
      absent,
      late,
      total,
      rate: Math.round((present / total) * 100),
    });
  }
  return rows;
}

/** Generate last 5 school days for chart */
function generateChartDays(): { date: string; dayLabel: string; rate: number }[] {
  const days: { date: string; dayLabel: string; rate: number }[] = [];
  let offset = 0;

  for (let i = 0; i < 5; i++) {
    offset++;
    while (offset < 30) {
      const d = new Date();
      d.setDate(d.getDate() - offset);
      const dow = d.getDay();
      if (dow >= 1 && dow <= 5) break;
      offset++;
    }
    if (offset >= 30) break;

    const d = new Date();
    d.setDate(d.getDate() - offset);
    days.push({
      date: toISODate(d),
      dayLabel: getDayLabel(toISODate(d)),
      rate: 60 + Math.floor(Math.random() * 35),
    });
  }
  return days.reverse();
}

const tabVariants = {
  enter: { opacity: 0, x: 20 },
  center: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
};

/* ================================================================== */
/*  Component                                                          */
/* ================================================================== */

export default function AdminAttendancePage() {
  const { user } = useAuth();

  /* --- Core state --- */
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedArmId, setSelectedArmId] = useState("");
  const [students, setStudents] = useState<Student[]>([]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [search, setSearch] = useState("");
  const [selectedDate, setSelectedDate] = useState(getTodayISO());

  /* --- UI state --- */
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [activeTab, setActiveTab] = useState<"mark" | "history">("mark");

  /* --- History state --- */
  const [historyClassFilter, setHistoryClassFilter] = useState("");
  const [historyDateFrom, setHistoryDateFrom] = useState("");
  const [historyDateTo, setHistoryDateTo] = useState("");
  const [mockHistory, setMockHistory] = useState<HistoryRow[]>([]);

  /* --- Chart data --- */
  const [chartDays] = useState(() => generateChartDays());

  /* --- Fetch classes --- */
  useEffect(() => {
    api.get<{ id: string; name: string; arms: { id: string; name: string }[] }>("/api/classes")
      .then((data) => {
        if (data) setClasses(Array.isArray(data) ? data : []);
      })
      .catch(() => {});
  }, []);

  /* --- Fetch students when arm changes --- */
  useEffect(() => {
    if (!selectedArmId) {
      setStudents([]);
      setRecords([]);
      return;
    }
    setLoading(true);
    setError("");
    api.get<any>("/api/students")
      .then((data) => {
        const all: any[] = Array.isArray(data) ? data : [];
        const filtered = all.filter((s: any) => s.arm?.id === selectedArmId);
        setStudents(filtered);
        setRecords(filtered.map((s: any) => ({ studentId: s.id, status: "PRESENT" as const })));
      })
      .catch(() => setError("Failed to load students."))
      .finally(() => setLoading(false));
  }, [selectedArmId]);

  /* --- Generate mock history when classes change --- */
  useEffect(() => {
    if (classes.length > 0) {
      setMockHistory(generateMockHistory(classes));
    }
  }, [classes]);

  const selectedClass = classes.find((c) => c.id === selectedClassId);

  /* --- Callbacks --- */
  const setStatus = useCallback((studentId: string, status: AttendanceStatus) => {
    setRecords((prev) => prev.map((r) => r.studentId === studentId ? { ...r, status } : r));
  }, []);

  const filteredStudents = useMemo(
    () => students.filter((s) => s.fullName.toLowerCase().includes(search.toLowerCase())),
    [students, search],
  );

  /* --- Counts --- */
  const presentCount = records.filter((r) => r.status === "PRESENT").length;
  const absentCount = records.filter((r) => r.status === "ABSENT").length;
  const lateCount = records.filter((r) => r.status === "LATE").length;

  /* --- History filtered --- */
  const filteredHistory = useMemo(() => {
    let rows = [...mockHistory];
    if (historyClassFilter) {
      rows = rows.filter((r) => r.className === historyClassFilter);
    }
    if (historyDateFrom) {
      rows = rows.filter((r) => r.date >= historyDateFrom);
    }
    if (historyDateTo) {
      rows = rows.filter((r) => r.date <= historyDateTo);
    }
    return rows;
  }, [mockHistory, historyClassFilter, historyDateFrom, historyDateTo]);

  /* --- Chart max for scaling --- */
  const chartMax = useMemo(() => Math.max(...chartDays.map((d) => d.rate), 1), [chartDays]);

  /* --- Save handler --- */
  async function handleSave() {
    if (!user) return;
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      await api.post("/api/attendance", {
        records: records.map((r) => ({
          studentId: r.studentId,
          classArmId: selectedArmId,
          status: r.status,
          markedById: user.id,
          date: selectedDate,
        })),
      });
      setSuccess(`Attendance saved for ${records.length} student(s)!`);
      setTimeout(() => setSuccess(""), 3500);
    } catch {
      setError("Failed to save attendance.");
    } finally {
      setSaving(false);
    }
  }

  const uniqueClassNames = useMemo(
    () => Array.from(new Set(mockHistory.map((r) => r.className))),
    [mockHistory],
  );

  /* ================================================================== */
  /*  Render                                                             */
  /* ================================================================== */

  return (
    <div className="space-y-5">
      {/* ---- Header ---- */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-[var(--text)] font-display">Attendance</h1>
          <p className="text-sm text-[var(--text-muted)] font-sans mt-0.5 flex items-center gap-1">
            <CalendarDays className="w-3.5 h-3.5" />
            {formatLongDate(new Date(selectedDate))}
          </p>
        </div>

        {/* Tab toggle */}
        <div className="flex rounded-lg border border-[var(--border)] overflow-hidden text-sm font-sans">
          <button
            onClick={() => setActiveTab("mark")}
            className={`flex items-center gap-1.5 px-4 py-2 transition-colors ${
              activeTab === "mark"
                ? "bg-[var(--brand)] text-white"
                : "bg-[var(--surface)] text-[var(--text-muted)] hover:text-[var(--text)]"
            }`}
          >
            <ClipboardCheck className="w-4 h-4" />
            <span className="hidden sm:inline">Mark</span>
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`flex items-center gap-1.5 px-4 py-2 transition-colors ${
              activeTab === "history"
                ? "bg-[var(--brand)] text-white"
                : "bg-[var(--surface)] text-[var(--text-muted)] hover:text-[var(--text)]"
            }`}
          >
            <History className="w-4 h-4" />
            <span className="hidden sm:inline">History</span>
          </button>
        </div>
      </div>

      {/* ---- Error / Success toasts ---- */}
      <AnimatePresence>
        {error && (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-3 bg-red-500/10 border border-red-400/30 rounded-xl flex items-start gap-2 text-sm text-red-600"
          >
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            {error}
          </motion.div>
        )}
        {success && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="p-3 bg-green-500/10 border border-green-400/30 rounded-xl flex items-start gap-2 text-sm text-green-600"
          >
            <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            {success}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {/* ================================================================ */}
        {/*  TAB: Mark Attendance                                            */}
        {/* ================================================================ */}
        {activeTab === "mark" && (
          <motion.div key="mark" variants={tabVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.2 }} className="space-y-4">
            {/* -- Date picker -- */}
            <div className="sh-card p-4">
              <label className="label mb-1.5 block text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
                Attendance Date
              </label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    const d = new Date(selectedDate);
                    d.setDate(d.getDate() - 1);
                    setSelectedDate(toISODate(d));
                  }}
                  className="p-2 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
                  aria-label="Previous day"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="flex-1 relative">
                  <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="input-field pl-10 w-full"
                  />
                </div>

                <button
                  onClick={() => {
                    const d = new Date(selectedDate);
                    d.setDate(d.getDate() + 1);
                    if (d <= new Date()) setSelectedDate(toISODate(d));
                  }}
                  disabled={selectedDate >= getTodayISO()}
                  className="p-2 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)] transition-colors disabled:opacity-30"
                  aria-label="Next day"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>

                {selectedDate !== getTodayISO() && (
                  <button
                    onClick={() => setSelectedDate(getTodayISO())}
                    className="btn btn-secondary text-xs px-3 py-2 whitespace-nowrap"
                  >
                    Today
                  </button>
                )}
              </div>
            </div>

            {/* -- Class / Arm selectors -- */}
            <div className="sh-card p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label mb-1 block text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
                    Class
                  </label>
                  <select
                    value={selectedClassId}
                    onChange={(e) => { setSelectedClassId(e.target.value); setSelectedArmId(""); }}
                    className="input-field"
                  >
                    <option value="">Select class...</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label mb-1 block text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
                    Arm
                  </label>
                  <select
                    value={selectedArmId}
                    onChange={(e) => setSelectedArmId(e.target.value)}
                    disabled={!selectedClassId}
                    className="input-field disabled:opacity-50"
                  >
                    <option value="">Select arm...</option>
                    {selectedClass?.arms.map((a) => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* -- Attendance summary bar (after students loaded) -- */}
            {students.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="sh-card p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
                    Attendance Summary
                  </span>
                  <span className="text-xs text-[var(--text-muted)] font-mono">
                    {students.length} student{students.length !== 1 ? "s" : ""}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-green-500/10 border border-green-400/20">
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                    <div>
                      <p className="text-lg font-bold text-green-600 font-mono leading-none">{presentCount}</p>
                      <p className="text-xs text-green-600/80 font-sans">Present</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-red-500/10 border border-red-400/20">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                    <div>
                      <p className="text-lg font-bold text-red-600 font-mono leading-none">{absentCount}</p>
                      <p className="text-xs text-red-600/80 font-sans">Absent</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-amber-500/10 border border-amber-400/20">
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <div>
                      <p className="text-lg font-bold text-amber-600 font-mono leading-none">{lateCount}</p>
                      <p className="text-xs text-amber-600/80 font-sans">Late</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* -- Search -- */}
            {selectedArmId && !loading && students.length > 0 && (
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search student..."
                  className="input-field pl-10"
                />
              </div>
            )}

            {/* -- Student grid -- */}
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
              </div>
            ) : !selectedArmId ? (
              <div className="text-center py-20 text-[var(--text-muted)]">
                <ClipboardCheck className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="font-sans">Select a class and arm to mark attendance</p>
              </div>
            ) : (
              <>
                <div className="sh-card overflow-hidden">
                  <div className="divide-y divide-[var(--border)]">
                    {filteredStudents.length === 0 && (
                      <div className="px-4 py-8 text-center text-sm text-[var(--text-muted)] font-sans">
                        No students match your search.
                      </div>
                    )}
                    {filteredStudents.map((s) => {
                      const record = records.find((r) => r.studentId === s.id);
                      return (
                        <div
                          key={s.id}
                          className="px-4 py-3 flex items-center justify-between hover:bg-[var(--surface-2)] transition-colors"
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-[var(--text)] font-sans truncate">
                              {s.fullName}
                            </p>
                            <p className="text-xs text-[var(--text-muted)] font-mono">
                              {s.admissionNumber}
                            </p>
                          </div>
                          <div className="flex gap-1.5 p-1 bg-[var(--surface-2)] rounded-lg border border-[var(--border)]">
                            {(["PRESENT", "ABSENT", "LATE"] as const).map((status) => (
                              <button
                                key={status}
                                onClick={() => setStatus(s.id, status)}
                                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all min-w-[60px] ${
                                  record?.status === status
                                    ? status === "PRESENT"
                                      ? "bg-brand-500 text-white shadow-md shadow-brand-500/20"
                                      : status === "ABSENT"
                                        ? "bg-red-500 text-white shadow-md shadow-red-500/20"
                                        : "bg-amber-500 text-white shadow-md shadow-amber-500/20"
                                    : "text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--background)]"
                                }`}
                              >
                                {status === "PRESENT" ? "Present" : status === "ABSENT" ? "Absent" : "Late"}
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* -- Save button -- */}
                {filteredStudents.length > 0 && (
                  <motion.button
                    onClick={handleSave}
                    disabled={saving}
                    whileTap={{ scale: 0.98 }}
                    className="w-full py-3 btn btn-primary flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        Save Attendance ({filteredStudents.length} student{filteredStudents.length !== 1 ? "s" : ""})
                      </>
                    )}
                  </motion.button>
                )}
              </>
            )}

            {/* -- Attendance chart (last 5 school days) -- */}
            {chartDays.length > 0 && (
              <div className="sh-card p-4">
                <div className="flex items-center gap-2 mb-4">
                  <BarChart3 className="w-4 h-4 text-[var(--text-muted)]" />
                  <span className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
                    Attendance Rate   Last 5 School Days
                  </span>
                </div>
                <div className="flex items-end justify-between gap-2 h-36">
                  {chartDays.map((day, i) => {
                    const barHeight = (day.rate / chartMax) * 100;
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                        <span className="text-xs font-mono text-[var(--text-muted)]">{day.rate}%</span>
                        <div className="w-full flex items-end justify-center" style={{ height: "80px" }}>
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: `${barHeight}%` }}
                            transition={{ delay: i * 0.1, duration: 0.5, ease: "easeOut" }}
                            className="w-full max-w-[40px] rounded-t-md"
                            style={{
                              background:
                                day.rate >= 80
                                  ? "var(--color-success, #22c55e)"
                                  : day.rate >= 60
                                    ? "var(--color-warning, #f59e0b)"
                                    : "var(--color-danger, #ef4444)",
                            }}
                          />
                        </div>
                        <span className="text-xs text-[var(--text-muted)] font-sans">{day.dayLabel}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* ================================================================ */}
        {/*  TAB: History                                                    */}
        {/* ================================================================ */}
        {activeTab === "history" && (
          <motion.div key="history" variants={tabVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.2 }} className="space-y-4">
            {/* -- Filters -- */}
            <div className="sh-card p-4">
              <div className="flex items-center gap-2 mb-3">
                <History className="w-4 h-4 text-[var(--text-muted)]" />
                <span className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
                  Filters
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="label mb-1 block text-xs text-[var(--text-muted)]">Class</label>
                  <select
                    value={historyClassFilter}
                    onChange={(e) => setHistoryClassFilter(e.target.value)}
                    className="input-field"
                  >
                    <option value="">All classes</option>
                    {uniqueClassNames.map((name) => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label mb-1 block text-xs text-[var(--text-muted)]">From</label>
                  <input
                    type="date"
                    value={historyDateFrom}
                    onChange={(e) => setHistoryDateFrom(e.target.value)}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="label mb-1 block text-xs text-[var(--text-muted)]">To</label>
                  <input
                    type="date"
                    value={historyDateTo}
                    onChange={(e) => setHistoryDateTo(e.target.value)}
                    className="input-field"
                  />
                </div>
              </div>
            </div>

            {/* -- History table -- */}
            <div className="sh-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="data-table w-full text-sm font-sans">
                  <thead>
                    <tr className="border-b border-[var(--border)]">
                      <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
                        Date
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
                        Class
                      </th>
                      <th className="text-center px-4 py-3 text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
                        <span className="inline-flex items-center gap-1"><UserCheck className="w-3 h-3 text-green-500" /> Present</span>
                      </th>
                      <th className="text-center px-4 py-3 text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
                        <span className="inline-flex items-center gap-1"><UserX className="w-3 h-3 text-red-500" /> Absent</span>
                      </th>
                      <th className="text-center px-4 py-3 text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
                        <span className="inline-flex items-center gap-1"><Clock className="w-3 h-3 text-amber-500" /> Late</span>
                      </th>
                      <th className="text-center px-4 py-3 text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
                        Total
                      </th>
                      <th className="text-center px-4 py-3 text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
                        Rate %
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {filteredHistory.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-4 py-10 text-center text-[var(--text-muted)]">
                          No attendance records found for the selected filters.
                        </td>
                      </tr>
                    )}
                    {filteredHistory.map((row, i) => (
                      <tr key={i} className="hover:bg-[var(--surface)] transition-colors">
                        <td className="px-4 py-3 font-mono text-[var(--text)]">{formatNigerianDate(row.date)}</td>
                        <td className="px-4 py-3 text-[var(--text)]">
                          {row.className} {row.armName}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="badge-green font-mono">{row.present}</span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="badge-red font-mono">{row.absent}</span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="badge-yellow font-mono">{row.late}</span>
                        </td>
                        <td className="px-4 py-3 text-center font-mono text-[var(--text)]">{row.total}</td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`font-mono font-medium ${
                              row.rate >= 80 ? "text-green-600" : row.rate >= 60 ? "text-amber-600" : "text-red-600"
                            }`}
                          >
                            {row.rate}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* -- Export placeholder -- */}
            {filteredHistory.length > 0 && (
              <button className="btn btn-secondary flex items-center gap-2 mx-auto text-sm">
                <Download className="w-4 h-4" />
                Export Report
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
