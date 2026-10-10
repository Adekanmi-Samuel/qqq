"use client";

import { useAuth } from "@/lib/auth/CookieAuthProvider";
import { useEffect, useState } from "react";
import { UserCog, Loader2, Search, Mail, Shield } from "lucide-react";
import { API_URL } from "@/lib/config";


export default function StaffRecordsPage() {
  // cookie auth: token always null
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
  // cookie auth
    (async () => {
      try {
        const res = await fetch(`${API_URL}/api/users`, {
          credentials: "include",
        });
        const data = await res.json();
        if (data.success) setStaff(data.data?.filter((u: any) => u.role !== "STUDENT" && u.role !== "PARENT") || []);
      } catch { /* ignore */ }
      finally { setLoading(false); }
    })();
  }, []);

  const filtered = staff.filter(s =>
    s.fullName?.toLowerCase().includes(search.toLowerCase()) ||
    s.email?.toLowerCase().includes(search.toLowerCase()) ||
    s.role?.toLowerCase().includes(search.toLowerCase())
  );

  const roleColors: Record<string, string> = {
    SCHOOL_ADMIN: "bg-purple-50 text-purple-700",
    PRINCIPAL: "bg-blue-50 text-blue-700",
    TEACHER: "bg-green-50 text-green-700",
    BURSAR: "bg-amber-50 text-amber-700",
  };

  const roleLabels: Record<string, string> = {
    SCHOOL_ADMIN: "Admin",
    PRINCIPAL: "Principal",
    TEACHER: "Teacher",
    BURSAR: "Bursar",
  };

  if (loading) {
    return <div className="text-center py-16"><Loader2 className="w-8 h-8 animate-spin mx-auto text-schoolhub-500" /></div>;
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-fraunces font-semibold text-brand-ink">Staff Records</h1>
        <p className="text-sm text-gray-500 font-sans">View all school staff and their contact details</p>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search staff..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-schoolhub-400 font-sans"
        />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-4 py-3 font-semibold text-gray-700 font-sans text-xs uppercase tracking-wider">Name</th>
              <th className="text-left px-3 py-3 font-semibold text-gray-700 font-sans text-xs uppercase tracking-wider">Email</th>
              <th className="text-center px-3 py-3 font-semibold text-gray-700 font-sans text-xs uppercase tracking-wider">Role</th>
              <th className="text-center px-3 py-3 font-semibold text-gray-700 font-sans text-xs uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((s: any) => (
              <tr key={s.id} className="hover:bg-gray-50/50">
                <td className="px-4 py-3 font-medium text-gray-900 font-sans">{s.fullName}</td>
                <td className="px-3 py-3">
                  <a href={`mailto:${s.email}`} className="flex items-center gap-1 text-gray-600 text-xs font-sans hover:text-schoolhub-600 transition-colors">
                    <Mail className="w-3 h-3" /> {s.email}
                  </a>
                </td>
                <td className="px-3 py-3 text-center">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium font-sans ${roleColors[s.role] || "bg-gray-50 text-gray-700"}`}>
                    <Shield className="w-3 h-3" /> {roleLabels[s.role] || s.role}
                  </span>
                </td>
                <td className="px-3 py-3 text-center">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium font-sans ${s.active ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                    {s.active ? "Active" : "Inactive"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
        {filtered.length === 0 && (
          <div className="text-center py-10 text-gray-400">
            <UserCog className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm font-sans">{search ? "No matching staff." : "No staff records found."}</p>
          </div>
        )}
      </div>
    </div>
  );
}
