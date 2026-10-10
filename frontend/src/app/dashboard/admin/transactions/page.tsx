"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  CreditCard, Search, Download, Filter, TrendingUp, TrendingDown,
  ArrowUpRight, ArrowDownRight, ChevronLeft, ChevronRight, Clock,
  CheckCircle, XCircle, AlertTriangle, RefreshCw,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

/* ================================================================== */
/*  Types                                                              */
/* ================================================================== */

type TxStatus = "completed" | "pending" | "failed" | "refunded";
type TxMethod = "cash" | "transfer" | "pos" | "paystack";
type TxType = "fee_payment" | "salary" | "refund" | "other";

interface Transaction {
  id: string;
  date: string;
  studentName: string;
  type: TxType;
  category: string;
  amount: number;
  method: TxMethod;
  status: TxStatus;
  receiptNo: string | null;
}

/* ================================================================== */
/*  Mock Data                                                          */
/* ================================================================== */

const MOCK_TX: Transaction[] = [
  { id: "TXN001", date: "2026-08-25", studentName: "Blessing Eze", type: "fee_payment", category: "Tuition", amount: 150000, method: "transfer", status: "completed", receiptNo: "RCP-2026-001" },
  { id: "TXN002", date: "2026-08-25", studentName: "Yusuf Abdullahi", type: "fee_payment", category: "Tuition", amount: 150000, method: "paystack", status: "completed", receiptNo: "RCP-2026-002" },
  { id: "TXN003", date: "2026-08-24", studentName: "Oluwaseun Ade", type: "fee_payment", category: "Uniform", amount: 25000, method: "cash", status: "completed", receiptNo: "RCP-2026-003" },
  { id: "TXN004", date: "2026-08-24", studentName: "Ifeoma Nnamdi", type: "fee_payment", category: "Transport", amount: 45000, method: "pos", status: "completed", receiptNo: "RCP-2026-004" },
  { id: "TXN005", date: "2026-08-23", studentName: "Abdulrahman Suleiman", type: "fee_payment", category: "Tuition", amount: 120000, method: "transfer", status: "pending", receiptNo: null },
  { id: "TXN006", date: "2026-08-23", studentName: "Ngozi Obi", type: "refund", category: "Transport", amount: 20000, method: "transfer", status: "refunded", receiptNo: "RCP-2026-005" },
  { id: "TXN007", date: "2026-08-22", studentName: "Chinedu Obi", type: "fee_payment", category: "Feeding", amount: 35000, method: "cash", status: "completed", receiptNo: "RCP-2026-006" },
  { id: "TXN008", date: "2026-08-22", studentName: "Aisha Bello", type: "fee_payment", category: "Dev Levy", amount: 10000, method: "paystack", status: "failed", receiptNo: null },
  { id: "TXN009", date: "2026-08-21", studentName: "Emeka Chukwu", type: "salary", category: "Staff Salary", amount: 250000, method: "transfer", status: "completed", receiptNo: null },
  { id: "TXN010", date: "2026-08-21", studentName: "Blessing Eze", type: "fee_payment", category: "Tuition", amount: 50000, method: "pos", status: "completed", receiptNo: "RCP-2026-007" },
  { id: "TXN011", date: "2026-08-20", studentName: "Tunde Williams", type: "fee_payment", category: "Uniform", amount: 25000, method: "cash", status: "completed", receiptNo: "RCP-2026-008" },
  { id: "TXN012", date: "2026-08-20", studentName: "Sade Akinola", type: "fee_payment", category: "Transport", amount: 45000, method: "transfer", status: "completed", receiptNo: "RCP-2026-009" },
];

const REVENUE_BY_MONTH = [
  { month: "Apr", collected: 1200000, expected: 1500000 },
  { month: "May", collected: 1350000, expected: 1500000 },
  { month: "Jun", collected: 980000, expected: 1500000 },
  { month: "Jul", collected: 1420000, expected: 1500000 },
  { month: "Aug", collected: 875000, expected: 1500000 },
];

