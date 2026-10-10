"use client";

import { forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import {
  Info,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

const alertVariants = cva(
  "relative flex gap-3 rounded-xl border p-4 text-sm",
  {
    variants: {
      variant: {
        info: "border-[rgba(56,189,248,0.3)] bg-[rgba(56,189,248,0.08)] text-[#0369a1]",
        success:
          "border-[rgba(11,110,79,0.3)] bg-[rgba(11,110,79,0.08)] text-[var(--sh-green-800)]",
        warning:
          "border-[rgba(245,158,11,0.3)] bg-[rgba(245,158,11,0.08)] text-[#b45309]",
        error:
          "border-[rgba(244,63,94,0.3)] bg-[rgba(244,63,94,0.08)] text-[#be123c]",
      },
    },
    defaultVariants: {
      variant: "info",
    },
  },
);

const iconMap = {
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  error: XCircle,
};

interface AlertProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {
  title?: string;
  description?: string;
  onClose?: () => void;
  icon?: React.ReactNode;
}

const Alert = forwardRef<HTMLDivElement, AlertProps>(
  (
    {
      className,
      variant = "info",
      title,
      description,
      onClose,
      icon,
      children,
      ...props
    },
    ref,
  ) => {
    const IconComponent = iconMap[variant ?? "info"];

    return (
      <div
        ref={ref}
        role="alert"
        className={cn(alertVariants({ variant }), className)}
        {...props}
      >
        <div className="shrink-0 mt-0.5">
          {icon ?? <IconComponent size={18} />}
        </div>
        <div className="flex-1 min-w-0">
          {title && (
            <p className="font-semibold text-[var(--heading-color)] mb-0.5">
              {title}
            </p>
          )}
          {description && (
            <p className="text-[var(--text-muted)]">{description}</p>
          )}
          {children}
        </div>
        {onClose && (
          <button
            onClick={onClose}
            aria-label="Dismiss"
            className="shrink-0 rounded-lg p-1 hover:bg-black/5 transition-colors mt-0.5"
          >
            <X size={16} />
          </button>
        )}
      </div>
    );
  },
);
Alert.displayName = "Alert";

export { Alert, alertVariants };
