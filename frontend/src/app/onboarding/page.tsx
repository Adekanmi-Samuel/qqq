"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/CookieAuthProvider";
import { NIGERIAN_STATES, NIGERIAN_LGAS } from "@/lib/nigeria";
import { motion, AnimatePresence } from "framer-motion";
import WheelIcon from "@/components/WheelIcon";
import {
  ChevronRight,
  ChevronLeft,
  Loader2,
  Sparkles,
  School,
  CalendarDays,
  Layers,
  UserPlus,
  Check,
  Plus,
  X,
  PartyPopper,
} from "lucide-react";
import confetti from "canvas-confetti";

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */
const TOTAL_STEPS = 6;

const STEP_META = [
  { num: 1, label: "Welcome", icon: Sparkles },
  { num: 2, label: "School Info", icon: School },
  { num: 3, label: "Academic", icon: CalendarDays },
  { num: 4, label: "Classes", icon: Layers },
  { num: 5, label: "Invite Staff", icon: UserPlus },
  { num: 6, label: "Done", icon: Check },
] as const;

const STORAGE_KEY = "schoolhub_onboarding_progress";

const COMMON_SUBJECTS = [
  "Mathematics", "English Language", "Physics", "Chemistry", "Biology",
  "Economics", "Government", "Literature in English", "Computer Studies",
  "Agricultural Science", "Civic Education", "Social Studies",
  "Basic Science", "Basic Technology", "Home Economics",
  "Christian Religious Studies", "Islamic Studies", "Fine Arts",
  "Physical and Health Education", "Yoruba", "Igbo", "Hausa",
  "French", "Food & Nutrition",
];

const CLASS_OPTIONS = [
  { level: "NURSERY", classes: ["Nursery 1", "Nursery 2", "Nursery 3"] },
  { level: "PRIMARY", classes: ["Primary 1", "Primary 2", "Primary 3", "Primary 4", "Primary 5", "Primary 6"] },
  { level: "JSS", classes: ["JSS 1", "JSS 2", "JSS 3"] },
  { level: "SS", classes: ["SS 1", "SS 2", "SS 3"] },
];

const ARMS = ["A", "B", "C", "D"];

/* ------------------------------------------------------------------ */
/*  Form data type                                                     */
/* ------------------------------------------------------------------ */
interface OnboardingData {
  // Step 2: School Info
  schoolName: string;
  address: string;
  state: string;
  lga: string;
  phone: string;
  email: string;
  websiteUrl: string;
  // Step 3: Academic Setup
  academicYear: string;
  terms: Array<{ termNumber: number; termName: string; startDate: string; endDate: string }>;
  subjects: string[];
  // Step 4: Classes
  selectedClasses: Array<{ name: string; arms: string[] }>;
  // Step 5: Invite Staff
  inviteEmails: string[];
}

