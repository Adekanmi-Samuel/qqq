"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { Star, Quote } from "lucide-react";

type Testimonial = {
  id?: string;
  quote: string;
  name: string;
  role: string;
  school: string;
  state?: string;
  rating?: number;
};

/**
 * Public testimonials.
 * Only shows APPROVED reviews from the API.
 * No fabricated names, schools, or ratings.
 */
export default function TestimonialsSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "200px" });
  const [items, setItems] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/reviews/public", { credentials: "include" });
        const data = await res.json();
        if (!cancelled && data?.success) {
          const list = Array.isArray(data.data) ? data.data : [];
          setItems(
            list.map((r: any) => ({
              id: r.id,
              quote: r.quote,
              name: r.authorName,
              role: r.authorRole,
              school: r.schoolName,
              state: r.state,
              rating: r.rating,
            }))
          );
        }
      } catch {
        // Marketing page stays usable with empty state.
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section
      id="testimonials"
      ref={sectionRef}
      style={{
        padding: "clamp(56px, 8vw, 80px) 24px",
        position: "relative",
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
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
            Reviews
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
            What school leaders say about SchoolPilot
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
            Real reviews from schools that use the product. We only publish feedback
            after a school has had time to run real work on the platform.
          </p>
        </motion.div>

        {loading ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 320px), 1fr))",
              gap: 16,
            }}
          >
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="sh-card"
                style={{
                  padding: 28,
                  height: 180,
                  background: "var(--card-bg)",
                  border: "1px solid var(--card-border)",
                  borderRadius: 16,
                }}
              >
                <div
                  style={{
                    height: 12,
                    width: "40%",
                    borderRadius: 6,
                    background: "var(--card-border)",
                    marginBottom: 16,
                  }}
                />
                <div
                  style={{
                    height: 10,
                    width: "100%",
                    borderRadius: 6,
                    background: "var(--card-border)",
                    marginBottom: 8,
                  }}
                />
                <div
                  style={{
                    height: 10,
                    width: "80%",
                    borderRadius: 6,
                    background: "var(--card-border)",
                  }}
                />
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "clamp(32px, 5vw, 48px)",
              border: "1px solid var(--card-border)",
              borderRadius: 16,
              background: "var(--card-bg)",
              maxWidth: 640,
              margin: "0 auto",
            }}
          >
            <Quote
              size={28}
              color="var(--brand)"
              style={{ margin: "0 auto 12px", display: "block" }}
            />
            <p
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: 15,
                color: "var(--body-color)",
                lineHeight: 1.6,
                marginBottom: 8,
              }}
            >
              Reviews from live schools will appear here.
            </p>
            <p
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: 13,
                color: "var(--muted-color)",
                lineHeight: 1.6,
              }}
            >
              We do not invent testimonials. When a school has used SchoolPilot for a
              while and leaves feedback, it shows on this page.
            </p>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 340px), 1fr))",
              gap: 16,
            }}
          >
            {items.map((t, i) => (
              <motion.div
                key={t.id || t.name}
                initial={{ opacity: 1, y: 0 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
              >
                <div
                  className="sh-card"
                  style={{
                    padding: "clamp(20px, 3vw, 28px)",
                    display: "flex",
                    flexDirection: "column",
                    gap: 14,
                    height: "100%",
                  }}
                >
                  <div style={{ display: "flex", gap: 2 }}>
                    {Array.from({ length: 5 }).map((_, si) => (
                      <Star
                        key={si}
                        size={15}
                        color={si < (t.rating || 5) ? "#f59e0b" : "var(--card-border)"}
                        fill={si < (t.rating || 5) ? "#f59e0b" : "transparent"}
                      />
                    ))}
                  </div>
                  <p
                    style={{
                      fontFamily: "var(--font-sans)",
                      fontSize: 14,
                      lineHeight: 1.7,
                      color: "var(--body-color)",
                      flex: 1,
                    }}
                  >
                    &ldquo;{t.quote}&rdquo;
                  </p>
                  <div
                    style={{
                      borderTop: "1px solid var(--card-border)",
                      paddingTop: 14,
                    }}
                  >
                    <p
                      style={{
                        fontFamily: "var(--font-sans)",
                        fontSize: 14,
                        fontWeight: 600,
                        color: "var(--heading-color)",
                      }}
                    >
                      {t.name}
                    </p>
                    <p
                      style={{
                        fontFamily: "var(--font-sans)",
                        fontSize: 12,
                        color: "var(--muted-color)",
                      }}
                    >
                      {t.role}
                      {t.school ? `, ${t.school}` : ""}
                      {t.state ? ` · ${t.state}` : ""}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        <motion.div
          initial={{ opacity: 1, y: 0 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          style={{
            marginTop: 48,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: 16,
            background: "var(--card-bg)",
            border: "1px solid var(--card-border)",
            borderRadius: 16,
            padding: "clamp(20px, 3vw, 32px)",
          }}
        >
          {[
            { value: "Nigeria", label: "Built for Nigerian schools" },
            { value: "A1 to F9", label: "Nigerian grading ready" },
            { value: "Mobile", label: "Admin, teacher, parent" },
            { value: "Real reviews", label: "Only after live use" },
          ].map((stat) => (
            <div key={stat.label} style={{ textAlign: "center" }}>
              <span
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "clamp(20px, 2.5vw, 28px)",
                  fontWeight: 600,
                  color: "var(--heading-color)",
                  display: "block",
                  lineHeight: 1.1,
                  marginBottom: 4,
                }}
              >
                {stat.value}
              </span>
              <span
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: 13,
                  color: "var(--muted-color)",
                }}
              >
                {stat.label}
              </span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
