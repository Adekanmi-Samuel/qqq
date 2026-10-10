"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield, Search, AlertTriangle, CheckCircle, XCircle, Ban, Eye,
  Clock, ChevronLeft, ChevronRight, X, MessageSquare, Flag, UserX,
} from "lucide-react";

/* ================================================================== */
/*  Types                                                              */
/* ================================================================== */

type ReportStatus = "pending" | "reviewed" | "resolved" | "dismissed";
type ReportCategory = "inappropriate" | "harassment" | "spam" | "other";
type StrikeAction = "dismiss" | "warn" | "suspend_1d" | "suspend_7d" | "suspend_30d" | "ban";

interface Report {
  id: string;
  reporterName: string;
  reportedName: string;
  reason: string;
  category: ReportCategory;
  date: string;
  status: ReportStatus;
  description: string;
  strikes: number;
}

/* ================================================================== */
/*  Mock Data                                                          */
/* ================================================================== */

const MOCK_REPORTS: Report[] = [
  { id: "rpt1", reporterName: "Chioma Nwosu", reportedName: "Yusuf Abdullahi", reason: "Using inappropriate language in class chat", category: "harassment", date: "2026-08-25", status: "pending", description: "Student repeatedly used offensive language directed at other students in the class discussion group.", strikes: 1 },
  { id: "rpt2", reporterName: "Ngozi Okonkwo", reportedName: "Chinedu Obi", reason: "Sharing unauthorized content", category: "inappropriate", date: "2026-08-24", status: "pending", description: "A student shared non-academic content that violates school community guidelines.", strikes: 0 },
  { id: "rpt3", reporterName: "Blessing Eze", reportedName: "Aisha Bello", reason: "Spam messages in notice board", category: "spam", date: "2026-08-23", status: "reviewed", description: "Multiple duplicate messages posted on the notice board within a short period.", strikes: 2 },
  { id: "rpt4", reporterName: "Emeka Chukwu", reportedName: "Ibrahim Musa", reason: "Harassing behavior toward staff", category: "harassment", date: "2026-08-22", status: "resolved", description: "Student displayed aggressive and disrespectful behavior toward a teacher during an online session.", strikes: 2 },
  { id: "rpt5", reporterName: "Adewale Johnson", reportedName: "Tunde Williams", reason: "Posting spam advertisements", category: "spam", date: "2026-08-21", status: "dismissed", description: "Report found to be a false alarm   student was sharing a school-approved event.", strikes: 0 },
  { id: "rpt6", reporterName: "Fatima Abubakar", reportedName: "Sade Akinola", reason: "Offensive content in assignment submission", category: "inappropriate", date: "2026-08-20", status: "pending", description: "Submitted an assignment containing inappropriate imagery that violates school policy.", strikes: 1 },
];

const CATEGORY_LABELS: Record<ReportCategory, string> = {
  inappropriate: "Inappropriate Content",
  harassment: "Harassment",
  spam: "Spam",
  other: "Other",
};

const CATEGORY_COLORS: Record<ReportCategory, string> = {
  inappropriate: "bg-red-100 text-red-700",
  harassment: "bg-sh-amber-100 text-sh-amber-700",
  spam: "bg-sh-blue-50 text-sh-blue-600",
  other: "bg-sh-ink-100 text-sh-ink-700",
};

const STATUS_STYLES: Record<ReportStatus, { bg: string; text: string; dot: string; label: string }> = {
  pending:   { bg: "bg-sh-amber-500/10", text: "text-sh-amber-700", dot: "bg-sh-amber-500", label: "Pending" },
  reviewed:  { bg: "bg-sh-blue-50/10", text: "text-sh-blue-600", dot: "bg-sh-blue-600", label: "Reviewed" },
  resolved:  { bg: "bg-emerald-500/10", text: "text-emerald-700", dot: "bg-emerald-500", label: "Resolved" },
  dismissed: { bg: "bg-sh-ink-100", text: "text-sh-ink-500", dot: "bg-sh-ink-400", label: "Dismissed" },
};

/* ================================================================== */
/*  Main                                                               */
/* ================================================================== */

