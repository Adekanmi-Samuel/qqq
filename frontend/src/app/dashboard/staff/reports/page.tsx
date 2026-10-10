"use client";

import { useAuth } from "@/lib/auth/CookieAuthProvider";
import { useEffect, useState } from "react";
import { BarChart3, Loader2, Users, DollarSign, GraduationCap, TrendingUp, TrendingDown } from "lucide-react";
import Link from "next/link";
import { API_URL } from "@/lib/config";


export default function StaffReportsPage() {
  // cookie auth: token always null
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
  // cookie auth
    (async () => {
      try {
        const res = await fetch(`${API_URL}/api/dashboard`, {
          credentials: "include",
        });
        const d = await res.json();
        if (d.success) setData(d.data);
      } catch { /* ignore */ }
      finally { setLoading(false); }
    })();
  }, []);

  if (loading) {
    return <div className="text-center py-16"><Loader2 className="w-8 h-8 animate-spin mx-auto text-schoolhub-500" /></div>;
  }

  const stats = [
    {
      label: "Total Students",
      value: data?.totalStudents || 0,
      icon: <Users className="w-5 h-5" />,
      color: "bg-blue-50 text-blue-600",
      link: "/dashboard/staff/students",
    },
    {
      label: "Total Staff",
      value: data?.totalStaff || 0,
      icon: <GraduationCap className="w-5 h-5" />,
      color: "bg-purple-50 text-purple-600",
      link: "/dashboard/staff/staff",
    },
    {
      label: "Fee Collection",
      value: `₦${(data?.totalCollected || 0).toLocaleString()}`,
      icon: <DollarSign className="w-5 h-5" />,
      color: "bg-green-50 text-green-600",
      link: "/dashboard/staff/fees",
    },
    {
      label: "Attendance Rate",
      value: `${data?.attendanceRate || 0}%`,
      icon: data?.attendanceRate >= 75 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />,
      color: (data?.attendanceRate || 0) >= 75 ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600",
      link: "/dashboard/attendance",
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-fraunces font-semibold text-brand-ink">Reports Dashboard</h1>
        <p className="text-sm text-gray-500 font-sans">Overview of school statistics and performance</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <Link key={i} href={s.link} className="card p-5 hover:shadow-md transition-shadow">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.color} mb-3`}>
              {s.icon}
            </div>
            <p className="text-xs text-gray-500 font-medium font-sans">{s.label}</p>
            <p className="text-xl font-bold mt-1 font-sans text-gray-900">{s.value}</p>
          </Link>
        ))}
      </div>

      {/* Quick links */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold text-gray-900 font-sans mb-3">Quick Reports</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Link href="/dashboard/admin/results" className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
            <FileText className="w-5 h-5 text-schoolhub-500" />
            <span className="text-sm font-medium text-gray-700 font-sans">Results & Grading</span>
          </Link>
          <Link href="/dashboard/admin/attendance" className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
            <BarChart3 className="w-5 h-5 text-schoolhub-500" />
            <span className="text-sm font-medium text-gray-700 font-sans">Attendance Reports</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

function FileText(props: any) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
  );
}
