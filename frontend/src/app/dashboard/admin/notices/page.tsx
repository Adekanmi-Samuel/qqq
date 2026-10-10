"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell, Plus, X, Send, Trash2, Eye, Calendar, Filter,
  MessageSquare, AlertTriangle, CheckCircle, ChevronDown,
  Mail, Clock, ArrowUpDown, Paperclip, FileText,
} from "lucide-react";
import { api } from "@/lib/api";

/* ================================================================== */
/*  Types                                                              */
/* ================================================================== */

interface Notice {
  id: string;
  title: string;
  body: string;
  targetType: string;
  priority: "LOW" | "NORMAL" | "HIGH" | "URGENT";
  sendEmail: boolean;
  published: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: { fullName: string } | null;
}

/* ================================================================== */
/*  Constants                                                          */
/* ================================================================== */

const MAX_CONTENT_LENGTH = 2000;

const PRIORITY_CONFIG = {
  LOW:    { label: "Low",    color: "bg-green-100 text-green-700 border-green-200",  dot: "bg-green-500",  border: "border-l-green-500" },
  NORMAL: { label: "Normal", color: "bg-blue-100 text-blue-700 border-blue-200",    dot: "bg-blue-500",   border: "border-l-blue-500" },
  HIGH:   { label: "High",   color: "bg-amber-100 text-amber-700 border-amber-200",  dot: "bg-amber-500",  border: "border-l-amber-500" },
  URGENT: { label: "Urgent", color: "bg-red-100 text-red-700 border-red-200",        dot: "bg-red-500",    border: "border-l-red-500" },
} as const;

const TARGET_OPTIONS = [
  { value: "ALL",     label: "All" },
  { value: "PARENTS", label: "Parents" },
  { value: "TEACHERS",label: "Teachers" },
  { value: "STUDENTS",label: "Students" },
  { value: "CLASS",   label: "Specific Class" },
] as const;

const FILTER_TABS = ["All", "Published", "Drafts"] as const;
const SORT_OPTIONS = ["Newest", "Oldest", "Priority"] as const;

/* ================================================================== */
/*  Helpers                                                            */
/* ================================================================== */

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

function formatDateTime(dateStr: string): string {
  const d = new Date(dateStr);
  const time = d.toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" });
  return `${formatDate(dateStr)} at ${time}`;
}

const PRIORITY_ORDER: Record<string, number> = { URGENT: 0, HIGH: 1, NORMAL: 2, LOW: 3 };

/* ================================================================== */
/*  Component                                                          */
/* ================================================================== */

