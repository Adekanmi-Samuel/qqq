"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth/CookieAuthProvider";
import Link from "next/link";
import { API_URL } from "@/lib/config";


interface Student {
  id: string;
  admissionNumber: string;
  fullName: string;
  gender: string | null;
  parentPhone: string | null;
  parentEmail: string | null;
  active: boolean;
  class: { id: string; name: string } | null;
  arm: { id: string; name: string } | null;
}

export default function StudentsPage() {
  // cookie auth: token always null
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
  // cookie auth
    setLoading(true);
    fetch(`${API_URL}/api/students`, {
      credentials: "include",
    })
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setStudents(res.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = students.filter(
    (s) =>
      s.fullName.toLowerCase().includes(search.toLowerCase()) ||
      s.admissionNumber.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Students</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage all students in your school
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/dashboard/students/add" className="btn-primary text-sm">
            + Add Student
          </Link>
          <button className="btn-secondary text-sm">Import CSV</button>
        </div>
      </div>

      <div className="card mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              className="input-field"
              placeholder="Search by name or admission number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left px-4 py-3 font-medium text-gray-500">Admission No.</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Full Name</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Class</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Arm</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Gender</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Parent Phone</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-400">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-schoolhub-500 border-t-transparent rounded-full animate-spin" />
                      <p>Loading students...</p>
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-400">
                    <p className="text-lg mb-2">👨‍🎓</p>
                    <p>{search ? "No students match your search" : "No students yet"}</p>
                    <p className="text-xs mt-1">
                      {search ? "Try a different search term" : "Add your first student to get started"}
                    </p>
                  </td>
                </tr>
              ) : (
                filtered.map((student) => (
                  <tr key={student.id}>
                    <td className="font-medium text-gray-900">{student.admissionNumber}</td>
                    <td className="text-gray-700">{student.fullName}</td>
                    <td className="text-gray-600">{student.class?.name || " "}</td>
                    <td className="text-gray-600">{student.arm?.name || " "}</td>
                    <td className="text-gray-600 capitalize">{student.gender || " "}</td>
                    <td className="text-gray-600">{student.parentPhone || " "}</td>
                    <td className="text-right">
                      <button
                        className="text-schoolhub-600 hover:text-schoolhub-800 text-xs font-medium"
                        onClick={() => alert(`Edit student: ${student.fullName}`)}
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center justify-between mt-4 text-sm text-gray-500">
        <p>Showing {filtered.length} of {students.length} students</p>
      </div>
    </div>
  );
}
