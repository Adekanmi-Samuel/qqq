"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth/CookieAuthProvider";
import { api } from "@/lib/api";
import { motion } from "framer-motion";
import {
  CalendarClock, BookMarked, Loader2, Save, Plus, X, CheckCircle, AlertTriangle,
} from "lucide-react";

const DAYS = [
  { value: 0, label: "Monday" },
  { value: 1, label: "Tuesday" },
  { value: 2, label: "Wednesday" },
  { value: 3, label: "Thursday" },
  { value: 4, label: "Friday" },
];

const PERIOD_TIMES: Record<number, [string, string]> = {
  1: ["08:00", "09:00"],
  2: ["09:00", "10:00"],
  3: ["10:15", "11:00"],
  4: ["12:00", "13:00"],
  5: ["13:00", "14:00"],
  6: ["14:00", "15:00"],
};

interface SlotDraft {
  dayOfWeek: number;
  period: number;
  subjectId: string;
  teacherId?: string;
  startTime: string;
  endTime: string;
}

export default function ProprietorCurriculumPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [arms, setArms] = useState<any[]>([]);
  const [schemes, setSchemes] = useState<any[]>([]);
  const [coverage, setCoverage] = useState<any[]>([]);
  const [missingTeacherSubjects, setMissingTeacherSubjects] = useState<any[]>([]);

  const [selectedArmId, setSelectedArmId] = useState("");
  const [slots, setSlots] = useState<SlotDraft[]>([]);

  const [schemeForm, setSchemeForm] = useState({
    subjectId: "",
    classId: "",
    title: "",
    session: "2025/2026",
    term: 1,
    weeksInput: "1. \n2. \n3. \n4. \n5. \n6. \n7. \n8. \n9. \n10. \n11. \n12. ",
  });

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      setLoading(true);
      const data = await api.get<any>("/api/school/curriculum");
      setClasses(data.classes || []);
      setSubjects(data.subjects || []);
      setTeachers(data.teachers || []);
      setArms(data.arms || []);
      setSchemes(data.schemes || []);
      setCoverage(data.coverage || []);
      setMissingTeacherSubjects(data.missingTeacherSubjects || []);
      if ((data.arms || []).length) {
        setSelectedArmId(data.arms[0].id);
      }
    } catch (e: any) {
      setError(e?.message || "Failed to load curriculum tools.");
    } finally {
      setLoading(false);
    }
  }

  const selectedArm = arms.find((a) => a.id === selectedArmId);

  useEffect(() => {
    if (!selectedArm) {
      setSlots([]);
      return;
    }
    const existing: SlotDraft[] = (selectedArm.timetableSlots || []).map((s: any) => ({
      dayOfWeek: s.dayOfWeek,
      period: s.period,
      subjectId: s.subjectId,
      teacherId: s.teacherId || undefined,
      startTime: s.startTime,
      endTime: s.endTime,
    }));
    setSlots(existing);
  }, [selectedArmId, selectedArm]);

  const teacherOptions = useMemo(() => teachers, [teachers]);

  function upsertSlot(dayOfWeek: number, period: number, subjectId: string) {
    const [startTime, endTime] = PERIOD_TIMES[period] || ["08:00", "09:00"];
    setSlots((prev) => {
      const others = prev.filter((s) => !(s.dayOfWeek === dayOfWeek && s.period === period));
      if (!subjectId) return others;
      return [
        ...others,
        {
          dayOfWeek,
          period,
          subjectId,
          teacherId: selectedArm?.classTeacherId || teacherOptions[0]?.id,
          startTime,
          endTime,
        },
      ].sort((a, b) => a.dayOfWeek - b.dayOfWeek || a.period - b.period);
    });
  }

  function slotAt(day: number, period: number) {
    return slots.find((s) => s.dayOfWeek === day && s.period === period);
  }

  async function saveTimetable() {
    if (!selectedArmId || !slots.length) {
      setError("Select a class and add at least one period.");
      return;
    }
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const data = await api.post<any>("/api/school/timetable", {
        classArmId: selectedArmId,
        slots: slots.map((s) => ({
          subjectId: s.subjectId,
          teacherId: s.teacherId,
          dayOfWeek: s.dayOfWeek,
          period: s.period,
          startTime: s.startTime,
          endTime: s.endTime,
        })),
      });
      setSuccess(data.message || "Timetable saved.");
      await load();
    } catch (e: any) {
      setError(e?.message || "Failed to save timetable.");
    } finally {
      setSaving(false);
    }
  }

  function parseWeeks(input: string) {
    return input
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const m = line.match(/^(\d+)[.\s)]*(.*)/);
        if (!m) return null;
        return { week: parseInt(m[1], 10), topic: m[2].trim() || `Week ${m[1]}` };
      })
      .filter(Boolean) as { week: number; topic: string }[];
  }

  async function saveScheme(e: React.FormEvent) {
    e.preventDefault();
    const weeks = parseWeeks(schemeForm.weeksInput);
    if (!schemeForm.subjectId || !schemeForm.classId || !weeks.length) {
      setError("Select subject, class and enter week topics.");
      return;
    }
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const className = classes.find((c) => c.id === schemeForm.classId)?.name || schemeForm.classId;
      const subjectName = subjects.find((s) => s.id === schemeForm.subjectId)?.name || schemeForm.subjectId;
      const data = await api.post<any>("/api/school/schemes", {
        subjectId: schemeForm.subjectId,
        classId: schemeForm.classId,
        title: schemeForm.title || `${subjectName} Scheme of Work ${className} ${schemeForm.session}`,
        session: schemeForm.session,
        term: schemeForm.term,
        weeks,
        generateNotes: true,
      });
      setSuccess(`Scheme saved with ${data.data?.notesCreated || 0} lesson notes.`);
      await load();
    } catch (err: any) {
      setError(err?.message || "Failed to save scheme.");
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Timetable and schemes</h1>
        <p className="text-gray-500 mt-1">
          Proprietor tools to set the school timetable and lesson schemes of work.
        </p>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-sm text-red-700">{error}</div>
      )}
      {success && (
        <div className="p-3 rounded-xl bg-green-50 border border-green-100 text-sm text-green-700 flex items-center gap-2">
          <CheckCircle className="w-4 h-4" /> {success}
        </div>
      )}

      <section className="card p-5 border-amber-200 bg-amber-50/40">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="w-5 h-5 text-amber-600" />
          <h2 className="font-semibold text-gray-900">Teacher coverage</h2>
        </div>
        {missingTeacherSubjects.length === 0 ? (
          <p className="text-sm text-emerald-700">Every subject in every class has a teacher assigned.</p>
        ) : (
          <>
            <p className="text-sm text-amber-800 mb-3">
              {missingTeacherSubjects.length} subject assignment(s) still need a teacher.
            </p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {missingTeacherSubjects.map((m, i) => (
                <div key={`${m.className}-${m.armName}-${m.subject}-${i}`} className="text-sm px-3 py-2 rounded-lg bg-white border border-amber-200">
                  <span className="font-medium">{m.subject}</span>
                  <span className="text-gray-500"> · {m.className} {m.armName}</span>
                </div>
              ))}
            </div>
          </>
        )}
        <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {coverage.map((c) => (
            <div key={c.classArmId} className="text-sm px-3 py-2 rounded-lg bg-white border border-gray-200 flex justify-between gap-2">
              <span>{c.className} {c.armName}</span>
              <span className={c.missing?.length ? "text-amber-700 font-medium" : "text-emerald-700"}>
                {c.covered}/{c.totalSubjects}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <CalendarClock className="w-5 h-5 text-amber-600" />
          <h2 className="font-semibold text-gray-900">School timetable</h2>
        </div>

        <div className="mb-4">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Class arm</label>
          <select
            className="mt-1 w-full max-w-md px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
            value={selectedArmId}
            onChange={(e) => setSelectedArmId(e.target.value)}
          >
            {arms.map((arm) => (
              <option key={arm.id} value={arm.id}>
                {arm.class?.name} {arm.name}
                {arm.classTeacher ? ` · ${arm.classTeacher.fullName}` : ""}
              </option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm border border-gray-200">
            <thead>
              <tr className="bg-gray-50">
                <th className="p-2 text-left border-b border-gray-200">Day</th>
                {[1, 2, 3, 4, 5, 6].map((p) => (
                  <th key={p} className="p-2 border-b border-gray-200 text-xs">
                    Period {p}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {DAYS.map((day) => (
                <tr key={day.value}>
                  <td className="p-2 border-b border-gray-100 font-medium text-gray-700 whitespace-nowrap">
                    {day.label}
                  </td>
                  {[1, 2, 3, 4, 5, 6].map((period) => {
                    const slot = slotAt(day.value, period);
                    return (
                      <td key={period} className="p-1 border-b border-gray-100 align-top min-w-[120px]">
                        <select
                          className="w-full px-2 py-1.5 border border-gray-200 rounded text-xs bg-white"
                          value={slot?.subjectId || ""}
                          onChange={(e) => upsertSlot(day.value, period, e.target.value)}
                        >
                          <option value="">Free</option>
                          {subjects.map((s) => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                          ))}
                        </select>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <button
            type="button"
            onClick={saveTimetable}
            disabled={saving || !selectedArmId}
            className="btn-primary inline-flex items-center gap-2 px-4 py-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save timetable
          </button>
          <span className="text-xs text-gray-500">{slots.length} periods set</span>
        </div>
      </section>

      <section className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <BookMarked className="w-5 h-5 text-brand-600" />
          <h2 className="font-semibold text-gray-900">Lesson schemes</h2>
        </div>

        <form onSubmit={saveScheme} className="grid md:grid-cols-2 gap-3">
          <select
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
            value={schemeForm.classId}
            onChange={(e) => setSchemeForm({ ...schemeForm, classId: e.target.value })}
            required
          >
            <option value="">Select class</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <select
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
            value={schemeForm.subjectId}
            onChange={(e) => setSchemeForm({ ...schemeForm, subjectId: e.target.value })}
            required
          >
            <option value="">Select subject</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          <input
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
            placeholder="Scheme title (optional)"
            value={schemeForm.title}
            onChange={(e) => setSchemeForm({ ...schemeForm, title: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
              value={schemeForm.session}
              onChange={(e) => setSchemeForm({ ...schemeForm, session: e.target.value })}
              required
            />
            <select
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
              value={schemeForm.term}
              onChange={(e) => setSchemeForm({ ...schemeForm, term: Number(e.target.value) })}
            >
              <option value={1}>Term 1</option>
              <option value={2}>Term 2</option>
              <option value={3}>Term 3</option>
            </select>
          </div>
          <textarea
            className="md:col-span-2 px-3 py-2 border border-gray-200 rounded-lg text-sm min-h-[160px]"
            value={schemeForm.weeksInput}
            onChange={(e) => setSchemeForm({ ...schemeForm, weeksInput: e.target.value })}
            placeholder={"1. Topic one\n2. Topic two"}
          />
          <div className="md:col-span-2 flex items-center gap-3">
            <button type="submit" disabled={saving} className="btn-primary inline-flex items-center gap-2 px-4 py-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Save scheme and lesson notes
            </button>
            <span className="text-xs text-gray-500">Notes follow the school lesson note format including week 5 midterm.</span>
          </div>
        </form>

        <div className="mt-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Existing schemes</h3>
          <div className="max-h-64 overflow-y-auto space-y-2">
            {schemes.map((s) => (
              <div key={s.id} className="text-sm px-3 py-2 rounded-lg bg-gray-50 border border-gray-100 flex justify-between gap-2">
                <span>{s.class?.name} · {s.subject?.name}</span>
                <span className="text-xs text-gray-500">
                  {s.weeks?.length || 0} weeks · {s.lessonNotes?.length || 0} notes
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
