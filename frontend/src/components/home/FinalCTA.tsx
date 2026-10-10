"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";

const badges = [
  "Free for first 50 schools",
  "5 minute setup",
  "No credit card",
];

export default function FinalCTA() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "200px" });

  return (
    <section
      ref={sectionRef}
      className="bg-[var(--section-gray)]"
      style={{
        position: "relative",
        overflow: "hidden",
        padding: "clamp(64px, 12vw, 120px) 24px",
      }}
    >
      <motion.div
        initial={{ opacity: 1, y: 0 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        style={{
          position: "relative",
          zIndex: 1,
          maxWidth: 720,
          margin: "0 auto",
          textAlign: "center",
        }}
      >
        <h2
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(28px, 5vw, 48px)",
            fontWeight: 500,
            color: "var(--heading-color)",
            lineHeight: 1.15,
            marginBottom: 16,
          }}
        >
          Ready to Transform Your School?
        </h2>

        <p
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: 17,
            color: "var(--body-color)",
            lineHeight: 1.6,
            marginBottom: 36,
            maxWidth: 500,
            margin: "0 auto 36px",
          }}
        >
          Join the schools building a better Nigerian education system. Start free, upgrade when you&apos;re ready.
        </p>

        {/* CTA */}
        <Link
          href="/signup"
          className="btn btn-primary"
          style={{
            height: 52,
            padding: "0 32px",
            borderRadius: 12,
            fontSize: 16,
            fontWeight: 600,
            textDecoration: "none",
            gap: 10,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          Start Free Trial
          <ArrowRight size={18} />
        </Link>

        {/* Trust badges */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: 20,
            marginTop: 32,
          }}
        >
          {badges.map((badge) => (
            <div
              key={badge}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontFamily: "var(--font-sans)",
                fontSize: 13,
                color: "var(--body-color)",
              }}
            >
              <CheckCircle2 size={14} color="var(--brand)" strokeWidth={2} />
              {badge}
            </div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
