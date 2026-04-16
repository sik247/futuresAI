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
  viewportFit: "cover",
  themeColor: "#09090b",
};

export const metadata: Metadata = {
  metadataBase: resolveMetadataBase(),
  title: {
    default: "Futures&AI - 비트코인 AI 퀀트 분석 및 실시간 코인 시그널",
    template: "%s | Futures AI",
  },
  description:
    "차원이 다른 AI 트레이딩을 경험하세요. 실시간 코인 고래 추적, 기관급 온체인 데이터 분석, 퀀트 시그널부터 비트겟(Bitget), OKX, 게이트(Gate) 등 공식파트너로써 수수료 페이백까지 제공하는 크립토 종합 플랫폼 퓨처스앤에이아이(FuturesAI)입니다.",
  keywords: [
    "futures AI", "futuresai", "퓨처스AI", "퓨처스앤에이아이",
    "비트코인 AI 분석", "코인 시그널", "크립토 퀀트",
    "AI crypto trading", "crypto futures signals", "AI trading signals",
    "whale tracking crypto", "코인 고래 추적", "온체인 분석",
    "bitcoin trading signals", "비트코인 트레이딩",
    "crypto analytics platform", "trading rebates crypto", "수수료 페이백",
    "비트겟 페이백", "OKX 레퍼럴", "게이트 수수료 할인",
    "free crypto signals", "crypto chart analysis AI",
    "cryptocurrency market intelligence", "코인 차트 분석",
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
    siteName: "Futures&AI",
    title: "Futures&AI - 비트코인 AI 퀀트 분석 및 실시간 코인 시그널",
    description:
      "차원이 다른 AI 트레이딩을 경험하세요. 실시간 코인 고래 추적, 기관급 온체인 데이터 분석, 퀀트 시그널부터 비트겟(Bitget), OKX, 게이트(Gate) 등 공식파트너로써 수수료 페이백까지 제공하는 크립토 종합 플랫폼 퓨처스앤에이아이(FuturesAI)입니다.",
    images: [
      {
        url: `${baseUrl}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "Futures&AI - 비트코인 AI 퀀트 분석 및 실시간 코인 시그널",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@TetherBase",
    title: "Futures&AI - 비트코인 AI 퀀트 분석 및 실시간 코인 시그널",
    description:
      "차원이 다른 AI 트레이딩을 경험하세요. 실시간 코인 고래 추적, 기관급 온체인 데이터 분석, 퀀트 시그널부터 수수료 페이백까지.",
    images: [`${baseUrl}/og-image.png`],
    creator: "@TetherBase",
  },
  alternates: {
    canonical: baseUrl,
    languages: {
      en: `${baseUrl}/en`,
      ko: `${baseUrl}/ko`,
    },
    types: {
      "application/rss+xml": `${baseUrl}/feed`,
    },
  },
  // Search engine verification
  // Register at https://searchadvisor.naver.com/ and https://search.google.com/search-console
  // Replace placeholder values with actual verification codes
  verification: {
    google: "5WrFYSG6FTgntn_gVaotthSp-Gk-3XIJ0bJ7XH9yI5E",
    other: {
      "naver-site-verification": "e517f0556924dce1407b40c0c37611d94c9d73fd",
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