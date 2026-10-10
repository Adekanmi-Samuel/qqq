"use client";

import { useState, FormEvent, ChangeEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/CookieAuthProvider";
import { UserCheck, ArrowRight, CheckCircle, Eye, EyeOff } from "lucide-react";
import { API_URL } from "@/lib/config";
import { extractApiErrorMessage } from "@/lib/utils";
import { supportWhatsAppUrl } from "@/lib/constants";


export default function StaffSignUpPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [step, setStep] = useState<"code" | "form" | "success">("code");
  const [inviteCode, setInviteCode] = useState("");
  const [verifiedRole, setVerifiedRole] = useState<string>("");
  const [schoolName, setSchoolName] = useState<string>("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const roleLabels: Record<string, string> = {
    TEACHER: "Teacher",
    BURSAR: "Bursar / Accountant",
    PRINCIPAL: "Principal",
  };

  function handleCodeChange(e: ChangeEvent<HTMLInputElement>) {
    let val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "");
    // Auto-insert dash after SH
    if (val.startsWith("SH") && val.length > 2 && val[2] !== "-") {
      val = "SH-" + val.slice(2);
    }
    setInviteCode(val);
  }

  function normalizeCode(input: string) {
    const cleaned = input.replace(/^(SH-|sh-)/i, "").trim();
    return `SH-${cleaned.toUpperCase()}`;
  }

  function validateForm(): Record<string, string> {
    const errors: Record<string, string> = {};
    if (!fullName.trim()) errors.fullName = "Full name is required.";
    else if (fullName.trim().length < 2) errors.fullName = "Name must be at least 2 characters.";
    if (!email.trim()) errors.email = "Email address is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "Please enter a valid email address.";
    if (!password) errors.password = "Password is required.";
    else if (password.length < 6) errors.password = "Password must be at least 6 characters.";
    return errors;
  }

  function validateField(name: string, value: string): string {
    if (name === "fullName") {
      if (!value.trim()) return "Full name is required.";
      if (value.trim().length < 2) return "Name must be at least 2 characters.";
    }
    if (name === "email") {
      if (!value.trim()) return "Email address is required.";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "Please enter a valid email address.";
    }
    if (name === "password") {
      if (!value) return "Password is required.";
      if (value.length < 6) return "Password must be at least 6 characters.";
    }
    return "";
  }

  function handleBlur(name: string, value: string) {
    setTouched((prev) => ({ ...prev, [name]: true }));
    const err = validateField(name, value);
    setFieldErrors((prev) => {
      const next = { ...prev };
      if (err) next[name] = err;
      else delete next[name];
      return next;
    });
  }

  async function handleVerifyCode(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/invites/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: normalizeCode(inviteCode) }),
      });
      const data = await res.json();

      if (!data.success) {
        setError(extractApiErrorMessage(data.error, "Invalid invite code."));
        return;
      }

      // Public verify intentionally returns only { valid: true } (no school/role PII).
      setVerifiedRole("");
      setSchoolName("your school");
      setStep("form");
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(e: FormEvent) {
    e.preventDefault();
    setError("");
    const errors = validateForm();
    setFieldErrors(errors);
    setTouched({ fullName: true, email: true, password: true });
    if (Object.keys(errors).length > 0) {
      setError("Please fix the errors below before continuing.");
      return;
    }
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/auth/register-with-invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // Important: send/receive cookies
        body: JSON.stringify({
          inviteCode: normalizeCode(inviteCode),
          fullName,
          email,
          password,
        }),
      });
      const data = await res.json();

      if (!data.success) {
        setError(extractApiErrorMessage(data.error, "Registration failed."));
        return;
      }

      // With cookie-based auth, the server sets HttpOnly cookies
      // We don't need to manually store tokens anymore
      setStep("success");

      setTimeout(() => {
        // Role is resolved server-side from the invite on register; send users home.
        router.push("/dashboard");
      }, 1500);
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2">
      
      {/* LEFT PANEL   Green brand panel */}
      <div
        className="hidden md:flex flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: "var(--sh-green-800)" }}
      >
        {/* Ruled line texture */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `repeating-linear-gradient(
              transparent, transparent 31px,
              rgba(255,255,255,0.04) 31px, rgba(255,255,255,0.04) 32px
            )`,
          }}
        />

        {/* SH watermark */}
        <div style={{
          position: "absolute", bottom: -40, right: -20,
          fontFamily: "var(--font-display)", fontSize: 280,
          fontWeight: 700, color: "rgba(255,255,255,0.05)",
          lineHeight: 1, userSelect: "none",
        }}>SP</div>

        {/* Logo */}
        <div className="relative">
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            <div style={{
              width: 36, height: 36, background: "rgba(255,255,255,0.15)",
              borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <span style={{
                fontFamily: "var(--font-display)", fontSize: 16,
                fontWeight: 600, color: "var(--sh-amber-400)",
              }}>SP</span>
            </div>
            <span style={{
              fontFamily: "var(--font-sans)", fontSize: 16,
              fontWeight: 600, color: "white",
            }}>SchoolPilot</span>
          </Link>
        </div>

        {/* Middle quote */}
        <div className="relative">
          <div style={{
            width: 40, height: 3, background: "var(--sh-amber-500)",
            borderRadius: 2, marginBottom: 20,
          }} />
          <h2 style={{
            fontFamily: "var(--font-display)", fontVariationSettings: "'opsz' 72",
            fontSize: 36, fontWeight: 400, color: "white",
            lineHeight: 1.3, letterSpacing: "-0.02em", marginBottom: 16,
          }}>
            "Teachers shouldn't be typists."
          </h2>
          <p style={{ fontFamily: "var(--font-sans)", fontSize: 14, color: "rgba(255,255,255,0.6)" }}>
            Join your school's workspace
          </p>
        </div>
      </div>

      {/* RIGHT PANEL   Form */}
      <div
        className="flex flex-col justify-center p-8 md:p-16 relative"
        style={{ background: "var(--sh-ink-50)" }}
      >
        {/* Mobile logo */}
        <div className="md:hidden mb-8">
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
            <div style={{
              width: 32, height: 32, background: "var(--sh-green-800)",
              borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <span style={{ fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 600, color: "var(--sh-amber-500)" }}>SP</span>
            </div>
            <span style={{ fontFamily: "var(--font-sans)", fontWeight: 600, color: "var(--sh-ink-900)" }}>SchoolPilot</span>
          </Link>
        </div>

        <div style={{ maxWidth: 380, width: "100%", margin: "0 auto" }}>
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Step 1: Enter invite code */}
          {step === "code" && (
            <div>
              <h1 style={{
                fontFamily: "var(--font-display)", fontVariationSettings: "'opsz' 40",
                fontSize: 32, fontWeight: 500, letterSpacing: "-0.02em",
                color: "var(--sh-ink-900)", marginBottom: 6, textAlign: "center",
              }}>Join your school</h1>
              <p style={{
                fontFamily: "var(--font-sans)", fontSize: 14,
                color: "var(--sh-ink-400)", marginBottom: 32, textAlign: "center"
              }}>Ask your school admin for your invite code</p>

              <form onSubmit={handleVerifyCode} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <input
                  type="text"
                  value={inviteCode}
                  onChange={handleCodeChange}
                  className="w-full text-center text-4xl font-display font-medium text-brand-ink py-6 border-b-2 border-dashed border-gray-300 focus:border-sh-green-500 focus:outline-none transition-colors"
                  placeholder="SH-A1B2C3"
                  required
                  disabled={loading}
                  style={{ background: "transparent", textTransform: "uppercase" }}
                />
                <p className="text-center text-sm text-gray-500 mt-4">
                  Type <strong>SH</strong> and the dash will auto-insert.
                </p>

                <button
                  type="submit"
                  disabled={loading || !inviteCode.trim() || inviteCode.length < 6}
                  className="btn-primary"
                  style={{ width: "100%", justifyContent: "center", marginTop: 16, padding: "13px 0", fontSize: 15 }}
                >
                  {loading ? "Verifying..." : "Verify Code"}
                </button>
              </form>
            </div>
          )}

          {/* Step 2: Registration form */}
          {step === "form" && (
            <div>
              <h1 style={{
                fontFamily: "var(--font-display)", fontVariationSettings: "'opsz' 40",
                fontSize: 32, fontWeight: 500, letterSpacing: "-0.02em",
                color: "var(--sh-ink-900)", marginBottom: 6,
              }}>Create your account</h1>
              <p style={{
                fontFamily: "var(--font-sans)", fontSize: 14,
                color: "var(--sh-ink-400)", marginBottom: 32,
              }}>You've been invited to join {schoolName}</p>

              <div className="p-3 bg-schoolhub-50 rounded-xl border border-schoolhub-100 flex items-center gap-3 mb-6">
                <UserCheck className="w-5 h-5 text-schoolhub-600 flex-shrink-0" />
                <div className="text-sm font-sans">
                  <p className="font-medium text-schoolhub-800">Role: {roleLabels[verifiedRole] || verifiedRole}</p>
                </div>
              </div>

              <form onSubmit={handleRegister} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <label className="sh-label mb-2 block">Full Name <span style={{ color: "var(--color-danger)" }}>&bull;</span></label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    onBlur={(e) => handleBlur("fullName", e.target.value)}
                    placeholder="e.g. Chioma Okafor"
                    className="sh-input"
                    required
                    disabled={loading}
                    aria-invalid={!!fieldErrors.fullName && touched.fullName}
                    style={touched.fullName && fieldErrors.fullName ? { borderColor: "var(--color-danger)" } : undefined}
                  />
                  {touched.fullName && fieldErrors.fullName && (
                    <p className="text-xs mt-1" style={{ color: "var(--color-danger)" }}>{fieldErrors.fullName}</p>
                  )}
                </div>

                <div>
                  <label className="sh-label mb-2 block">Email Address <span style={{ color: "var(--color-danger)" }}>&bull;</span></label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onBlur={(e) => handleBlur("email", e.target.value)}
                    placeholder="you@email.com"
                    className="sh-input"
                    required
                    disabled={loading}
                    aria-invalid={!!fieldErrors.email && touched.email}
                    style={touched.email && fieldErrors.email ? { borderColor: "var(--color-danger)" } : undefined}
                  />
                  {touched.email && fieldErrors.email && (
                    <p className="text-xs mt-1" style={{ color: "var(--color-danger)" }}>{fieldErrors.email}</p>
                  )}
                </div>

                <div>
                  <label className="sh-label mb-2 block">Password <span style={{ color: "var(--color-danger)" }}>&bull;</span></label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onBlur={(e) => handleBlur("password", e.target.value)}
                      placeholder="At least 6 characters"
                      className="sh-input pr-12"
                      required
                      minLength={6}
                      disabled={loading}
                      aria-invalid={!!fieldErrors.password && touched.password}
                      style={touched.password && fieldErrors.password ? { borderColor: "var(--color-danger)" } : undefined}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {touched.password && fieldErrors.password && (
                    <p className="text-xs mt-1" style={{ color: "var(--color-danger)" }}>{fieldErrors.password}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading || !fullName || !email || password.length < 6}
                  className="btn-primary"
                  style={{ width: "100%", justifyContent: "center", marginTop: 8, padding: "13px 0", fontSize: 15 }}
                >
                  {loading ? "Creating Account..." : "Create Account"}
                </button>
              </form>
            </div>
          )}

          {/* Step 3: Success */}
          {step === "success" && (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-brand-ink font-fraunces">
                  Account Created!
                </h2>
                <p className="text-sm text-gray-500 font-sans mt-1">
                  Redirecting you to your dashboard...
                </p>
              </div>
            </div>
          )}

          {/* Secondary links */}
          {step === "code" && (
            <>
              <div style={{
                display: "flex", alignItems: "center", gap: 12, margin: "24px 0",
              }}>
                <div style={{ flex: 1, height: 1, background: "var(--color-border)" }} />
                <span style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--sh-ink-300)" }}>or</span>
                <div style={{ flex: 1, height: 1, background: "var(--color-border)" }} />
              </div>
              <p style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--sh-ink-500)", textAlign: "center" }}>
                Already have an account?{" "}
                <Link href="/login" style={{ color: "var(--sh-green-700)", fontWeight: 500, textDecoration: "none" }}>
                  Sign in
                </Link>
              </p>
            </>
          )}
        </div>

        {/* Floating WhatsApp Help */}
        <a 
          href={supportWhatsAppUrl("Hi, I need help registering as a staff member on SchoolPilot")}
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-[#25D366] text-white px-4 py-3 rounded-full shadow-lg hover:bg-[#1ebe5d] transition-colors text-sm font-medium"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
          </svg>
          Need help?
        </a>
      </div>
    </div>
  );
}
