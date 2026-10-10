"use client";

import { DeviceManagement } from "@/components/auth/DeviceManagement";
import { Shield, Lock, User, AlertTriangle } from "lucide-react";

export default function SecurityPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-3" style={{ color: "var(--heading-color)" }}>
          <Shield size={28} className="text-sh-green-700" />
          Security Settings
        </h1>
        <p className="mt-2" style={{ color: "var(--text-muted)" }}>Manage your account security and active sessions</p>
      </div>

      {/* Account Security */}
      <div className="sh-card p-6">
        <h2 className="text-lg font-semibold flex items-center gap-2 mb-4" style={{ color: "var(--heading-color)" }}>
          <Lock size={20} style={{ color: "var(--text-muted)" }} />
          Account Security
        </h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 rounded-xl" style={{ backgroundColor: "var(--surface-2, var(--bg))" }}>
            <div>
              <p className="font-medium text-sm" style={{ color: "var(--text)" }}>Password</p>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>Last changed: Unknown</p>
            </div>
            <button className="btn btn-secondary text-xs">Change Password</button>
          </div>
          <div className="flex items-center justify-between p-4 rounded-xl" style={{ backgroundColor: "var(--surface-2, var(--bg))" }}>
            <div>
              <p className="font-medium text-sm" style={{ color: "var(--text)" }}>Two-Factor Authentication</p>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>Add an extra layer of security</p>
            </div>
            <button className="btn btn-ghost text-xs opacity-50 cursor-not-allowed">Coming Soon</button>
          </div>
        </div>
      </div>

      {/* Active Sessions */}
      <div>
        <h2 className="text-lg font-semibold flex items-center gap-2 mb-4" style={{ color: "var(--heading-color)" }}>
          <User size={20} style={{ color: "var(--text-muted)" }} />
          Active Sessions
        </h2>
        <DeviceManagement />
      </div>

      {/* Security Alerts */}
      <div className="sh-card p-6">
        <h2 className="text-lg font-semibold flex items-center gap-2 mb-4" style={{ color: "var(--heading-color)" }}>
          <AlertTriangle size={20} className="text-sh-amber-500" />
          Security Alerts
        </h2>
        <div className="space-y-3">
          <div className="p-4 rounded-xl bg-sh-amber-500/10 border border-sh-amber-500/20">
            <p className="text-sm text-sh-amber-700">
              <strong>Note:</strong> You will receive email notifications for suspicious login attempts from new devices.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-sh-blue-50 border border-sh-blue-600/20">
            <p className="text-sm text-sh-blue-600">
              <strong>Tip:</strong> Regularly review your active sessions and revoke any you don't recognize.
            </p>
          </div>
        </div>
      </div>

      {/* Cookie Preferences */}
      <div className="sh-card p-6">
        <h2 className="text-lg font-semibold mb-4" style={{ color: "var(--heading-color)" }}>Cookie Preferences</h2>
        <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>Manage how we use cookies on your device</p>
        <button
          onClick={() => {
            localStorage.removeItem("schoolhub_cookie_consent");
            document.cookie = "sh_consent=; path=/; max-age=0";
            window.location.reload();
          }}
          className="btn btn-secondary text-xs"
        >
          Manage Cookie Preferences
        </button>
      </div>
    </div>
  );
}
