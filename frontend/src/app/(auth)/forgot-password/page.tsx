"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, MailCheck } from "lucide-react";
import WheelIcon from "@/components/WheelIcon";
import { API_URL } from "@/lib/config";

/* ------------------------------------------------------------------ */
/*  Schema                                                             */
/* ------------------------------------------------------------------ */
const forgotPasswordSchema = z.object({
  email: z.string().min(1, "Please enter your email address.").email("Please enter a valid email address."),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.email }),
      });

      const result = await res.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to send reset link.");
      }

      setSubmittedEmail(data.email);
      setSuccess(true);
      toast.success("Password reset link sent!");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Something went wrong. Please try again.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      className="w-full max-w-[440px]"
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
      {/* ---- Back to login ---- */}
      <Link
        href="/login"
        className="flex items-center gap-2 text-sm mb-6 transition-colors hover:opacity-80"
        style={{ fontFamily: "var(--font-sans)", color: "var(--muted-color)" }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5" /><path d="M12 19l-7-7 7-7" />
        </svg>
        Back to login
      </Link>

      {/* ---- Logo ---- */}
      <div
        className="mb-5"
        style={{
          width: 48,
          height: 48,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <WheelIcon size={48} variant="light" />
      </div>

      {/* ---- Heading ---- */}
      <h1
        style={{
          fontFamily: "var(--font-display)",
          fontSize: 28,
          fontWeight: 500,
          color: "var(--heading-color)",
          letterSpacing: "-0.02em",
          marginBottom: 8,
        }}
      >
        Reset your password
      </h1>
      <p style={{ fontFamily: "var(--font-sans)", fontSize: 14, color: "var(--body-color)", marginBottom: 28, lineHeight: 1.5 }}>
        Enter your email address and we&apos;ll send you a link to reset your password.
      </p>

      <AnimatePresence mode="wait">
        {/* ---- Success state ---- */}
        {success ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-xl p-6 text-center"
            style={{
              background: "rgba(11,110,79,0.04)",
              border: "1px solid rgba(11,110,79,0.15)",
            }}
          >
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: "rgba(11,110,79,0.1)" }}
            >
              <MailCheck className="w-6 h-6" style={{ color: "var(--brand)" }} />
            </div>
            <h3 className="text-lg font-medium mb-2" style={{ color: "var(--heading-color)" }}>
              Check your email
            </h3>
            <p className="text-sm mb-6" style={{ color: "var(--body-color)" }}>
              We sent a password reset link to<br />
              <strong>{submittedEmail}</strong>
            </p>
            <button
              onClick={() => setSuccess(false)}
              className="text-sm font-medium hover:underline"
              style={{ color: "var(--brand)", background: "none", border: "none", cursor: "pointer" }}
            >
              Didn&apos;t receive it? Try again
            </button>
          </motion.div>
        ) : (
          /* ---- Form ---- */
          <motion.form
            key="form"
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col gap-5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  className="rounded-xl p-3"
                  style={{
                    background: "rgba(244,63,94,0.05)",
                    border: "1px solid rgba(244,63,94,0.2)",
                  }}
                  initial={{ opacity: 0, y: -10, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: "auto" }}
                  exit={{ opacity: 0, y: -10, height: 0 }}
                >
                  <p className="text-sm" style={{ color: "#e11d48" }}>{error}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Email */}
            <div>
              <label className="sh-label">Email address <span style={{ color: "var(--color-danger)" }}>&bull;</span></label>
              <input
                type="email"
                className={`input-field${errors.email ? " border-[var(--color-danger)]" : ""}`}
                style={errors.email ? { borderColor: "var(--color-danger)" } : undefined}
                placeholder="admin@yourschool.edu.ng"
                autoComplete="email"
                aria-invalid={errors.email ? "true" : undefined}
                {...register("email")}
              />
              {errors.email && (
                <p className="text-xs mt-1" style={{ color: "var(--color-danger)" }}>
                  {errors.email.message}
                </p>
              )}
            </div>

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
                  Sending link...
                </span>
              ) : (
                "Send reset link"
              )}
            </button>
          </motion.form>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
