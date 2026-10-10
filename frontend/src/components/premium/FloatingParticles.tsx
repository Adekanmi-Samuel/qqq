"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
  opacity: number;
}

/**
 * Deterministic pseudo-random so server and client render identical particles.
 * Hydration-safe: Math.random() would produce different output on each render
 * and trigger React's "server rendered HTML didn't match the client" error.
 */
function seeded(seed: number) {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

/**
 * Ambient floating particles for cinematic depth.
 * Renders a fixed number of softly animated dots.
 */
export default function FloatingParticles({ count = 12 }: { count?: number }) {
  const particles = useMemo<Particle[]>(() => {
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      x: seeded(i * 3 + 1) * 100,
      y: seeded(i * 7 + 2) * 100,
      size: seeded(i * 11 + 3) * 3 + 1,
      duration: seeded(i * 13 + 4) * 15 + 15,
      delay: seeded(i * 17 + 5) * 5,
      opacity: seeded(i * 19 + 6) * 0.15 + 0.05,
    }));
  }, [count]);

  return (
    <div
      suppressHydrationWarning
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        zIndex: 0,
        overflow: "hidden",
      }}
    >
      {particles.map((p) => (
        <motion.div
          key={p.id}
          suppressHydrationWarning
          animate={{
            x: [0, 30, -20, 15, 0],
            y: [0, -40, 20, -25, 0],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            ease: "easeInOut",
            delay: p.delay,
          }}
          style={{
            position: "absolute",
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            borderRadius: "50%",
            background: "rgba(11, 110, 79, 0.4)",
            opacity: p.opacity,
            willChange: "transform",
          }}
        />
      ))}
    </div>
  );
}
