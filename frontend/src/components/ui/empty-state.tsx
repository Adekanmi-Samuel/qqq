"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Inbox } from "lucide-react";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-12 px-6 text-center",
        className
      )}
    >
      <div className="w-20 h-20 rounded-full bg-[rgba(11,110,79,0.08)] flex items-center justify-center mb-5 text-[var(--sh-green-800)]">
        <div className="w-10 h-10 flex items-center justify-center">
          {icon ?? <Inbox size={40} />}
        </div>
      </div>

      <h3 className="text-xl font-semibold text-[var(--heading-color)] font-[family-name:var(--font-display)] mb-2">
        {title}
      </h3>

      <p className="text-[0.9375rem] text-[var(--text-muted)] max-w-xs leading-relaxed mb-5">
        {description}
      </p>

      {action && (
        <button
          onClick={action.onClick}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-br from-[var(--sh-green-800)] to-[var(--sh-green-600)] rounded-xl shadow-[0_2px_8px_rgba(11,110,79,0.35)] hover:shadow-[0_4px_16px_rgba(11,110,79,0.3)] hover:-translate-y-px active:translate-y-0 transition-all duration-[150ms] min-h-[44px]"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

export { EmptyState };
