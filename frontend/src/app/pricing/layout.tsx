import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Simple SchoolPilot pricing for Nigerian schools. Start free, then scale with Starter, Growth, or Enterprise plans for students, staff, and parents.",
  alternates: {
    canonical: "/pricing/",
  },
};

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
