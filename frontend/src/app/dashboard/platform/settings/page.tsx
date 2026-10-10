"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth/CookieAuthProvider";
import { useRouter } from "next/navigation";
import {
  Settings, Save, Loader2, Globe,
  DollarSign, MessageSquare, Shield,
} from "lucide-react";
import { API_URL } from "@/lib/config";
import { csrfHeaders, extractApiErrorMessage } from "@/lib/utils";


export default function PlatformSettingsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [settings, setSettings] = useState({
    portalFeePercent: 2.5,
    maintenanceMode: false,
    emailNotifications: true,
    inAppNotifications: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user || user.role !== "SUPER_ADMIN") {
      router.push("/dashboard/admin");
      return;
    }
    fetchSettings();
  }, [user]);

  const fetchSettings = async () => {
    try {
      const res = await fetch(`${API_URL}/api/platform/settings`, { credentials: "include", headers: csrfHeaders() });
      const data = await res.json();
      if (data.success && data.data) {
        setSettings({
          portalFeePercent: data.data.portalFeePercent ?? 2.5,
          maintenanceMode: data.data.maintenanceMode ?? false,
          emailNotifications: data.data.emailNotifications ?? true,
          inAppNotifications: data.data.inAppNotifications ?? true,
        });
      }
    } catch {} finally {
      setLoading(false);
    }
  };

  const saveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    setError("");
    try {
      const res = await fetch(`${API_URL}/api/platform/settings`, {
        method: "PATCH",
        credentials: "include",
        headers: csrfHeaders(),
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (data.success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        setError(extractApiErrorMessage(data.error, "Failed to save settings"));
      }
    } catch {
      setError("Could not connect to server");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 text-amber-500 animate-spin" /></div>;

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-[var(--heading-color)]">Platform Settings</h1>
        <p className="text-[var(--text-muted)] mt-1">Configure global platform parameters</p>
      </div>

      {error && (
        <div role="alert" className="text-sm p-3 rounded-lg bg-red-50 text-red-700 border border-red-100">
          {error}
        </div>
      )}

      <form onSubmit={saveSettings} className="space-y-6">
        <div className="bg-[var(--card-bg)] rounded-xl border border-[var(--card-border)] p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-amber-50"><DollarSign className="w-5 h-5 text-amber-600" /></div>
            <div>
              <h2 className="text-sm font-semibold text-[var(--heading-color)]">Portal Fee Configuration</h2>
              <p className="text-xs text-[var(--text-muted)]">Percentage deducted per student payment</p>
            </div>
          </div>
          <div className="max-w-xs">
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="portalFeePercent">Portal Fee (%)</label>
            <div className="relative">
              <input
                id="portalFeePercent"
                type="number"
                step="0.1"
                min="0"
                max="100"
                className="w-full px-3 py-2 border border-[var(--border)] rounded-lg text-sm bg-[var(--surface)] text-[var(--text)]"
                value={settings.portalFeePercent}
                onChange={e => setSettings({ ...settings, portalFeePercent: Number(e.target.value) })}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">%</span>
            </div>
            <p className="text-xs text-gray-400 mt-1">Current: {settings.portalFeePercent}% per transaction</p>
          </div>
        </div>

        <div className="bg-[var(--card-bg)] rounded-xl border border-[var(--card-border)] p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-blue-50"><MessageSquare className="w-5 h-5 text-blue-600" /></div>
            <div>
              <h2 className="text-sm font-semibold text-[var(--heading-color)]">Parent Notifications</h2>
              <p className="text-xs text-[var(--text-muted)]">Free channels only. No paid SMS provider required.</p>
            </div>
          </div>
          <div className="space-y-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                className="mt-1"
                checked={settings.emailNotifications}
                onChange={e => setSettings({ ...settings, emailNotifications: e.target.checked })}
              />
              <span>
                <span className="block text-sm font-medium text-[var(--text)]">Email notifications</span>
                <span className="block text-xs text-[var(--text-muted)]">Send notices, fee reminders, and attendance alerts by email</span>
              </span>
            </label>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                className="mt-1"
                checked={settings.inAppNotifications}
                onChange={e => setSettings({ ...settings, inAppNotifications: e.target.checked })}
              />
              <span>
                <span className="block text-sm font-medium text-[var(--text)]">In-app notifications</span>
                <span className="block text-xs text-[var(--text-muted)]">Show alerts inside SchoolPilot for staff and parents</span>
              </span>
            </label>
          </div>
        </div>

        <div className="bg-[var(--card-bg)] rounded-xl border border-[var(--card-border)] p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-red-50"><Shield className="w-5 h-5 text-red-600" /></div>
            <div>
              <h2 className="text-sm font-semibold text-[var(--heading-color)]">Maintenance Mode</h2>
              <p className="text-xs text-[var(--text-muted)]">When enabled, only Super Admins can access the platform</p>
            </div>
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <div className="relative">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={settings.maintenanceMode}
                onChange={e => setSettings({ ...settings, maintenanceMode: e.target.checked })}
              />
              <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-red-500 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">
                {settings.maintenanceMode ? "Maintenance Mode is ON" : "Maintenance Mode is OFF"}
              </p>
              <p className="text-xs text-gray-400">
                {settings.maintenanceMode
                  ? "All users except Super Admins will see a maintenance page"
                  : "All users can access the platform normally"}
              </p>
            </div>
          </label>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 text-sm font-medium disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Settings
          </button>
          {saved && (
            <span className="flex items-center gap-1 text-sm text-emerald-600" role="status">
              <Globe className="w-4 h-4" /> Settings saved successfully
            </span>
          )}
        </div>
      </form>
    </div>
  );
}
