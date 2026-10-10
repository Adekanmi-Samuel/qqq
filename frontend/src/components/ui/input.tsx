"use client";

import { forwardRef, useId } from "react";
import { cn } from "@/lib/utils";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      id: idProp,
      ...props
    },
    ref
  ) => {
    const autoId = useId();
    const id = idProp || autoId;
    const helperId = helperText ? `${id}-helper` : undefined;
    const errorId = error ? `${id}-error` : undefined;
    const describedBy = [helperId, errorId].filter(Boolean).join(" ") || undefined;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={id}
            className="block text-sm font-medium text-[var(--body-color)] mb-1.5"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none">
              {leftIcon}
            </span>
          )}
          <input
            ref={ref}
            id={id}
            aria-invalid={!!error}
            aria-describedby={describedBy}
            className={cn(
              "w-full rounded-xl border-[1.5px] border-[var(--border)] bg-[var(--surface)] text-[var(--text)] px-3.5 py-2.5 text-[0.9375rem] min-h-[44px] transition-all duration-[150ms] cubic-bezier(0.16,1,0.3,1) placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--sh-green-800)] focus:shadow-[0_0_0_3px_rgba(11,110,79,0.15)] font-[family-name:var(--font-sans)]",
              leftIcon && "pl-10",
              rightIcon && "pr-10",
              error &&
                "border-[var(--color-danger)] focus:border-[var(--color-danger)] focus:shadow-[0_0_0_3px_rgba(244,63,94,0.15)]",
              className
            )}
            {...props}
          />
          {rightIcon && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
              {rightIcon}
            </span>
          )}
        </div>
        {helperText && !error && (
          <p id={helperId} className="text-xs text-[var(--text-muted)] mt-1.5">
            {helperText}
          </p>
        )}
        {error && (
          <p
            id={errorId}
            className="text-xs text-[var(--color-danger)] mt-1.5"
            role="alert"
          >
            {error}
          </p>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";

export { Input };
