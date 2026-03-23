import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { resolveMetadataBase } from "@/lib/site-metadata";
import "@/app/globals.css";
import { Toaster } from "@/components/ui/toaster";
import Providers from "@/components/providers/providers";
import Loading from "@/components/ui/loading";
import { GlobalAlertDialog } from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import SessionProviders from "@/components/providers/session-provider";
import { OrganizationJsonLd, WebsiteJsonLd } from "@/components/structured-data";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://futuresai.com";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#09090b",
};

export const metadata: Metadata = {
  metadataBase: resolveMetadataBase(),
  title: {
    default: "Futures AI - AI-Powered Crypto Trading Intelligence",
    template: "%s | Futures AI",
  },
  description:
    "Futures AI delivers AI-powered crypto trading signals, whale tracking, real-time charts, market analytics, and trading rebates. Your all-in-one crypto trading intelligence platform.",
  keywords: [
    "crypto trading",
    "futures trading",
    "AI trading signals",
    "whale tracking",
    "crypto analytics",
    "trading rebates",
    "cryptocurrency",
    "bitcoin",
    "ethereum",
    "crypto intelligence",
    "trading platform",
    "market analysis",
  ],
  authors: [{ name: "Futures AI" }],
  creator: "Futures AI",
  publisher: "Futures AI",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: baseUrl,
    siteName: "Futures AI",
    title: "Futures AI - AI-Powered Crypto Trading Intelligence",
    description:
      "AI-powered crypto trading signals, whale tracking, real-time charts, market analytics, and trading rebates.",
    images: [
      {
        url: `${baseUrl}/images/futures-ai-logo.png`,
        width: 1200,
        height: 630,
        alt: "Futures AI - AI-Powered Crypto Trading Intelligence",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Futures AI - AI-Powered Crypto Trading Intelligence",
    description:
      "AI-powered crypto trading signals, whale tracking, real-time charts, market analytics, and trading rebates.",
    images: [`${baseUrl}/images/futures-ai-logo.png`],
    creator: "@TetherBase",
  },
  alternates: {
    canonical: baseUrl,
    languages: {
      en: `${baseUrl}/en`,
      ko: `${baseUrl}/ko`,
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className={inter.variable}>
      <body className={cn(inter.className, "bg-background text-foreground antialiased")}>
        <OrganizationJsonLd />
        <WebsiteJsonLd />
        <Providers>
          <SessionProviders>{children}</SessionProviders>
          <Toaster />
          <Loading />
          <GlobalAlertDialog />
        </Providers>
      </body>
    </html>
  );
}