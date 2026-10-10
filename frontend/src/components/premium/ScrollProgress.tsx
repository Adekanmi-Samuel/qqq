"use client";

import { motion, useScroll, useSpring } from "framer-motion";

/**
 * Thin scroll progress bar at the top of the page.
 */
export default function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  return (
    <motion.div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        height: 3,
        background: "linear-gradient(90deg, var(--brand), #12926a, #f59e0b)",
        transformOrigin: "0%",
        scaleX,
        zIndex: 9999,
        willChange: "transform",
      }}
    />
  );
}
