"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth/CookieAuthProvider";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { BookOpen, CheckCircle, Loader2, GraduationCap, Save, Sparkles } from "lucide-react";

interface ClassArmOption {
  classId: string;
  className: string;
  armId: string;
  armName: string;
  studentCount?: number;
}

interface Assignment {
  id: string;
  subjectId: string;
  classArmId: string;
  subject: { id: string; name: string };
  arm: { id: string; name: string; class: { id: string; name: string } };
}

export default function TeacherSetupPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedArms, setSelectedArms] = useState<Record<string, boolean>>({});
  const [selectedSubjects, setSelectedSubjects] = useState<Record<string, boolean>>({});
  // replaceAll drops previous teaching links then writes the current selection.
  const [replaceAll, setReplaceAll] = useState(false);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      setLoading(true);
      const data = await api.get<any>("/api/teacher/setup");
      setClasses(data.classes || []);
      setSubjects(data.subjects || []);
      setAssignments(data.assignments || []);
      const armMap: Record<string, boolean> = {};
      const subjectMap: Record<string, boolean> = {};
      (data.assignments || []).forEach((a: Assignment) => {
        armMap[a.classArmId] = true;
        subjectMap[a.subjectId] = true;
      });
      setSelectedArms(armMap);
      setSelectedSubjects(subjectMap);
    } catch (e: any) {
      setError(e?.message || "Failed to load setup options.");
    } finally {
      setLoading(false);
    }
  }

  const armOptions: ClassArmOption[] = useMemo(() => {
    const list: (ClassArmOption & { studentCount?: number })[] = [];
    classes.forEach((cls) => {
      (cls.arms || []).forEach((arm: any) => {
        list.push({
          classId: cls.id,
          className: cls.name,
          armId: arm.id,
          armName: arm.name,
          studentCount: arm._count?.students ?? arm.students?.length,
        });
      });
    });
    return list;
  }, [classes]);

  const selectedArmList = armOptions.filter((a) => selectedArms[a.armId]);
  const selectedSubjectList = subjects.filter((s) => selectedSubjects[s.id]);

  function toggle(map: Record<string, boolean>, setMap: (v: Record<string, boolean>) => void, id: string) {
    setMap({ ...map, [id]: !map[id] });
  }

  async function save() {
    if (!selectedArmList.length || !selectedSubjectList.length) {
      setError("Select at least one class and one subject.");
      return;
    }
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const data = await api.post<any>("/api/teacher/setup", {
        classArmIds: selectedArmList.map((a) => a.armId),
        subjectIds: selectedSubjectList.map((s) => s.id),
        replaceAll: replaceAll,
      });
      setAssignments(data.assignments || []);
      const linksCreated = data.linksCreated ?? data.data?.linksCreated ?? 0;
      const conflicts = data.conflicts ?? data.data?.conflicts ?? 0;
      const message = data.message ||
        (conflicts
          ? `Saved ${linksCreated} teaching link(s). ${conflicts} subject(s) already belong to another teacher were left unchanged.`
          : `Saved ${linksCreated} teaching link(s) across ${selectedArmList.length} class(es) and ${selectedSubjectList.length} subject(s).`);
      setSuccess(message);
      queryClient.invalidateQueries({ queryKey: queryKeys.teacher.timesheets({}) });
    } catch (e: any) {
      setError(e?.message || "Failed to save setup.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }} className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--heading-color)] font-display">My teaching setup</h1>
        <p className="text-sm text-[var(--body-color)] mt-1 font-sans">
          Select the classes and subjects you take. You can change this any time from this page.
        </p>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-sm text-red-700">{error}</div>
      )}
      {success && (
        <div className="p-3 rounded-xl bg-green-50 border border-green-100 text-sm text-green-700 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4" /> {success}
          </div>
          <div className="flex flex-wrap gap-2">
            <a href="/dashboard/teacher/attendance" className="btn-primary inline-flex px-3 py-1.5 text-xs">
              Mark attendance
            </a>
            <a href="/dashboard/teacher/lesson-notes" className="btn-secondary inline-flex px-3 py-1.5 text-xs">
              Open lesson notes
            </a>
            <a href="/dashboard/teacher" className="btn-secondary inline-flex px-3 py-1.5 text-xs">
              View dashboard
            </a>
          </div>
        </div>
      )}

      <section className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <GraduationCap className="w-5 h-5 text-brand-600" />
          <h2 className="font-semibold text-[var(--heading-color)]">1. Select classes</h2>
        </div>
        {armOptions.length === 0 ? (
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-100 text-sm text-amber-800">
            Your school has no class arms configured yet. Ask your school admin to add classes and arms before you can complete teaching setup.
          </div>
        ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {armOptions.map((arm) => {
            const checked = !!selectedArms[arm.armId];
            return (
              <button
                key={arm.armId}
                type="button"
                onClick={() => toggle(selectedArms, setSelectedArms, arm.armId)}
                className={`p-3 rounded-xl border text-left transition-colors ${
                  checked
                    ? "border-brand-500 bg-brand-500/10"
                    : "border-[var(--card-border)] hover:border-brand-300"
                }`}
              >
                <p className="font-semibold text-sm text-[var(--heading-color)]">
                  {arm.className} {arm.armName}
                </p>
                <p className="text-xs text-[var(--text-muted)]">
                  Arm {arm.armName}
                  {typeof arm.studentCount === "number" ? ` · ${arm.studentCount} students` : ""}
                </p>
              </button>
            );
          })}
        </div>
        )}
      </section>

      <section className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <BookOpen className="w-5 h-5 text-brand-600" />
          <h2 className="font-semibold text-[var(--heading-color)]">2. Select subjects</h2>
        </div>
        {subjects.length === 0 ? (
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-100 text-sm text-amber-800">
            Your school has no subjects configured yet. Ask your school admin to add subjects before you can complete teaching setup.
          </div>
        ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {subjects.map((subject) => {
            const checked = !!selectedSubjects[subject.id];
            return (
              <button
                key={subject.id}
                type="button"
                onClick={() => toggle(selectedSubjects, setSelectedSubjects, subject.id)}
                className={`p-3 rounded-xl border text-left transition-colors ${
                  checked
                    ? "border-brand-500 bg-brand-500/10"
                    : "border-[var(--card-border)] hover:border-brand-300"
                }`}
              >
                <p className="font-semibold text-sm text-[var(--heading-color)]">{subject.name}</p>
                {subject.shortCode && (
                  <p className="text-xs text-[var(--text-muted)]">{subject.shortCode}</p>
                )}
              </button>
            );
          })}
        </div>
        )}
      </section>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="card p-5 flex flex-wrap items-center justify-between gap-3"
      >
        <div className="text-sm text-[var(--body-color)] font-sans">
          <strong>{selectedArmList.length}</strong> classes · <strong>{selectedSubjectList.length}</strong> subjects ·{" "}
          <strong>{selectedArmList.length * selectedSubjectList.length}</strong> teaching links
          <label className="ml-3 inline-flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={replaceAll}
              onChange={(e) => setReplaceAll(e.target.checked)}
            />
            Replace my existing setup
          </label>
        </div>
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="btn-primary inline-flex items-center gap-2 px-5 py-2.5"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {replaceAll ? "Replace my setup" : "Save my teaching setup"}
        </button>
      </motion.div>

      {assignments.length > 0 && (
        <section className="card p-5">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <h2 className="font-semibold text-[var(--heading-color)]">Current assignments</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-2">
            {assignments.map((a) => (
              <div key={a.id} className="text-sm px-3 py-2 rounded-lg bg-[var(--surface-2)] text-[var(--body-color)]">
                {a.arm?.class?.name} {a.arm?.name} · {a.subject?.name}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
