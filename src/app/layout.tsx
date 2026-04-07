import type { Metadata, Viewport } from "next";
import { Inter, Noto_Sans_KR } from "next/font/google";
import NextTopLoader from "nextjs-toploader";
import { resolveMetadataBase } from "@/lib/site-metadata";
import "@/app/globals.css";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import { Toaster } from "@/components/ui/toaster";
import Providers from "@/components/providers/providers";
import Loading from "@/components/ui/loading";
import { GlobalAlertDialog } from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import SessionProviders from "@/components/providers/session-provider";
import { OrganizationJsonLd, WebsiteJsonLd, SoftwareApplicationJsonLd, FAQJsonLd } from "@/components/structured-data";
import Script from "next/script";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const notoSansKR = Noto_Sans_KR({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-noto-kr",
  display: "swap",
});

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://futuresai.io";

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
    "futures AI",
    "futuresai",
    "AI crypto trading",
    "crypto futures signals",
    "AI trading signals",
    "whale tracking crypto",
    "crypto quant terminal",
    "bitcoin trading signals",
    "ethereum analysis",
    "solana trading",
    "crypto analytics platform",
    "trading rebates crypto",
    "free crypto signals",
    "crypto chart analysis AI",
    "cryptocurrency market intelligence",
    "futures trading bot",
    "crypto RSI MACD signals",
    "best crypto trading platform",
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
    alternateLocale: "ko_KR",
    url: baseUrl,
    siteName: "Futures AI",
    title: "Futures AI - AI-Powered Crypto Trading Intelligence",
    description:
      "AI-powered crypto trading signals, whale tracking, real-time charts, market analytics, and trading rebates. Your all-in-one crypto trading intelligence platform.",
    images: [
      {
        url: `${baseUrl}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "Futures AI - AI-Powered Crypto Trading Intelligence",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@TetherBase",
    title: "Futures AI - AI-Powered Crypto Trading Intelligence",
    description:
      "AI-powered crypto trading signals, whale tracking, real-time charts, market analytics, and trading rebates.",
    images: [`${baseUrl}/og-image.png`],
    creator: "@TetherBase",
  },
  alternates: {
    canonical: baseUrl,
    languages: {
      en: `${baseUrl}/en`,
      ko: `${baseUrl}/ko`,
    },
  },
  // Search engine verification
  // Register at https://searchadvisor.naver.com/ and https://search.google.com/search-console
  // Replace placeholder values with actual verification codes
  verification: {
    google: "futuresai_google_verification",
    other: {
      "naver-site-verification": "futuresai_naver_verification",
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html suppressHydrationWarning className={`${inter.variable} ${notoSansKR.variable}`}>
      <head>
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2718044648644151"
          crossOrigin="anonymous"
          strategy="beforeInteractive"
        />
      </head>
      <body className={cn(inter.className, "bg-background text-foreground antialiased")}>
        <NextTopLoader color="#3b82f6" height={2} showSpinner={false} />
        <OrganizationJsonLd />
        <WebsiteJsonLd />
        <SoftwareApplicationJsonLd />
        <FAQJsonLd />
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