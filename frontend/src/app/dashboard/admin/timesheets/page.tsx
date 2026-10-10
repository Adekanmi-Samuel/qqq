"use client";

import { useAuth } from "@/lib/auth/CookieAuthProvider";
import { useEffect, useState } from "react";
import {
  Clock, CheckCircle, AlertCircle, Loader2, FileText,
  CheckSquare, XSquare, Filter, Search
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
  teacher: {
    name: string;
    email: string;
  };
}

export default function AdminTimesheets() {
  // cookie auth: token always null
  const [timesheets, setTimesheets] = useState<TimesheetRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [updating, setUpdating] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [weekFilter, setWeekFilter] = useState("ALL");

  useEffect(() => {
  // cookie auth
    loadTimesheets();
  }, []);

  async function loadTimesheets() {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/timesheets/all`, {
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

  async function updateStatus(id: string, status: string, feedback?: string) {
  // cookie auth
    setUpdating(id);
    setError("");

    try {
      const res = await fetch(`${API_URL}/api/timesheets/${id}/status`, {
        method: "PUT",
        credentials: "include", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, adminFeedback: feedback })
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(`Timesheet ${status.toLowerCase()} successfully.`);
        loadTimesheets();
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(data.error || "Failed to update timesheet.");
      }
    } catch (e) {
      setError("Network error.");
    } finally {
      setUpdating(null);
    }
  }

  const filteredTimesheets = timesheets.filter(ts => {
    const matchesSearch = ts.teacher.name.toLowerCase().includes(search.toLowerCase()) || 
                          ts.teacher.email.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || ts.status === statusFilter;
    const matchesWeek = weekFilter === "ALL" || ts.weekNumber.toString() === weekFilter;
    return matchesSearch && matchesStatus && matchesWeek;
  });

  const uniqueWeeks = Array.from(new Set(timesheets.map(ts => ts.weekNumber))).sort((a, b) => b - a);

  function getStatusBadge(status: string) {
    switch(status) {
      case "APPROVED": return <span className="px-2 py-1 bg-green-50 text-green-700 text-xs rounded-md border border-green-200">Approved</span>;
      case "REJECTED": return <span className="px-2 py-1 bg-red-50 text-red-700 text-xs rounded-md border border-red-200">Rejected</span>;
      case "SUBMITTED": return <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-md border border-blue-200">Pending</span>;
      default: return <span className="px-2 py-1 bg-gray-50 text-gray-700 text-xs rounded-md border border-gray-200">Draft</span>;
    }
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-semibold text-brand-ink font-fraunces">Teacher Timesheets</h1>
          <p className="text-sm text-gray-500 font-sans mt-0.5">Review and approve teacher attendance logs</p>
        </div>
      </div>

      {/* Stats Summary */}
      {!loading && timesheets.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-sans">Pending</p>
              <h3 className="text-2xl font-semibold text-gray-900 font-sans">
                {timesheets.filter(ts => ts.status === "SUBMITTED").length}
              </h3>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-sans">Approved</p>
              <h3 className="text-2xl font-semibold text-gray-900 font-sans">
                {timesheets.filter(ts => ts.status === "APPROVED").length}
              </h3>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-sans">Rejected</p>
              <h3 className="text-2xl font-semibold text-gray-900 font-sans">
                {timesheets.filter(ts => ts.status === "REJECTED").length}
              </h3>
            </div>
          </div>
        </div>
      )}

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

      <div className="bg-white rounded-2xl border border-gray-100 overflow-x-auto">
        {/* Filters */}
        <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search teacher..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-schoolhub-400 font-sans"
            />
          </div>
          <div className="flex gap-3">
            <select
              value={weekFilter}
              onChange={(e) => setWeekFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-schoolhub-400 font-sans bg-white"
            >
              <option value="ALL">All Weeks</option>
              {uniqueWeeks.map(w => (
                <option key={w} value={w.toString()}>Week {w}</option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-schoolhub-400 font-sans bg-white"
            >
              <option value="ALL">All Status</option>
              <option value="SUBMITTED">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-schoolhub-500" />
          </div>
        ) : filteredTimesheets.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="font-sans">No timesheets found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm font-sans">
              <thead className="bg-white border-b border-gray-100 text-gray-600 font-medium">
                <tr>
                  <th className="px-5 py-4 font-medium">Teacher</th>
                  <th className="px-5 py-4 font-medium">Week</th>
                  <th className="px-5 py-4 font-medium text-center">Periods</th>
                  <th className="px-5 py-4 font-medium">Status</th>
                  <th className="px-5 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredTimesheets.map((ts) => (
                  <tr key={ts.id} className="hover:bg-gray-50/50">
                    <td className="px-5 py-4">
                      <p className="font-medium text-gray-900">{ts.teacher.name}</p>
                      <p className="text-xs text-gray-500">{ts.teacher.email}</p>
                    </td>
                    <td className="px-5 py-4 font-medium text-gray-900">
                      Week {ts.weekNumber}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span className="text-sm font-medium text-gray-900">
                        {ts.periodsTaught}
                      </span>
                      <span className="text-xs text-gray-500 mx-1">/</span>
                      <span className="text-xs text-gray-500">
                        {ts.periodsScheduled}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      {getStatusBadge(ts.status)}
                    </td>
                    <td className="px-5 py-4 text-right">
                      {ts.status === "SUBMITTED" ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => updateStatus(ts.id, "APPROVED")}
                            disabled={updating === ts.id}
                            className="p-1.5 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-colors disabled:opacity-50"
                            title="Approve"
                          >
                            {updating === ts.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckSquare className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => {
                              const reason = prompt("Enter rejection reason:");
                              if (reason !== null) updateStatus(ts.id, "REJECTED", reason);
                            }}
                            disabled={updating === ts.id}
                            className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors disabled:opacity-50"
                            title="Reject"
                          >
                            <XSquare className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">Processed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
