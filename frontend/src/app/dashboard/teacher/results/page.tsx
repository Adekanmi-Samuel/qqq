"use client";

import { useAuth } from "@/lib/auth/CookieAuthProvider";
import { useEffect, useState } from "react";
import { FileText, Loader2, ChevronDown, ChevronRight, CheckCircle, AlertCircle } from "lucide-react";
import { API_URL } from "@/lib/config";


interface TermResult {
  id: string;
  studentName: string;
  subject: string;
  class: string;
  score: number;
  grade: string;
  term: number;
  session: string;
}

export default function TeacherResults() {
  // cookie auth: token always null
  const [results, setResults] = useState<TermResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<string[]>(["2025/2026"]);
  const [selectedSession, setSelectedSession] = useState("2025/2026");
  const [selectedTerm, setSelectedTerm] = useState(1);

  useEffect(() => {
  // cookie auth
    loadResults();
  }, [ selectedSession, selectedTerm]);

  async function loadResults() {
    try {
      const res = await fetch(
        `${API_URL}/api/results?session=${selectedSession}&term=${selectedTerm}`,
        { credentials: "include" }
      );
      const data = await res.json();
      if (data.success) setResults(data.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div className="text-center py-20"><Loader2 className="w-8 h-8 animate-spin mx-auto text-schoolhub-500" /></div>;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-semibold text-brand-ink font-fraunces">Results</h1>
          <p className="text-sm text-gray-500 font-sans mt-0.5">View and manage student results</p>
        </div>
        <div className="flex gap-2">
          <select value={selectedSession} onChange={(e) => setSelectedSession(e.target.value)}
            className="px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-schoolhub-400">
            {sessions.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={selectedTerm} onChange={(e) => setSelectedTerm(Number(e.target.value))}
            className="px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-schoolhub-400">
            <option value={1}>First Term</option>
            <option value={2}>Second Term</option>
            <option value={3}>Third Term</option>
          </select>
        </div>
      </div>

      {results.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="font-sans">No results found.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50/80">
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 font-sans">Student</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 font-sans">Subject</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 font-sans">Class</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-600 font-sans">Score</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-600 font-sans">Grade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {results.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3 font-medium text-gray-900 font-sans">{r.studentName}</td>
                    <td className="px-4 py-3 text-gray-600 font-sans">{r.subject}</td>
                    <td className="px-4 py-3 text-gray-600 font-sans">{r.class}</td>
                    <td className="px-4 py-3 text-center font-sans">{r.score}</td>
                    <td className="px-4 py-3 text-center font-sans">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        r.grade === "A" ? "bg-green-50 text-green-700" :
                        r.grade === "B" ? "bg-blue-50 text-blue-700" :
                        r.grade === "C" ? "bg-amber-50 text-amber-700" :
                        "bg-red-50 text-red-700"
                      }`}>{r.grade}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
