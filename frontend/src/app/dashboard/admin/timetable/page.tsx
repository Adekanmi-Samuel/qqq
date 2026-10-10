"use client";

import { useState, useEffect, useCallback } from "react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import {
  Clock, BookOpen, User, X, Save, AlertCircle, Check,
  ChevronDown, ArrowLeft, ArrowRight, Loader2
} from "lucide-react";
import { API_URL } from "@/lib/config";

// ---------- Types ----------
interface SubjectAssignment {
  subjectId: string;
  subjectName: string;
  shortCode: string;
  teacherId: string;
  teacherName: string;
}

interface TimetableSlot {
  id?: string;
  classArmId: string;
  subjectId: string;
  teacherId: string;
  dayOfWeek: number;
  period: number;
  startTime: string;
  endTime: string;
  room?: string;
  subject?: { id: string; name: string; shortCode: string };
  teacher?: { id: string; fullName: string };
}

interface ClassArm {
  id: string;
  name: string;
  class: { id: string; name: string };
  classTeacher: { id: string; fullName: string } | null;
  _count: { students: number };
}

// ---------- Constants ----------
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const PERIODS = [
  { period: 1, start: "08:00", end: "08:45" },
  { period: 2, start: "08:45", end: "09:30" },
  { period: 3, start: "09:30", end: "10:15" },
  { period: 4, start: "10:15", end: "11:00" },
  { period: 5, start: "11:00", end: "11:45" },
  { period: 6, start: "11:45", end: "12:30" },
  { period: 7, start: "12:30", end: "13:15" },
  { period: 8, start: "13:15", end: "14:00" },
];


