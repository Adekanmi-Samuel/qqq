import type { Metadata } from "next";
import HomePageView from "@/components/home/HomePageView";

const baseUrl =
  process.env.NEXT_PUBLIC_SITE_URL || "https://schoolpilot-work.vercel.app";

export const metadata: Metadata = {
  title: "SchoolPilot | Navigate Your School to Success",
  description:
    "SchoolPilot is Nigeria's smartest AI-powered school management platform. Manage students, track attendance, publish results, collect fees, run CBT exams, and communicate with parents, all from one dashboard.",
  keywords: [
    "school management",
    "Nigeria",
    "education",
    "school pilot",
    "Nigerian schools",
    "attendance tracking",
    "school fees",
    "result management",
    "AI school management",
    "CBT exams",
    "school software Nigeria",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_NG",
    url: baseUrl,
    siteName: "SchoolPilot",
    title: "SchoolPilot | Navigate Your School to Success",
    description:
      "SchoolPilot helps Nigerian schools manage students, track attendance, publish results, collect fees, and communicate with parents.",
    images: [
      {
        url: `${baseUrl}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "SchoolPilot | Navigate Your School to Success",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "SchoolPilot | Navigate Your School to Success",
    description:
      "SchoolPilot helps Nigerian schools manage students, track attendance, publish results, collect fees, and communicate with parents.",
  },
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "SchoolPilot",
  url: `${baseUrl}/`,
  logo: `${baseUrl}/logo.svg`,
  image: `${baseUrl}/og-image.png`,
  description:
    "SchoolPilot is an AI-powered school management platform for Nigerian schools, covering students, attendance, results, fees, CBT exams, and parent communication.",
  areaServed: {
    "@type": "Country",
    name: "Nigeria",
  },
  contactPoint: [
    {
      "@type": "ContactPoint",
      contactType: "customer support",
      areaServed: "NG",
      availableLanguage: ["English"],
      url: `${baseUrl}/contact/`,
    },
  ],
};

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(organizationJsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <HomePageView />
    </>
  );
}
