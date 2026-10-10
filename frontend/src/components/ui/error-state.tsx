"use client";

import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

function ErrorState({
  title = "Something went wrong",
  message = "An unexpected error occurred. Please try again.",
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-12 px-6 text-center",
        className
      )}
    >
      <div className="w-20 h-20 rounded-full bg-[rgba(244,63,94,0.1)] flex items-center justify-center mb-5 text-[var(--color-danger)]">
        <AlertTriangle size={40} />
      </div>

      <h3 className="text-xl font-semibold text-[var(--heading-color)] font-[family-name:var(--font-display)] mb-2">
        {title}
      </h3>

      <p className="text-[0.9375rem] text-[var(--text-muted)] max-w-sm leading-relaxed mb-5">
        {message}
      </p>

      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-br from-[var(--sh-green-800)] to-[var(--sh-green-600)] rounded-xl shadow-[0_2px_8px_rgba(11,110,79,0.35)] hover:shadow-[0_4px_16px_rgba(11,110,79,0.3)] hover:-translate-y-px active:translate-y-0 transition-all duration-[150ms] min-h-[44px]"
        >
          Try again
        </button>
      )}
    </div>
  );
}

export { ErrorState };
