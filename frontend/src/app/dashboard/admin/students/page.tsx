"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, Search, Plus, X, Loader2, AlertCircle, CheckCircle,
  ChevronLeft, ChevronRight, UserPlus, Upload, Filter,
  ChevronDown, ArrowUpDown, MoreHorizontal, Phone, Mail,
  AlertTriangle, Download,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

/* ================================================================== */
/*  Types                                                              */
/* ================================================================== */

interface Student {
  id: string;
  admissionNumber: string;
  fullName: string;
  gender: string | null;
  parentName: string | null;
  parentPhone: string | null;
  parentEmail: string | null;
  active: boolean;
  createdAt: string;
  class: { id: string; name: string } | null;
  arm: { id: string; name: string } | null;
  feeStatus?: "paid" | "partial" | "unpaid" | null;
  user?: { id: string; email: string; role: string; active: boolean } | null;
}

interface ClassOption {
  id: string;
  name: string;
  arms: { id: string; name: string }[];
}

/* ================================================================== */
/*  Helpers                                                            */
/* ================================================================== */

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getAvatarColor(name: string): string {
  const colors = [
    "var(--brand)", "#12926a", "#17ab7d", "#f59e0b",
    "#fbbf24", "#38bdf8", "#0369a1", "var(--body-color)",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

function FeeStatusBadge({ status }: { status: string | null | undefined }) {
  const config: Record<string, { bg: string; color: string; label: string }> = {
    paid: { bg: "rgba(11,110,79,0.10)", color: "var(--brand)", label: "Paid" },
    partial: { bg: "rgba(245,158,11,0.10)", color: "#b45309", label: "Partial" },
    unpaid: { bg: "rgba(244,63,94,0.10)", color: "#dc2626", label: "Unpaid" },
  };
  const cfg = config[status || "unpaid"] || config.unpaid;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "2px 10px",
        borderRadius: 9999,
        background: cfg.bg,
        color: cfg.color,
        fontSize: 11,
        fontWeight: 600,
        fontFamily: "var(--font-sans)",
      }}
    >
      <span
        style={{
          width: 5,
          height: 5,
          borderRadius: "50%",
          background: cfg.color,
        }}
      />
      {cfg.label}
    </span>
  );
}

/* ================================================================== */
/*  Skeleton                                                           */
/* ================================================================== */

function StudentsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="skeleton h-7 w-36 rounded-lg mb-2" />
          <div className="skeleton h-4 w-28 rounded-lg" />
        </div>
        <div className="flex gap-2">
          <div className="skeleton h-10 w-28 rounded-xl" />
          <div className="skeleton h-10 w-28 rounded-xl" />
        </div>
      </div>
      <div className="skeleton h-12 w-full rounded-xl" />
      <div className="skeleton h-10 w-64 rounded-xl" />
      <div className="sh-card p-0 overflow-hidden">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              padding: "14px 20px",
              borderBottom: i < 7 ? "1px solid var(--border)" : "none",
            }}
          >
            <div className="skeleton h-9 w-9 rounded-full" />
            <div className="skeleton h-4 flex-1 rounded-lg" />
            <div className="skeleton h-4 w-20 rounded-lg hidden sm:block" />
            <div className="skeleton h-4 w-16 rounded-lg hidden md:block" />
            <div className="skeleton h-5 w-14 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ================================================================== */
/*  Filters Bar                                                        */
/* ================================================================== */

