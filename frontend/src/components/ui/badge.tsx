"use client";

import { forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 font-medium whitespace-nowrap rounded-full",
  {
    variants: {
      variant: {
        green:
          "bg-[rgba(11,110,79,0.12)] text-[var(--sh-green-800)]",
        red: "bg-[rgba(244,63,94,0.12)] text-[var(--color-danger)]",
        yellow:
          "bg-[rgba(245,158,11,0.12)] text-[#b45309]",
        blue: "bg-[rgba(56,189,248,0.12)] text-[#0369a1]",
        slate:
          "bg-[var(--surface-2)] text-[var(--text-muted)]",
        amber:
          "bg-[rgba(245,158,11,0.12)] text-[var(--sh-amber-700)]",
      },
      size: {
        sm: "text-[0.6875rem] px-2 py-0.5",
        md: "text-xs px-2.5 py-0.5",
      },
    },
    defaultVariants: {
      variant: "slate",
      size: "md",
    },
  }
);

interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant, size, ...props }, ref) => (
    <span
      ref={ref}
      className={cn(badgeVariants({ variant, size }), className)}
      {...props}
    />
  )
);
Badge.displayName = "Badge";

export { Badge, badgeVariants };
