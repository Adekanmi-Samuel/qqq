"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";

interface ProfileData {
  id: string;
  fullName: string;
  email: string;
  role: string;
  schoolId?: string | null;
  schoolName?: string | null;
}

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  SCHOOL_ADMIN: "School Admin",
  PRINCIPAL: "Principal",
  TEACHER: "Teacher",
  BURSAR: "Bursar",
  PARENT: "Parent",
  STUDENT: "Student",
};

export default function ProfileSettings() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("success");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const data = await api.get<ProfileData>("/api/profile");
        if (!active) return;
        setProfile(data);
        setFullName(data.fullName ?? "");
        setEmail(data.email ?? "");
      } catch (err: any) {
        if (!active) return;
        setLoadError(err?.message || "We could not load your profile. Please refresh the page.");
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;

    setMessage("");
    const errors: Record<string, string> = {};
    const trimmedName = fullName.trim();
    const trimmedEmail = email.trim();

    if (trimmedName.length < 2) {
      errors.fullName = "Enter your full name (at least 2 characters).";
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      errors.email = "Enter a valid email address.";
    }
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});

    // Nothing changed: avoid an empty round trip
    if (trimmedName === profile.fullName && trimmedEmail === profile.email) {
      setMessageType("success");
      setMessage("Your profile is already up to date.");
      return;
    }

    setSaving(true);
    try {
      const updated = await api.patch<ProfileData>("/api/profile", {
        fullName: trimmedName,
        email: trimmedEmail,
      });
      setProfile((p) => (p ? { ...p, ...updated } : updated));
      setFullName(updated.fullName ?? trimmedName);
      setEmail(updated.email ?? trimmedEmail);
      setMessageType("success");
      setMessage("Profile updated successfully.");
    } catch (err: any) {
      setMessageType("error");
      const text = err?.message || "We could not save your profile. Please try again.";
      setMessage(text);
      // Surface field-specific server validation where possible
      if (/email/i.test(text)) setFieldErrors({ email: text });
      if (/name/i.test(text)) setFieldErrors({ fullName: text });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div>
        <Skeleton className="h-6 w-40 mb-2" />
        <Skeleton className="h-4 w-64 mb-6" />
        <div className="space-y-4 max-w-lg">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-1">My Profile</h2>
        <p className="text-sm text-gray-500 mb-4">
          Update your personal account information.
        </p>
        <div role="alert" className="text-sm rounded-lg border border-red-200 bg-red-50 text-red-700 px-4 py-3 max-w-lg">
          {loadError}
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 mb-1">My Profile</h2>
      <p className="text-sm text-gray-500 mb-6">
        Update your personal account information. Your role and school are managed by your school admin.
      </p>

      {message && (
        <div
          role="status"
          aria-live="polite"
          className={`mb-4 max-w-lg text-sm rounded-lg border px-4 py-3 ${
            messageType === "success"
              ? "border-green-200 bg-green-50 text-green-700"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 max-w-lg" noValidate>
        <div>
          <label htmlFor="profileFullName" className="label">Full name</label>
          <input
            id="profileFullName"
            name="name"
            type="text"
            autoComplete="name"
            className="input-field"
            value={fullName}
            onChange={(e) => {
              setFullName(e.target.value);
              if (fieldErrors.fullName) setFieldErrors((f) => ({ ...f, fullName: "" }));
            }}
            maxLength={100}
            aria-invalid={!!fieldErrors.fullName}
            aria-describedby={fieldErrors.fullName ? "profileFullName-error" : undefined}
            required
          />
          {fieldErrors.fullName && (
            <p id="profileFullName-error" className="text-xs text-red-600 mt-1">
              {fieldErrors.fullName}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="profileEmail" className="label">Email address</label>
          <input
            id="profileEmail"
            name="email"
            type="email"
            autoComplete="email"
            className="input-field"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (fieldErrors.email) setFieldErrors((f) => ({ ...f, email: "" }));
            }}
            aria-invalid={!!fieldErrors.email}
            aria-describedby={fieldErrors.email ? "profileEmail-error" : undefined}
            required
          />
          {fieldErrors.email && (
            <p id="profileEmail-error" className="text-xs text-red-600 mt-1">
              {fieldErrors.email}
            </p>
          )}
        </div>

        <div>
          <label className="label">Role</label>
          <input
            type="text"
            className="input-field bg-gray-50 text-gray-500"
            value={ROLE_LABELS[profile?.role || ""] || profile?.role || ""}
            readOnly
            disabled
            aria-readonly="true"
          />
        </div>

        {profile?.schoolName && (
          <div>
            <label className="label">School</label>
            <input
              type="text"
              className="input-field bg-gray-50 text-gray-500"
              value={profile.schoolName}
              readOnly
              disabled
              aria-readonly="true"
            />
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          className="btn-primary inline-flex items-center gap-2"
        >
          {saving && (
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" aria-hidden="true" />
          )}
          {saving ? "Saving..." : "Save profile"}
        </button>
      </form>
    </div>
  );
}
