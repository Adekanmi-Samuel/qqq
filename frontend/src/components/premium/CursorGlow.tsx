"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

/**
 * Custom cursor glow that follows mouse movement.
 * Only renders on desktop (no touch devices).
 */
export default function CursorGlow() {
  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);
  const springX = useSpring(cursorX, { stiffness: 150, damping: 15, mass: 0.1 });
  const springY = useSpring(cursorY, { stiffness: 150, damping: 15, mass: 0.1 });
  const isDesktop = useRef(false);
  // Render the glow only after mount + desktop check, so server and client
  // produce the same output (hydration-safe   no `typeof window` render branch).
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Only on desktop
    isDesktop.current = window.matchMedia("(min-width: 768px) and (hover: hover)").matches;
    if (!isDesktop.current) return;

    setShow(true);

    const handleMouseMove = (e: MouseEvent) => {
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [cursorX, cursorY]);

  if (!show) return null;

  return (
    <motion.div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: 400,
        height: 400,
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(11, 110, 79, 0.08) 0%, transparent 70%)",
        pointerEvents: "none",
        zIndex: 9999,
        x: springX,
        y: springY,
        translateX: "-50%",
        translateY: "-50%",
        willChange: "transform",
        mixBlendMode: "screen",
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
    />
  );
}
