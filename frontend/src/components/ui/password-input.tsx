"use client";

import { useState, useId } from "react";
import { Eye, EyeOff } from "lucide-react";

interface PasswordInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
  error?: string;
  strength?: boolean;
  required?: boolean;
}

function getStrengthScore(password: string): { score: number; label: string; color: string } {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 2) return { score: 1, label: "Weak", color: "bg-[var(--color-danger)]" };
  if (score <= 3) return { score: 2, label: "Fair", color: "bg-[var(--sh-amber-500)]" };
  if (score <= 4) return { score: 3, label: "Good", color: "bg-[var(--color-info)]" };
  return { score: 4, label: "Strong", color: "bg-[var(--sh-green-800)]" };
}

export default function PasswordInput({ label, error, strength, className, required, ...props }: PasswordInputProps) {
  const [show, setShow] = useState(false);
  const val = typeof props.value === "string" ? props.value : "";
  const str = strength && val.length > 0 ? getStrengthScore(val) : null;
  const inputId = useId();
  const strengthId = useId();
  const errorId = useId();
  const hintId = useId();

  const describedBy = [str ? strengthId : null, error ? errorId : null, hintId].filter(Boolean).join(" ");

  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={inputId} className="sh-label">
          {label} {required && <span style={{ color: "var(--color-danger)" }}>&bull;</span>}
        </label>
      )}
      <div className="relative">
        <input
          id={inputId}
          type={show ? "text" : "password"}
          className={`w-full rounded-xl border-1.5 border-[var(--card-border)] bg-[var(--surface)] text-[var(--text)] px-4 py-2.5 pr-14 text-sm font-sans outline-none focus:border-[var(--sh-green-800)] focus:ring-2 focus:ring-[var(--sh-green-800)]/15 transition-all placeholder:text-[var(--text-muted)] ${error ? "border-[var(--color-danger)]" : ""} ${className || ""}`}
          aria-invalid={!!error}
          aria-describedby={describedBy || undefined}
          required={required}
          {...props}
        />
        <button
          type="button"
          onClick={() => setShow(!show)}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
          tabIndex={-1}
          aria-label={show ? "Hide password" : "Show password"}
          aria-pressed={show}
        >
          {show ? <EyeOff className="w-5 h-5" aria-hidden="true" /> : <Eye className="w-5 h-5" aria-hidden="true" />}
        </button>
      </div>
      {error && (
        <p id={errorId} className="text-xs text-[var(--color-danger)]" role="alert">
          {error}
        </p>
      )}
      {str && val.length > 0 && (
        <div className="space-y-1" id={strengthId} role="status" aria-live="polite">
          <div className="flex gap-1">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full transition-colors ${i <= str.score ? str.color : "bg-[var(--border)]"}`}
              />
            ))}
          </div>
          <p className={`text-xs font-sans ${str.score <= 1 ? "text-[var(--color-danger)]" : str.score <= 2 ? "text-[var(--sh-amber-500)]" : str.score <= 3 ? "text-[var(--color-info)]" : "text-[var(--sh-green-800)]"}`}>
            {str.label}
          </p>
        </div>
      )}
    </div>
  );
}
