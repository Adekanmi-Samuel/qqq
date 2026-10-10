"use client";

import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Features", href: "/#features" },
  { label: "Pricing", href: "/#pricing" },
  { label: "About", href: "/about" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="border-b border-[var(--nav-border)] bg-[var(--nav-bg)] backdrop-blur-md sticky top-0 z-50 transition-colors">
      <div className="container-wide flex items-center justify-between h-16">
        <Link href="/" className="flex items-center gap-2" aria-label="SchoolPilot Home">
          <div className="w-8 h-8 bg-[var(--color-sh-green-800)] rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm" style={{ fontFamily: "var(--font-display)" }}>SP</span>
          </div>
          <span className="font-bold text-xl text-[var(--heading-color)]" style={{ fontFamily: "var(--font-sans)" }}>SchoolPilot</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6" aria-label="Main navigation">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm text-[var(--text-muted)] hover:text-[var(--sh-green-600)] transition-colors"
            >
              {item.label}
            </Link>
          ))}
          <Link href="/login" className="btn-ghost text-sm">
            Sign in
          </Link>
          <Link href="/signup" className="btn-primary text-sm">
            Register your school
          </Link>
        </nav>

        {/* Mobile menu button */}
        <button
          className="md:hidden p-2 rounded-lg hover:bg-[var(--surface-2)] transition-colors"
          onClick={() => setOpen(!open)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          aria-controls="mobile-nav"
        >
          <svg className="w-6 h-6 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            {open ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile nav */}
      <div
        id="mobile-nav"
        className={cn(
          "md:hidden border-t border-[var(--nav-border)] bg-[var(--surface)] transition-all duration-200 overflow-hidden",
          open ? "max-h-80" : "max-h-0"
        )}
        role="navigation"
        aria-label="Mobile navigation"
      >
        <div className="container-wide py-4 space-y-3">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block py-2 text-[var(--text-muted)] hover:text-[var(--sh-green-600)]"
              onClick={() => setOpen(false)}
            >
              {item.label}
            </Link>
          ))}
          <hr className="border-[var(--border)]" />
          <Link
            href="/login"
            className="block py-2 text-[var(--sh-green-600)] font-medium"
            onClick={() => setOpen(false)}
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className="block w-full btn-primary text-center"
            onClick={() => setOpen(false)}
          >
            Register your school
          </Link>
        </div>
      </div>
    </header>
  );
}
