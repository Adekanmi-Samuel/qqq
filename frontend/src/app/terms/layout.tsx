import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "SchoolPilot terms of service for schools, staff, students, and parents using our school management platform in Nigeria.",
  alternates: {
    canonical: "/terms/",
  },
};

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
