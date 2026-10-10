"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth/CookieAuthProvider";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  GraduationCap, Plus, X, Loader2, AlertCircle, CheckCircle,
  Users, Trash2, Pencil, ChevronDown, ChevronRight, UserPlus, BookOpen,
} from "lucide-react";
import { API_URL } from "@/lib/config";

interface StudentLite {
  id: string;
  fullName: string;
  admissionNumber?: string;
  gender?: string;
  active?: boolean;
}

interface ClassArm {
  id: string;
  name: string;
  classTeacherId: string | null;
  classTeacher?: { fullName: string } | null;
  students?: StudentLite[];
  _count?: { students: number };
}

interface ClassGroup {
  id: string;
  name: string;
  arms: ClassArm[];
  _count: { students: number };
}

const ARM_PRESETS = ["A", "B", "C", "D", "E"];

/** Nigerian school class name presets in the format the product uses. */
const CLASS_PRESETS = [
  "Creche", "KG 1", "KG 2", "KG 3",
  "Nursery 1", "Nursery 2", "Nursery 3",
  "Primary 1", "Primary 2", "Primary 3", "Primary 4", "Primary 5", "Primary 6",
  "JSS 1", "JSS 2", "JSS 3",
  "SS 1", "SS 2", "SS 3",
];

/** Normalize free text into the product's class name format. */
function normalizeClassName(raw: string): string {
  const s = raw.trim().replace(/\s+/g, " ");
  if (!s) return "";
  const jss = s.match(/^(?:jss|junior secondary|junior)\s*(\d{1,2})$/i);
  if (jss) return `JSS ${jss[1]}`;
  const ss = s.match(/^(?:ss|senior secondary|senior)\s*(\d{1,2})$/i);
  if (ss) return `SS ${ss[1]}`;
  const prim = s.match(/^(?:primary|prim|pri)\s*(\d{1,2})$/i);
  if (prim) return `Primary ${prim[1]}`;
  const kg = s.match(/^(?:kg|kindergarten|nursery)\s*(\d{1,2})$/i);
  if (kg) {
    const n = kg[1];
    return s.toLowerCase().startsWith("nursery") ? `Nursery ${n}` : `KG ${n}`;
  }
  if (/^creche$/i.test(s)) return "Creche";
  // Title case fallback for custom names
  return s.replace(/\b([a-z])/gi, (m) => m.toUpperCase());
}

function normalizeArm(raw: string): string {
  return raw.trim().toUpperCase().slice(0, 12);
}

