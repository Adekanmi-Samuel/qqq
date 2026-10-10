"use client";

import { useAuth } from "@/lib/auth/CookieAuthProvider";
import { useEffect, useState } from "react";
import { Bell, Loader2, Calendar, Megaphone, AlertCircle } from "lucide-react";
import { API_URL } from "@/lib/config";


interface Notice {
  id: string;
  title: string;
  body: string;
  targetType: string;
  createdAt: string;
  author?: { fullName: string };
}

export default function TeacherNotices() {
  // cookie auth: token always null
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
  // cookie auth
    loadNotices();
  }, []);

  async function loadNotices() {
    try {
      const res = await fetch(`${API_URL}/api/notices`, {
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) setNotices(data.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div className="text-center py-20"><Loader2 className="w-8 h-8 animate-spin mx-auto text-schoolhub-500" /></div>;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-brand-ink font-fraunces">Notices</h1>
        <p className="text-sm text-gray-500 font-sans mt-0.5">School announcements and notices</p>
      </div>

      {notices.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <Bell className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="font-sans">No notices yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {notices.map((notice) => (
            <div key={notice.id} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 hover:shadow-sm transition-shadow">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 bg-schoolhub-50 dark:bg-schoolhub-950 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Megaphone className="w-4 h-4 text-schoolhub-600 dark:text-schoolhub-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 font-sans text-sm">{notice.title}</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-sans mt-0.5 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(notice.createdAt).toLocaleDateString("en-NG", {
                      day: "numeric", month: "short", year: "numeric",
                    })}
                    {notice.author && <span>· {notice.author.fullName}</span>}
                  </p>
                  <div className="mt-3 text-sm text-gray-700 dark:text-gray-300 font-sans leading-relaxed whitespace-pre-wrap">
                    {notice.body}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
