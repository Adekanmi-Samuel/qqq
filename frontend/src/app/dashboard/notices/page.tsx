"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth/CookieAuthProvider";
import { useApi } from "@/hooks/useApi";
import { formatDate } from "@/lib/utils";

interface Notice {
  id: string;
  title: string;
  body: string;
  targetType: string;
  publishedAt: string | null;
  createdAt: string;
}

export default function NoticesPage() {
  const { user, token } = useAuth();
  const { get, post, loading } = useApi();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const [form, setForm] = useState({
    title: "",
    body: "",
    targetType: "ALL",
    targetId: "",
    publishNow: true,
  });

  const loadNotices = async () => {
    setPageLoading(true);
    const data = await get<{ success: boolean; data: Notice[] }>("/api/notices");
    if (data?.success) setNotices(data.data);
    setPageLoading(false);
  };

  useEffect(() => {
    if (token) loadNotices();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.body.trim()) return;

    setSaving(true);
    setMessage("");

    const res = await post<{ success: boolean }>("/api/notices", {
      schoolId: user?.school?.id || "",
      title: form.title,
      body: form.body,
      targetType: form.targetType as "ALL" | "CLASS" | "ARM",
      targetId: form.targetId || undefined,
      publishNow: form.publishNow,
    });

    if (res?.success) {
      setMessage("✅ Notice published successfully!");
      setForm({ title: "", body: "", targetType: "ALL", targetId: "", publishNow: true });
      setShowForm(false);
      loadNotices();
    } else {
      setMessage("❌ Failed to publish notice.");
    }
    setSaving(false);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notices</h1>
          <p className="text-sm text-gray-500 mt-1">
            Post announcements for parents, staff, and students
          </p>
        </div>
        <button className="btn-primary text-sm" onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancel" : "+ New Notice"}
        </button>
      </div>

      {message && (
        <div className={`text-sm mb-4 p-3 rounded-lg ${message.includes("✅") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
          {message}
        </div>
      )}

      {showForm && (
        <div className="card mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Create Notice
          </h2>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="noticeTitle" className="label">Title</label>
              <input
                id="noticeTitle"
                type="text"
                className="input-field"
                placeholder="e.g. Resumption date for next term"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
              />
            </div>
            <div>
              <label htmlFor="noticeBody" className="label">Message</label>
              <textarea
                id="noticeBody"
                rows={4}
                className="input-field"
                placeholder="Write your announcement..."
                value={form.body}
                onChange={(e) => setForm({ ...form, body: e.target.value })}
                required
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="targetType" className="label">Send to</label>
                <select
                  id="targetType"
                  className="input-field"
                  value={form.targetType}
                  onChange={(e) => setForm({ ...form, targetType: e.target.value })}
                >
                  <option value="ALL">Everyone</option>
                  <option value="CLASS">Specific Class</option>
                  <option value="ARM">Specific Arm</option>
                </select>
              </div>
              <div>
                <label htmlFor="targetId" className="label">
                  Class/Arm <span className="text-gray-400">(if applicable)</span>
                </label>
                <select
                  id="targetId"
                  className="input-field"
                  disabled={form.targetType === "ALL"}
                  value={form.targetId}
                  onChange={(e) => setForm({ ...form, targetId: e.target.value })}
                >
                  <option value="">Select class or arm</option>
                  {["JSS 1","JSS 2","JSS 3","SS 1","SS 2","SS 3"].map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex items-center gap-4 pt-2">
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? "Publishing..." : "Publish Notice"}
              </button>
              <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        {notices.length > 0 ? "Recent Notices" : ""}
      </h2>

      {pageLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="h-5 bg-gray-200 rounded w-48 mb-2" />
              <div className="h-4 bg-gray-100 rounded w-full mb-1" />
              <div className="h-4 bg-gray-100 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : notices.length === 0 ? (
        <div className="space-y-3">
          <div className="card text-center py-8 text-gray-400">
            <p className="text-lg mb-2">📢</p>
            <p>No notices published yet</p>
            <p className="text-xs mt-1">Your first notice will appear here</p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {notices.map((notice) => (
            <div key={notice.id} className="card">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-gray-900">{notice.title}</h3>
                <div className="flex items-center gap-2">
                  {notice.publishedAt && (
                    <span className="badge-green text-[10px]">Published</span>
                  )}
                  <span className="text-xs text-gray-400">
                    {formatDate(notice.createdAt)}
                  </span>
                </div>
              </div>
              <p className="text-sm text-gray-600">{notice.body}</p>
              <div className="mt-2 flex items-center gap-2">
                <span className="text-xs text-gray-400">Target: {notice.targetType}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