export default function AdminNoticesPage() {
  /* ---- state ---- */
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // filters / sort
  const [activeFilter, setActiveFilter] = useState<string>("All");
  const [sortBy, setSortBy] = useState<string>("Newest");
  const [showSortMenu, setShowSortMenu] = useState(false);

  // create form
  const [showCreate, setShowCreate] = useState(false);
  const [formTitle, setFormTitle] = useState("");
  const [formBody, setFormBody] = useState("");
  const [formTarget, setFormTarget] = useState("ALL");
  const [formPriority, setFormPriority] = useState<Notice["priority"]>("NORMAL");
  const [formSendEmail, setFormSendEmail] = useState(false);
  const [formPublishNow, setFormPublishNow] = useState(true);
  const [saving, setSaving] = useState(false);

  // detail panel
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);

  /* ---- data fetch ---- */
  const loadNotices = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.get<{ success: boolean; data: Notice[] }>("/api/notices");
      if (data.success) setNotices(data.data);
    } catch {
      setError("Failed to load notices.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotices();
  }, [loadNotices]);

  useEffect(() => {
    if (!success) return;
    const t = setTimeout(() => setSuccess(""), 3000);
    return () => clearTimeout(t);
  }, [success]);

  useEffect(() => {
    if (!error) return;
    const t = setTimeout(() => setError(""), 5000);
    return () => clearTimeout(t);
  }, [error]);

  /* ---- computed ---- */
  const stats = useMemo(() => {
    const total = notices.length;
    const published = notices.filter((n) => n.published).length;
    const drafts = total - published;
    const alertsSent = notices.filter((n) => n.sendEmail).length;
    return { total, published, drafts, alertsSent };
  }, [notices]);

  const filtered = useMemo(() => {
    let result = [...notices];
    if (activeFilter === "Published") result = result.filter((n) => n.published);
    if (activeFilter === "Drafts") result = result.filter((n) => !n.published);

    if (sortBy === "Newest") {
      result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (sortBy === "Oldest") {
      result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    } else if (sortBy === "Priority") {
      result.sort((a, b) => (PRIORITY_ORDER[a.priority] ?? 99) - (PRIORITY_ORDER[b.priority] ?? 99));
    }
    return result;
  }, [notices, activeFilter, sortBy]);

  /* ---- handlers ---- */
  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await api.post("/api/notices", {
        title: formTitle.trim(),
        body: formBody.trim(),
        targetType: formTarget,
        priority: formPriority,
        sendEmail: formSendEmail,
        publishNow: formPublishNow,
      });
      setSuccess(formPublishNow ? "Notice published successfully!" : "Notice saved as draft!");
      resetForm();
      setShowCreate(false);
      loadNotices();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create notice.";
      setError(msg);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this notice? This action cannot be undone.")) return;
    try {
      await api.delete(`/api/notices/${id}`);
      setSuccess("Notice deleted.");
      if (selectedNotice?.id === id) setSelectedNotice(null);
      loadNotices();
    } catch {
      setError("Failed to delete notice.");
    }
  }

  function resetForm() {
    setFormTitle("");
    setFormBody("");
    setFormTarget("ALL");
    setFormPriority("NORMAL");
    setFormSendEmail(false);
    setFormPublishNow(true);
  }

  function openCreate() {
    resetForm();
    setShowCreate(true);
  }

  /* ---- render ---- */
  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      {/* ============ HEADER ============ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-semibold" style={{ color: "var(--heading-color)" }}>
            Notices
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
            Manage school-wide announcements and communications
          </p>
        </div>
        <button
          onClick={openCreate}
          className="btn btn-primary inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          New Notice
        </button>
      </div>

      {/* ============ ALERTS ============ */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mb-4 p-3 rounded-xl flex items-start gap-2 text-sm"
            style={{ background: "color-mix(in srgb, #ef4444 8%, var(--card-bg))", color: "#ef4444", border: "1px solid color-mix(in srgb, #ef4444 20%, var(--card-border))" }}
          >
            <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            {error}
          </motion.div>
        )}
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mb-4 p-3 rounded-xl flex items-start gap-2 text-sm"
            style={{ background: "color-mix(in srgb, #0b6e4f 8%, var(--card-bg))", color: "var(--brand)", border: "1px solid color-mix(in srgb, #0b6e4f 20%, var(--card-border))" }}
          >
            <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            {success}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ============ STATS BAR ============ */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <StatCard icon={<Bell className="w-4 h-4" />} label="Total Notices" value={stats.total} />
        <StatCard icon={<CheckCircle className="w-4 h-4" />} label="Published" value={stats.published} accent="green" />
        <StatCard icon={<FileText className="w-4 h-4" />} label="Drafts" value={stats.drafts} accent="amber" />
        <StatCard icon={<MessageSquare className="w-4 h-4" />} label="Alerts Sent" value={stats.alertsSent} accent="blue" />
      </div>

      {/* ============ FILTER / SORT BAR ============ */}
      {!loading && notices.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          {/* Filter tabs */}
          <div className="flex gap-1 p-1 rounded-xl" style={{ background: "var(--surface)" }}>
            {FILTER_TABS.map((tab) => {
              const count = tab === "All" ? notices.length
                : tab === "Published" ? stats.published
                : stats.drafts;
              return (
                <button
                  key={tab}
                  onClick={() => setActiveFilter(tab)}
                  className="relative px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
                  style={{
                    color: activeFilter === tab ? "var(--heading-color)" : "var(--text-muted)",
                    background: activeFilter === tab ? "var(--card-bg)" : "transparent",
                    boxShadow: activeFilter === tab ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                  }}
                >
                  {tab}
                  <span className="ml-1.5 text-xs opacity-60">{count}</span>
                </button>
              );
            })}
          </div>

          {/* Sort dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowSortMenu(!showSortMenu)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
              style={{ color: "var(--text-muted)", background: "var(--surface)", border: "1px solid var(--border)" }}
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
              {sortBy}
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
            <AnimatePresence>
              {showSortMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="absolute right-0 top-full mt-1 z-30 rounded-xl shadow-lg overflow-hidden"
                  style={{ background: "var(--card-bg)", border: "1px solid var(--border)", minWidth: 140 }}
                >
                  {SORT_OPTIONS.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => { setSortBy(opt); setShowSortMenu(false); }}
                      className="w-full text-left px-3 py-2 text-sm transition-colors"
                      style={{
                        color: sortBy === opt ? "var(--brand)" : "var(--text)",
                        background: sortBy === opt ? "color-mix(in srgb, #0b6e4f 6%, var(--card-bg))" : "transparent",
                      }}
                    >
                      {opt}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* ============ NOTICE LIST ============ */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="sh-card rounded-2xl p-5 animate-pulse">
              <div className="flex gap-4">
                <div className="w-1 h-12 rounded-full" style={{ background: "var(--border)" }} />
                <div className="flex-1 space-y-3">
                  <div className="h-4 rounded-lg w-2/3" style={{ background: "var(--border)" }} />
                  <div className="h-3 rounded-lg w-full" style={{ background: "var(--border)" }} />
                  <div className="h-3 rounded-lg w-1/3" style={{ background: "var(--border)" }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20" style={{ color: "var(--text-muted)" }}>
          <Bell className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">
            {activeFilter === "All"
              ? "No notices yet. Create your first notice."
              : `No ${activeFilter.toLowerCase()} notices found.`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {filtered.map((notice) => {
              const pCfg = PRIORITY_CONFIG[notice.priority] || PRIORITY_CONFIG.NORMAL;
              return (
                <motion.div
                  key={notice.id}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.2 }}
                  className={`sh-card rounded-2xl p-5 cursor-pointer border-l-4 ${pCfg.border} transition-shadow hover:shadow-md`}
                  style={{ background: "var(--card-bg)" }}
                  onClick={() => setSelectedNotice(notice)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setSelectedNotice(notice); } }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      {/* Title row */}
                      <div className="flex items-center gap-2 flex-wrap mb-1.5">
                        <h3 className="font-semibold text-sm" style={{ color: "var(--heading-color)" }}>
                          {notice.title}
                        </h3>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border ${pCfg.color}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${pCfg.dot}`} />
                          {pCfg.label}
                        </span>
                        {notice.published ? (
                          <span className="badge-green text-[11px] px-2 py-0.5">Published</span>
                        ) : (
                          <span className="badge-yellow text-[11px] px-2 py-0.5">Draft</span>
                        )}
                        <span className="badge-blue text-[11px] px-2 py-0.5">
                          {TARGET_OPTIONS.find((t) => t.value === notice.targetType)?.label || notice.targetType}
                        </span>
                      </div>

                      {/* Body preview */}
                      <p className="text-sm line-clamp-2 mb-2" style={{ color: "var(--text-muted)" }}>
                        {notice.body}
                      </p>

                      {/* Meta row */}
                      <div className="flex items-center gap-3 text-xs" style={{ color: "var(--text-muted)" }}>
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(notice.createdAt)}
                        </span>
                        {notice.createdBy && (
                          <span className="inline-flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {notice.createdBy.fullName}
                          </span>
                        )}
                        {notice.sendEmail && (
                          <span className="inline-flex items-center gap-1 text-blue-500">
                            <MessageSquare className="w-3 h-3" />
                            Email
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => setSelectedNotice(notice)}
                        className="p-1.5 rounded-lg transition-colors"
                        style={{ color: "var(--text-muted)" }}
                        title="View details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(notice.id)}
                        className="p-1.5 rounded-lg transition-colors text-red-400 hover:text-red-600 hover:bg-red-50"
                        title="Delete notice"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* ============ DETAIL SLIDE-IN PANEL ============ */}
      <AnimatePresence>
        {selectedNotice && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              style={{ background: "rgba(0,0,0,0.4)" }}
              onClick={() => setSelectedNotice(null)}
            />

            {/* Panel */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed top-0 right-0 bottom-0 z-50 w-full max-w-md overflow-y-auto"
              style={{ background: "var(--card-bg)", boxShadow: "-4px 0 24px rgba(0,0,0,0.12)" }}
            >
              <DetailPanel
                notice={selectedNotice}
                onClose={() => setSelectedNotice(null)}
                onDelete={() => { handleDelete(selectedNotice.id); setSelectedNotice(null); }}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ============ CREATE MODAL ============ */}
      <AnimatePresence>
        {showCreate && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              style={{ background: "rgba(0,0,0,0.5)" }}
              onClick={() => setShowCreate(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div
                className="relative rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
                style={{ background: "var(--card-bg)" }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Modal header */}
                <div className="flex items-center justify-between p-5 pb-0">
                  <h2 className="text-lg font-semibold" style={{ color: "var(--heading-color)" }}>
                    Create Notice
                  </h2>
                  <button
                    onClick={() => setShowCreate(false)}
                    className="p-1.5 rounded-lg transition-colors"
                    style={{ color: "var(--text-muted)" }}
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Form */}
                <form onSubmit={handleCreate} className="p-5 space-y-4">
                  {/* Title */}
                  <div>
                    <label className="label text-sm font-medium mb-1 block" style={{ color: "var(--text)" }}>
                      Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      required
                      placeholder="e.g. Parent-Teacher Meeting"
                      className="input-field w-full px-4 py-2.5 rounded-xl text-sm"
                    />
                  </div>

                  {/* Content */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="label text-sm font-medium" style={{ color: "var(--text)" }}>
                        Content <span className="text-red-500">*</span>
                      </label>
                      <span
                        className="text-xs"
                        style={{
                          color: formBody.length > MAX_CONTENT_LENGTH
                            ? "#ef4444"
                            : formBody.length > MAX_CONTENT_LENGTH * 0.8
                              ? "#f59e0b"
                              : "var(--text-muted)",
                        }}
                      >
                        {formBody.length}/{MAX_CONTENT_LENGTH}
                      </span>
                    </div>
                    <textarea
                      value={formBody}
                      onChange={(e) => {
                        if (e.target.value.length <= MAX_CONTENT_LENGTH) setFormBody(e.target.value);
                      }}
                      rows={5}
                      required
                      placeholder="Write the notice content here..."
                      className="input-field w-full px-4 py-2.5 rounded-xl text-sm resize-none"
                    />
                  </div>

                  {/* Target audience + Priority */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="label text-sm font-medium mb-1 block" style={{ color: "var(--text)" }}>
                        Target Audience
                      </label>
                      <div className="relative">
                        <select
                          value={formTarget}
                          onChange={(e) => setFormTarget(e.target.value)}
                          className="input-field w-full px-4 py-2.5 rounded-xl text-sm appearance-none pr-10"
                        >
                          {TARGET_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: "var(--text-muted)" }} />
                      </div>
                    </div>

                    <div>
                      <label className="label text-sm font-medium mb-1 block" style={{ color: "var(--text)" }}>
                        Priority
                      </label>
                      <div className="flex gap-1.5">
                        {(Object.keys(PRIORITY_CONFIG) as Array<Notice["priority"]>).map((p) => {
                          const cfg = PRIORITY_CONFIG[p];
                          const isActive = formPriority === p;
                          return (
                            <button
                              key={p}
                              type="button"
                              onClick={() => setFormPriority(p)}
                              className="flex-1 flex items-center justify-center gap-1 px-2 py-2 rounded-lg text-xs font-medium transition-all border"
                              style={{
                                background: isActive
                                  ? "color-mix(in srgb, var(--color-schoolhub-500, #0b6e4f) 12%, var(--surface))"
                                  : "var(--surface)",
                                borderColor: isActive
                                  ? "var(--color-schoolhub-500, #0b6e4f)"
                                  : "var(--border)",
                                color: isActive ? "var(--brand)" : "var(--text-muted)",
                              }}
                            >
                              <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                              <span className="hidden sm:inline">{cfg.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Email and in-app toggle + Publish toggle */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Email and in-app */}
                    <div
                      className="flex items-center justify-between p-3 rounded-xl"
                      style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
                    >
                      <div className="flex items-center gap-2">
                        <MessageSquare className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
                        <div>
                          <p className="text-sm font-medium" style={{ color: "var(--text)" }}>Email & in-app</p>
                          <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>Free email and in-app alert</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setFormSendEmail(!formSendEmail)}
                        className="relative w-10 h-6 rounded-full transition-colors"
                        style={{
                          background: formSendEmail ? "var(--brand)" : "var(--border)",
                        }}
                        role="switch"
                        aria-checked={formSendEmail}
                        aria-label="Email & in-app"
                      >
                        <span
                          className="absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow transition-transform"
                          style={{ transform: formSendEmail ? "translateX(16px)" : "translateX(0)" }}
                        />
                      </button>
                    </div>

                    {/* Publish now */}
                    <div
                      className="flex items-center justify-between p-3 rounded-xl"
                      style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
                    >
                      <div className="flex items-center gap-2">
                        <Send className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
                        <div>
                          <p className="text-sm font-medium" style={{ color: "var(--text)" }}>Publish now</p>
                          <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                            {formPublishNow ? "Visible immediately" : "Save as draft"}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setFormPublishNow(!formPublishNow)}
                        className="relative w-10 h-6 rounded-full transition-colors"
                        style={{
                          background: formPublishNow ? "var(--brand)" : "var(--border)",
                        }}
                        role="switch"
                        aria-checked={formPublishNow}
                        aria-label="Publish now"
                      >
                        <span
                          className="absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow transition-transform"
                          style={{ transform: formPublishNow ? "translateX(16px)" : "translateX(0)" }}
                        />
                      </button>
                    </div>
                  </div>

                  {/* Attach file */}
                  <button
                    type="button"
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors border border-dashed"
                    style={{ borderColor: "var(--border)", color: "var(--text-muted)", background: "var(--surface)" }}
                  >
                    <Paperclip className="w-4 h-4" />
                    Attach File
                  </button>

                  {/* Actions */}
                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowCreate(false)}
                      className="btn btn-secondary flex-1 py-2.5 rounded-xl text-sm font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={saving || !formTitle.trim() || !formBody.trim()}
                      className="btn btn-primary flex-1 py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {saving ? (
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : formPublishNow ? (
                        <Send className="w-4 h-4" />
                      ) : (
                        <Clock className="w-4 h-4" />
                      )}
                      {saving ? "Saving..." : formPublishNow ? "Publish Notice" : "Save Draft"}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ================================================================== */
/*  StatCard sub-component                                             */
/* ================================================================== */

function StatCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  accent?: "green" | "amber" | "blue";
}) {
  const accentColors = {
    green: { bg: "color-mix(in srgb, #0b6e4f 8%, var(--card-bg))", icon: "var(--brand)" },
    amber: { bg: "color-mix(in srgb, #f59e0b 8%, var(--card-bg))", icon: "#f59e0b" },
    blue:  { bg: "color-mix(in srgb, #3b82f6 8%, var(--card-bg))", icon: "#3b82f6" },
  };
  const colors = accent ? accentColors[accent] : { bg: "var(--card-bg)", icon: "var(--text-muted)" };

  return (
    <div
      className="sh-card rounded-xl p-4"
      style={{ background: colors.bg }}
    >
      <div className="flex items-center gap-2 mb-1">
        <span style={{ color: colors.icon }}>{icon}</span>
        <span className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>{label}</span>
      </div>
      <p className="sh-numeral text-2xl font-bold" style={{ color: "var(--heading-color)" }}>
        {value}
      </p>
    </div>
  );
}

/* ================================================================== */
/*  DetailPanel sub-component                                          */
/* ================================================================== */

function DetailPanel({
  notice,
  onClose,
  onDelete,
}: {
  notice: Notice;
  onClose: () => void;
  onDelete: () => void;
}) {
  const pCfg = PRIORITY_CONFIG[notice.priority] || PRIORITY_CONFIG.NORMAL;

  return (
    <div className="flex flex-col h-full">
      {/* Panel header */}
      <div
        className="flex items-center justify-between p-5 border-b"
        style={{ borderColor: "var(--border)" }}
      >
        <h2 className="text-lg font-semibold" style={{ color: "var(--heading-color)" }}>
          Notice Details
        </h2>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg transition-colors"
          style={{ color: "var(--text-muted)" }}
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Panel body */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {/* Title */}
        <div>
          <h3 className="text-lg font-bold mb-2" style={{ color: "var(--heading-color)" }}>
            {notice.title}
          </h3>

          {/* Badges */}
          <div className="flex items-center gap-2 flex-wrap mb-4">
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${pCfg.color}`}>
              <span className={`w-2 h-2 rounded-full ${pCfg.dot}`} />
              {pCfg.label} Priority
            </span>
            {notice.published ? (
              <span className="badge-green text-xs px-2.5 py-1">Published</span>
            ) : (
              <span className="badge-yellow text-xs px-2.5 py-1">Draft</span>
            )}
            <span className="badge-blue text-xs px-2.5 py-1">
              {TARGET_OPTIONS.find((t) => t.value === notice.targetType)?.label || notice.targetType}
            </span>
          </div>
        </div>

        {/* Meta */}
        <div
          className="p-4 rounded-xl space-y-2 text-sm"
          style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
        >
          <div className="flex items-center gap-2" style={{ color: "var(--text-muted)" }}>
            <Calendar className="w-4 h-4" />
            <span>Created: {formatDateTime(notice.createdAt)}</span>
          </div>
          {notice.updatedAt !== notice.createdAt && (
            <div className="flex items-center gap-2" style={{ color: "var(--text-muted)" }}>
              <Clock className="w-4 h-4" />
              <span>Updated: {formatDateTime(notice.updatedAt)}</span>
            </div>
          )}
          {notice.createdBy && (
            <div className="flex items-center gap-2" style={{ color: "var(--text-muted)" }}>
              <Mail className="w-4 h-4" />
              <span>By: {notice.createdBy.fullName}</span>
            </div>
          )}
          {notice.sendEmail && (
            <div className="flex items-center gap-2 text-blue-500">
              <MessageSquare className="w-4 h-4" />
              <span>Email and in-app notification enabled</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div>
          <h4 className="text-sm font-semibold mb-2" style={{ color: "var(--heading-color)" }}>
            Content
          </h4>
          <div
            className="p-4 rounded-xl text-sm leading-relaxed whitespace-pre-wrap"
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              color: "var(--text)",
            }}
          >
            {notice.body}
          </div>
        </div>
      </div>

      {/* Panel footer */}
      <div className="p-5 border-t" style={{ borderColor: "var(--border)" }}>
        <button
          onClick={onDelete}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors bg-red-50 text-red-600 hover:bg-red-100 border border-red-100"
        >
          <Trash2 className="w-4 h-4" />
          Delete Notice
        </button>
      </div>
    </div>
  );
}