export default function ModerationPage() {
  const [reports, setReports] = useState<Report[]>(MOCK_REPORTS);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ReportStatus | "all">("all");
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [showActionModal, setShowActionModal] = useState<{ report: Report; action: StrikeAction } | null>(null);

  const filtered = useMemo(() => {
    return reports.filter((r) => {
      if (search && !r.reportedName.toLowerCase().includes(search.toLowerCase()) && !r.reporterName.toLowerCase().includes(search.toLowerCase())) return false;
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      return true;
    });
  }, [reports, search, statusFilter]);

  const stats = useMemo(() => ({
    total: reports.length,
    pending: reports.filter((r) => r.status === "pending").length,
    resolvedWeek: reports.filter((r) => r.status === "resolved").length,
    withStrikes: reports.filter((r) => r.strikes >= 2).length,
  }), [reports]);

  const handleAction = (report: Report, action: StrikeAction) => {
    setShowActionModal({ report, action });
  };

  const confirmAction = () => {
    if (!showActionModal) return;
    const { report, action } = showActionModal;

    setReports((prev) => prev.map((r) => {
      if (r.id !== report.id) return r;
      switch (action) {
        case "dismiss": return { ...r, status: "dismissed" as ReportStatus };
        case "warn": return { ...r, strikes: r.strikes + 1, status: "resolved" as ReportStatus };
        case "suspend_1d":
        case "suspend_7d":
        case "suspend_30d":
          return { ...r, strikes: r.strikes + 1, status: "resolved" as ReportStatus };
        case "ban": return { ...r, strikes: r.strikes + 1, status: "resolved" as ReportStatus };
        default: return r;
      }
    }));

    setSelectedReport((prev) => prev?.id === report.id ? null : prev);
    setShowActionModal(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--heading-color)" }}>Moderation Queue</h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>Review reports and manage community safety</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Reports", value: stats.total, icon: Flag, color: "text-sh-green-700" },
          { label: "Pending Review", value: stats.pending, icon: Clock, color: "text-sh-amber-600" },
          { label: "Resolved", value: stats.resolvedWeek, icon: CheckCircle, color: "text-emerald-600" },
          { label: "High Strikes", value: stats.withStrikes, icon: AlertTriangle, color: "text-red-600" },
        ].map((s) => (
          <div key={s.label} className="stat-card">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-sh-green-50 ${s.color}`}>
                <s.icon size={20} />
              </div>
              <div>
                <p className="text-2xl font-bold sh-numeral" style={{ color: "var(--heading-color)" }}>{s.value}</p>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>{s.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="sh-card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
            <input type="text" placeholder="Search by user..." value={search} onChange={(e) => setSearch(e.target.value)} className="input-field pl-10" />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)} className="input-field w-full sm:w-36">
            <option value="all">All Status</option>
            {(["pending", "reviewed", "resolved", "dismissed"] as ReportStatus[]).map((s) => <option key={s} value={s}>{STATUS_STYLES[s].label}</option>)}
          </select>
        </div>
      </div>

      {/* Reports Table */}
      <div className="sh-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Reporter</th>
                <th>Reported User</th>
                <th className="hidden md:table-cell">Category</th>
                <th>Reason</th>
                <th>Status</th>
                <th className="hidden sm:table-cell">Strikes</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((report) => (
                <tr key={report.id} className="cursor-pointer" onClick={() => setSelectedReport(report)}>
                  <td className="text-sm" style={{ color: "var(--text)" }}>{report.reporterName}</td>
                  <td className="text-sm font-medium" style={{ color: "var(--text)" }}>{report.reportedName}</td>
                  <td className="hidden md:table-cell">
                    <span className={`badge text-xs ${CATEGORY_COLORS[report.category]}`}>{CATEGORY_LABELS[report.category]}</span>
                  </td>
                  <td className="text-xs max-w-[200px] truncate" style={{ color: "var(--text-muted)" }}>{report.reason}</td>
                  <td>
                    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${STATUS_STYLES[report.status].text}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${STATUS_STYLES[report.status].dot}`} />
                      {STATUS_STYLES[report.status].label}
                    </span>
                  </td>
                  <td className="hidden sm:table-cell">
                    <span className={`text-xs font-bold ${report.strikes >= 2 ? "text-red-600" : report.strikes >= 1 ? "text-sh-amber-600" : "text-sh-ink-400"}`}>
                      {report.strikes}/3
                    </span>
                  </td>
                  <td>
                    {report.status === "pending" && (
                      <button onClick={(e) => { e.stopPropagation(); setSelectedReport(report); }} className="text-xs text-sh-green-800 hover:text-sh-green-600 font-medium">
                        Review
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-12">
                    <Shield size={40} className="mx-auto mb-3" style={{ color: "var(--text-muted)", opacity: 0.4 }} />
                    <p className="text-sm" style={{ color: "var(--text-muted)" }}>No reports found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Report Detail Panel */}
      <AnimatePresence>
        {selectedReport && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 z-40" onClick={() => setSelectedReport(null)} />
            <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-md z-50 overflow-y-auto" style={{ backgroundColor: "var(--card-bg)" }}>
              <div className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold" style={{ color: "var(--heading-color)" }}>Report Details</h2>
                  <button onClick={() => setSelectedReport(null)} className="p-2 rounded-lg hover:bg-sh-green-50"><X size={18} /></button>
                </div>

                <div className="space-y-3">
                  <div className="p-3 rounded-xl" style={{ backgroundColor: "var(--surface-2, var(--bg))" }}>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>Reported User</p>
                    <p className="text-sm font-semibold" style={{ color: "var(--heading-color)" }}>{selectedReport.reportedName}</p>
                  </div>
                  <div className="p-3 rounded-xl" style={{ backgroundColor: "var(--surface-2, var(--bg))" }}>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>Reported By</p>
                    <p className="text-sm font-medium" style={{ color: "var(--text)" }}>{selectedReport.reporterName}</p>
                  </div>
                  <div className="p-3 rounded-xl" style={{ backgroundColor: "var(--surface-2, var(--bg))" }}>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>Category</p>
                    <span className={`badge text-xs mt-1 ${CATEGORY_COLORS[selectedReport.category]}`}>{CATEGORY_LABELS[selectedReport.category]}</span>
                  </div>
                  <div className="p-3 rounded-xl" style={{ backgroundColor: "var(--surface-2, var(--bg))" }}>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>Description</p>
                    <p className="text-sm mt-1" style={{ color: "var(--text)" }}>{selectedReport.description}</p>
                  </div>
                  <div className="p-3 rounded-xl" style={{ backgroundColor: "var(--surface-2, var(--bg))" }}>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>Strike History</p>
                    <p className={`text-lg font-bold mt-1 ${selectedReport.strikes >= 2 ? "text-red-600" : "text-sh-amber-600"}`}>
                      {selectedReport.strikes} / 3 strikes
                    </p>
                    {selectedReport.strikes >= 2 && (
                      <p className="text-xs text-red-600 mt-1">One more strike will result in automatic suspension</p>
                    )}
                  </div>
                </div>

                {selectedReport.status === "pending" && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Take Action</p>
                    <div className="grid grid-cols-2 gap-2">
                      <button onClick={() => handleAction(selectedReport, "dismiss")} className="btn btn-ghost text-xs justify-start gap-2">
                        <XCircle size={14} /> Dismiss
                      </button>
                      <button onClick={() => handleAction(selectedReport, "warn")} className="btn bg-sh-amber-100 text-sh-amber-700 hover:bg-sh-amber-300/30 border-none text-xs justify-start gap-2">
                        <AlertTriangle size={14} /> Warn
                      </button>
                      <button onClick={() => handleAction(selectedReport, "suspend_7d")} className="btn bg-red-50 text-red-600 hover:bg-red-100 border-none text-xs justify-start gap-2">
                        <UserX size={14} /> Suspend 7d
                      </button>
                      <button onClick={() => handleAction(selectedReport, "ban")} className="btn btn-danger text-xs justify-start gap-2">
                        <Ban size={14} /> Ban User
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Confirm Action Modal */}
      <AnimatePresence>
        {showActionModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="modal-overlay" onClick={() => setShowActionModal(null)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-sh-amber-100">
                  <AlertTriangle size={20} className="text-sh-amber-600" />
                </div>
                <div>
                  <h3 className="font-bold" style={{ color: "var(--heading-color)" }}>
                    Confirm {showActionModal.action.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                  </h3>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    This action will be applied to {showActionModal.report.reportedName}
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button onClick={() => setShowActionModal(null)} className="btn btn-ghost">Cancel</button>
                <button onClick={confirmAction} className="btn btn-primary">Confirm</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
