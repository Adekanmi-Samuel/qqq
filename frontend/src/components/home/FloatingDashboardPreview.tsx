"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

const statTiles = [
  { label: "Students", value: "Live", icon: "👤", color: "var(--brand)" },
  { label: "Attendance", value: "Mark", icon: "✓", color: "#12926a" },
  { label: "Fees collected", value: "Track", icon: "₦", color: "#f59e0b" },
  { label: "Staff", value: "Roles", icon: "🏫", color: "#0d7a58" },
];

const attendanceBars = [
  { class: "JSS1A", pct: 94 },
  { class: "SS2B", pct: 88 },
  { class: "JSS3C", pct: 97 },
];

function BarSegment({ pct, delay }: { pct: number; delay: number }) {
  return (
    <div
      style={{
        width: "100%",
        height: 8,
        borderRadius: 99,
        background: "var(--card-border)",
        overflow: "hidden",
      }}
    >
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 1, delay: delay * 0.2 + 0.6, ease: "easeOut" }}
        style={{
          height: "100%",
          borderRadius: 99,
          background: pct >= 90
            ? "linear-gradient(90deg, #0b6e4f, #12926a)"
            : "linear-gradient(90deg, #f59e0b, #fbbf24)",
        }}
      />
    </div>
  );
}

export default function FloatingDashboardPreview() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  // Subtle parallax tilt and float effect
  const rotateX = useTransform(scrollYProgress, [0, 0.5, 1], [5, 0, -3]);
  const floatY = useTransform(scrollYProgress, [0, 0.5, 1], [20, 0, -10]);

  return (
    <motion.div
      ref={ref}
      animate={{ y: [0, -8, 0] }}
      transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      style={{
        width: "100%",
        maxWidth: 400,
        perspective: 1000,
      }}
    >
      <motion.div
        style={{
          borderRadius: 16,
          background: "var(--card-bg)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: "1px solid var(--card-border)",
          boxShadow:
            "0 25px 60px rgba(11, 110, 79, 0.12), 0 8px 24px rgba(11, 110, 79, 0.08), 0 0 0 1px rgba(11, 110, 79, 0.05)",
          overflow: "hidden",
          rotateX,
          y: floatY,
          willChange: "transform",
        }}
      >
        {/* Header bar */}
        <div
          style={{
            background: "var(--brand)",
            padding: "10px 16px",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <div style={{ display: "flex", gap: 6 }}>
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: "#f43f5e",
                display: "block",
              }}
            />
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: "#f59e0b",
                display: "block",
              }}
            />
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: "#00d97e",
                display: "block",
              }}
            />
          </div>
          <span
            style={{
              fontFamily: '"Inter", system-ui, sans-serif',
              fontSize: 12,
              color: "rgba(255, 255, 255, 0.85)",
              fontWeight: 500,
              letterSpacing: "0.01em",
            }}
          >
            SchoolPilot   Admin Dashboard
          </span>
        </div>

        {/* Content area */}
        <div style={{ padding: 16, background: "var(--section-gray)" }}>
          {/* Stat tiles 2x2 grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 10,
              marginBottom: 16,
            }}
          >
            {statTiles.map((tile) => (
              <div
                key={tile.label}
                style={{
                  background: "var(--card-bg)",
                  borderRadius: 12,
                  padding: "12px 14px",
                  border: "1px solid var(--card-border)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 6,
                  }}
                >
                  <span
                    style={{
                      fontFamily: '"Inter", system-ui, sans-serif',
                      fontSize: 11,
                      color: "var(--muted-color)",
                      fontWeight: 500,
                      textTransform: "uppercase",
                      letterSpacing: "0.04em",
                    }}
                  >
                    {tile.label}
                  </span>
                  <span
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 6,
                      background: `${tile.color}12`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 12,
                      color: tile.color,
                      fontWeight: 600,
                      flexShrink: 0,
                    }}
                  >
                    {tile.icon}
                  </span>
                </div>
                <span
                  className="sh-numeral"
                  style={{
                    fontSize: 22,
                    color: "var(--heading-color)",
                    display: "block",
                  }}
                >
                  {tile.value}
                </span>
              </div>
            ))}
          </div>

          {/* Today's Attendance section */}
          <div
            style={{
              background: "var(--card-bg)",
              borderRadius: 12,
              padding: "12px 14px",
              border: "1px solid var(--card-border)",
            }}
          >
            <span
              style={{
                fontFamily: '"Inter", system-ui, sans-serif',
                fontSize: 11,
                color: "var(--muted-color)",
                fontWeight: 500,
                textTransform: "uppercase",
                letterSpacing: "0.04em",
                display: "block",
                marginBottom: 12,
              }}
            >
              Today&apos;s Attendance
            </span>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {attendanceBars.map((bar, i) => (
                <div key={bar.class}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: 5,
                    }}
                  >
                    <span
                      style={{
                        fontFamily: '"Inter", system-ui, sans-serif',
                        fontSize: 12,
                        color: "var(--body-color)",
                        fontWeight: 500,
                      }}
                    >
                      {bar.class}
                    </span>
                    <span
                      className="sh-numeral"
                      style={{
                        fontSize: 13,
                        color: bar.pct >= 90 ? "var(--brand)" : "#f59e0b",
                      }}
                    >
                      {bar.pct}%
                    </span>
                  </div>
                  <BarSegment pct={bar.pct} delay={i} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
