"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import WheelIcon from "@/components/WheelIcon";

/* ------------------------------------------------------------------ */
/*  Floating dots configuration                                        */
/* ------------------------------------------------------------------ */
const FLOATING_DOTS = [
  { top: "8%",  left: "12%", size: 6,  dur: 5.0, delay: 0.0 },
  { top: "15%", left: "65%", size: 4,  dur: 6.2, delay: 0.8 },
  { top: "22%", left: "38%", size: 8,  dur: 4.5, delay: 1.4 },
  { top: "32%", left: "80%", size: 5,  dur: 7.0, delay: 0.3 },
  { top: "42%", left: "20%", size: 3,  dur: 5.8, delay: 2.0 },
  { top: "50%", left: "55%", size: 7,  dur: 4.2, delay: 0.6 },
  { top: "58%", left: "10%", size: 5,  dur: 6.5, delay: 1.2 },
  { top: "65%", left: "72%", size: 4,  dur: 5.4, delay: 2.5 },
  { top: "72%", left: "42%", size: 6,  dur: 4.8, delay: 0.9 },
  { top: "80%", left: "85%", size: 3,  dur: 7.2, delay: 1.8 },
  { top: "88%", left: "28%", size: 5,  dur: 5.6, delay: 3.0 },
  { top: "12%", left: "90%", size: 4,  dur: 6.0, delay: 0.5 },
];

const FEATURES = [
  "Track attendance & results",
  "Manage fees & payments",
  "Communicate with parents",
];

/* ------------------------------------------------------------------ */
/*  Layout                                                             */
/* ------------------------------------------------------------------ */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-[100dvh] h-screen md:h-auto md:min-h-screen flex flex-row items-stretch">
      {/* ============================================================ */}
      {/*  LEFT PANEL -- dark green brand panel (hidden on mobile)      */}
      {/* ============================================================ */}
      <motion.div
        className="hidden md:flex bg-[#0b4a35]"
        style={{
          position: "relative",
          flex: "0 0 45%",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "48px 40px",
          overflow: "hidden",
        }}
        initial={{ opacity: 0, x: -60 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
      >
        {/* Static hairline pattern instead of infinite floating dots */}
        <div
          className="absolute inset-0 pointer-events-none opacity-20"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />

        {/* Logo watermark */}
        <motion.div
          className="absolute pointer-events-none select-none"
          style={{
            bottom: -50,
            right: -20,
            opacity: 0.04,
          }}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.04, scale: 1 }}
          transition={{ delay: 0.4, duration: 1.0 }}
        >
          <svg width="300" height="300" viewBox="0 0 84 84" fill="none">
            <circle cx="42" cy="42" r="36" stroke="white" strokeWidth="2" />
            <circle cx="42" cy="42" r="11" stroke="white" strokeWidth="1.5" />
            <circle cx="42" cy="42" r="7" fill="#C8892A" />
            <circle cx="42" cy="42" r="2.5" fill="white" />
          </svg>
        </motion.div>

        {/* Logo */}
        <motion.header
          className="relative z-10"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5 }}
        >
          <Link href="/" className="inline-flex items-center gap-2.5 no-underline">
            <WheelIcon size={38} variant="light" />
            <span
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: 17,
                fontWeight: 600,
                color: "#ffffff",
                letterSpacing: "-0.01em",
              }}
            >
              SchoolPilot
            </span>
          </Link>
        </motion.header>

        {/* Middle content */}
        <motion.div
          className="relative z-10 max-w-[440px]"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.7 }}
        >
          {/* Amber accent bar */}
          <div
            style={{
              width: 40,
              height: 3,
              background: "linear-gradient(90deg, #f59e0b, #fbbf24)",
              borderRadius: 2,
              marginBottom: 24,
            }}
          />

          <p
            role="presentation"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 40,
              fontWeight: 400,
              color: "#ffffff",
              lineHeight: 1.2,
              letterSpacing: "-0.02em",
              marginBottom: 12,
            }}
          >
            The all-in-one school management platform
          </p>
          <p
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: 15,
              color: "rgba(255,255,255,0.6)",
              lineHeight: 1.6,
              marginBottom: 32,
            }}
          >
            Built for Nigerian schools to manage students, attendance, results, and fees.
          </p>

          {/* Feature bullets */}
          <div className="flex flex-col gap-3.5">
            {FEATURES.map((feat, i) => (
              <motion.div
                key={feat}
                className="flex items-center gap-2.5"
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.12, duration: 0.5 }}
              >
                <div
                  className="w-[22px] h-[22px] rounded-full flex items-center justify-center shrink-0"
                  style={{ background: "rgba(18,146,106,0.25)" }}
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path
                      d="M2.5 6L5 8.5L9.5 3.5"
                      stroke="#12926a"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <span
                  style={{
                    fontFamily: "var(--font-sans)",
                    fontSize: 14,
                    color: "rgba(255,255,255,0.8)",
                  }}
                >
                  {feat}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Bottom branding line */}
        <motion.footer
          className="relative z-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9, duration: 0.6 }}
        >
          <p
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: 12,
              color: "rgba(255,255,255,0.3)",
            }}
          >
            Where Nigerian schools grow
          </p>
        </motion.footer>
      </motion.div>

      {/* ============================================================ */}
      {/*  RIGHT PANEL -- form area                                     */}
      {/* ============================================================ */}
      <motion.main
        id="main-content"
        className="flex-1 min-h-0 flex flex-col items-center justify-start md:justify-center relative overflow-y-auto min-w-0 px-4 py-6 md:px-6 md:py-10"
        style={{
          background: "var(--section-gray)",
        }}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut", delay: 0.15 }}
      >
        {/* Mobile logo (visible < md) */}
        <motion.nav
          className="md:hidden"
          aria-label="Mobile navigation"
          style={{ marginBottom: 32 }}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          <Link href="/" className="inline-flex items-center gap-2 no-underline">
            <WheelIcon size={34} variant="dark" />
            <span
              style={{
                fontFamily: "var(--font-sans)",
                fontWeight: 600,
                fontSize: 16,
                color: "var(--heading-color)",
              }}
            >
              SchoolPilot
            </span>
          </Link>
        </motion.nav>

        {children}
      </motion.main>
    </div>
  );
}
