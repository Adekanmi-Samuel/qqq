import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Staff Signup",
  description:
    "School staff can join SchoolPilot with an invite code. Create your teacher or bursar account and start managing classes, results, and fees.",
  alternates: {
    canonical: "/staff-signup/",
  },
};

export default function StaffSignupLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
