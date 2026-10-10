"use client";

import { useAuth } from "@/lib/auth/CookieAuthProvider";
import { useState, useCallback, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, CheckCircle, Clock, ChevronDown,
  Loader2, Save, CheckCheck, AlertCircle, Search,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface TimetableSlot {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  subject: { id: string; name: string };
  class: { id: string; name: string };
  classArm: { id: string; name: string };
}

interface Student {
  id: string;
  fullName: string;
  admissionNumber: string;
  classArmId: string;
  classArm?: { id: string; name: string };
  class?: { id: string; name: string };
}

type AttendanceStatus = "PRESENT" | "ABSENT" | "LATE";

interface AttendanceRecord {
  studentId: string;
  status: AttendanceStatus;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatTime12(time24: string): string {
  const [h, m] = String(time24 || "").split(":");
  const hour = parseInt(h, 10);
  if (!Number.isFinite(hour)) return String(time24 || "");
  const ampm = hour >= 12 ? "PM" : "AM";
  const h12 = hour % 12 || 12;
  return `${h12}:${m || "00"} ${ampm}`;
}

/* ------------------------------------------------------------------ */
/*  Animation variants                                                 */
/* ------------------------------------------------------------------ */

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.04 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } },
};

/* ------------------------------------------------------------------ */
/*  Status button colors                                               */
/* ------------------------------------------------------------------ */

