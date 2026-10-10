"use client";

import { useAuth } from "@/lib/auth/CookieAuthProvider";
import { useEffect, useState } from "react";
import { FileText, Loader2, Mail, Send, CheckCircle } from "lucide-react";
import { API_URL } from "@/lib/config";


export default function StaffCorrespondencePage() {
  // cookie auth: token always null
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
  // cookie auth
    (async () => {
      try {
        const res = await fetch(`${API_URL}/api/email/logs`, {
          credentials: "include",
        });
        const data = await res.json();
        if (data.success) setLogs(data.data || []);
      } catch { /* ignore */ }
      finally { setLoading(false); }
    })();
  }, []);

  const sendReminders = async () => {
    setSending(true);
    try {
      const res = await fetch(`${API_URL}/api/email/send-fee-reminders`, {
        method: "POST",
        credentials: "include", headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg(data.message || "Reminders sent!");
        setTimeout(() => setSuccessMsg(""), 4000);
      }
    } catch { /* ignore */ }
    finally { setSending(false); }
  };

  if (loading) {
    return <div className="text-center py-16"><Loader2 className="w-8 h-8 animate-spin mx-auto text-schoolhub-500" /></div>;
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-fraunces font-semibold text-brand-ink">Correspondence</h1>
        <p className="text-sm text-gray-500 font-sans">Manage email communications and reminders</p>
      </div>

      {/* Send reminders */}
      <div className="card p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
              <Mail className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 font-sans">Fee Reminders</h3>
              <p className="text-xs text-gray-500 font-sans">Send payment reminders to parents with outstanding balances</p>
            </div>
          </div>
          <button
            onClick={sendReminders}
            disabled={sending}
            className="flex items-center gap-2 px-4 py-2 bg-schoolhub-500 text-white rounded-lg text-sm font-medium font-sans hover:bg-schoolhub-600 transition-colors disabled:opacity-50"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {sending ? "Sending..." : "Send Reminders"}
          </button>
        </div>
        {successMsg && (
          <div className="mt-3 flex items-center gap-2 text-xs text-green-700 bg-green-50 px-3 py-2 rounded-lg font-sans">
            <CheckCircle className="w-4 h-4" />
            {successMsg}
          </div>
        )}
      </div>

      {/* Logs */}
      <div>
        <h2 className="text-lg font-fraunces font-semibold text-brand-ink mb-3">Recent Communications</h2>
        {logs.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <FileText className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm font-sans">No communication logs yet.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {logs.map((l: any, i: number) => (
              <div key={i} className="card p-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900 font-sans">{l.subject || "Email"}</p>
                  <p className="text-xs text-gray-500 font-sans">To: {l.recipient} · {new Date(l.createdAt).toLocaleDateString()}</p>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium font-sans ${l.status === "sent" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                  {l.status || "Sent"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
