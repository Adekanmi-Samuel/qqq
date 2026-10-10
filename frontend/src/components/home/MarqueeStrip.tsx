"use client";

const items = [
  "Student Management",
  "Attendance Tracking",
  "A1-F9 Grading",
  "AI Lesson Notes",
  "Parent Portal",
  "Fee Management",
  "Report Cards",
  "Email & In-App Alerts",
  "36 States Supported",
  "Offline-First",
  "Paystack Integration",
  "CBT Exams",
];

export default function MarqueeStrip() {
  const doubled = [...items, ...items];

  return (
    <div
      className="marquee-strip"
      style={{
        background: "var(--card-bg)",
        borderTop: "1px solid var(--card-border)",
        borderBottom: "1px solid var(--card-border)",
        padding: "12px 0",
        overflow: "hidden",
      }}
    >
      <div className="marquee-wrapper">
        <div className="marquee-track">
          {doubled.map((item, i) => (
            <span
              key={i}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                whiteSpace: "nowrap",
                fontFamily: "var(--font-sans)",
                fontSize: 13,
                fontWeight: 500,
                color: "var(--body-color)",
                paddingRight: 32,
              }}
            >
              <span
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: "50%",
                  background: "var(--card-border)",
                  flexShrink: 0,
                }}
                aria-hidden="true"
              />
              {item}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