const STATUS_CONFIG: Record<AttendanceStatus, { bg: string; border: string; text: string; label: string }> = {
  PRESENT: { bg: "rgba(11,110,79,0.12)", border: "var(--brand)", text: "var(--brand)", label: "Present" },
  ABSENT: { bg: "rgba(244,63,94,0.1)", border: "#f43f5e", text: "#f43f5e", label: "Absent" },
  LATE: { bg: "rgba(245,158,11,0.1)", border: "#f59e0b", text: "#b45309", label: "Late" },
};

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function TeacherAttendance() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [selectedArmId, setSelectedArmId] = useState<string>("");
  const [records, setRecords] = useState<Record<string, AttendanceStatus>>({});
  const [selectedSlotId, setSelectedSlotId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [saveError, setSaveError] = useState("");

  // Dashboard "Mark now" links pass armId/slotId/day as query params.
  const searchParams = useSearchParams();
  const selectedArmFromUrl = searchParams?.get("armId") || "";
  const selectedSlotFromUrl = searchParams?.get("slotId") || "";
  const dayParam = searchParams?.get("day");
  const selectedDayFromUrl =
    dayParam !== null && dayParam !== "" && Number.isFinite(Number(dayParam))
      ? Number(dayParam)
      : null;

  /* ---- Fetch timetable slots ---- */
  const { data: slots = [], isLoading: slotsLoading } = useQuery({
    queryKey: queryKeys.teacher.timesheets({ attendance: true }),
    queryFn: async () => {
      const data = await api.get<any[]>("/api/timetable/my-slots");
      return (Array.isArray(data) ? data : []).map((s) => ({
        ...s,
        classArm: s.classArm || s.arm || null,
        class: s.class || s.arm?.class || null,
      })).filter((s) => s.classArm?.id && s.subject?.id);
    },
    staleTime: 60_000,
  });

  const today = (new Date().getDay() + 6) % 7;
  const [selectedDay, setSelectedDay] = useState<number | null>(selectedDayFromUrl);
  const activeDay = selectedDay ?? today;
  const daySlots = useMemo(() => slots.filter((s) => s.dayOfWeek === activeDay), [slots, activeDay]);

  // Auto-select first arm for the selected day (prefer today)
  const uniqueArms = useMemo(() => {
    const seen = new Set<string>();
    return daySlots.filter((s) => {
      const armId = s.classArm?.id;
      if (!armId || seen.has(armId)) return false;
      seen.add(armId);
      return true;
    });
  }, [daySlots]);

  // Set initial selection
  const effectiveArmId = selectedArmId || selectedArmFromUrl || uniqueArms[0]?.classArm?.id || "";

  /* ---- Fetch students for selected arm ---- */
  const { data: students = [], isLoading: studentsLoading } = useQuery({
    queryKey: queryKeys.students.byClass(effectiveArmId),
    queryFn: async () => {
      const data = await api.get<any[]>(`/api/students?armId=${effectiveArmId}`);
      return (Array.isArray(data) ? data : []).map((s) => ({
        ...s,
        classArmId: s.classArmId || s.armId || s.arm?.id || effectiveArmId,
        classArm: s.classArm || s.arm || null,
        class: s.class || null,
      }));
    },
    enabled: !!effectiveArmId,
    staleTime: 30_000,
  });

  /* ---- Selected slot info ---- */
  const daySlotsForArm = daySlots.filter((s) => s.classArm?.id === effectiveArmId);
  const selectedSlot =
    daySlotsForArm.find((s) => s.id === selectedSlotId) ||
    daySlotsForArm.find((s) => s.id === selectedSlotFromUrl) ||
    daySlotsForArm[0];

  /* ---- Filtered students by search ---- */
  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return students;
    const q = searchQuery.toLowerCase();
    return students.filter(
      (s) =>
        String(s.fullName || "").toLowerCase().includes(q) ||
        String(s.admissionNumber || "").toLowerCase().includes(q)
    );
  }, [students, searchQuery]);

  /* ---- Save mutation ---- */
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!effectiveArmId) {
        throw new Error("Select a class first.");
      }
      if (!filteredStudents.length) {
        throw new Error("No students found for this class yet. Add students before marking attendance.");
      }

      const unmarked = filteredStudents.filter((s) => !records[s.id]);
      if (unmarked.length > 0) {
        throw new Error(
          `Cannot save yet. ${unmarked.length} of ${filteredStudents.length} students are unmarked. Mark everyone, or use "Mark all present" first.`
        );
      }

      const recordsToSave: Array<{
        studentId: string;
        classArmId: string;
        status: AttendanceStatus;
        date: string;
      }> = [];

      for (const student of filteredStudents) {
        // Only explicit marks. Never silently default to PRESENT.
        const status = records[student.id];
        if (!status) continue;
        recordsToSave.push({
          studentId: student.id,
          classArmId: effectiveArmId,
          status,
          date: new Date().toISOString().split("T")[0],
        });
      }

      if (!recordsToSave.length) {
        throw new Error("Mark at least one student before saving attendance.");
      }

      return api.post<{ count: number }>("/api/attendance", { records: recordsToSave });
    },
    onSuccess: () => {
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      queryClient.invalidateQueries({ queryKey: queryKeys.attendance.all });
    },
    onError: (err: any) => {
      setSaveError(err?.message || "Failed to save attendance.");
    },
  });

  /* ---- Mark all present ---- */
  const markAllPresent = useCallback(() => {
    const allPresent: Record<string, AttendanceStatus> = {};
    filteredStudents.forEach((s) => {
      allPresent[s.id] = "PRESENT";
    });
    setRecords((prev) => ({ ...prev, ...allPresent }));
  }, [filteredStudents]);

  /* ---- Set single student status ---- */
  const setStudentStatus = useCallback((studentId: string, status: AttendanceStatus) => {
    setRecords((prev) => ({ ...prev, [studentId]: status }));
  }, []);

  /* ---- Count stats ---- */
  const presentCount = Object.values(records).filter((s) => s === "PRESENT").length;
  const absentCount = Object.values(records).filter((s) => s === "ABSENT").length;
  const lateCount = Object.values(records).filter((s) => s === "LATE").length;
  const markedCount = Object.keys(records).length;

  /* ---- Loading skeleton ---- */
  if (slotsLoading) {
    return (
      <div className="space-y-6">
        <div className="skeleton h-8 w-48" />
        <div className="skeleton h-12 w-full rounded-xl" />
        <div className="space-y-3 mt-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton h-16 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 720, margin: "0 auto" }}>
      {/* ── Header ──────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 20 }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(1.25rem, 3vw, 1.5rem)", fontWeight: 600, color: "var(--heading-color)" }}>
          Attendance
        </h1>
        <p style={{ fontSize: 13, color: "var(--body-color)", fontFamily: "var(--font-sans)", marginTop: 2 }}>
          Mark student attendance for your classes
        </p>

        {/* Day selector from full weekly timetable */}
        <div className="flex flex-wrap gap-2 mt-3">
          {[0, 1, 2, 3, 4].map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => {
                setSelectedDay(d);
                setSelectedArmId("");
              }}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
              style={{
                background: d === activeDay ? "var(--brand)" : "rgba(11,110,79,0.06)",
                color: d === activeDay ? "#fff" : "var(--brand)",
                border: "1px solid",
                borderColor: d === activeDay ? "var(--brand)" : "rgba(11,110,79,0.15)",
              }}
            >
              {["Mon", "Tue", "Wed", "Thu", "Fri"][d]}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Error toast */}
      <AnimatePresence>
        {saveError && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            style={{
              marginBottom: 16,
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "12px 16px",
              borderRadius: 12,
              background: "rgba(244,63,94,0.08)",
              border: "1px solid rgba(244,63,94,0.2)",
              fontSize: 13,
              fontWeight: 500,
              color: "#e11d48",
              fontFamily: "var(--font-sans)",
            }}
          >
            <AlertCircle style={{ width: 18, height: 18, flexShrink: 0 }} />
            {saveError}
            <button
              type="button"
              onClick={() => setSaveError("")}
              style={{ marginLeft: "auto", fontSize: 12, fontWeight: 600 }}
            >
              Dismiss
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Success toast ───────────────────────────────────── */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            style={{
              position: "sticky",
              top: 72,
              zIndex: 40,
              marginBottom: 16,
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "12px 16px",
              borderRadius: 12,
              background: "rgba(11,110,79,0.08)",
              border: "1px solid rgba(11,110,79,0.2)",
              fontSize: 13,
              fontWeight: 500,
              color: "var(--brand)",
              fontFamily: "var(--font-sans)",
            }}
          >
            <CheckCircle style={{ width: 18, height: 18, flexShrink: 0 }} />
            Attendance saved successfully
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Class Arm Selector ──────────────────────────────── */}
      {daySlots.length > 0 ? (
        <>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--body-color)", fontFamily: "var(--font-sans)", marginBottom: 6, letterSpacing: "0.03em", textTransform: "uppercase" }}>
              Select Class
            </label>
            <div style={{ position: "relative" }}>
              <select
                value={effectiveArmId}
                onChange={(e) => {
                  setSelectedArmId(e.target.value);
                  setRecords({});
                  setSearchQuery("");
                }}
                style={{
                  width: "100%",
                  appearance: "none",
                  WebkitAppearance: "none",
                  padding: "12px 40px 12px 14px",
                  borderRadius: 12,
                  border: "1.5px solid var(--card-border)",
                  background: "var(--card-bg)",
                  color: "var(--heading-color)",
                  fontSize: 14,
                  fontFamily: "var(--font-sans)",
                  fontWeight: 500,
                  cursor: "pointer",
                  transition: "border-color 0.15s ease",
                  outline: "none",
                  minHeight: 48,
                }}
              >
                {uniqueArms.map((slot) => (
                  <option key={slot.classArm?.id || slot.id} value={slot.classArm?.id || ""}>
                    {(slot.class?.name || "Class")} - {(slot.classArm?.name || "A")} ({slot.subject?.name || "Subject"})
                  </option>
                ))}
              </select>
              <ChevronDown
                style={{
                  position: "absolute",
                  right: 14,
                  top: "50%",
                  transform: "translateY(-50%)",
                  width: 18,
                  height: 18,
                  color: "var(--muted-color)",
                  pointerEvents: "none",
                }}
              />
            </div>
          </div>

          {/* ── Slot info bar ──────────────────────────────── */}
          {selectedSlot && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "10px 14px",
                borderRadius: 12,
                background: "rgba(11,110,79,0.04)",
                border: "1px solid rgba(11,110,79,0.1)",
                marginBottom: 16,
              }}
            >
              <Clock style={{ width: 16, height: 16, color: "var(--brand)", flexShrink: 0 }} />
              <p style={{ fontSize: 13, color: "var(--heading-color)", fontFamily: "var(--font-sans)" }}>
                <span style={{ fontWeight: 600 }}>{selectedSlot.subject.name}</span>
                <span style={{ color: "var(--muted-color)", margin: "0 6px" }}>|</span>
                {formatTime12(selectedSlot.startTime)} - {formatTime12(selectedSlot.endTime)}
              </p>
              <span style={{ marginLeft: "auto", fontSize: 12, fontWeight: 600, fontFamily: "var(--font-sans)", color: "var(--brand)" }}>
                {filteredStudents.length} students
              </span>
            </motion.div>
          )}

          {/* ── Mark All Present button ──────────────────── */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              {markedCount > 0 && (
                <span style={{ fontSize: 11, fontWeight: 500, color: "var(--body-color)", fontFamily: "var(--font-sans)" }}>
                  {markedCount}/{filteredStudents.length} marked
                </span>
              )}
            </div>
            <button
              onClick={markAllPresent}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                fontSize: 13,
                fontWeight: 600,
                fontFamily: "var(--font-sans)",
                padding: "8px 14px",
                borderRadius: 10,
                background: "rgba(11,110,79,0.08)",
                color: "var(--brand)",
                border: "1px solid rgba(11,110,79,0.15)",
                cursor: "pointer",
                transition: "all 0.15s ease",
                minHeight: 40,
              }}
            >
              <CheckCheck style={{ width: 16, height: 16 }} />
              Mark All Present
            </button>
          </div>

          {/* ── Search ────────────────────────────────────── */}
          {filteredStudents.length > 5 && (
            <div style={{ position: "relative", marginBottom: 14 }}>
              <Search style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", width: 16, height: 16, color: "var(--muted-color)" }} />
              <input
                type="text"
                placeholder="Search by name or admission number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 14px 10px 38px",
                  borderRadius: 10,
                  border: "1.5px solid var(--card-border)",
                  background: "var(--card-bg)",
                  color: "var(--heading-color)",
                  fontSize: 13,
                  fontFamily: "var(--font-sans)",
                  outline: "none",
                  transition: "border-color 0.15s ease",
                  minHeight: 44,
                }}
              />
            </div>
          )}

          {/* ── Student list ──────────────────────────────── */}
          {studentsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="skeleton h-20 w-full rounded-xl" />
              ))}
            </div>
          ) : filteredStudents.length === 0 ? (
            <div style={{ textAlign: "center", padding: "48px 24px" }}>
              <Users style={{ width: 36, height: 36, color: "#c8d5cc", margin: "0 auto 12px" }} />
              <p style={{ fontSize: 14, color: "var(--muted-color)", fontFamily: "var(--font-sans)" }}>
                {searchQuery ? "No students match your search." : "No students in this class arm."}
              </p>
            </div>
          ) : (
            <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-2" style={{ paddingBottom: 100 }}>
              {filteredStudents.map((student, i) => {
                const currentStatus = records[student.id];
                const config = currentStatus ? STATUS_CONFIG[currentStatus] : null;

                return (
                  <motion.div
                    key={student.id}
                    variants={fadeUp}
                    style={{
                      background: "var(--card-bg)",
                      border: config ? `1.5px solid ${config.border}25` : "1px solid var(--card-border)",
                      borderRadius: 14,
                      padding: "14px 16px",
                      transition: "all 0.15s ease",
                    }}
                  >
                    {/* Student info */}
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 10,
                          background: config ? config.bg : "var(--surface-2, #f1f5f9)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 13,
                          fontWeight: 700,
                          fontFamily: "var(--font-sans)",
                          color: config ? config.text : "var(--muted-color)",
                          flexShrink: 0,
                        }}
                      >
                        {student.fullName.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 14, fontWeight: 600, fontFamily: "var(--font-sans)", color: "var(--heading-color)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {student.fullName}
                        </p>
                        <p style={{ fontSize: 11, color: "var(--muted-color)", fontFamily: "var(--font-sans)", marginTop: 1 }}>
                          {student.admissionNumber}
                        </p>
                      </div>
                      {config && (
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 600,
                            color: config.text,
                            background: config.bg,
                            padding: "2px 8px",
                            borderRadius: 999,
                            fontFamily: "var(--font-sans)",
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                          }}
                        >
                          {config.label}
                        </span>
                      )}
                    </div>

                    {/* Status buttons   large touch targets 52px */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                      {(["PRESENT", "ABSENT", "LATE"] as AttendanceStatus[]).map((status) => {
                        const isActive = currentStatus === status;
                        const sc = STATUS_CONFIG[status];

                        return (
                          <button
                            key={status}
                            onClick={() => setStudentStatus(student.id, status)}
                            style={{
                              minHeight: 52,
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: 2,
                              borderRadius: 12,
                              border: isActive ? `2px solid ${sc.border}` : "1.5px solid var(--card-border)",
                              background: isActive ? sc.bg : "transparent",
                              color: isActive ? sc.text : "var(--muted-color)",
                              cursor: "pointer",
                              transition: "all 0.15s ease",
                              fontWeight: isActive ? 600 : 400,
                              fontSize: 12,
                              fontFamily: "var(--font-sans)",
                            }}
                          >
                            {status === "PRESENT" && <CheckCircle style={{ width: 16, height: 16 }} />}
                            {status === "ABSENT" && <AlertCircle style={{ width: 16, height: 16 }} />}
                            {status === "LATE" && <Clock style={{ width: 16, height: 16 }} />}
                            <span>{sc.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}

          {/* ── Sticky Save Button ────────────────────────── */}
          {filteredStudents.length > 0 && (
            <div
              style={{
                position: "sticky",
                bottom: 0,
                left: 0,
                right: 0,
                padding: "14px 0",
                background: "linear-gradient(to top, var(--bg) 60%, transparent)",
                zIndex: 30,
              }}
            >
              <button
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending || filteredStudents.length === 0}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  padding: "14px 20px",
                  borderRadius: 14,
                  background: saveMutation.isPending
                    ? "var(--muted-color)"
                    : "linear-gradient(135deg, #0b6e4f 0%, #12926a 100%)",
                  color: "#fff",
                  fontSize: 15,
                  fontWeight: 600,
                  fontFamily: "var(--font-sans)",
                  border: "none",
                  cursor: saveMutation.isPending ? "not-allowed" : "pointer",
                  minHeight: 52,
                  boxShadow: saveMutation.isPending
                    ? "none"
                    : "0 4px 16px rgba(11,110,79,0.3), inset 0 1px 0 rgba(255,255,255,0.1)",
                  transition: "all 0.2s ease",
                }}
              >
                {saveMutation.isPending ? (
                  <>
                    <Loader2 style={{ width: 20, height: 20, animation: "spin 1s linear infinite" }} />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save style={{ width: 20, height: 20 }} />
                    Save Attendance
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        background: "rgba(255,255,255,0.2)",
                        padding: "2px 8px",
                        borderRadius: 999,
                      }}
                    >
                      {markedCount} of {filteredStudents.length} marked
                    </span>
                  </>
                )}
              </button>
            </div>
          )}
        </>
      ) : (
        /* ── Empty state ──────────────────────────────── */
        <div style={{ textAlign: "center", padding: "64px 24px" }}>
          <Clock style={{ width: 40, height: 40, color: "#c8d5cc", margin: "0 auto 16px" }} />
          {slots.length === 0 ? (
            <>
              <p style={{ fontSize: 15, color: "var(--muted-color)", fontFamily: "var(--font-sans)", marginBottom: 16 }}>
                No teaching classes assigned yet. Complete your teaching setup or ask your school admin to add class arms.
              </p>
              <a href="/dashboard/teacher/setup" className="btn-primary inline-flex">
                Go to teaching setup
              </a>
            </>
          ) : (
            <>
              <p style={{ fontSize: 15, color: "var(--muted-color)", fontFamily: "var(--font-sans)", marginBottom: 8 }}>
                No classes scheduled for today.
              </p>
              <p style={{ fontSize: 13, color: "var(--text-muted)", fontFamily: "var(--font-sans)", marginBottom: 16 }}>
                Pick another day from your timetable, or ask your school admin to add this period.
              </p>
              <a href="/dashboard/teacher/setup" className="btn-secondary inline-flex">
                Open teaching setup
              </a>
            </>
          )}
        </div>
      )}

      {/* Spin animation for loader */}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
