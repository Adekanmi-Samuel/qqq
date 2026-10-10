"use client";

import Link from "next/link";
import { Navbar } from "@/components/home/Navbar";
import Footer from "@/components/layout/Footer";
import { Check, Compass, Zap, Building2, Crown } from "lucide-react";

const plans = [
  {
    name: "Free",
    tagline: "Up to 50 students",
    price: "₦0",
    period: "",
    perStudent: "",
    description: "Everything your small school needs to go digital. No credit card required.",
    icon: <Compass className="w-6 h-6" />,
    color: "emerald",
    popular: false,
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
    period: "",
    description: "Everything in Free plus report cards, fee tracking, parent notifications, and CBT exams.",
    icon: <Zap className="w-6 h-6" />,
    color: "emerald",
    popular: false,
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
    period: "",
    description: "AI powered reports, lesson notes, advanced analytics. Everything for growing schools.",
    icon: <Building2 className="w-6 h-6" />,
    color: "emerald",
    popular: true,
    features: [
      "Everything in Starter",
      "AI powered report comments",
      "AI lesson note generator",
      "Advanced analytics dashboard",
      "Email and in-app alerts",
      "Unlimited teacher accounts",
      "Priority support",
      "Data import assistance",
    ],
    cta: "Start Free Trial",
    ctaHref: "/signup",
  },
  {
    name: "Enterprise",
    tagline: "Unlimited students",
    price: "Custom",
    perStudent: "tailored to your school",
    period: "",
    description: "Custom branding, API access, dedicated support. Tailored to your school.",
    icon: <Crown className="w-6 h-6" />,
    color: "amber",
    popular: false,
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

// Brand palette only: green / amber. No purple tokens.
const colorMap: Record<string, { bg: string; text: string; border: string; iconBg: string }> = {
  emerald: { bg: "bg-emerald-500", text: "text-emerald-600", border: "border-emerald-200", iconBg: "bg-emerald-500/10" },
  amber: { bg: "bg-amber-500", text: "text-amber-600", border: "border-amber-200", iconBg: "bg-amber-500/10" },
};

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <Navbar />
      {/* Header */}
      <div className="text-center pt-20 pb-12 px-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[var(--surface)] border border-[var(--border)] rounded-full text-xs font-medium text-[var(--text-muted)] mb-6">
          <Compass className="w-3.5 h-3.5 text-[var(--brand)]" />
          Simple, transparent pricing
        </div>
        <h1 className="text-4xl md:text-5xl font-bold font-display text-[var(--text)] mb-4">
          Choose the right plan for your school
        </h1>
        <p className="text-lg text-[var(--text-muted)] max-w-2xl mx-auto">
          Start free with up to 50 students. Upgrade when you are ready, with no hidden charges and no lock in contracts.
        </p>
      </div>

      {/* Pricing Cards */}
      <div className="max-w-7xl mx-auto px-4 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan) => {
            const colors = colorMap[plan.color] || colorMap.emerald;
            return (
              <div
                key={plan.name}
                className={`relative bg-[var(--surface)] rounded-2xl border ${
                  plan.popular ? `border-[var(--brand)] ring-2 ring-[var(--brand)]/20` : "border-[var(--border)]"
                } p-6 flex flex-col overflow-visible`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-[var(--brand)] text-white text-xs font-semibold rounded-full">
                    Most Popular
                  </div>
                )}

                <div className={`w-12 h-12 rounded-xl ${colors.iconBg} flex items-center justify-center mb-4`}>
                  <div className={colors.text}>{plan.icon}</div>
                </div>

                <h3 className="text-lg font-bold text-[var(--text)]">{plan.name}</h3>
                <p className="text-xs text-[var(--text-muted)] mb-4">{plan.tagline}</p>

                <div className="mb-2">
                  {plan.price ? (
                    <span className="text-3xl font-bold text-[var(--text)]">{plan.price}</span>
                  ) : null}
                  {plan.perStudent && (
                    <span className="text-sm text-[var(--text-muted)] ml-1">{plan.perStudent}</span>
                  )}
                </div>

                <p className="text-sm text-[var(--text-muted)] mb-6">{plan.description}</p>

                <div className="pt-6 border-t border-[var(--border)]">
                  <p className="text-xs font-semibold text-[var(--text)] mb-3 uppercase tracking-wide">Includes:</p>
                  <ul className="space-y-2">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2 text-sm text-[var(--text-muted)]">
                        <Check className="w-4 h-4 text-[var(--brand)] flex-shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-auto pt-6">
                  <Link
                    href={plan.ctaHref}
                    className={`block text-center h-[46px] leading-[46px] rounded-xl font-semibold text-sm transition-all ${
                      plan.popular
                        ? "bg-[var(--brand)] text-white hover:bg-[var(--brand)]/90"
                        : "bg-[var(--surface-2)] text-[var(--text)] hover:bg-[var(--surface-2)]/80 border border-[var(--border)]"
                    }`}
                  >
                    {plan.cta}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {/* FAQ Section */}
        <div className="mt-20 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-[var(--text)] text-center mb-8">Pricing Questions</h2>
          <div className="space-y-4">
            {[
              { q: "How does per-student pricing work?", a: "You pay based on how many active students your school has. If you have 200 students on the Starter plan, you pay 200 x ₦150 = ₦30,000 per term. Scale down or up anytime." },
              { q: "Is the free plan really free?", a: "Yes, forever. Up to 50 students, all core features included. No credit card required. Upgrade when you're ready." },
              { q: "Can I switch plans anytime?", a: "Absolutely. Upgrade or downgrade instantly. When upgrading, you're charged a prorated amount. When downgrading, the change takes effect at your next billing cycle." },
              { q: "What payment methods do you accept?", a: "We accept bank transfers, debit cards, and online payments via Paystack. All transactions are in Nigerian Naira (₦)." },
              { q: "Is there a discount for annual billing?", a: "Talk to us about annual billing for your school. Contact support for current offers." },
            ].map((faq, i) => (
              <details key={i} className="bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden group">
                <summary className="px-6 py-4 cursor-pointer text-sm font-medium text-[var(--text)] hover:bg-[var(--surface-2)] transition-colors list-none flex items-center justify-between">
                  {faq.q}
                  <span className="text-[var(--text-muted)] group-open:rotate-180 transition-transform">▾</span>
                </summary>
                <div className="px-6 pb-4 text-sm text-[var(--text-muted)]">{faq.a}</div>
              </details>
            ))}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
