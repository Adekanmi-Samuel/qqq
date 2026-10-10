import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Reset Password",
  description:
    "Choose a new SchoolPilot password from your secure reset link and get back into your school dashboard.",
  alternates: {
    canonical: "/reset-password/",
  },
  robots: { index: false, follow: true },
};

export default function ResetPasswordLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
