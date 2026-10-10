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
    id: "acceptance",
    title: "1. Acceptance of Terms",
    content: (
      <>
        <p>
          By accessing or using SchoolPilot, you agree to be bound by these
          Terms of Service. If you do not agree to these terms, please do
          not use our services. These terms apply to all users of the
          platform, including school administrators, teachers, bursars,
          students, and parents.
        </p>
      </>
    ),
  },
  {
    id: "what-provides",
    title: "2. What SchoolPilot Provides",
    content: (
      <>
        <p>
          SchoolPilot is a software-as-a-service (SaaS) platform designed to
          provide school management tools, including:
        </p>
        <ul>
          <li>Student records and profile management</li>
          <li>Attendance tracking and reporting</li>
          <li>Grading, results, and report card generation</li>
          <li>Fee tracking and payment status management</li>
          <li>School-to-parent email and in-app notifications</li>
          <li>Staff records and timesheet management</li>
          <li>CBT (Computer-Based Test) examination tools</li>
        </ul>
        <p className="mt-3">
          <strong>SchoolPilot is NOT a financial institution, payment processor,
          or bank.</strong> We provide fee tracking and status tools, but
          schools are fully responsible for collecting, managing, and
          safeguarding their own funds. We do not hold, receive, or
          process school fees on behalf of any school.
        </p>
      </>
    ),
  },
  {
    id: "school-responsibilities",
    title: "3. School Responsibilities",
    content: (
      <>
        <p>
          As a school administrator registering on SchoolPilot, you agree to:
        </p>
        <ul>
          <li>
            Provide accurate, verifiable information during registration,
            including valid CAC (Corporate Affairs Commission) registration
            details where applicable.
          </li>
          <li>
            Maintain the confidentiality of your account credentials and
            ensure that only authorised personnel have access to the platform.
          </li>
          <li>
            Ensure that any data you enter regarding students and parents
            complies with Nigerian data protection laws and that you have
            obtained the necessary consent from parents or guardians.
          </li>
          <li>
            Manage your own fee collections, payment processing, and
            financial records externally. SchoolPilot tracks fees but does
            not process payments.
          </li>
          <li>
            Take responsibility for the accuracy of academic records,
            attendance data, and report cards generated through the platform.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "prohibited-use",
    title: "4. Prohibited Use",
    content: (
      <>
        <p>You may not:</p>
        <ul>
          <li>
            Register a false, non-existent, or unauthorised school on the
            platform.
          </li>
          <li>
            Attempt to access, scrape, hack, or reverse-engineer any part
            of the platform.
          </li>
          <li>
            Use the service for any illegal, fraudulent, or unauthorised
            purpose.
          </li>
          <li>
            Upload malware, viruses, or any harmful code to the platform.
          </li>
          <li>
            Impersonate another person, school, or organisation.
          </li>
          <li>
            Attempt to access other users' accounts or data without
            authorisation.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "accounts",
    title: "5. Account Registration and Termination",
    content: (
      <>
        <p>
          <strong>Registration:</strong> To use SchoolPilot, a school must
          complete the registration process with accurate information. Each
          school account is managed by one or more authorised administrators.
        </p>
        <p>
          <strong>Your termination right:</strong> You may terminate your
          school&apos;s account at any time by contacting our support team.
          Upon termination, your data will be permanently deleted within 90
          days, in accordance with our data retention policy.
        </p>
        <p>
          <strong>Our termination right:</strong> SchoolPilot reserves the
          right to suspend or terminate accounts that:
        </p>
        <ul>
          <li>Violate these Terms of Service.</li>
          <li>Provide fraudulent or misleading information during registration.</li>
          <li>Engage in malicious activity that threatens platform security.</li>
          <li>Remain inactive for an extended period with no prior arrangement.</li>
        </ul>
        <p>
          In the event of termination by SchoolPilot, we will provide notice
          and a reasonable opportunity to export your data.
        </p>
      </>
    ),
  },
  {
    id: "fees-payment",
    title: "6. Fees and Payment",
    content: (
      <>
        <p>
          SchoolPilot may offer free and paid subscription plans. If you
          subscribe to a paid plan:
        </p>
        <ul>
          <li>
            Fees are billed in Nigerian Naira (NGN) and are non-refundable
            except as required by law.
          </li>
          <li>
            Subscription fees are subject to change with 30 days' advance
            notice.
          </li>
          <li>
            Failure to pay subscription fees may result in suspension of
            access to premium features.
          </li>
        </ul>
        <p>
          SchoolPilot does not process school fees (tuition, levies, etc.)
          on behalf of schools. All fee collection is handled independently
          by each school.
        </p>
      </>
    ),
  },
  {
    id: "liability",
    title: "7. Limitation of Liability",
    content: (
      <>
        <p>
          SchoolPilot is provided "as is" and "as available" without
          warranties of any kind, whether express or implied, including
          but not limited to implied warranties of merchantability,
          fitness for a particular purpose, and non-infringement.
        </p>
        <p>
          To the maximum extent permitted by Nigerian law, SchoolPilot shall
          not be liable for any indirect, incidental, special,
          consequential, or punitive damages resulting from:
        </p>
        <ul>
          <li>Your use of or inability to use the service.</li>
          <li>Any errors or omissions in the platform.</li>
          <li>Unauthorised access to your account or data.</li>
          <li>Interruptions or downtime of the service.</li>
        </ul>
        <p>
          Our total liability for any claims arising from your use of the
          platform shall not exceed the amount you paid to SchoolPilot in
          the twelve (12) months preceding the claim.
        </p>
      </>
    ),
  },
  {
    id: "intellectual-property",
    title: "8. Intellectual Property",
    content: (
      <>
        <p>
          All content, design, code, and materials on SchoolPilot are owned
          by or licensed to SchoolPilot. You may not copy, modify,
          distribute, or reverse-engineer any part of the platform without
          prior written consent.
        </p>
        <p>
          Schools retain full ownership of the data they enter into the
          platform. By using SchoolPilot, you grant us a limited licence to
          process your data solely for the purpose of providing the service.
        </p>
      </>
    ),
  },
  {
    id: "governing-law",
    title: "9. Governing Law",
    content: (
      <>
        <p>
          These Terms of Service shall be governed by and construed in
          accordance with the laws of the <strong>Federal Republic of
          Nigeria</strong>.
        </p>
        <p>
          Any disputes arising from these terms shall be subject to the
          exclusive jurisdiction of the courts of Nigeria, with venue in
          Lagos State unless otherwise agreed in writing.
        </p>
      </>
    ),
  },
  {
    id: "changes",
    title: "10. Changes to These Terms",
    content: (
      <>
        <p>
          We may update these Terms of Service from time to time. When we
          make material changes, we will notify registered schools via
          email or in-platform notification at least 30 days before the
          changes take effect. Continued use of the platform after changes
          take effect constitutes acceptance of the updated terms.
        </p>
      </>
    ),
  },
  {
    id: "contact",
    title: "11. Contact",
    content: (
      <>
        <p>
          If you have questions about these Terms, please reach out:
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
              href={supportWhatsAppUrl("Hi, I have a terms inquiry")}
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

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      <Navbar />

      <style>{`
        @media print {
          header, footer, nav, .no-print { display: none !important; }
          body { background: white !important; }
          .terms-content { box-shadow: none !important; border: none !important; padding: 0 !important; }
          .terms-section { break-inside: avoid; }
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
            Terms of Service
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
            className="terms-content rounded-2xl border p-8 md:p-12 lg:p-14"
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
              These terms govern your use of SchoolPilot. We have kept them
              clear and straightforward. If anything is unclear, please
              reach out and we will explain.
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
                  className="terms-section scroll-mt-24"
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
