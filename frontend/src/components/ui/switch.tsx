"use client";

import { forwardRef, useId } from "react";
import { cn } from "@/lib/utils";

interface SwitchProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
  error?: string;
}

const Switch = forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, label, error, id: idProp, ...props }, ref) => {
    const autoId = useId();
    const id = idProp || autoId;

    return (
      <div className="flex items-center gap-3">
        <div className="relative inline-flex items-center">
          <input
            ref={ref}
            type="checkbox"
            id={id}
            className="peer sr-only"
            aria-invalid={!!error}
            {...props}
          />
          <label
            htmlFor={id}
            className={cn(
              "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-all duration-[150ms] cubic-bezier(0.16,1,0.3,1)",
              "border-[1.5px] border-[var(--border)] bg-[var(--surface-2)]",
              "peer-checked:border-[var(--sh-green-800)] peer-checked:bg-[var(--sh-green-800)]",
              "peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[var(--sh-green-800)]",
              "peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
              error && "border-[var(--color-danger)]"
            )}
          >
            <span
              className={cn(
                "pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm ring-0 transition-all duration-[150ms]",
                "translate-x-0.5 peer-checked:translate-x-[22px]"
              )}
            />
          </label>
        </div>
        {label && (
          <label
            htmlFor={id}
            className="text-sm text-[var(--text)] cursor-pointer select-none"
          >
            {label}
          </label>
        )}
        {error && (
          <p className="text-xs text-[var(--color-danger)]" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }
);
Switch.displayName = "Switch";

export { Switch };
