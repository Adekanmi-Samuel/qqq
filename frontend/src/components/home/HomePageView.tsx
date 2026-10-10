"use client";

import Footer from "@/components/layout/Footer";
import { Navbar } from "@/components/home/Navbar";
import HeroSection from "@/components/home/HeroSection";
import MarqueeStrip from "@/components/home/MarqueeStrip";
import FeaturesGrid from "@/components/home/FeaturesGrid";
import HowItWorksSection from "@/components/home/HowItWorksSection";
import AudienceSection from "@/components/home/AudienceSection";
import PricingSection from "@/components/home/PricingSection";
import TestimonialsSection from "@/components/home/TestimonialsSection";
import TrustSection from "@/components/home/TrustSection";
import FaqSection from "@/components/home/FaqSection";
import FinalCTA from "@/components/home/FinalCTA";

// Depth stays to hairline borders and palette. Removed CursorGlow,
// NoiseOverlay, FloatingParticles, and SmoothScroll (anti-vibecode tells).
export default function HomePageView() {
  return (
    <div id="main-content" className="min-h-screen flex flex-col relative">
      <Navbar />
      <main className="flex-1">
        <HeroSection />
        <MarqueeStrip />
        <FeaturesGrid />
        <HowItWorksSection />
        <AudienceSection />
        <TestimonialsSection />
        <TrustSection />
        <PricingSection />
        <FaqSection />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}
