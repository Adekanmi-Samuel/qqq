import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "School Onboarding",
  description:
    "Set up your school on SchoolPilot: add classes, invite staff, import students, and go live with attendance, results, and fees in one flow.",
  alternates: {
    canonical: "/onboarding/",
  },
};

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
