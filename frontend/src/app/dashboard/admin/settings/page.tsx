"use client";

import { useState, useEffect, useCallback, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Settings, Save, School, Bell, Shield, Globe, Users,
  GraduationCap, CreditCard, Check, X, Loader2, Upload,
  Plus, ChevronRight,
} from "lucide-react";
import { api } from "@/lib/api";
import SchoolLogo from "@/components/SchoolLogo";

/* ================================================================== */
/*  Types                                                              */
/* ================================================================== */

type TabId = "profile" | "academic" | "classes" | "staff" | "notifications" | "subscription";

interface SchoolProfile {
  id: string;
  name: string;
  motto: string;
  address: string;
  phone: string;
  email: string;
  logoUrl: string;
  schoolType: string;
}

interface AcademicYear {
  id: string;
  academicYear: string;
  term: number;
  startDate: string;
  endDate: string;
  midTermBreak: string;
  nextTermStart: string;
}

interface SchoolClass {
  id: string;
  name: string;
  arms: { id: string; name: string }[];
}

interface Subject {
  id: string;
  name: string;
  code: string;
  teachersCount: number;
}

interface StaffCounts {
  teachers: number;
  administrators: number;
  bursars: number;
  total: number;
}

interface NotificationSettings {
  emailNotifications: boolean;
  autoNotifyFeePayment: boolean;
  autoNotifyAttendance: boolean;
}

interface SubscriptionPlan {
  name: string;
  maxStudents: number;
  maxStaff: number;
  maxStorage: string;
  currentStudents: number;
  currentStaff: number;
}

/* ================================================================== */
/*  Tab configuration                                                  */
/* ================================================================== */

const TABS: { id: TabId; label: string; icon: ReactNode }[] = [
  { id: "profile", label: "School Profile", icon: <School className="w-4 h-4" /> },
  { id: "academic", label: "Academic Year", icon: <Globe className="w-4 h-4" /> },
  { id: "classes", label: "Classes & Subjects", icon: <GraduationCap className="w-4 h-4" /> },
  { id: "staff", label: "Staff", icon: <Users className="w-4 h-4" /> },
  { id: "notifications", label: "Notifications", icon: <Bell className="w-4 h-4" /> },
  { id: "subscription", label: "Subscription", icon: <CreditCard className="w-4 h-4" /> },
];

const SCHOOL_TYPES = ["Primary", "Secondary", "Combined"];