export default function AdminAcademicsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [classes, setClasses] = useState<ClassGroup[]>([]);
  const [teachers, setTeachers] = useState<{ id: string; fullName: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);

  // Expand/collapse
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  // Create class
  const [showAddClass, setShowAddClass] = useState(false);
  const [newClassName, setNewClassName] = useState("");
  const [newClassArms, setNewClassArms] = useState<string[]>(["A"]);
  const [customArm, setCustomArm] = useState("");

  // Add arm
  const [showAddArm, setShowAddArm] = useState<string | null>(null);
  const [newArmName, setNewArmName] = useState("");

  // Rename class / arm
  const [editingClassId, setEditingClassId] = useState<string | null>(null);
  const [editClassName, setEditClassName] = useState("");
  const [editingArmId, setEditingArmId] = useState<string | null>(null);
  const [editArmName, setEditArmName] = useState("");

  // Student roster
  const [rosterArmId, setRosterArmId] = useState<string | null>(null);
  const [rosterStudentName, setRosterStudentName] = useState("");
  const [rosterStudentNo, setRosterStudentNo] = useState("");
  const [addingStudent, setAddingStudent] = useState(false);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [clsRes, tchRes] = await Promise.all([
        fetch(`${API_URL}/api/classes`, { credentials: "include" }),
        fetch(`${API_URL}/api/users?role=TEACHER`, { credentials: "include" }),
      ]);
      const clsData = await clsRes.json();
      const tchData = await tchRes.json();
      if (clsData.success) {
        const list = clsData.data || [];
        setClasses(list);
        const initial: Record<string, boolean> = {};
        list.forEach((c: ClassGroup) => { initial[c.id] = true; });
        setExpanded(initial);
      }
      if (tchData.success) setTeachers(tchData.data);
    } catch {
      setError("Failed to load classes.");
    } finally {
      setLoading(false);
    }
  }

  function flash(msg: string, isError = false) {
    if (isError) setError(msg);
    else {
      setSuccess(msg);
      setError("");
      setTimeout(() => setSuccess(""), 3500);
    }
  }

  function parseArms(input: string): string[] {
    return input
      .split(/[,\n]/)
      .map((a) => normalizeArm(a))
      .filter(Boolean);
  }

  function toggleArm(arm: string) {
    const a = normalizeArm(arm);
    if (!a) return;
    setNewClassArms((prev) =>
      prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]
    );
  }

  function classDisplayName(c: ClassGroup): string {
    return c.name || "Untitled class";
  }

  async function handleAddClass(e: React.FormEvent) {
    e.preventDefault();
    const name = normalizeClassName(newClassName);
    if (!name) {
      flash("Class name is required.", true);
      return;
    }
    const arms = [...newClassArms.map(normalizeArm).filter(Boolean)];
    if (customArm.trim()) {
      const c = normalizeArm(customArm);
      if (c && !arms.includes(c)) arms.push(c);
    }
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/classes`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, arms }),
      });
      const data = await res.json();
      if (data.success) {
        flash(
          arms.length
            ? `${name} created with arms ${arms.join(", ")}.`
            : `${name} created. You can add arms next.`
        );
        setNewClassName("");
        setNewClassArms(["A"]);
        setCustomArm("");
        setShowAddClass(false);
        loadData();
      } else {
        flash(data.error?.message || data.error || "Failed to create class.", true);
      }
    } catch {
      flash("Failed to create class.", true);
    } finally {
      setSaving(false);
    }
  }

  async function handleRenameClass(classId: string) {
    const name = normalizeClassName(editClassName);
    if (!name) return;
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/classes/${classId}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (data.success) {
        flash("Class name updated.");
        setEditingClassId(null);
        loadData();
      } else {
        flash(data.error || "Failed to rename class.", true);
      }
    } catch {
      flash("Failed to rename class.", true);
    } finally {
      setSaving(false);
    }
  }

  async function handleAddArm(classId: string) {
    if (!newArmName.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/classes/arms`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ classId, name: newArmName.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        flash(`Arm "${newArmName}" added.`);
        setNewArmName("");
        setShowAddArm(null);
        loadData();
      } else {
        flash(data.error || "Failed to add arm.", true);
      }
    } catch {
      flash("Failed to add arm.", true);
    } finally {
      setSaving(false);
    }
  }

  async function handleRenameArm(armId: string) {
    const name = normalizeArm(editArmName);
    if (!name) return;
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/classes/arms/${armId}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (data.success) {
        flash("Arm updated.");
        setEditingArmId(null);
        loadData();
      } else {
        flash(data.error || "Failed to rename arm.", true);
      }
    } catch {
      flash("Failed to rename arm.", true);
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteArm(armId: string, armLabel: string) {
    if (!confirm(`Delete arm ${armLabel}? Students must be moved first.`)) return;
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/classes/arms/${armId}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) {
        flash(`Arm ${armLabel} deleted.`);
        loadData();
      } else {
        flash(data.error || "Failed to delete arm.", true);
      }
    } catch {
      flash("Failed to delete arm.", true);
    } finally {
      setSaving(false);
    }
  }

  async function handleAddStudentToArm(classId: string, armId: string, armLabel: string) {
    if (!rosterStudentName.trim()) {
      flash("Student name is required.", true);
      return;
    }
    setAddingStudent(true);
    try {
      const res = await fetch(`${API_URL}/api/students`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          schoolId: user?.school?.id || "",
          admissionNumber: rosterStudentNo.trim() || `STU-${Date.now().toString(36).toUpperCase()}`,
          fullName: rosterStudentName.trim(),
          classId,
          armId,
        }),
      });
      const data = await res.json();
      if (data.success) {
        flash(`${rosterStudentName} added to ${armLabel}.`);
        setRosterStudentName("");
        setRosterStudentNo("");
        loadData();
      } else {
        flash(data.error || "Failed to add student.", true);
      }
    } catch {
      flash("Failed to add student.", true);
    } finally {
      setAddingStudent(false);
    }
  }

  function armCount(arm: ClassArm) {
    return arm._count?.students ?? arm.students?.length ?? 0;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <GraduationCap className="w-6 h-6" /> Classes and Arms
          </h1>
          <p className="text-gray-500 mt-1">
            Create classes like JSS 1 with arms A, B, C. Edit names and manage students in each arm.
          </p>
        </div>
        <button
          onClick={() => setShowAddClass(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg text-sm hover:bg-gray-800"
        >
          <Plus className="w-4 h-4" /> Add Class
        </button>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-sm text-red-700 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /> {error}
        </div>
      )}
      {success && (
        <div className="p-3 rounded-xl bg-green-50 border border-green-100 text-sm text-green-700 flex items-start gap-2">
          <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" /> {success}
        </div>
      )}

      {classes.length === 0 ? (
        <div className="card p-10 text-center text-gray-500">
          <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p>No classes yet. Add JSS 1 with arms A, B, C to get started.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {classes.map((cls) => {
            const open = expanded[cls.id] !== false;
            return (
              <div key={cls.id} className="card overflow-hidden">
                <div className="flex flex-wrap items-center gap-3 px-4 py-3 bg-gray-50 border-b border-gray-100">
                  <button
                    type="button"
                    onClick={() => setExpanded((p) => ({ ...p, [cls.id]: !open }))}
                    className="p-1.5 rounded hover:bg-gray-200"
                    aria-label={open ? "Collapse class" : "Expand class"}
                  >
                    {open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </button>

                  {editingClassId === cls.id ? (
                    <form
                      className="flex items-center gap-2 flex-1"
                      onSubmit={(e) => { e.preventDefault(); handleRenameClass(cls.id); }}
                    >
                      <input
                        className="input-field flex-1 min-w-[140px]"
                        value={editClassName}
                        onChange={(e) => setEditClassName(e.target.value)}
                        required
                      />
                      <button type="submit" className="btn-primary px-3 py-1.5 text-xs">Save</button>
                      <button type="button" onClick={() => setEditingClassId(null)} className="btn-ghost px-2 py-1.5 text-xs">Cancel</button>
                    </form>
                  ) : (
                    <>
                      <h2 className="font-semibold text-gray-900">{cls.name}</h2>
                      <span className="text-xs text-gray-500">
                        {cls._count?.students || 0} students · {cls.arms?.length || 0} arm(s)
                      </span>
                      <button
                        onClick={() => { setEditingClassId(cls.id); setEditClassName(cls.name); }}
                        className="p-1.5 rounded hover:bg-gray-200 text-gray-500"
                        title="Edit class name"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setShowAddArm(cls.id)}
                        className="ml-auto inline-flex items-center gap-1 px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg hover:bg-white"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add arm
                      </button>
                    </>
                  )}
                </div>

                {open && (
                  <div className="divide-y divide-gray-100">
                    {(cls.arms || []).length === 0 ? (
                      <div className="px-4 py-4 text-sm text-gray-500">
                        No arms yet. Add arm A, B, C for this class.
                      </div>
                    ) : (
                      cls.arms.map((arm) => {
                        const students = arm.students || [];
                        const count = armCount(arm);
                        const rosterOpen = rosterArmId === arm.id;
                        return (
                          <div key={arm.id} className="px-4 py-3">
                            <div className="flex flex-wrap items-center gap-3">
                              <div className="font-medium text-gray-800">
                                {cls.name} {arm.name}
                              </div>
                              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                                {count} student{count === 1 ? "" : "s"}
                              </span>
                              {arm.classTeacher && (
                                <span className="text-xs text-gray-500">
                                  Class teacher: {arm.classTeacher.fullName}
                                </span>
                              )}

                              {editingArmId === arm.id ? (
                                <form
                                  className="flex items-center gap-2"
                                  onSubmit={(e) => { e.preventDefault(); handleRenameArm(arm.id); }}
                                >
                                  <input
                                    className="input-field w-24 py-1 text-sm"
                                    value={editArmName}
                                    onChange={(e) => setEditArmName(e.target.value)}
                                    required
                                  />
                                  <button type="submit" className="btn-primary px-2 py-1 text-xs">Save</button>
                                  <button type="button" onClick={() => setEditingArmId(null)} className="text-xs text-gray-500 px-2">Cancel</button>
                                </form>
                              ) : (
                                <div className="ml-auto flex items-center gap-1">
                                  <button
                                    onClick={() => { setEditingArmId(arm.id); setEditArmName(arm.name); }}
                                    className="p-1.5 rounded hover:bg-gray-100 text-gray-500"
                                    title="Edit arm name"
                                  >
                                    <Pencil className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => setRosterArmId(rosterOpen ? null : arm.id)}
                                    className="inline-flex items-center gap-1 px-2 py-1 text-xs border border-gray-200 rounded-lg hover:bg-gray-50"
                                  >
                                    <Users className="w-3.5 h-3.5" />
                                    {rosterOpen ? "Hide students" : "Students"}
                                  </button>
                                  <button
                                    onClick={() => handleDeleteArm(arm.id, `${cls.name} ${arm.name}`)}
                                    className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-600"
                                    title="Delete arm"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              )}
                            </div>

                            {rosterOpen && (
                              <div className="mt-3 rounded-xl border border-gray-200 overflow-hidden">
                                <div className="px-3 py-2 bg-gray-50 border-b border-gray-100 flex flex-wrap items-center gap-2">
                                  <UserPlus className="w-4 h-4 text-gray-500" />
                                  <input
                                    className="input-field flex-1 min-w-[140px] py-1.5 text-sm"
                                    placeholder="Student full name"
                                    value={rosterStudentName}
                                    onChange={(e) => setRosterStudentName(e.target.value)}
                                  />
                                  <input
                                    className="input-field w-32 py-1.5 text-sm"
                                    placeholder="Admission no."
                                    value={rosterStudentNo}
                                    onChange={(e) => setRosterStudentNo(e.target.value)}
                                  />
                                  <button
                                    onClick={() => handleAddStudentToArm(cls.id, arm.id, `${cls.name} ${arm.name}`)}
                                    disabled={addingStudent}
                                    className="btn-primary px-3 py-1.5 text-xs inline-flex items-center gap-1"
                                  >
                                    {addingStudent ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                                    Add student
                                  </button>
                                </div>
                                {students.length === 0 ? (
                                  <div className="px-3 py-4 text-sm text-gray-500">
                                    No students in this arm yet. Add the first student above.
                                  </div>
                                ) : (
                                  <ul className="max-h-64 overflow-y-auto divide-y divide-gray-50">
                                    {students.map((s) => (
                                      <li key={s.id} className="px-3 py-2 flex items-center justify-between text-sm">
                                        <span className="font-medium text-gray-800">{s.fullName}</span>
                                        <span className="text-xs text-gray-500">{s.admissionNumber || ""}</span>
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add class modal */}
      {showAddClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Add class</h2>
              <button onClick={() => setShowAddClass(false)} className="p-2 text-gray-400 hover:text-gray-600" aria-label="Close">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddClass} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase">Class level</label>
                <select
                  className="input-field w-full mt-1"
                  value={CLASS_PRESETS.includes(newClassName) ? newClassName : ""}
                  onChange={(e) => setNewClassName(e.target.value)}
                >
                  <option value="">Select a class level</option>
                  {CLASS_PRESETS.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                  <option value="__custom">Custom name</option>
                </select>
                {newClassName === "__custom" || (newClassName && !CLASS_PRESETS.includes(newClassName)) ? (
                  <input
                    className="input-field w-full mt-2"
                    placeholder="Or type a name, e.g. JSS1 or Primary 3"
                    value={CLASS_PRESETS.includes(newClassName) ? "" : newClassName}
                    onChange={(e) => setNewClassName(e.target.value)}
                    autoFocus
                  />
                ) : null}
                {newClassName && newClassName !== "__custom" && (
                  <p className="text-xs text-gray-500 mt-1">
                    Will be saved as <span className="font-semibold text-gray-800">{normalizeClassName(newClassName) || newClassName}</span>
                  </p>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase">Arms</label>
                <p className="text-xs text-gray-500 mb-2">Tap to select. Most schools use A, B, C.</p>
                <div className="flex flex-wrap gap-2">
                  {[...ARM_PRESETS, "SCIENCE", "ART", "COMMERCIAL"].map((a) => {
                    const on = newClassArms.includes(a);
                    return (
                      <button
                        key={a}
                        type="button"
                        onClick={() => toggleArm(a)}
                        className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                          on
                            ? "bg-[var(--brand)] text-white border-[var(--brand)]"
                            : "border-gray-200 text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        {a}
                      </button>
                    );
                  })}
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <input
                    className="input-field flex-1"
                    placeholder="Custom arm name"
                    value={customArm}
                    onChange={(e) => setCustomArm(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        const c = normalizeArm(customArm);
                        if (c && !newClassArms.includes(c)) {
                          setNewClassArms((p) => [...p, c]);
                          setCustomArm("");
                        }
                      }
                    }}
                  />
                  <button
                    type="button"
                    className="btn-secondary px-3 py-2 text-sm"
                    onClick={() => {
                      const c = normalizeArm(customArm);
                      if (c && !newClassArms.includes(c)) {
                        setNewClassArms((p) => [...p, c]);
                        setCustomArm("");
                      }
                    }}
                  >
                    Add
                  </button>
                </div>
              </div>

              {(newClassArms.length > 0 || customArm.trim()) && (
                <div className="rounded-lg bg-gray-50 border border-gray-100 p-3 text-sm text-gray-700">
                  <p className="text-xs text-gray-500 uppercase mb-1">Preview</p>
                  {(() => {
                    const name = normalizeClassName(newClassName) || "New class";
                    const arms = [...newClassArms];
                    const c = normalizeArm(customArm);
                    if (c && !arms.includes(c)) arms.push(c);
                    if (!arms.length) return <span>{name}</span>;
                    return <span>{arms.map((a) => `${name} ${a}`).join(" · ")}</span>;
                  })()}
                </div>
              )}

              <button type="submit" disabled={saving} className="btn-primary w-full justify-center">
                {saving ? "Creating..." : "Create class"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Add arm modal */}
      {showAddArm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Add arm</h2>
              <button onClick={() => setShowAddArm(null)} className="p-2 text-gray-400 hover:text-gray-600" aria-label="Close">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); handleAddArm(showAddArm); }} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase">Arm name</label>
                <input
                  className="input-field w-full mt-1"
                  placeholder="e.g. A, B, C or GOLD"
                  value={newArmName}
                  onChange={(e) => setNewArmName(normalizeArm(e.target.value))}
                  required
                />
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {[...ARM_PRESETS, "SCIENCE", "ART", "COMMERCIAL", "GOLD"].map((a) => (
                    <button
                      key={a}
                      type="button"
                      onClick={() => setNewArmName(a)}
                      className="px-2.5 py-1 text-xs border border-gray-200 rounded-lg hover:bg-gray-50"
                    >
                      {a}
                    </button>
                  ))}
                </div>
              </div>
              <button type="submit" disabled={saving} className="btn-primary w-full justify-center">
                {saving ? "Adding..." : "Add arm"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
