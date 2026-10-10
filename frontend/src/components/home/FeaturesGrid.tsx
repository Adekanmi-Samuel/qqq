"use client";

import { useRef } from "react";
import Image from "next/image";
import { motion, useInView } from "framer-motion";
import {
  Users,
  ClipboardCheck,
  Wallet,
  FileText,
  Smartphone,
  LayoutDashboard,
  Bot,
  MessageSquare,
} from "lucide-react";

interface Feature {
  icon: React.ElementType;
  title: string;
  description: string;
  color: string;
}

const features: Feature[] = [
  {
    icon: Users,
    title: "Student Management",
    description:
      "Enroll students, manage records, track progress, and organize classes   from nursery through SS3.",
    color: "var(--heading-color)",
  },
  {
    icon: ClipboardCheck,
    title: "Attendance Tracking",
    description:
      "Mark attendance in seconds from any device. Auto-notify parents when students are absent for 3+ days.",
    color: "var(--heading-color)",
  },
  {
    icon: Wallet,
    title: "Fee Management",
    description:
      "Track payments, send reminders, and generate receipts. Integrated with Paystack for secure transactions.",
    color: "var(--heading-color)",
  },
  {
    icon: FileText,
    title: "Results & Report Cards",
    description:
      "A1 through F9 grading built in. CA, exams, positions, remarks   generate report cards in one click.",
    color: "var(--heading-color)",
  },
  {
    icon: Smartphone,
    title: "Parent Portal",
    description:
      "Parents log in with their phone number   no email needed. View attendance, results, and school notices.",
    color: "var(--heading-color)",
  },
  {
    icon: LayoutDashboard,
    title: "Teacher Dashboard",
    description:
      "Teachers mark attendance from their phone, enter results online, and access their class timetable.",
    color: "var(--heading-color)",
  },
  {
    icon: Bot,
    title: "AI Assistant",
    description:
      "Generate lesson notes, create exam questions, and get curriculum-aligned content with AI assistance.",
    color: "var(--heading-color)",
  },
  {
    icon: MessageSquare,
    title: "Free Parent Alerts",
    description:
      "Send free email and in-app alerts to parents for announcements, fee reminders, and attendance alerts with free email and in-app alerts.",
    color: "var(--heading-color)",
  },
];

function FeatureCard({ feature, index }: { feature: Feature; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "200px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 1, y: 0 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.5,
        delay: index * 0.08,
        ease: [0.16, 1, 0.3, 1],
      }}
    >
      <div
        className="sh-card"
        style={{
          padding: 28,
          height: "100%",
          display: "flex",
          flexDirection: "column",
          gap: 14,
        }}
      >
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: `${feature.color}10`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <feature.icon size={22} color={feature.color} strokeWidth={1.8} />
        </div>
        <h3
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: 16,
            fontWeight: 600,
            color: "var(--heading-color)",
            lineHeight: 1.3,
          }}
        >
          {feature.title}
        </h3>
        <p
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: 14,
            color: "var(--body-color)",
            lineHeight: 1.65,
          }}
        >
          {feature.description}
        </p>
      </div>
    </motion.div>
  );
}

export default function FeaturesGrid() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "200px" });

  return (
    <section
      ref={sectionRef}
      id="features"
      className="dark-section-gray"
      style={{
        padding: "clamp(56px, 8vw, 80px) 24px",
        position: "relative",
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div
          style={{
            borderRadius: 20,
            overflow: "hidden",
            marginBottom: 40,
            border: "1px solid var(--card-border)",
            position: "relative",
            height: 180,
          }}
        >
          <Image
            src="/images/feature-students.webp"
            alt="Students in a Nigerian school using SchoolPilot"
            width={1200}
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
            Features
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
            Everything Your School Needs
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
            A complete toolkit designed for how Nigerian schools actually work.
          </p>
        </motion.div>

        {/* Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 280px), 1fr))",
            gap: 16,
          }}
        >
          {features.map((feature, i) => (
            <FeatureCard key={feature.title} feature={feature} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
