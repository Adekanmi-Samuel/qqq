import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Student Signup",
  description:
    "Join your school on SchoolPilot with an invite code. Create your student account, access results, notices, and study tools.",
  alternates: {
    canonical: "/student-signup/",
  },
};

export default function StudentSignupLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
