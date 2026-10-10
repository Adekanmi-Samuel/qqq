"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth/CookieAuthProvider";
import { useApi } from "@/hooks/useApi";

interface Student {
  id: string;
  admissionNumber: string;
  fullName: string;
}

interface AttendanceStudent {
  id: string;
  admissionNumber: string;
  fullName: string;
  status?: "PRESENT" | "ABSENT" | "LATE";
}

export default function AttendancePage() {
  const { user, token } = useAuth();
  const { get, post } = useApi();
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedArm, setSelectedArm] = useState("");
  const [students, setStudents] = useState<AttendanceStudent[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const statuses: ("PRESENT" | "ABSENT" | "LATE")[] = ["PRESENT", "ABSENT", "LATE"];
  const statusColors: Record<string, string> = {
    PRESENT: "bg-green-500 text-white",
    ABSENT: "bg-red-500 text-white",
    LATE: "bg-amber-400 text-white",
  };

  const loadStudents = async () => {
    if (!selectedClass || !selectedArm) return;
    setLoading(true);
    setMessage("");

    // Fetch students in this class arm
    const res = await get<{ success: boolean; data: Student[] }>(
      `/api/students?classArmId=${selectedArm}`
    );

    if (res?.success && Array.isArray(res.data)) {
      setStudents(
        res.data.map((s) => ({ ...s, status: "PRESENT" as const }))
      );
    } else {
      // Fallback: try to get via class
      const fallback = await get<{ success: boolean; data: Student[] }>(
        `/api/students?classId=${selectedClass}`
      );
      if (fallback?.success && Array.isArray(fallback.data)) {
        setStudents(
          fallback.data.map((s) => ({ ...s, status: "PRESENT" as const }))
        );
      } else {
        setStudents([]);
        setMessage("No students found for this class/arm.");
      }
    }
    setLoading(false);
  };

  const toggleStatus = (id: string) => {
    setStudents((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s;
        const idx = statuses.indexOf(s.status || "PRESENT");
        const next = statuses[(idx + 1) % statuses.length];
        return { ...s, status: next };
      })
    );
  };

  const handleSave = async () => {
    if (!students.length) return;
    setSaving(true);
    setMessage("");

    const records = students
      .filter((s) => s.status)
      .map((s) => ({
        studentId: s.id,
        classArmId: selectedArm,
        status: s.status,
        markedById: user?.id,
        date,
      }));

    const res = await post<{ success: boolean }>("/api/attendance", { records });
    if (res?.success) {
      setMessage("✅ Attendance saved successfully!");
    } else {
      setMessage("❌ Failed to save attendance.");
    }
    setSaving(false);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Attendance</h1>
          <p className="text-sm text-gray-500 mt-1">
            Mark daily attendance per class arm
          </p>
        </div>
      </div>

      <div className="card mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div>
            <label htmlFor="date" className="label">Date</label>
            <input
              id="date"
              type="date"
              className="input-field"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="attendanceClass" className="label">Class</label>
            <select
              id="attendanceClass"
              className="input-field"
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
            >
              <option value="">Select class</option>
              {["JSS 1","JSS 2","JSS 3","SS 1","SS 2","SS 3"].map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="arm" className="label">Arm</label>
            <select
              id="arm"
              className="input-field"
              value={selectedArm}
              onChange={(e) => setSelectedArm(e.target.value)}
            >
              <option value="">Select arm</option>
              {["A","B","C","D"].map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button className="btn-primary" onClick={loadStudents} disabled={loading}>
              {loading ? "Loading..." : "Load Students"}
            </button>
          </div>
        </div>
      </div>

      {message && (
        <div className={`text-sm mb-4 p-3 rounded-lg ${message.includes("✅") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
          {message}
        </div>
      )}

      <div className="flex items-center gap-6 mb-4 text-sm">
        <span className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-green-500"></span> Present
        </span>
        <span className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-red-500"></span> Absent
        </span>
        <span className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-amber-400"></span> Late
        </span>
        <span className="text-gray-400 text-xs">Click a student&apos;s status to toggle</span>
      </div>

      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left px-4 py-3 font-medium text-gray-500">#</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Student Name</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Admission No.</th>
                <th className="text-center px-4 py-3 font-medium text-gray-500">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="text-center py-12 text-gray-400">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-schoolhub-500 border-t-transparent rounded-full animate-spin" />
                      <p>Loading students...</p>
                    </div>
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-12 text-gray-400">
                    <p className="text-lg mb-2">📋</p>
                    <p>Select a class and arm to load students</p>
                    <p className="text-xs mt-1">Attendance is locked after 24 hours</p>
                  </td>
                </tr>
              ) : (
                students.map((student, i) => (
                  <tr key={student.id} className="hover:bg-gray-50/50 cursor-pointer" onClick={() => toggleStatus(student.id)}>
                    <td className="text-gray-500">{i + 1}</td>
                    <td className="font-medium text-gray-900">{student.fullName}</td>
                    <td className="text-gray-500">{student.admissionNumber}</td>
                    <td className="text-center">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${statusColors[student.status || "PRESENT"]}`}>
                        {student.status || "PRESENT"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {students.length > 0 && (
        <div className="flex items-center justify-end gap-4 mt-6">
          <button className="btn-secondary">Cancel</button>
          <button className="btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Attendance"}
          </button>
        </div>
      )}
    </div>
  );
}
