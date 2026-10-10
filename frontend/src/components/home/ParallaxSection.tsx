"use client";

import { useRef, ReactNode } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

interface ParallaxSectionProps {
  children: ReactNode;
  /** Speed multiplier for background parallax (0 = static, 1 = full scroll speed) */
  bgSpeed?: number;
  /** Speed multiplier for content parallax */
  contentSpeed?: number;
  /** Extra height to add for parallax room */
  extraHeight?: number;
  /** Enable scale effect on scroll */
  scale?: boolean;
  /** Scale range [from, to] */
  scaleRange?: [number, number];
  /** Enable opacity fade on scroll */
  fade?: boolean;
  /** Opacity range [from, to] */
  opacityRange?: [number, number];
  /** Additional className */
  className?: string;
  /** Additional inline styles */
  style?: React.CSSProperties;
  /** Whether the section should overlap the next section */
  overlap?: boolean;
  /** Negative margin for overlap effect */
  overlapMargin?: string;
}

export default function ParallaxSection({
  children,
  bgSpeed = 0.3,
  contentSpeed = 0,
  extraHeight = 0,
  scale = false,
  scaleRange = [0.95, 1],
  fade = false,
  opacityRange = [0, 1],
  className = "",
  style = {},
  overlap = false,
  overlapMargin = "-60px",
}: ParallaxSectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const bgY = useTransform(scrollYProgress, [0, 1], [`${bgSpeed * 100}px`, `${-bgSpeed * 100}px`]);
  const contentY = useTransform(scrollYProgress, [0, 1], [`${contentSpeed * 50}px`, `${-contentSpeed * 50}px`]);
  const scaleVal = useTransform(scrollYProgress, [0, 0.5, 1], [scaleRange[0], 1, scaleRange[1] > 1 ? scaleRange[1] : scaleRange[0]]);
  const opacityVal = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [opacityRange[0], 1, 1, opacityRange[1]]);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        position: "relative",
        overflow: "hidden",
        marginBottom: overlap ? overlapMargin : undefined,
        zIndex: overlap ? 1 : undefined,
        ...style,
      }}
    >
      {/* Parallax background layer */}
      {bgSpeed > 0 && (
        <motion.div
          style={{
            position: "absolute",
            inset: `-${Math.abs(bgSpeed) * 60}px 0`,
            y: bgY,
            pointerEvents: "none",
            zIndex: 0,
          }}
        />
      )}

      {/* Content layer with optional parallax */}
      <motion.div
        style={{
          position: "relative",
          zIndex: 1,
          y: contentSpeed !== 0 ? contentY : undefined,
          scale: scale ? scaleVal : undefined,
          opacity: fade ? opacityVal : undefined,
        }}
      >
        {children}
      </motion.div>

      {/* Extra height spacer for parallax room */}
      {extraHeight > 0 && <div style={{ height: extraHeight }} />}
    </div>
  );
}

/**
 * Hook for scroll-driven parallax on any element
 */
export function useParallax(offset: [number, number] = [-100, 100]) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], offset);
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.96, 1, 0.96]);

  return { ref, y, opacity, scale };
}

/**
 * Simple scroll-reveal wrapper using framer-motion
 */
export function ScrollReveal({
  children,
  direction = "up",
  delay = 0,
  className = "",
  once = true,
}: {
  children: ReactNode;
  direction?: "up" | "down" | "left" | "right";
  delay?: number;
  className?: string;
  once?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 0.9", "start 0.4"],
  });
  const opacity = useTransform(scrollYProgress, [0, 1], [0, 1]);

  const dirMap = {
    up: { x: 0, y: 40 },
    down: { x: 0, y: -40 },
    left: { x: 40, y: 0 },
    right: { x: -40, y: 0 },
  };

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 1 }}
      
      viewport={{ once, margin: "-80px" }}
      transition={{
        duration: 0.7,
        delay,
        ease: [0.16, 1, 0.3, 1],
      }}
    >
      {children}
    </motion.div>
  );
}
