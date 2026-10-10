"use client";

import { useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle } from "lucide-react";
import { Button } from "./button";

type ConfirmVariant = "danger" | "default";

interface ConfirmModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => void;
  variant?: ConfirmVariant;
}

export function ConfirmModal({
  open,
  onClose,
  title,
  description,
  confirmLabel,
  onConfirm,
  variant = "default",
}: ConfirmModalProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
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

  const isDanger = variant === "danger";

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 50,
              background: "rgba(3, 26, 15, 0.75)",
              backdropFilter: "blur(4px)",
              WebkitBackdropFilter: "blur(4px)",
            }}
            aria-hidden="true"
          />

          {/* Modal */}
          <motion.div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-modal-title"
            aria-describedby="confirm-modal-desc"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{
              type: "spring" as const,
              damping: 25,
              stiffness: 300,
            }}
            style={{
              position: "fixed",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              zIndex: 51,
              width: "100%",
              maxWidth: "28rem",
              background: "var(--surface, #ffffff)",
              border: "1px solid var(--border, #e8efe9)",
              borderRadius: "1.25rem",
              padding: "1.75rem",
              boxShadow: "0 25px 60px rgba(0,0,0,0.3), 0 0 20px rgba(11,110,79,0.08)",
              margin: "0 1rem",
            }}
          >
            {/* Icon */}
            {isDanger && (
              <div
                style={{
                  width: "3rem",
                  height: "3rem",
                  borderRadius: "0.75rem",
                  background: "rgba(244, 63, 94, 0.12)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "1rem",
                  color: "#f43f5e",
                }}
              >
                <AlertTriangle size={24} />
              </div>
            )}

            {/* Title */}
            <h3
              id="confirm-modal-title"
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "1.125rem",
                fontWeight: 600,
                color: "var(--heading-color, #111612)",
                marginBottom: "0.5rem",
                lineHeight: 1.3,
              }}
            >
              {title}
            </h3>

            {/* Description */}
            <p
              id="confirm-modal-desc"
              style={{
                fontSize: "0.9375rem",
                color: "var(--text-muted, #6b7c72)",
                lineHeight: 1.6,
                marginBottom: "1.5rem",
              }}
            >
              {description}
            </p>

            {/* Actions */}
            <div
              style={{
                display: "flex",
                gap: "0.75rem",
                justifyContent: "flex-end",
              }}
            >
              <Button variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button
                variant={isDanger ? "danger" : "primary"}
                onClick={onConfirm}
              >
                {confirmLabel}
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
