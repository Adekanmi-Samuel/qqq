"use client";

import { useAuth } from "@/lib/auth/CookieAuthProvider";
import { useEffect, useState } from "react";
import { Bell, Loader2, Calendar, Paperclip } from "lucide-react";
import { API_URL } from "@/lib/config";


export default function ParentNoticesPage() {
  // cookie auth: token always null
  const [notices, setNotices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
  // cookie auth
    (async () => {
      try {
        const res = await fetch(`${API_URL}/api/notices`, {
          credentials: "include",
        });
        const data = await res.json();
        if (data.success) setNotices(data.data || []);
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
        <h1 className="text-2xl font-fraunces font-semibold text-brand-ink">School Notices</h1>
        <p className="text-sm text-gray-500 font-sans">Announcements from your child&apos;s school</p>
      </div>

      {notices.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Bell className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="font-sans">No notices at this time.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {notices.map((n: any) => (
            <div key={n.id} className="card p-5">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Bell className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-gray-900 font-sans">{n.title}</h3>
                  <p className="text-xs text-gray-500 mt-1 font-sans flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {n.publishedAt ? new Date(n.publishedAt).toLocaleDateString() : new Date(n.createdAt).toLocaleDateString()}
                  </p>
                  <div className="mt-2 text-sm text-gray-700 leading-relaxed font-sans whitespace-pre-wrap">
                    {n.body}
                  </div>
                  {n.attachmentUrl && (
                    <a
                      href={n.attachmentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 mt-2 text-xs text-schoolhub-600 hover:underline font-sans"
                    >
                      <Paperclip className="w-3 h-3" />
                      View Attachment
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
