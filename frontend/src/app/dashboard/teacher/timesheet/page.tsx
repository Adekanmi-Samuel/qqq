"use client";

import { useAuth } from "@/lib/auth/CookieAuthProvider";
import { useEffect, useState } from "react";
import {
  Clock, CheckCircle, AlertCircle, Loader2, Calendar, FileText,
  Send, ListTodo
} from "lucide-react";
import { API_URL } from "@/lib/config";


interface TimesheetRecord {
  id: string;
  weekNumber: number;
  periodsTaught: number;
  periodsScheduled: number;
  status: "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED";
  adminFeedback?: string;
  createdAt: string;
}

export default function TeacherTimesheet() {
  const { user } = useAuth();
  const [timesheets, setTimesheets] = useState<TimesheetRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  // Submit new timesheet
  const [showSubmit, setShowSubmit] = useState(false);
  const [weekNumber, setWeekNumber] = useState(1);
  const [periodsTaught, setPeriodsTaught] = useState(0);
  const [periodsScheduled, setPeriodsScheduled] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
  // cookie auth
    loadTimesheets();
  }, []);

  async function loadTimesheets() {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/timesheets/my`, {
        credentials: "include"
      });
      const data = await res.json();
      if (data.success) {
        setTimesheets(data.data || []);
      }
    } catch (e) {
      console.error(e);
      setError("Failed to load timesheets.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
  // cookie auth
    setSubmitting(true);
    setError("");
    
    try {
      const res = await fetch(`${API_URL}/api/timesheets`, {
        method: "POST",
        credentials: "include", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          weekNumber,
          periodsTaught,
          periodsScheduled,
        })
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(`Timesheet for Week ${weekNumber} submitted!`);
        setShowSubmit(false);
        setWeekNumber(prev => prev + 1);
        setPeriodsTaught(0);
        setPeriodsScheduled(0);
        loadTimesheets();
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(data.error || "Failed to submit timesheet.");
      }
    } catch (e) {
      setError("Network error.");
    } finally {
      setSubmitting(false);
    }
  }

  function getStatusBadge(status: string) {
    switch(status) {
      case "APPROVED": return <span className="px-2 py-1 bg-green-50 text-green-700 text-xs rounded-md border border-green-200">Approved</span>;
      case "REJECTED": return <span className="px-2 py-1 bg-red-50 text-red-700 text-xs rounded-md border border-red-200">Rejected</span>;
      case "SUBMITTED": return <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-md border border-blue-200">Pending Approval</span>;
      default: return <span className="px-2 py-1 bg-gray-50 text-gray-700 text-xs rounded-md border border-gray-200">Draft</span>;
    }
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-semibold text-brand-ink font-fraunces">My Timesheets</h1>
          <p className="text-sm text-gray-500 font-sans mt-0.5">Log periods taught and track attendance</p>
        </div>
        <button
          onClick={() => setShowSubmit(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-schoolhub-500 text-white text-sm font-medium hover:bg-schoolhub-600 transition-colors"
        >
          <Clock className="w-4 h-4" /> Submit Timesheet
        </button>
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
          <Loader2 className="w-8 h-8 animate-spin text-schoolhub-500" />
        </div>
      ) : timesheets.length === 0 ? (
        <div className="text-center py-20 text-[var(--muted-color)] bg-[var(--card-bg)] rounded-2xl border border-[var(--card-border)]">
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="font-sans">No timesheets submitted yet.</p>
          <p className="text-xs text-[var(--muted-color)] mt-1 font-sans">Submit your first timesheet to get started.</p>
        </div>
      ) : (
        <div className="bg-[var(--card-bg)] rounded-2xl border border-[var(--card-border)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm font-sans">
              <thead className="bg-[var(--surface-2)] border-b border-[var(--border)] text-[var(--text-muted)] font-medium">
                <tr>
                  <th className="px-5 py-4 font-medium">Week</th>
                  <th className="px-5 py-4 font-medium">Date Submitted</th>
                  <th className="px-5 py-4 font-medium text-center">Periods Taught</th>
                  <th className="px-5 py-4 font-medium text-center">Periods Scheduled</th>
                  <th className="px-5 py-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {timesheets.map((ts) => (
                  <tr key={ts.id} className="hover:bg-[var(--surface-2)]">
                    <td className="px-5 py-4 font-medium text-[var(--heading-color)]">
                      Week {ts.weekNumber}
                    </td>
                    <td className="px-5 py-4 text-[var(--text-muted)]">
                      {new Date(ts.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-50 text-blue-700 font-semibold">
                        {ts.periodsTaught}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-[var(--surface-2)] text-[var(--text)] font-semibold">
                        {ts.periodsScheduled}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      {getStatusBadge(ts.status)}
                      {ts.adminFeedback && (
                        <p className="text-xs text-gray-500 mt-1">
                          Note: {ts.adminFeedback}
                        </p>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showSubmit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-brand-ink/60" onClick={() => setShowSubmit(false)} />
          <div className="relative bg-[var(--card-bg)] rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold font-fraunces text-brand-ink">Submit Timesheet</h2>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-[var(--body-color)] mb-1 font-sans">Week Number</label>
                <input
                  type="number" min="1"
                  value={weekNumber}
                  onChange={(e) => setWeekNumber(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2.5 rounded-xl border border-[var(--border)] text-sm focus:outline-none focus:ring-2 focus:ring-schoolhub-400 font-sans bg-[var(--surface)] text-[var(--text)]"
                  required
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
                <div>
                  <label className="block text-sm font-medium text-[var(--body-color)] mb-1 font-sans">Periods Taught</label>
                  <input
                    type="number" min="0"
                    value={periodsTaught}
                    onChange={(e) => setPeriodsTaught(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2.5 rounded-xl border border-[var(--border)] text-sm focus:outline-none focus:ring-2 focus:ring-schoolhub-400 font-sans bg-[var(--surface)] text-[var(--text)]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--body-color)] mb-1 font-sans">Periods Scheduled</label>
                  <input
                    type="number" min="1"
                    value={periodsScheduled}
                    onChange={(e) => setPeriodsScheduled(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2.5 rounded-xl border border-[var(--border)] text-sm focus:outline-none focus:ring-2 focus:ring-schoolhub-400 font-sans bg-[var(--surface)] text-[var(--text)]"
                    required
                  />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowSubmit(false)}
                  className="flex-1 py-2.5 rounded-xl border border-[var(--border)] text-[var(--text)] text-sm font-medium hover:bg-[var(--surface-2)] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || periodsScheduled < 1}
                  className="flex-1 py-2.5 rounded-xl bg-schoolhub-500 text-white text-sm font-medium hover:bg-schoolhub-600 transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-2"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