function FiltersBar({
  search,
  setSearch,
  filterClass,
  setFilterClass,
  filterArm,
  setFilterArm,
  filterStatus,
  setFilterStatus,
  classes,
  showFilters,
  setShowFilters,
  resultCount,
}: {
  search: string;
  setSearch: (v: string) => void;
  filterClass: string;
  setFilterClass: (v: string) => void;
  filterArm: string;
  setFilterArm: (v: string) => void;
  filterStatus: string;
  setFilterStatus: (v: string) => void;
  classes: ClassOption[];
  showFilters: boolean;
  setShowFilters: (v: boolean) => void;
  resultCount: number;
}) {
  const selectedClass = classes.find((c) => c.id === filterClass);
  const arms = selectedClass?.arms ?? [];

  const hasActiveFilters = filterClass || filterArm || filterStatus;

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          flexWrap: "wrap",
        }}
      >
        {/* Search */}
        <div style={{ position: "relative", flex: "1 1 280px", minWidth: 200 }}>
          <Search
            style={{
              position: "absolute",
              left: 12,
              top: "50%",
              transform: "translateY(-50%)",
              width: 16,
              height: 16,
              color: "var(--text-muted)",
              pointerEvents: "none",
            }}
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or admission number..."
            className="input-field"
            style={{ paddingLeft: 38, paddingRight: 12 }}
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              style={{
                position: "absolute",
                right: 8,
                top: "50%",
                transform: "translateY(-50%)",
                background: "var(--surface-2)",
                border: "none",
                borderRadius: 6,
                padding: 4,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <X style={{ width: 12, height: 12, color: "var(--text-muted)" }} />
            </button>
          )}
        </div>

        {/* Filter toggle */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="btn btn-secondary"
          style={{
            gap: 6,
            position: "relative",
          }}
        >
          <Filter style={{ width: 15, height: 15 }} />
          Filters
          {hasActiveFilters && (
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: "var(--brand)",
                position: "absolute",
                top: 6,
                right: 6,
              }}
            />
          )}
        </button>
      </div>

      {/* Expandable filter row */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: "hidden" }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "14px 0 4px",
                flexWrap: "wrap",
              }}
            >
              {/* Class filter */}
              <div style={{ position: "relative", minWidth: 140 }}>
                <select
                  value={filterClass}
                  onChange={(e) => {
                    setFilterClass(e.target.value);
                    setFilterArm("");
                  }}
                  className="input-field"
                  style={{
                    paddingRight: 32,
                    appearance: "none",
                    cursor: "pointer",
                  }}
                >
                  <option value="">All Classes</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  style={{
                    position: "absolute",
                    right: 10,
                    top: "50%",
                    transform: "translateY(-50%)",
                    width: 14,
                    height: 14,
                    color: "var(--text-muted)",
                    pointerEvents: "none",
                  }}
                />
              </div>

              {/* Arm filter */}
              <div style={{ position: "relative", minWidth: 120 }}>
                <select
                  value={filterArm}
                  onChange={(e) => setFilterArm(e.target.value)}
                  className="input-field"
                  disabled={!filterClass || arms.length === 0}
                  style={{
                    paddingRight: 32,
                    appearance: "none",
                    cursor: "pointer",
                    opacity: !filterClass || arms.length === 0 ? 0.5 : 1,
                  }}
                >
                  <option value="">All Arms</option>
                  {arms.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  style={{
                    position: "absolute",
                    right: 10,
                    top: "50%",
                    transform: "translateY(-50%)",
                    width: 14,
                    height: 14,
                    color: "var(--text-muted)",
                    pointerEvents: "none",
                  }}
                />
              </div>

              {/* Status filter */}
              <div style={{ position: "relative", minWidth: 130 }}>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="input-field"
                  style={{
                    paddingRight: 32,
                    appearance: "none",
                    cursor: "pointer",
                  }}
                >
                  <option value="">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
                <ChevronDown
                  style={{
                    position: "absolute",
                    right: 10,
                    top: "50%",
                    transform: "translateY(-50%)",
                    width: 14,
                    height: 14,
                    color: "var(--text-muted)",
                    pointerEvents: "none",
                  }}
                />
              </div>

              {/* Clear filters */}
              {hasActiveFilters && (
                <button
                  onClick={() => {
                    setFilterClass("");
                    setFilterArm("");
                    setFilterStatus("");
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--brand)",
                    fontSize: 12,
                    fontWeight: 600,
                    fontFamily: "var(--font-sans)",
                    cursor: "pointer",
                    padding: "6px 0",
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <X style={{ width: 12, height: 12 }} />
                  Clear filters
                </button>
              )}

              {/* Result count */}
              <span
                style={{
                  fontSize: 12,
                  color: "var(--text-muted)",
                  fontFamily: "var(--font-sans)",
                  marginLeft: "auto",
                }}
              >
                {resultCount} student{resultCount !== 1 ? "s" : ""}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ================================================================== */
/*  Student Table                                                       */
/* ================================================================== */

function StudentTable({
  students,
  onDelete,
  onCreateAccount,
  onViewStudent,
}: {
  students: Student[];
  onDelete: (id: string) => void;
  onCreateAccount: (student: Student) => void;
  onViewStudent: (id: string) => void;
}) {
  if (students.length === 0) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: "60px 24px",
          color: "var(--text-muted)",
        }}
      >
        <Users
          style={{
            width: 40,
            height: 40,
            margin: "0 auto 12px",
            opacity: 0.4,
          }}
        />
        <p
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: 14,
            margin: 0,
          }}
        >
          No students found matching your criteria.
        </p>
      </div>
    );
  }

  return (
    <div className="card" style={{ padding: 0, overflow: "hidden" }}>
      <div style={{ overflowX: "auto" }}>
        <table className="data-table">
          <thead>
            <tr style={{ background: "var(--surface-2)" }}>
              <th>Student</th>
              <th>Admission #</th>
              <th className="hidden sm:table-cell">Class</th>
              <th className="hidden md:table-cell">Parent Contact</th>
              <th>Fee Status</th>
              <th style={{ textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {students.map((s, i) => {
              const color = getAvatarColor(s.fullName);
              return (
                <motion.tr
                  key={s.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.02, duration: 0.2 }}
                  style={{
                    transition: "background 0.12s ease",
                    cursor: "pointer",
                  }}
                  onClick={() => onViewStudent(s.id)}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "var(--surface-2)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "transparent")
                  }
                >
                  {/* Student name + avatar */}
                  <td>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                      }}
                    >
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: "50%",
                          background: `${color}18`,
                          color: color,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 12,
                          fontWeight: 700,
                          fontFamily: "var(--font-sans)",
                          flexShrink: 0,
                        }}
                      >
                        {getInitials(s.fullName)}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <p
                          style={{
                            fontSize: 13,
                            fontWeight: 600,
                            color: "var(--heading-color)",
                            fontFamily: "var(--font-sans)",
                            margin: 0,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {s.fullName}
                        </p>
                        <p
                          className="hidden sm:block"
                          style={{
                            fontSize: 11,
                            color: "var(--text-muted)",
                            fontFamily: "var(--font-sans)",
                            margin: 0,
                          }}
                        >
                          {s.class?.name || "No class"}
                          {s.arm?.name ? ` - ${s.arm.name}` : ""}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Admission number */}
                  <td>
                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: 12,
                        fontWeight: 600,
                        color: "var(--brand)",
                      }}
                    >
                      {s.admissionNumber}
                    </span>
                  </td>

                  {/* Class - hidden on mobile */}
                  <td className="hidden sm:table-cell">
                    <span
                      style={{
                        fontSize: 13,
                        color: "var(--text)",
                        fontFamily: "var(--font-sans)",
                      }}
                    >
                      {s.class?.name || " "}
                      {s.arm?.name ? ` - ${s.arm.name}` : ""}
                    </span>
                  </td>

                  {/* Parent contact - hidden on mobile & tablet */}
                  <td className="hidden md:table-cell">
                    {s.parentPhone ? (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          fontSize: 12,
                          color: "var(--text-muted)",
                          fontFamily: "var(--font-sans)",
                        }}
                      >
                        <Phone style={{ width: 12, height: 12 }} />
                        {s.parentPhone}
                      </div>
                    ) : s.parentEmail ? (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          fontSize: 12,
                          color: "var(--text-muted)",
                          fontFamily: "var(--font-sans)",
                        }}
                      >
                        <Mail style={{ width: 12, height: 12 }} />
                        {s.parentEmail}
                      </div>
                    ) : (
                      <span
                        style={{
                          fontSize: 12,
                          color: "var(--text-muted)",
                          fontFamily: "var(--font-sans)",
                        }}
                      >
                         
                      </span>
                    )}
                  </td>

                  {/* Fee status */}
                  <td>
                    <FeeStatusBadge status={s.feeStatus} />
                  </td>

                  {/* Actions */}
                  <td style={{ textAlign: "right", display: "flex", gap: 6, justifyContent: "flex-end" }}>
                    {!s.user && (
                      <button
                        onClick={() => onCreateAccount(s)}
                        style={{
                          background: "none",
                          border: "1px solid #0b6e4f",
                          borderRadius: 8,
                          padding: "4px 10px",
                          fontSize: 11,
                          fontWeight: 600,
                          color: "var(--brand)",
                          cursor: "pointer",
                          fontFamily: "var(--font-sans)",
                          transition: "all 0.15s ease",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "var(--brand)";
                          e.currentTarget.style.color = "#fff";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "none";
                          e.currentTarget.style.color = "var(--brand)";
                        }}
                      >
                        Create Account
                      </button>
                    )}
                    {s.user && (
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 500,
                          color: "var(--brand)",
                          background: "rgba(11,110,79,0.08)",
                          padding: "4px 10px",
                          borderRadius: 8,
                          fontFamily: "var(--font-sans)",
                        }}
                      >
                        ✓ Has Account
                      </span>
                    )}
                    <button
                      onClick={() => {
                        if (
                          confirm(
                            `Are you sure you want to archive ${s.fullName}?`
                          )
                        ) {
                          onDelete(s.id);
                        }
                      }}
                      style={{
                        background: "none",
                        border: "1px solid var(--border)",
                        borderRadius: 8,
                        padding: "4px 10px",
                        fontSize: 11,
                        fontWeight: 600,
                        color: "var(--text-muted)",
                        cursor: "pointer",
                        fontFamily: "var(--font-sans)",
                        transition: "all 0.15s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = "#f43f5e";
                        e.currentTarget.style.color = "#f43f5e";
                        e.currentTarget.style.background = "rgba(244,63,94,0.06)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = "var(--border)";
                        e.currentTarget.style.color = "var(--text-muted)";
                        e.currentTarget.style.background = "none";
                      }}
                    >
                      Archive
                    </button>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  Add Student Modal                                                  */
