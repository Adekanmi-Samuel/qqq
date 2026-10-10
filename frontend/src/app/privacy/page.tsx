"use client";

import { motion } from "framer-motion";
import { Navbar } from "@/components/home/Navbar";
import Footer from "@/components/layout/Footer";
import { supportWhatsAppUrl } from "@/lib/constants";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.45, ease: [0.16, 1, 0.3, 1] as const },
  }),
};

const sections = [
  {
    id: "data-controller",
    title: "1. Data Controller",
    content: (
      <>
        <p>
          This Privacy Policy is issued by <strong>SchoolPilot</strong>,
          headquartered in Lagos, Nigeria. We are the data controller
          responsible for your personal data when you use our platform.
        </p>
        <p>
          We are committed to protecting your privacy in compliance with the
          Nigeria Data Protection Regulation (NDPR) and the Nigeria Data
          Protection Act (NDPA) 2023.
        </p>
      </>
    ),
  },
  {
    id: "what-we-collect",
    title: "2. What We Collect",
    content: (
      <>
        <p>
          We collect only the information necessary to provide school
          administration services. Specifically:
        </p>
        <ul>
          <li>
            <strong>School details</strong> -- name, CAC registration number,
            address, logo, and motto.
          </li>
          <li>
            <strong>Admin and staff information</strong> -- full names, email
            addresses, and phone numbers.
          </li>
          <li>
            <strong>Student information</strong> -- names, admission numbers,
            class/arm assignments, and academic records. <em>We do not collect
            National Identification Numbers (NIN) or any government-issued IDs
            from students.</em>
          </li>
          <li>
            <strong>Parent information</strong> -- names, phone numbers, and
            email addresses used for school-to-parent communication.
          </li>
          <li>
            <strong>Academic data</strong> -- attendance records, test scores,
            exam results, grades, and report card data.
          </li>
          <li>
            <strong>Fee data</strong> -- fee structures and payment records
            as entered by the school.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "how-we-use",
    title: "3. How We Use Your Data",
    content: (
      <>
        <p>
          The data collected is strictly used to provide school management
          services to the registered school. This includes:
        </p>
        <ul>
          <li>Generating and publishing student report cards and results.</li>
          <li>Tracking student attendance and punctuality.</li>
          <li>Managing fee records and payment tracking.</li>
          <li>Sending critical school notifications to parents by email and in-app notification.</li>
          <li>Providing analytics dashboards for school administrators.</li>
        </ul>
        <p>
          <strong>We do not use your data for targeted advertising, profiling,
          or any purpose beyond delivering the services described above.</strong>
        </p>
      </>
    ),
  },
  {
    id: "data-storage",
    title: "4. Data Storage and Security",
    content: (
      <>
        <p>
          Your data is hosted on secure, enterprise-grade cloud infrastructure.
          We employ industry-standard security measures including:
        </p>
        <ul>
          <li>Encryption of data in transit (TLS) and at rest.</li>
          <li>Role-based access controls to limit who can view data.</li>
          <li>Regular security audits and monitoring.</li>
          <li>Automated backups to prevent data loss.</li>
        </ul>
        <p>
          We retain your data for as long as your school account is active.
          When a school terminates its account, data is permanently deleted
          within 90 days unless a longer retention period is required by law.
        </p>
      </>
    ),
  },
  {
    id: "data-sharing",
    title: "5. Data Sharing",
    content: (
      <>
        <p>
          <strong>We do not sell, rent, or share your personal data with third
          parties for marketing purposes.</strong>
        </p>
        <p>
          Data is shared only as strictly necessary to provide our services:
        </p>
        <ul>
          <li>
            <strong>Notification delivery</strong> -- Parent contact details may be used
            processed for school communication purposes only
            sending school notifications.
          </li>
          <li>
            <strong>Cloud hosting</strong> -- Data is stored on our cloud
            infrastructure providers who maintain strict data processing
            agreements.
          </li>
        </ul>
        <p>
          We may disclose data if required by law, court order, or regulatory
          request from a recognised Nigerian authority.
        </p>
      </>
    ),
  },
  {
    id: "children",
    title: "6. Children's Data",
    content: (
      <>
        <p>
          SchoolPilot processes student academic records strictly on behalf of
          the schools. We act as a <strong>data processor</strong> for the
          schools, which are the data controllers for student information.
        </p>
        <p>
          No student data is ever used for marketing, advertising, or any
          purpose unrelated to the school management services requested by
          the school.
        </p>
        <p>
          We do not knowingly collect data directly from children. All student
          data is entered by authorised school administrators, teachers, or
          bursars.
        </p>
      </>
    ),
  },
  {
    id: "your-rights",
    title: "7. Your Rights",
    content: (
      <>
        <p>
          Under the NDPR and NDPA, you have the following rights regarding
          your personal data:
        </p>
        <ul>
          <li>
            <strong>Right of access</strong> -- You may request a copy of the
            personal data we hold about you.
          </li>
          <li>
            <strong>Right to rectification</strong> -- You may request
            correction of inaccurate or incomplete data.
          </li>
          <li>
            <strong>Right to deletion</strong> -- You may request that we
            delete your personal data, subject to legal obligations.
          </li>
          <li>
            <strong>Right to object</strong> -- You may object to processing
            of your data in certain circumstances.
          </li>
          <li>
            <strong>Right to withdraw consent</strong> -- Where processing is
            based on consent, you may withdraw it at any time.
          </li>
        </ul>
        <p>
          Schools retain ownership of their data. As a school administrator,
          you may request full deletion of your school&apos;s data at any
          time by contacting us. Parents wishing to exercise their data rights
          should contact their school directly, as the school is the data
          controller.
        </p>
      </>
    ),
  },
  {
    id: "cookies",
    title: "8. Cookies and Tracking",
    content: (
      <>
        <p>
          SchoolPilot uses only essential cookies required for authentication
          and platform functionality. We do not use third-party advertising
          cookies or tracking pixels.
        </p>
      </>
    ),
  },
  {
    id: "changes",
    title: "9. Changes to This Policy",
    content: (
      <>
        <p>
          We may update this Privacy Policy from time to time. When we make
          material changes, we will notify schools via email or in-platform
          notification. The latest version will always be available on this
          page.
        </p>
      </>
    ),
  },
  {
    id: "contact",
    title: "10. Contact Us",
    content: (
      <>
        <p>
          If you have any questions about this Privacy Policy or wish to
          exercise any of your data rights, please contact us:
        </p>
        <ul>
          <li>
            Email:{" "}
            <a
              href="mailto:hello@schoolpilot.ng"
              className="font-medium hover:underline"
              style={{ color: "var(--brand)" }}
            >
              hello@schoolpilot.ng
            </a>
          </li>
          <li>WhatsApp:{" "}
            <a
              href={supportWhatsAppUrl("Hi, I have a privacy inquiry")}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium hover:underline"
              style={{ color: "var(--brand)" }}
            >
              Chat with us
            </a>
          </li>
          <li>Office: Lagos, Nigeria</li>
        </ul>
      </>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      <Navbar />

      <style>{`
        @media print {
          header, footer, nav, .no-print { display: none !important; }
          body { background: white !important; }
          .privacy-content { box-shadow: none !important; border: none !important; padding: 0 !important; }
          .privacy-section { break-inside: avoid; }
          .print-only { display: block !important; }
        }
      `}</style>

      {/* Header */}
      <section
        className="relative pt-32 pb-12 md:pt-40 md:pb-16"
        style={{ background: "var(--section-gray)" }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 60% 50% at 30% 40%, rgba(11,110,79,0.05) 0%, transparent 70%)",
          }}
        />
        <div className="relative max-w-3xl mx-auto px-6">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="text-3xl md:text-5xl font-semibold tracking-tight"
            style={{ fontFamily: "var(--font-display)", color: "var(--heading-color)" }}
          >
            Privacy Policy
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15, duration: 0.4 }}
            className="mt-3 text-sm"
            style={{ color: "var(--body-color)" }}
          >
            Last updated:{" "}
            {new Date().toLocaleDateString("en-NG", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </motion.p>
          <p className="mt-2 text-sm" style={{ color: "var(--muted-color)" }}>
            NDPR and NDPA 2023 compliant
          </p>
        </div>
      </section>

      {/* Content */}
      <section
        className="py-12 md:py-16 flex-1"
        style={{ background: "var(--section-light)" }}
      >
        <div className="max-w-3xl mx-auto px-6">
          <motion.div
            initial="hidden"
            animate="visible"
            className="privacy-content rounded-2xl border p-8 md:p-12 lg:p-14"
            style={{
              background: "var(--section-light)",
              borderColor: "var(--card-border)",
              boxShadow: "0 1px 3px rgba(11,110,79,0.06)",
            }}
          >
            {/* Intro */}
            <motion.p
              variants={fadeUp}
              custom={0}
              className="text-base leading-relaxed mb-10"
              style={{ color: "var(--body-color)" }}
            >
              Your privacy matters to us. This policy explains what data we
              collect, why we collect it, and how we protect it. We have
              written it in plain language so it is easy to understand.
            </motion.p>

            {/* Table of contents */}
            <motion.nav
              variants={fadeUp}
              custom={1}
              className="mb-10 rounded-xl p-5"
              style={{ background: "var(--section-gray)" }}
              aria-label="Table of contents"
            >
              <p
                className="text-xs font-semibold uppercase tracking-widest mb-3"
                style={{ color: "var(--muted-color)" }}
              >
                Contents
              </p>
              <ol className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {sections.map((s) => (
                  <li key={s.id}>
                    <a
                      href={`#${s.id}`}
                      className="text-sm hover:underline"
                      style={{ color: "var(--brand)" }}
                    >
                      {s.title}
                    </a>
                  </li>
                ))}
              </ol>
            </motion.nav>

            {/* Sections */}
            <div className="space-y-10">
              {sections.map((section, i) => (
                <motion.div
                  key={section.id}
                  id={section.id}
                  variants={fadeUp}
                  custom={i + 2}
                  className="privacy-section scroll-mt-24"
                >
                  <h2
                    className="text-xl font-semibold tracking-tight mb-3"
                    style={{
                      fontFamily: "var(--font-display)",
                      color: "var(--heading-color)",
                    }}
                  >
                    {section.title}
                  </h2>
                  <div
                    className="text-[15px] leading-relaxed space-y-3"
                    style={{ color: "var(--body-color)" }}
                  >
                    {section.content}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
