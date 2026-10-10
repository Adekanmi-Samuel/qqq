"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Navbar } from "@/components/home/Navbar";
import Footer from "@/components/layout/Footer";
import { supportWhatsAppUrl } from "@/lib/constants";
import { Mail, MessageCircle, MapPin, Send } from "lucide-react";
import { useState } from "react";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] as const },
  }),
};

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const name = data.get("name");
    const email = data.get("email");
    const school = data.get("school");
    const message = data.get("message");

    const subject = encodeURIComponent(`SchoolPilot Inquiry - ${school || "General"}`);
    const body = encodeURIComponent(
      `Name: ${name}\nEmail: ${email}\nSchool: ${school}\n\nMessage:\n${message}`
    );
    window.open(`mailto:hello@schoolpilot.ng?subject=${subject}&body=${body}`, "_blank");
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      <Navbar />

      {/* Hero */}
      <section
        className="relative pt-28 pb-10 md:pt-40 md:pb-20"
        style={{ background: "var(--section-gray)" }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 60% 50% at 30% 40%, rgba(11,110,79,0.05) 0%, transparent 70%)",
          }}
        />
        <div className="relative max-w-4xl mx-auto px-6 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="text-3xl md:text-5xl lg:text-6xl font-semibold leading-tight tracking-tight"
            style={{ fontFamily: "var(--font-display)", color: "var(--heading-color)" }}
          >
            Get in touch
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="mt-4 text-lg md:text-xl"
            style={{ color: "var(--body-color)" }}
          >
            We usually respond same day.
          </motion.p>
        </div>
      </section>

      {/* Content */}
      <section className="py-10 md:py-24 flex-1" style={{ background: "var(--section-light)" }}>
        <div className="max-w-5xl mx-auto px-6 grid md:grid-cols-2 gap-8 md:gap-16">
          {/* Left   Contact options */}
          <div className="space-y-6">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={0}
            >
              <h2
                className="text-2xl font-semibold tracking-tight mb-6"
                style={{ fontFamily: "var(--font-display)", color: "var(--heading-color)" }}
              >
                Reach us directly
              </h2>
            </motion.div>

            {/* Email */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={1}
              className="rounded-2xl border p-6 transition-all duration-200 hover:shadow-md"
              style={{ background: "var(--section-gray)", borderColor: "var(--card-border)" }}
            >
              <div className="flex items-start gap-4">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(11, 110, 79, 0.1)" }}
                >
                  <Mail className="w-5 h-5" style={{ color: "var(--brand)" }} />
                </div>
                <div>
                  <h3
                    className="font-semibold text-base"
                    style={{ color: "var(--heading-color)" }}
                  >
                    Email us
                  </h3>
                  <p className="text-sm mt-1" style={{ color: "var(--body-color)" }}>
                    For general inquiries, partnerships, and support.
                  </p>
                  <a
                    href="mailto:hello@schoolpilot.ng"
                    className="inline-block mt-2 text-sm font-medium hover:underline"
                    style={{ color: "var(--brand)" }}
                  >
                    hello@schoolpilot.ng
                  </a>
                </div>
              </div>
            </motion.div>

            {/* WhatsApp */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={2}
              className="rounded-2xl border p-6 transition-all duration-200 hover:shadow-md"
              style={{
                background: "var(--card-bg)",
                borderColor: "var(--card-border)",
              }}
            >
              <div className="flex items-start gap-4">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "var(--surface-2)" }}
                >
                  <MessageCircle
                    className="w-5 h-5"
                    style={{ color: "var(--heading-color)" }}
                  />
                </div>
                <div>
                  <h3
                    className="font-semibold text-base"
                    style={{ color: "var(--heading-color)" }}
                  >
                    WhatsApp us
                  </h3>
                  <p className="text-sm mt-1" style={{ color: "var(--body-color)" }}>
                    Get faster replies. We understand this is how Nigerian
                    schools communicate best.
                  </p>
                  <a
                    href={supportWhatsAppUrl("Hi, I want to learn more about SchoolPilot")}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 mt-3 px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200"
                    style={{
                      background: "transparent",
                      color: "var(--body-color)",
                      border: "1px solid var(--card-border)",
                      minHeight: 44,
                      textDecoration: "none",
                    }}
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      width="16"
                      height="16"
                    >
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                    Chat on WhatsApp
                  </a>
                </div>
              </div>
            </motion.div>

            {/* Office */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={3}
              className="rounded-2xl border p-6 transition-all duration-200 hover:shadow-md"
              style={{ background: "var(--section-gray)", borderColor: "var(--card-border)" }}
            >
              <div className="flex items-start gap-4">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(11, 110, 79, 0.1)" }}
                >
                  <MapPin className="w-5 h-5" style={{ color: "var(--brand)" }} />
                </div>
                <div>
                  <h3
                    className="font-semibold text-base"
                    style={{ color: "var(--heading-color)" }}
                  >
                    Our office
                  </h3>
                  <p className="text-sm mt-1" style={{ color: "var(--body-color)" }}>
                    Lagos, Nigeria
                  </p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right   Contact form */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={1}
          >
            <div
              className="rounded-2xl border p-7 md:p-8"
              style={{ background: "var(--section-light)", borderColor: "var(--card-border)" }}
            >
              <h2
                className="text-xl font-semibold tracking-tight mb-6"
                style={{ fontFamily: "var(--font-display)", color: "var(--heading-color)" }}
              >
                Send us a message
              </h2>

              {submitted ? (
                <div className="text-center py-10">
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
                    style={{ background: "rgba(11,110,79,0.1)" }}
                  >
                    <Send className="w-6 h-6" style={{ color: "var(--brand)" }} />
                  </div>
                  <p
                    className="font-semibold text-base"
                    style={{ color: "var(--heading-color)" }}
                  >
                    Message prepared
                  </p>
                  <p className="text-sm mt-1" style={{ color: "var(--body-color)" }}>
                    Your email client should open shortly. Thank you for
                    reaching out.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label
                      className="block text-sm font-medium mb-1.5"
                      style={{ color: "var(--body-color)" }}
                      htmlFor="contact-name"
                    >
                      Your name
                    </label>
                    <input
                      id="contact-name"
                      type="text"
                      name="name"
                      required
                      placeholder="e.g. Mrs. Adebayo"
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label
                      className="block text-sm font-medium mb-1.5"
                      style={{ color: "var(--body-color)" }}
                      htmlFor="contact-email"
                    >
                      Email address
                    </label>
                    <input
                      id="contact-email"
                      type="email"
                      name="email"
                      required
                      placeholder="you@example.com"
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label
                      className="block text-sm font-medium mb-1.5"
                      style={{ color: "var(--body-color)" }}
                      htmlFor="contact-school"
                    >
                      School name
                    </label>
                    <input
                      id="contact-school"
                      type="text"
                      name="school"
                      required
                      placeholder="e.g. Sunshine International School"
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label
                      className="block text-sm font-medium mb-1.5"
                      style={{ color: "var(--body-color)" }}
                      htmlFor="contact-message"
                    >
                      Message
                    </label>
                    <textarea
                      id="contact-message"
                      name="message"
                      required
                      rows={4}
                      placeholder="How can we help?"
                      className="input-field resize-y"
                      style={{ minHeight: 100 }}
                    />
                  </div>
                  <button
                    type="submit"
                    className="btn btn-primary w-full text-center mt-2"
                    style={{ minHeight: 48, fontSize: 15 }}
                  >
                    Send message
                  </button>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
