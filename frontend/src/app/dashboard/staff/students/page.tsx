"use client";

import { useAuth } from "@/lib/auth/CookieAuthProvider";
import { useEffect, useState } from "react";
import { Users, Loader2, Search, Mail, Phone } from "lucide-react";
import { API_URL } from "@/lib/config";


export default function StaffStudentsPage() {
  // cookie auth: token always null
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
  // cookie auth
    (async () => {
      try {
        const res = await fetch(`${API_URL}/api/students`, {
          credentials: "include",
        });
        const data = await res.json();
        if (data.success) setStudents(data.data || []);
      } catch { /* ignore */ }
      finally { setLoading(false); }
    })();
  }, []);

  const filtered = students.filter(s =>
    s.fullName?.toLowerCase().includes(search.toLowerCase()) ||
    s.admissionNumber?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return <div className="text-center py-16"><Loader2 className="w-8 h-8 animate-spin mx-auto text-schoolhub-500" /></div>;
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-fraunces font-semibold text-brand-ink">Student Records</h1>
        <p className="text-sm text-gray-500 font-sans">View student information and contact details</p>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or admission number..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-schoolhub-400 font-sans"
        />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-4 py-3 font-semibold text-gray-700 font-sans text-xs uppercase tracking-wider">Student</th>
              <th className="text-left px-3 py-3 font-semibold text-gray-700 font-sans text-xs uppercase tracking-wider">Admission No.</th>
              <th className="text-left px-3 py-3 font-semibold text-gray-700 font-sans text-xs uppercase tracking-wider">Class</th>
              <th className="text-left px-3 py-3 font-semibold text-gray-700 font-sans text-xs uppercase tracking-wider">Parent</th>
              <th className="text-center px-3 py-3 font-semibold text-gray-700 font-sans text-xs uppercase tracking-wider">Contact</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((s: any) => (
              <tr key={s.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-4 py-3 font-medium text-gray-900 font-sans">{s.fullName}</td>
                <td className="px-3 py-3 text-gray-600 font-sans text-xs">{s.admissionNumber || " "}</td>
                <td className="px-3 py-3 text-gray-600 font-sans text-xs">{s.arm ? `${s.arm.class?.name || ""} ${s.arm.name}` : s.class?.name || " "}</td>
                <td className="px-3 py-3 text-gray-600 font-sans text-xs">{s.parentName || " "}</td>
                <td className="px-3 py-3 text-center">
                  <div className="flex items-center justify-center gap-2">
                    {s.parentEmail && (
                      <a href={`mailto:${s.parentEmail}`} className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors" title={s.parentEmail}>
                        <Mail className="w-3.5 h-3.5" />
                      </a>
                    )}
                    {s.parentPhone && (
                      <a href={`tel:${s.parentPhone}`} className="p-1.5 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-colors" title={s.parentPhone}>
                        <Phone className="w-3.5 h-3.5" />
                      </a>
                    )}
                    {!s.parentEmail && !s.parentPhone && <span className="text-xs text-gray-400 font-sans"> </span>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
        {filtered.length === 0 && (
          <div className="text-center py-10 text-gray-400 font-sans">
            <Users className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">{search ? "No matching students." : "No students found."}</p>
          </div>
        )}
      </div>
    </div>
  );
}
