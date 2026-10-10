"use client";

import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import { Menu, X, Sun, Moon } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import WheelIcon from "@/components/WheelIcon";

// Absolute routes for pages, in-page hashes only for home sections.
const navLinks = [
  { label: "Features", href: "/#features" },
  { label: "Pricing", href: "/#pricing" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { theme, toggle } = useTheme();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  const handleNavClick = useCallback(() => {
    setMobileOpen(false);
  }, []);

  return (
    <>
      <header
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          height: 64,
          background: scrolled
            ? "var(--nav-bg)"
            : "transparent",
          backdropFilter: scrolled ? "blur(12px)" : "none",
          WebkitBackdropFilter: scrolled ? "blur(12px)" : "none",
          borderBottom: scrolled ? "1px solid var(--card-border)" : "1px solid transparent",
          transition: "background 200ms ease, border-color 200ms ease, backdrop-filter 200ms ease",
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            padding: "0 clamp(16px, 4vw, 24px)",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {/* Logo */}
          <Link
            href="/"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              textDecoration: "none",
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

          {/* Desktop nav */}
          <nav
            style={{ gap: 2 }}
            className="hidden md:flex items-center"
          >
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={handleNavClick}
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: 14,
                  fontWeight: 400,
                  color: "var(--body-color)",
                  padding: "8px 14px",
                  borderRadius: 8,
                  textDecoration: "none",
                  transition: "color 150ms ease, background 150ms ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "var(--brand)";
                  e.currentTarget.style.background = "transparent";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "var(--body-color)";
                  e.currentTarget.style.background = "transparent";
                }}
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Desktop CTAs */}
          <div
            style={{ gap: 8 }}
            className="hidden md:flex items-center"
          >
            <button
              onClick={toggle}
              aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: 40,
                height: 40,
                borderRadius: 10,
                border: "1px solid var(--card-border)",
                background: "transparent",
                cursor: "pointer",
                color: "var(--body-color)",
                transition: "color 150ms ease, background 150ms ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = "var(--brand)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = "var(--body-color)";
              }}
            >
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <Link
              href="/login"
              className="btn-ghost"
              style={{
                fontSize: 14,
                fontWeight: 500,
                color: "var(--body-color)",
                padding: "8px 16px",
                borderRadius: 10,
                minHeight: 44,
                textDecoration: "none",
              }}
            >
              Login
            </Link>
            <Link
              href="/signup"
              className="btn btn-primary"
              style={{
                fontSize: 14,
                fontWeight: 600,
                padding: "8px 20px",
                borderRadius: 10,
                minHeight: 40,
                textDecoration: "none",
              }}
            >
              Get Started
            </Link>
          </div>

          {/* Mobile controls (hamburger) */}
          <div style={{ gap: 4 }} className="md:hidden flex items-center">
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileOpen}
              aria-controls="home-mobile-nav"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 44,
                height: 44,
                border: "none",
                background: "transparent",
                cursor: "pointer",
                color: "var(--heading-color)",
                borderRadius: 8,
              }}
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div
          className="md:hidden"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 49,
            top: 64,
            background: "var(--nav-bg)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            overflow: "auto",
          }}
        >
          <nav
            id="home-mobile-nav"
            style={{
              display: "flex",
              flexDirection: "column",
              padding: "16px 24px",
              gap: 4,
            }}
          >
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={handleNavClick}
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: 16,
                  color: "var(--heading-color)",
                  fontWeight: 400,
                  padding: "14px 12px",
                  borderRadius: 10,
                  textDecoration: "none",
                  transition: "background 150ms ease",
                }}
              >
                {link.label}
              </a>
            ))}
            <button
              onClick={toggle}
              aria-label="Toggle dark mode"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                fontFamily: "var(--font-sans)",
                fontSize: 16,
                color: "var(--heading-color)",
                padding: "14px 12px",
                borderRadius: 10,
                textDecoration: "none",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                width: "100%",
                textAlign: "left",
              }}
            >
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
              {theme === "dark" ? "Light Mode" : "Dark Mode"}
            </button>
            <div style={{ height: 1, background: "var(--card-border)", margin: "8px 12px" }} />
            <Link
              href="/login"
              onClick={() => setMobileOpen(false)}
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: 16,
                fontWeight: 500,
                color: "var(--brand)",
                padding: "14px 12px",
                borderRadius: 10,
                textDecoration: "none",
                display: "block",
              }}
            >
              Login
            </Link>
            <Link
              href="/signup"
              onClick={() => setMobileOpen(false)}
              className="btn btn-primary"
              style={{
                fontSize: 15,
                fontWeight: 600,
                borderRadius: 12,
                padding: "14px 24px",
                minHeight: 48,
                textDecoration: "none",
                marginTop: 8,
                justifyContent: "center",
              }}
            >
              Get Started Free
            </Link>
          </nav>
        </div>
      )}
    </>
  );
}
