"use client";

import { useAuth } from "@/lib/auth/CookieAuthProvider";
import { useEffect, useState } from "react";
import { ClipboardCheck, Loader2, BookOpen, ArrowRight } from "lucide-react";
import { API_URL } from "@/lib/config";


export default function StudentTasksPage() {
  // cookie auth: token always null
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
  // cookie auth
    (async () => {
      try {
        const res = await fetch(`${API_URL}/api/ai/homework`, {
          credentials: "include",
        });
        const data = await res.json();
        if (data.success) setTasks(data.data || []);
      } catch { /* ignore */ }
      finally { setLoading(false); }
    })();
  }, []);

  if (loading) {
    return <div className="text-center py-16"><Loader2 className="w-8 h-8 animate-spin mx-auto text-schoolhub-500" /></div>;
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-fraunces font-semibold text-brand-ink">My Tasks</h1>
        <p className="text-sm text-gray-500 font-sans">Homework assignments and pending work</p>
      </div>

      {tasks.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <ClipboardCheck className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="font-sans">No pending tasks. You&apos;re all caught up!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map((t: any, i: number) => (
            <div key={i} className="card p-4 flex items-start gap-3">
              <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <BookOpen className="w-5 h-5 text-amber-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 font-sans">{t.topic || "Assignment"}</p>
                <p className="text-xs text-gray-500 font-sans">{t.subjectName || "Subject"} · Week {t.weekNumber}</p>
                {t.homework?.map((hw: any, hi: number) => (
                  <p key={hi} className="text-xs text-gray-600 mt-1 font-sans">{hi + 1}. {hw.question}</p>
                ))}
                <p className="text-[10px] text-gray-400 mt-1 font-sans">Set: {new Date(t.createdAt).toLocaleDateString()}</p>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
