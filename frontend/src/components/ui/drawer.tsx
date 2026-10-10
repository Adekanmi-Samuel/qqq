"use client";

import { useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

type DrawerSide = "left" | "right" | "bottom";

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  side?: DrawerSide;
  title?: string;
  children: React.ReactNode;
  className?: string;
  width?: number | string;
}

const slideVariants = {
  left: {
    initial: { x: "-100%" } as const,
    animate: { x: 0 } as const,
    exit: { x: "-100%" } as const,
  },
  right: {
    initial: { x: "100%" } as const,
    animate: { x: 0 } as const,
    exit: { x: "100%" } as const,
  },
  bottom: {
    initial: { y: "100%" } as const,
    animate: { y: 0 } as const,
    exit: { y: "100%" } as const,
  },
};

function Drawer({
  open,
  onClose,
  side = "right",
  title,
  children,
  className,
  width,
}: DrawerProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (open) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, handleKeyDown]);

  const isHorizontal = side === "left" || side === "right";
  const resolvedWidth = width ?? (isHorizontal ? 480 : "100%");

  const positionClasses: Record<DrawerSide, string> = {
    left: "inset-y-0 left-0",
    right: "inset-y-0 right-0",
    bottom: "inset-x-0 bottom-0",
  };

  const sizeStyle = isHorizontal
    ? { width: resolvedWidth, maxWidth: "100vw" }
    : { maxHeight: "85vh", width: "100%" };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-[rgba(3,26,15,0.6)] backdrop-blur-sm"
            aria-hidden="true"
          />

          {/* Panel */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={slideVariants[side].initial}
            animate={slideVariants[side].animate}
            exit={slideVariants[side].exit}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className={cn(
              "fixed z-50 flex flex-col bg-[var(--surface)] overflow-hidden",
              positionClasses[side],
              side === "bottom" &&
                "rounded-t-2xl border-t border-[var(--border)]",
              side === "left" && "border-r border-[var(--border)]",
              side === "right" && "border-l border-[var(--border)]",
              className,
            )}
            style={{
              ...sizeStyle,
              boxShadow:
                side === "left"
                  ? "8px 0 30px rgba(0,0,0,0.12)"
                  : side === "right"
                    ? "-8px 0 30px rgba(0,0,0,0.12)"
                    : "0 -8px 30px rgba(0,0,0,0.12)",
            }}
          >
            {title && (
              <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)] shrink-0">
                <h2 className="text-lg font-semibold text-[var(--heading-color)] font-[family-name:var(--font-display)]">
                  {title}
                </h2>
                <button
                  onClick={onClose}
                  aria-label="Close"
                  className="flex items-center justify-center w-10 h-10 rounded-lg text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)] transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            )}
            <div className="flex-1 overflow-y-auto px-6 py-4">{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export { Drawer };
