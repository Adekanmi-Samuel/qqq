"use client";

import { forwardRef, useMemo } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const avatarVariants = cva(
  "relative inline-flex shrink-0 items-center justify-center rounded-full overflow-hidden font-semibold select-none",
  {
    variants: {
      size: {
        sm: "h-8 w-8 text-xs",
        md: "h-10 w-10 text-sm",
        lg: "h-14 w-14 text-lg",
        xl: "h-20 w-20 text-xl",
      },
    },
    defaultVariants: {
      size: "md",
    },
  }
);

const AVATAR_COLORS = [
  "var(--brand)",
  "#12926a",
  "#0d7a58",
  "#052e1c",
  "#b45309",
  "#0369a1",
  "#7c3aed",
  "#0891b2",
  "#059669",
  "#0284c7",
];

function getColorFromName(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (
    parts[0].charAt(0) + parts[parts.length - 1].charAt(0)
  ).toUpperCase();
}

interface AvatarProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "children">,
    VariantProps<typeof avatarVariants> {
  name: string;
  src?: string | null;
}

const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, size, name, src, ...props }, ref) => {
    const bgColor = useMemo(() => getColorFromName(name), [name]);
    const initials = useMemo(() => getInitials(name), [name]);

    return (
      <div
        ref={ref}
        className={cn(avatarVariants({ size }), className)}
        style={{ backgroundColor: bgColor, color: "#ffffff" }}
        aria-label={name}
        {...props}
      >
        {src ? (
          <img
            src={src}
            alt={name}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="pointer-events-none leading-none">{initials}</span>
        )}
      </div>
    );
  }
);
Avatar.displayName = "Avatar";

export { Avatar, avatarVariants };
