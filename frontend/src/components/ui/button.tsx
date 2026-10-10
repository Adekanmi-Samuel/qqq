"use client";

import { forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center font-medium transition-all duration-[150ms] cubic-bezier(0.16,1,0.3,1) disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--sh-green-800)] rounded-xl",
  {
    variants: {
      variant: {
        primary:
          "bg-gradient-to-br from-[var(--sh-green-800)] to-[var(--sh-green-600)] text-white shadow-[0_2px_8px_rgba(11,110,79,0.35),inset_0_1px_0_rgba(255,255,255,0.1)] hover:shadow-[0_4px_16px_rgba(11,110,79,0.3),inset_0_1px_0_rgba(255,255,255,0.12)] hover:-translate-y-px active:translate-y-0 active:bg-[var(--sh-green-800)]",
        secondary:
          "bg-[var(--surface)] text-[var(--sh-green-800)] border-[1.5px] border-[rgba(11,110,79,0.25)] hover:bg-[rgba(11,110,79,0.04)] hover:border-[var(--sh-green-800)]",
        ghost:
          "text-[var(--text-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]",
        danger:
          "bg-[var(--color-danger)] text-white hover:bg-[#e11d48] hover:shadow-[0_0_20px_rgba(244,63,94,0.35)]",
        amber:
          "bg-[var(--sh-amber-500)] text-white hover:bg-[var(--sh-amber-600)] hover:shadow-[0_0_20px_rgba(245,158,11,0.35)]",
        outline:
          "border-[1.5px] border-[var(--border)] bg-transparent text-[var(--text)] hover:bg-[var(--surface-2)]",
      },
      size: {
        sm: "text-sm px-4 py-2 min-h-[36px]",
        md: "text-base px-6 py-3 min-h-[44px]",
        lg: "text-lg px-8 py-4 min-h-[52px]",
        icon: "p-2 min-h-[44px] min-w-[44px]",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        aria-disabled={disabled || loading || undefined}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      >
        {loading && (
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
