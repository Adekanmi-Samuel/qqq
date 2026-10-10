"use client";

import { useAuth } from "@/lib/auth/CookieAuthProvider";
import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  DollarSign, Loader2, Plus, Search, CheckCircle, Clock,
  AlertTriangle, Trash2, Edit2, X, TrendingUp, Download,
  CreditCard, Wallet, Receipt, ChevronDown, Filter,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from "recharts";
import { API_URL } from "@/lib/config";

/* ================================================================== */
/*  Types                                                              */
/* ================================================================== */

interface FeeRecord {
  id: string;
  studentId: string;
  amount: number;
  description: string;
  term: number;
  session: string;
  status: string;
  paidAt: string | null;
  paymentMethod: string | null;
  createdAt: string;
  student: { id: string; fullName: string; admissionNumber: string };
}

interface Student {
  id: string;
  fullName: string;
  admissionNumber: string;
}

interface FeeCategory {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  bg: string;
  total: number;
  collected: number;
}

/* ================================================================== */
/*  Mock data for chart                                                */
/* ================================================================== */

const monthlyData = [
  { month: "Jul", collected: 1200000, expected: 1500000 },
  { month: "Aug", collected: 1800000, expected: 2000000 },
  { month: "Sep", collected: 2200000, expected: 2500000 },
  { month: "Oct", collected: 1900000, expected: 2200000 },
  { month: "Nov", collected: 2500000, expected: 2800000 },
  { month: "Dec", collected: 2100000, expected: 2400000 },
];

const FEE_CATEGORIES = [
  { id: "tuition", name: "Tuition", icon: <Receipt style={{ width: 18, height: 18 }} />, color: "var(--brand)", bg: "rgba(11,110,79,0.1)" },
  { id: "uniform", name: "Uniform", icon: <Wallet style={{ width: 18, height: 18 }} />, color: "#17ab7d", bg: "rgba(23,171,125,0.1)" },
  { id: "transport", name: "Transport", icon: <CreditCard style={{ width: 18, height: 18 }} />, color: "#38bdf8", bg: "rgba(56,189,248,0.1)" },
  { id: "development", name: "Dev. Levy", icon: <TrendingUp style={{ width: 18, height: 18 }} />, color: "#f59e0b", bg: "rgba(245,158,11,0.1)" },
  { id: "feeding", name: "Feeding", icon: <DollarSign style={{ width: 18, height: 18 }} />, color: "#8b5cf6", bg: "rgba(139,92,246,0.1)" },
  { id: "others", name: "Others", icon: <DollarSign style={{ width: 18, height: 18 }} />, color: "#6b7c72", bg: "rgba(107,124,114,0.1)" },
];

/* ================================================================== */
/*  Helpers                                                            */
/* ================================================================== */

function formatNaira(amount: number): string {
  return `₦${amount.toLocaleString("en-NG")}`;
}

function statusBadge(status: string) {
  const styles: Record<string, string> = {
    PAID: "badge-green",
    PARTIAL: "badge-yellow",
    PENDING: "badge-slate",
    OVERDUE: "badge-red",
    WAIVED: "badge-blue",
  };
  return (
    <span className={`badge ${styles[status] || "badge-slate"}`}>
      {status === "PAID" && <CheckCircle style={{ width: 10, height: 10 }} />}
      {status === "OVERDUE" && <AlertTriangle style={{ width: 10, height: 10 }} />}
      {status === "PARTIAL" && <Clock style={{ width: 10, height: 10 }} />}
      {status}
    </span>
  );
}

/* ================================================================== */
/*  Custom Tooltip                                                     */
/* ================================================================== */

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload) return null;
  return (
    <div
      style={{
        background: "var(--card-bg)",
        border: "1px solid var(--border)",
        borderRadius: 12,
        padding: "12px 16px",
        boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
        fontFamily: "var(--font-sans)",
      }}
    >
      <p style={{ fontSize: 13, fontWeight: 600, color: "var(--heading-color)", marginBottom: 8 }}>
        {label}
      </p>
      {payload.map((entry: any, i: number) => (
        <p key={i} style={{ fontSize: 12, color: entry.color, display: "flex", justifyContent: "space-between", gap: 16 }}>
          <span>{entry.name}</span>
          <span style={{ fontWeight: 600 }}>{formatNaira(entry.value)}</span>
        </p>
      ))}
    </div>
  );
}