/* ================================================================== */
/*  Main component                                                     */
/* ================================================================== */

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState<TabId>("profile");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  /* ── Profile state ── */
  const [profile, setProfile] = useState<SchoolProfile>({
    id: "", name: "", motto: "", address: "", phone: "", email: "", logoUrl: "", schoolType: "",
  });
  const [savingProfile, setSavingProfile] = useState(false);

  /* ── Academic state ── */
  const [academic, setAcademic] = useState<AcademicYear>({
    id: "", academicYear: "2025/2026", term: 1, startDate: "", endDate: "", midTermBreak: "", nextTermStart: "",
  });
  const [savingAcademic, setSavingAcademic] = useState(false);

  /* ── Classes & Subjects state ── */
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [newClassName, setNewClassName] = useState("");
  const [newClassArm, setNewClassArm] = useState("");
  const [addingClass, setAddingClass] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState("");
  const [newSubjectCode, setNewSubjectCode] = useState("");
  const [addingSubject, setAddingSubject] = useState(false);

  /* ── Staff state ── */
  const [staffCounts, setStaffCounts] = useState<StaffCounts>({ teachers: 0, administrators: 0, bursars: 0, total: 0 });

  /* ── Notifications state ── */
  const [notifications, setNotifications] = useState<NotificationSettings>({
    emailNotifications: true,
    autoNotifyFeePayment: true,
    autoNotifyAttendance: true,
  });
  const [savingNotifications, setSavingNotifications] = useState(false);

  /* ── Subscription state ── */
  const [subscription, setSubscription] = useState<SubscriptionPlan>({
    name: "Free", maxStudents: 100, maxStaff: 10, maxStorage: "1 GB", currentStudents: 0, currentStaff: 0,
  });

  /* ================================================================== */
  /*  Data loading                                                       */
  /* ================================================================== */

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [schoolRes, calRes] = await Promise.allSettled([
        api.get<{ id: string; name: string; motto: string; address: string; phone: string; email: string; logoUrl: string; schoolType: string }>("/api/schools/me"),
        api.get<{ id: string; academicYear: string; term: number; startDate: string; endDate: string; midTermBreak: string; nextTermStart: string }>("/api/academic-calendar/current"),
      ]);

      if (schoolRes.status === "fulfilled" && schoolRes.value) {
        const s = schoolRes.value;
        setProfile({
          id: s.id || "",
          name: s.name || "",
          motto: s.motto || "",
          address: s.address || "",
          phone: s.phone || "",
          email: s.email || "",
          logoUrl: s.logoUrl || "",
          schoolType: s.schoolType || "",
        });
      }

      if (calRes.status === "fulfilled" && calRes.value) {
        const c = calRes.value;
        setAcademic({
          id: c.id || "",
          academicYear: c.academicYear || "2025/2026",
          term: c.term || 1,
          startDate: c.startDate ? c.startDate.slice(0, 10) : "",
          endDate: c.endDate ? c.endDate.slice(0, 10) : "",
          midTermBreak: c.midTermBreak ? c.midTermBreak.slice(0, 10) : "",
          nextTermStart: c.nextTermStart ? c.nextTermStart.slice(0, 10) : "",
        });
      }

      // Load classes and subjects (non-blocking if fail)
      const [classRes, subjectRes, staffRes] = await Promise.allSettled([
        api.get<{ id: string; name: string; arms: { id: string; name: string }[] }[]>("/api/classes"),
        api.get<{ id: string; name: string; code: string; teachersCount: number }[]>("/api/subjects"),
        api.get<{ teachers: number; administrators: number; bursars: number; total: number }>("/api/staff/counts"),
      ]);

      if (classRes.status === "fulfilled" && Array.isArray(classRes.value)) {
        setClasses(classRes.value);
      }
      if (subjectRes.status === "fulfilled" && Array.isArray(subjectRes.value)) {
        setSubjects(subjectRes.value);
      }
      if (staffRes.status === "fulfilled" && staffRes.value) {
        setStaffCounts(staffRes.value);
      }
    } catch {
      // Use defaults silently
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  /* ================================================================== */
  /*  Save handlers                                                      */
  /* ================================================================== */

  const handleSaveProfile = async () => {
    if (!profile.id) { setError("School ID not found."); return; }
    setSavingProfile(true);
    setError("");
    try {
      await api.patch(`/api/schools/${profile.id}`, {
        name: profile.name,
        motto: profile.motto,
        address: profile.address,
        phone: profile.phone,
        email: profile.email,
        logoUrl: profile.logoUrl,
        schoolType: profile.schoolType,
      });
      setSuccessMsg("School profile updated successfully.");
      setTimeout(() => setSuccessMsg(""), 3500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save school profile.");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSaveAcademic = async () => {
    setSavingAcademic(true);
    setError("");
    try {
      await api.patch("/api/academic-calendar/current", {
        academicYear: academic.academicYear,
        term: academic.term,
        startDate: academic.startDate || undefined,
        endDate: academic.endDate || undefined,
        midTermBreak: academic.midTermBreak || undefined,
        nextTermStart: academic.nextTermStart || undefined,
      });
      setSuccessMsg("Academic year settings updated.");
      setTimeout(() => setSuccessMsg(""), 3500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save academic settings.");
    } finally {
      setSavingAcademic(false);
    }
  };

  const handleAddClass = async () => {
    if (!newClassName.trim()) return;
    setAddingClass(true);
    setError("");
    try {
      const result = await api.post<{ id: string; name: string; arms: { id: string; name: string }[] }>("/api/classes", {
        name: newClassName.trim(),
        armName: newClassArm.trim() || undefined,
      });
      setClasses((prev) => {
        const exists = prev.find((c) => c.id === result.id);
        if (exists) return prev;
        return [...prev, result];
      });
      setNewClassName("");
      setNewClassArm("");
      setSuccessMsg("Class added successfully.");
      setTimeout(() => setSuccessMsg(""), 3500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to add class.");
    } finally {
      setAddingClass(false);
    }
  };

  const handleAddSubject = async () => {
    if (!newSubjectName.trim() || !newSubjectCode.trim()) return;
    setAddingSubject(true);
    setError("");
    try {
      const result = await api.post<{ id: string; name: string; code: string; teachersCount: number }>("/api/subjects", {
        name: newSubjectName.trim(),
        code: newSubjectCode.trim().toUpperCase(),
      });
      setSubjects((prev) => [...prev, result]);
      setNewSubjectName("");
      setNewSubjectCode("");
      setSuccessMsg("Subject added successfully.");
      setTimeout(() => setSuccessMsg(""), 3500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to add subject.");
    } finally {
      setAddingSubject(false);
    }
  };

  const handleSaveNotifications = async () => {
    setSavingNotifications(true);
    setError("");
    try {
      await api.patch("/api/schools/notifications", {
        emailNotifications: notifications.emailNotifications,
        autoNotifyFeePayment: notifications.autoNotifyFeePayment,
        autoNotifyAttendance: notifications.autoNotifyAttendance,
      });
      setSuccessMsg("Notification preferences saved.");
      setTimeout(() => setSuccessMsg(""), 3500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save notification settings.");
    } finally {
      setSavingNotifications(false);
    }
  };

  /* ================================================================== */
  /*  Loading skeleton                                                   */
  /* ================================================================== */

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="skeleton h-8 w-48 mb-2" />
        <div className="skeleton h-4 w-72 mb-6" />
        <div className="flex gap-2 mb-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="skeleton h-10 w-28 rounded-xl" />
          ))}
        </div>
        <div className="sh-card p-6 space-y-4">
          <div className="skeleton h-6 w-40" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i}>
                <div className="skeleton h-4 w-24 mb-2" />
                <div className="skeleton h-10 w-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  /* ================================================================== */
  /*  Render                                                             */
  /* ================================================================== */

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1
          className="text-2xl font-bold text-theme-heading flex items-center gap-2"
          style={{ fontFamily: "var(--font-display)" }}
        >
          <Settings className="w-6 h-6 text-[var(--brand)]" />
          System Settings
        </h1>
        <p className="text-sm text-theme-muted mt-1">
          Manage your school profile, academics, and platform configuration
        </p>
      </div>

      {/* Flash messages */}
      <FlashMessages error={error} success={successMsg} onClearError={() => setError("")} onClearSuccess={() => setSuccessMsg("")} />

      {/* Tab navigation */}
      <div className="mb-6 overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
        <div className="flex gap-1 min-w-max border-b border-[var(--border)]" role="tablist">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                relative flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap
                transition-colors duration-200 min-h-[44px]
                ${activeTab === tab.id
                  ? "text-[var(--brand)]"
                  : "text-[var(--text-muted)] hover:text-[var(--text)]"
                }
              `}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
              {activeTab === tab.id && (
                <motion.div
                  layoutId="settings-tab-indicator"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--brand)] rounded-full"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          {activeTab === "profile" && (
            <SchoolProfileTab profile={profile} setProfile={setProfile} onSave={handleSaveProfile} saving={savingProfile} setError={setError} />
          )}
          {activeTab === "academic" && (
            <AcademicYearTab academic={academic} setAcademic={setAcademic} onSave={handleSaveAcademic} saving={savingAcademic} />
          )}
          {activeTab === "classes" && (
            <ClassesTab
              classes={classes} subjects={subjects}
              newClassName={newClassName} setNewClassName={setNewClassName}
              newClassArm={newClassArm} setNewClassArm={setNewClassArm}
              onAddClass={handleAddClass} addingClass={addingClass}
              newSubjectName={newSubjectName} setNewSubjectName={setNewSubjectName}
              newSubjectCode={newSubjectCode} setNewSubjectCode={setNewSubjectCode}
              onAddSubject={handleAddSubject} addingSubject={addingSubject}
            />
          )}
          {activeTab === "staff" && (
            <StaffTab staffCounts={staffCounts} />
          )}
          {activeTab === "notifications" && (
            <NotificationsTab notifications={notifications} setNotifications={setNotifications} onSave={handleSaveNotifications} saving={savingNotifications} />
          )}
          {activeTab === "subscription" && (
            <SubscriptionTab subscription={subscription} />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/* ================================================================== */
/*  Flash Messages                                                     */
/* ================================================================== */

function FlashMessages({
  error, success, onClearError, onClearSuccess,
}: {
  error: string; success: string; onClearError: () => void; onClearSuccess: () => void;
}) {
  return (
    <div className="space-y-3 mb-6">
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-2 text-sm text-red-700 overflow-hidden"
            role="alert"
          >
            <Shield className="w-4 h-4 flex-shrink-0" />
            <span className="flex-1">{error}</span>
            <button onClick={onClearError} className="p-1 hover:bg-red-100 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center -mr-1" aria-label="Dismiss error">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
        {success && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-green-50 border border-green-200 rounded-xl p-3 flex items-center gap-2 text-sm text-green-700 overflow-hidden"
            role="status"
          >
            <Check className="w-4 h-4 flex-shrink-0" />
            <span className="flex-1">{success}</span>
            <button onClick={onClearSuccess} className="p-1 hover:bg-green-100 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center -mr-1" aria-label="Dismiss success message">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ================================================================== */
/*  Tab 1: School Profile                                              */
/* ================================================================== */

function SchoolProfileTab({
  profile, setProfile, onSave, saving, setError,
}: {
  profile: SchoolProfile;
  setProfile: React.Dispatch<React.SetStateAction<SchoolProfile>>;
  onSave: () => void;
  saving: boolean;
  setError: (msg: string) => void;
}) {
  return (
    <div className="space-y-6">
      {/* Logo preview + School name */}
      <div className="sh-card p-6">
        <SectionHeader icon={<School className="w-5 h-5" />} title="School Identity" subtitle="Logo, name, and type" />
        <div className="flex flex-col sm:flex-row items-start gap-6 mt-5">
          {/* Logo preview */}
          <div className="flex flex-col items-center gap-2">
            <div className="w-24 h-24 rounded-2xl border-2 border-dashed border-[var(--border)] flex items-center justify-center overflow-hidden bg-[var(--surface-2)]">
              {profile.logoUrl ? (
                <img
                  src={profile.logoUrl}
                  alt="School logo preview"
                  className="w-full h-full object-contain p-1"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
              ) : (
                <SchoolLogo logoUrl={null} schoolName={profile.name || "School"} size={72} />
              )}
            </div>
            <p className="text-xs text-[var(--text-muted)]">Logo preview</p>
            <label className="btn-secondary cursor-pointer inline-flex items-center gap-2 px-3 py-2 text-xs">
              <Upload className="w-3.5 h-3.5" />
              Upload logo
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  if (file.size > 2 * 1024 * 1024) {
                    setError("Logo must be 2MB or smaller.");
                    return;
                  }
                  const reader = new FileReader();
                  reader.onload = () => {
                    const result = String(reader.result || "");
                    setProfile((p) => ({ ...p, logoUrl: result }));
                  };
                  reader.readAsDataURL(file);
                }}
              />
            </label>
            <input
              className="input-field w-full text-xs"
              placeholder="Or paste logo image URL"
              value={profile.logoUrl && !profile.logoUrl.startsWith("data:") ? profile.logoUrl : ""}
              onChange={(e) => setProfile((p) => ({ ...p, logoUrl: e.target.value }))}
            />
          </div>

          <div className="flex-1 w-full space-y-4">
            <div>
              <label className="label">School Name</label>
              <input
                className="input-field"
                value={profile.name}
                onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
                placeholder="e.g. Federal Government College"
              />
            </div>
            <div>
              <label className="label">School Motto</label>
              <input
                className="input-field"
                value={profile.motto}
                onChange={(e) => setProfile((p) => ({ ...p, motto: e.target.value }))}
                placeholder="e.g. Knowledge is Power"
              />
            </div>
            <div>
              <label className="label">School Type</label>
              <select
                className="input-field"
                value={profile.schoolType}
                onChange={(e) => setProfile((p) => ({ ...p, schoolType: e.target.value }))}
              >
                <option value="">Select school type</option>
                {SCHOOL_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Contact & Logo URL */}
      <div className="sh-card p-6">
        <SectionHeader icon={<Globe className="w-5 h-5" />} title="Contact Details" subtitle="Phone, email, and address" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5">
          <div>
            <label className="label">Phone Number</label>
            <input
              className="input-field"
              value={profile.phone}
              onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))}
              placeholder="e.g. 0801 234 5678"
            />
          </div>
          <div>
            <label className="label">Email Address</label>
            <input
              className="input-field"
              type="email"
              value={profile.email}
              onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))}
              placeholder="e.g. admin@school.edu.ng"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Address</label>
            <input
              className="input-field"
              value={profile.address}
              onChange={(e) => setProfile((p) => ({ ...p, address: e.target.value }))}
              placeholder="e.g. 12 Education Road, Lagos"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Logo URL</label>
            <input
              className="input-field"
              value={profile.logoUrl}
              onChange={(e) => setProfile((p) => ({ ...p, logoUrl: e.target.value }))}
              placeholder="https://example.com/logo.png"
            />
            <p className="text-xs text-[var(--text-muted)] mt-1">Paste a direct link to your school logo image</p>
          </div>
        </div>
      </div>

      {/* Save button */}
      <div className="flex justify-end">
        <button onClick={onSave} disabled={saving} className="btn btn-primary">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Profile
        </button>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  Tab 2: Academic Year                                               */
/* ================================================================== */

function AcademicYearTab({
  academic, setAcademic, onSave, saving,
}: {
  academic: AcademicYear;
  setAcademic: React.Dispatch<React.SetStateAction<AcademicYear>>;
  onSave: () => void;
  saving: boolean;
}) {
  return (
    <div className="space-y-6">
      {/* Session & Term */}
      <div className="sh-card p-6">
        <SectionHeader icon={<Globe className="w-5 h-5" />} title="Current Session & Term" subtitle="Select the active academic session and term" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5">
          <div>
            <label className="label">Academic Session</label>
            <input
              className="input-field"
              value={academic.academicYear}
              onChange={(e) => setAcademic((a) => ({ ...a, academicYear: e.target.value }))}
              placeholder="e.g. 2025/2026"
            />
          </div>
          <div>
            <label className="label">Current Term</label>
            <select
              className="input-field"
              value={academic.term}
              onChange={(e) => setAcademic((a) => ({ ...a, term: Number(e.target.value) }))}
            >
              <option value={1}>First Term</option>
              <option value={2}>Second Term</option>
              <option value={3}>Third Term</option>
            </select>
          </div>
        </div>
      </div>

      {/* Term Dates */}
      <div className="sh-card p-6">
        <SectionHeader icon={<Globe className="w-5 h-5" />} title="Term Dates" subtitle="Set the dates for the current term" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5">
          <div>
            <label className="label">Start Date</label>
            <input
              type="date"
              className="input-field"
              value={academic.startDate}
              onChange={(e) => setAcademic((a) => ({ ...a, startDate: e.target.value }))}
            />
          </div>
          <div>
            <label className="label">End Date</label>
            <input
              type="date"
              className="input-field"
              value={academic.endDate}
              onChange={(e) => setAcademic((a) => ({ ...a, endDate: e.target.value }))}
            />
          </div>
          <div>
            <label className="label">Mid-Term Break</label>
            <input
              type="date"
              className="input-field"
              value={academic.midTermBreak}
              onChange={(e) => setAcademic((a) => ({ ...a, midTermBreak: e.target.value }))}
            />
          </div>
          <div>
            <label className="label">Next Term Start Date</label>
            <input
              type="date"
              className="input-field"
              value={academic.nextTermStart}
              onChange={(e) => setAcademic((a) => ({ ...a, nextTermStart: e.target.value }))}
            />
          </div>
        </div>
      </div>

      {/* Create new session */}
      <div className="sh-card p-6">
        <SectionHeader icon={<Plus className="w-5 h-5" />} title="New Session" subtitle="Create a new academic session when the current one ends" />
        <div className="mt-4">
          <button
            className="btn btn-secondary"
            onClick={async () => {
              const year = new Date().getFullYear();
              const next = `${year}/${year + 1}`;
              setAcademic((a) => ({ ...a, academicYear: next, term: 1, startDate: "", endDate: "", midTermBreak: "", nextTermStart: "" }));
            }}
          >
            <Plus className="w-4 h-4" />
            Create {new Date().getFullYear()}/{new Date().getFullYear() + 1} Session
          </button>
        </div>
      </div>

      {/* Save button */}
      <div className="flex justify-end">
        <button onClick={onSave} disabled={saving} className="btn btn-primary">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Academic Settings
        </button>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  Tab 3: Classes & Subjects                                          */
/* ================================================================== */

function ClassesTab({
  classes, subjects,
  newClassName, setNewClassName, newClassArm, setNewClassArm,
  onAddClass, addingClass,
  newSubjectName, setNewSubjectName, newSubjectCode, setNewSubjectCode,
  onAddSubject, addingSubject,
}: {
  classes: SchoolClass[];
  subjects: Subject[];
  newClassName: string; setNewClassName: (v: string) => void;
  newClassArm: string; setNewClassArm: (v: string) => void;
  onAddClass: () => void; addingClass: boolean;
  newSubjectName: string; setNewSubjectName: (v: string) => void;
  newSubjectCode: string; setNewSubjectCode: (v: string) => void;
  onAddSubject: () => void; addingSubject: boolean;
}) {
  return (
    <div className="space-y-6">
      {/* Classes list */}
      <div className="sh-card p-6">
        <SectionHeader icon={<GraduationCap className="w-5 h-5" />} title="Classes" subtitle={`${classes.length} class${classes.length !== 1 ? "es" : ""} configured`} />
        {classes.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)] mt-4">No classes added yet. Use the form below to create your first class.</p>
        ) : (
          <div className="mt-4 space-y-2 max-h-64 overflow-y-auto">
            {classes.map((cls) => (
              <div
                key={cls.id}
                className="flex items-center justify-between px-4 py-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)]"
              >
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-lg bg-[rgba(11,110,79,0.1)] flex items-center justify-center text-xs font-semibold text-[var(--brand)]">
                    {cls.name.slice(0, 2).toUpperCase()}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-[var(--text)]">{cls.name}</p>
                    <p className="text-xs text-[var(--text-muted)]">
                      {cls.arms.length} arm{cls.arms.length !== 1 ? "s" : ""}
                      {cls.arms.length > 0 && `: ${cls.arms.map((a) => a.name).join(", ")}`}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[var(--text-muted)]" />
              </div>
            ))}
          </div>
        )}

        {/* Add class form */}
        <div className="mt-5 pt-5 border-t border-[var(--border)]">
          <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-3">Add New Class</p>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              className="input-field flex-1"
              placeholder="Class name (e.g. JSS 1)"
              value={newClassName}
              onChange={(e) => setNewClassName(e.target.value)}
            />
            <input
              className="input-field sm:w-36"
              placeholder="Arm (e.g. A)"
              value={newClassArm}
              onChange={(e) => setNewClassArm(e.target.value)}
            />
            <button
              onClick={onAddClass}
              disabled={addingClass || !newClassName.trim()}
              className="btn btn-primary whitespace-nowrap"
            >
              {addingClass ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Add Class
            </button>
          </div>
        </div>
      </div>

      {/* Subjects list */}
      <div className="sh-card p-6">
        <SectionHeader icon={<GraduationCap className="w-5 h-5" />} title="Subjects" subtitle={`${subjects.length} subject${subjects.length !== 1 ? "s" : ""} configured`} />
        {subjects.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)] mt-4">No subjects added yet.</p>
        ) : (
          <div className="mt-4 space-y-2 max-h-64 overflow-y-auto">
            {subjects.map((sub) => (
              <div
                key={sub.id}
                className="flex items-center justify-between px-4 py-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)]"
              >
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-lg bg-[rgba(245,158,11,0.1)] flex items-center justify-center text-xs font-bold text-[#b45309]">
                    {sub.code}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-[var(--text)]">{sub.name}</p>
                    <p className="text-xs text-[var(--text-muted)]">
                      {sub.teachersCount} teacher{sub.teachersCount !== 1 ? "s" : ""} assigned
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[var(--text-muted)]" />
              </div>
            ))}
          </div>
        )}

        {/* Add subject form */}
        <div className="mt-5 pt-5 border-t border-[var(--border)]">
          <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-3">Add New Subject</p>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              className="input-field flex-1"
              placeholder="Subject name (e.g. Mathematics)"
              value={newSubjectName}
              onChange={(e) => setNewSubjectName(e.target.value)}
            />
            <input
              className="input-field sm:w-28"
              placeholder="Code (e.g. MTH)"
              value={newSubjectCode}
              onChange={(e) => setNewSubjectCode(e.target.value)}
              maxLength={5}
            />
            <button
              onClick={onAddSubject}
              disabled={addingSubject || !newSubjectName.trim() || !newSubjectCode.trim()}
              className="btn btn-primary whitespace-nowrap"
            >
              {addingSubject ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Add Subject
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  Tab 4: Staff Management                                            */
/* ================================================================== */

function StaffTab({ staffCounts }: { staffCounts: StaffCounts }) {
  const roleCards = [
    { label: "Teachers", count: staffCounts.teachers, color: "var(--brand)", bg: "rgba(11,110,79,0.08)" },
    { label: "Administrators", count: staffCounts.administrators, color: "#2563eb", bg: "rgba(37,99,235,0.08)" },
    { label: "Bursars", count: staffCounts.bursars, color: "#b45309", bg: "rgba(180,83,9,0.08)" },
  ];

  return (
    <div className="space-y-6">
      {/* Staff overview */}
      <div className="sh-card p-6">
        <SectionHeader icon={<Users className="w-5 h-5" />} title="Staff Overview" subtitle="Summary of staff by role" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-5">
          {roleCards.map((rc) => (
            <div
              key={rc.label}
              className="rounded-xl p-5 border border-[var(--border)]"
              style={{ background: rc.bg }}
            >
              <p className="text-xs font-medium uppercase tracking-wider" style={{ color: rc.color }}>
                {rc.label}
              </p>
              <p className="text-3xl font-bold mt-2" style={{ color: rc.color, fontFamily: "var(--font-display)" }}>
                {rc.count}
              </p>
            </div>
          ))}
        </div>

        {/* Total */}
        <div className="mt-5 pt-5 border-t border-[var(--border)] flex items-center justify-between">
          <p className="text-sm text-[var(--text-muted)]">Total staff members</p>
          <p className="text-xl font-bold text-[var(--text)]" style={{ fontFamily: "var(--font-display)" }}>
            {staffCounts.total}
          </p>
        </div>
      </div>

      {/* Quick link to invites */}
      <div className="sh-card p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[rgba(11,110,79,0.1)] flex items-center justify-center">
              <Plus className="w-5 h-5 text-[var(--brand)]" />
            </div>
            <div>
              <p className="text-sm font-medium text-[var(--text)]">Invite New Staff</p>
              <p className="text-xs text-[var(--text-muted)]">Send email invitations to join your school</p>
            </div>
          </div>
          <a
            href="/dashboard/admin/invites"
            className="btn btn-secondary text-sm"
          >
            Manage Invites
            <ChevronRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  Tab 5: Notifications                                               */
/* ================================================================== */

function NotificationsTab({
  notifications, setNotifications, onSave, saving,
}: {
  notifications: NotificationSettings;
  setNotifications: React.Dispatch<React.SetStateAction<NotificationSettings>>;
  onSave: () => void;
  saving: boolean;
}) {
  const toggles: { key: keyof NotificationSettings; label: string; description: string }[] = [
    { key: "emailNotifications", label: "Email Notifications", description: "Receive system notifications and alerts via email" },
    { key: "emailNotifications", label: "Email Notifications", description: "Receive important alerts by email (free)" },
    { key: "autoNotifyFeePayment", label: "Auto-Notify Parents on Fee Payment", description: "Automatically send receipts and confirmations to parents when fees are paid" },
    { key: "autoNotifyAttendance", label: "Auto-Notify on Attendance Absence", description: "Automatically alert parents when a student is marked absent" },
  ];

  return (
    <div className="space-y-6">
      <div className="sh-card p-6">
        <SectionHeader icon={<Bell className="w-5 h-5" />} title="Notification Preferences" subtitle="Configure how and when you receive notifications" />
        <div className="mt-5 space-y-1">
          {toggles.map((t, i) => (
            <div
              key={t.key}
              className={`flex items-center justify-between py-4 ${i < toggles.length - 1 ? "border-b border-[var(--border)]" : ""}`}
            >
              <div className="pr-4">
                <p className="text-sm font-medium text-[var(--text)]">{t.label}</p>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">{t.description}</p>
              </div>
              <ToggleSwitch
                checked={notifications[t.key]}
                onChange={(val) => setNotifications((n) => ({ ...n, [t.key]: val }))}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <button onClick={onSave} disabled={saving} className="btn btn-primary">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Preferences
        </button>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  Tab 6: Subscription                                                */
/* ================================================================== */

function SubscriptionTab({ subscription }: { subscription: SubscriptionPlan }) {
  const usagePercent = (current: number, max: number) => max > 0 ? Math.min(Math.round((current / max) * 100), 100) : 0;

  const features = [
    { label: "Students", current: subscription.currentStudents, max: subscription.maxStudents },
    { label: "Staff Members", current: subscription.currentStaff, max: subscription.maxStaff },
  ];

  return (
    <div className="space-y-6">
      {/* Current plan */}
      <div className="sh-card p-6">
        <SectionHeader icon={<CreditCard className="w-5 h-5" />} title="Current Plan" subtitle="Your subscription details and usage" />
        <div className="mt-5 flex items-center gap-4">
          <div className="px-4 py-2 rounded-xl bg-[rgba(11,110,79,0.1)] border border-[rgba(11,110,79,0.2)]">
            <p className="text-lg font-bold text-[var(--brand)]" style={{ fontFamily: "var(--font-display)" }}>
              {subscription.name}
            </p>
          </div>
          <div>
            <p className="text-sm text-[var(--text-muted)]">Storage included</p>
            <p className="text-sm font-medium text-[var(--text)]">{subscription.maxStorage}</p>
          </div>
        </div>
      </div>

      {/* Feature limits */}
      <div className="sh-card p-6">
        <SectionHeader icon={<Shield className="w-5 h-5" />} title="Feature Limits" subtitle="Usage against your plan limits" />
        <div className="mt-5 space-y-5">
          {features.map((f) => {
            const pct = usagePercent(f.current, f.max);
            const isHigh = pct > 80;
            return (
              <div key={f.label}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-[var(--text)]">{f.label}</p>
                  <p className="text-xs text-[var(--text-muted)]">
                    <span className={isHigh ? "text-[var(--color-danger)] font-semibold" : ""}>{f.current}</span>
                    {" / "}
                    {f.max.toLocaleString()}
                  </p>
                </div>
                <div className="w-full h-2 rounded-full bg-[var(--surface-2)] overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${pct}%`,
                      background: isHigh
                        ? "linear-gradient(90deg, #f59e0b, #f43f5e)"
                        : "linear-gradient(90deg, #0b6e4f, #17ab7d)",
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Upgrade CTA */}
      <div className="sh-card p-6 border-[rgba(11,110,79,0.3)]">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-[var(--text)]">Need more capacity?</p>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              Upgrade to a higher plan for more students, staff, and storage.
            </p>
          </div>
          <button className="btn btn-primary whitespace-nowrap">
            <CreditCard className="w-4 h-4" />
            Upgrade Plan
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  Shared: Section Header                                             */
/* ================================================================== */

function SectionHeader({ icon, title, subtitle }: { icon: ReactNode; title: string; subtitle: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-[rgba(11,110,79,0.08)] flex items-center justify-center text-[var(--brand)]">
        {icon}
      </div>
      <div>
        <h2 className="font-semibold text-[var(--text)]">{title}</h2>
        <p className="text-xs text-[var(--text-muted)]">{subtitle}</p>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  Shared: Toggle Switch                                              */
/* ================================================================== */

function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: (val: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full p-0 border-0 min-w-[44px] min-h-[44px] items-center justify-center"
      style={{ background: "transparent" }}
    >
      <span className="sr-only">{checked ? "Disable" : "Enable"}</span>
      {/* Track */}
      <span
        aria-hidden="true"
        className={`
          absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
          h-[22px] w-[40px] rounded-full transition-colors duration-200
          ${checked ? "bg-[var(--brand)]" : "bg-[var(--border)]"}
        `}
      />
      {/* Thumb */}
      <span
        aria-hidden="true"
        className={`
          absolute top-1/2 -translate-y-1/2
          h-[16px] w-[16px] rounded-full bg-[var(--surface)] shadow-sm
          transition-all duration-200 ease-in-out
          ${checked ? "left-[calc(50%+6px)]" : "left-[calc(50%-22px)]"}
        `}
      />
    </button>
  );
}
