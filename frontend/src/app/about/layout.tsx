import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
  description:
    "Learn why SchoolPilot exists: to help Nigerian schools run students, attendance, results, fees, and parent communication from one calm dashboard.",
  alternates: {
    canonical: "/about/",
  },
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
