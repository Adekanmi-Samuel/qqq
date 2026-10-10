import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How SchoolPilot collects, uses, and protects personal data for Nigerian schools, staff, students, and parents under NDPA 2023 and NDPR.",
  alternates: {
    canonical: "/privacy/",
  },
};

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
