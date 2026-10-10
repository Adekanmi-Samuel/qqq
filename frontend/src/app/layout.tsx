import type { Metadata, Viewport } from "next";
import "./globals.css";
import "@fontsource/fraunces/400.css";
import "@fontsource/fraunces/500.css";
import "@fontsource/fraunces/600.css";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter-tight/400.css";
import "@fontsource/inter-tight/500.css";
import "@fontsource/inter-tight/600.css";
import { CookieAuthProvider } from "@/lib/auth/CookieAuthProvider";
import { QueryProvider } from "@/lib/providers";
import { ToastProvider } from "@/components/ToastProvider";
import ThemeProvider from "@/components/ThemeProvider";
import { CookieConsentBanner } from "@/components/auth/CookieConsentBanner";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://schoolpilot-work.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "SchoolPilot | Navigate Your School to Success",
    template: "%s | SchoolPilot",
  },
  description:
    "SchoolPilot is Nigeria's smartest AI-powered school management platform. Manage students, track attendance, publish results, collect fees, run CBT exams, and communicate with parents, all from one dashboard.",
  keywords: [
    "school management", "Nigeria", "education", "school pilot",
    "Nigerian schools", "attendance tracking", "school fees", "result management",
    "AI school management", "CBT exams", "school software Nigeria",
  ],
  authors: [{ name: "SchoolPilot" }],
  creator: "SchoolPilot",
  openGraph: {
    type: "website", locale: "en_NG", url: baseUrl,
    siteName: "SchoolPilot",
    title: "SchoolPilot | Navigate Your School to Success",
    description: "SchoolPilot helps Nigerian schools manage students, track attendance, publish results, collect fees, and communicate with parents.",
    images: [{ url: `${baseUrl}/og-image.png`, width: 1200, height: 630, alt: "SchoolPilot | Navigate Your School to Success" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "SchoolPilot | Navigate Your School to Success",
    description: "SchoolPilot helps Nigerian schools manage students, track attendance, publish results, collect fees, and communicate with parents.",
  },
  robots: { index: true, follow: true },
  manifest: "/manifest.json",
  icons: {
    apple: "/favicon.ico",
  },
  alternates: {
    canonical: "/",
  },
  // Google Search Console (and other webmaster tools) domain verification.
  // Set GOOGLE_SITE_VERIFICATION in Vercel to the meta tag content value:
  // Google gives you a tag like
  //   <meta name="google-site-verification" content="XXXXXXXX" />
  // Paste only the content value. The tag then renders on every page.
  ...(process.env.GOOGLE_SITE_VERIFICATION || process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
    ? {
        verification: {
          google: process.env.GOOGLE_SITE_VERIFICATION || process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
        },
      }
    : {}),
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#00d97e",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased min-h-[100dvh] min-h-screen flex flex-col font-sans transition-colors duration-300">
        <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-white focus:text-green-800 focus:rounded-lg focus:shadow-lg">
          Skip to main content
        </a>
        <ThemeProvider>
          <ToastProvider>
            <QueryProvider>
              <CookieAuthProvider>
                {children}
                <CookieConsentBanner />
              </CookieAuthProvider>
            </QueryProvider>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
