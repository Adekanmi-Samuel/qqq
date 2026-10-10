"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import {
  Shield,
  Monitor,
  CheckCircle,
  WifiOff,
  Users,
  CreditCard,
} from "lucide-react";

const trustItems = [
  {
    icon: Shield,
    title: "Secure sessions",
    description:
      "Signed in sessions use HttpOnly cookies with CSRF protection. School data stays behind role based access.",
    color: "var(--heading-color)",
  },
  {
    icon: Monitor,
    title: "Works on any device",
    description:
      "No app download needed. Access from phone, tablet, or computer with a browser, including slower connections.",
    color: "var(--heading-color)",
  },
  {
    icon: CheckCircle,
    title: "Built for school workflows",
    description:
      "Attendance, results, fees, notices, and lesson notes in one place, shaped for Nigerian private schools.",
    color: "var(--heading-color)",
  },
  {
    icon: WifiOff,
    title: "Resilient on weak networks",
    description:
      "Pages recover after reloads and timeouts. Full offline sync is planned and will not be claimed until it ships.",
    color: "var(--heading-color)",
  },
  {
    icon: Users,
    title: "Roles that match your school",
    description:
      "Admin, teacher, bursar, student, and parent each see only what their role needs.",
    color: "var(--heading-color)",
  },
  {
    icon: CreditCard,
    title: "Fee tracking ready",
    description:
      "Track charges, payments, and outstanding balances. Paystack online collection is being rolled out for live schools.",
    color: "var(--heading-color)",
  },
];

function TrustCard({
  item,
  index,
}: {
  item: (typeof trustItems)[0];
  index: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "200px" });
  const Icon = item.icon;

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
          padding: "clamp(20px, 3vw, 28px)",
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            background: `${item.color}10`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Icon size={24} color={item.color} strokeWidth={1.8} />
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
          {item.title}
        </h3>
        <p
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: 14,
            color: "var(--body-color)",
            lineHeight: 1.6,
          }}
        >
          {item.description}
        </p>
      </div>
    </motion.div>
  );
}

export default function TrustSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "200px" });

  return (
    <section
      id="trust"
      ref={sectionRef}
      className="dark-section-light"
      style={{
        padding: "clamp(56px, 8vw, 80px) 24px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: "url(/images/trust-campus.webp)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          opacity: 0.08,
          pointerEvents: "none",
        }}
      />
      <div style={{ maxWidth: 1200, margin: "0 auto", position: "relative" }}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 1, y: 0 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          style={{ textAlign: "center", marginBottom: 48 }}
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
            Enterprise-Grade Infrastructure
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
            Your Data Is Safe With Us
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
            Built for small schools and large multi campus groups, without compromising on security or speed.
          </p>
        </motion.div>

        {/* Trust grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 320px), 1fr))",
            gap: 16,
          }}
        >
          {trustItems.map((item, i) => (
            <TrustCard key={item.title} item={item} index={i} />
          ))}
        </div>

        {/* Partner logos strip */}
        <motion.div
          initial={{ opacity: 1, y: 0 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          style={{
            marginTop: 48,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "clamp(24px, 5vw, 56px)",
            flexWrap: "wrap",
            padding: "28px 16px",
            background: "var(--card-bg)",
            borderRadius: 16,
            border: "1px solid var(--card-border)",
          }}
        >
          {[
            { name: "Paystack", color: "var(--muted-color)" },
            { name: "Google Cloud", color: "var(--muted-color)" },
            { name: "Email", color: "var(--muted-color)" },
            { name: "Supabase", color: "var(--muted-color)" },
          ].map((partner) => (
            <div
              key={partner.name}
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: 14,
                fontWeight: 600,
                color: "var(--muted-color)",
                opacity: 0.92,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: partner.color,
                }}
              />
              {partner.name}
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
