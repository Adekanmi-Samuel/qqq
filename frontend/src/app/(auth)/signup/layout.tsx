import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create Account",
  description:
    "Create your free SchoolPilot account as a school admin, teacher, or parent. Set up your school and start managing operations the same day.",
  alternates: {
    canonical: "/signup/",
  },
  robots: { index: false, follow: true },
};

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
