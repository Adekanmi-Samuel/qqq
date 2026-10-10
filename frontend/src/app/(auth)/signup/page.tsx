"use client";

import Link from "next/link";
import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth, getDashboardRoute } from "@/lib/auth/CookieAuthProvider";
import { redirectToProductionIfStale } from "@/lib/authOrigins";
import { NIGERIAN_STATES, NIGERIAN_LGAS } from "@/lib/nigeria";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, ChevronRight, ChevronLeft, Check, School, Users } from "lucide-react";
import { API_URL } from "@/lib/config";
import { extractApiErrorMessage } from "@/lib/utils";
import PasswordInput from "@/components/ui/password-input";

/* ------------------------------------------------------------------ */
/*  Account type                                                       */
/* ------------------------------------------------------------------ */
type AccountType = "SCHOOL_ADMIN" | "PARENT_TEACHER" | null;

/* ------------------------------------------------------------------ */
/*  Zod schemas                                                        */
/* ------------------------------------------------------------------ */
const schoolAdminSchema = z
  .object({
    schoolName: z.string().min(2, "School name is required."),
    schoolType: z.enum(["NURSERY", "PRIMARY", "SECONDARY", "COMBINED"], {
      message: "Please select a school type.",
    }),
    ownershipType: z.enum(["PRIVATE", "GOVERNMENT"], {
      message: "Please select ownership type.",
    }),
    state: z.string().min(2, "State is required."),
    lga: z.string().min(1, "LGA is required."),
    address: z.string().min(5, "Address is required."),
    adminFullName: z.string().min(2, "Admin name is required."),
    email: z.string().email("Please enter a valid email address."),
    phone: z.string().min(10, "Please enter a valid phone number."),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters.")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter.")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter.")
      .regex(/[0-9]/, "Password must contain at least one number."),
    confirmPassword: z.string().min(1, "Please confirm your password."),
    schoolMotto: z.string().optional(),
    websiteUrl: z.string().url("Please enter a valid website URL").optional().or(z.literal("")),
    cacNumber: z.string().optional(),
    principalName: z.string().optional(),
    schoolEmail: z.string().email("Please enter a valid school email").optional().or(z.literal("")),
    schoolPhone: z.string().min(10, "Please enter a valid school phone").optional().or(z.literal("")),
    foundingYear: z.string().optional(),
    curriculum: z.string().optional(),
    numberOfStudents: z.string().optional(),
    numberOfStaff: z.string().optional(),
    selectedLevels: z.array(z.string()).min(1, "Select at least one class level"),
    academicYear: z.string().min(4, "Academic year is required"),
    agreeToTerms: z.boolean().refine((v) => v === true, {
      message: "You must agree to the terms.",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

type SchoolAdminFormData = z.infer<typeof schoolAdminSchema>;

const parentTeacherSchema = z
  .object({
    fullName: z.string().min(2, "Full name is required."),
    email: z.string().email("Please enter a valid email address."),
    phone: z.string().min(10, "Please enter a valid phone number."),
    role: z.enum(["PARENT", "TEACHER"], {
      message: "Please select a role.",
    }),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters.")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter.")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter.")
      .regex(/[0-9]/, "Password must contain at least one number."),
    confirmPassword: z.string().min(1, "Please confirm your password."),
    inviteCode: z.string().min(1, "Invite code is required."),
    agreeToTerms: z.boolean().refine((v) => v === true, {
      message: "You must agree to the terms.",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

type ParentTeacherFormData = z.infer<typeof parentTeacherSchema>;

/* ------------------------------------------------------------------ */
/*  Academic year helpers (never hardcode a past year)                */
/* ------------------------------------------------------------------ */

function buildDefaultAcademicYear(): string {
  const now = new Date();
  const y = now.getFullYear();
  const month = now.getMonth(); // 0 = Jan
  // Nigerian school year typically runs Sep to Jul/Aug
  if (month >= 8) return `${y}/${y + 1}`;
  return `${y - 1}/${y}`;
}

function buildDefaultTerms() {
  const now = new Date();
  const startYear = now.getMonth() >= 8 ? now.getFullYear() : now.getFullYear() - 1;
  return [
    { termNumber: 1, termName: "First Term", startDate: `${startYear}-09-08`, endDate: `${startYear}-12-12`, resumptionDate: `${startYear + 1}-01-05` },
    { termNumber: 2, termName: "Second Term", startDate: `${startYear + 1}-01-05`, endDate: `${startYear + 1}-04-03`, resumptionDate: `${startYear + 1}-04-20` },
    { termNumber: 3, termName: "Third Term", startDate: `${startYear + 1}-04-20`, endDate: `${startYear + 1}-07-10` },
  ];
}

/** Current academic year, e.g. 2026/2027 when today is in 2026. */
function defaultAcademicYear(): string {
  const now = new Date();
  const y = now.getFullYear();
  const month = now.getMonth(); // 0 based
  // Nigerian academic year typically starts around September
  return month >= 8 ? `${y}/${y + 1}` : `${y - 1}/${y}`;
}

function defaultTerms() {
  const now = new Date();
  const startYear = now.getMonth() >= 8 ? now.getFullYear() : now.getFullYear() - 1;
  return [
    { termNumber: 1, termName: "First Term", startDate: `${startYear}-09-01`, endDate: `${startYear}-12-12`, resumptionDate: `${startYear + 1}-01-05` },
    { termNumber: 2, termName: "Second Term", startDate: `${startYear + 1}-01-05`, endDate: `${startYear + 1}-04-03`, resumptionDate: `${startYear + 1}-04-20` },
    { termNumber: 3, termName: "Third Term", startDate: `${startYear + 1}-04-20`, endDate: `${startYear + 1}-07-10` },
  ];
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
export default function SignupPage() {
  const router = useRouter();
  const { login, signInWithGoogle } = useAuth();
  const [accountType, setAccountType] = useState<AccountType>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");

  // Leave stale hosts before Google OAuth can bounce there.
  useEffect(() => {
    redirectToProductionIfStale();
  }, []);

  /* ---- School Admin form ---- */
  const schoolForm = useForm<SchoolAdminFormData>({
    resolver: zodResolver(schoolAdminSchema),
    defaultValues: {
      schoolName: "", schoolType: undefined, ownershipType: undefined,
      state: "", lga: "", address: "", adminFullName: "",
      email: "", phone: "", password: "", confirmPassword: "",
      schoolMotto: "", websiteUrl: "", cacNumber: "", principalName: "",
      schoolEmail: "", schoolPhone: "", foundingYear: "", curriculum: "",
      numberOfStudents: "", numberOfStaff: "",
      selectedLevels: ["CRECHE", "KG", "NURSERY", "PRIMARY", "JSS", "SS"],
      academicYear: "",
      agreeToTerms: false,
    },
  });

  /* ---- Parent/Teacher form ---- */
  const ptForm = useForm<ParentTeacherFormData>({
    resolver: zodResolver(parentTeacherSchema),
    defaultValues: {
      fullName: "", email: "", phone: "", role: undefined,
      password: "", confirmPassword: "", inviteCode: "",
      agreeToTerms: false,
    },
  });

  const selectedState = schoolForm.watch("state");

  /* ---- Google sign-in ---- */
  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setError("");
    redirectToProductionIfStale();
    try {
      await signInWithGoogle();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Google sign-in failed.";
      setError(msg);
      toast.error(msg);
      setGoogleLoading(false);
    }
  };

  /* ---- School Admin submit ---- */
  const onSchoolAdminSubmit = async (data: SchoolAdminFormData) => {
    setError("");
    setLoading(true);
    try {
      const payload = {
        schoolName: data.schoolName,
        schoolType: data.schoolType,
        ownershipType: data.ownershipType,
        state: data.state,
        lga: data.lga,
        address: data.address,
        email: data.email,
        phone: data.phone,
        password: data.password,
        adminFullName: data.adminFullName,
        schoolMotto: data.schoolMotto || "",
        motto: data.schoolMotto || "",
        websiteUrl: data.websiteUrl || "",
        website: data.websiteUrl || "",
        cacNumber: data.cacNumber || "",
        principalName: data.principalName || "",
        schoolEmail: data.schoolEmail || "",
        schoolPhone: data.schoolPhone || "",
        foundingYear: data.foundingYear || "",
        curriculum: data.curriculum || "",
        numberOfStudents: data.numberOfStudents || "",
        numberOfStaff: data.numberOfStaff || "",
        academicYear: data.academicYear || defaultAcademicYear(),
        terms: defaultTerms(),
        selectedLevels: data.selectedLevels?.length ? data.selectedLevels : ["CRECHE", "KG", "NURSERY", "PRIMARY", "JSS", "SS"],
        caPercentage: 40,
        examPercentage: 60,
        passMark: 40,
      };

      const res = await fetch(`${API_URL}/api/onboarding/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (!res.ok) {
        // Backend sendError returns { error: { code, message } } — extract message only
        throw new Error(extractApiErrorMessage(result.error, "Registration failed."));
      }

      // With cookie-based auth, the server sets HttpOnly cookies
      // We don't need to manually store tokens anymore
      // The auth context will automatically fetch the user data

      toast.success("Account created successfully!");
      router.push("/onboarding");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : extractApiErrorMessage(err, "Registration failed.");
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  /* ---- Parent/Teacher submit ---- */
  const onParentTeacherSubmit = async (data: ParentTeacherFormData) => {
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/register-with-invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // Important: send/receive cookies
        body: JSON.stringify({
          inviteCode: data.inviteCode,
          fullName: data.fullName,
          email: data.email,
          password: data.password,
          // Include profile fields the form already collects
          phone: data.phone,
          role: data.role,
        }),
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(extractApiErrorMessage(result.error, "Registration failed."));
      }

      toast.success("Account created successfully! Please sign in.");
      router.push("/login");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : extractApiErrorMessage(err, "Registration failed.");
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  /* ================================================================ */
  /*  Render                                                           */
  /* ================================================================ */
  return (
    <div className="w-full max-w-[480px]">
      {/* ---- Back to type selection (when in form) ---- */}
      {accountType && (
        <motion.button
          type="button"
          onClick={() => {
            setAccountType(null);
            setError("");
          }}
          className="flex items-center gap-2 text-sm mb-6 transition-colors hover:opacity-80"
          style={{ fontFamily: "var(--font-sans)", color: "var(--muted-color)", background: "none", border: "none", cursor: "pointer", padding: 0 }}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </motion.button>
      )}

      {/* ---- Form card ---- */}
      <motion.div
        style={{
          background: "var(--card-bg)",
          borderRadius: 20,
          padding: "36px 32px 32px",
          boxShadow:
            "0 1px 3px rgba(11,110,79,0.06), 0 8px 32px rgba(11,110,79,0.06), 0 0 0 1px rgba(11,110,79,0.04)",
        }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5, ease: "easeOut" }}
      >
        <AnimatePresence mode="wait">
          {/* ======================================================== */}
          {/*  STEP 1: Account Type Selection                           */}
          {/* ======================================================== */}
          {!accountType && (
            <motion.div
              key="step-type"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              <h1
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: 28,
                  fontWeight: 500,
                  color: "var(--heading-color)",
                  letterSpacing: "-0.02em",
                  marginBottom: 6,
                }}
              >
                Create your account
              </h1>
              <p
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: 14,
                  color: "var(--body-color)",
                  marginBottom: 28,
                  lineHeight: 1.5,
                }}
              >
                How will you be using SchoolPilot?
              </p>

              {/* Error */}
              {error && (
                <div
                  className="rounded-xl p-3 mb-5"
                  style={{
                    background: "rgba(244,63,94,0.05)",
                    border: "1px solid rgba(244,63,94,0.2)",
                  }}
                >
                  <p className="text-sm" style={{ color: "#e11d48" }}>{error}</p>
                </div>
              )}

              {/* Account type cards */}
              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  onClick={() => setAccountType("SCHOOL_ADMIN")}
                  className="w-full p-5 rounded-xl text-left transition-all duration-200 flex items-center gap-4"
                  style={{
                    border: "2px solid var(--border)",
                    background: "var(--surface)",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "var(--brand)";
                    e.currentTarget.style.boxShadow = "0 0 0 3px rgba(11,110,79,0.1)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "var(--border)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: "rgba(11,110,79,0.08)" }}
                  >
                    <School className="w-6 h-6" style={{ color: "var(--brand)" }} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: "var(--heading-color)" }}>
                      School Admin
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                      Register and manage your school
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 ml-auto shrink-0" style={{ color: "var(--muted-color)" }} />
                </button>

                <button
                  type="button"
                  onClick={() => setAccountType("PARENT_TEACHER")}
                  className="w-full p-5 rounded-xl text-left transition-all duration-200 flex items-center gap-4"
                  style={{
                    border: "2px solid var(--border)",
                    background: "var(--surface)",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "var(--brand)";
                    e.currentTarget.style.boxShadow = "0 0 0 3px rgba(11,110,79,0.1)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "var(--border)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: "rgba(245,158,11,0.08)" }}
                  >
                    <Users className="w-6 h-6" style={{ color: "#d97706" }} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: "var(--heading-color)" }}>
                      Parent / Teacher
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                      Join an existing school with an invite code
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 ml-auto shrink-0" style={{ color: "var(--muted-color)" }} />
                </button>
              </div>

              {/* Google sign-in */}
              <div className="flex items-center gap-3.5 my-6">
                <div className="flex-1 h-px" style={{ background: "var(--card-border)" }} />
                <span className="text-[12px] font-medium" style={{ fontFamily: "var(--font-sans)", color: "var(--muted-color)" }}>
                  or
                </span>
                <div className="flex-1 h-px" style={{ background: "var(--card-border)" }} />
              </div>

              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={googleLoading}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--card-border)] bg-[var(--surface)] px-4 text-sm font-semibold text-[var(--heading-color)] transition-colors hover:border-brand-300"
                style={{ minHeight: 48 }}
              >
                {googleLoading ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                )}
                {googleLoading ? "Creating account..." : "Continue with Google"}
              </button>

              <p className="text-center text-xs text-[var(--text-muted)]">or choose an account type below</p>

              <p className="text-center mt-5" style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--body-color)" }}>
                Need help registering?{" "}
                <a href="/contact" className="hover:underline" style={{ color: "var(--muted-color)" }}>
                  Contact support
                </a>
                {" "}or
                {" "}Already have an account?{" "}
                <Link href="/login" className="font-semibold hover:underline" style={{ color: "var(--brand)" }}>
                  Sign in
                </Link>
              </p>
            </motion.div>
          )}

          {/* ======================================================== */}
          {/*  STEP 2A: School Admin Registration Form                  */}
          {/* ======================================================== */}
          {accountType === "SCHOOL_ADMIN" && (
            <motion.div
              key="step-school"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              {/* Progress indicator */}
              <div className="flex items-center gap-2 mb-6">
                <div className="flex-1 h-1 rounded-full" style={{ background: "linear-gradient(90deg, #0b6e4f, #12926a)" }} />
                <div className="flex-1 h-1 rounded-full" style={{ background: "var(--border)" }} />
              </div>

              <h1
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: 24,
                  fontWeight: 500,
                  color: "var(--heading-color)",
                  letterSpacing: "-0.02em",
                  marginBottom: 6,
                }}
              >
                School details
              </h1>
              <p style={{ fontFamily: "var(--font-sans)", fontSize: 14, color: "var(--body-color)", marginBottom: 24, lineHeight: 1.5 }}>
                Tell us about your school
              </p>

              {/* Error */}
              {error && (
                <div className="rounded-xl p-3 mb-5" style={{ background: "rgba(244,63,94,0.05)", border: "1px solid rgba(244,63,94,0.2)" }}>
                  <p className="text-sm" style={{ color: "#e11d48" }}>{error}</p>
                </div>
              )}

              <form onSubmit={schoolForm.handleSubmit(onSchoolAdminSubmit)} className="flex flex-col gap-4">
                {/* Google always available on form steps */}
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={googleLoading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--card-border)] bg-[var(--surface)] px-4 text-sm font-semibold text-[var(--heading-color)] transition-colors hover:border-brand-300"
                  style={{ minHeight: 48 }}
                >
                  {googleLoading ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                  )}
                  {googleLoading ? "Creating account..." : "Continue with Google"}
                </button>
                <p className="text-center text-xs text-[var(--text-muted)]">or fill the form below</p>
                {/* School Name */}
                <div>
                  <label className="sh-label">School Name <span style={{ color: "var(--color-danger)" }}>&bull;</span></label>
                  <input className="input-field" placeholder="e.g. St. John's College" autoComplete="organization" {...schoolForm.register("schoolName")} />
                  {schoolForm.formState.errors.schoolName && (
                    <p className="text-xs mt-1" style={{ color: "var(--color-danger)" }}>{schoolForm.formState.errors.schoolName.message}</p>
                  )}
                </div>

                {/* School Type + Ownership */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="sh-label">School Type <span style={{ color: "var(--color-danger)" }}>&bull;</span></label>
                    <select className="input-field" {...schoolForm.register("schoolType")}>
                      <option value="">Select type</option>
                      <option value="NURSERY">Nursery</option>
                      <option value="PRIMARY">Primary</option>
                      <option value="SECONDARY">Secondary</option>
                      <option value="COMBINED">Combined</option>
                    </select>
                    {schoolForm.formState.errors.schoolType && (
                      <p className="text-xs mt-1" style={{ color: "var(--color-danger)" }}>{schoolForm.formState.errors.schoolType.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="sh-label">Ownership <span style={{ color: "var(--color-danger)" }}>&bull;</span></label>
                    <select className="input-field" {...schoolForm.register("ownershipType")}>
                      <option value="">Select</option>
                      <option value="PRIVATE">Private</option>
                      <option value="GOVERNMENT">Government</option>
                    </select>
                    {schoolForm.formState.errors.ownershipType && (
                      <p className="text-xs mt-1" style={{ color: "var(--color-danger)" }}>{schoolForm.formState.errors.ownershipType.message}</p>
                    )}
                  </div>
                </div>

                {/* State + LGA */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="sh-label">State <span style={{ color: "var(--color-danger)" }}>&bull;</span></label>
                    <select
                      className="input-field"
                      {...schoolForm.register("state")}
                      onChange={(e) => {
                        schoolForm.setValue("state", e.target.value);
                        schoolForm.setValue("lga", "");
                      }}
                    >
                      <option value="">Select state</option>
                      {NIGERIAN_STATES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                    {schoolForm.formState.errors.state && (
                      <p className="text-xs mt-1" style={{ color: "var(--color-danger)" }}>{schoolForm.formState.errors.state.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="sh-label">LGA <span style={{ color: "var(--color-danger)" }}>&bull;</span></label>
                    <select className="input-field" {...schoolForm.register("lga")}>
                      <option value="">Select LGA</option>
                      {(selectedState ? NIGERIAN_LGAS[selectedState] || [] : []).map((l) => (
                        <option key={l} value={l}>{l}</option>
                      ))}
                    </select>
                    {schoolForm.formState.errors.lga && (
                      <p className="text-xs mt-1" style={{ color: "var(--color-danger)" }}>{schoolForm.formState.errors.lga.message}</p>
                    )}
                  </div>
                </div>

                {/* Address */}
                <div>
                  <label className="sh-label">Address <span style={{ color: "var(--color-danger)" }}>&bull;</span></label>
                  <textarea className="input-field" rows={2} placeholder="Full school address" {...schoolForm.register("address")} />
                  {schoolForm.formState.errors.address && (
                    <p className="text-xs mt-1" style={{ color: "var(--color-danger)" }}>{schoolForm.formState.errors.address.message}</p>
                  )}
                </div>

                {/* Extra school profile */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="sh-label">School Motto</label>
                    <input className="input-field" placeholder="e.g. Knowledge is Power" {...schoolForm.register("schoolMotto")} />
                  </div>
                  <div>
                    <label className="sh-label">CAC Number</label>
                    <input className="input-field" placeholder="Optional" {...schoolForm.register("cacNumber")} />
                  </div>
                  <div>
                    <label className="sh-label">School Email</label>
                    <input type="email" className="input-field" placeholder="info@yourschool.ng" {...schoolForm.register("schoolEmail")} />
                  </div>
                  <div>
                    <label className="sh-label">School Phone</label>
                    <input className="input-field" placeholder="Optional" {...schoolForm.register("schoolPhone")} />
                  </div>
                  <div>
                    <label className="sh-label">Principal Name</label>
                    <input className="input-field" placeholder="Optional" {...schoolForm.register("principalName")} />
                  </div>
                  <div>
                    <label className="sh-label">Founding Year</label>
                    <input className="input-field" placeholder="e.g. 1998" {...schoolForm.register("foundingYear")} />
                  </div>
                  <div>
                    <label className="sh-label">Approx. Students</label>
                    <input className="input-field" placeholder="e.g. 450" {...schoolForm.register("numberOfStudents")} />
                  </div>
                  <div>
                    <label className="sh-label">Approx. Staff</label>
                    <input className="input-field" placeholder="e.g. 40" {...schoolForm.register("numberOfStaff")} />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="sh-label">Website</label>
                    <input className="input-field" placeholder="https://yourschool.ng" {...schoolForm.register("websiteUrl")} />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="sh-label">Curriculum</label>
                    <select className="input-field" {...schoolForm.register("curriculum")}>
                      <option value="">Select curriculum</option>
                      <option value="NERDC">NERDC</option>
                      <option value="British">British</option>
                      <option value="American">American</option>
                      <option value="Montessori">Montessori</option>
                      <option value="Hybrid">Hybrid</option>
                    </select>
                  </div>
                </div>

                {/* Class levels offered */}
                <div>
                  <label className="sh-label">Class levels offered <span style={{ color: "var(--color-danger)" }}>&bull;</span></label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {["CRECHE", "KG", "NURSERY", "PRIMARY", "JSS", "SS"].map((lvl) => (
                      <label key={lvl} className="flex items-center gap-2 text-sm px-3 py-2 rounded-lg border border-[var(--border)] cursor-pointer">
                        <input
                          type="checkbox"
                          className="accent-[var(--brand)]"
                          checked={(schoolForm.watch("selectedLevels") || []).includes(lvl)}
                          onChange={(e) => {
                            const current = schoolForm.getValues("selectedLevels") || [];
                            const next = e.target.checked
                              ? Array.from(new Set([...current, lvl]))
                              : current.filter((x: string) => x !== lvl);
                            schoolForm.setValue("selectedLevels", next.length ? next : ["CRECHE", "KG", "NURSERY", "PRIMARY", "JSS", "SS"]);
                          }}
                        />
                        {lvl}
                      </label>
                    ))}
                  </div>
                  <p className="text-xs mt-1" style={{ color: "var(--muted-color)" }}>
                    Creates classes for every selected level so lesson notes can be written for Creche, KG, Nursery, Primary, JSS and SS.
                  </p>
                </div>

                {/* Academic year */}
                <div>
                  <label className="sh-label">Academic year <span style={{ color: "var(--color-danger)" }}>&bull;</span></label>
                  <input className="input-field" placeholder="e.g. 2025/2026" {...schoolForm.register("academicYear")} />
                  {schoolForm.formState.errors.academicYear && (
                    <p className="text-xs mt-1" style={{ color: "var(--color-danger)" }}>{schoolForm.formState.errors.academicYear.message}</p>
                  )}
                </div>

                {/* Divider */}
                <div className="h-px my-1" style={{ background: "var(--border)" }} />

                {/* Admin Full Name */}
                <div>
                  <label className="sh-label">Admin Full Name <span style={{ color: "var(--color-danger)" }}>&bull;</span></label>
                  <input className="input-field" placeholder="e.g. Chidi Okafor" autoComplete="name" {...schoolForm.register("adminFullName")} />
                  {schoolForm.formState.errors.adminFullName && (
                    <p className="text-xs mt-1" style={{ color: "var(--color-danger)" }}>{schoolForm.formState.errors.adminFullName.message}</p>
                  )}
                </div>

                {/* Email + Phone */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="sh-label">Email <span style={{ color: "var(--color-danger)" }}>&bull;</span></label>
                    <input type="email" className="input-field" placeholder="admin@yourschool.ng" autoComplete="email" {...schoolForm.register("email")} />
                    {schoolForm.formState.errors.email && (
                      <p className="text-xs mt-1" style={{ color: "var(--color-danger)" }}>{schoolForm.formState.errors.email.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="sh-label">Phone <span style={{ color: "var(--color-danger)" }}>&bull;</span></label>
                    <input type="tel" className="input-field" placeholder="080 1234 5678" autoComplete="tel" {...schoolForm.register("phone")} />
                    {schoolForm.formState.errors.phone && (
                      <p className="text-xs mt-1" style={{ color: "var(--color-danger)" }}>{schoolForm.formState.errors.phone.message}</p>
                    )}
                  </div>
                </div>

                {/* Password + Confirm */}
                <div className="grid grid-cols-2 gap-3">
                  <PasswordInput
                    label="Password"
                    placeholder="Min. 8 characters"
                    minLength={8}
                    value={schoolForm.watch("password")}
                    onChange={(e) => schoolForm.setValue("password", e.target.value)}
                    required
                    strength
                    autoComplete="new-password"
                    error={schoolForm.formState.errors.password?.message}
                  />
                  <PasswordInput
                    label="Confirm Password"
                    placeholder="Repeat password"
                    value={schoolForm.watch("confirmPassword")}
                    onChange={(e) => schoolForm.setValue("confirmPassword", e.target.value)}
                    required
                    autoComplete="new-password"
                    error={
                      schoolForm.formState.errors.confirmPassword?.message ||
                      (schoolForm.watch("confirmPassword") && schoolForm.watch("password") !== schoolForm.watch("confirmPassword")
                        ? "Passwords don't match"
                        : undefined)
                    }
                  />
                </div>

                {/* Terms */}
                <label className="flex items-start gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    className="w-4 h-4 mt-0.5 rounded cursor-pointer accent-[var(--brand)]"
                    {...schoolForm.register("agreeToTerms")}
                  />
                  <span className="text-[12px] leading-relaxed" style={{ fontFamily: "var(--font-sans)", color: "var(--body-color)" }}>
                    I agree to the{" "}
                    <Link href="/terms" className="hover:underline" style={{ color: "var(--brand)" }}>Terms of Service</Link>
                    {" "}and{" "}
                    <Link href="/privacy" className="hover:underline" style={{ color: "var(--brand)" }}>Privacy Policy</Link>
                  </span>
                </label>
                {schoolForm.formState.errors.agreeToTerms && (
                  <p className="text-xs -mt-2" style={{ color: "var(--color-danger)" }}>{schoolForm.formState.errors.agreeToTerms.message}</p>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full justify-center mt-2"
                  style={{ minHeight: 44, fontSize: 15 }}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 size={16} className="animate-spin" />
                      Creating account...
                    </span>
                  ) : (
                    "Create school account"
                  )}
                </button>
              </form>
            </motion.div>
          )}

          {/* ======================================================== */}
          {/*  STEP 2B: Parent/Teacher Registration Form                */}
          {/* ======================================================== */}
          {accountType === "PARENT_TEACHER" && (
            <motion.div
              key="step-pt"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              {/* Progress indicator */}
              <div className="flex items-center gap-2 mb-6">
                <div className="flex-1 h-1 rounded-full" style={{ background: "var(--border)" }} />
                <div className="flex-1 h-1 rounded-full" style={{ background: "linear-gradient(90deg, #0b6e4f, #12926a)" }} />
              </div>

              <h1
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: 24,
                  fontWeight: 500,
                  color: "var(--heading-color)",
                  letterSpacing: "-0.02em",
                  marginBottom: 6,
                }}
              >
                Join your school
              </h1>
              <p style={{ fontFamily: "var(--font-sans)", fontSize: 14, color: "var(--body-color)", marginBottom: 24, lineHeight: 1.5 }}>
                Enter the invite code from your school administrator
              </p>

              {/* Error */}
              {error && (
                <div className="rounded-xl p-3 mb-5" style={{ background: "rgba(244,63,94,0.05)", border: "1px solid rgba(244,63,94,0.2)" }}>
                  <p className="text-sm" style={{ color: "#e11d48" }}>{error}</p>
                </div>
              )}

              <form onSubmit={ptForm.handleSubmit(onParentTeacherSubmit)} className="flex flex-col gap-4">
                {/* Invite Code */}
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={googleLoading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--card-border)] bg-[var(--surface)] px-4 text-sm font-semibold text-[var(--heading-color)] transition-colors hover:border-brand-300"
                  style={{ minHeight: 48 }}
                >
                  {googleLoading ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                  )}
                  {googleLoading ? "Creating account..." : "Continue with Google"}
                </button>
                <p className="text-center text-xs text-[var(--text-muted)]">or fill the form below</p>
                <div>
                  <label className="sh-label">Invite Code <span style={{ color: "var(--color-danger)" }}>&bull;</span></label>
                  <input className="input-field" placeholder="Enter invite code from your admin" {...ptForm.register("inviteCode")} />
                  {ptForm.formState.errors.inviteCode && (
                    <p className="text-xs mt-1" style={{ color: "var(--color-danger)" }}>{ptForm.formState.errors.inviteCode.message}</p>
                  )}
                </div>

                {/* Full Name */}
                <div>
                  <label className="sh-label">Full Name <span style={{ color: "var(--color-danger)" }}>&bull;</span></label>
                  <input className="input-field" placeholder="e.g. Amina Bello" autoComplete="name" {...ptForm.register("fullName")} />
                  {ptForm.formState.errors.fullName && (
                    <p className="text-xs mt-1" style={{ color: "var(--color-danger)" }}>{ptForm.formState.errors.fullName.message}</p>
                  )}
                </div>

                {/* Email + Phone */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="sh-label">Email <span style={{ color: "var(--color-danger)" }}>&bull;</span></label>
                    <input type="email" className="input-field" placeholder="you@example.com" autoComplete="email" {...ptForm.register("email")} />
                    {ptForm.formState.errors.email && (
                      <p className="text-xs mt-1" style={{ color: "var(--color-danger)" }}>{ptForm.formState.errors.email.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="sh-label">Phone <span style={{ color: "var(--color-danger)" }}>&bull;</span></label>
                    <input type="tel" className="input-field" placeholder="080 1234 5678" autoComplete="tel" {...ptForm.register("phone")} />
                    {ptForm.formState.errors.phone && (
                      <p className="text-xs mt-1" style={{ color: "var(--color-danger)" }}>{ptForm.formState.errors.phone.message}</p>
                    )}
                  </div>
                </div>

                {/* Role */}
                <div>
                  <label className="sh-label">Role <span style={{ color: "var(--color-danger)" }}>&bull;</span></label>
                  <select className="input-field" {...ptForm.register("role")}>
                    <option value="">Select your role</option>
                    <option value="PARENT">Parent</option>
                    <option value="TEACHER">Teacher</option>
                  </select>
                  {ptForm.formState.errors.role && (
                    <p className="text-xs mt-1" style={{ color: "var(--color-danger)" }}>{ptForm.formState.errors.role.message}</p>
                  )}
                </div>

                {/* Password + Confirm */}
                <div className="grid grid-cols-2 gap-3">
                  <PasswordInput
                    label="Password"
                    placeholder="Min. 8 characters"
                    minLength={8}
                    value={ptForm.watch("password")}
                    onChange={(e) => ptForm.setValue("password", e.target.value)}
                    required
                    strength
                    autoComplete="new-password"
                    error={ptForm.formState.errors.password?.message}
                  />
                  <PasswordInput
                    label="Confirm Password"
                    placeholder="Repeat password"
                    value={ptForm.watch("confirmPassword")}
                    onChange={(e) => ptForm.setValue("confirmPassword", e.target.value)}
                    required
                    autoComplete="new-password"
                    error={
                      ptForm.formState.errors.confirmPassword?.message ||
                      (ptForm.watch("confirmPassword") && ptForm.watch("password") !== ptForm.watch("confirmPassword")
                        ? "Passwords don't match"
                        : undefined)
                    }
                  />
                </div>

                {/* Terms */}
                <label className="flex items-start gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    className="w-4 h-4 mt-0.5 rounded cursor-pointer accent-[var(--brand)]"
                    {...ptForm.register("agreeToTerms")}
                  />
                  <span className="text-[12px] leading-relaxed" style={{ fontFamily: "var(--font-sans)", color: "var(--body-color)" }}>
                    I agree to the{" "}
                    <Link href="/terms" className="hover:underline" style={{ color: "var(--brand)" }}>Terms of Service</Link>
                    {" "}and{" "}
                    <Link href="/privacy" className="hover:underline" style={{ color: "var(--brand)" }}>Privacy Policy</Link>
                  </span>
                </label>
                {ptForm.formState.errors.agreeToTerms && (
                  <p className="text-xs -mt-2" style={{ color: "var(--color-danger)" }}>{ptForm.formState.errors.agreeToTerms.message}</p>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full justify-center mt-2"
                  style={{ minHeight: 44, fontSize: 15 }}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 size={16} className="animate-spin" />
                      Creating account...
                    </span>
                  ) : (
                    "Create account"
                  )}
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ---- Login link (when no type selected) ---- */}
      {!accountType && (
        <motion.p
          className="text-center mt-6"
          style={{ fontFamily: "var(--font-sans)", fontSize: 11, color: "var(--muted-color)", lineHeight: 1.6 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.75, duration: 0.4 }}
        >
          By signing up, you agree to our{" "}
          <Link href="/terms" className="hover:underline" style={{ color: "var(--brand)" }}>Terms</Link>
          {" "}and{" "}
          <Link href="/privacy" className="hover:underline" style={{ color: "var(--brand)" }}>Privacy Policy</Link>
        </motion.p>
      )}
    </div>
  );
}
