"use client";

import { useEffect } from "react";
import Lenis from "lenis";

/**
 * Lenis smooth scroll provider.
 * Initializes smooth scrolling and keeps it running.
 * Respects prefers-reduced-motion.
 * Handles hash link navigation so anchor links work with Lenis.
 */
export default function SmoothScroll({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Check for reduced motion preference
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return;

    const lenis = new Lenis({
      duration: 1.2,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      touchMultiplier: 2,
      infinite: false,
    });

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    // Handle hash link clicks so anchor navigation works with Lenis.
    // Lenis overrides native scroll, so plain <a href="#foo"> and
    // Next.js <Link href="#foo"> would silently fail without this.
    const handleAnchorClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest<HTMLAnchorElement>("a[href]");
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!href || !href.startsWith("#")) return;

      const id = href.slice(1);
      if (!id) return;

      const el = document.getElementById(id);
      if (!el) return;

      e.preventDefault();
      lenis.scrollTo(el, { offset: -80 });
      // Update URL hash without triggering a scroll
      history.pushState(null, "", href);
    };

    document.addEventListener("click", handleAnchorClick);

    // Scroll to hash target on initial page load
    if (window.location.hash) {
      const id = window.location.hash.slice(1);
      const el = document.getElementById(id);
      if (el) {
        // Delay to let Lenis and the DOM settle after mount
        setTimeout(() => {
          lenis.scrollTo(el, { offset: -80 });
        }, 100);
      }
    }

    return () => {
      document.removeEventListener("click", handleAnchorClick);
      lenis.destroy();
    };
  }, []);

  return <>{children}</>;
}
