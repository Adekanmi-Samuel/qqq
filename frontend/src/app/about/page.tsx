"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Navbar } from "@/components/home/Navbar";
import Footer from "@/components/layout/Footer";

const values = [
  {
    title: "Simplicity",
    description:
      "School administrators are not IT specialists. SchoolPilot is designed so that a school secretary, a bursar, or a principal can use it from day one without training. If you can send a WhatsApp message, you can use SchoolPilot.",
    icon: (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M8 12h8" />
        <path d="M12 8v8" />
      </svg>
    ),
  },
  {
    title: "Reliability",
    description:
      "Nigerian schools cannot afford software that goes down during exam week. We invest heavily in uptime, data integrity, and backup systems so your school operations never skip a beat.",
    icon: (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
        <path d="M9 12l2 2 4-4" />
      </svg>
    ),
  },
  {
    title: "Local-First",
    description:
      "We are not adapting a foreign product for Nigeria. We are building specifically for the Nigerian education system, from our grading scales to our currency formats to our understanding of how schools actually operate here.",
    icon: (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
        <circle cx="12" cy="10" r="3" />
      </svg>
    ),
  },
];

const team = [
  {
    name: "Adaeze Okonkwo",
    role: "Co-founder & CEO",
    bio: "Former school administrator who spent 12 years managing operations at one of Lagos's largest private schools. She built SchoolPilot from the frustration of watching brilliant educators drown in paperwork.",
  },
  {
    name: "Tunde Afolabi",
    role: "Co-founder & CTO",
    bio: "Software engineer who previously led backend systems at Flutterwave. He brings deep experience building reliable, scalable systems that handle sensitive financial and student data.",
  },
  {
    name: "Ngozi Eze",
    role: "Head of Product",
    bio: "Education researcher turned product designer. She has conducted field studies in over 200 schools across 12 Nigerian states, ensuring every feature solves a real problem school administrators face daily.",
  },
];

