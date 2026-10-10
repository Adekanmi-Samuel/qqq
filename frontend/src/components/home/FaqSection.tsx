"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { ChevronDown } from "lucide-react";

type FaqItem = {
  question: string;
  answer: string;
};

const faqs: FaqItem[] = [
  {
    question: "Is SchoolPilot really free?",
    answer:
      "Yes. The Free plan is free forever and supports up to 50 students with attendance tracking, student management, and notice board. No credit card required. Upgrade to Starter (₦150 per student per term) or Growth (₦300 per student per term) for report cards, AI lesson notes, and more.",
  },
  {
    question: "How does SchoolPilot handle school fees?",
    answer:
      "SchoolPilot tracks who has paid and who hasn't   your school collects payments directly via bank transfer, POS, or cash. We integrate with Paystack for schools that want online payment collection. Your money stays in your hands.",
  },
  {
    question: "Does it work without internet?",
    answer:
      "SchoolPilot is built for Nigerian school networks. Teachers can keep working and data stays saved for the session. Full offline sync is planned, not claimed as already complete.",
  },
  {
    question: "What phones does it work on?",
    answer:
      "Any smartphone with a browser   Android, iPhone, even feature phones with basic internet. No app download required. Works well on 3G connections.",
  },
  {
    question: "How do parents access the portal?",
    answer:
      "With their phone number. No email or password needed. Parents receive an email or in-app invite, and they're in. They can see attendance, results, and school notices.",
  },
  {
    question: "Can I use SchoolPilot for a government school?",
    answer:
      "Yes. We support both private and government schools. The system handles all 36 Nigerian states and the FCT, with NERDC curriculum alignment and the Nigerian A1-F9 grading system.",
  },
  {
    question: "Is my school's data secure?",
    answer:
      "Absolutely. We use 256-bit SSL encryption, host on enterprise-grade cloud infrastructure, and perform automatic backups daily. Your data is NDPR compliant and never shared with third parties.",
  },
  {
    question: "How do I get started?",
    answer:
      "Simply click 'Start Free Trial', fill in your school details, and you're live in under 5 minutes. No IT team required, no training needed. Our support team is available via WhatsApp to help with setup.",
  },
];

function ChevronIcon({ isOpen }: { isOpen: boolean }) {
  return (
    <ChevronDown
      size={18}
      color="var(--muted-color)"
      style={{
        flexShrink: 0,
        transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
        transition: "transform 0.3s ease",
      }}
    />
  );
}

function FaqItemRow({
  item,
  isOpen,
  onToggle,
}: {
  item: FaqItem;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div style={{ borderBottom: "1px solid var(--card-border)" }}>
      <button
        onClick={onToggle}
        aria-expanded={isOpen}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
          padding: "20px 0",
          backgroundColor: "transparent",
          border: "none",
          cursor: "pointer",
          textAlign: "left",
          gap: 16,
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: 15,
            fontWeight: 500,
            color: "var(--heading-color)",
            lineHeight: 1.5,
          }}
        >
          {item.question}
        </span>
        <ChevronIcon isOpen={isOpen} />
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{
              height: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 },
            }}
            style={{ overflow: "hidden" }}
          >
            <p
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: 14,
                color: "var(--body-color)",
                lineHeight: 1.7,
                paddingBottom: 20,
                margin: 0,
              }}
            >
              {item.answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function FaqSection() {
  const [openIndices, setOpenIndices] = useState<number[]>([]);
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "200px" });

  const toggleItem = (index: number) => {
    setOpenIndices((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  return (
    <section
      ref={sectionRef}
      id="faq"
      className="dark-section-light"
      style={{
        padding: "clamp(56px, 8vw, 80px) 24px",
        position: "relative",
      }}
    >
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 1, y: 0 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          style={{ textAlign: "center", marginBottom: 48 }}
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
            FAQ
          </span>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(26px, 5vw, 40px)",
              fontWeight: 500,
              color: "var(--heading-color)",
              lineHeight: 1.2,
            }}
          >
            Frequently Asked Questions
          </h2>
        </motion.div>

        {/* FAQ list */}
        <div>
          {faqs.map((item, index) => (
            <FaqItemRow
              key={index}
              item={item}
              isOpen={openIndices.includes(index)}
              onToggle={() => toggleItem(index)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