const INITIAL_DATA: OnboardingData = {
  schoolName: "", address: "", state: "", lga: "", phone: "", email: "", websiteUrl: "",
  academicYear: "",
  terms: [{ termNumber: 1, termName: "First Term", startDate: "", endDate: "" }],
  subjects: [],
  selectedClasses: [],
  inviteEmails: [],
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
export default function OnboardingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [newInvite, setNewInvite] = useState("");
  const [newClassName, setNewClassName] = useState("");
  const [newClassArm, setNewClassArm] = useState("A");
  const [newSubject, setNewSubject] = useState("");
  const [inviteInput, setInviteInput] = useState("");
  const [data, setData] = useState<OnboardingData>(INITIAL_DATA);
  const [stepErrors, setStepErrors] = useState<Record<string, string>>({});
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({});

  /* ---- Restore progress from localStorage ---- */
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.step) setStep(parsed.step);
        if (parsed.data) setData((prev) => ({ ...prev, ...parsed.data }));
      }
    } catch {
      // ignore
    }
  }, []);

  /* ---- Save progress to localStorage ---- */
  useEffect(() => {
    if (success) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ step, data }));
    } catch {
      // ignore
    }
  }, [step, data, success]);

  const update = useCallback((field: keyof OnboardingData, value: unknown) => {
    setData((prev) => ({ ...prev, [field]: value }));
  }, []);

  function markTouched(field: string) {
    setTouchedFields((prev) => ({ ...prev, [field]: true }));
  }

  function getFieldError(field: string): string | undefined {
    if (!touchedFields[field]) return undefined;
    return stepErrors[field];
  }

  function getInputStyle(hasError?: boolean) {
    if (hasError) return { borderColor: "var(--color-danger)" };
    return undefined;
  }

  /* ---- Validation ---- */
  const validateStep = useCallback(() => {
    const errors: Record<string, string> = {};
    if (step === 2) {
      if (!data.schoolName.trim()) errors.schoolName = "School name is required.";
      if (!data.state) errors.state = "State is required.";
      if (!data.lga) errors.lga = "LGA is required.";
      if (!data.address.trim()) errors.address = "Address is required.";
      if (!data.phone.trim()) errors.phone = "Phone number is required.";
      else if (data.phone.trim().length < 10) errors.phone = "Please enter a valid phone number.";
    }
    if (step === 3) {
      if (!data.academicYear) errors.academicYear = "Academic year is required.";
      data.terms.forEach((t, i) => {
        if (!t.startDate) errors[`term_${i}_startDate`] = `${t.termName} start date is required.`;
        if (!t.endDate) errors[`term_${i}_endDate`] = `${t.termName} end date is required.`;
      });
    }
    if (step === 4) {
      if (data.selectedClasses.length === 0) errors.classes = "Please select at least one class.";
    }
    return errors;
  }, [step, data]);

  const canGoNext = useCallback(() => {
    return Object.keys(validateStep()).length === 0;
  }, [validateStep]);

  /* ---- Navigation ---- */
  const nextStep = () => {
    setError("");
    const errors = validateStep();
    setStepErrors(errors);
    if (Object.keys(errors).length > 0) {
      setError("Please fill in all required fields before continuing.");
      return;
    }
    setStepErrors({});
    if (step < TOTAL_STEPS) {
      setDirection(1);
      setStep((s) => s + 1);
    }
  };

  const prevStep = () => {
    setError("");
    setStepErrors({});
    if (step > 1) {
      setDirection(-1);
      setStep((s) => s - 1);
    }
  };

  /* ---- Submit ---- */
  const handleSubmit = async () => {
    setError("");
    setLoading(true);
    try {
      // Simulate API call -- in production, this would POST to the backend
      await new Promise((resolve) => setTimeout(resolve, 1500));
      localStorage.removeItem(STORAGE_KEY);
      setSuccess(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  /* ---- Confetti on success ---- */
  useEffect(() => {
    if (!success) return;
    const duration = 3000;
    const end = Date.now() + duration;
    const frame = () => {
      confetti({ particleCount: 5, angle: 60, spread: 60, origin: { x: 0, y: 0.6 }, colors: ["#0b6e4f", "#f59e0b", "#fbbf24", "#12926a", "#d6efe5"] });
      confetti({ particleCount: 5, angle: 120, spread: 60, origin: { x: 1, y: 0.6 }, colors: ["#0b6e4f", "#f59e0b", "#fbbf24", "#12926a", "#d6efe5"] });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();
  }, [success]);

  /* ---- Term management ---- */
  const addTerm = () => {
    if (data.terms.length >= 3) return;
    const n = data.terms.length + 1;
    const names = ["First Term", "Second Term", "Third Term"];
    update("terms", [...data.terms, { termNumber: n, termName: names[n - 1], startDate: "", endDate: "" }]);
  };

  const removeTerm = (i: number) => {
    if (data.terms.length <= 1) return;
    update("terms", data.terms.filter((_, idx) => idx !== i));
  };

  const updateTerm = (i: number, field: string, value: string) => {
    update(
      "terms",
      data.terms.map((t, idx) => (idx === i ? { ...t, [field]: value } : t))
    );
  };

  /* ---- Subject management ---- */
  const toggleSubject = (subject: string) => {
    update(
      "subjects",
      data.subjects.includes(subject) ? data.subjects.filter((s) => s !== subject) : [...data.subjects, subject]
    );
  };

  /* ---- Class management ---- */
  const addClass = (className: string, arms: string[]) => {
    if (!className) return;
    if (data.selectedClasses.some((c) => c.name === className)) return;
    update("selectedClasses", [...data.selectedClasses, { name: className, arms }]);
  };

  const removeClass = (className: string) => {
    update("selectedClasses", data.selectedClasses.filter((c) => c.name !== className));
  };

  /* ---- Invite management ---- */
  const addInvite = () => {
    const email = inviteInput.trim();
    if (!email || !email.includes("@")) return;
    if (data.inviteEmails.includes(email)) return;
    update("inviteEmails", [...data.inviteEmails, email]);
    setInviteInput("");
  };

  const removeInvite = (email: string) => {
    update("inviteEmails", data.inviteEmails.filter((e) => e !== email));
  };

  /* ---- Success screen ---- */
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg)" }}>
        <div className="w-full max-w-lg text-center px-4">
          {/* Animated checkmark */}
          <div className="mx-auto mb-8 relative">
            <div
              className="w-24 h-24 rounded-full flex items-center justify-center mx-auto"
              style={{
                background: "linear-gradient(135deg, #0b6e4f 0%, #12926a 100%)",
                animation: "scale-in 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards",
              }}
            >
              <svg className="w-12 h-12 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 13l4 4L19 7" style={{ strokeDasharray: 24, strokeDashoffset: 24, animation: "check-draw 0.5s 0.3s ease-out forwards" }} />
              </svg>
            </div>
            <div
              className="absolute inset-0 w-24 h-24 mx-auto rounded-full"
              style={{ boxShadow: "0 0 40px rgba(11,110,79,0.3), 0 0 80px rgba(11,110,79,0.1)", animation: "glow-pulse 2s ease-in-out infinite" }}
            />
          </div>

          <h1 className="text-3xl md:text-4xl font-bold mb-3" style={{ fontFamily: "var(--font-display)", color: "var(--heading-color)" }}>
            Your school is ready!
          </h1>
          <p className="text-lg mb-8 max-w-md mx-auto" style={{ color: "var(--text-muted)" }}>
            You&apos;re all set to start managing your school. Welcome to SchoolPilot!
          </p>

          <div className="space-y-3 max-w-xs mx-auto">
            <button
              onClick={() => {
                router.push("/dashboard/admin");
              }}
              className="btn-primary w-full"
              style={{ minHeight: 44, fontSize: 15 }}
            >
              Go to Dashboard
            </button>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              Need help?{" "}
              <a href="mailto:support@schoolhub.ng" className="font-medium hover:underline" style={{ color: "var(--brand)" }}>
                Contact us
              </a>
            </p>
          </div>
        </div>
      </div>
    );
  }

  const progressPct = ((step - 1) / (TOTAL_STEPS - 1)) * 100;

  /* ================================================================ */
  /*  Main render                                                      */
  /* ================================================================ */
  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--bg)" }} id="main-content">
      {/* ---- Top bar ---- */}
      <header
        className="flex items-center justify-between px-6 py-4"
        style={{ borderBottom: "1px solid var(--border)", background: "var(--surface)" }}
      >
        <div className="flex items-center gap-2.5">
          <WheelIcon size={32} variant="dark" />
          <span className="font-semibold text-sm hidden sm:inline" style={{ color: "var(--heading-color)" }}>SchoolPilot</span>
        </div>
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          Step {step} of {TOTAL_STEPS}
        </p>
      </header>

      {/* ---- Progress bar ---- */}
      <div className="h-1 w-full" style={{ background: "var(--border)" }}>
        <div
          className="h-full transition-all duration-500 ease-out"
          style={{
            width: `${progressPct + (100 - progressPct) / TOTAL_STEPS}%`,
            background: "linear-gradient(90deg, #0b6e4f, #12926a)",
          }}
        />
      </div>

      {/* ---- Step indicator ---- */}
      <nav
        aria-label="Onboarding progress"
        className="w-full overflow-x-auto"
        style={{ background: "var(--surface)", borderBottom: "1px solid var(--border)" }}
      >
        <div className="flex items-center justify-center gap-0 px-4 py-4 mx-auto" style={{ maxWidth: 640 }}>
          {STEP_META.map((s, i) => {
            const isCompleted = step > s.num;
            const isCurrent = step === s.num;
            const isPending = step < s.num;
            return (
              <div key={s.num} className="flex items-center" style={{ flex: i < STEP_META.length - 1 ? "1 1 0" : "0 0 auto" }}>
                {/* Circle */}
                <div className="flex flex-col items-center" style={{ minWidth: 40 }}>
                  <div
                    className="flex items-center justify-center rounded-full transition-all duration-300"
                    style={{
                      width: isCurrent ? 36 : 28,
                      height: isCurrent ? 36 : 28,
                      background: isCompleted
                        ? "var(--brand)"
                        : isCurrent
                          ? "linear-gradient(135deg, #0b6e4f, #12926a)"
                          : "transparent",
                      border: isPending ? "1.5px solid var(--border)" : "none",
                      color: isCompleted || isCurrent ? "#fff" : "var(--text-muted)",
                      fontSize: isCurrent ? 14 : 12,
                      fontWeight: isCurrent ? 600 : 500,
                      boxShadow: isCurrent ? "0 0 0 3px rgba(11,110,79,0.15)" : "none",
                    }}
                  >
                    {isCompleted ? (
                      <Check className="w-3.5 h-3.5" strokeWidth={2.5} />
                    ) : (
                      s.num
                    )}
                  </div>
                  {/* Label: hidden on very small screens, abbreviated on sm, full on md+ */}
                  <span
                    className="mt-1.5 text-center leading-tight hidden sm:block"
                    style={{
                      fontSize: isCurrent ? 11 : 10,
                      fontWeight: isCurrent ? 600 : 400,
                      color: isCurrent ? "var(--brand)" : isCompleted ? "var(--heading-color)" : "var(--text-muted)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    <span className="hidden md:inline">{s.label}</span>
                    <span className="md:hidden">{s.label.length > 6 ? s.label.slice(0, 6) + "." : s.label}</span>
                  </span>
                </div>
                {/* Connector line */}
                {i < STEP_META.length - 1 && (
                  <div
                    className="flex-1 mx-1 transition-colors duration-300"
                    style={{
                      height: 1.5,
                      minWidth: 12,
                      background: step > s.num ? "var(--brand)" : "var(--border)",
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </nav>

      {/* ---- Content ---- */}
      <div className="flex-1 flex items-center justify-center p-6 pb-24">
        <div className="w-full max-w-2xl">
          {/* Error banner */}
          {error && (
            <div
              className="rounded-xl p-4 mb-6 flex items-start gap-3"
              style={{ background: "rgba(244,63,94,0.05)", border: "1px solid rgba(244,63,94,0.2)", animation: "slide-down 0.25s ease-out" }}
              role="alert"
            >
              <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ background: "rgba(244,63,94,0.15)" }}>
                <span className="text-xs font-bold" style={{ color: "#f43f5e" }}>!</span>
              </div>
              <p className="text-sm" style={{ color: "#e11d48" }}>{error}</p>
            </div>
          )}

          {/* Step content with transitions */}
          <div
            className="overflow-hidden relative"
            style={{ minHeight: step === 1 ? "auto" : 360 }}
          >
            <div
              key={step}
              style={{
                animation: `step-${direction === 1 ? "enter" : "enter-reverse"} 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards`,
              }}
            >
              {/* ====== STEP 1: Welcome ====== */}
              {step === 1 && (
                <div className="text-center py-8">
                  <div
                    className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6"
                    style={{ background: "rgba(11,110,79,0.08)", border: "1px solid rgba(11,110,79,0.12)" }}
                  >
                    <Sparkles className="w-10 h-10" style={{ color: "var(--brand)" }} />
                  </div>
                  <h1
                    className="text-3xl md:text-4xl font-bold mb-3"
                    style={{ fontFamily: "var(--font-display)", color: "var(--heading-color)" }}
                  >
                    Let&apos;s set up your school
                  </h1>
                  <p className="text-base max-w-md mx-auto mb-8" style={{ color: "var(--body-color)", lineHeight: 1.6 }}>
                    We&apos;ll walk you through a few steps to get your school up and running on SchoolPilot.
                    This takes about 3-5 minutes.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <button onClick={nextStep} className="btn-primary px-8" style={{ minHeight: 44, fontSize: 15 }}>
                      Get Started <ChevronRight className="w-4 h-4 ml-1" />
                    </button>
                    <button onClick={() => router.push("/dashboard/admin")} className="btn-ghost px-6" style={{ minHeight: 44, fontSize: 14 }}>
                      Skip for now
                    </button>
                  </div>
                </div>
              )}

              {/* ====== STEP 2: School Info ====== */}
              {step === 2 && (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-2xl font-semibold" style={{ fontFamily: "var(--font-display)", color: "var(--heading-color)" }}>
                      School information
                    </h2>
                    <p className="text-sm -mt-1" style={{ color: "var(--text-muted)" }}>
                      Basic details about your institution
                    </p>
                  </div>

                  <div>
                    <label htmlFor="school-name" className="sh-label">School Name <span style={{ color: "var(--color-danger)" }}>&bull;</span></label>
                    <input id="school-name" className="input-field" placeholder="e.g. St. John's College" value={data.schoolName}
                      onChange={(e) => update("schoolName", e.target.value)}
                      onBlur={() => markTouched("schoolName")}
                      aria-required="true" autoComplete="organization-title"
                      style={getInputStyle(!!getFieldError("schoolName"))} />
                    {getFieldError("schoolName") && <p className="text-xs mt-1" style={{ color: "var(--color-danger)" }}>{getFieldError("schoolName")}</p>}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="state" className="sh-label">State <span style={{ color: "var(--color-danger)" }}>&bull;</span></label>
                      <select id="state" className="input-field" value={data.state}
                        onChange={(e) => { update("state", e.target.value); update("lga", ""); markTouched("state"); }}
                        onBlur={() => markTouched("state")}
                        aria-required="true" autoComplete="address-level1"
                        style={getInputStyle(!!getFieldError("state"))}>
                        <option value="">Select state</option>
                        {NIGERIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                      {getFieldError("state") && <p className="text-xs mt-1" style={{ color: "var(--color-danger)" }}>{getFieldError("state")}</p>}
                    </div>
                    <div>
                      <label htmlFor="lga" className="sh-label">LGA <span style={{ color: "var(--color-danger)" }}>&bull;</span></label>
                      <select id="lga" className="input-field" value={data.lga}
                        onChange={(e) => { update("lga", e.target.value); markTouched("lga"); }}
                        onBlur={() => markTouched("lga")}
                        aria-required="true" autoComplete="address-level2"
                        style={getInputStyle(!!getFieldError("lga"))}>
                        <option value="">Select LGA</option>
                        {(data.state ? NIGERIAN_LGAS[data.state] || [] : []).map((l) => <option key={l} value={l}>{l}</option>)}
                      </select>
                      {getFieldError("lga") && <p className="text-xs mt-1" style={{ color: "var(--color-danger)" }}>{getFieldError("lga")}</p>}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="address" className="sh-label">Address <span style={{ color: "var(--color-danger)" }}>&bull;</span></label>
                    <textarea id="address" className="input-field" rows={2} placeholder="Full school address" value={data.address}
                      onChange={(e) => update("address", e.target.value)}
                      onBlur={() => markTouched("address")}
                      aria-required="true" autoComplete="street-address"
                      style={getInputStyle(!!getFieldError("address"))} />
                    {getFieldError("address") && <p className="text-xs mt-1" style={{ color: "var(--color-danger)" }}>{getFieldError("address")}</p>}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="phone" className="sh-label">Phone <span style={{ color: "var(--color-danger)" }}>&bull;</span></label>
                      <input id="phone" type="tel" className="input-field" placeholder="080 1234 5678" value={data.phone}
                        onChange={(e) => update("phone", e.target.value)}
                        onBlur={() => markTouched("phone")}
                        aria-required="true" autoComplete="tel"
                        style={getInputStyle(!!getFieldError("phone"))} />
                      {getFieldError("phone") && <p className="text-xs mt-1" style={{ color: "var(--color-danger)" }}>{getFieldError("phone")}</p>}
                    </div>
                    <div>
                      <label htmlFor="school-email" className="sh-label">Email</label>
                      <input id="school-email" type="email" className="input-field" placeholder="info@yourschool.ng" value={data.email} onChange={(e) => update("email", e.target.value)} autoComplete="email" />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="website" className="sh-label">Website <span className="font-normal normal-case" style={{ color: "var(--text-muted)" }}>(optional)</span></label>
                    <input id="website" className="input-field" placeholder="https://yourschool.ng" value={data.websiteUrl} onChange={(e) => update("websiteUrl", e.target.value)} autoComplete="url" />
                  </div>
                </div>
              )}

              {/* ====== STEP 3: Academic Setup ====== */}
              {step === 3 && (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-2xl font-semibold" style={{ fontFamily: "var(--font-display)", color: "var(--heading-color)" }}>
                      Academic setup
                    </h2>
                    <p className="text-sm -mt-1" style={{ color: "var(--text-muted)" }}>
                      Configure your academic calendar and subjects
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="academic-year" className="sh-label">Academic Year <span style={{ color: "var(--color-danger)" }}>&bull;</span></label>
                      <select id="academic-year" className="input-field" value={data.academicYear}
                        onChange={(e) => { update("academicYear", e.target.value); markTouched("academicYear"); }}
                        onBlur={() => markTouched("academicYear")}
                        aria-required="true"
                        style={getInputStyle(!!getFieldError("academicYear"))}>
                        <option value="">Select year</option>
                        {["2024/2025", "2025/2026", "2026/2027", "2027/2028"].map((y) => <option key={y} value={y}>{y}</option>)}
                      </select>
                      {getFieldError("academicYear") && <p className="text-xs mt-1" style={{ color: "var(--color-danger)" }}>{getFieldError("academicYear")}</p>}
                    </div>
                  </div>

                  {/* Terms */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium" style={{ color: "var(--heading-color)" }}>Terms</label>
                      {data.terms.length < 3 && (
                        <button type="button" onClick={addTerm} className="text-xs font-medium hover:underline" style={{ color: "var(--brand)", background: "none", border: "none", cursor: "pointer" }}>
                          + Add term
                        </button>
                      )}
                    </div>
                    {data.terms.map((term, i) => (
                      <div key={i} className="rounded-xl p-4" style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-medium" style={{ color: "var(--heading-color)" }}>{term.termName}</span>
                          {data.terms.length > 1 && (
                            <button type="button" onClick={() => removeTerm(i)} className="text-xs hover:underline" style={{ color: "var(--color-danger)", background: "none", border: "none", cursor: "pointer" }}>
                              Remove
                            </button>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label htmlFor={`term-start-${i}`} className="block text-xs mb-1" style={{ color: "var(--text-muted)" }}>Start Date</label>
                            <input id={`term-start-${i}`} type="date" className="input-field" value={term.startDate} onChange={(e) => updateTerm(i, "startDate", e.target.value)} aria-required="true" />
                          </div>
                          <div>
                            <label htmlFor={`term-end-${i}`} className="block text-xs mb-1" style={{ color: "var(--text-muted)" }}>End Date</label>
                            <input id={`term-end-${i}`} type="date" className="input-field" value={term.endDate} onChange={(e) => updateTerm(i, "endDate", e.target.value)} aria-required="true" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Subjects */}
                  <div>
                    <label className="text-sm font-medium block mb-2" style={{ color: "var(--heading-color)" }}>
                      Subjects offered <span className="font-normal" style={{ color: "var(--text-muted)" }}>(select all that apply)</span>
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {COMMON_SUBJECTS.map((subject) => {
                        const selected = data.subjects.includes(subject);
                        return (
                          <button
                            key={subject}
                            type="button"
                            onClick={() => toggleSubject(subject)}
                            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150"
                            style={{
                              border: selected ? "1.5px solid #0b6e4f" : "1.5px solid var(--border)",
                              background: selected ? "rgba(11,110,79,0.08)" : "var(--surface)",
                              color: selected ? "var(--brand)" : "var(--body-color)",
                              cursor: "pointer",
                            }}
                          >
                            {subject}
                          </button>
                        );
                      })}
                    </div>
                    {/* Custom subject input */}
                    <div className="flex gap-2 mt-3">
                      <label htmlFor="custom-subject" className="sr-only">Add custom subject</label>
                      <input
                        id="custom-subject"
                        className="input-field flex-1"
                        placeholder="Add custom subject"
                        value={newSubject}
                        onChange={(e) => setNewSubject(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            if (newSubject.trim() && !data.subjects.includes(newSubject.trim())) {
                              toggleSubject(newSubject.trim());
                              setNewSubject("");
                            }
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (newSubject.trim() && !data.subjects.includes(newSubject.trim())) {
                            toggleSubject(newSubject.trim());
                            setNewSubject("");
                          }
                        }}
                        className="btn-secondary px-4"
                        style={{ minHeight: 40 }}
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ====== STEP 4: Classes ====== */}
              {step === 4 && (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-2xl font-semibold" style={{ fontFamily: "var(--font-display)", color: "var(--heading-color)" }}>
                      Set up classes
                    </h2>
                    <p className="text-sm -mt-1" style={{ color: "var(--text-muted)" }}>
                      Add the classes your school offers with their arms
                    </p>
                    {getFieldError("classes") && (
                      <p className="text-xs mt-2 p-2 rounded-lg" style={{ color: "var(--color-danger)", background: "rgba(244,63,94,0.06)", border: "1px solid rgba(244,63,94,0.15)" }}>
                        {getFieldError("classes")}
                      </p>
                    )}
                  </div>

                  {/* Quick-add from predefined list */}
                  <div className="space-y-3">
                    {CLASS_OPTIONS.map((group) => (
                      <div key={group.level}>
                        <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>{group.level}</p>
                        <div className="flex flex-wrap gap-2">
                          {group.classes.map((cls) => {
                            const added = data.selectedClasses.some((c) => c.name === cls);
                            return (
                              <button
                                key={cls}
                                type="button"
                                onClick={() => {
                                  if (added) {
                                    removeClass(cls);
                                  } else {
                                    addClass(cls, ["A"]);
                                  }
                                }}
                                className="px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 flex items-center gap-1.5"
                                style={{
                                  border: added ? "1.5px solid #0b6e4f" : "1.5px solid var(--border)",
                                  background: added ? "rgba(11,110,79,0.08)" : "var(--surface)",
                                  color: added ? "var(--brand)" : "var(--body-color)",
                                  cursor: "pointer",
                                }}
                              >
                                {added && <Check className="w-3 h-3" />}
                                {cls}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Custom class */}
                  <div
                    className="pt-4"
                    style={{ borderTop: "1px solid var(--border)" }}
                  >
                    <label htmlFor="custom-class-name" className="text-sm font-medium block mb-2" style={{ color: "var(--heading-color)" }}>Add custom class</label>
                    <div className="flex gap-2">
                      <input
                        id="custom-class-name"
                        className="input-field flex-1"
                        placeholder="e.g. Pre-Nursery"
                        value={newClassName}
                        onChange={(e) => setNewClassName(e.target.value)}
                        autoComplete="off"
                      />
                      <label htmlFor="custom-class-arm" className="sr-only">Class arm</label>
                      <select id="custom-class-arm" className="input-field w-20" value={newClassArm} onChange={(e) => setNewClassArm(e.target.value)}>
                        {ARMS.map((a) => <option key={a} value={a}>{a}</option>)}
                      </select>
                      <button
                        type="button"
                        onClick={() => {
                          if (newClassName.trim()) {
                            addClass(newClassName.trim(), [newClassArm]);
                            setNewClassName("");
                            setNewClassArm("A");
                          }
                        }}
                        className="btn-secondary px-4"
                        style={{ minHeight: 40 }}
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Selected classes list */}
                  {data.selectedClasses.length > 0 && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium" style={{ color: "var(--heading-color)" }}>
                        Selected classes ({data.selectedClasses.length})
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {data.selectedClasses.map((cls) => (
                          <div
                            key={cls.name}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
                            style={{ background: "rgba(11,110,79,0.08)", border: "1px solid rgba(11,110,79,0.15)", color: "var(--brand)" }}
                          >
                            {cls.name} ({cls.arms.join(", ")})
                            <button
                              type="button"
                              onClick={() => removeClass(cls.name)}
                              className="ml-1 hover:opacity-70"
                              style={{ color: "var(--brand)", background: "none", border: "none", cursor: "pointer", padding: 0 }}
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ====== STEP 5: Invite Staff ====== */}
              {step === 5 && (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-2xl font-semibold" style={{ fontFamily: "var(--font-display)", color: "var(--heading-color)" }}>
                      Invite staff
                    </h2>
                    <p className="text-sm -mt-1" style={{ color: "var(--text-muted)" }}>
                      Add teachers and staff members to your school. You can skip this for now.
                    </p>
                  </div>

                  {/* Invite input */}
                  <div className="flex gap-2">
                    <label htmlFor="invite-email" className="sr-only">Staff email address</label>
                    <input
                      id="invite-email"
                      type="email"
                      className="input-field flex-1"
                      placeholder="teacher@example.com"
                      value={inviteInput}
                      onChange={(e) => setInviteInput(e.target.value)}
                      autoComplete="email"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addInvite();
                        }
                      }}
                    />
                    <button type="button" onClick={addInvite} className="btn-secondary px-4" style={{ minHeight: 40 }}>
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Invited emails */}
                  {data.inviteEmails.length > 0 && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium" style={{ color: "var(--heading-color)" }}>
                        Invited ({data.inviteEmails.length})
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {data.inviteEmails.map((email) => (
                          <div
                            key={email}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
                            style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--body-color)" }}
                          >
                            {email}
                            <button
                              type="button"
                              onClick={() => removeInvite(email)}
                              className="ml-1 hover:opacity-70"
                              style={{ color: "var(--color-danger)", background: "none", border: "none", cursor: "pointer", padding: 0 }}
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {data.inviteEmails.length === 0 && (
                    <div className="text-center py-8 rounded-xl" style={{ background: "var(--surface-2)", border: "1px dashed var(--border)" }}>
                      <UserPlus className="w-8 h-8 mx-auto mb-3" style={{ color: "var(--muted-color)" }} />
                      <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                        No staff invited yet. You can add them later from your dashboard.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* ====== STEP 6: Review & Complete ====== */}
              {step === 6 && (
                <div className="space-y-6">
                  <div className="text-center">
                    <div
                      className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                      style={{ background: "rgba(11,110,79,0.08)", border: "1px solid rgba(11,110,79,0.12)" }}
                    >
                      <PartyPopper className="w-8 h-8" style={{ color: "var(--brand)" }} />
                    </div>
                    <h2 className="text-2xl font-semibold" style={{ fontFamily: "var(--font-display)", color: "var(--heading-color)" }}>
                      Almost there!
                    </h2>
                    <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                      Review your setup and complete onboarding
                    </p>
                  </div>

                  {/* Summary */}
                  <div className="rounded-xl p-5 space-y-4" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                    <SummaryRow label="School" value={data.schoolName || "Not set"} />
                    <SummaryRow label="Location" value={[data.lga, data.state].filter(Boolean).join(", ") || "Not set"} />
                    <SummaryRow label="Academic Year" value={data.academicYear || "Not set"} />
                    <SummaryRow label="Terms" value={`${data.terms.length} term(s)`} />
                    <SummaryRow label="Subjects" value={`${data.subjects.length} subject(s)`} />
                    <SummaryRow label="Classes" value={`${data.selectedClasses.length} class(es)`} />
                    <SummaryRow label="Staff Invited" value={`${data.inviteEmails.length} member(s)`} />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ---- Navigation buttons ---- */}
          {step > 1 && (
            <div
              className={`flex ${step >= 2 ? "justify-between" : "justify-end"} mt-8 pt-6`}
              style={{ borderTop: "1px solid var(--border)" }}
            >
              {step >= 2 && (
                <button type="button" onClick={prevStep} disabled={loading} className="btn btn-secondary px-4 py-2 min-h-[44px] flex items-center gap-1.5">
                  <ChevronLeft className="w-4 h-4" /> Back
                </button>
              )}
              {step < TOTAL_STEPS ? (
                <button
                  type="button"
                  onClick={nextStep}
                  disabled={!canGoNext()}
                  className="btn btn-primary px-6 py-2.5 min-h-[44px] flex items-center gap-1.5"
                >
                  Continue <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading}
                  className="btn btn-primary px-6 py-2.5 min-h-[44px] flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Setting up...
                    </>
                  ) : (
                    "Complete Setup"
                  )}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */
function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm" style={{ color: "var(--text-muted)" }}>{label}</span>
      <span className="text-sm font-medium" style={{ color: "var(--heading-color)" }}>{value}</span>
    </div>
  );
}
