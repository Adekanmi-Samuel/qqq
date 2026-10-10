import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Contact SchoolPilot for demos, pricing questions, and support. Reach our Nigerian school success team by form, email, or WhatsApp.",
  alternates: {
    canonical: "/contact/",
  },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
