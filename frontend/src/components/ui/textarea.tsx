"use client";

import { forwardRef, useCallback, useId, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  maxLength?: number;
  showCount?: boolean;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      label,
      error,
      helperText,
      maxLength,
      showCount = false,
      id: idProp,
      onChange,
      value,
      ...props
    },
    ref
  ) => {
    const autoId = useId();
    const id = idProp || autoId;
    const innerRef = useRef<HTMLTextAreaElement | null>(null);
    const helperId = helperText ? `${id}-helper` : undefined;
    const errorId = error ? `${id}-error` : undefined;

    // Auto-resize
    const resize = useCallback(() => {
      const el = innerRef.current;
      if (!el) return;
      el.style.height = "auto";
      el.style.height = `${el.scrollHeight}px`;
    }, []);

    useEffect(() => {
      resize();
    }, [value, resize]);

    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        onChange?.(e);
        resize();
      },
      [onChange, resize]
    );

    const currentLength =
      typeof value === "string" ? value.length : undefined;

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
        <textarea
          ref={(el) => {
            (innerRef as React.MutableRefObject<HTMLTextAreaElement | null>).current = el;
            if (typeof ref === "function") ref(el);
            else if (ref) ref.current = el;
          }}
          id={id}
          maxLength={maxLength}
          value={value}
          onChange={handleChange}
          aria-invalid={!!error}
          aria-describedby={
            [helperId, errorId].filter(Boolean).join(" ") || undefined
          }
          className={cn(
            "w-full rounded-xl border-[1.5px] border-[var(--border)] bg-[var(--surface)] text-[var(--text)] px-3.5 py-2.5 text-[0.9375rem] min-h-[100px] transition-all duration-[150ms] cubic-bezier(0.16,1,0.3,1) placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--sh-green-800)] focus:shadow-[0_0_0_3px_rgba(11,110,79,0.15)] font-[family-name:var(--font-sans)] resize-none overflow-hidden",
            error &&
              "border-[var(--color-danger)] focus:border-[var(--color-danger)] focus:shadow-[0_0_0_3px_rgba(244,63,94,0.15)]",
            className
          )}
          {...props}
        />
        <div className="flex items-center justify-between mt-1.5">
          <div>
            {helperText && !error && (
              <p id={helperId} className="text-xs text-[var(--text-muted)]">
                {helperText}
              </p>
            )}
            {error && (
              <p id={errorId} className="text-xs text-[var(--color-danger)]" role="alert">
                {error}
              </p>
            )}
          </div>
          {showCount && maxLength !== undefined && currentLength !== undefined && (
            <span
              className={cn(
                "text-xs tabular-nums",
                currentLength >= maxLength
                  ? "text-[var(--color-danger)]"
                  : "text-[var(--text-muted)]"
              )}
            >
              {currentLength}/{maxLength}
            </span>
          )}
        </div>
      </div>
    );
  }
);
Textarea.displayName = "Textarea";

export { Textarea };
