"use client";

import { forwardRef, useId } from "react";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
  error?: string;
}

const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, error, id: idProp, ...props }, ref) => {
    const autoId = useId();
    const id = idProp || autoId;

    return (
      <div className="flex items-start gap-2.5">
        <div className="relative flex items-center justify-center pt-0.5">
          <input
            ref={ref}
            type="checkbox"
            id={id}
            className={cn(
              "peer sr-only",
              className
            )}
            aria-invalid={!!error}
            {...props}
          />
          <label
            htmlFor={id}
            className={cn(
              "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-[1.5px] transition-all duration-[150ms] cubic-bezier(0.16,1,0.3,1) cursor-pointer",
              "border-[var(--border)] bg-[var(--surface)]",
              "peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[var(--sh-green-800)]",
              "peer-checked:border-[var(--sh-green-800)] peer-checked:bg-[var(--sh-green-800)]",
              "peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
              error && "border-[var(--color-danger)]"
            )}
          >
            <Check
              size={12}
              className="text-white opacity-0 peer-checked:opacity-100 transition-opacity"
              strokeWidth={3}
            />
          </label>
        </div>
        {label && (
          <label
            htmlFor={id}
            className={cn(
              "text-sm text-[var(--text)] leading-tight pt-px cursor-pointer select-none",
              "peer-disabled:cursor-not-allowed peer-disabled:opacity-50"
            )}
          >
            {label}
          </label>
        )}
        {error && (
          <p className="text-xs text-[var(--color-danger)] mt-0.5" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }
);
Checkbox.displayName = "Checkbox";

export { Checkbox };
