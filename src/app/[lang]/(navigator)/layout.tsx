import { getDictionary } from "@/i18n";
import Headers from "@/components/headers";
import Footer from "@/components/footer";
import { PriceTicker } from "@/components/price-ticker";
import PaybackAlertBanner from "@/components/payback-alert-banner";
import MobileBottomNav from "@/components/mobile-bottom-nav";
import { Metadata } from "next";

export async function generateMetadata({
  params: { lang }
}: {
  params: { lang: string }
}): Promise<Metadata> {
  await getDictionary(lang);

  const isKo = lang === "ko";

  return {
    title: isKo
      ? "Futures AI - AI 기반 암호화폐 트레이딩 인텔리전스"
      : "Futures AI - AI-Powered Crypto Trading Intelligence",
    description: isKo
      ? "Futures AI로 AI 트레이딩 신호, 고래 추적, 실시간 차트, 시장 분석 및 거래 리베이트를 활용하세요."
      : "Futures AI delivers AI-powered trading signals, whale tracking, real-time charts, market analytics, and trading rebates for crypto traders.",
    openGraph: {
      title: "Futures AI - AI-Powered Crypto Trading Intelligence",
      description:
        "AI trading signals, whale tracking, real-time charts, and trading rebates for crypto traders.",
      siteName: "Futures AI",
    },
    alternates: {
      languages: {
        en: "/en",
        ko: "/ko",
      },
    },
  };
}

export default async function LanguageLayout({
  children,
  params: { lang },
}: {
  children: React.ReactNode;
  params: { lang: string };
}) {
  const dictionary = await getDictionary(lang);

  return (
    <>
      <PriceTicker />
      <Headers lang={lang} translations={dictionary} />
      <div className="pt-[92px]">
        <PaybackAlertBanner lang={lang} />
      </div>
      <main className="min-h-screen pb-16 lg:pb-0">{children}</main>
      <Footer lang={lang} translations={dictionary} />
      <MobileBottomNav lang={lang} />
    </>
  );
}

