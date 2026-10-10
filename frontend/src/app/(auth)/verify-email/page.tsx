"use client";

import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { MailCheck, Loader2 } from "lucide-react";
import { API_URL } from "@/lib/config";

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
export default function VerifyEmailPage() {
  const [cooldown, setCooldown] = useState(60);
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  /* ---- Cooldown timer ---- */
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  /* ---- Resend email ---- */
  const handleResend = useCallback(async () => {
    setResending(true);
    setResent(false);
    try {
      await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "" }),
      });
      setResent(true);
      setCooldown(60);
    } catch {
      // Silent fail
    } finally {
      setResending(false);
    }
  }, []);

  return (
    <motion.div
      className="w-full max-w-[440px] text-center"
      style={{
        background: "var(--card-bg)",
        borderRadius: 20,
        padding: "48px 32px 40px",
        boxShadow:
          "0 1px 3px rgba(11,110,79,0.06), 0 8px 32px rgba(11,110,79,0.06), 0 0 0 1px rgba(11,110,79,0.04)",
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.5, ease: "easeOut" }}
    >
      {/* ---- Icon ---- */}
      <motion.div
        className="mx-auto mb-6 relative"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.4, duration: 0.5, ease: "easeOut" }}
      >
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center mx-auto"
          style={{
            background: "linear-gradient(135deg, rgba(11,110,79,0.1) 0%, rgba(11,110,79,0.05) 100%)",
            border: "1px solid rgba(11,110,79,0.12)",
          }}
        >
          <MailCheck className="w-10 h-10" style={{ color: "var(--brand)" }} />
        </div>
        {/* Glow ring */}
        <div
          className="absolute inset-0 w-20 h-20 mx-auto rounded-full pointer-events-none"
          style={{
            boxShadow: "0 0 30px rgba(11,110,79,0.15), 0 0 60px rgba(11,110,79,0.05)",
            animation: "glow-pulse 3s ease-in-out infinite",
          }}
        />
      </motion.div>

      {/* ---- Heading ---- */}
      <motion.h1
        style={{
          fontFamily: "var(--font-display)",
          fontSize: 26,
          fontWeight: 500,
          color: "var(--heading-color)",
          letterSpacing: "-0.02em",
          marginBottom: 12,
        }}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.4 }}
      >
        Check your email
      </motion.h1>

      <motion.p
        style={{
          fontFamily: "var(--font-sans)",
          fontSize: 14,
          color: "var(--body-color)",
          lineHeight: 1.6,
          marginBottom: 32,
          maxWidth: 320,
          marginLeft: "auto",
          marginRight: "auto",
        }}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55, duration: 0.4 }}
      >
        We&apos;ve sent a verification link to your email address. Click the link to verify your account.
      </motion.p>

      {/* ---- Resend button ---- */}
      <motion.div
        className="flex flex-col items-center gap-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.65, duration: 0.4 }}
      >
        <button
          type="button"
          onClick={handleResend}
          disabled={cooldown > 0 || resending}
          className="btn-primary w-full justify-center"
          style={{ minHeight: 44, fontSize: 14 }}
        >
          {resending ? (
            <span className="flex items-center gap-2">
              <Loader2 size={16} className="animate-spin" />
              Sending...
            </span>
          ) : cooldown > 0 ? (
            `Resend email in ${cooldown}s`
          ) : (
            "Resend verification email"
          )}
        </button>

        {resent && (
          <p className="text-sm" style={{ color: "var(--brand)" }}>
            Verification email resent! Check your inbox.
          </p>
        )}
      </motion.div>

      {/* ---- Back to login ---- */}
      <motion.div
        className="mt-8 pt-6"
        style={{ borderTop: "1px solid var(--border)" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.75, duration: 0.4 }}
      >
        <Link
          href="/login"
          className="text-sm font-medium hover:underline"
          style={{ color: "var(--brand)" }}
        >
          Back to sign in
        </Link>
      </motion.div>
    </motion.div>
  );
}
