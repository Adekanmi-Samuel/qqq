"use client";

import { useAuth } from "@/lib/auth/CookieAuthProvider";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft, User, Phone, Mail, Calendar, GraduationCap,
  Heart, Home, FileText, Activity, Wallet, ClipboardCheck,
  Loader2, AlertCircle, ShieldAlert, School,
} from "lucide-react";
import { api } from "@/lib/api";

interface ParentInfo {
  id: string | null;
  fullName: string;
  email?: string | null;
  role?: string;
  active?: boolean;
}

interface StudentDetail {
  id: string;
  admissionNumber: string;
  fullName: string;
  gender: string | null;
  dob?: string | null;
  dateOfBirth?: string | null;
  parentName?: string | null;
  parentPhone?: string | null;
  parentEmail?: string | null;
  passportUrl?: string | null;
  house?: string | null;
  bloodGroup?: string | null;
  allergies?: string | null;
  medicalNotes?: string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  previousSchool?: string | null;
  stateOfOrigin?: string | null;
  nationality?: string | null;
  notes?: string | null;
  active: boolean;
  createdAt: string;
  class: { id: string; name: string } | null;
  arm: { id: string; name: string } | null;
  user: { id: string; email: string; role: string; active: boolean } | null;
  parents?: ParentInfo[];
  attendance?: {
    rate: number | null;
    totalMarked: number;
    counts: Record<string, number>;
    recent: { id: string; date: string; status: string }[];
  };
  fees?: {
    expected: number;
    paid: number;
    balance: number;
    paymentsTotal: number;
    records: {
      id: string;
      term: number;
      session: string;
      amount: number;
      description: string;
      status: string;
      paymentMethod?: string | null;
      paidAt?: string | null;
      createdAt: string;
    }[];
    payments: {
      id: string;
      amount: number;
      reference: string;
      status: string;
      channel?: string | null;
      paidAt?: string | null;
      createdAt: string;
    }[];
  };
  results?: {
    termResults: {
      id: string;
      session: string;
      term: number;
      subjectId: string;
      subject?: { id: string; name: string; shortCode?: string } | null;
      caScore?: number | null;
      examScore?: number | null;
      totalScore?: number | null;
      grade?: string | null;
      remark?: string | null;
    }[];
    examAttempts: {
      id: string;
      score: number;
      total: number;
      submittedAt?: string | null;
      exam?: { id: string; title: string } | null;
    }[];
    cbtAttempts: {
      id: string;
      examType: string;
      year?: number | null;
      mode: string;
      score: number;
      total: number;
      correctCount: number;
      wrongCount: number;
      startedAt: string;
      subject?: { name: string } | null;
    }[];
  };
}

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

function formatDate(d?: string | null) {
  if (!d) return "Not set";
  return new Date(d).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
}

function formatMoney(n: number) {
  return `₦${Number(n || 0).toLocaleString()}`;
}

function statusTone(status: string) {
  const s = (status || "").toUpperCase();
  if (s === "PAID" || s === "PRESENT" || s === "success" || s === "paid" || s === "completed") return "var(--brand)";
  if (s === "LATE" || s === "PENDING" || s === "PARTIAL") return "#f59e0b";
  if (s === "ABSENT" || s === "SICK") return "#f43f5e";
  return "var(--text-muted)";
}

function Row({ label, value, icon }: { label: string; value?: string | null; icon?: React.ReactNode }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 text-sm py-1.5">
      {icon ? <span className="mt-0.5" style={{ color: "var(--text-muted)" }}>{icon}</span> : null}
      <div>
        <div className="text-[11px] uppercase tracking-wide" style={{ color: "var(--muted-color)" }}>{label}</div>
        <div style={{ color: "var(--text)" }}>{value}</div>
      </div>
    </div>
  );
}

