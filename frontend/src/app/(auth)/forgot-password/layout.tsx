import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Forgot Password",
  description:
    "Reset your SchoolPilot password. Enter your email to receive a secure link and regain access to your school dashboard.",
  alternates: {
    canonical: "/forgot-password/",
  },
  robots: { index: false, follow: true },
};

export default function ForgotPasswordLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
