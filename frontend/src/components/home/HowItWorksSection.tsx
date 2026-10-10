"use client";

import { useRef } from "react";
import Image from "next/image";
import { motion, useInView } from "framer-motion";
import { UserPlus, Users, Rocket } from "lucide-react";

interface Step {
  number: string;
  icon: React.ElementType;
  title: string;
  description: string;
  detail: string;
}

const steps: Step[] = [
  {
    number: "01",
    icon: UserPlus,
    title: "Create Your School Account",
    description:
      "Register your school in under 5 minutes. Add your school name, location, and basic details. Supports all 36 states plus FCT.",
    detail: "Free for founding schools",
  },
  {
    number: "02",
    icon: Users,
    title: "Add Students, Teachers & Classes",
    description:
      "Import your data via CSV or add manually. Set up classes, assign teachers, and invite staff with role-based access.",
    detail: "CSV import available",
  },
  {
    number: "03",
    icon: Rocket,
    title: "Start Managing",
    description:
      "Mark attendance, enter results, generate report cards, track fees, and communicate with parents   all from one screen.",
    detail: "Works on mobile, tablet, and desktop",
  },
];

function StepCard({ step, index }: { step: Step; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "200px" });

  const Icon = step.icon;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 1, y: 0 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.6,
        delay: index * 0.15,
        ease: [0.16, 1, 0.3, 1],
      }}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        position: "relative",
      }}
    >
      {/* Step number circle */}
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: "50%",
          background: "linear-gradient(135deg, #0b6e4f 0%, #12926a 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 20,
          boxShadow: "0 4px 16px rgba(11,110,79,0.25)",
          position: "relative",
          zIndex: 2,
        }}
      >
        <Icon size={26} color="#fff" strokeWidth={1.8} />
      </div>

      {/* Step indicator */}
      <span
        style={{
          fontFamily: "var(--font-sans)",
          fontSize: 12,
          fontWeight: 600,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "var(--body-color)",
          marginBottom: 8,
        }}
      >
        Step {step.number}
      </span>

      <h3
        style={{
          fontFamily: "var(--font-display)",
          fontSize: 20,
          fontWeight: 500,
          color: "var(--heading-color)",
          marginBottom: 8,
          lineHeight: 1.3,
        }}
      >
        {step.title}
      </h3>

      <p
        style={{
          fontFamily: "var(--font-sans)",
          fontSize: 14,
          color: "var(--body-color)",
          lineHeight: 1.65,
          maxWidth: 300,
          marginBottom: 12,
        }}
      >
        {step.description}
      </p>

      <span
        style={{
          display: "inline-block",
          fontFamily: "var(--font-sans)",
          fontSize: 12,
          fontWeight: 500,
          color: "var(--body-color)",
          border: "1px solid var(--card-border)",
          borderRadius: 9999,
          padding: "4px 12px",
        }}
      >
        {step.detail}
      </span>
    </motion.div>
  );
}

export default function HowItWorksSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "200px" });

  return (
    <section
      ref={sectionRef}
      id="how-it-works"
      className="dark-section-light"
      style={{
        padding: "clamp(56px, 8vw, 80px) 24px",
        position: "relative",
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ borderRadius: 16, overflow: "hidden", marginBottom: 32, border: "1px solid var(--card-border)", height: 140 }}>
          <Image src="/images/how-mobile.webp" alt="Teacher using SchoolPilot on a phone" width={800} height={533} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </div>
        {/* Header */}
        <motion.div
          initial={{ opacity: 1, y: 0 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          style={{ textAlign: "center", marginBottom: 64 }}
        >
          <span
            style={{
              display: "block",
              fontFamily: "var(--font-sans)",
              fontSize: 13,
              fontWeight: 600,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              color: "var(--body-color)",
              marginBottom: 12,
            }}
          >
            How It Works
          </span>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(26px, 5vw, 44px)",
              fontWeight: 500,
              letterSpacing: "-0.02em",
              color: "var(--heading-color)",
              lineHeight: 1.2,
              marginBottom: 12,
            }}
          >
            Set Up in Three Simple Steps
          </h2>
          <p
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: 16,
              color: "var(--body-color)",
              maxWidth: 480,
              margin: "0 auto",
              lineHeight: 1.6,
            }}
          >
            No IT team required. No training needed. No migration headaches.
          </p>
        </motion.div>

        {/* Steps grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))",
            gap: "clamp(32px, 5vw, 56px)",
            position: "relative",
          }}
        >
          {/* Connecting line (desktop only) */}
          <div
            className="hidden md:block"
            style={{
              position: "absolute",
              top: 32,
              left: "20%",
              right: "20%",
              height: 2,
              background: "linear-gradient(90deg, rgba(11,110,79,0.15), rgba(11,110,79,0.05))",
              zIndex: 0,
            }}
          />

          {steps.map((step, i) => (
            <StepCard key={step.number} step={step} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