function StudentDetailContent() {
  const searchParams = useSearchParams();
  const studentId = searchParams.get("id");
  const [student, setStudent] = useState<StudentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"overview" | "attendance" | "fees" | "results" | "history">("overview");

  useEffect(() => {
    if (!studentId) { setLoading(false); setError("No student ID provided."); return; }
    (async () => {
      try {
        // api.get unwraps the envelope and returns the student object.
        const data: any = await api.get(`/api/students/${studentId}`);
        const payload = data?.id ? data : data?.data;
        if (payload?.id) setStudent(payload);
        else setError("Student not found.");
      } catch {
        setError("Failed to load student details.");
      } finally { setLoading(false); }
    })();
  }, [studentId]);

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-8 h-8 animate-spin" style={{ color: "var(--brand)" }} />
    </div>
  );

  if (error || !student) return (
    <div className="text-center py-20">
      <AlertCircle className="w-10 h-10 mx-auto mb-3" style={{ color: "var(--color-danger)" }} />
      <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>{error || "Student not found."}</p>
      <Link href="/dashboard/admin/students" className="btn btn-primary">Back to Students</Link>
    </div>
  );

  const att = student.attendance;
  const fees = student.fees;
  const results = student.results;
  const parents = student.parents?.length
    ? student.parents
    : [
        {
          id: null,
          fullName: student.parentName || "Guardian",
          email: student.parentEmail,
        },
      ];

  const tabs = [
    { key: "overview" as const, label: "Overview" },
    { key: "attendance" as const, label: "Attendance" },
    { key: "fees" as const, label: "Fees" },
    { key: "results" as const, label: "Results" },
    { key: "history" as const, label: "History" },
  ];

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
      <Link href="/dashboard/admin/students" className="inline-flex items-center gap-2 text-sm font-medium" style={{ color: "var(--text-muted)", textDecoration: "none", minHeight: 44 }}>
        <ArrowLeft size={16} /> Back to Students
      </Link>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="sh-card p-6">
        <div className="flex flex-col sm:flex-row items-start gap-5">
          {student.passportUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={student.passportUrl}
              alt={`${student.fullName} passport`}
              className="w-20 h-20 rounded-2xl object-cover shrink-0"
              style={{ border: "1px solid var(--card-border)" }}
            />
          ) : (
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center text-white text-xl font-bold shrink-0"
              style={{ background: "linear-gradient(135deg, #0b6e4f, #12926a)" }}
            >
              {getInitials(student.fullName)}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
              <h1 className="text-xl font-bold" style={{ fontFamily: "var(--font-display)", color: "var(--heading-color)" }}>
                {student.fullName}
              </h1>
              <span className={`badge ${student.active ? "badge-green" : "badge-red"}`}>
                {student.active ? "Active" : "Inactive"}
              </span>
            </div>
            <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs" style={{ color: "var(--text-muted)" }}>
              <span className="flex items-center gap-1.5"><GraduationCap size={14} />{student.class?.name || "No class"}{student.arm?.name ? ` ${student.arm.name}` : ""}</span>
              <span className="flex items-center gap-1.5 font-mono" style={{ color: "var(--brand)" }}>{student.admissionNumber}</span>
              {student.gender && <span className="flex items-center gap-1.5"><User size={14} />{student.gender}</span>}
              <span className="flex items-center gap-1.5"><Calendar size={14} />{formatDate(student.dateOfBirth || student.dob)}</span>
              {student.house && <span className="flex items-center gap-1.5"><Home size={14} />{student.house} House</span>}
            </div>
            <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <div style={{ color: "var(--muted-color)" }}>Attendance</div>
                <div className="font-semibold" style={{ color: "var(--heading-color)" }}>
                  {att?.rate != null ? `${att.rate}%` : "No records"}
                </div>
              </div>
              <div>
                <div style={{ color: "var(--muted-color)" }}>Fee balance</div>
                <div className="font-semibold" style={{ color: fees && fees.balance > 0 ? "#f59e0b" : "var(--brand)" }}>
                  {fees ? formatMoney(fees.balance) : "—"}
                </div>
              </div>
              <div>
                <div style={{ color: "var(--muted-color)" }}>Fees paid</div>
                <div className="font-semibold" style={{ color: "var(--heading-color)" }}>
                  {fees ? formatMoney(fees.paid) : "—"}
                </div>
              </div>
              <div>
                <div style={{ color: "var(--muted-color)" }}>Blood group</div>
                <div className="font-semibold" style={{ color: "var(--heading-color)" }}>
                  {student.bloodGroup || "Not set"}
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl overflow-x-auto" style={{ background: "var(--surface-2)" }}>
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className="flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all whitespace-nowrap"
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

      {/* Overview */}
      {activeTab === "overview" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid gap-4 md:grid-cols-2">
          <div className="sh-card p-5">
            <h3 className="text-base font-semibold mb-3 flex items-center gap-2" style={{ color: "var(--heading-color)" }}>
              <User size={16} /> Personal
            </h3>
            <Row label="Gender" value={student.gender} icon={<User size={14} />} />
            <Row label="Date of birth" value={formatDate(student.dateOfBirth || student.dob)} icon={<Calendar size={14} />} />
            <Row label="House" value={student.house} icon={<Home size={14} />} />
            <Row label="Blood group" value={student.bloodGroup} icon={<Heart size={14} />} />
            <Row label="Nationality" value={student.nationality} />
            <Row label="State of origin" value={student.stateOfOrigin} />
            <Row label="Previous school" value={student.previousSchool} icon={<School size={14} />} />
          </div>

          <div className="sh-card p-5">
            <h3 className="text-base font-semibold mb-3 flex items-center gap-2" style={{ color: "var(--heading-color)" }}>
              <Heart size={16} /> Medical
            </h3>
            <Row label="Allergies" value={student.allergies} />
            <Row label="Medical notes" value={student.medicalNotes} />
            {!student.allergies && !student.medicalNotes && (
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>No medical information recorded.</p>
            )}
          </div>

          <div className="sh-card p-5">
            <h3 className="text-base font-semibold mb-3 flex items-center gap-2" style={{ color: "var(--heading-color)" }}>
              <Phone size={16} /> Parent / Guardian
            </h3>
            {parents.map((p, i) => (
              <div key={p.id || i} className="mb-3 pb-3" style={{ borderBottom: i < parents.length - 1 ? "1px solid var(--card-border)" : "none" }}>
                <div className="flex items-center gap-2 text-sm font-medium" style={{ color: "var(--text)" }}>
                  <User size={14} style={{ color: "var(--text-muted)" }} /> {p.fullName}
                </div>
                {p.email && <div className="flex items-center gap-2 text-sm mt-1" style={{ color: "var(--text)" }}><Mail size={14} style={{ color: "var(--text-muted)" }} />{p.email}</div>}
                {student.parentPhone && i === 0 && (
                  <div className="flex items-center gap-2 text-sm mt-1" style={{ color: "var(--text)" }}><Phone size={14} style={{ color: "var(--text-muted)" }} />{student.parentPhone}</div>
                )}
              </div>
            ))}
            {!parents.length && <p className="text-sm" style={{ color: "var(--text-muted)" }}>No parent information recorded.</p>}
            {(student.emergencyContactName || student.emergencyContactPhone) && (
              <div className="mt-2 pt-3" style={{ borderTop: "1px solid var(--card-border)" }}>
                <div className="text-[11px] uppercase tracking-wide mb-1" style={{ color: "var(--muted-color)" }}>Emergency contact</div>
                <div className="text-sm flex items-center gap-2" style={{ color: "var(--text)" }}>
                  <ShieldAlert size={14} style={{ color: "#f59e0b" }} />
                  {student.emergencyContactName || "Contact"}
                  {student.emergencyContactPhone ? ` · ${student.emergencyContactPhone}` : ""}
                </div>
              </div>
            )}
          </div>

          <div className="sh-card p-5">
            <h3 className="text-base font-semibold mb-3 flex items-center gap-2" style={{ color: "var(--heading-color)" }}>
              <FileText size={16} /> Account & Notes
            </h3>
            {student.user ? (
              <div className="space-y-2 mb-3">
                <div className="flex items-center gap-2 text-sm" style={{ color: "var(--text)" }}>
                  <Mail size={14} style={{ color: "var(--text-muted)" }} />{student.user.email}
                </div>
                <span className="badge badge-green">Has Login Account</span>
              </div>
            ) : (
              <p className="text-sm mb-3" style={{ color: "var(--text-muted)" }}>No login account created.</p>
            )}
            <Row label="Notes" value={student.notes} />
            <Row label="Joined" value={formatDate(student.createdAt)} icon={<Calendar size={14} />} />
          </div>
        </motion.div>
      )}

      {/* Attendance */}
      {activeTab === "attendance" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div className="sh-card p-5">
            <h3 className="text-base font-semibold mb-4" style={{ color: "var(--heading-color)" }}>Attendance summary</h3>
            {att && att.totalMarked > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-sm">
                <div>
                  <div style={{ color: "var(--muted-color)" }}>Rate</div>
                  <div className="text-lg font-bold" style={{ color: "var(--brand)" }}>{att.rate}%</div>
                </div>
                {["PRESENT", "LATE", "ABSENT", "EXCUSED", "SICK"].map((k) => (
                  <div key={k}>
                    <div style={{ color: "var(--muted-color)" }}>{k.charAt(0) + k.slice(1).toLowerCase()}</div>
                    <div className="text-lg font-bold" style={{ color: statusTone(k) }}>{att.counts[k] || 0}</div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>No attendance records yet.</p>
            )}
          </div>
          <div className="sh-card p-5">
            <h3 className="text-base font-semibold mb-3" style={{ color: "var(--heading-color)" }}>Recent attendance</h3>
            {att?.recent?.length ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ color: "var(--muted-color)", borderBottom: "1px solid var(--card-border)" }}>
                      <th className="text-left py-2 font-medium">Date</th>
                      <th className="text-left py-2 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {att.recent.map((row) => (
                      <tr key={row.id} style={{ borderBottom: "1px solid var(--card-border)" }}>
                        <td className="py-2" style={{ color: "var(--text)" }}>{formatDate(row.date)}</td>
                        <td className="py-2 font-medium" style={{ color: statusTone(row.status) }}>{row.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>Nothing marked yet.</p>
            )}
          </div>
        </motion.div>
      )}

      {/* Fees */}
      {activeTab === "fees" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div className="sh-card p-5">
            <h3 className="text-base font-semibold mb-4" style={{ color: "var(--heading-color)" }}>Fee position</h3>
            {fees ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                <div>
                  <div style={{ color: "var(--muted-color)" }}>Expected</div>
                  <div className="text-lg font-bold" style={{ color: "var(--heading-color)" }}>{formatMoney(fees.expected)}</div>
                </div>
                <div>
                  <div style={{ color: "var(--muted-color)" }}>Paid</div>
                  <div className="text-lg font-bold" style={{ color: "var(--brand)" }}>{formatMoney(fees.paid)}</div>
                </div>
                <div>
                  <div style={{ color: "var(--muted-color)" }}>Balance</div>
                  <div className="text-lg font-bold" style={{ color: fees.balance > 0 ? "#f59e0b" : "var(--brand)" }}>{formatMoney(fees.balance)}</div>
                </div>
                <div>
                  <div style={{ color: "var(--muted-color)" }}>Payments logged</div>
                  <div className="text-lg font-bold" style={{ color: "var(--heading-color)" }}>{formatMoney(fees.paymentsTotal)}</div>
                </div>
              </div>
            ) : (
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>No fee records yet.</p>
            )}
          </div>
          <div className="sh-card p-5">
            <h3 className="text-base font-semibold mb-3 flex items-center gap-2" style={{ color: "var(--heading-color)" }}>
              <Wallet size={16} /> Fee records
            </h3>
            {fees?.records?.length ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ color: "var(--muted-color)", borderBottom: "1px solid var(--card-border)" }}>
                      <th className="text-left py-2 font-medium">Item</th>
                      <th className="text-left py-2 font-medium">Term</th>
                      <th className="text-right py-2 font-medium">Amount</th>
                      <th className="text-right py-2 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fees.records.map((f) => (
                      <tr key={f.id} style={{ borderBottom: "1px solid var(--card-border)" }}>
                        <td className="py-2" style={{ color: "var(--text)" }}>{f.description}</td>
                        <td className="py-2" style={{ color: "var(--text-muted)" }}>{f.session} T{f.term}</td>
                        <td className="py-2 text-right" style={{ color: "var(--heading-color)" }}>{formatMoney(f.amount)}</td>
                        <td className="py-2 text-right font-medium" style={{ color: statusTone(f.status) }}>{f.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>No fee lines recorded.</p>
            )}
          </div>
        </motion.div>
      )}

      {/* Results */}
      {activeTab === "results" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div className="sh-card p-5">
            <h3 className="text-base font-semibold mb-3 flex items-center gap-2" style={{ color: "var(--heading-color)" }}>
              <ClipboardCheck size={16} /> Term results
            </h3>
            {results?.termResults?.length ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ color: "var(--muted-color)", borderBottom: "1px solid var(--card-border)" }}>
                      <th className="text-left py-2 font-medium">Session</th>
                      <th className="text-left py-2 font-medium">Term</th>
                      <th className="text-left py-2 font-medium">Subject</th>
                      <th className="text-left py-2 font-medium">CA</th>
                      <th className="text-left py-2 font-medium">Exam</th>
                      <th className="text-left py-2 font-medium">Total</th>
                      <th className="text-left py-2 font-medium">Grade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.termResults.map((r) => (
                      <tr key={r.id} style={{ borderBottom: "1px solid var(--card-border)" }}>
                        <td className="py-2" style={{ color: "var(--text)" }}>{r.session}</td>
                        <td className="py-2" style={{ color: "var(--text-muted)" }}>Term {r.term}</td>
                        <td className="py-2" style={{ color: "var(--text)" }}>{r.subject?.name || r.subjectId.slice(0, 8)}</td>
                        <td className="py-2" style={{ color: "var(--text)" }}>{r.caScore ?? "—"}</td>
                        <td className="py-2" style={{ color: "var(--text)" }}>{r.examScore ?? "—"}</td>
                        <td className="py-2 font-semibold" style={{ color: "var(--heading-color)" }}>{r.totalScore ?? "—"}</td>
                        <td className="py-2" style={{ color: "var(--brand)" }}>{r.grade || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>No term results published yet.</p>
            )}
          </div>

          <div className="sh-card p-5">
            <h3 className="text-base font-semibold mb-3 flex items-center gap-2" style={{ color: "var(--heading-color)" }}>
              <Activity size={16} /> CBT attempts
            </h3>
            {results?.cbtAttempts?.length ? (
              <div className="space-y-2">
                {results.cbtAttempts.map((a) => (
                  <div key={a.id} className="flex items-center justify-between text-sm py-2" style={{ borderBottom: "1px solid var(--card-border)" }}>
                    <div>
                      <div style={{ color: "var(--text)" }}>{a.subject?.name || a.examType} · {a.mode}</div>
                      <div style={{ color: "var(--muted-color)" }}>{formatDate(a.startedAt)}</div>
                    </div>
                    <div className="font-semibold" style={{ color: "var(--heading-color)" }}>
                      {a.score}/{a.total || "?"}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>No CBT attempts yet.</p>
            )}
          </div>
        </motion.div>
      )}

      {/* History */}
      {activeTab === "history" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div className="sh-card p-5">
            <h3 className="text-base font-semibold mb-3" style={{ color: "var(--heading-color)" }}>School history</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2" style={{ color: "var(--text)" }}>
                <Calendar size={14} style={{ color: "var(--text-muted)" }} />
                Joined {formatDate(student.createdAt)}
              </div>
              <div className="flex items-center gap-2" style={{ color: "var(--text)" }}>
                <GraduationCap size={14} style={{ color: "var(--text-muted)" }} />
                Currently {student.class?.name || "unassigned"}{student.arm?.name ? ` ${student.arm.name}` : ""}
              </div>
              {student.previousSchool && (
                <div className="flex items-center gap-2" style={{ color: "var(--text)" }}>
                  <School size={14} style={{ color: "var(--text-muted)" }} />
                  Previous school: {student.previousSchool}
                </div>
              )}
              <div className="flex items-center gap-2" style={{ color: "var(--text)" }}>
                <FileText size={14} style={{ color: "var(--text-muted)" }} />
                {results?.termResults?.length || 0} term result rows · {results?.cbtAttempts?.length || 0} CBT attempts · {fees?.records?.length || 0} fee lines
              </div>
            </div>
          </div>
          <div className="sh-card p-5">
            <h3 className="text-base font-semibold mb-3" style={{ color: "var(--heading-color)" }}>Exam attempts</h3>
            {results?.examAttempts?.length ? (
              <div className="space-y-2">
                {results.examAttempts.map((e) => (
                  <div key={e.id} className="flex items-center justify-between text-sm py-2" style={{ borderBottom: "1px solid var(--card-border)" }}>
                    <div style={{ color: "var(--text)" }}>{e.exam?.title || "Exam"}</div>
                    <div className="font-semibold" style={{ color: "var(--heading-color)" }}>{e.score}/{e.total}</div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>No exam attempts recorded.</p>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}

export default function StudentDetailPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin" style={{ color: "var(--brand)" }} /></div>}>
      <StudentDetailContent />
    </Suspense>
  );
}
