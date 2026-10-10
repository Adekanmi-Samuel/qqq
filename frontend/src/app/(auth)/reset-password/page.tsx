"use client";

import Link from "next/link";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import WheelIcon from "@/components/WheelIcon";
import { Loader2, KeyRound } from "lucide-react";
import { API_URL } from "@/lib/config";
import PasswordInput from "@/components/ui/password-input";

/* ------------------------------------------------------------------ */
/*  Schema                                                             */
/* ------------------------------------------------------------------ */
const resetPasswordSchema = z
  .object({
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters.")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter.")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter.")
      .regex(/[0-9]/, "Password must contain at least one number."),
    confirmPassword: z.string().min(1, "Please confirm your password."),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

/* ------------------------------------------------------------------ */
/*  Form (uses useSearchParams, must be wrapped in Suspense)           */
/* ------------------------------------------------------------------ */
function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const {
    watch,
    setValue,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { newPassword: "", confirmPassword: "" },
  });

  const newPassword = watch("newPassword");
  const confirmPassword = watch("confirmPassword");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // cookie auth

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword }),
      });

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to reset password.");
      }

      setSuccess(true);
      toast.success("Password reset successful!");

      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Something went wrong. Please try again.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  /* ---- Invalid token state ---- */
  if (!token) {
    return (
      <div className="text-center">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
          style={{ background: "rgba(244,63,94,0.1)" }}
        >
          <KeyRound className="w-6 h-6" style={{ color: "var(--color-danger)" }} />
        </div>
        <h3 className="text-lg font-medium mb-2" style={{ color: "var(--heading-color)" }}>
          Invalid Link
        </h3>
        <p className="text-sm mb-6" style={{ color: "var(--body-color)" }}>
          This password reset link is invalid or has expired.
        </p>
        <Link href="/forgot-password" className="btn-primary justify-center w-full inline-flex" style={{ minHeight: 44 }}>
          Request new link
        </Link>
      </div>
    );
  }

  return (
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
            <KeyRound className="w-6 h-6" style={{ color: "var(--brand)" }} />
          </div>
          <h3 className="text-lg font-medium mb-2" style={{ color: "var(--heading-color)" }}>
            Password Reset!
          </h3>
          <p className="text-sm mb-6" style={{ color: "var(--body-color)" }}>
            Your password has been changed successfully. Redirecting to login...
          </p>
          <Link href="/login" className="text-sm font-medium hover:underline" style={{ color: "var(--brand)" }}>
            Click here if not redirected
          </Link>
        </motion.div>
      ) : (
        /* ---- Form ---- */
        <motion.form
          key="form"
          onSubmit={handleSubmit}
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

          {/* New Password */}
          <PasswordInput
            label="New password"
            placeholder="Min. 8 characters"
            value={newPassword}
            onChange={(e) => setValue("newPassword", e.target.value)}
            required
            minLength={8}
            strength
            autoComplete="new-password"
          />
          {errors.newPassword && (
            <p className="text-xs -mt-3" style={{ color: "var(--color-danger)" }}>
              {errors.newPassword.message}
            </p>
          )}

          {/* Confirm Password */}
          <PasswordInput
            label="Confirm new password"
            placeholder="Repeat password"
            value={confirmPassword}
            onChange={(e) => setValue("confirmPassword", e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
            error={
              confirmPassword && newPassword !== confirmPassword
                ? "Passwords don't match"
                : undefined
            }
          />
          {errors.confirmPassword && (
            <p className="text-xs -mt-3" style={{ color: "var(--color-danger)" }}>
              {errors.confirmPassword.message}
            </p>
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
                Resetting...
              </span>
            ) : (
              "Reset password"
            )}
          </button>
        </motion.form>
      )}
    </AnimatePresence>
  );
}

/* ------------------------------------------------------------------ */
/*  Page (wraps form in Suspense for useSearchParams)                  */
/* ------------------------------------------------------------------ */
export default function ResetPasswordPage() {
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
      {/* Back to login */}
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

      {/* Logo */}
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

      {/* Heading */}
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
        Set new password
      </h1>
      <p style={{ fontFamily: "var(--font-sans)", fontSize: 14, color: "var(--body-color)", marginBottom: 28, lineHeight: 1.5 }}>
        Please enter your new password below.
      </p>

      <Suspense
        fallback={
          <div className="flex justify-center p-4">
            <Loader2 className="animate-spin" style={{ color: "var(--muted-color)" }} />
          </div>
        }
      >
        <ResetPasswordForm />
      </Suspense>
    </motion.div>
  );
}
