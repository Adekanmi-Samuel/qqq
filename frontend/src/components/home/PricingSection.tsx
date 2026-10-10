"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import Link from "next/link";
import { Check } from "lucide-react";

type Plan = {
  name: string;
  tagline: string;
  price: string;
  perStudent: string;
  badge?: string;
  features: string[];
  cta: string;
  ctaHref: string;
  popular?: boolean;
};

const plans: Plan[] = [
  {
    name: "Free",
    tagline: "Up to 50 students",
    price: "₦0",
    perStudent: "",
    features: [
      "Student profiles & enrollment",
      "Attendance tracking",
      "Timetable management",
      "School notices & announcements",
      "Basic analytics dashboard",
      "Email support",
    ],
    cta: "Start Free",
    ctaHref: "/signup",
  },
  {
    name: "Starter",
    tagline: "Up to 300 students",
    price: "₦150",
    perStudent: "per student per term",
    features: [
      "Everything in Free",
      "Report card generation",
      "Fee tracking & receipts",
      "Parent notifications",
      "CBT exam module",
      "10 teacher accounts",
      "Email support",
    ],
    cta: "Start Free Trial",
    ctaHref: "/signup",
  },
  {
    name: "Growth",
    tagline: "Up to 1,000 students",
    price: "₦300",
    perStudent: "per student per term",
    badge: "Most Popular",
    features: [
      "Everything in Starter",
      "AI powered report comments",
      "AI lesson note generator",
      "Advanced analytics dashboard",
      "email and in-app alerts",
      "Unlimited teacher accounts",
      "Priority support",
      "Data import assistance",
    ],
    cta: "Start Free Trial",
    ctaHref: "/signup",
    popular: true,
  },
  {
    name: "Enterprise",
    tagline: "Unlimited students",
    price: "Custom",
    perStudent: "tailored to your school",
    features: [
      "Everything in Growth",
      "Multi campus management",
      "Custom integrations",
      "Dedicated account manager",
      "On site training",
      "Custom report templates",
      "API access",
      "Secure cookie sessions",
    ],
    cta: "Contact Sales",
    ctaHref: "/contact",
  },
];

export default function PricingSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "200px" });

  return (
    <section
      ref={sectionRef}
      id="pricing"
      className="dark-section-gray"
      style={{
        padding: "clamp(56px, 8vw, 80px) 24px",
        position: "relative",
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 1, y: 0 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          style={{ textAlign: "center", marginBottom: 40 }}
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
            Pricing
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
            Simple, Transparent Pricing
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
            Start free with up to 50 students. Upgrade when you are ready, with no hidden charges and no lock in contracts.
          </p>
        </motion.div>

        {/* Pricing cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 260px), 1fr))",
            gap: 20,
            alignItems: "start",
          }}
        >
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 1, y: 0 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.5,
                delay: 0.15 + index * 0.1,
                ease: [0.16, 1, 0.3, 1],
              }}
              style={{
                position: "relative",
                background: "var(--card-bg)",
                borderRadius: 16,
                border: plan.popular
                  ? "2px solid var(--brand)"
                  : "1px solid var(--card-border)",
                padding: 32,
                transform: plan.popular ? "scale(1.03)" : "scale(1)",
                boxShadow: plan.popular
                  ? "0 8px 32px rgba(11,110,79,0.12)"
                  : "var(--card-shadow)",
              }}
            >
              {/* Badge */}
              {plan.badge && (
                <div
                  style={{
                    position: "absolute",
                    top: -12,
                    left: "50%",
                    transform: "translateX(-50%)",
                    background: "var(--card-bg)",
                    color: "var(--heading-color)",
                    fontSize: 12,
                    fontWeight: 600,
                    padding: "4px 16px",
                    borderRadius: 20,
                    whiteSpace: "nowrap",
                    fontFamily: "var(--font-sans)",
                    border: "1px solid var(--card-border)",
                  }}
                >
                  {plan.badge}
                </div>
              )}

              {/* Plan name & tagline */}
              <h3
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: 20,
                  fontWeight: 600,
                  color: "var(--heading-color)",
                  marginBottom: 4,
                }}
              >
                {plan.name}
              </h3>
              <p
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: 13,
                  color: "var(--muted-color)",
                  marginBottom: 20,
                }}
              >
                {plan.tagline}
              </p>

              {/* Price */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                  <span
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: 36,
                      fontWeight: 600,
                      color: "var(--heading-color)",
                      lineHeight: 1,
                    }}
                  >
                    {plan.price}
                  </span>
                  {plan.perStudent && (
                    <span
                      style={{
                        fontFamily: "var(--font-sans)",
                        fontSize: 14,
                        color: "var(--muted-color)",
                      }}
                    >
                      {plan.perStudent}
                    </span>
                  )}
                </div>
              </div>

              {/* Divider */}
              <div style={{ height: 1, background: "var(--card-border)", marginBottom: 24 }} />

              {/* Features */}
              <ul style={{ listStyle: "none", padding: 0, margin: "0 0 24px 0" }}>
                {plan.features.map((f) => (
                  <li
                    key={f}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 10,
                      marginBottom: 10,
                      fontFamily: "var(--font-sans)",
                      fontSize: 14,
                      color: "var(--heading-color)",
                      lineHeight: 1.4,
                    }}
                  >
                    <Check size={16} color="var(--brand)" strokeWidth={2.5} style={{ flexShrink: 0, marginTop: 2 }} />
                    {f}
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Link
                href={plan.ctaHref}
                className={plan.popular ? "btn btn-primary" : "btn btn-secondary"}
                style={{
                  width: "100%",
                  justifyContent: "center",
                  height: 48,
                  borderRadius: 12,
                  textDecoration: "none",
                  fontWeight: 600,
                  fontSize: 15,
                }}
              >
                {plan.cta}
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Trust footer */}
        <p
          style={{
            textAlign: "center",
            fontFamily: "var(--font-sans)",
            fontSize: 13,
            color: "var(--muted-color)",
            marginTop: 40,
            lineHeight: 1.6,
          }}
        >
          All plans include unlimited notice board, school public profile, and CSV export.
          No credit card required.
        </p>
      </div>
    </section>
  );
}