const stats = [
  { number: "200+", label: "Schools registered" },
  { number: "50,000+", label: "Students managed" },
  { number: "12", label: "States covered" },
  { number: "Creche to SS", label: "School levels" },
];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] as const },
  }),
};

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      <Navbar />

      <main className="flex-1">
        {/* Hero */}
        <section
          className="relative pt-32 pb-20 md:pt-40 md:pb-28"
          style={{ background: "var(--section-gray)" }}
        >
          {/* Subtle mesh */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse 60% 50% at 20% 30%, rgba(11,110,79,0.06) 0%, transparent 70%), radial-gradient(ellipse 50% 40% at 80% 70%, rgba(245,158,11,0.03) 0%, transparent 70%)",
            }}
          />
          <div className="relative max-w-4xl mx-auto px-6 text-center">
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
              className="text-sm font-medium tracking-wide uppercase mb-6"
              style={{ color: "var(--brand)", letterSpacing: "0.08em" }}
            >
              About SchoolPilot
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="text-3xl md:text-5xl lg:text-6xl font-semibold leading-tight tracking-tight"
              style={{ fontFamily: "var(--font-display)", color: "var(--heading-color)" }}
            >
              Built for Nigerian schools, by people who understand Nigerian schools
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.5 }}
              className="mt-6 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed"
              style={{ color: "var(--body-color)" }}
            >
              We started SchoolPilot because we saw brilliant schools struggling
              with paper records, scattered spreadsheets, and tools built for
              other countries. We knew it could be better.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="mt-10 mx-auto max-w-3xl rounded-2xl overflow-hidden"
              style={{ border: "1px solid var(--card-border)" }}
            >
              <Image
                src="/images/about/hero-school.jpg"
                alt="Nigerian students in a modern classroom using technology for learning"
                width={1200}
                height={600}
                sizes="(max-width: 768px) 100vw, 768px"
                className="w-full h-auto object-cover"
                style={{ maxHeight: 360, objectPosition: "center 40%" }}
                priority
              />
            </motion.div>
          </div>
        </section>

        {/* Mission */}
        <section className="py-20 md:py-28" style={{ background: "var(--section-light)" }}>
          <div className="max-w-5xl mx-auto px-6 grid md:grid-cols-2 gap-10 md:gap-16 items-center">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-60px" }}
              variants={fadeUp}
              custom={0}
            >
              <p
                className="text-sm font-medium tracking-wide uppercase mb-4"
                style={{ color: "var(--brand)", letterSpacing: "0.08em" }}
              >
                Our Mission
              </p>
              <h2
                className="text-2xl md:text-4xl font-semibold tracking-tight leading-snug"
                style={{ fontFamily: "var(--font-display)", color: "var(--heading-color)" }}
              >
                Digitising school administration across Nigeria
              </h2>
              <div
                className="mt-8 space-y-5 text-base md:text-lg leading-relaxed"
                style={{ color: "var(--body-color)" }}
              >
                <p>
                  We believe that school administrators should spend their time
                  delivering quality education, not drowning in paperwork.
                  SchoolPilot digitises school administration for Nigerian private
                  and government schools, making operations seamless, transparent,
                  and efficient.
                </p>
                <p>
                  From complex grading systems to attendance tracking, fee
                  management to parent communication, we are building the digital
                  infrastructure that great Nigerian schools deserve.
                </p>
                <p>
                  Every feature in SchoolPilot is designed around the reality of
                  running a school in Lagos, Abuja, Port Harcourt, or anywhere in
                  Nigeria. We understand the challenges because we live them too.
                </p>
              </div>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-60px" }}
              variants={fadeUp}
              custom={1}
              className="rounded-2xl overflow-hidden"
              style={{ border: "1px solid var(--card-border)" }}
            >
              <Image
                src="/images/about/mission.jpg"
                alt="Students studying in a library with books and modern learning materials"
                width={1000}
                height={500}
                sizes="(max-width: 768px) 100vw, 500px"
                className="w-full h-auto object-cover"
                style={{ maxHeight: 400 }}
              />
            </motion.div>
          </div>
        </section>

        {/* Values */}
        <section className="py-20 md:py-28" style={{ background: "var(--section-gray)" }}>
          <div className="max-w-5xl mx-auto px-6">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-60px" }}
              variants={fadeUp}
              custom={0}
              className="text-center mb-14"
            >
              <p
                className="text-sm font-medium tracking-wide uppercase mb-4"
                style={{ color: "var(--brand)", letterSpacing: "0.08em" }}
              >
                What We Believe
              </p>
              <h2
                className="text-2xl md:text-4xl font-semibold tracking-tight"
                style={{ fontFamily: "var(--font-display)", color: "var(--heading-color)" }}
              >
                Our Values
              </h2>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-6">
              {values.map((value, i) => (
                <motion.div
                  key={value.title}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: "-40px" }}
                  variants={fadeUp}
                  custom={i + 1}
                  className="rounded-2xl border p-7 md:p-8 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
                  style={{
                    background: "var(--section-light)",
                    borderColor: "var(--card-border)",
                  }}
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
                    style={{
                      background: "rgba(11, 110, 79, 0.08)",
                      color: "var(--brand)",
                    }}
                  >
                    {value.icon}
                  </div>
                  <h3
                    className="text-xl font-semibold mb-3"
                    style={{
                      fontFamily: "var(--font-display)",
                      color: "var(--heading-color)",
                    }}
                  >
                    {value.title}
                  </h3>
                  <p
                    className="text-sm leading-relaxed"
                    style={{ color: "var(--body-color)" }}
                  >
                    {value.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Stats */}
        <section
          className="py-16 md:py-20"
          style={{ background: "var(--section-light)" }}
        >
          <div className="max-w-4xl mx-auto px-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: "-40px" }}
                  variants={fadeUp}
                  custom={i}
                  className="text-center"
                >
                  <p
                    className="text-3xl md:text-4xl font-bold"
                    style={{
                      fontFamily: "var(--font-display)",
                      color: "var(--brand)",
                    }}
                  >
                    {stat.number}
                  </p>
                  <p
                    className="mt-2 text-sm"
                    style={{ color: "var(--body-color)" }}
                  >
                    {stat.label}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Team */}
        <section className="py-20 md:py-28" style={{ background: "var(--section-gray)" }}>
          <div className="max-w-5xl mx-auto px-6">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-60px" }}
              variants={fadeUp}
              custom={0}
              className="text-center mb-14"
            >
              <p
                className="text-sm font-medium tracking-wide uppercase mb-4"
                style={{ color: "var(--brand)", letterSpacing: "0.08em" }}
              >
                The Team
              </p>
              <h2
                className="text-2xl md:text-4xl font-semibold tracking-tight"
                style={{ fontFamily: "var(--font-display)", color: "var(--heading-color)" }}
              >
                The people behind SchoolPilot
              </h2>
              <p
                className="mt-4 text-base md:text-lg max-w-2xl mx-auto leading-relaxed"
                style={{ color: "var(--body-color)" }}
              >
                We are educators, engineers, and operators united by one belief:
                Nigerian schools deserve world class tools built for their reality.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-6">
              {team.map((member, i) => (
                <motion.div
                  key={member.name}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: "-40px" }}
                  variants={fadeUp}
                  custom={i + 1}
                  className="rounded-2xl border p-7 md:p-8 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
                  style={{
                    background: "var(--section-light)",
                    borderColor: "var(--card-border)",
                  }}
                >
                  <div className="flex items-center gap-4 mb-5">
                    <div
                      className="w-14 h-14 rounded-full overflow-hidden shrink-0"
                      style={{
                        background: "rgba(11, 110, 79, 0.08)",
                      }}
                    >
                      <Image
                        src={`/images/about/team-${i + 1}.jpg`}
                        alt={`Portrait of ${member.name}`}
                        width={56}
                        height={56}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <h3
                        className="text-lg font-semibold"
                        style={{
                          fontFamily: "var(--font-display)",
                          color: "var(--heading-color)",
                        }}
                      >
                        {member.name}
                      </h3>
                      <p
                        className="text-sm font-medium"
                        style={{ color: "var(--brand)" }}
                      >
                        {member.role}
                      </p>
                    </div>
                  </div>
                  <p
                    className="text-sm leading-relaxed"
                    style={{ color: "var(--body-color)" }}
                  >
                    {member.bio}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section
          className="py-20 md:py-28"
          style={{
            background:
              "linear-gradient(135deg, #0b6e4f 0%, #12926a 50%, #17ab7d 100%)",
          }}
        >
          <div className="max-w-3xl mx-auto px-6 text-center">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-60px" }}
              variants={fadeUp}
              custom={0}
            >
              <h2
                className="text-3xl md:text-5xl font-semibold tracking-tight text-white leading-snug"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Ready to transform your school?
              </h2>
              <p className="mt-5 text-lg text-white/80 max-w-xl mx-auto leading-relaxed">
                Join schools across Nigeria already using SchoolPilot to manage
                their operations more efficiently.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/signup"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-base font-medium transition-all duration-200 hover:-translate-y-0.5"
                  style={{
                    background: "var(--section-light)",
                    color: "var(--brand)",
                    boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
                    minHeight: 48,
                    textDecoration: "none",
                  }}
                >
                  Register your school
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 12h14M12 5l7 7-7 7"
                    />
                  </svg>
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-base font-medium transition-all duration-200"
                  style={{
                    background: "transparent",
                    color: "#ffffff",
                    border: "1.5px solid rgba(255,255,255,0.4)",
                    minHeight: 48,
                    textDecoration: "none",
                  }}
                >
                  Talk to us
                </Link>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
