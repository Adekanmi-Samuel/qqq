import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login",
  description:
    "Sign in to SchoolPilot to manage attendance, results, fees, notices, and parent communication for your school.",
  alternates: {
    canonical: "/login/",
  },
  robots: { index: false, follow: true },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
