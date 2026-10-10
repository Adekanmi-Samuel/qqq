"use client";

import Link from "next/link";
import { useRef } from "react";
import Image from "next/image";
import { motion, useInView } from "framer-motion";
import {
  Users,
  BarChart3,
  Shield,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

const stats = [
  { value: "Built for Nigeria", label: "Schools" },
  { value: "Every level", label: "Creche to SS" },
  { value: "Cookie secure", label: "Auth ready" },
];

const fadeUp = {
  hidden: { opacity: 1, y: 0 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
  }),
};

export default function HeroSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "200px" });

  return (
    <section
      ref={sectionRef}
      style={{
        position: "relative",
        overflow: "hidden",
        paddingTop: 96,
        paddingBottom: 64,
      }}
      className="bg-[var(--section-gray)]"
    >
      {/* Subtle background pattern */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "repeating-linear-gradient(transparent, transparent 31px, rgba(11, 110, 79, 0.03) 31px, rgba(11, 110, 79, 0.03) 32px)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          position: "relative",
          maxWidth: 1200,
          margin: "0 auto",
          padding: "0 clamp(16px, 4vw, 24px)",
          display: "grid",
          gridTemplateColumns: "1fr",
          gap: 48,
          alignItems: "center",
        }}
        className="grid-cols-1 md:grid-cols-2"
      >
        {/* Left content */}
        <div>
          {/* Pill badge */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={0}
            style={{ marginBottom: 24 }}
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
                fontSize: 13,
                fontWeight: 500,
                color: "var(--body-color)",
              }}
            >
              <span style={{ fontSize: 14 }}>&#127475;&#127468;</span>
              Built for Nigerian schools
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={1}
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(32px, 6vw, 56px)",
              fontWeight: 500,
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
              color: "var(--heading-color)",
              marginBottom: 20,
            }}
          >
            The Smart Way to{" "}
            Manage Your School
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={2}
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: 17,
              lineHeight: 1.7,
              color: "var(--body-color)",
              maxWidth: 520,
              marginBottom: 32,
            }}
          >
            Manage students, track attendance, collect fees, generate report cards,
            and communicate with parents   all from one powerful dashboard built for
            the Nigerian education system.
          </motion.p>

          {/* CTAs */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={3}
            style={{
              display: "flex",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 12,
              marginBottom: 48,
            }}
          >
            <Link
              href="/signup"
              className="btn btn-primary"
              style={{
                fontSize: 15,
                fontWeight: 600,
                padding: "12px 28px",
                borderRadius: 12,
                minHeight: 48,
                textDecoration: "none",
                gap: 8,
              }}
            >
              Start Free Trial
              <ArrowRight size={16} />
            </Link>
            <Link
              href="#how-it-works"
              className="btn btn-secondary"
              style={{
                fontSize: 15,
                fontWeight: 500,
                padding: "12px 28px",
                borderRadius: 12,
                minHeight: 48,
                textDecoration: "none",
              }}
            >
              See How It Works
            </Link>
          </motion.div>

          {/* Trust stats */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={4}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "clamp(24px, 4vw, 48px)",
            }}
          >
            {stats.map((stat) => (
              <div key={stat.label}>
                <span
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "clamp(22px, 4vw, 30px)",
                    fontWeight: 600,
                    color: "var(--heading-color)",
                    display: "block",
                    lineHeight: 1.1,
                    marginBottom: 2,
                  }}
                >
                  {stat.value}
                </span>
                <span
                  style={{
                    fontFamily: "var(--font-sans)",
                    fontSize: 13,
                    color: "var(--muted-color)",
                  }}
                >
                  {stat.label}
                </span>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Right: Hero graphic placeholder */}
        <motion.div
          initial={{ opacity: 1, x: 0 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
          className="flex"
        >
          <div
            className="hero-mock-shell"
            style={{
              width: "100%",
              maxWidth: 480,
              aspectRatio: "4/3",
              borderRadius: 20,
              border: "1px solid var(--card-border)",
              position: "relative",
              overflow: "hidden",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {/* Dashboard mockup over classroom photo */}
            <Image
              src="/images/hero-classroom.webp"
              alt="Nigerian classroom where SchoolPilot is used"
              width={1600}
              height={1000}
              priority
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
                opacity: 0.18,
              }}
            />
            {/* Solid veil so mock UI text stays readable over the photo */}
            <div
              aria-hidden="true"
              className="hero-mock-veil"
              style={{
                position: "absolute",
                inset: 0,
              }}
            />
            <div
              className="hero-mock-panel"
              style={{
                position: "relative",
                width: "85%",
                padding: 20,
                background: "var(--card-bg)",
                borderRadius: 12,
                border: "1px solid var(--card-border)",
              }}
            >
              {/* Top bar */}
              <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className={i === 1 ? "hero-mock-bar-active" : "hero-mock-bar-idle"}
                    style={{
                      width: i === 1 ? 40 : 8,
                      height: 8,
                      borderRadius: 4,
                    }}
                  />
                ))}
              </div>
              {/* Stat row */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 16 }}>
                {[
                  { icon: Users, color: "var(--heading-color)", label: "Students", val: "Roster", iconClass: "" },
                  { icon: BarChart3, color: "var(--heading-color)", label: "Results", val: "CA + Exam", iconClass: "hero-mock-icon-results" },
                  { icon: Shield, color: "var(--heading-color)", label: "Fees", val: "Tracked", iconClass: "hero-mock-icon-fees" },
                ].map(({ icon: Icon, color, label, val, iconClass }) => (
                  <div
                    key={label}
                    style={{
                      padding: 12,
                      borderRadius: 10,
                      background: "var(--card-bg)",
                      border: "1px solid var(--card-border)",
                    }}
                  >
                    <Icon size={16} color={color} className={iconClass || undefined} style={{ marginBottom: 6 }} />
                    <div style={{ fontFamily: "var(--font-sans)", fontSize: 14, fontWeight: 700, color: "var(--heading-color)" }}>{val}</div>
                    <div style={{ fontFamily: "var(--font-sans)", fontSize: 11, color: "var(--muted-color)" }}>{label}</div>
                  </div>
                ))}
              </div>
              {/* Chart bars */}
              <div style={{ display: "flex", gap: 4, alignItems: "flex-end", height: 48 }}>
                {[40, 65, 45, 80, 55, 70, 90, 60, 75, 85, 50, 72].map((h, i) => (
                  <div
                    key={i}
                    className={i === 10 ? "hero-mock-chart-bar-hot" : "hero-mock-chart-bar"}
                    style={{
                      flex: 1,
                      height: `${h}%`,
                      borderRadius: 3,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