/* ================================================================== */

function AddStudentModal({
  show,
  onClose,
  onAdded,
  classes,
}: {
  show: boolean;
  onClose: () => void;
  onAdded: () => void;
  classes: ClassOption[];
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [formName, setFormName] = useState("");
  const [formAdmission, setFormAdmission] = useState("");
  const [formGender, setFormGender] = useState("male");
  const [formClassId, setFormClassId] = useState("");
  const [formArmId, setFormArmId] = useState("");
  const [formParentName, setFormParentName] = useState("");
  const [formParentPhone, setFormParentPhone] = useState("");
  const [formParentEmail, setFormParentEmail] = useState("");

  const selectedClass = classes.find((c) => c.id === formClassId);

  function resetForm() {
    setFormName("");
    setFormAdmission("");
    setFormGender("male");
    setFormClassId("");
    setFormArmId("");
    setFormParentName("");
    setFormParentPhone("");
    setFormParentEmail("");
    setError("");
    onClose();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      await api.post("/api/students", {
        admissionNumber: formAdmission,
        fullName: formName,
        gender: formGender,
        classId: formClassId || undefined,
        armId: formArmId || undefined,
        parentName: formParentName || undefined,
        parentPhone: formParentPhone || undefined,
        parentEmail: formParentEmail || undefined,
      });
      resetForm();
      onAdded();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to add student.";
      setError(message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) resetForm();
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring" as const, stiffness: 400, damping: 30 }}
            className="modal-content relative max-h-[90vh] overflow-y-auto"
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 20,
              }}
            >
              <h2
                style={{
                  fontSize: 18,
                  fontWeight: 600,
                  color: "var(--heading-color)",
                  fontFamily: "var(--font-display)",
                  margin: 0,
                }}
              >
                Add New Student
              </h2>
              <button
                onClick={resetForm}
                style={{
                  background: "var(--surface-2)",
                  border: "none",
                  borderRadius: 8,
                  padding: 6,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <X
                  style={{ width: 16, height: 16, color: "var(--text-muted)" }}
                />
              </button>
            </div>

            {error && (
              <div
                style={{
                  padding: "10px 14px",
                  borderRadius: 10,
                  background: "rgba(244,63,94,0.06)",
                  border: "1px solid rgba(244,63,94,0.15)",
                  fontSize: 13,
                  color: "#dc2626",
                  fontFamily: "var(--font-sans)",
                  marginBottom: 16,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <AlertCircle style={{ width: 14, height: 14, flexShrink: 0 }} />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Admission Number *</label>
                <input
                  type="text"
                  value={formAdmission}
                  onChange={(e) => setFormAdmission(e.target.value)}
                  className="input-field"
                  placeholder="e.g. SCH/2026/001"
                  required
                />
              </div>

              <div>
                <label className="label">Full Name *</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="input-field"
                  placeholder="e.g. Adebayo Johnson"
                  required
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <label className="label">Gender</label>
                  <select
                    value={formGender}
                    onChange={(e) => setFormGender(e.target.value)}
                    className="input-field"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
                <div>
                  <label className="label">Class</label>
                  <select
                    value={formClassId}
                    onChange={(e) => {
                      setFormClassId(e.target.value);
                      setFormArmId("");
                    }}
                    className="input-field"
                  >
                    <option value="">No class</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {selectedClass && selectedClass.arms.length > 0 && (
                <div>
                  <label className="label">Arm</label>
                  <select
                    value={formArmId}
                    onChange={(e) => setFormArmId(e.target.value)}
                    className="input-field"
                  >
                    <option value="">No arm</option>
                    {selectedClass.arms.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Parent section */}
              <div
                style={{
                  borderTop: "1px solid var(--border)",
                  paddingTop: 16,
                  marginTop: 8,
                }}
              >
                <p
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    color: "var(--text-muted)",
                    fontFamily: "var(--font-sans)",
                    marginBottom: 12,
                  }}
                >
                  Parent / Guardian (optional)
                </p>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 12,
                  }}
                >
                  <div>
                    <label className="label">Parent Name</label>
                    <input
                      type="text"
                      value={formParentName}
                      onChange={(e) => setFormParentName(e.target.value)}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="label">Parent Phone</label>
                    <input
                      type="tel"
                      value={formParentPhone}
                      onChange={(e) => setFormParentPhone(e.target.value)}
                      className="input-field"
                      placeholder="0801 234 5678"
                    />
                  </div>
                </div>
                <div style={{ marginTop: 12 }}>
                  <label className="label">Parent Email</label>
                  <input
                    type="email"
                    value={formParentEmail}
                    onChange={(e) => setFormParentEmail(e.target.value)}
                    className="input-field"
                    placeholder="parent@email.com"
                  />
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  gap: 12,
                  paddingTop: 8,
                  borderTop: "1px solid var(--border)",
                }}
              >
                <button
                  type="button"
                  onClick={resetForm}
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || !formName || !formAdmission}
                  className="btn btn-primary"
                  style={{ flex: 1, justifyContent: "center" }}
                >
                  {saving ? (
                    <Loader2
                      className="animate-spin"
                      style={{ width: 16, height: 16 }}
                    />
                  ) : (
                    <Plus style={{ width: 16, height: 16 }} />
                  )}
                  {saving ? "Saving..." : "Add Student"}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ================================================================== */
/*  Error State                                                        */
/* ================================================================== */

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div style={{ textAlign: "center", padding: "60px 24px" }}>
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
        Failed to load students
      </h3>
      <p
        style={{
          fontSize: 13,
          color: "var(--text-muted)",
          fontFamily: "var(--font-sans)",
          marginBottom: 20,
        }}
      >
        {message || "An unexpected error occurred."}
      </p>
      <button onClick={onRetry} className="btn btn-primary">
        Retry
      </button>
    </div>
  );
}