// ---------- Draggable Subject Card ----------
function SubjectCard({ assignment, isPlaced }: { assignment: SubjectAssignment; isPlaced: boolean }) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: "SUBJECT",
    item: assignment,
    canDrag: !isPlaced,
    collect: (monitor) => ({ isDragging: monitor.isDragging() }),
  }), [assignment, isPlaced]);

  return (
    <div
      ref={drag as any}
      className={`p-2.5 rounded-lg border text-sm cursor-grab active:cursor-grabbing transition-all ${
        isDragging ? "opacity-40 scale-95" : ""
      } ${
        isPlaced
          ? "border-emerald-200 bg-emerald-50 opacity-60 cursor-not-allowed"
          : "border-indigo-200 bg-white hover:border-indigo-400 hover:shadow-md hover:-translate-y-0.5"
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="font-semibold text-gray-800 text-xs">{assignment.shortCode}</span>
        {isPlaced && <Check className="w-3 h-3 text-emerald-500" />}
      </div>
      <p className="text-xs text-gray-500 mt-0.5 truncate">{assignment.subjectName}</p>
      <p className="text-[10px] text-gray-400 mt-0.5 truncate flex items-center gap-1">
        <User className="w-2.5 h-2.5" /> {assignment.teacherName.split(" ").slice(0, 2).join(" ")}
      </p>
    </div>
  );
}

// ---------- Droppable Timetable Cell ----------
function TimetableCell({ day, period, slot, onDrop, onRemove }: {
  day: number; period: number;
  slot: TimetableSlot | null;
  onDrop: (item: SubjectAssignment, day: number, period: number) => void;
  onRemove: (day: number, period: number) => void;
}) {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: "SUBJECT",
    drop: (item: SubjectAssignment) => onDrop(item, day, period),
    collect: (monitor) => ({ isOver: monitor.isOver() }),
  }), [day, period]);

  return (
    <div
      ref={drop as any}
      className={`min-h-[70px] rounded-lg border border-dashed transition-all ${
        isOver ? "border-indigo-500 bg-indigo-50 scale-[1.02]" : "border-gray-200 bg-gray-50/50"
      } ${slot ? "border-solid border-indigo-300 bg-white" : ""}`}
    >
      {slot ? (
        <div className="p-2 relative group">
          <button
            onClick={() => onRemove(day, period)}
            className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X className="w-3 h-3" />
          </button>
          <div className="flex items-center gap-1.5">
            <BookOpen className="w-3 h-3 text-indigo-500" />
            <span className="text-xs font-semibold text-gray-800">
              {slot.subject?.shortCode || slot.subjectId.slice(0, 8)}
            </span>
          </div>
          <p className="text-[10px] text-gray-500 mt-1 flex items-center gap-1">
            <User className="w-2.5 h-2.5" />
            {slot.teacher?.fullName?.split(" ").slice(0, 2).join(" ") || "Unknown"}
          </p>
          <p className="text-[10px] text-gray-400 mt-0.5">{slot.startTime}–{slot.endTime}</p>
        </div>
      ) : (
        <div className="p-2 flex items-center justify-center h-full">
          <span className="text-[10px] text-gray-300">Drop here</span>
        </div>
      )}
    </div>
  );
}

// ---------- Main Component ----------
export default function TimetablePage() {
  const [classArms, setClassArms] = useState<ClassArm[]>([]);
  const [selectedArm, setSelectedArm] = useState("");
  const [slots, setSlots] = useState<Record<string, TimetableSlot>>({});
  const [assignments, setAssignments] = useState<SubjectAssignment[]>([]);
  const [placedSubjectIds, setPlacedSubjectIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const getToken = () => "";

  // Fetch class arms
  useEffect(() => {
    const fetchArms = async () => {
      try {
        const res = await fetch(`${API_URL}/api/timetable/class-arms`, {
          credentials: "include",
        });
        const data = await res.json();
        if (data.success) setClassArms(data.data);
      } catch { /* ignore */ }
    };
    fetchArms();
  }, []);

  // Fetch timetable + available subjects when arm changes
  const fetchTimetable = useCallback(async () => {
    if (!selectedArm) return;
    setLoading(true);
    setError("");
    try {
      const [slotsRes, subjectsRes] = await Promise.all([
        fetch(`${API_URL}/api/timetable?classArmId=${selectedArm}`, {
          credentials: "include",
        }),
        fetch(`${API_URL}/api/timetable/available-subjects?classArmId=${selectedArm}`, {
          credentials: "include",
        }),
      ]);

      const slotsData = await slotsRes.json();
      const subjectsData = await subjectsRes.json();

      if (slotsData.success) {
        const slotMap: Record<string, TimetableSlot> = {};
        slotsData.data.forEach((s: TimetableSlot) => {
          slotMap[`${s.dayOfWeek}-${s.period}`] = s;
        });
        setSlots(slotMap);
      }

      if (subjectsData.success) {
        setAssignments(subjectsData.data.assigned);
        setPlacedSubjectIds(subjectsData.data.placedSubjectIds);
      }
    } catch (err) {
      setError("Failed to load timetable.");
    } finally {
      setLoading(false);
    }
  }, [selectedArm]);

  useEffect(() => {
    if (selectedArm) fetchTimetable();
  }, [selectedArm, fetchTimetable]);

  const handleDrop = async (item: SubjectAssignment, day: number, period: number) => {
    const key = `${day}-${period}`;
    const periodInfo = PERIODS.find(p => p.period === period);

    const newSlot: TimetableSlot = {
      classArmId: selectedArm,
      subjectId: item.subjectId,
      teacherId: item.teacherId,
      dayOfWeek: day,
      period,
      startTime: periodInfo?.start || "08:00",
      endTime: periodInfo?.end || "08:45",
    };

    // Optimistic update
    setSlots(prev => ({ ...prev, [key]: newSlot }));
    setPlacedSubjectIds(prev => prev.includes(item.subjectId) ? prev : [...prev, item.subjectId]);

    try {
      const res = await fetch(`${API_URL}/api/timetable`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
                  },
        body: JSON.stringify(newSlot),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setSuccessMsg("Slot saved!");
      setTimeout(() => setSuccessMsg(""), 2000);
    } catch (err: any) {
      setError(err.message);
      // Revert
      setSlots(prev => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const handleRemove = async (day: number, period: number) => {
    const key = `${day}-${period}`;
    const slot = slots[key];
    if (!slot?.id) {
      setSlots(prev => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
      return;
    }

    try {
      await fetch(`${API_URL}/api/timetable/${slot.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      setSlots(prev => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    } catch {
      setError("Failed to remove slot.");
    }
  };

  const clearSlot = (day: number, period: number) => handleRemove(day, period);

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Visual Timetable</h1>
        <p className="text-sm text-gray-500 mt-1">Drag subjects into time slots to build the weekly schedule</p>
      </div>

      {/* Toolbar */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6 flex flex-wrap items-center gap-4">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-medium text-gray-500 mb-1">Select Class Arm</label>
          <select
            value={selectedArm}
            onChange={e => setSelectedArm(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Choose a class arm...</option>
            {classArms.map(arm => (
              <option key={arm.id} value={arm.id}>
                {arm.class.name} - {arm.name}
                {arm.classTeacher ? ` (${arm.classTeacher.fullName})` : ""}
                {` - ${arm._count.students} students`}
              </option>
            ))}
          </select>
        </div>

        {successMsg && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 text-xs font-medium rounded-lg">
            <Check className="w-3.5 h-3.5" /> {successMsg}
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4 flex items-center gap-2 text-sm text-red-700">
          <AlertCircle className="w-4 h-4" /> {error}
          <button onClick={() => setError("")} className="ml-auto text-red-500 hover:text-red-700"><X className="w-4 h-4" /></button>
        </div>
      )}

      {!selectedArm ? (
        <div className="text-center py-16 text-gray-400">
          <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Select a class arm above to view or edit its timetable</p>
        </div>
      ) : loading ? (
        <div className="text-center py-16">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-500" />
        </div>
      ) : (
        <DndProvider backend={HTML5Backend}>
          <div className="flex gap-6">
            {/* Available Subjects Sidebar */}
            <div className="w-64 flex-shrink-0">
              <div className="bg-white rounded-xl border border-gray-200 p-4 sticky top-24">
                <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-indigo-500" />
                  Available Subjects
                </h3>
                {assignments.length === 0 ? (
                  <p className="text-xs text-gray-400">No subjects assigned. Add subject-teacher assignments first.</p>
                ) : (
                  <div className="space-y-2">
                    {assignments.map((a) => (
                      <SubjectCard
                        key={a.subjectId}
                        assignment={a}
                        isPlaced={placedSubjectIds.includes(a.subjectId)}
                      />
                    ))}
                  </div>
                )}
                <div className="mt-4 pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <div className="w-3 h-3 rounded border border-emerald-200 bg-emerald-50" />
                    <span>Placed</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                    <div className="w-3 h-3 rounded border border-indigo-200 bg-white" />
                    <span>Available</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Timetable Grid */}
            <div className="flex-1 overflow-x-auto">
              <div className="min-w-[700px]">
                {/* Header Row */}
                <div className="grid grid-cols-[70px_repeat(5,1fr)] gap-1 mb-1">
                  <div className="text-xs font-medium text-gray-400 flex items-end pb-2" />
                  {DAYS.map((day, i) => (
                    <div key={i} className="text-center text-sm font-semibold text-gray-700 pb-2">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Period Rows */}
                {PERIODS.map((p) => (
                  <div key={p.period} className="grid grid-cols-[70px_repeat(5,1fr)] gap-1 mb-1">
                    {/* Time column */}
                    <div className="flex flex-col items-end justify-center pr-3">
                      <span className="text-xs font-medium text-gray-500">{p.start}</span>
                      <span className="text-[10px] text-gray-400">{p.end}</span>
                    </div>

                    {/* Day columns */}
                    {[0, 1, 2, 3, 4].map((day) => (
                      <TimetableCell
                        key={`${day}-${p.period}`}
                        day={day}
                        period={p.period}
                        slot={slots[`${day}-${p.period}`] || null}
                        onDrop={handleDrop}
                        onRemove={clearSlot}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </DndProvider>
      )}
    </div>
  );
}
