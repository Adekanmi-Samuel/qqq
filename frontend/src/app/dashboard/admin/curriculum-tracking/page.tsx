"use client";

import { useAuth } from "@/lib/auth/CookieAuthProvider";
import { useEffect, useState } from "react";
import {
  BarChart3, BookOpen, Loader2, CheckCircle, AlertTriangle,
  TrendingUp, Clock, Users, AlertCircle
} from "lucide-react";
import { API_URL } from "@/lib/config";


interface TrackingScheme {
  id: string;
  subject: string;
  className: string;
  title: string;
  session: string;
  term: number;
  totalWeeks: number;
  completedWeeks: number;
  progress: number;
  currentWeek: number;
  weeksBehind: number;
  status: "completed" | "in_progress";
  updatedAt: string;
}

interface TrackingStats {
  totalSchemes: number;
  completedSchemes: number;
  inProgress: number;
  averageProgress: number;
  behind: number;
}

export default function CurriculumTracking() {
  // cookie auth: token always null
  const [schemes, setSchemes] = useState<TrackingScheme[]>([]);
  const [stats, setStats] = useState<TrackingStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadData() {
    try {
      const res = await fetch(`${API_URL}/api/ai/curriculum-tracking`, {
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) {
        setSchemes(data.data.schemes || []);
        setStats(data.data.stats || null);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div className="text-center py-20"><Loader2 className="w-8 h-8 animate-spin mx-auto text-schoolhub-500" /></div>;

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-brand-ink font-fraunces">Curriculum Tracking</h1>
        <p className="text-sm text-gray-500 font-sans mt-0.5">
          Monitor teacher progress across all schemes of work
        </p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 font-sans">{stats.totalSchemes}</p>
                <p className="text-xs text-gray-500 font-sans">Total Schemes</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 font-sans">{stats.completedSchemes}</p>
                <p className="text-xs text-gray-500 font-sans">Completed</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 font-sans">{stats.averageProgress}%</p>
                <p className="text-xs text-gray-500 font-sans">Avg Progress</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 font-sans">{stats.behind}</p>
                <p className="text-xs text-gray-500 font-sans">Behind Schedule</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Scheme Cards */}
      {schemes.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="font-sans">No curriculum data yet.</p>
          <p className="text-xs text-gray-400 mt-1 font-sans">Schemes of work will appear here once teachers create them.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {schemes.map((scheme) => (
            <div key={scheme.id} className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div>
                  <h3 className="font-semibold text-gray-900 font-sans text-sm">{scheme.subject}</h3>
                  <p className="text-xs text-gray-500 font-sans">
                    {scheme.className} · {scheme.title} · {scheme.session} Term {scheme.term}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {scheme.status === "completed" ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-50 text-green-700 text-xs font-medium font-sans">
                      <CheckCircle className="w-3 h-3" /> Completed
                    </span>
                  ) : scheme.weeksBehind > 0 ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-50 text-red-700 text-xs font-medium font-sans">
                      <AlertTriangle className="w-3 h-3" /> {scheme.weeksBehind} week(s) behind
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium font-sans">
                      On track
                    </span>
                  )}
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-2">
                <div className="flex items-center justify-between text-xs text-gray-500 font-sans mb-1.5">
                  <span>{scheme.completedWeeks}/{scheme.totalWeeks} weeks completed</span>
                  <span>{scheme.progress}%</span>
                </div>
                <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      scheme.progress === 100 ? "bg-green-500" : scheme.progress > 50 ? "bg-schoolhub-500" : "bg-amber-500"
                    }`}
                    style={{ width: `${scheme.progress}%` }}
                  />
                </div>
              </div>

              {scheme.status !== "completed" && (
                <div className="flex items-center gap-2 text-xs text-gray-400 font-sans mt-2">
                  <Clock className="w-3 h-3" />
                  Currently on Week {scheme.currentWeek}
                  {scheme.weeksBehind > 0 && (
                    <span className="text-red-500">· {scheme.weeksBehind} week(s) behind target</span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