/* ================================================================== */
/*  Main Page Component                                                */
/* ================================================================== */

const PER_PAGE = 25;

export default function AdminStudentsPage() {
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [filterClass, setFilterClass] = useState("");
  const [filterArm, setFilterArm] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);

  // Modal
  const [showAdd, setShowAdd] = useState(false);

  // Create account modal
  const [showCreateAccount, setShowCreateAccount] = useState(false);
  const [accountStudent, setAccountStudent] = useState<Student | null>(null);
  const [accountEmail, setAccountEmail] = useState("");
  const [accountPassword, setAccountPassword] = useState("");
  const [accountAutoGen, setAccountAutoGen] = useState(true);
  const [accountLoading, setAccountLoading] = useState(false);
  const [accountResult, setAccountResult] = useState<{ email: string; password: string } | null>(null);

  // Success toast
  const [toast, setToast] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [studData, clsData] = await Promise.allSettled([
        api.get<Student[]>("/api/students"),
        api.get<ClassOption[]>("/api/classes"),
      ]);

      if (studData.status === "fulfilled") {
        setStudents(studData.value);
      } else {
        setError("Failed to load students.");
      }

      if (clsData.status === "fulfilled") {
        setClasses(clsData.value);
      }
    } catch {
      setError("Network error. Check your connection.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filtered + paginated
  const filtered = useMemo(() => {
    return students.filter((s) => {
      // Search
      if (search) {
        const q = search.toLowerCase();
        const match =
          s.fullName.toLowerCase().includes(q) ||
          s.admissionNumber.toLowerCase().includes(q) ||
          (s.parentName && s.parentName.toLowerCase().includes(q));
        if (!match) return false;
      }
      // Class
      if (filterClass && s.class?.id !== filterClass) return false;
      // Arm
      if (filterArm && s.arm?.id !== filterArm) return false;
      // Status
      if (filterStatus === "active" && !s.active) return false;
      if (filterStatus === "inactive" && s.active) return false;
      return true;
    });
  }, [students, search, filterClass, filterArm, filterStatus]);

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  // Reset page on filter change
  useEffect(() => {
    setPage(1);
  }, [search, filterClass, filterArm, filterStatus]);

  async function handleDelete(id: string) {
    try {
      await api.delete(`/api/students/${id}`);
      setStudents((prev) => prev.filter((s) => s.id !== id));
      setToast("Student archived successfully.");
      setTimeout(() => setToast(null), 3000);
    } catch {
      setError("Failed to archive student.");
      setTimeout(() => setError(null), 4000);
    }
  }

  function openCreateAccount(student: Student) {
    setAccountStudent(student);
    setAccountEmail(student.parentEmail || "");
    setAccountPassword("");
    setAccountAutoGen(true);
    setAccountResult(null);
    setShowCreateAccount(true);
  }

  async function handleCreateAccount() {
    if (!accountStudent || !accountEmail) return;
    setAccountLoading(true);
    try {
      const body: Record<string, string> = { email: accountEmail };
      if (!accountAutoGen && accountPassword) body.password = accountPassword;
      const res = await api.post<{ password: string; autoGenerated: boolean }>(
        `/api/students/${accountStudent.id}/create-account`,
        body
      );
      setAccountResult({ email: accountEmail, password: res.password });
      // Update student in list
      setStudents((prev) =>
        prev.map((s) =>
          s.id === accountStudent.id
            ? { ...s, user: { id: "new", email: accountEmail, role: "STUDENT", active: true } }
            : s
        )
      );
    } catch (err: any) {
      setError(err.message || "Failed to create account.");
      setTimeout(() => setError(null), 4000);
      setShowCreateAccount(false);
    } finally {
      setAccountLoading(false);
    }
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto">
      {/* ── Header ─────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 24,
              fontWeight: 600,
              color: "var(--heading-color)",
              fontFamily: "var(--font-display)",
              margin: 0,
            }}
          >
            Students
          </h1>
          <p
            style={{
              fontSize: 13,
              color: "var(--text-muted)",
              fontFamily: "var(--font-sans)",
              marginTop: 4,
            }}
          >
            {students.length} total student{students.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Link
            href="/dashboard/admin/students/import"
            className="btn btn-secondary"
            style={{ gap: 6 }}
          >
            <Upload style={{ width: 15, height: 15 }} />
            CSV Import
          </Link>
          <button
            onClick={() => setShowAdd(true)}
            className="btn btn-primary"
            style={{ gap: 6 }}
          >
            <UserPlus style={{ width: 15, height: 15 }} />
            Add Student
          </button>
        </div>
      </motion.div>

      {/* ── Toast ──────────────────────────────── */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            style={{
              padding: "10px 16px",
              borderRadius: 10,
              background: "rgba(11,110,79,0.06)",
              border: "1px solid rgba(11,110,79,0.15)",
              fontSize: 13,
              color: "var(--brand)",
              fontFamily: "var(--font-sans)",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <CheckCircle style={{ width: 14, height: 14 }} />
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Error ──────────────────────────────── */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            style={{
              padding: "10px 16px",
              borderRadius: 10,
              background: "rgba(244,63,94,0.06)",
              border: "1px solid rgba(244,63,94,0.15)",
              fontSize: 13,
              color: "#dc2626",
              fontFamily: "var(--font-sans)",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <AlertCircle style={{ width: 14, height: 14, flexShrink: 0 }} />
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Filters ────────────────────────────── */}
      <FiltersBar
        search={search}
        setSearch={setSearch}
        filterClass={filterClass}
        setFilterClass={setFilterClass}
        filterArm={filterArm}
        setFilterArm={setFilterArm}
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
        classes={classes}
        showFilters={showFilters}
        setShowFilters={setShowFilters}
        resultCount={filtered.length}
      />

      {/* ── Table ──────────────────────────────── */}
      {loading ? (
        <StudentsSkeleton />
      ) : error && students.length === 0 ? (
        <ErrorState message={error} onRetry={loadData} />
      ) : (
        <>
          <StudentTable students={paginated} onDelete={handleDelete} onCreateAccount={openCreateAccount} onViewStudent={(id) => router.push(`/dashboard/admin/students/detail?id=${id}`)} />

          {/* ── Pagination ─────────────────────── */}
          {totalPages > 1 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                paddingTop: 8,
              }}
            >
              <p
                style={{
                  fontSize: 13,
                  color: "var(--text-muted)",
                  fontFamily: "var(--font-sans)",
                  margin: 0,
                }}
              >
                Showing {(page - 1) * PER_PAGE + 1}
                &ndash;
                {Math.min(page * PER_PAGE, filtered.length)} of{" "}
                {filtered.length}
              </p>

              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="btn btn-secondary"
                  style={{
                    padding: "6px 10px",
                    minHeight: 36,
                    opacity: page === 1 ? 0.4 : 1,
                    cursor: page === 1 ? "not-allowed" : "pointer",
                  }}
                >
                  <ChevronLeft style={{ width: 16, height: 16 }} />
                </button>

                {/* Page number pills */}
                {Array.from({ length: Math.min(totalPages, 7) }).map((_, i) => {
                  let pageNum: number;
                  if (totalPages <= 7) {
                    pageNum = i + 1;
                  } else if (page <= 4) {
                    pageNum = i + 1;
                  } else if (page >= totalPages - 3) {
                    pageNum = totalPages - 6 + i;
                  } else {
                    pageNum = page - 3 + i;
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        border: "none",
                        background:
                          pageNum === page
                            ? "var(--brand)"
                            : "transparent",
                        color:
                          pageNum === page
                            ? "#fff"
                            : "var(--text-muted)",
                        fontSize: 12,
                        fontWeight: 600,
                        fontFamily: "var(--font-sans)",
                        cursor: "pointer",
                        transition: "all 0.12s ease",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                      onMouseEnter={(e) => {
                        if (pageNum !== page) {
                          e.currentTarget.style.background = "var(--surface-2)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (pageNum !== page) {
                          e.currentTarget.style.background = "transparent";
                        }
                      }}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="btn btn-secondary"
                  style={{
                    padding: "6px 10px",
                    minHeight: 36,
                    opacity: page === totalPages ? 0.4 : 1,
                    cursor: page === totalPages ? "not-allowed" : "pointer",
                  }}
                >
                  <ChevronRight style={{ width: 16, height: 16 }} />
                </button>
              </div>
            </motion.div>
          )}
        </>
      )}

      {/* ── Add Student Modal ──────────────────── */}
      <AddStudentModal
        show={showAdd}
        onClose={() => setShowAdd(false)}
        onAdded={() => {
          setShowAdd(false);
          setToast("Student added successfully!");
          setTimeout(() => setToast(null), 3000);
          loadData();
        }}
        classes={classes}
      />

      {/* ── Create Account Modal ─────────────── */}
      {showCreateAccount && accountStudent && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 100,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)",
          }}
          onClick={() => !accountLoading && setShowCreateAccount(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "var(--card-bg)", borderRadius: 16,
              padding: 32, width: "100%", maxWidth: 420,
              boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
            }}
          >
            {accountResult ? (
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>✅</div>
                <h3 style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 600, color: "var(--heading-color)", marginBottom: 8 }}>
                  Account Created
                </h3>
                <p style={{ fontSize: 13, color: "var(--muted-color)", marginBottom: 16 }}>
                  Login for <strong>{accountResult.email}</strong>
                </p>
                <div style={{
                  background: "var(--surface-2)", borderRadius: 10, padding: "12px 16px",
                  fontFamily: "monospace", fontSize: 14, color: "var(--heading-color)",
                  marginBottom: 16, wordBreak: "break-all",
                }}>
                  {accountResult.password}
                </div>
                <p style={{ fontSize: 11, color: "var(--muted-color)", marginBottom: 16 }}>
                  Share this password with the student. They can change it after logging in.
                </p>
                <button
                  onClick={() => { setShowCreateAccount(false); setAccountResult(null); }}
                  className="btn btn-primary"
                  style={{ width: "100%" }}
                >
                  Done
                </button>
              </div>
            ) : (
              <>
                <h3 style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 600, color: "var(--heading-color)", marginBottom: 4 }}>
                  Create Login Account
                </h3>
                <p style={{ fontSize: 13, color: "var(--muted-color)", marginBottom: 20 }}>
                  for {accountStudent.fullName} ({accountStudent.admissionNumber})
                </p>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--text-muted)", marginBottom: 6 }}>Email</label>
                  <input
                    type="email"
                    className="input-field"
                    placeholder="student@email.com"
                    value={accountEmail}
                    onChange={(e) => setAccountEmail(e.target.value)}
                  />
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13, color: "var(--text-muted)" }}>
                    <input
                      type="checkbox"
                      checked={accountAutoGen}
                      onChange={(e) => setAccountAutoGen(e.target.checked)}
                      style={{ accentColor: "var(--brand)" }}
                    />
                    Auto-generate password
                  </label>
                </div>

                {!accountAutoGen && (
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--text-muted)", marginBottom: 6 }}>Password</label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="Min 8 characters"
                      value={accountPassword}
                      onChange={(e) => setAccountPassword(e.target.value)}
                    />
                  </div>
                )}

                <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
                  <button
                    onClick={() => setShowCreateAccount(false)}
                    className="btn btn-secondary"
                    style={{ flex: 1 }}
                    disabled={accountLoading}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateAccount}
                    className="btn btn-primary"
                    style={{ flex: 1 }}
                    disabled={accountLoading || !accountEmail}
                  >
                    {accountLoading ? "Creating..." : "Create Account"}
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
}
