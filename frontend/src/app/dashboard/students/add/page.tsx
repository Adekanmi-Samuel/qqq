"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth/CookieAuthProvider";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { API_URL } from "@/lib/config";

interface ClassArmOption {
  classId: string;
  className: string;
  armId: string;
  armName: string;
}

export default function AddStudentPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [classes, setClasses] = useState<any[]>([]);
  const [armOptions, setArmOptions] = useState<ClassArmOption[]>([]);

  const [form, setForm] = useState({
    fullName: "",
    dob: "",
    gender: "",
    classId: "",
    armId: "",
    admissionNumber: "",
    parentName: "",
    parentPhone: "",
    parentEmail: "",
    house: "",
    bloodGroup: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
    previousSchool: "",
    stateOfOrigin: "",
    allergies: "",
    medicalNotes: "",
    notes: "",
  });

  useEffect(() => {
    loadClasses();
  }, []);

  async function loadClasses() {
    try {
      const res = await fetch(`${API_URL}/api/classes`, { credentials: "include" });
      const data = await res.json();
      if (!data.success) return;
      const list = data.data || [];
      setClasses(list);
      const options: ClassArmOption[] = [];
      list.forEach((cls: any) => {
        (cls.arms || []).forEach((arm: any) => {
          options.push({
            classId: cls.id,
            className: cls.name,
            armId: arm.id,
            armName: arm.name,
          });
        });
        if (!(cls.arms || []).length) {
          options.push({
            classId: cls.id,
            className: cls.name,
            armId: "",
            armName: "No arm",
          });
        }
      });
      setArmOptions(options);
    } catch {
      // classes optional for form submit fallback
    }
  }

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullName.trim()) {
      setMessage("Full name is required.");
      return;
    }
    if (!form.armId && !form.classId) {
      setMessage("Select a class and arm for this student.");
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      const res = await fetch(`${API_URL}/api/students`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          schoolId: user?.school?.id || "",
          admissionNumber: form.admissionNumber.trim() || `STU-${Date.now().toString(36).toUpperCase()}`,
          fullName: form.fullName.trim(),
          dob: form.dob || undefined,
          gender: form.gender || undefined,
          classId: form.classId || undefined,
          armId: form.armId || undefined,
          parentName: form.parentName || undefined,
          parentPhone: form.parentPhone || undefined,
          parentEmail: form.parentEmail || undefined,
          house: form.house || undefined,
          bloodGroup: form.bloodGroup || undefined,
          emergencyContactName: form.emergencyContactName || undefined,
          emergencyContactPhone: form.emergencyContactPhone || undefined,
          previousSchool: form.previousSchool || undefined,
          stateOfOrigin: form.stateOfOrigin || undefined,
          allergies: form.allergies || undefined,
          medicalNotes: form.medicalNotes || undefined,
          notes: form.notes || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        const selected = armOptions.find((a) => a.armId === form.armId);
        const label = selected ? `${selected.className} ${selected.armName}` : "school";
        setMessage(`Student "${form.fullName}" added to ${label}.`);
        setTimeout(() => router.push("/dashboard/admin/classes"), 1500);
      } else {
        setMessage(data.error || "Failed to add student.");
      }
    } catch {
      setMessage("Failed to add student.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link
          href="/dashboard/admin/classes"
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Add Student</h1>
          <p className="text-sm text-gray-500 mt-1">
            Add a student to a class arm such as JSS 1 A, JSS 1 B, or Primary 3 C
          </p>
        </div>
      </div>

      {message && (
        <div className={`text-sm mb-4 p-3 rounded-lg ${message.toLowerCase().includes("added") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
          {message}
        </div>
      )}

      <div className="card max-w-2xl">
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
              Personal Information
            </h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="fullName" className="label">Full name</label>
                <input
                  id="fullName"
                  type="text"
                  className="input-field"
                  placeholder="Student's full name"
                  value={form.fullName}
                  onChange={(e) => handleChange("fullName", e.target.value)}
                  required
                  autoComplete="name"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="admissionNumber" className="label">Admission number</label>
                  <input
                    id="admissionNumber"
                    type="text"
                    className="input-field"
                    placeholder="Optional auto generated"
                    value={form.admissionNumber}
                    onChange={(e) => handleChange("admissionNumber", e.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="dob" className="label">Date of birth</label>
                  <input
                    id="dob"
                    type="date"
                    className="input-field"
                    value={form.dob}
                    onChange={(e) => handleChange("dob", e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label htmlFor="gender" className="label">Gender</label>
                <select
                  id="gender"
                  className="input-field"
                  value={form.gender}
                  onChange={(e) => handleChange("gender", e.target.value)}
                >
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
              Class and Arm
            </h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="armId" className="label">Class arm</label>
                <select
                  id="armId"
                  className="input-field"
                  value={form.armId}
                  onChange={(e) => {
                    const opt = armOptions.find((a) => a.armId === e.target.value);
                    setForm((prev) => ({
                      ...prev,
                      armId: e.target.value,
                      classId: opt?.classId || prev.classId,
                    }));
                  }}
                  required
                >
                  <option value="">Select class arm</option>
                  {armOptions.map((opt) => (
                    <option key={opt.armId || opt.classId} value={opt.armId}>
                      {opt.className} {opt.armName}
                    </option>
                  ))}
                </select>
                {armOptions.length === 0 && (
                  <p className="text-xs text-amber-600 mt-1">
                    No classes found yet. Create classes and arms first from Academics.
                  </p>
                )}
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
              Parent / Guardian Information
            </h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="parentName" className="label">Parent/guardian name</label>
                <input
                  id="parentName"
                  type="text"
                  className="input-field"
                  placeholder="Parent or guardian full name"
                  value={form.parentName}
                  onChange={(e) => handleChange("parentName", e.target.value)}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="parentPhone" className="label">Phone number</label>
                  <input
                    id="parentPhone"
                    type="tel"
                    className="input-field"
                    placeholder="080 1234 5678"
                    value={form.parentPhone}
                    onChange={(e) => handleChange("parentPhone", e.target.value)}
                    autoComplete="tel"
                  />
                </div>
                <div>
                  <label htmlFor="parentEmail" className="label">Email <span className="text-gray-400">(optional)</span></label>
                  <input
                    id="parentEmail"
                    type="email"
                    className="input-field"
                    placeholder="parent@email.com"
                    value={form.parentEmail}
                    onChange={(e) => handleChange("parentEmail", e.target.value)}
                    autoComplete="email"
                  />
                </div>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
              Profile Details
            </h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="house" className="label">School house</label>
                  <input
                    id="house"
                    type="text"
                    className="input-field"
                    placeholder="e.g. Blue"
                    value={form.house}
                    onChange={(e) => handleChange("house", e.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="bloodGroup" className="label">Blood group</label>
                  <input
                    id="bloodGroup"
                    type="text"
                    className="input-field"
                    placeholder="e.g. O+"
                    value={form.bloodGroup}
                    onChange={(e) => handleChange("bloodGroup", e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="previousSchool" className="label">Previous school</label>
                  <input
                    id="previousSchool"
                    type="text"
                    className="input-field"
                    placeholder="Optional"
                    value={form.previousSchool}
                    onChange={(e) => handleChange("previousSchool", e.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="stateOfOrigin" className="label">State of origin</label>
                  <input
                    id="stateOfOrigin"
                    type="text"
                    className="input-field"
                    placeholder="e.g. Lagos"
                    value={form.stateOfOrigin}
                    onChange={(e) => handleChange("stateOfOrigin", e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="emergencyContactName" className="label">Emergency contact name</label>
                  <input
                    id="emergencyContactName"
                    type="text"
                    className="input-field"
                    placeholder="Optional"
                    value={form.emergencyContactName}
                    onChange={(e) => handleChange("emergencyContactName", e.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="emergencyContactPhone" className="label">Emergency contact phone</label>
                  <input
                    id="emergencyContactPhone"
                    type="tel"
                    className="input-field"
                    placeholder="Optional"
                    value={form.emergencyContactPhone}
                    onChange={(e) => handleChange("emergencyContactPhone", e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label htmlFor="allergies" className="label">Allergies</label>
                <input
                  id="allergies"
                  type="text"
                  className="input-field"
                  placeholder="Optional medical allergies"
                  value={form.allergies}
                  onChange={(e) => handleChange("allergies", e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="medicalNotes" className="label">Medical notes</label>
                <textarea
                  id="medicalNotes"
                  className="input-field"
                  rows={3}
                  placeholder="Optional health notes the school should know"
                  value={form.medicalNotes}
                  onChange={(e) => handleChange("medicalNotes", e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="notes" className="label">Admin notes</label>
                <textarea
                  id="notes"
                  className="input-field"
                  rows={2}
                  placeholder="Optional internal notes"
                  value={form.notes}
                  onChange={(e) => handleChange("notes", e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 pt-4 border-t border-gray-100">
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? "Saving..." : "Save Student"}
            </button>
            <Link href="/dashboard/admin/classes" className="btn-ghost">Cancel</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
