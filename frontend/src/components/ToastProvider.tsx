"use client";

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AnimatePresence, motion } from "framer-motion";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type ToastType = "success" | "error" | "warning" | "info";

interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  toast: (opts: { message: string; type?: ToastType }) => void;
}

/* ------------------------------------------------------------------ */
/*  Colour / icon maps per type                                        */
/* ------------------------------------------------------------------ */

const TOAST_STYLES: Record<
  ToastType,
  { border: string; bg: string; iconBg: string; iconColor: string }
> = {
  success: {
    border: "var(--brand)",
    bg: "#edf7f3",
    iconBg: "rgba(11,110,79,0.12)",
    iconColor: "var(--brand)",
  },
  error: {
    border: "#dc2626",
    bg: "#fef2f2",
    iconBg: "rgba(220,38,38,0.12)",
    iconColor: "#dc2626",
  },
  warning: {
    border: "#f59e0b",
    bg: "#fffbeb",
    iconBg: "rgba(245,158,11,0.12)",
    iconColor: "#f59e0b",
  },
  info: {
    border: "#3b82f6",
    bg: "#eff6ff",
    iconBg: "rgba(59,130,246,0.12)",
    iconColor: "#3b82f6",
  },
};

const TOAST_ICONS: Record<ToastType, string> = {
  success: "✓",
  error: "✕",
  warning: "⚠",
  info: "ℹ",
};

/* ------------------------------------------------------------------ */
/*  Context                                                            */
/* ------------------------------------------------------------------ */

const ToastCtx = createContext<ToastContextValue>({
  toast: () => {},
});

/* ------------------------------------------------------------------ */
/*  Single toast component                                             */
/* ------------------------------------------------------------------ */

function Toast({
  item,
  onRemove,
}: {
  item: ToastItem;
  onRemove: (id: number) => void;
}) {
  const s = TOAST_STYLES[item.type];
  const icon = TOAST_ICONS[item.type];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 80, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 80, scale: 0.95 }}
      transition={{ type: "spring" as const, stiffness: 400, damping: 30 }}
      role="alert"
      aria-live="assertive"
      style={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        gap: 12,
        width: 360,
        maxWidth: "calc(100vw - 48px)",
        padding: "14px 16px",
        paddingRight: 40,
        background: "var(--card-bg)",
        borderRadius: 12,
        borderLeft: `3px solid ${s.border}`,
        boxShadow:
          "0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)",
        overflow: "hidden",
      }}
    >
      {/* Icon circle */}
      <div
        style={{
          flexShrink: 0,
          width: 32,
          height: 32,
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: s.iconBg,
          color: s.iconColor,
          fontSize: 14,
          fontWeight: 700,
          lineHeight: 1,
          fontFamily: "Inter, system-ui, sans-serif",
        }}
      >
        {icon}
      </div>

      {/* Message */}
      <p
        style={{
          margin: 0,
          fontSize: 14,
          lineHeight: 1.45,
          color: "var(--heading-color)",
          fontFamily: "Inter, system-ui, sans-serif",
          fontWeight: 500,
          flex: 1,
        }}
      >
        {item.message}
      </p>

      {/* Close button */}
      <button
        onClick={() => onRemove(item.id)}
        aria-label="Dismiss notification"
        style={{
          position: "absolute",
          top: 10,
          right: 10,
          width: 24,
          height: 24,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: "none",
          background: "transparent",
          color: "var(--muted-color)",
          cursor: "pointer",
          borderRadius: 6,
          fontSize: 14,
          lineHeight: 1,
          padding: 0,
          transition: "color 150ms ease, background 150ms ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = "var(--heading-color)";
          e.currentTarget.style.background = "rgba(0,0,0,0.06)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = "var(--muted-color)";
          e.currentTarget.style.background = "transparent";
        }}
      >
        &#x2715;
      </button>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Provider                                                           */
/* ------------------------------------------------------------------ */

let nextId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timersRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(
    new Map()
  );

  const remove = useCallback((id: number) => {
    const t = timersRef.current.get(id);
    if (t) {
      clearTimeout(t);
      timersRef.current.delete(id);
    }
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const add = useCallback(
    ({ message, type = "success" }: { message: string; type?: ToastType }) => {
      const id = nextId++;
      setToasts((prev) => {
        // Keep max 3 visible toasts
        const next = [...prev, { id, message, type }];
        return next.length > 3 ? next.slice(-3) : next;
      });

      // Errors stay longer (6 s) vs default (4 s)
      const duration = type === "error" ? 6000 : 4000;
      const timer = setTimeout(() => remove(id), duration);
      timersRef.current.set(id, timer);
    },
    [remove]
  );

  return (
    <ToastCtx.Provider value={{ toast: add }}>
      {children}

      {/* Toast stack   fixed top-right, z-9999 */}
      <div
        aria-label="Notifications"
        style={{
          position: "fixed",
          top: 16,
          right: 16,
          zIndex: 9999,
          display: "flex",
          flexDirection: "column",
          gap: 10,
          pointerEvents: "none",
        }}
      >
        <AnimatePresence mode="popLayout">
          {toasts.map((t) => (
            <div key={t.id} style={{ pointerEvents: "auto" }}>
              <Toast item={t} onRemove={remove} />
            </div>
          ))}
        </AnimatePresence>
      </div>
    </ToastCtx.Provider>
  );
}

/* ------------------------------------------------------------------ */
/*  Hook                                                               */
/* ------------------------------------------------------------------ */

export function useToast() {
  const ctx = useContext(ToastCtx);
  if (!ctx) {
    throw new Error("useToast must be used within a <ToastProvider>");
  }
  return ctx.toast;
}
