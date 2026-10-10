"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { Building2, ShieldCheck, GraduationCap, ArrowRight, Check } from "lucide-react";

interface Audience {
  icon: React.ElementType;
  title: string;
  description: string;
  features: string[];
  cta: string;
  href: string;
  accent: string;
}

const audiences: Audience[] = [
  {
    icon: Building2,
    title: "School Administrators",
    description:
      "Automate the repetitive work   attendance, results, report cards, and parent communication   so your team can focus on what matters.",
    features: [
      "One-click attendance marking",
      "Nigerian grading (A1-F9) built in",
      "Bulk result entry & report cards",
      "email and in-app alerts to parents",
    ],
    cta: "Get Started",
    href: "/signup",
    accent: "var(--brand)",
  },
  {
    icon: GraduationCap,
    title: "Teachers",
    description:
      "Spend less time on paperwork and more time teaching. Mark attendance from your phone, enter results online, and access AI-generated lesson notes.",
    features: [
      "Mobile attendance marking",
      "AI lesson note generator",
      "Class result entry",
      "Scheme of work templates",
    ],
    cta: "See How It Works",
    href: "#how-it-works",
    accent: "#12926a",
  },
  {
    icon: ShieldCheck,
    title: "Parents",
    description:
      "Stay connected with your child's education. View attendance, results, and school notices   all from your phone, anytime.",
    features: [
      "Phone number login (no email)",
      "Real-time attendance alerts",
      "Results & report card access",
      "School notice board",
    ],
    cta: "Learn More",
    href: "#faq",
    accent: "#f59e0b",
  },
];

function AudienceCard({
  audience,
  index,
}: {
  audience: Audience;
  index: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "200px" });
  const Icon = audience.icon;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 1, y: 0 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.6,
        delay: index * 0.12,
        ease: [0.16, 1, 0.3, 1],
      }}
    >
      <div
        className="sh-card"
        style={{
          padding: "clamp(24px, 3vw, 32px)",
          display: "flex",
          flexDirection: "column",
          gap: 16,
          height: "100%",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Accent line */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 3,
            background: `linear-gradient(90deg, ${audience.accent}, transparent)`,
          }}
        />

        {/* Icon + Title */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: `${audience.accent}10`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Icon size={22} color={audience.accent} strokeWidth={1.8} />
          </div>
          <h3
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: 18,
              fontWeight: 600,
              color: "var(--heading-color)",
              lineHeight: 1.3,
            }}
          >
            {audience.title}
          </h3>
        </div>

        {/* Description */}
        <p
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: 14,
            color: "var(--body-color)",
            lineHeight: 1.7,
          }}
        >
          {audience.description}
        </p>

        {/* Features list */}
        <ul
          style={{
            listStyle: "none",
            padding: 0,
            margin: 0,
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          {audience.features.map((f, i) => (
            <li
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontFamily: "var(--font-sans)",
                fontSize: 13,
                color: "var(--heading-color)",
              }}
            >
              <Check size={14} color={audience.accent} strokeWidth={2.5} style={{ flexShrink: 0 }} />
              {f}
            </li>
          ))}
        </ul>

        {/* CTA */}
        <div style={{ marginTop: "auto", paddingTop: 8 }}>
          <Link
            href={audience.href}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              minHeight: 44,
              minWidth: 44,
              padding: "8px 4px",
              fontFamily: "var(--font-sans)",
              fontSize: 14,
              fontWeight: 500,
              color: audience.accent,
              textDecoration: "none",
              transition: "gap 150ms ease",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.gap = "10px"; }}
            onMouseLeave={(e) => { e.currentTarget.style.gap = "6px"; }}
          >
            {audience.cta}
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

export default function AudienceSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "200px" });

  return (
    <section
      id="audience"
      ref={sectionRef}
      style={{
        padding: "clamp(56px, 8vw, 80px) 24px",
        position: "relative",
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ borderRadius: 16, overflow: "hidden", marginBottom: 28, border: "1px solid var(--card-border)", height: 140, background: "var(--card-bg)" }}>
          <Image
            src="/images/audience-parent.webp"
            alt="Students and teachers in a classroom"
            width={1600}
            height={900}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </div>
        {/* Header */}
        <motion.div
          initial={{ opacity: 1, y: 0 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          style={{ textAlign: "center", marginBottom: 56 }}
        >
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              border: "1px solid var(--card-border)",
              borderRadius: 99,
              padding: "6px 16px",
              fontFamily: "var(--font-sans)",
              fontSize: 12,
              fontWeight: 600,
              color: "var(--body-color)",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              marginBottom: 16,
            }}
          >
            Built for Every Role
          </span>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(26px, 5vw, 44px)",
              fontWeight: 500,
              color: "var(--heading-color)",
              lineHeight: 1.2,
              marginBottom: 12,
            }}
          >
            Built for Everyone in the School
          </h2>
          <p
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: 16,
              color: "var(--body-color)",
              maxWidth: 520,
              margin: "0 auto",
              lineHeight: 1.6,
            }}
          >
            Whether you run the school, teach in the classroom, or have a child enrolled   SchoolPilot has you covered.
          </p>
        </motion.div>

        {/* Cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))",
            gap: 20,
          }}
        >
          {audiences.map((a, i) => (
            <AudienceCard key={a.title} audience={a} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
