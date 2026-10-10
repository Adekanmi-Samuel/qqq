"use client";

import { useState, useEffect } from "react";
import {
  Monitor, Plus, Trash2, BookOpen, Users, Clock,
  AlertCircle, Check, X, Loader2, ChevronDown, Eye
} from "lucide-react";
import { API_URL } from "@/lib/config";


interface ClassArm {
  id: string; name: string; class: { id: string; name: string };
}

interface SubjectInfo {
  subjectId: string; subjectName: string; shortCode: string;
  teacherId: string; teacherName: string;
}

interface Exam {
  id: string; title: string; instructions: string | null;
  duration: number; session: string; term: number; totalMarks: number;
  active: boolean;
  subject: { id: string; name: string; shortCode: string };
  arm: { id: string; name: string; class: { name: string } };
  _count: { questions: number; attempts: number };
}

export default function AdminExamsPage() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [classArms, setClassArms] = useState<ClassArm[]>([]);
  const [subjects, setSubjects] = useState<SubjectInfo[]>([]);
  const [sessions, setSessions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Create form
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [instructions, setInstructions] = useState("");
  const [duration, setDuration] = useState(30);
  const [classArmId, setClassArmId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [session, setSession] = useState("");
  const [term, setTerm] = useState("1");
  const [saving, setSaving] = useState(false);

  // Question modal
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [examQuestions, setExamQuestions] = useState<any[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);

  const token = "";

  const fetchExams = async () => {
    try {
      const res = await fetch(`${API_URL}/api/exams`, {
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) setExams(data.data);
    } catch { setError("Failed to load exams."); }
  };

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      await Promise.all([
        fetch(`${API_URL}/api/timetable/class-arms`, {
          credentials: "include",
        }).then(r => r.json()).then(d => { if (d.success) setClassArms(d.data); }),
        fetch(`${API_URL}/api/results/sessions`, {
          credentials: "include",
        }).then(r => r.json()).then(d => { if (d.success) setSessions(d.data); }),
        fetchExams(),
      ]);
      setLoading(false);
    };
    loadAll();
  }, []);

  useEffect(() => {
    if (!classArmId) return;
    fetch(`${API_URL}/api/results/subjects?classArmId=${classArmId}`, {
      credentials: "include",
    }).then(r => r.json()).then(d => { if (d.success) setSubjects(d.data); });
  }, [classArmId]);

  const createExam = async () => {
    setSaving(true); setError("");
    try {
      const res = await fetch(`${API_URL}/api/exams`, {
        method: "POST",
        credentials: "include", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, instructions, duration, classArmId, subjectId, session, term: parseInt(term) }),
      });
      const data = await res.json();
      if (data.success) {
        setShowForm(false);
        resetForm();
        await fetchExams();
      } else setError(data.error);
    } catch { setError("Failed to create exam."); }
    finally { setSaving(false); }
  };

  const resetForm = () => {
    setTitle(""); setInstructions(""); setDuration(30);
    setClassArmId(""); setSubjectId(""); setSession(""); setTerm("1");
  };

  const viewQuestions = async (exam: Exam) => {
    setSelectedExam(exam);
    setLoadingQuestions(true);
    try {
      const res = await fetch(`${API_URL}/api/exams/${exam.id}?includeAnswers=true`, {
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) setExamQuestions(data.data.questions);
    } catch { }
    finally { setLoadingQuestions(false); }
  };

  if (loading) return <div className="text-center py-16"><Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-500" /></div>;

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">CBT Exams</h1>
          <p className="text-sm text-gray-500 mt-1">Create and manage computer-based tests</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 flex items-center gap-2">
          <Plus className="w-4 h-4" /> {showForm ? "Cancel" : "New Exam"}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4 flex items-center gap-2 text-sm text-red-700">
          <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
          <button onClick={() => setError("")} className="ml-auto"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Create Form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6 space-y-4">
          <h2 className="font-semibold text-gray-800">Create New Exam</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Title</label>
              <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. First Term Maths Exam"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Class Arm</label>
              <select value={classArmId} onChange={e => setClassArmId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="">Select...</option>
                {classArms.map(a => <option key={a.id} value={a.id}>{a.class.name} - {a.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Subject</label>
              <select value={subjectId} onChange={e => setSubjectId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="">Select...</option>
                {subjects.map(s => <option key={s.subjectId} value={s.subjectId}>{s.subjectName}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Session</label>
              <select value={session} onChange={e => setSession(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="">Select...</option>
                {sessions.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Term</label>
              <select value={term} onChange={e => setTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="1">First Term</option>
                <option value="2">Second Term</option>
                <option value="3">Third Term</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Duration (minutes)</label>
              <input type="number" min={1} value={duration} onChange={e => setDuration(parseInt(e.target.value) || 30)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Instructions (optional)</label>
            <textarea value={instructions} onChange={e => setInstructions(e.target.value)} rows={2}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Instructions for students taking this exam..." />
          </div>
          <div className="flex justify-end">
            <button onClick={createExam} disabled={saving || !title || !classArmId || !subjectId || !session}
              className="px-6 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Create Exam
            </button>
          </div>
        </div>
      )}

      {/* Exams List */}
      {exams.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Monitor className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No exams yet. Create your first exam above.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {exams.map(exam => (
            <div key={exam.id} className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <Monitor className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">{exam.title}</h3>
                    <p className="text-xs text-gray-500">
                      {exam.arm.class.name} - {exam.arm.name} · {exam.subject.shortCode} · {exam.session} Term {exam.term}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right text-xs text-gray-500">
                    <p><BookOpen className="w-3 h-3 inline mr-1" />{exam._count.questions} Qs</p>
                    <p><Clock className="w-3 h-3 inline mr-1" />{exam.duration}min</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 text-xs rounded-full ${exam.active ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
                      {exam.active ? "Active" : "Inactive"}
                    </span>
                    <button onClick={() => viewQuestions(exam)}
                      className="p-1.5 rounded-lg hover:bg-gray-100 text-indigo-600">
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Questions Modal */}
      {selectedExam && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedExam(null)}>
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white rounded-t-2xl">
              <h2 className="font-semibold text-gray-800">{selectedExam.title}   Questions</h2>
              <button onClick={() => setSelectedExam(null)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5">
              {loadingQuestions ? (
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-indigo-500" />
              ) : examQuestions.length === 0 ? (
                <p className="text-center text-gray-400 py-8">No questions added yet.</p>
              ) : (
                <div className="space-y-4">
                  {examQuestions.map((q: any, i) => (
                    <div key={q.id} className="p-4 bg-gray-50 rounded-xl">
                      <p className="font-medium text-gray-800 text-sm mb-2">{i + 1}. {q.questionText}</p>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        {[
                          { label: "A", value: q.optionA, isCorrect: q.correctAnswer === "A" },
                          { label: "B", value: q.optionB, isCorrect: q.correctAnswer === "B" },
                          { label: "C", value: q.optionC, isCorrect: q.correctAnswer === "C" },
                          { label: "D", value: q.optionD, isCorrect: q.correctAnswer === "D" },
                        ].map(opt => (
                          <div key={opt.label} className={`px-3 py-2 rounded-lg border text-xs
                            ${opt.isCorrect ? "border-emerald-300 bg-emerald-50" : "border-gray-200 bg-white"}`}>
                            <span className="font-semibold">{opt.label}.</span> {opt.value}
                            {opt.isCorrect && <Check className="w-3 h-3 text-emerald-500 inline ml-1" />}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
