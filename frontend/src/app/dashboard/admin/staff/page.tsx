"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth/CookieAuthProvider";
import {
  UserCog, Search, Loader2, AlertCircle, Shield, Users, Briefcase,
} from "lucide-react";
import { API_URL } from "@/lib/config";


interface StaffUser {
  id: string;
  fullName: string;
  email: string;
  role: string;
  active: boolean;
  createdAt: string;
}

const roleLabels: Record<string, string> = {
  TEACHER: "Teacher",
  BURSAR: "Bursar",
  PRINCIPAL: "Principal",
  SCHOOL_ADMIN: "School Admin",
};

const roleIcons: Record<string, any> = {
  TEACHER: Users,
  BURSAR: Briefcase,
  PRINCIPAL: Shield,
  SCHOOL_ADMIN: Shield,
};

export default function AdminStaffPage() {
  // cookie auth: token always null
  const [staff, setStaff] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
  // cookie auth
    loadStaff();
  }, []);

  async function loadStaff() {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/users`, {
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) setStaff(data.data);
    } catch {
      setError("Failed to load staff.");
    } finally {
      setLoading(false);
    }
  }

  const filtered = staff.filter(
    (s) =>
      s.fullName.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase()) ||
      s.role.toLowerCase().includes(search.toLowerCase())
  );
  const activeStaff = filtered.filter((s) => s.active);
  const inactiveStaff = filtered.filter((s) => !s.active);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-semibold text-brand-ink font-fraunces">Staff</h1>
          <p className="text-sm text-gray-500 font-sans mt-0.5">
            {activeStaff.length} active · {inactiveStaff.length} inactive
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl flex items-start gap-2 text-sm text-red-700">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          {error}
        </div>
      )}

      <div className="relative mb-4">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search staff by name, email, or role..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm
            focus:outline-none focus:ring-2 focus:ring-schoolhub-400 focus:border-transparent"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-schoolhub-500" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <UserCog className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="font-sans">No staff found</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map((s) => {
            const Icon = roleIcons[s.role] || UserCog;
            return (
              <div key={s.id} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-schoolhub-50 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-schoolhub-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 font-sans text-sm">{s.fullName}</p>
                  <p className="text-xs text-gray-500 font-sans">{s.email}</p>
                </div>
                <div className="text-right">
                  <span className="inline-block px-2.5 py-1 rounded-full text-xs font-medium bg-schoolhub-50 text-schoolhub-700">
                    {roleLabels[s.role] || s.role}
                  </span>
                  <p className="text-xs text-gray-400 mt-1 font-sans">
                    {s.active ? "Active" : "Inactive"} · {new Date(s.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
