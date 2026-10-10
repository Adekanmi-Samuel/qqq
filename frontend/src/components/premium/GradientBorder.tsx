"use client";

import { ReactNode } from "react";
import { motion } from "framer-motion";

/**
 * Card with animated gradient border that rotates on hover.
 */
export default function GradientBorder({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`relative group ${className}`}>
      {/* Gradient border layer */}
      <div
        style={{
          position: "absolute",
          inset: -1,
          borderRadius: "inherit",
          background: "linear-gradient(135deg, rgba(11,110,79,0.3), rgba(245,158,11,0.2), rgba(11,110,79,0.1))",
          opacity: 0,
          transition: "opacity 0.4s ease",
          zIndex: -1,
        }}
        className="group-hover:opacity-100"
      />
      {children}
    </div>
  );
}
