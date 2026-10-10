"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth/CookieAuthProvider";
import { NIGERIAN_STATES, NIGERIAN_LGAS } from "@/lib/nigeria";
import { API_URL } from "@/lib/config";
import ProfileSettings from "@/components/ProfileSettings";


export default function SettingsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [schoolId, setSchoolId] = useState("");

  const [form, setForm] = useState({
    name: "",
    address: "",
    phone: "",
    email: "",
    state: "",
    lga: "",
  });

  useEffect(() => {
    async function load() {
      try {
  // cookie auth
        const meRes = await fetch(`${API_URL}/api/auth/me`, {
          credentials: "include",
        });
        const meData = await meRes.json();
        const school = meData.data?.school;
        if (!school) return;

        setSchoolId(school.id);

        // Fetch full school details
        const schoolRes = await fetch(`${API_URL}/api/schools/${school.slug}`);
        const schoolData = await schoolRes.json();
        if (schoolData.success) {
          const s = schoolData.data;
          setForm({
            name: s.name || "",
            address: s.address || "",
            phone: s.phone || "",
            email: s.email || "",
            state: s.state || "",
            lga: s.lga || "",
          });
        }
      } catch {} finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      const res = await fetch(`${API_URL}/api/schools/${schoolId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
                  },
        body: JSON.stringify({
          name: form.name,
          address: form.address,
          phone: form.phone,
          email: form.email,
          state: form.state,
          lga: form.lga,
        }),
      });
      const data = await res.json();
      setMessage(data.success ? "School profile updated successfully!" : data.error || "Update failed.");
    } catch {
      setMessage("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-gray-300 border-t-schoolhub-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-500 text-sm mt-1">
            Manage your personal account and your school&apos;s information.
          </p>
        </div>
      </div>

      <div className="grid gap-8">
        {/* My Profile (personal account) */}
        <div className="card">
          <ProfileSettings />
        </div>

        {/* School Information */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">School Information</h2>
          <form onSubmit={handleSave} className="space-y-4 max-w-lg">
            <div>
              <label htmlFor="schoolName" className="label">School name</label>
              <input
                id="schoolName"
                type="text"
                className="input-field"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                required
              />
            </div>
            <div>
              <label htmlFor="address" className="label">Address</label>
              <textarea
                id="address"
                className="input-field"
                rows={2}
                value={form.address}
                onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">State</label>
                <select
                  className="input-field"
                  value={form.state}
                  onChange={(e) => setForm((f) => ({ ...f, state: e.target.value, lga: "" }))}
                >
                  <option value="">Select state</option>
                  {NIGERIAN_STATES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">LGA</label>
                <select
                  className="input-field"
                  value={form.lga}
                  onChange={(e) => setForm((f) => ({ ...f, lga: e.target.value }))}
                  disabled={!form.state}
                >
                  <option value="">{form.state ? "Select LGA" : "Select state first"}</option>
                  {(form.state ? NIGERIAN_LGAS[form.state] || [] : []).map((l) => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="phone" className="label">Phone number</label>
                <input
                  id="phone"
                  type="tel"
                  className="input-field"
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                />
              </div>
              <div>
                <label htmlFor="email" className="label">Email address</label>
                <input
                  id="email"
                  type="email"
                  className="input-field"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                />
              </div>
            </div>

            {message && (
              <p className={`text-sm font-medium ${message.includes("success") ? "text-green-600" : "text-red-600"}`}>
                {message}
              </p>
            )}

            <button
              type="submit"
              disabled={saving}
              className="btn-primary inline-flex items-center gap-2"
            >
              {saving && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              Save changes
            </button>
          </form>
        </div>

        {/* School Logo */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">School Logo</h2>
          <p className="text-sm text-gray-500 mb-4">
            Upload your school logo. Recommended size: 200×200px.
          </p>
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400 text-3xl">
              🏫
            </div>
            <div>
              <button className="btn-secondary text-sm" type="button">
                Upload logo
              </button>
              <p className="text-xs text-gray-400 mt-1">PNG or JPG. Max 2MB.</p>
            </div>
          </div>
        </div>

        {/* School Slug (read-only) */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Public Profile</h2>
          <div>
            <label className="label">School profile URL</label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">schoolpilot.ng/school?slug=</span>
              <span className="text-sm font-medium text-gray-900">your-school-name</span>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Share this link with parents so they can view your school profile.
            </p>
          </div>
        </div>

        {/* Verification Status */}
        <div className="card border-accent-200 bg-accent-50/50">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-accent-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <span className="text-accent-700 text-xl">⏳</span>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-1">School not yet verified</h2>
              <p className="text-sm text-gray-600 mb-3">
                Your school is pending verification. Once verified, you&apos;ll get a &quot;SchoolPilot Verified&quot;
                badge on your public profile and unlock all features.
              </p>
              <p className="text-xs text-gray-500">
                Verification usually takes 1–2 business days. Contact support if it&apos;s been longer.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
