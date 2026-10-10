"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Brain, BookMarked, FileText, CheckCircle, AlertCircle, Loader2,
  Sparkles, Plus, X, BookOpen, ChevronLeft, ChevronRight,
  ClipboardCheck, HelpCircle, Download, GraduationCap,
} from "lucide-react";
import confetti from "canvas-confetti";
import { API_URL } from "@/lib/config";

interface Subject { id: string; name: string; shortCode?: string; }
interface ClassInfo { id: string; name: string; }
interface WeekItem { week: number; topic: string; isCompleted: boolean; completedAt?: string | null; }
interface LessonNote {
  id: string;
  weekNumber: number;
  topic: string;
  content: string;
  exercises: { question: string; answer: string }[];
  assignments: { question: string }[];
}
interface Scheme {
  id: string;
  title: string;
  session: string;
  term: number;
  subject: { name: string };
  class: { name: string };
  weeks: WeekItem[];
  lessonNotes: LessonNote[];
  periodsPerWeek: number;
  minutesPerPeriod: number;
  midtermQuestions: any;
  examQuestions: any;
}

const MIDTERM_WEEK = 5;

/** CSRF double-submit token. Mutating requests are rejected without it. */
function csrfHeaders(): Record<string, string> {
  if (typeof document === "undefined") return {};
  const cookie = document.cookie.split(";").find((c) => c.trim().startsWith("sh_csrf="));
  const token = cookie ? cookie.split("=")[1].trim() : "";
  return token ? { "X-CSRF-TOKEN": token } : {};
}

/** Notes written by AI carry a marker; the template fallback does not. */
function isAiNote(content: string | undefined): boolean {
  return !!content && content.includes("<!-- ai-generated -->");
}

