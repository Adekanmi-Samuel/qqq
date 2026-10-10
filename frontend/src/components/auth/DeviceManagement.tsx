"use client";

import { useState, useEffect } from "react";
import { RefreshCw, Trash2, Smartphone, Monitor, Tablet, AlertTriangle, Check } from "lucide-react";

interface Session {
  id: string;
  deviceId: string;
  userAgent: string;
  ipAddress: string;
  lastActiveAt: string;
  isCurrent: boolean;
  createdAt: string;
}

function parseUserAgent(ua: string) {
  const browser = ua.match(/(Chrome|Firefox|Safari|Edge|Opera|MSIE|Trident)\/[\d.]+/i)?.[0] || "Unknown Browser";
  const os = ua.match(/(Windows|Mac OS|Linux|Android|iOS|iPhone|iPad)[\s\d.]*/i)?.[0] || "Unknown OS";
  let deviceType = "Desktop";
  if (/Android|iPhone|iPad|iPod|Mobile/i.test(ua)) {
    deviceType = /iPad|Tablet/i.test(ua) ? "Tablet" : "Mobile";
  }
  return { browser, os, deviceType };
}

function getDeviceIcon(ua: string) {
  const { deviceType } = parseUserAgent(ua);
  const cls = "w-5 h-5";
  if (deviceType === "Mobile") return <Smartphone className={cls} style={{ color: "var(--text-muted)" }} />;
  if (deviceType === "Tablet") return <Tablet className={cls} style={{ color: "var(--text-muted)" }} />;
  return <Monitor className={cls} style={{ color: "var(--text-muted)" }} />;
}

function formatRelativeTime(dateString: string) {
  const diff = Date.now() - new Date(dateString).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(dateString).toLocaleDateString();
}

export function DeviceManagement() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmRevokeAll, setShowConfirmRevokeAll] = useState(false);

  useEffect(() => {
    // Mock sessions for now   will be wired to API later
    setSessions([
      { id: "1", deviceId: "dev1", userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0", ipAddress: "197.210.65.42", lastActiveAt: new Date().toISOString(), isCurrent: true, createdAt: new Date(Date.now() - 86400000).toISOString() },
      { id: "2", deviceId: "dev2", userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0) Safari/605.1.15", ipAddress: "41.204.72.18", lastActiveAt: new Date(Date.now() - 7200000).toISOString(), isCurrent: false, createdAt: new Date(Date.now() - 604800000).toISOString() },
    ]);
    setLoading(false);
  }, []);

  const handleRevokeSession = (sessionId: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== sessionId));
  };

  const handleRevokeAll = () => {
    setSessions((prev) => prev.filter((s) => s.isCurrent));
    setShowConfirmRevokeAll(false);
  };

  if (loading) {
    return (
      <div className="sh-card p-6 flex items-center justify-center">
        <RefreshCw className="w-6 h-6 animate-spin" style={{ color: "var(--text-muted)" }} />
      </div>
    );
  }

  const otherSessions = sessions.filter((s) => !s.isCurrent);

  return (
    <div className="sh-card overflow-hidden">
      <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: "var(--border)" }}>
        <div>
          <h3 className="text-lg font-semibold" style={{ color: "var(--heading-color)" }}>Active Sessions</h3>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>Manage your active sessions across devices</p>
        </div>
        {otherSessions.length > 0 && (
          <button onClick={() => setShowConfirmRevokeAll(true)} className="btn text-xs bg-red-50 text-red-600 hover:bg-red-100 border border-red-200">
            Revoke All Others
          </button>
        )}
      </div>

      <div className="divide-y" style={{ borderColor: "var(--border)" }}>
        {sessions.map((session) => {
          const { browser, os, deviceType } = parseUserAgent(session.userAgent);
          return (
            <div key={session.id} className="p-4 flex items-start gap-4">
              <div className="flex-shrink-0 mt-1">{getDeviceIcon(session.userAgent)}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm" style={{ color: "var(--text)" }}>{deviceType} · {os}</span>
                  {session.isCurrent && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-emerald-500/10 text-emerald-700 rounded-full">
                      <Check className="w-3 h-3" /> Current
                    </span>
                  )}
                </div>
                <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>{browser}</p>
                <div className="flex items-center gap-4 mt-1 text-xs" style={{ color: "var(--text-muted)", opacity: 0.7 }}>
                  <span>IP: {session.ipAddress}</span>
                  <span>Last active: {formatRelativeTime(session.lastActiveAt)}</span>
                </div>
              </div>
              {!session.isCurrent && (
                <button onClick={() => handleRevokeSession(session.id)} className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors" title="Revoke">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          );
        })}
        {sessions.length === 0 && (
          <div className="p-6 text-center" style={{ color: "var(--text-muted)" }}>No active sessions</div>
        )}
      </div>

      {showConfirmRevokeAll && (
        <div className="modal-overlay" onClick={() => setShowConfirmRevokeAll(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-red-100">
                <AlertTriangle size={20} className="text-red-600" />
              </div>
              <div>
                <h3 className="font-bold" style={{ color: "var(--heading-color)" }}>Revoke All Other Sessions?</h3>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>This will sign you out from all other devices.</p>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setShowConfirmRevokeAll(false)} className="btn btn-ghost">Cancel</button>
              <button onClick={handleRevokeAll} className="btn btn-danger">Revoke All</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
