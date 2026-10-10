"use client";

import { useState, FormEvent, ChangeEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/CookieAuthProvider";
import { CheckCircle, Eye, EyeOff } from "lucide-react";
import WheelIcon from "@/components/WheelIcon";
import { API_URL } from "@/lib/config";
import { extractApiErrorMessage } from "@/lib/utils";


export default function StudentSignUpPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [step, setStep] = useState<"code" | "form" | "success">("code");
  const [inviteCode, setInviteCode] = useState("");
  const [schoolName, setSchoolName] = useState<string>("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  function handleCodeChange(e: ChangeEvent<HTMLInputElement>) {
    let val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "");
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
    else if (password.length < 8) errors.password = "Password must be at least 8 characters.";
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
      if (value.length < 8) return "Password must be at least 8 characters.";
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

      // Public verify intentionally returns only { valid: true } (no role/school PII).
      setSchoolName("your school");
      setStep("form");
    } catch {
      setError("Network error. Please try again.");
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
        router.push("/dashboard/student");
      }, 2000);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const inputStyle = {
    width: "100%" as const,
    padding: "10px 14px",
    borderRadius: 10,
    border: "1.5px solid var(--card-border)",
    background: "var(--card-bg)",
    color: "var(--heading-color)",
    fontSize: 14,
    outline: "none" as const,
    boxSizing: "border-box" as const,
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 440, background: "var(--card-bg)", borderRadius: 20, padding: "40px 32px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ width: 48, height: 48, background: "linear-gradient(135deg, #0b6e4f, #12926a)", borderRadius: 12, display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
            <WheelIcon size={24} variant="light" />
          </div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 600, color: "var(--heading-color)", marginBottom: 4 }}>Student Registration</h1>
          <p style={{ fontSize: 14, color: "var(--muted-color)" }}>
            {step === "code" ? "Enter your invite code from your school" : step === "form" ? `Join ${schoolName}` : ""}
          </p>
        </div>

        {error && <div style={{ background: "rgba(244,63,94,0.06)", border: "1px solid rgba(244,63,94,0.2)", borderRadius: 10, padding: "10px 14px", marginBottom: 20, fontSize: 13, color: "#e11d48" }}>{error}</div>}

        {step === "code" && (
          <form onSubmit={handleVerifyCode}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--text-muted)", marginBottom: 6 }}>Invite Code</label>
            <input type="text" placeholder="SH-XXXXXXXX" value={inviteCode} onChange={handleCodeChange} maxLength={11} required
              style={{ ...inputStyle, fontFamily: "monospace", fontSize: 16, letterSpacing: "0.05em", marginBottom: 20 }} />
            <button type="submit" disabled={loading || inviteCode.length < 10}
              style={{ width: "100%", padding: "12px 0", borderRadius: 10, border: "none", background: "linear-gradient(135deg, #0b6e4f, #12926a)", color: "#fff", fontSize: 15, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", opacity: loading || inviteCode.length < 10 ? 0.6 : 1, fontFamily: "var(--font-sans)" }}>
              {loading ? "Verifying..." : "Verify Code"}
            </button>
          </form>
        )}

        {step === "form" && (
          <form onSubmit={handleRegister} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--text-muted)", marginBottom: 6 }}>Full Name <span style={{ color: "var(--color-danger)" }}>&bull;</span></label>
              <input type="text" placeholder="e.g. Aisha Mohammed" value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                onBlur={(e) => handleBlur("fullName", e.target.value)}
                required
                aria-invalid={!!fieldErrors.fullName && touched.fullName}
                style={touched.fullName && fieldErrors.fullName ? { ...inputStyle, borderColor: "var(--color-danger)" } : inputStyle} />
              {touched.fullName && fieldErrors.fullName && (
                <p style={{ fontSize: 12, color: "var(--color-danger)", marginTop: 4 }}>{fieldErrors.fullName}</p>
              )}
            </div>
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--text-muted)", marginBottom: 6 }}>Email <span style={{ color: "var(--color-danger)" }}>&bull;</span></label>
              <input type="email" placeholder="you@email.com" value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={(e) => handleBlur("email", e.target.value)}
                required
                aria-invalid={!!fieldErrors.email && touched.email}
                style={touched.email && fieldErrors.email ? { ...inputStyle, borderColor: "var(--color-danger)" } : inputStyle} />
              {touched.email && fieldErrors.email && (
                <p style={{ fontSize: 12, color: "var(--color-danger)", marginTop: 4 }}>{fieldErrors.email}</p>
              )}
            </div>
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--text-muted)", marginBottom: 6 }}>Password <span style={{ color: "var(--color-danger)" }}>&bull;</span></label>
              <div style={{ position: "relative" }}>
                <input type={showPassword ? "text" : "password"} placeholder="Min 8 characters" value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={(e) => handleBlur("password", e.target.value)}
                  required minLength={8}
                  aria-invalid={!!fieldErrors.password && touched.password}
                  style={{ ...(touched.password && fieldErrors.password ? { ...inputStyle, borderColor: "var(--color-danger)", padding: "10px 40px 10px 14px" } : { ...inputStyle, padding: "10px 40px 10px 14px" }) }} />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", padding: 8, color: "var(--muted-color)" }}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {touched.password && fieldErrors.password && (
                <p style={{ fontSize: 12, color: "var(--color-danger)", marginTop: 4 }}>{fieldErrors.password}</p>
              )}
            </div>
            <button type="submit" disabled={loading || !fullName || !email || password.length < 8}
              style={{ width: "100%", padding: "12px 0", borderRadius: 10, border: "none", background: "linear-gradient(135deg, #0b6e4f, #12926a)", color: "#fff", fontSize: 15, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", opacity: loading || !fullName || !email || password.length < 8 ? 0.6 : 1, fontFamily: "var(--font-sans)", marginTop: 4 }}>
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </form>
        )}

        {step === "success" && (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <CheckCircle style={{ width: 48, height: 48, color: "var(--brand)", marginBottom: 16 }} />
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 600, color: "var(--heading-color)", marginBottom: 8 }}>Welcome to {schoolName}!</h2>
            <p style={{ fontSize: 14, color: "var(--muted-color)" }}>Redirecting to your dashboard...</p>
          </div>
        )}

        <p style={{ textAlign: "center", fontSize: 13, color: "var(--muted-color)", marginTop: 24 }}>
          <Link href="/login" style={{ color: "var(--brand)", textDecoration: "none", fontWeight: 500 }}>Already have an account? Sign in</Link>
        </p>
      </div>
    </div>
  );
}
