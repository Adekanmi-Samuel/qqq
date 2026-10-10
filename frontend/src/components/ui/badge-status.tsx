"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";

type StatusType = "active" | "inactive" | "suspended" | "pending" | "expired";

const statusConfig: Record<
  StatusType,
  { bg: string; color: string; dot: string; label: string }
> = {
  active: {
    bg: "bg-[rgba(11,110,79,0.12)]",
    color: "text-[var(--sh-green-800)]",
    dot: "bg-[var(--sh-green-800)]",
    label: "Active",
  },
  inactive: {
    bg: "bg-[var(--surface-2)]",
    color: "text-[var(--text-muted)]",
    dot: "bg-[var(--text-muted)]",
    label: "Inactive",
  },
  suspended: {
    bg: "bg-[rgba(244,63,94,0.12)]",
    color: "text-[var(--color-danger)]",
    dot: "bg-[var(--color-danger)]",
    label: "Suspended",
  },
  pending: {
    bg: "bg-[rgba(245,158,11,0.12)]",
    color: "text-[#b45309]",
    dot: "bg-[#b45309]",
    label: "Pending",
  },
  expired: {
    bg: "bg-[rgba(244,63,94,0.12)]",
    color: "text-[var(--color-danger)]",
    dot: "bg-[var(--color-danger)]",
    label: "Expired",
  },
};

interface BadgeStatusProps extends React.HTMLAttributes<HTMLSpanElement> {
  status: StatusType;
  label?: string;
  showDot?: boolean;
  size?: "sm" | "md";
}

const BadgeStatus = forwardRef<HTMLSpanElement, BadgeStatusProps>(
  ({ status, label, showDot = true, size = "md", className, ...props }, ref) => {
    const config = statusConfig[status];

    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex items-center gap-1.5 font-medium whitespace-nowrap rounded-full",
          config.bg,
          config.color,
          size === "sm" ? "text-[0.6875rem] px-2 py-0.5" : "text-xs px-2.5 py-0.5",
          className
        )}
        {...props}
      >
        {showDot && (
          <span
            className={cn(
              "rounded-full shrink-0",
              config.dot,
              size === "sm" ? "h-1.5 w-1.5" : "h-2 w-2"
            )}
          />
        )}
        {label ?? config.label}
      </span>
    );
  }
);
BadgeStatus.displayName = "BadgeStatus";

export { BadgeStatus };
export type { StatusType };