export default function LessonNotes() {
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Stepped flow: class -> subject -> week
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);

  const [generating, setGenerating] = useState<string | null>(null);
  const [aiGeneratingId, setAiGeneratingId] = useState<string | null>(null);
  const [completing, setCompleting] = useState<string | null>(null);
  const [generatingAssessment, setGeneratingAssessment] = useState<string | null>(null);
  const [viewingNote, setViewingNote] = useState<{ schemeId: string; lessonNote: LessonNote } | null>(null);
  const [viewingAssessment, setViewingAssessment] = useState<{
    schemeId: string;
    type: "midterm" | "exam";
    html: string;
    questions: any[];
  } | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showAddSubject, setShowAddSubject] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState("");
  const [addingSubject, setAddingSubject] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState({
    subjectId: "",
    classId: "",
    title: "",
    session: "2025/2026",
    term: 1,
    weeksInput: "1. \n2. \n3. \n4. \n5. \n6. \n7. \n8. \n9. \n10. \n11. \n12. ",
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setError("");
    try {
      const [schemesRes, subjectsRes, classesRes, setupRes] = await Promise.all([
        fetch(`${API_URL}/api/ai/schemes`, { credentials: "include" }),
        fetch(`${API_URL}/api/subjects`, { credentials: "include" }),
        fetch(`${API_URL}/api/classes`, { credentials: "include" }),
        fetch(`${API_URL}/api/teacher/setup`, { credentials: "include" }).catch(() => null),
      ]);
      if (!schemesRes.ok || !subjectsRes.ok || !classesRes.ok) {
        throw new Error(
          !schemesRes.ok
            ? "Could not load schemes. Please try again."
            : !subjectsRes.ok
              ? "Could not load subjects. Please try again."
              : "Could not load classes. Please try again."
        );
      }
      const [schemesData, subjectsData, classesData] = await Promise.all([
        schemesRes.json(),
        subjectsRes.json(),
        classesRes.json(),
      ]);
      if (schemesData.success === false || !schemesData.success) {
        throw new Error(schemesData.error || "Could not load schemes. Please try again.");
      }
      if (subjectsData.success === false || classesData.success === false) {
        throw new Error("Could not load classes or subjects. Please try again.");
      }

      // Scope pickers to teacher setup assignments when available
      const setupData = setupRes ? await setupRes.json() : null;
      const assignments = setupData?.data?.assignments || setupData?.assignments || [];
      const assignedSubjectIds = new Set<string>(
        assignments.map((a: any) => a.subjectId).filter(Boolean)
      );
      const assignedArmIds = new Set<string>(
        assignments.map((a: any) => a.classArmId).filter(Boolean)
      );
      const assignedClassNames = new Set<string>(
        assignments
          .map((a: any) => a.arm?.class?.name)
          .filter(Boolean)
      );

      let schemeList = schemesData.data || [];
      let subjectList = subjectsData.data || [];
      let classList = classesData.data || [];

      if (assignedSubjectIds.size > 0) {
        schemeList = schemeList.filter((s: any) => {
          const name = s.subject?.name || "";
          const match = assignments.find((a: any) => a.subject?.name === name);
          return !!(match || assignedSubjectIds.has(s.subjectId));
        });
        // Prefer subjects the teacher is assigned to
        const assignedSubjectNames = new Set(
          assignments.map((a: any) => a.subject?.name).filter(Boolean)
        );
        subjectList = subjectList.filter(
          (s: any) => assignedSubjectNames.has(s.name) || assignedSubjectIds.has(s.id)
        );
      }

      if (assignedClassNames.size > 0) {
        schemeList = schemeList.filter((s: any) => assignedClassNames.has(s.class?.name));
        classList = classList.filter((c: any) => assignedClassNames.has(c.name));
      }

      if (schemesData.success) setSchemes(schemeList);
      if (subjectsData.success) setSubjects(subjectList);
      if (classesData.success) setClasses(classList);
    } catch (e: any) {
      console.error(e);
      setError(e?.message || "Failed to load lesson notes data. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  const availableSubjects = useMemo(() => {
    const names = new Set<string>();
    schemes.forEach((s) => {
      if (!selectedClass || s.class.name === selectedClass) names.add(s.subject.name);
    });
    subjects.forEach((s) => names.add(s.name));
    return Array.from(names).sort((a, b) => a.localeCompare(b));
  }, [schemes, subjects, selectedClass]);

  const classOptions = useMemo(() => {
    const fromSchemes = schemes.map((s) => s.class.name);
    const fromClasses = classes.map((c) => c.name);
    return Array.from(new Set([...fromSchemes, ...fromClasses])).sort((a, b) => {
      const rank = (n: string) => {
        const u = n.toUpperCase();
        if (u.startsWith("JSS")) return 100 + Number(u.replace(/\D/g, ""));
        if (u.startsWith("SS")) return 200 + Number(u.replace(/\D/g, ""));
        if (u.startsWith("PRIMARY") || u.startsWith("PRIMARY")) return 300;
        return 400;
      };
      return rank(a) - rank(b) || a.localeCompare(b);
    });
  }, [schemes, classes]);

  const activeScheme = useMemo(() => {
    if (!selectedClass || !selectedSubject) return null;
    return (
      schemes.find((s) => s.class?.name === selectedClass && s.subject?.name === selectedSubject) ||
      schemes.find((s) => s.class?.name === selectedClass && s.subject?.name?.toLowerCase() === selectedSubject.toLowerCase()) ||
      null
    );
  }, [schemes, selectedClass, selectedSubject]);

  const activeWeek = activeScheme && selectedWeek != null
    ? activeScheme.weeks.find((w) => w.week === selectedWeek) || null
    : null;

  const activeNote = activeScheme && selectedWeek != null
    ? activeScheme.lessonNotes.find((n) => n.weekNumber === selectedWeek) || null
    : null;

  function resetSubjectWeek() {
    setSelectedSubject("");
    setSelectedWeek(null);
  }

  function resetWeek() {
    setSelectedWeek(null);
  }

  async function handleGenerate(schemeId: string, weekNumber: number) {
    setGenerating(`${schemeId}-${weekNumber}`);
    setError("");
    try {
      const res = await fetch(`${API_URL}/api/ai/generate-lesson`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", ...csrfHeaders() },
        body: JSON.stringify({ schemeId, weekNumber }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(`Lesson note for Week ${weekNumber} ready.`);
        setViewingNote({ schemeId, lessonNote: data.data });
        loadData();
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(data.error || "Generation failed. Try again in a moment.");
      }
    } catch {
      setError("Network error.");
    } finally {
      setGenerating(null);
    }
  }

  /**
   * Upgrade one note to a full AI written note for this school.
   * The backend keeps each call inside the request budget, so notes are
   * upgraded one at a time rather than all at once.
   */
  async function handleAiGenerate(noteId: string) {
    setAiGeneratingId(noteId);
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`${API_URL}/api/school/lesson-notes/${noteId}/generate`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", ...csrfHeaders() },
        body: JSON.stringify({ force: false }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        // Refresh the note currently on screen with the AI version.
        setViewingNote((prev) =>
          prev && prev.lessonNote.id === noteId
            ? { ...prev, lessonNote: { ...prev.lessonNote, content: data.data.content } }
            : prev
        );
        setSuccess("AI lesson note ready.");
        loadData();
        setTimeout(() => setSuccess(""), 3000);
      } else if (data.code === "TEACHER_EDITED") {
        setError("This note was edited by a teacher. Regenerate only if you want to replace those edits.");
      } else {
        setError(data.error || "AI could not write this note right now. Please try again shortly.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setAiGeneratingId(null);
    }
  }

  async function handleCompleteWeek(schemeId: string, weekNumber: number) {
    setCompleting(`${schemeId}-${weekNumber}`);
    setError("");
    try {
      const res = await fetch(`${API_URL}/api/ai/complete-week`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", ...csrfHeaders() },
        body: JSON.stringify({ schemeId, weekNumber }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(`Week ${weekNumber} marked as done.`);
        confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
        loadData();
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(data.error || "Failed to mark complete.");
      }
    } catch {
      setError("Network error.");
    } finally {
      setCompleting(null);
    }
  }

  async function handleGenerateAssessment(schemeId: string, examType: "midterm" | "exam") {
    const key = `${schemeId}-${examType}`;
    setGeneratingAssessment(key);
    setError("");
    try {
      const res = await fetch(`${API_URL}/api/ai/generate-assessment`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", ...csrfHeaders() },
        body: JSON.stringify({ schemeId, examType }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(`${examType === "midterm" ? "Midterm" : "Exam"} questions ready.`);
        setViewingAssessment({
          schemeId,
          type: examType,
          html: data.data?.html || data.data?.content || "No content generated.",
          questions: data.data?.questions || [],
        });
        loadData();
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(data.error || "Assessment generation failed.");
      }
    } catch {
      setError("Network error.");
    } finally {
      setGeneratingAssessment(null);
    }
  }

  async function handleAddSubject() {
    if (!newSubjectName.trim()) return;
    setAddingSubject(true);
    try {
      const res = await fetch(`${API_URL}/api/subjects`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", ...csrfHeaders() },
        body: JSON.stringify({ name: newSubjectName.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(`Subject "${newSubjectName.trim()}" added.`);
        setNewSubjectName("");
        setShowAddSubject(false);
        loadData();
        setTimeout(() => setSuccess(""), 3000);
      } else setError(data.error);
    } catch {
      setError("Failed to add subject.");
    } finally {
      setAddingSubject(false);
    }
  }

  function parseWeeks(input: string): WeekItem[] {
    return input
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const match = line.match(/^(\d+)[.\s)]*(.*)/);
        if (!match) return null;
        return {
          week: parseInt(match[1], 10),
          topic: match[2].trim() || `Week ${match[1]}`,
          isCompleted: false,
        };
      })
      .filter(Boolean) as WeekItem[];
  }

  async function handleCreateScheme() {
    const weeks = parseWeeks(createForm.weeksInput);
    if (!weeks.length || !createForm.subjectId || !createForm.classId || !createForm.title.trim()) {
      setError("Please fill in class, subject, title and weeks.");
      return;
    }
    setCreating(true);
    try {
      const res = await fetch(`${API_URL}/api/ai/schemes`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", ...csrfHeaders() },
        body: JSON.stringify({
          subjectId: createForm.subjectId,
          classId: createForm.classId,
          title: createForm.title.trim(),
          session: createForm.session,
          term: createForm.term,
          weeks,
          periodsPerWeek: 2,
          minutesPerPeriod: 40,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess("Scheme of work created.");
        setShowCreate(false);
        loadData();
        setTimeout(() => setSuccess(""), 3000);
      } else setError(data.error);
    } catch {
      setError("Failed to create scheme.");
    } finally {
      setCreating(false);
    }
  }

  const step = !selectedClass ? 1 : !selectedSubject ? 2 : 3;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-semibold text-[var(--text)] font-display">Lesson Notes</h1>
          <p className="text-sm text-[var(--text-muted)] font-sans mt-0.5">
            Pick a class, then a subject, then the week you are teaching
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddSubject(true)}
            className="btn btn-secondary inline-flex items-center gap-1.5 px-3 py-2 text-sm font-sans font-medium"
          >
            <Plus className="w-4 h-4" /> Add Subject
          </button>
          <button
            onClick={() => setShowCreate(true)}
            className="btn btn-primary inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium"
          >
            <BookMarked className="w-4 h-4" /> New Scheme
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl flex items-start gap-2 text-sm text-red-700">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />{error}
        </div>
      )}
      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-100 rounded-xl flex items-start gap-2 text-sm text-green-700">
          <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />{success}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
        </div>
      ) : (
        <>
          {/* Progress steps */}
          <div className="flex flex-wrap items-center gap-2 mb-6 text-xs font-sans">
            {[
              { n: 1, label: "Class", done: !!selectedClass },
              { n: 2, label: "Subject", done: !!selectedSubject },
              { n: 3, label: "Week", done: selectedWeek != null },
            ].map((s) => (
              <div
                key={s.n}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border ${
                  step === s.n
                    ? "border-brand-500 text-brand-700 bg-brand-500/10"
                    : s.done
                      ? "border-emerald-300 text-emerald-700 bg-emerald-500/10"
                      : "border-[var(--border)] text-[var(--text-muted)]"
                }`}
              >
                <span className="w-5 h-5 rounded-full bg-current/10 flex items-center justify-center font-semibold">
                  {s.done && step !== s.n ? <CheckCircle className="w-3 h-3" /> : s.n}
                </span>
                {s.label}
              </div>
            ))}
          </div>

          {/* Step 1: Class */}
          {step === 1 && (
            <section>
              <h2 className="text-lg font-semibold text-[var(--text)] font-sans mb-1">Select class</h2>
              <p className="text-sm text-[var(--text-muted)] mb-4 font-sans">Choose the class you are teaching today.</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {classOptions.map((name) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => { setSelectedClass(name); resetSubjectWeek(); }}
                    className="card p-4 text-left hover:border-brand-400 transition-colors"
                  >
                    <GraduationCap className="w-5 h-5 text-brand-600 mb-2" />
                    <p className="font-semibold text-[var(--text)] font-sans">{name}</p>
                    <p className="text-xs text-[var(--text-muted)] mt-1 font-sans">
                      {schemes.filter((s) => s.class.name === name).length} schemes
                    </p>
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* Step 2: Subject */}
          {step === 2 && (
            <section>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <button
                    type="button"
                    onClick={() => { setSelectedClass(""); resetSubjectWeek(); }}
                    className="inline-flex items-center gap-1 text-xs text-[var(--text-muted)] hover:text-[var(--text)] font-sans mb-1"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" /> Change class
                  </button>
                  <h2 className="text-lg font-semibold text-[var(--text)] font-sans">Select subject</h2>
                  <p className="text-sm text-[var(--text-muted)] font-sans">
                    Class <strong>{selectedClass}</strong>
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {availableSubjects.map((name) => {
                  const hasScheme = schemes.some(
                    (s) => s.class.name === selectedClass && s.subject.name === name
                  );
                  return (
                    <button
                      key={name}
                      type="button"
                      onClick={() => { setSelectedSubject(name); resetWeek(); }}
                      className="card p-4 text-left hover:border-brand-400 transition-colors"
                    >
                      <BookOpen className="w-5 h-5 text-brand-600 mb-2" />
                      <p className="font-semibold text-[var(--text)] font-sans text-sm">{name}</p>
                      <p className="text-xs text-[var(--text-muted)] mt-1 font-sans">
                        {hasScheme ? "Scheme ready" : "No scheme yet"}
                      </p>
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {/* Step 3: Week */}
          {step === 3 && activeScheme && (
            <section>
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
                <div>
                  <button
                    type="button"
                    onClick={() => { setSelectedSubject(""); resetWeek(); }}
                    className="inline-flex items-center gap-1 text-xs text-[var(--text-muted)] hover:text-[var(--text)] font-sans mb-1"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" /> Change subject
                  </button>
                  <h2 className="text-lg font-semibold text-[var(--text)] font-sans">Select week</h2>
                  <p className="text-sm text-[var(--text-muted)] font-sans">
                    {selectedClass} · {selectedSubject} · {activeScheme.session} Term {activeScheme.term}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleGenerateAssessment(activeScheme.id, "midterm")}
                    disabled={generatingAssessment === `${activeScheme.id}-midterm`}
                    className="btn btn-secondary inline-flex items-center gap-1.5 px-3 py-2 text-xs border border-amber-500/20 text-amber-700 bg-amber-500/10"
                  >
                    {generatingAssessment === `${activeScheme.id}-midterm` ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5" />
                    )}
                    AI Midterm
                  </button>
                  <button
                    onClick={() => handleGenerateAssessment(activeScheme.id, "exam")}
                    disabled={generatingAssessment === `${activeScheme.id}-exam`}
                    className="btn btn-secondary inline-flex items-center gap-1.5 px-3 py-2 text-xs border border-purple-500/20 text-purple-700 bg-purple-500/10"
                  >
                    {generatingAssessment === `${activeScheme.id}-exam` ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5" />
                    )}
                    AI Exam
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-6">
                {activeScheme.weeks.map((week) => {
                  const note = activeScheme.lessonNotes.find((n) => n.weekNumber === week.week);
                  const isMidterm = week.week === MIDTERM_WEEK;
                  const isSelected = selectedWeek === week.week;
                  return (
                    <button
                      key={week.week}
                      type="button"
                      onClick={() => setSelectedWeek(week.week)}
                      className={`card p-4 text-left transition-colors ${
                        isSelected
                          ? "border-brand-500 bg-brand-500/5"
                          : isMidterm
                            ? "border-amber-300 bg-amber-500/5"
                            : "hover:border-brand-400"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-[var(--text-muted)] font-sans">Week {week.week}</span>
                        {isMidterm && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                            MIDTERM
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-medium text-[var(--text)] font-sans line-clamp-2 min-h-[2.5rem]">
                        {week.topic}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        {note ? (
                          <span className="inline-flex items-center gap-1 text-[11px] text-blue-600 font-sans">
                            <FileText className="w-3 h-3" /> Note ready
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] text-[var(--text-muted)] font-sans">
                            <Sparkles className="w-3 h-3" /> Generate note
                          </span>
                        )}
                        {week.isCompleted && (
                          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 font-sans">
                            <CheckCircle className="w-3 h-3" /> Done
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Week detail panel */}
              {selectedWeek != null && activeWeek && (
                <div className="card overflow-hidden">
                  <div className="px-5 py-4 bg-[var(--surface-2)] border-b border-[var(--border)] flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-xs text-[var(--text-muted)] font-sans">
                        Week {activeWeek.week} of {activeScheme.subject.name} · {activeScheme.class.name}
                      </p>
                      <h3 className="font-semibold text-[var(--text)] font-sans">{activeWeek.topic}</h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {activeNote ? (
                        <>
                          <button
                            onClick={() => setViewingNote({ schemeId: activeScheme.id, lessonNote: activeNote })}
                            className="btn btn-primary inline-flex items-center gap-1.5 px-3 py-2 text-xs"
                          >
                            <FileText className="w-3.5 h-3.5" /> View lesson note
                          </button>
                          {!activeWeek.isCompleted && (
                            <button
                              onClick={() => handleCompleteWeek(activeScheme.id, activeWeek.week)}
                              disabled={completing === `${activeScheme.id}-${activeWeek.week}`}
                              className="btn btn-secondary inline-flex items-center gap-1.5 px-3 py-2 text-xs"
                            >
                              {completing === `${activeScheme.id}-${activeWeek.week}` ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <ClipboardCheck className="w-3.5 h-3.5" />
                              )}
                              Mark as done
                            </button>
                          )}
                        </>
                      ) : (
                        <button
                          onClick={() => handleGenerate(activeScheme.id, activeWeek.week)}
                          disabled={generating === `${activeScheme.id}-${activeWeek.week}`}
                          className="btn btn-primary inline-flex items-center gap-1.5 px-3 py-2 text-xs"
                        >
                          {generating === `${activeScheme.id}-${activeWeek.week}` ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Sparkles className="w-3.5 h-3.5" />
                          )}
                          Generate lesson note
                        </button>
                      )}
                      {activeWeek.week === MIDTERM_WEEK && (
                        <button
                          onClick={() => handleGenerateAssessment(activeScheme.id, "midterm")}
                          disabled={generatingAssessment === `${activeScheme.id}-midterm`}
                          className="btn btn-secondary inline-flex items-center gap-1.5 px-3 py-2 text-xs border border-amber-500/20 text-amber-700 bg-amber-500/10"
                        >
                          <HelpCircle className="w-3.5 h-3.5" /> Midterm test
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="p-5">
                    {activeWeek.week === MIDTERM_WEEK && (
                      <div className="mb-4 p-4 rounded-xl border border-amber-200 bg-amber-50 text-sm text-amber-900 font-sans">
                        Week 5 is midterm week. Use <strong>Midterm test</strong> to generate or open the midterm paper for this subject.
                      </div>
                    )}
                    {activeNote ? (
                      <div
                        className="prose prose-sm max-w-none font-sans text-[var(--text)]"
                        dangerouslySetInnerHTML={{ __html: cleanContent(activeNote.content) }}
                      />
                    ) : (
                      <div className="text-center py-10 text-[var(--text-muted)] font-sans">
                        <Brain className="w-10 h-10 mx-auto mb-3 opacity-50" />
                        <p>No lesson note for this week yet.</p>
                        <p className="text-xs mt-1">Generate one with AI when you are ready to teach.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </section>
          )}

          {step === 3 && !activeScheme && (
            <div className="card p-8 text-center text-[var(--text-muted)] font-sans">
              <BookMarked className="w-10 h-10 mx-auto mb-3 opacity-50" />
              <p>No scheme of work for {selectedSubject} in {selectedClass} yet.</p>
              <button
                onClick={() => setShowCreate(true)}
                className="btn btn-primary mt-4 inline-flex items-center gap-2 px-4 py-2 text-sm"
              >
                <Plus className="w-4 h-4" /> Create scheme
              </button>
            </div>
          )}
        </>
      )}

      {/* View note modal */}
      {viewingNote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-[var(--card-bg)] rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
              <div>
                <p className="text-xs text-[var(--text-muted)] font-sans">Week {viewingNote.lessonNote.weekNumber}</p>
                <h3 className="font-semibold text-[var(--text)] font-sans">{viewingNote.lessonNote.topic}</h3>
              </div>
              <div className="flex items-center gap-2">
                {!isAiNote(viewingNote.lessonNote.content) && (
                  <button
                    onClick={() => handleAiGenerate(viewingNote.lessonNote.id)}
                    disabled={aiGeneratingId === viewingNote.lessonNote.id}
                    className="btn btn-secondary inline-flex items-center gap-1.5 px-3 py-1.5 text-xs disabled:opacity-60"
                    title="Write this note with AI for your school"
                  >
                    {aiGeneratingId === viewingNote.lessonNote.id ? (
                      <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Writing...</>
                    ) : (
                      <><Sparkles className="w-3.5 h-3.5" /> Generate with AI</>
                    )}
                  </button>
                )}
                <button className="btn btn-secondary inline-flex items-center gap-1.5 px-3 py-1.5 text-xs">
                  <Download className="w-3.5 h-3.5" /> Download PDF
                </button>
                <button
                  onClick={() => setViewingNote(null)}
                  className="p-2 rounded-lg hover:bg-[var(--surface-2)]"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="p-5 overflow-y-auto">
              <div
                className="prose prose-sm max-w-none font-sans text-[var(--text)]"
                dangerouslySetInnerHTML={{ __html: cleanContent(viewingNote.lessonNote.content) }}
              />
              {viewingNote.lessonNote.exercises?.length > 0 && (
                <div className="mt-6">
                  <h4 className="font-semibold text-[var(--text)] font-sans mb-2">Classroom exercises</h4>
                  <ol className="list-decimal pl-5 space-y-2 text-sm font-sans text-[var(--text)]">
                    {viewingNote.lessonNote.exercises.map((ex, i) => (
                      <li key={i}>
                        <div>{ex.question}</div>
                        {ex.answer && <div className="text-[var(--text-muted)] mt-0.5">{ex.answer}</div>}
                      </li>
                    ))}
                  </ol>
                </div>
              )}
              {viewingNote.lessonNote.assignments?.length > 0 && (
                <div className="mt-6">
                  <h4 className="font-semibold text-[var(--text)] font-sans mb-2">Homework</h4>
                  <ol className="list-decimal pl-5 space-y-2 text-sm font-sans text-[var(--text)]">
                    {viewingNote.lessonNote.assignments.map((as, i) => (
                      <li key={i}>{as.question}</li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Assessment modal */}
      {viewingAssessment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-[var(--card-bg)] rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
              <h3 className="font-semibold text-[var(--text)] font-sans">
                {viewingAssessment.type === "midterm" ? "Midterm" : "Exam"} questions
              </h3>
              <button
                onClick={() => setViewingAssessment(null)}
                className="p-2 rounded-lg hover:bg-[var(--surface-2)]"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 overflow-y-auto">
              {viewingAssessment.questions?.length > 0 ? (
                <ol className="list-decimal pl-5 space-y-3 text-sm font-sans text-[var(--text)]">
                  {viewingAssessment.questions.map((q: any, i: number) => (
                    <li key={i}>
                      <div className="font-medium">{q.question}</div>
                      {Array.isArray(q.options) && q.options.length > 0 && (
                        <ul className="list-none pl-0 mt-1 space-y-0.5 text-[var(--text-muted)]">
                          {q.options.map((opt: string, oi: number) => (
                            <li key={oi}>{String.fromCharCode(65 + oi)}. {opt}</li>
                          ))}
                        </ul>
                      )}
                      {q.answer && <div className="text-emerald-700 mt-1">Answer: {q.answer}</div>}
                    </li>
                  ))}
                </ol>
              ) : (
                <div
                  className="prose prose-sm max-w-none font-sans"
                  dangerouslySetInnerHTML={{ __html: cleanContent(viewingAssessment.html) }}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add subject modal */}
      {showAddSubject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-[var(--card-bg)] rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-[var(--text)] font-sans">Add subject</h3>
              <button onClick={() => setShowAddSubject(false)} className="p-2 rounded-lg hover:bg-[var(--surface-2)]" aria-label="Close">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form
              onSubmit={(e) => { e.preventDefault(); handleAddSubject(); }}
              className="space-y-3"
            >
              <input
                className="input-field w-full"
                placeholder="Subject name"
                value={newSubjectName}
                onChange={(e) => setNewSubjectName(e.target.value)}
                required
              />
              <button type="submit" disabled={addingSubject} className="btn btn-primary w-full justify-center">
                {addingSubject ? "Adding..." : "Add subject"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Create scheme modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-[var(--card-bg)] rounded-2xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-[var(--text)] font-sans">New scheme of work</h3>
              <button onClick={() => setShowCreate(false)} className="p-2 rounded-lg hover:bg-[var(--surface-2)]" aria-label="Close">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form
              onSubmit={(e) => { e.preventDefault(); handleCreateScheme(); }}
              className="space-y-3"
            >
              <select
                className="input-field w-full"
                value={createForm.classId}
                onChange={(e) => setCreateForm({ ...createForm, classId: e.target.value })}
                required
              >
                <option value="">Select class</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <select
                className="input-field w-full"
                value={createForm.subjectId}
                onChange={(e) => setCreateForm({ ...createForm, subjectId: e.target.value })}
                required
              >
                <option value="">Select subject</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
              <input
                className="input-field w-full"
                placeholder="Scheme title"
                value={createForm.title}
                onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                required
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  className="input-field w-full"
                  value={createForm.session}
                  onChange={(e) => setCreateForm({ ...createForm, session: e.target.value })}
                  required
                />
                <select
                  className="input-field w-full"
                  value={createForm.term}
                  onChange={(e) => setCreateForm({ ...createForm, term: Number(e.target.value) })}
                >
                  <option value={1}>Term 1</option>
                  <option value={2}>Term 2</option>
                  <option value={3}>Term 3</option>
                </select>
              </div>
              <textarea
                className="input-field w-full min-h-[140px]"
                value={createForm.weeksInput}
                onChange={(e) => setCreateForm({ ...createForm, weeksInput: e.target.value })}
                placeholder={"1. Topic one\n2. Topic two"}
              />
              <button type="submit" disabled={creating} className="btn btn-primary w-full justify-center">
                {creating ? "Creating..." : "Create scheme"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function cleanContent(text: string): string {
  return text
    .replace(/^#{1,6}\s*/gm, "")
    .replace(/\*\*/g, "")
    .replace(/\*/g, "")
    .replace(/__/g, "")
    .trim();
}
