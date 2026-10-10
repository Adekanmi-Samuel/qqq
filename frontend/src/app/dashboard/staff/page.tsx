"use client";

import { useAuth } from "@/lib/auth/CookieAuthProvider";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  DollarSign, Users, FileText, BarChart3,
  TrendingUp, Loader2,
} from "lucide-react";
import { API_URL } from "@/lib/config";

export default function StaffDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const token = null;
  // cookie auth
        const dashRes = await fetch(`${API_URL}/api/dashboard/staff`, {
          credentials: "include",
        });
        const dashData = await dashRes.json();

        if (dashData.success) {
          setData(dashData.data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return <div className="text-center py-16"><Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-500" /></div>;
  }

  const formatCurrency = (amount: number) => `₦${amount.toLocaleString()}`;

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-fraunces font-semibold text-brand-ink">Finance Desk</h1>
        <p className="text-sm text-gray-500 font-sans">Today's fee collections and records</p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider font-sans">Today Collections</p>
            <DollarSign className="w-5 h-5 text-schoolhub-500" />
          </div>
          <p className="text-2xl font-fraunces font-semibold text-brand-ink mb-1">
            {formatCurrency(data?.todayCollections || 0)}
          </p>
          <div className="flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-green-600" />
            <p className="text-xs text-gray-500 font-sans">{data?.todayTransactions || 0} transaction(s) today</p>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider font-sans">This Session Collected</p>
            <BarChart3 className="w-5 h-5 text-schoolhub-500" />
          </div>
          <p className="text-2xl font-fraunces font-semibold text-brand-ink mb-1">
            {formatCurrency(data?.totalFeesCollected || 0)}
          </p>
          <p className="text-xs text-gray-500 font-sans">Total fees collected</p>
        </div>
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider font-sans">This Session Expected</p>
            <DollarSign className="w-5 h-5 text-amber-500" />
          </div>
          <p className="text-2xl font-fraunces font-semibold text-brand-ink mb-1">
            {formatCurrency(data?.totalFeesExpected || 0)}
          </p>
          <p className="text-xs text-gray-500 font-sans">Total fees expected</p>
        </div>
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider font-sans">Collection Rate</p>
            <FileText className="w-5 h-5 text-emerald-500" />
          </div>
          <p className="text-2xl font-fraunces font-semibold text-brand-ink mb-1">
            {data?.feeCollectionRate || 0}%
          </p>
          <p className="text-xs text-gray-500 font-sans">Fee collection rate</p>
        </div>
      </div>

      {/* Recent Fee Records */}
      <div>
        <h2 className="text-lg font-fraunces font-semibold text-brand-ink mb-4">Recent Fee Records</h2>
        {data?.feeRecords?.length === 0 ? (
          <div className="card text-center py-8 text-gray-400">
            <DollarSign className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No fee records recorded yet.</p>
          </div>
        ) : (
          <div className="card divide-y divide-gray-100">
            {data?.feeRecords?.map((p: any, i: number) => (
              <div key={p.id || i} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                <div>
                  <p className="text-sm font-medium text-gray-800 font-sans">
                    {formatCurrency(p.amount)}   {p.description}
                  </p>
                  <p className="text-xs text-gray-500 font-sans">
                    {p.studentName} ({p.studentAdmission}) · {p.status}
                  </p>
                </div>
                <div className="text-right">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                    p.status === "PAID" ? "bg-emerald-100 text-emerald-700" :
                    p.status === "PARTIAL" ? "bg-amber-100 text-amber-700" :
                    p.status === "OVERDUE" ? "bg-red-100 text-red-700" :
                    "bg-gray-100 text-gray-700"
                  }`}>
                    {p.status}
                  </span>
                  <p className="text-xs text-gray-400 font-sans mt-0.5">
                    {new Date(p.date).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Links */}
      <div>
        <h2 className="text-lg font-fraunces font-semibold text-brand-ink mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link href="/dashboard/staff/fees"
            className="card flex flex-col items-center gap-3 py-6 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
            <span className="w-10 h-10 bg-schoolhub-50 text-schoolhub-600 rounded-xl flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </span>
            <p className="text-sm font-medium text-gray-900 font-sans">Fee Records</p>
          </Link>
          <Link href="/dashboard/staff/fees"
            className="card flex flex-col items-center gap-3 py-6 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
            <span className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
              <Users className="w-5 h-5" />
            </span>
            <p className="text-sm font-medium text-gray-900 font-sans">Debtors List</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
