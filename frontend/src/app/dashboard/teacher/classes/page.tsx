"use client";

import { useAuth } from "@/lib/auth/CookieAuthProvider";
import { useEffect, useState } from "react";
import { GraduationCap, Loader2, BookOpen, Users } from "lucide-react";
import { API_URL } from "@/lib/config";


interface ClassInfo {
  id: string;
  name: string;
  armCount?: number;
  studentCount?: number;
}

interface ClassArm {
  id: string;
  name: string;
  studentCount?: number;
}

export default function TeacherClasses() {
  // cookie auth: token always null
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        // Teacher-scoped source: only arms/subjects linked to this teacher.
        const res = await fetch(`${API_URL}/api/teacher/setup`, {
          credentials: "include",
        });
        const data = await res.json();
        if (data.success) {
          const assignments = data.data?.assignments || [];
          const byArm = new Map<string, { id: string; name: string; armCount: number }>();
          for (const a of assignments) {
            const arm = a.arm;
            if (!arm?.id) continue;
            const className = arm.class?.name || "Class";
            const key = arm.id;
            if (!byArm.has(key)) {
              byArm.set(key, {
                id: className,
                name: `${className} ${arm.name || ""}`.trim(),
                armCount: 1,
              });
            }
          }
          setClasses(Array.from(byArm.values()));
        } else {
          setClasses([]);
        }
      } catch (e) {
        console.error(e);
        setClasses([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <div className="text-center py-20"><Loader2 className="w-8 h-8 animate-spin mx-auto text-schoolhub-500" /></div>;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-brand-ink font-fraunces">My Classes</h1>
        <p className="text-sm text-gray-500 font-sans mt-0.5">Classes assigned to you</p>
      </div>

      {classes.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <GraduationCap className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="font-sans">No classes assigned yet.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {classes.map((cls) => (
            <div key={cls.id} className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-schoolhub-50 rounded-xl flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-schoolhub-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 font-sans text-sm">{cls.name}</h3>
                  <p className="text-xs text-gray-500 font-sans">{cls.armCount} arm(s)</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500 font-sans">
                <Users className="w-4 h-4" />
                <span>{cls.studentCount} students</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
