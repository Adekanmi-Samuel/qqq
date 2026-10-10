"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth/CookieAuthProvider";
import { useApi } from "@/hooks/useApi";

interface ClassArm {
  id: string;
  name: string;
  _count: { students: number };
}

interface SchoolClass {
  id: string;
  name: string;
  arms: ClassArm[];
}

export default function ClassesPage() {
  const { user, token } = useAuth();
  const { get, post, loading } = useApi();
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [pageLoading, setPageLoading] = useState(true);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newClassName, setNewClassName] = useState("");
  const [newArms, setNewArms] = useState("A,B,C");
  const [creating, setCreating] = useState(false);

  const loadClasses = async () => {
    setPageLoading(true);
    const data = await get<{ success: boolean; data: SchoolClass[] }>("/api/classes");
    if (data?.success) setClasses(data.data);
    setPageLoading(false);
  };

  useEffect(() => {
    if (token) loadClasses();
  }, []);

  const handleCreate = async () => {
    if (!newClassName.trim()) return;
    setCreating(true);
    const arms = newArms.split(",").map(a => a.trim()).filter(Boolean);
    const schoolId = classes.length > 0 ? user?.school?.id : null;
    const res = await post<{ success: boolean }>("/api/classes", {
      schoolId: user?.school?.id || "",
      name: newClassName.trim(),
      arms,
    });
    if (res?.success) {
      setShowCreateForm(false);
      setNewClassName("");
      setNewArms("A,B,C");
      loadClasses();
    }
    setCreating(false);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Classes</h1>
          <p className="text-sm text-gray-500 mt-1">
            Create and manage classes, arms, and class teachers
          </p>
        </div>
        <button className="btn-primary text-sm" onClick={() => setShowCreateForm(!showCreateForm)}>
          + Create Class
        </button>
      </div>

      {showCreateForm && (
        <div className="card mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">New Class</h3>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="label">Class Name</label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g. SS 1"
                value={newClassName}
                onChange={(e) => setNewClassName(e.target.value)}
              />
            </div>
            <div className="flex-1">
              <label className="label">Arms (comma separated)</label>
              <input
                type="text"
                className="input-field"
                placeholder="A, B, C"
                value={newArms}
                onChange={(e) => setNewArms(e.target.value)}
              />
            </div>
            <div className="flex items-end gap-2">
              <button className="btn-primary" onClick={handleCreate} disabled={creating}>
                {creating ? "Creating..." : "Save"}
              </button>
              <button className="btn-secondary" onClick={() => setShowCreateForm(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {pageLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="h-5 bg-gray-200 rounded w-24 mb-4" />
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, j) => (
                  <div key={j} className="h-10 bg-gray-100 rounded" />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : classes.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">📚</p>
          <p className="text-lg">No classes yet</p>
          <p className="text-sm mt-1">Create your first class to get started</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {classes.map((cls) => (
            <div key={cls.id} className="card hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">{cls.name}</h3>
                <span className="badge-green">{cls.arms.reduce((sum, a) => sum + a._count.students, 0)} students</span>
              </div>
              <div className="space-y-2">
                {cls.arms.map((arm) => (
                  <div
                    key={arm.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-gray-50 text-sm"
                  >
                    <span className="font-medium text-gray-700">Arm {arm.name}</span>
                    <span className="text-gray-400">{arm._count.students} students</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
