"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth, getDashboardRoute } from "@/lib/auth/CookieAuthProvider";
import { redirectToProductionIfStale } from "@/lib/authOrigins";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { Suspense } from "react";

/* ------------------------------------------------------------------ */
/*  Schema                                                             */
/* ------------------------------------------------------------------ */
const loginSchema = z.object({
  email: z.string().min(1, "Please enter your email address.").email("Please enter a valid email address."),
  password: z.string().min(1, "Please enter your password."),
  remember: z.boolean(),
});

type LoginFormData = z.infer<typeof loginSchema>;

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, signInWithGoogle } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");

  // Leave stale hosts (schoolpilot.vercel.app) before auth can bounce there.
  useEffect(() => {
    redirectToProductionIfStale();
  }, []);

  // Surface Google OAuth errors from the callback redirect.
  useEffect(() => {
    const err = searchParams.get("error");
    if (err) setError(decodeURIComponent(err));
  }, [searchParams]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "", remember: false },
  });

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

  /* ---- form submission ---- */
  const onSubmit = async (data: LoginFormData) => {
    setError("");
    setLoading(true);

    try {
      // Use the new cookie-based login method
      const result = await login(data.email, data.password, data.remember);

      toast.success(result.message || "Welcome back!");

      const route = getDashboardRoute(result.user.role);
      router.replace(route);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Something went wrong. Please try again.";
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
    <motion.div
      className="w-full max-w-[420px] rounded-[20px] px-5 py-7 md:px-8 md:py-9"
      style={{
        background: "var(--card-bg)",
        boxShadow:
          "0 1px 3px rgba(11,110,79,0.06), 0 8px 32px rgba(11,110,79,0.06), 0 0 0 1px rgba(11,110,79,0.04)",
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.5, ease: "easeOut" }}
    >
      {/* ---- Heading ---- */}
      <motion.h1
        style={{
          fontFamily: "var(--font-display)",
          fontSize: 28,
          fontWeight: 500,
          color: "var(--heading-color)",
          letterSpacing: "-0.02em",
          marginBottom: 6,
        }}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.4 }}
      >
        Welcome back
      </motion.h1>
      <motion.p
        style={{
          fontFamily: "var(--font-sans)",
          fontSize: 14,
          color: "var(--body-color)",
          marginBottom: 28,
          lineHeight: 1.5,
        }}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45, duration: 0.4 }}
      >
        Sign in to your SchoolPilot account
      </motion.p>

      {/* ---- Error ---- */}
      <AnimatePresence>
        {error && (
          <motion.div
            className="rounded-xl p-3 mb-5"
            role="alert"
            aria-live="assertive"
            style={{
              background: "rgba(244,63,94,0.05)",
              border: "1px solid rgba(244,63,94,0.2)",
            }}
            initial={{ opacity: 0, y: -8, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -8, height: 0 }}
            transition={{ duration: 0.25 }}
          >
            <p className="text-sm" style={{ color: "#e11d48" }}>
              {error}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Help path for failed sign in */}
      <p className="text-center mb-4 text-xs text-[var(--text-muted)]">
        Trouble signing in?{" "}
        <a href="/contact" className="hover:underline" style={{ color: "var(--muted-color)" }}>
          Contact support
        </a>
      </p>

      {/* ---- Google first ---- */}
      <motion.button
        type="button"
        onClick={handleGoogleLogin}
        disabled={googleLoading}
        className="btn-secondary w-full justify-center inline-flex items-center justify-center gap-2.5"
        aria-label="Sign in with Google"
        style={{ minHeight: 48, fontSize: 14, fontWeight: 600 }}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45, duration: 0.4 }}
        whileHover={{ boxShadow: "0 2px 10px rgba(0,0,0,0.07)" }}
        whileTap={{ scale: 0.99 }}
      >
        {googleLoading ? (
          <Loader2 size={18} className="animate-spin" />
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="shrink-0">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
        )}
        <span>{googleLoading ? "Signing in..." : "Continue with Google"}</span>
      </motion.button>

      {/* ---- OR divider ---- */}
      <motion.div
        className="flex items-center gap-3.5 my-5"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.4 }}
      >
        <div className="flex-1 h-px" style={{ background: "var(--card-border)" }} />
        <span
          className="text-[12px] font-medium"
          style={{ fontFamily: "var(--font-sans)", color: "var(--muted-color)" }}
        >
          or sign in with email
        </span>
        <div className="flex-1 h-px" style={{ background: "var(--card-border)" }} />
      </motion.div>

      {/* ---- Form ---- */}
      <motion.form
        onSubmit={handleSubmit(onSubmit)}
        method="post"
        noValidate
        className="flex flex-col gap-[18px]"
        aria-label="Sign in to your account"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55, duration: 0.5 }}
      >
        {/* Email */}
        <div>
          <label
            htmlFor="login-email"
            className="block text-[13px] font-medium mb-1.5"
            style={{ fontFamily: "var(--font-sans)", color: "var(--body-color)" }}
          >
            Email address <span style={{ color: "var(--color-danger)" }}>&bull;</span>
          </label>
          <input
            id="login-email"
            type="email"
            placeholder="admin@yourschool.edu.ng"
            className={`input-field${errors.email ? " border-[var(--color-danger)]" : ""}`}
            style={errors.email ? { borderColor: "var(--color-danger)" } : undefined}
            autoComplete="username"
            aria-describedby={errors.email ? "login-email-error" : undefined}
            aria-invalid={errors.email ? "true" : undefined}
            {...register("email")}
          />
          {errors.email && (
            <p id="login-email-error" className="text-xs mt-1" role="alert" style={{ color: "var(--color-danger)" }}>
              {errors.email.message}
            </p>
          )}
        </div>

        {/* Password */}
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label
              htmlFor="login-password"
              className="text-[13px] font-medium"
              style={{ fontFamily: "var(--font-sans)", color: "var(--body-color)" }}
            >
              Password <span style={{ color: "var(--color-danger)" }}>&bull;</span>
            </label>
            <Link
              href="/forgot-password"
              className="text-[12px] font-medium hover:underline"
              style={{ color: "var(--brand)" }}
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <input
              id="login-password"
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              className={`input-field pr-14${errors.password ? " border-[var(--color-danger)]" : ""}`}
              style={errors.password ? { borderColor: "var(--color-danger)" } : undefined}
              autoComplete="current-password"
              aria-describedby={errors.password ? "login-password-error" : undefined}
              aria-invalid={errors.password ? "true" : undefined}
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 min-w-[44px] min-h-[44px] flex items-center justify-center transition-colors"
              style={{ color: "var(--muted-color)" }}
              tabIndex={-1}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          {errors.password && (
            <p id="login-password-error" className="text-xs mt-1" role="alert" style={{ color: "var(--color-danger)" }}>
              {errors.password.message}
            </p>
          )}
        </div>

        {/* Remember me */}
        <label className="flex items-center gap-2.5 cursor-pointer select-none min-h-[44px]">
          <input
            type="checkbox"
            className="w-5 h-5 rounded cursor-pointer accent-[var(--brand)]"
            {...register("remember")}
          />
          <span
            className="text-[13px]"
            style={{ fontFamily: "var(--font-sans)", color: "var(--body-color)" }}
          >
            Remember me
          </span>
        </label>

        {/* Sign in button */}
        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full justify-center mt-1"
          style={{ minHeight: 48, fontSize: 15, fontWeight: 600 }}
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <Loader2 size={16} className="animate-spin" />
              Signing in...
            </span>
          ) : (
            "Sign in"
          )}
        </button>
      </motion.form>

      {/* ---- Register link ---- */}
      <motion.p
        className="text-center mt-5"
        style={{
          fontFamily: "var(--font-sans)",
          fontSize: 13,
          color: "var(--body-color)",
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.65, duration: 0.4 }}
      >
        Don&apos;t have an account?{" "}
        <Link
          href="/signup"
          className="font-semibold hover:underline"
          style={{ color: "var(--brand)" }}
        >
          Sign up free
        </Link>
      </motion.p>

      {/* ---- Footer note ---- */}
      <motion.p
        className="text-center mt-6 leading-relaxed"
        style={{
          fontFamily: "var(--font-sans)",
          fontSize: 11,
          color: "var(--muted-color)",
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.75, duration: 0.4 }}
      >
        By signing in, you agree to our{" "}
        <Link href="/terms" className="hover:underline" style={{ color: "var(--brand)" }}>
          Terms
        </Link>{" "}
        and{" "}
        <Link href="/privacy" className="hover:underline" style={{ color: "var(--brand)" }}>
          Privacy Policy
        </Link>
      </motion.p>
    </motion.div>
  );
}