/* ================================================================== */
/*  Skeleton                                                           */
/* ================================================================== */

function FeesSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="skeleton h-7 w-40 rounded-lg" />
          <div className="skeleton h-4 w-28 rounded-lg" />
        </div>
        <div className="skeleton h-10 w-28 rounded-xl" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="skeleton h-24 rounded-xl" />
        ))}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="skeleton h-28 rounded-xl" />
        ))}
      </div>
      <div className="skeleton h-72 rounded-2xl" />
      <div className="skeleton h-64 rounded-xl" />
    </div>
  );
}

/* ================================================================== */
/*  Main Page                                                          */
/* ================================================================== */

export default function AdminFeesPage() {
  // cookie auth: token always null
  const [fees, setFees] = useState<FeeRecord[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editFee, setEditFee] = useState<FeeRecord | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "records" | "outstanding">("overview");
  const [form, setForm] = useState({
    studentId: "", amount: "", description: "", category: "tuition",
    term: "1", session: "2025/2026", paymentMethod: "cash",
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
  // cookie auth
    (async () => {
      try {
        const [feeRes, studentRes] = await Promise.all([
          fetch(`${API_URL}/api/fees`, { credentials: "include" }),
          fetch(`${API_URL}/api/students`, { credentials: "include" }),
        ]);
        const feeData = await feeRes.json();
        const studentData = await studentRes.json();
        if (feeData.success) setFees(feeData.data || []);
        if (studentData.success) setStudents(studentData.data || []);
      } catch { /* ignore */ }
      finally { setLoading(false); }
    })();
  }, []);

  /* ---- Derived data ---- */
  const filtered = useMemo(() => fees.filter((f) => {
    const matchSearch = !search ||
      f.student?.fullName.toLowerCase().includes(search.toLowerCase()) ||
      f.description.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || f.status === statusFilter;
    return matchSearch && matchStatus;
  }), [fees, search, statusFilter]);

  const totalExpected = fees.reduce((s, f) => s + f.amount, 0);
  const totalPaid = fees.filter((f) => f.status === "PAID").reduce((s, f) => s + f.amount, 0);
  const outstanding = totalExpected - totalPaid;
  const overdueCount = fees.filter((f) => f.status === "OVERDUE").length;

  /* ---- Categories with totals ---- */
  const categories: FeeCategory[] = FEE_CATEGORIES.map((cat) => {
    const catFees = fees.filter((f) => f.description.toLowerCase().includes(cat.name.toLowerCase().slice(0, 4)));
    return {
      ...cat,
      total: catFees.reduce((s, f) => s + f.amount, 0),
      collected: catFees.filter((f) => f.status === "PAID").reduce((s, f) => s + f.amount, 0),
    };
  });

  /* ---- Outstanding by student ---- */
  const outstandingByStudent = useMemo(() => {
    const map = new Map<string, { student: Student; total: number; paid: number }>();
    fees.forEach((f) => {
      if (!f.student) return;
      const existing = map.get(f.studentId) || { student: f.student, total: 0, paid: 0 };
      existing.total += f.amount;
      if (f.status === "PAID") existing.paid += f.amount;
      map.set(f.studentId, existing);
    });
    return Array.from(map.values())
      .map((e) => ({ ...e, balance: e.total - e.paid }))
      .filter((e) => e.balance > 0)
      .sort((a, b) => b.balance - a.balance);
  }, [fees]);

  /* ---- CRUD ---- */
  const handleCreate = async () => {
    if (!form.studentId || !form.amount || !form.description) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/api/fees`, {
        method: "POST",
        credentials: "include", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, amount: parseFloat(form.amount), term: parseInt(form.term) }),
      });
      const data = await res.json();
      if (data.success) {
        setFees([data.data, ...fees]);
        setShowAddModal(false);
        setForm({ studentId: "", amount: "", description: "", category: "tuition", term: "1", session: "2025/2026", paymentMethod: "cash" });
      }
    } catch { /* ignore */ }
    finally { setSubmitting(false); }
  };

  const handleStatusUpdate = async (id: string, status: string) => {
    try {
      const res = await fetch(`${API_URL}/api/fees/${id}`, {
        method: "PATCH",
        credentials: "include", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (data.success) {
        setFees(fees.map((f) => f.id === id ? { ...f, status, paidAt: status === "PAID" ? new Date().toISOString() : f.paidAt } : f));
        setEditFee(null);
      }
    } catch { /* ignore */ }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this fee record?")) return;
    try {
      const res = await fetch(`${API_URL}/api/fees/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) setFees(fees.filter((f) => f.id !== id));
    } catch { /* ignore */ }
  };

  if (loading) return <FeesSkeleton />;

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto">
      {/* ── Header ─────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between flex-wrap gap-3"
      >
        <div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 600, color: "var(--heading-color)" }}>
            Fee Management
          </h1>
          <p style={{ fontSize: 13, color: "var(--text-muted)", fontFamily: "var(--font-sans)", marginTop: 2 }}>
            Track school fees, payments and outstanding balances
          </p>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-secondary" style={{ gap: 6 }}>
            <Download style={{ width: 15, height: 15 }} /> Export
          </button>
          <button onClick={() => setShowAddModal(true)} className="btn btn-primary" style={{ gap: 6 }}>
            <Plus style={{ width: 15, height: 15 }} /> Record Payment
          </button>
        </div>
      </motion.div>

      {/* ── Summary Stat Cards ─────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Total Revenue", value: formatNaira(totalExpected), icon: <DollarSign style={{ width: 18, height: 18 }} />, color: "var(--brand)", bg: "rgba(11,110,79,0.08)" },
          { label: "Collected", value: formatNaira(totalPaid), icon: <CheckCircle style={{ width: 18, height: 18 }} />, color: "#17ab7d", bg: "rgba(23,171,125,0.08)" },
          { label: "Outstanding", value: formatNaira(outstanding), icon: <Clock style={{ width: 18, height: 18 }} />, color: outstanding > 0 ? "#f59e0b" : "var(--brand)", bg: outstanding > 0 ? "rgba(245,158,11,0.08)" : "rgba(11,110,79,0.08)" },
          { label: "Overdue", value: `${overdueCount} records`, icon: <AlertTriangle style={{ width: 18, height: 18 }} />, color: overdueCount > 0 ? "#f43f5e" : "#6b7c72", bg: overdueCount > 0 ? "rgba(244,63,94,0.08)" : "rgba(107,124,114,0.08)" },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="sh-card"
            style={{ padding: "16px 18px" }}
          >
            <div className="flex items-center justify-between mb-3">
              <span style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-muted)", fontFamily: "var(--font-sans)" }}>
                {stat.label}
              </span>
              <div style={{ width: 30, height: 30, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", background: stat.bg, color: stat.color }}>
                {stat.icon}
              </div>
            </div>
            <p className="sh-numeral" style={{ fontSize: 22, color: stat.color }}>
              {stat.value}
            </p>
          </motion.div>
        ))}
      </div>

      {/* ── Fee Categories ─────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <h3 style={{ fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 600, color: "var(--heading-color)", marginBottom: 12 }}>
          Fee Categories
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {categories.map((cat, i) => (
            <motion.div
              key={cat.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 + i * 0.04 }}
              whileHover={{ y: -2, scale: 1.02 }}
              className="sh-card"
              style={{ padding: "14px 12px", textAlign: "center", cursor: "default" }}
            >
              <div style={{ width: 36, height: 36, borderRadius: 10, background: cat.bg, color: cat.color, display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 8 }}>
                {cat.icon}
              </div>
              <p style={{ fontSize: 12, fontWeight: 600, color: "var(--heading-color)", fontFamily: "var(--font-sans)", marginBottom: 4 }}>
                {cat.name}
              </p>
              <p style={{ fontSize: 16, fontWeight: 800, color: cat.color, fontFamily: "var(--font-sans)" }}>
                {formatNaira(cat.collected)}
              </p>
              <div style={{ width: "100%", height: 3, borderRadius: 99, background: "var(--border)", marginTop: 8, overflow: "hidden" }}>
                <div style={{
                  width: `${cat.total > 0 ? (cat.collected / cat.total) * 100 : 0}%`,
                  height: "100%",
                  borderRadius: 99,
                  background: cat.color,
                  transition: "width 0.6s ease",
                }} />
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* ── Revenue Chart ──────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="sh-card" style={{ padding: "24px 28px" }}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 style={{ fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 600, color: "var(--heading-color)" }}>
              Revenue Trend
            </h3>
            <p style={{ fontSize: 12, color: "var(--text-muted)", fontFamily: "var(--font-sans)", marginTop: 2 }}>
              Monthly fee collection vs expected
            </p>
          </div>
          <div className="flex gap-4 items-center">
            <div className="flex items-center gap-2">
              <div style={{ width: 10, height: 10, borderRadius: 3, background: "var(--brand)" }} />
              <span style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-sans)" }}>Collected</span>
            </div>
            <div className="flex items-center gap-2">
              <div style={{ width: 10, height: 10, borderRadius: 3, background: "#f59e0b" }} />
              <span style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-sans)" }}>Expected</span>
            </div>
          </div>
        </div>
        <div style={{ width: "100%", height: 280 }}>
          <ResponsiveContainer>
            <BarChart data={monthlyData} barCategoryGap="20%">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: "var(--text-muted)", fontFamily: "var(--font-sans)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "var(--text-muted)", fontFamily: "var(--font-sans)" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="collected" name="Collected" fill="#12926a" radius={[6, 6, 0, 0]} />
              <Bar dataKey="expected" name="Expected" fill="#f59e0b" radius={[6, 6, 0, 0]} opacity={0.4} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* ── Tab Navigation ─────────────────────────── */}
      <div className="flex gap-1 p-1 rounded-xl" style={{ background: "var(--surface-2)" }}>
        {[
          { key: "overview" as const, label: "All Records" },
          { key: "outstanding" as const, label: `Outstanding (${outstandingByStudent.length})` },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className="flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all font-sans"
            style={{
              background: activeTab === tab.key ? "var(--surface)" : "transparent",
              color: activeTab === tab.key ? "var(--heading-color)" : "var(--text-muted)",
              boxShadow: activeTab === tab.key ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
              border: "none",
              minHeight: 44,
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Tab Content: All Records ───────────────── */}
      {activeTab === "overview" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--text-muted)" }} />
              <input
                type="text"
                placeholder="Search by student or description..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input-field"
                style={{ paddingLeft: 38 }}
              />
            </div>
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="input-field"
                style={{ paddingRight: 32, appearance: "none", minWidth: 140 }}
              >
                <option value="">All Status</option>
                <option value="PENDING">Pending</option>
                <option value="PARTIAL">Partial</option>
                <option value="PAID">Paid</option>
                <option value="OVERDUE">Overdue</option>
                <option value="WAIVED">Waived</option>
              </select>
              <ChevronDown style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", width: 14, height: 14, color: "var(--text-muted)", pointerEvents: "none" }} />
            </div>
          </div>

          {/* Table */}
          {filtered.length > 0 ? (
            <div className="card" style={{ padding: 0, overflow: "hidden" }}>
              <div style={{ overflowX: "auto" }}>
                <table className="data-table">
                  <thead>
                    <tr style={{ background: "var(--surface-2)" }}>
                      <th>Student</th>
                      <th>Description</th>
                      <th style={{ textAlign: "right" }}>Amount</th>
                      <th className="hidden sm:table-cell">Term</th>
                      <th>Status</th>
                      <th style={{ textAlign: "right" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((fee) => (
                      <tr key={fee.id}>
                        <td>
                          <p style={{ fontWeight: 600, color: "var(--heading-color)", fontSize: 13, fontFamily: "var(--font-sans)" }}>{fee.student?.fullName || " "}</p>
                          <p style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-sans)" }}>{fee.student?.admissionNumber}</p>
                        </td>
                        <td style={{ fontFamily: "var(--font-sans)", fontSize: 13 }}>{fee.description}</td>
                        <td style={{ textAlign: "right", fontFamily: "var(--font-sans)", fontWeight: 600 }}>{formatNaira(fee.amount)}</td>
                        <td className="hidden sm:table-cell" style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--text-muted)" }}>Term {fee.term}</td>
                        <td>{statusBadge(fee.status)}</td>
                        <td style={{ textAlign: "right" }}>
                          <div className="flex gap-1" style={{ justifyContent: "flex-end" }}>
                            <button onClick={() => setEditFee(fee)} className="btn btn-ghost" style={{ padding: "4px 8px", minHeight: 32 }}>
                              <Edit2 style={{ width: 14, height: 14 }} />
                            </button>
                            <button onClick={() => handleDelete(fee.id)} className="btn btn-ghost" style={{ padding: "4px 8px", minHeight: 32, color: "var(--color-danger)" }}>
                              <Trash2 style={{ width: 14, height: 14 }} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="text-center py-16" style={{ color: "var(--text-muted)" }}>
              <DollarSign style={{ width: 40, height: 40, margin: "0 auto 12px", opacity: 0.4 }} />
              <p style={{ fontFamily: "var(--font-sans)", fontSize: 14 }}>No fee records found.</p>
            </div>
          )}
        </motion.div>
      )}

      {/* ── Tab Content: Outstanding ────────────────── */}
      {activeTab === "outstanding" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {outstandingByStudent.length === 0 ? (
            <div className="text-center py-16" style={{ color: "var(--text-muted)" }}>
              <CheckCircle style={{ width: 40, height: 40, margin: "0 auto 12px", opacity: 0.4, color: "var(--brand)" }} />
              <p style={{ fontFamily: "var(--font-sans)", fontSize: 14, color: "var(--brand)", fontWeight: 600 }}>All fees cleared!</p>
              <p style={{ fontFamily: "var(--font-sans)", fontSize: 13, marginTop: 4 }}>No outstanding balances.</p>
            </div>
          ) : (
            <div className="card" style={{ padding: 0, overflow: "hidden" }}>
              <div style={{ overflowX: "auto" }}>
                <table className="data-table">
                  <thead>
                    <tr style={{ background: "var(--surface-2)" }}>
                      <th>Student</th>
                      <th>Admission #</th>
                      <th style={{ textAlign: "right" }}>Total Billed</th>
                      <th style={{ textAlign: "right" }}>Paid</th>
                      <th style={{ textAlign: "right" }}>Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {outstandingByStudent.map((entry) => (
                      <tr key={entry.student.id}>
                        <td style={{ fontWeight: 600, color: "var(--heading-color)", fontSize: 13, fontFamily: "var(--font-sans)" }}>
                          {entry.student.fullName}
                        </td>
                        <td style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--brand)" }}>
                          {entry.student.admissionNumber}
                        </td>
                        <td style={{ textAlign: "right", fontFamily: "var(--font-sans)" }}>{formatNaira(entry.total)}</td>
                        <td style={{ textAlign: "right", fontFamily: "var(--font-sans)", color: "var(--brand)" }}>{formatNaira(entry.paid)}</td>
                        <td style={{ textAlign: "right" }}>
                          <span className="badge badge-red" style={{ fontSize: 12, fontWeight: 700 }}>
                            {formatNaira(entry.balance)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* ── Add Fee Modal ──────────────────────────── */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-overlay"
            onClick={(e) => { if (e.target === e.currentTarget) setShowAddModal(false); }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: "spring" as const, stiffness: 400, damping: 30 }}
              className="modal-content"
            >
              <div className="flex items-center justify-between" style={{ marginBottom: 20 }}>
                <h2 style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 600, color: "var(--heading-color)" }}>
                  Record Payment
                </h2>
                <button onClick={() => setShowAddModal(false)} className="btn btn-ghost" style={{ padding: 6, minHeight: 32 }}>
                  <X style={{ width: 16, height: 16 }} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="label">Student *</label>
                  <select
                    value={form.studentId}
                    onChange={(e) => setForm({ ...form, studentId: e.target.value })}
                    className="input-field"
                  >
                    <option value="">Select student</option>
                    {students.map((s) => (
                      <option key={s.id} value={s.id}>{s.fullName} ({s.admissionNumber})</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Amount (₦) *</label>
                    <input
                      type="number"
                      placeholder="0.00"
                      value={form.amount}
                      onChange={(e) => setForm({ ...form, amount: e.target.value })}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="label">Category</label>
                    <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="input-field">
                      <option value="tuition">Tuition</option>
                      <option value="uniform">Uniform</option>
                      <option value="transport">Transport</option>
                      <option value="development">Development Levy</option>
                      <option value="feeding">Feeding</option>
                      <option value="others">Others</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="label">Description *</label>
                  <input
                    type="text"
                    placeholder="e.g. Tuition - Term 1"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="input-field"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="label">Term</label>
                    <select value={form.term} onChange={(e) => setForm({ ...form, term: e.target.value })} className="input-field">
                      <option value="1">Term 1</option>
                      <option value="2">Term 2</option>
                      <option value="3">Term 3</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Session</label>
                    <input type="text" value={form.session} onChange={(e) => setForm({ ...form, session: e.target.value })} className="input-field" />
                  </div>
                  <div>
                    <label className="label">Payment Method</label>
                    <select value={form.paymentMethod} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })} className="input-field">
                      <option value="cash">Cash</option>
                      <option value="transfer">Transfer</option>
                      <option value="pos">POS</option>
                      <option value="paystack">Paystack</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-3 pt-2" style={{ borderTop: "1px solid var(--border)" }}>
                  <button onClick={() => setShowAddModal(false)} className="btn btn-secondary" style={{ flex: 1 }}>
                    Cancel
                  </button>
                  <button
                    onClick={handleCreate}
                    disabled={submitting || !form.studentId || !form.amount || !form.description}
                    className="btn btn-primary"
                    style={{ flex: 1, justifyContent: "center" }}
                  >
                    {submitting ? <Loader2 style={{ width: 16, height: 16, animation: "spin 1s linear infinite" }} /> : <Plus style={{ width: 16, height: 16 }} />}
                    {submitting ? "Saving..." : "Record Payment"}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Edit Status Modal ──────────────────────── */}
      <AnimatePresence>
        {editFee && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-overlay"
            onClick={(e) => { if (e.target === e.currentTarget) setEditFee(null); }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="modal-content"
              style={{ maxWidth: 400 }}
            >
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 600, color: "var(--heading-color)", marginBottom: 8 }}>
                Update Payment Status
              </h2>
              <p style={{ fontSize: 13, color: "var(--text-muted)", fontFamily: "var(--font-sans)", marginBottom: 16 }}>
                {editFee.student?.fullName}   {formatNaira(editFee.amount)}
              </p>
              <div className="grid grid-cols-2 gap-2">
                {["PAID", "PARTIAL", "PENDING", "OVERDUE", "WAIVED"].map((s) => (
                  <button
                    key={s}
                    onClick={() => handleStatusUpdate(editFee.id, s)}
                    className="btn"
                    style={{
                      justifyContent: "center",
                      background: editFee.status === s ? "var(--brand)" : "var(--surface)",
                      color: editFee.status === s ? "#fff" : "var(--text)",
                      border: `1.5px solid ${editFee.status === s ? "var(--brand)" : "var(--border)"}`,
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
              <button onClick={() => setEditFee(null)} className="btn btn-secondary" style={{ width: "100%", marginTop: 12, justifyContent: "center" }}>
                Cancel
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
