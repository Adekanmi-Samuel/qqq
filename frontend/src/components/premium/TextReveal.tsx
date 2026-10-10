"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

interface TextRevealProps {
  children: string;
  className?: string;
  style?: React.CSSProperties;
  /** Reveal mode: "words" splits by word, "chars" by character */
  mode?: "words" | "chars";
  /** Stagger delay between items in seconds */
  stagger?: number;
  /** Animation direction */
  direction?: "up" | "down";
  /** Tag to render as */
  as?: "h1" | "h2" | "h3" | "p" | "span";
}

/**
 * Premium text reveal animation   words/chars fade up with blur as you scroll.
 */
export default function TextReveal({
  children,
  className = "",
  style = {},
  mode = "words",
  stagger = 0.04,
  direction = "up",
  as: Tag = "p",
}: TextRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 0.85", "start 0.4"],
  });

  const items = mode === "words" ? children.split(" ") : children.split("");

  return (
    <Tag className={className} style={{ ...style, overflow: "hidden" } as any}>
      <span style={{ display: "inline" }}>
        {items.map((item, i) => (
          <RevealWord
            key={i}
            word={item}
            index={i}
            total={items.length}
            scrollProgress={scrollYProgress}
            stagger={stagger}
            direction={direction}
            isSpace={mode === "words" && i < items.length - 1}
          />
        ))}
      </span>
    </Tag>
  );
}

function RevealWord({
  word,
  index,
  total,
  scrollProgress,
  stagger,
  direction,
  isSpace,
}: {
  word: string;
  index: number;
  total: number;
  scrollProgress: any;
  stagger: number;
  direction: "up" | "down";
  isSpace: boolean;
}) {
  const start = Math.min(index * stagger, 0.8);
  const end = start + 0.2;
  const opacity = useTransform(scrollProgress, [start, end], [0, 1]);
  const y = useTransform(
    scrollProgress,
    [start, end],
    [direction === "up" ? 20 : -20, 0]
  );
  const filter = useTransform(scrollProgress, [start, end], ["blur(4px)", "blur(0px)"]);

  return (
    <motion.span
      style={{
        display: "inline-block",
        opacity,
        y,
        filter,
        whiteSpace: isSpace ? "pre" : undefined,
        willChange: "transform, opacity",
      }}
    >
      {word}
    </motion.span>
  );
}