const PER_PAGE = 8;

const METHOD_LABELS: Record<TxMethod, string> = { cash: "Cash", transfer: "Bank Transfer", pos: "POS", paystack: "Paystack" };
const STATUS_STYLES: Record<TxStatus, { bg: string; text: string; dot: string }> = {
  completed: { bg: "bg-emerald-500/10", text: "text-emerald-700", dot: "bg-emerald-500" },
  pending:   { bg: "bg-sh-amber-500/10", text: "text-sh-amber-700", dot: "bg-sh-amber-500" },
  failed:    { bg: "bg-red-500/10", text: "text-red-600", dot: "bg-red-500" },
  refunded:  { bg: "bg-sh-blue-50/10", text: "text-sh-blue-600", dot: "bg-sh-blue-600" },
};

function formatNaira(amount: number) {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", minimumFractionDigits: 0 }).format(amount);
}

/* ================================================================== */
/*  Main                                                               */
/* ================================================================== */

export default function TransactionsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<TxStatus | "all">("all");
  const [methodFilter, setMethodFilter] = useState<TxMethod | "all">("all");
  const [page, setPage] = useState(1);
  const [showRefundModal, setShowRefundModal] = useState<Transaction | null>(null);

  const filtered = useMemo(() => {
    return MOCK_TX.filter((t) => {
      if (search && !t.studentName.toLowerCase().includes(search.toLowerCase()) && !t.id.toLowerCase().includes(search.toLowerCase())) return false;
      if (statusFilter !== "all" && t.status !== statusFilter) return false;
      if (methodFilter !== "all" && t.method !== methodFilter) return false;
      return true;
    });
  }, [search, statusFilter, methodFilter]);

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const stats = useMemo(() => ({
    totalRevenue: MOCK_TX.filter((t) => t.status === "completed" && t.type !== "refund" && t.type !== "salary").reduce((s, t) => s + t.amount, 0),
    thisMonth: MOCK_TX.filter((t) => t.status === "completed" && t.date.startsWith("2026-08")).reduce((s, t) => s + t.amount, 0),
    pending: MOCK_TX.filter((t) => t.status === "pending").reduce((s, t) => s + t.amount, 0),
    refunded: MOCK_TX.filter((t) => t.status === "refunded").reduce((s, t) => s + t.amount, 0),
  }), []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--heading-color)" }}>Transactions</h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>Track all payments and financial activity</p>
        </div>
        <button className="btn btn-secondary inline-flex items-center gap-2">
          <Download size={16} /> Export CSV
        </button>
      </div>

      {/* Revenue Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Revenue", value: stats.totalRevenue, icon: TrendingUp, color: "text-sh-green-700", trend: "+12%", up: true },
          { label: "This Month", value: stats.thisMonth, icon: CreditCard, color: "text-sh-green-600", trend: "+8%", up: true },
          { label: "Pending", value: stats.pending, icon: Clock, color: "text-sh-amber-600", trend: "", up: false },
          { label: "Refunded", value: stats.refunded, icon: RefreshCw, color: "text-red-600", trend: "", up: false },
        ].map((s) => (
          <div key={s.label} className="stat-card">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-sh-green-50 ${s.color}`}>
                <s.icon size={20} />
              </div>
              {s.trend && (
                <span className={`text-xs font-medium flex items-center gap-0.5 ${s.up ? "text-emerald-600" : "text-red-600"}`}>
                  {s.up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                  {s.trend}
                </span>
              )}
            </div>
            <p className="text-xl font-bold sh-numeral" style={{ color: "var(--heading-color)" }}>{formatNaira(s.value)}</p>
            <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Revenue Chart */}
      <div className="sh-card p-6">
        <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--heading-color)" }}>Revenue Trend</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={REVENUE_BY_MONTH} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: "var(--text-muted)" }} />
              <YAxis tick={{ fontSize: 12, fill: "var(--text-muted)" }} tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} />
              <Tooltip formatter={(v) => formatNaira(Number(v))} contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", backgroundColor: "var(--card-bg)" }} />
              <Bar dataKey="expected" fill="var(--border)" radius={[4, 4, 0, 0]} name="Expected" />
              <Bar dataKey="collected" fill="#0b6e4f" radius={[4, 4, 0, 0]} name="Collected" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Filters */}
      <div className="sh-card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
            <input type="text" placeholder="Search by student or transaction ID..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="input-field pl-10" />
          </div>
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value as any); setPage(1); }} className="input-field w-full sm:w-36">
            <option value="all">All Status</option>
            {(["completed", "pending", "failed", "refunded"] as TxStatus[]).map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
          </select>
          <select value={methodFilter} onChange={(e) => { setMethodFilter(e.target.value as any); setPage(1); }} className="input-field w-full sm:w-40">
            <option value="all">All Methods</option>
            {(["cash", "transfer", "pos", "paystack"] as TxMethod[]).map((m) => <option key={m} value={m}>{METHOD_LABELS[m]}</option>)}
          </select>
        </div>
      </div>

      {/* Transaction Table */}
      <div className="sh-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Date</th>
                <th>Student</th>
                <th className="hidden md:table-cell">Category</th>
                <th>Amount</th>
                <th className="hidden sm:table-cell">Method</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((tx) => (
                <tr key={tx.id}>
                  <td className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>{tx.id}</td>
                  <td className="text-sm" style={{ color: "var(--text)" }}>
                    {new Date(tx.date).toLocaleDateString("en-NG", { day: "2-digit", month: "short" })}
                  </td>
                  <td className="text-sm font-medium" style={{ color: "var(--text)" }}>{tx.studentName}</td>
                  <td className="hidden md:table-cell">
                    <span className="badge badge-slate text-xs">{tx.category}</span>
                  </td>
                  <td className="text-sm font-semibold" style={{ color: "var(--heading-color)" }}>{formatNaira(tx.amount)}</td>
                  <td className="hidden sm:table-cell text-xs" style={{ color: "var(--text-muted)" }}>{METHOD_LABELS[tx.method]}</td>
                  <td>
                    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${STATUS_STYLES[tx.status].text}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${STATUS_STYLES[tx.status].dot}`} />
                      {tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
                    </span>
                  </td>
                  <td>
                    {tx.status === "completed" && (
                      <button onClick={() => setShowRefundModal(tx)} className="text-xs text-red-600 hover:text-red-800 font-medium">Refund</button>
                    )}
                  </td>
                </tr>
              ))}
              {paginated.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-12">
                    <CreditCard size={40} className="mx-auto mb-3" style={{ color: "var(--text-muted)", opacity: 0.4 }} />
                    <p className="text-sm" style={{ color: "var(--text-muted)" }}>No transactions found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t" style={{ borderColor: "var(--border)" }}>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>Page {page} of {totalPages}</p>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="btn-ghost p-1.5 disabled:opacity-30"><ChevronLeft size={16} /></button>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="btn-ghost p-1.5 disabled:opacity-30"><ChevronRight size={16} /></button>
            </div>
          </div>
        )}
      </div>

      {/* Refund Confirmation Modal */}
      {showRefundModal && (
        <div className="modal-overlay" onClick={() => setShowRefundModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-sh-amber-100">
                <AlertTriangle size={20} className="text-sh-amber-600" />
              </div>
              <div>
                <h3 className="font-bold" style={{ color: "var(--heading-color)" }}>Confirm Refund</h3>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>This will refund {formatNaira(showRefundModal.amount)} to {showRefundModal.studentName}</p>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setShowRefundModal(null)} className="btn btn-ghost">Cancel</button>
              <button onClick={() => setShowRefundModal(null)} className="btn btn-danger">Process Refund</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
