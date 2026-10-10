"use client";

import { useState, useEffect, useCallback } from "react";
import {
  FileText, Users, BookOpen, Calendar, Lock, Unlock,
  Save, AlertCircle, Check, X, Search, Loader2, ChevronDown
} from "lucide-react";
import { API_URL } from "@/lib/config";


interface ClassArm {
  id: string;
  name: string;
  class: { id: string; name: string };
}

interface SubjectInfo {
  subjectId: string;
  subjectName: string;
  shortCode: string;
  teacherId: string;
  teacherName: string;
}

interface StudentScore {
  studentId: string;
  admissionNumber: string;
  fullName: string;
  gender: string | null;
  caScore: number | null;
  examScore: number | null;
  totalScore: number | null;
  grade: string | null;
  locked: boolean;
}

export default function AdminResultsPage() {
  const [classArms, setClassArms] = useState<ClassArm[]>([]);
  const [subjects, setSubjects] = useState<SubjectInfo[]>([]);
  const [sessions, setSessions] = useState<string[]>([]);

  const [selectedArm, setSelectedArm] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedSession, setSelectedSession] = useState("");
  const [selectedTerm, setSelectedTerm] = useState("1");

  const [students, setStudents] = useState<StudentScore[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const token = "";

  // Load arms
  useEffect(() => {
    const fetchArms = async () => {
      try {
        const res = await fetch(`${API_URL}/api/timetable/class-arms`, {
          credentials: "include",
        });
        const data = await res.json();
        if (data.success) setClassArms(data.data);
      } catch { /* ignore */ }
    };
    fetchArms();
  }, []);

  // Load subjects when arm changes
  useEffect(() => {
    if (!selectedArm) return;
    const fetchSubjects = async () => {
      try {
        const res = await fetch(`${API_URL}/api/results/subjects?classArmId=${selectedArm}`, {
          credentials: "include",
        });
        const data = await res.json();
        if (data.success) setSubjects(data.data);
      } catch { /* ignore */ }
    };
    fetchSubjects();
  }, [selectedArm]);

  // Load sessions
  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const res = await fetch(`${API_URL}/api/results/sessions`, {
          credentials: "include",
        });
        const data = await res.json();
        if (data.success) setSessions(data.data);
      } catch { /* ignore */ }
    };
    fetchSessions();
  }, []);

  const loadSheet = useCallback(async () => {
    if (!selectedArm || !selectedSubject || !selectedSession) return;

    setLoading(true);
    setError("");
    try {
      const res = await fetch(
        `${API_URL}/api/results/load-sheet?classArmId=${selectedArm}&subjectId=${selectedSubject}&session=${selectedSession}&term=${selectedTerm}`,
        { credentials: "include" }
      );
      const data = await res.json();
      if (data.success) {
        setStudents(data.data);
      } else {
        setError(data.error);
      }
    } catch {
      setError("Failed to load results sheet.");
    } finally {
      setLoading(false);
    }
  }, [selectedArm, selectedSubject, selectedSession, selectedTerm]);

  useEffect(() => {
    if (selectedArm && selectedSubject && selectedSession) loadSheet();
  }, [selectedArm, selectedSubject, selectedSession, selectedTerm, loadSheet]);

  const updateScore = (studentId: string, field: "caScore" | "examScore", value: string) => {
    setStudents(prev =>
      prev.map(s =>
        s.studentId === studentId
          ? { ...s, [field]: value === "" ? null : parseFloat(value) || 0 }
          : s
      )
    );
  };

  const saveAll = async () => {
    if (!selectedArm || !selectedSubject || !selectedSession) return;

    setSaving(true);
    setError("");
    setSuccessMsg("");

    const scores = students
      .filter(s => !s.locked)
      .map(s => ({
        studentId: s.studentId,
        caScore: s.caScore,
        examScore: s.examScore,
      }));

    if (scores.length === 0) {
      setError("No unlocked scores to save.");
      setSaving(false);
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/results/batch`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
                  },
        body: JSON.stringify({
          classArmId: selectedArm,
          subjectId: selectedSubject,
          session: selectedSession,
          term: parseInt(selectedTerm),
          scores,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg(`${data.message}`);
        await loadSheet(); // refresh
      } else {
        setError(data.error);
      }
    } catch {
      setError("Failed to save scores.");
    } finally {
      setSaving(false);
    }
  };

  const toggleLock = async (lock: boolean) => {
    if (!selectedArm || !selectedSubject || !selectedSession) return;

    try {
      const res = await fetch(`${API_URL}/api/results/${lock ? "lock" : "unlock"}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
                  },
        body: JSON.stringify({
          classArmId: selectedArm,
          subjectId: selectedSubject,
          session: selectedSession,
          term: parseInt(selectedTerm),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg(data.message);
        await loadSheet();
      } else {
        setError(data.error);
      }
    } catch {
      setError("Failed to update lock status.");
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-display font-medium text-[var(--text)]">Results & Grading</h1>
        <p className="text-sm text-[var(--text-muted)] font-sans mt-1">Enter and manage student scores per class, subject, and term</p>
      </div>

      {/* Toolbar */}
      <div className="card p-4 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="label mb-1 block">Class Arm</label>
            <select value={selectedArm} onChange={e => setSelectedArm(e.target.value)}
              className="input-field">
              <option value="">Select...</option>
              {classArms.map(a => (
                <option key={a.id} value={a.id}>{a.class.name} - {a.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label mb-1 block">Subject</label>
            <select value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)}
              className="input-field">
              <option value="">Select...</option>
              {subjects.map(s => (
                <option key={s.subjectId} value={s.subjectId}>
                  {s.subjectName} ({s.teacherName})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label mb-1 block">Session</label>
            <select value={selectedSession} onChange={e => setSelectedSession(e.target.value)}
              className="input-field">
              <option value="">Select...</option>
              {sessions.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="label mb-1 block">Term</label>
            <select value={selectedTerm} onChange={e => setSelectedTerm(e.target.value)}
              className="input-field">
              <option value="1">First Term</option>
              <option value="2">Second Term</option>
              <option value="3">Third Term</option>
            </select>
          </div>
          <div className="flex items-end gap-2">
            <button onClick={loadSheet}
              className="flex-1 btn btn-primary flex items-center justify-center gap-2 h-10">
              <Search className="w-4 h-4" /> Load
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-xl p-3 mb-4 flex items-center gap-2 text-sm text-red-700 dark:text-red-400">
          <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
          <button onClick={() => setError("")} className="ml-auto"><X className="w-4 h-4" /></button>
        </div>
      )}
      {successMsg && (
        <div className="bg-brand-500/10 border border-brand-500/20 rounded-xl p-3 mb-4 flex items-center gap-2 text-sm text-brand-700 dark:text-brand-400">
          <Check className="w-4 h-4 flex-shrink-0" /> {successMsg}
          <button onClick={() => setSuccessMsg("")} className="ml-auto"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Action bar */}
      {students.length > 0 && (
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-[var(--text-muted)]">
            <Users className="w-4 h-4 inline mr-1" />
            {students.length} student(s) loaded
          </p>
          <div className="flex items-center gap-3">
            <button onClick={() => toggleLock(false)}
              className="btn btn-secondary px-3 py-1.5 text-xs flex items-center gap-1.5">
              <Unlock className="w-3.5 h-3.5" /> Unlock
            </button>
            <button onClick={() => toggleLock(true)}
              className="px-3 py-1.5 text-xs border border-amber-500/30 text-amber-600 bg-amber-500/10 rounded-lg hover:bg-amber-500/20 flex items-center gap-1.5 transition-colors">
              <Lock className="w-3.5 h-3.5" /> Lock
            </button>
            <button onClick={saveAll} disabled={saving}
              className="btn btn-primary px-4 py-1.5 text-sm flex items-center gap-1.5">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save All
            </button>
          </div>
        </div>
      )}

      {/* Load sheet */}
      {loading ? (
        <div className="text-center py-16"><Loader2 className="w-8 h-8 animate-spin mx-auto text-brand-500" /></div>
      ) : students.length > 0 ? (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th className="w-12">#</th>
                  <th>Admission</th>
                  <th>Student Name</th>
                  <th className="text-center w-32">CA (40%)</th>
                  <th className="text-center w-32">Exam (60%)</th>
                  <th className="w-48">Total</th>
                  <th className="text-center w-24">Grade</th>
                  <th className="text-center w-20">Locked</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s, i) => (
                  <tr key={s.studentId} className={s.locked ? "opacity-75 bg-[var(--surface-2)]" : ""}>
                    <td className="text-[var(--text-muted)] text-xs">{i + 1}</td>
                    <td className="font-mono text-xs">{s.admissionNumber}</td>
                    <td className="font-medium text-[var(--text)]">{s.fullName}</td>
                    <td className="text-center">
                      <input
                        type="number"
                        min="0"
                        max="40"
                        value={s.caScore ?? ""}
                        onChange={e => updateScore(s.studentId, "caScore", e.target.value)}
                        disabled={s.locked}
                        className={`w-full px-2 py-1.5 border border-[var(--border)] rounded-lg text-center text-sm outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 bg-[var(--background)] text-[var(--text)] transition-all
                          ${s.locked ? "bg-[var(--surface-2)] cursor-not-allowed text-[var(--text-muted)]" : "hover:border-[var(--border-strong)]"}`}
                      />
                    </td>
                    <td className="text-center">
                      <input
                        type="number"
                        min="0"
                        max="60"
                        value={s.examScore ?? ""}
                        onChange={e => updateScore(s.studentId, "examScore", e.target.value)}
                        disabled={s.locked}
                        className={`w-full px-2 py-1.5 border border-[var(--border)] rounded-lg text-center text-sm outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 bg-[var(--background)] text-[var(--text)] transition-all
                          ${s.locked ? "bg-[var(--surface-2)] cursor-not-allowed text-[var(--text-muted)]" : "hover:border-[var(--border-strong)]"}`}
                      />
                    </td>
                    <td className="font-semibold text-[var(--text)]">
                      {s.totalScore !== null ? (
                        <div className="flex items-center gap-2">
                          <span className="w-8">{s.totalScore.toFixed(1)}</span>
                          <div className="flex-1 h-1.5 bg-[var(--border)] rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${
                                s.totalScore >= 70 ? "bg-emerald-500" :
                                s.totalScore >= 50 ? "bg-brand-500" :
                                s.totalScore >= 40 ? "bg-amber-500" : "bg-red-500"
                              }`}
                              style={{ width: `${s.totalScore}%` }}
                            />
                          </div>
                        </div>
                      ) : (
                        <span className="text-[var(--text-muted)]"> </span>
                      )}
                    </td>
                    <td className="text-center">
                      {s.grade ? (
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold
                          ${s.grade === "A+" || s.grade === "A" ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20" :
                            s.grade === "B" ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20" :
                            s.grade === "C" ? "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border border-yellow-500/20" :
                            s.grade === "D" || s.grade === "E" ? "bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20" :
                            "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20"}`}>{s.grade}</span>
                      ) : <span className="text-[var(--text-muted)]"> </span>}
                    </td>
                    <td className="text-center">
                      {s.locked ? <Lock className="w-4 h-4 text-amber-500 mx-auto" /> : <span className="text-[var(--text-muted)]"> </span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : selectedArm && selectedSubject ? (
        <div className="text-center py-16 text-[var(--text-muted)]">
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No results found. Click "Load" to fetch the score sheet.</p>
        </div>
      ) : (
        <div className="text-center py-16 text-[var(--text-muted)]">
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Select Class Arm, Subject, and Session above to load the score sheet.</p>
        </div>
      )}
    </div>
  );
}
