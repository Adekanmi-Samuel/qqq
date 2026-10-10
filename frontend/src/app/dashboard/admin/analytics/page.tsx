"use client";

import { useAuth } from "@/lib/auth/CookieAuthProvider";
import { useEffect, useState } from "react";
import {
  BarChart3, Users, DollarSign, GraduationCap, TrendingUp, TrendingDown,
  Loader2, Calendar, Clock, Award
} from "lucide-react";
import { API_URL } from "@/lib/config";


export default function AdminAnalyticsPage() {
  // cookie auth: token always null
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
  // cookie auth
    (async () => {
      try {
        const [adminRes, trackRes] = await Promise.all([
          fetch(`${API_URL}/api/dashboard/admin`, {
            credentials: "include",
          }),
          fetch(`${API_URL}/api/ai/curriculum-tracking`, {
            credentials: "include",
          }),
        ]);
        const [adminData, trackData] = await Promise.all([adminRes.json(), trackRes.json()]);
        setData({
          ...(adminData.success ? adminData.data : {}),
          curriculum: trackData.success ? trackData.data : null,
        });
      } catch { /* ignore */ }
      finally { setLoading(false); }
    })();
  }, []);

  if (loading) {
    return <div className="text-center py-16"><Loader2 className="w-8 h-8 animate-spin mx-auto text-schoolhub-500" /></div>;
  }

  if (!data) {
    return <div className="text-center py-16 text-gray-400"><p className="font-sans">Could not load analytics.</p></div>;
  }

  const summaryCards = [
    { label: "Total Students", value: data.totalStudents || 0, icon: <Users className="w-5 h-5" />, color: "bg-blue-50 text-blue-600", trend: "+" + (data.newStudentsThisTerm || 0) + " this term" },
    { label: "Total Staff", value: data.totalStaff || 0, icon: <GraduationCap className="w-5 h-5" />, color: "bg-purple-50 text-purple-600", trend: "Active" },
    { label: "Active Classes", value: data.activeClasses || 0, icon: <Award className="w-5 h-5" />, color: "bg-amber-50 text-amber-600", trend: "Class arms" },
    { label: "Fees Collected", value: `₦${(data.totalFeesCollected || 0).toLocaleString()}`, icon: <DollarSign className="w-5 h-5" />, color: "bg-green-50 text-green-600", trend: `${data.feeCollectionRate || 0}% rate` },
  ];

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-fraunces font-semibold text-brand-ink">Analytics Dashboard</h1>
        <p className="text-sm text-gray-500 font-sans">School-wide metrics and performance overview</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((card, i) => (
          <div key={i} className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${card.color}`}>
                {card.icon}
              </div>
            </div>
            <p className="text-2xl font-bold font-sans text-gray-900">{card.value}</p>
            <p className="text-xs text-gray-500 font-medium font-sans mt-1">{card.label}</p>
            <p className="text-[10px] text-gray-400 font-sans mt-0.5">{card.trend}</p>
          </div>
        ))}
      </div>

      {/* Analytics Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Fee Collection */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="w-5 h-5 text-schoolhub-500" />
            <h3 className="text-sm font-semibold text-gray-900 font-sans">Fee Collection</h3>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="relative h-32 w-32 mx-auto">
                <svg className="w-32 h-32 -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="40" fill="none" stroke="var(--border)" strokeWidth="12" />
                  <circle
                    cx="50" cy="50" r="40" fill="none"
                    stroke={data.feeCollectionRate >= 80 ? "#10b981" : data.feeCollectionRate >= 50 ? "#f59e0b" : "#ef4444"}
                    strokeWidth="12"
                    strokeDasharray={`${data.feeCollectionRate || 0} 100`}
                    strokeLinecap="round"
                    className="transition-all duration-1000"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xl font-bold font-sans text-gray-900">{data.feeCollectionRate || 0}%</span>
                </div>
              </div>
            </div>
            <div className="space-y-2 text-xs">
              <p className="flex justify-between gap-4 font-sans"><span className="text-gray-500">Expected:</span><span className="font-semibold">₦{(data.totalFeesExpected || 0).toLocaleString()}</span></p>
              <p className="flex justify-between gap-4 font-sans"><span className="text-gray-500">Collected:</span><span className="font-semibold text-green-600">₦{(data.totalFeesCollected || 0).toLocaleString()}</span></p>
              <p className="flex justify-between gap-4 font-sans"><span className="text-gray-500">Outstanding:</span><span className="font-semibold text-red-500">₦{Math.max(0, (data.totalFeesExpected || 0) - (data.totalFeesCollected || 0)).toLocaleString()}</span></p>
            </div>
          </div>
        </div>

        {/* Attendance Rate */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-schoolhub-500" />
            <h3 className="text-sm font-semibold text-gray-900 font-sans">Today&apos;s Attendance</h3>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="relative h-32 w-32 mx-auto">
                <svg className="w-32 h-32 -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="40" fill="none" stroke="var(--border)" strokeWidth="12" />
                  <circle
                    cx="50" cy="50" r="40" fill="none"
                    stroke={data.attendanceRate >= 80 ? "#10b981" : data.attendanceRate >= 50 ? "#f59e0b" : "#ef4444"}
                    strokeWidth="12"
                    strokeDasharray={`${data.attendanceRate || 0} 100`}
                    strokeLinecap="round"
                    className="transition-all duration-1000"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <span className="text-xl font-bold font-sans text-gray-900">{data.attendanceRate || 0}%</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="space-y-2 text-xs">
              <p className="flex items-center gap-2 font-sans"><TrendingUp className="w-3 h-3 text-green-500" /> <span className="text-gray-700">Present today</span></p>
            </div>
          </div>
        </div>

        {/* Class Breakdown */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-schoolhub-500" />
            <h3 className="text-sm font-semibold text-gray-900 font-sans">Class Breakdown</h3>
          </div>
          <div className="space-y-3">
            {(data.classBreakdown || []).map((c: any, i: number) => (
              <div key={i}>
                <div className="flex justify-between text-xs mb-1 font-sans">
                  <span className="text-gray-700 font-medium">{c.className}</span>
                  <span className="text-gray-500">{c.arms} arm{c.arms !== 1 ? "s" : ""}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className="h-2 rounded-full bg-schoolhub-500 transition-all duration-500"
                    style={{ width: `${Math.min(100, (c.arms / 3) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
            {(!data.classBreakdown || data.classBreakdown.length === 0) && (
              <p className="text-xs text-gray-400 text-center py-4 font-sans">No class data available.</p>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-schoolhub-500" />
            <h3 className="text-sm font-semibold text-gray-900 font-sans">Recent Activity</h3>
          </div>
          <div className="space-y-2">
            {(data.recentActivity || []).slice(0, 6).map((a: string, i: number) => (
              <div key={i} className="flex items-start gap-2 text-xs">
                <div className="w-1.5 h-1.5 rounded-full bg-schoolhub-500 mt-1.5 flex-shrink-0" />
                <p className="text-gray-600 font-sans">{a}</p>
              </div>
            ))}
            {(!data.recentActivity || data.recentActivity.length === 0 || (data.recentActivity.length === 1 && data.recentActivity[0] === "No recent activity.")) && (
              <p className="text-xs text-gray-400 text-center py-4 font-sans">No recent activity.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
