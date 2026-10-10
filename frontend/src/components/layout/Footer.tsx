"use client";

import Link from "next/link";
import WheelIcon from "@/components/WheelIcon";
import { SUPPORT_EMAIL, supportWhatsAppUrl } from "@/lib/constants";

export default function Footer() {
  // Newsletter band removed: there is no subscribe API. Copy that promised
  // inbox confirmation without a backend was misleading.
  return (
    <footer
      style={{
        background: "var(--card-bg)",
        borderTop: "1px solid var(--card-border)",
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "clamp(40px, 6vw, 64px) clamp(16px, 4vw, 24px) clamp(24px, 4vw, 40px)",
        }}
      >
        {/* Footer columns */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: "clamp(24px, 4vw, 48px)",
            marginBottom: 40,
          }}
        >
          {/* Brand */}
          <div>
            <Link
              href="/"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                textDecoration: "none",
                marginBottom: 16,
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: "linear-gradient(135deg, #0b6e4f 0%, #12926a 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <WheelIcon size={20} variant="light" />
              </div>
              <span
                style={{
                  fontFamily: "var(--font-sans)",
                  fontWeight: 700,
                  fontSize: 17,
                  color: "var(--heading-color)",
                  letterSpacing: "-0.02em",
                }}
              >
                SchoolPilot
              </span>
            </Link>
            <p
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: 14,
                color: "var(--body-color)",
                lineHeight: 1.6,
                marginBottom: 16,
                maxWidth: 240,
              }}
            >
              The modern operating system for Nigerian schools. Built with performance, security, and elegance.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: 14,
                fontWeight: 600,
                color: "var(--heading-color)",
                marginBottom: 16,
              }}
            >
              Product
            </h4>
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {[
                { label: "Features", href: "/#features" },
                { label: "Pricing", href: "/pricing" },
                { label: "How It Works", href: "/#how-it-works" },
                { label: "Testimonials", href: "/#testimonials" },
                { label: "About Us", href: "/about" },
              ].map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    style={{
                      fontFamily: "var(--font-sans)",
                      fontSize: 14,
                      color: "var(--body-color)",
                      textDecoration: "none",
                      transition: "color 0.15s ease",
                      display: "block",
                      padding: "12px 0",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = "var(--body-color)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = "var(--body-color)"; }}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: 14,
                fontWeight: 600,
                color: "var(--heading-color)",
                marginBottom: 16,
              }}
            >
              Resources
            </h4>
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {[
                { label: "Contact Support", href: "/contact" },
                {
                  label: "WhatsApp Help",
                  href: supportWhatsAppUrl(),
                  external: true,
                },
                { label: "FAQ", href: "/#faq" },
                { label: "Email Us", href: `mailto:${SUPPORT_EMAIL}` },
              ].map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    target={(link as { external?: boolean }).external ? "_blank" : undefined}
                    rel={(link as { external?: boolean }).external ? "noopener noreferrer" : undefined}
                    style={{
                      fontFamily: "var(--font-sans)",
                      fontSize: 14,
                      color: "var(--body-color)",
                      textDecoration: "none",
                      transition: "color 0.15s ease",
                      display: "block",
                      padding: "12px 0",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = "var(--body-color)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = "var(--body-color)"; }}
                  >
                    {link.label}
                    {(link as { external?: boolean }).external ? (
                      <span aria-hidden="true" style={{ marginLeft: 6, fontSize: 11, opacity: 0.7 }}>↗</span>
                    ) : null}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: 14,
                fontWeight: 600,
                color: "var(--heading-color)",
                marginBottom: 16,
              }}
            >
              Legal
            </h4>
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {[
                { label: "Privacy Policy", href: "/privacy" },
                { label: "Terms of Service", href: "/terms" },
              ].map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    style={{
                      fontFamily: "var(--font-sans)",
                      fontSize: 14,
                      color: "var(--body-color)",
                      textDecoration: "none",
                      transition: "color 0.15s ease",
                      display: "block",
                      padding: "12px 0",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = "var(--body-color)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = "var(--body-color)"; }}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
            <div style={{ marginTop: 16 }}>
              <p
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: 12,
                  color: "var(--muted-color)",
                  lineHeight: 1.6,
                }}
              >
                Lagos, Nigeria
                <br />
                {SUPPORT_EMAIL}
              </p>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            borderTop: "1px solid var(--card-border)",
            paddingTop: 24,
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: 13,
              color: "var(--muted-color)",
            }}
          >
            &copy; {new Date().getFullYear()} SchoolPilot. All rights reserved.
          </span>
          <span
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: 12,
              color: "var(--muted-color)",
              opacity: 0.6,
            }}
          >
            Made in Nigeria &#127475;&#127468;
          </span>
        </div>
      </div>
    </footer>
  );
}
