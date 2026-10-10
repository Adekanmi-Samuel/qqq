import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Verify Email",
  description:
    "Verify your SchoolPilot email address to activate your account and start using attendance, results, and parent communication tools.",
  alternates: {
    canonical: "/verify-email/",
  },
  robots: { index: false, follow: true },
};

export default function VerifyEmailLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
