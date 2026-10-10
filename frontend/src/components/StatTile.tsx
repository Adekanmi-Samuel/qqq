"use client";

import { type ReactNode } from "react";
import { motion } from "framer-motion";
import { useCountUp } from "@/hooks/useCountUp";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface StatTileProps {
  label: string;
  value: number;
  format?: "number" | "percent" | "currency" | "string";
  rawValue?: string;
  sub?: string;
  icon?: ReactNode;
  trend?: "up" | "down" | "neutral";
  trendLabel?: string;
  delay?: number;
  accentColor?: string;
}

/* ------------------------------------------------------------------ */
/*  Formatting helpers                                                 */
/* ------------------------------------------------------------------ */

function formatValue(
  count: number,
  format: StatTileProps["format"],
  rawValue?: string
): string {
  switch (format) {
    case "percent":
      return `${count.toLocaleString()}%`;
    case "currency":
      return `₦${count.toLocaleString()}`;
    case "string":
      return rawValue ?? "";
    case "number":
    default:
      return count.toLocaleString();
  }
}

const TREND_CONFIG = {
  up: { arrow: "↑", color: "var(--brand)", bg: "rgba(11,110,79,0.10)" },
  down: { arrow: "↓", color: "#dc2626", bg: "rgba(220,38,38,0.10)" },
  neutral: { arrow: "→", color: "var(--body-color)", bg: "rgba(107,124,114,0.10)" },
} as const;

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function StatTile({
  label,
  value,
  format = "number",
  rawValue,
  sub,
  icon,
  trend,
  trendLabel,
  delay = 0,
  accentColor = "var(--brand)",
}: StatTileProps) {
  const count = useCountUp(value, delay);
  const displayValue = formatValue(count, format, rawValue);
  const trendInfo = trend ? TREND_CONFIG[trend] : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        type: "spring" as const,
        stiffness: 300,
        damping: 28,
        delay: delay / 1000,
      }}
      whileHover={{ y: -3 }}
      className="sh-card"
      style={{
        position: "relative",
        overflow: "hidden",
        padding: "22px 24px",
        cursor: "default",
      }}
    >
      {/* ── Top accent bar ────────────────────────── */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 2,
          background: `linear-gradient(90deg, ${accentColor}, ${accentColor}66)`,
          borderRadius: "16px 16px 0 0",
        }}
      />

      {/* ── Corner glow ───────────────────────────── */}
      <div
        style={{
          position: "absolute",
          top: -24,
          right: -24,
          width: 80,
          height: 80,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${accentColor}18 0%, transparent 70%)`,
          pointerEvents: "none",
        }}
      />

      {/* ── Label row ─────────────────────────────── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 14,
        }}
      >
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.06em",
            textTransform: "uppercase" as const,
            color: "var(--muted-color)",
            fontFamily: "Inter, system-ui, sans-serif",
          }}
        >
          {label}
        </span>

        {icon && (
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: 8,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: `${accentColor}1f`,
              color: accentColor,
              fontSize: 14,
              lineHeight: 1,
            }}
          >
            {icon}
          </div>
        )}
      </div>

      {/* ── Value ─────────────────────────────────── */}
      <p
        className="sh-numeral"
        style={{
          fontSize: 38,
          color: "var(--heading-color)",
          margin: 0,
          marginBottom: sub || trendLabel ? 6 : 0,
        }}
      >
        {displayValue}
      </p>

      {/* ── Sub text ──────────────────────────────── */}
      {sub && (
        <p
          style={{
            margin: 0,
            fontSize: 12,
            color: "var(--muted-color)",
            fontFamily: "Inter, system-ui, sans-serif",
            lineHeight: 1.4,
          }}
        >
          {sub}
        </p>
      )}

      {/* ── Trend pill ────────────────────────────── */}
      {trendInfo && trendLabel && (
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            marginTop: 10,
            padding: "3px 10px",
            borderRadius: 9999,
            background: trendInfo.bg,
            color: trendInfo.color,
            fontSize: 12,
            fontWeight: 600,
            fontFamily: "Inter, system-ui, sans-serif",
            lineHeight: 1.3,
          }}
        >
          <span style={{ fontSize: 13 }}>{trendInfo.arrow}</span>
          {trendLabel}
        </div>
      )}
    </motion.div>
  );
}
