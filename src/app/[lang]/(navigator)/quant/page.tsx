import { Metadata } from "next";
import { fetchMarketSignals } from "@/lib/services/signals/signals.service";
import { getDictionary } from "@/i18n";
import QuantClient from "./quant-client";

export const metadata: Metadata = {
  title: "AI Quant Terminal - Real-Time Crypto Trading Signals",
  description:
    "Real-time AI-powered crypto trading signals, RSI/MACD indicators, chart analysis, and quantitative market insights for professional futures traders. Updated every 60 seconds.",
  keywords: [
    "AI quant terminal",
    "crypto trading signals",
    "AI chart analysis",
    "quantitative trading",
    "market sentiment",
    "fear greed index",
    "RSI MACD signals",
    "futures trading AI",
    "crypto intelligence",
    "bitcoin trading signals",
  ],
  openGraph: {
    title: "AI Quant Terminal - Real-Time Crypto Trading Signals | Futures AI",
    description:
      "Real-time AI-powered crypto trading signals, RSI/MACD indicators, chart analysis, and quantitative market insights for professional futures traders.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Quant Terminal - Real-Time Crypto Trading Signals | Futures AI",
    description:
      "Real-time AI-powered crypto trading signals, RSI/MACD indicators, chart analysis, and quantitative market insights for professional futures traders.",
  },
};

export const revalidate = 60;

export default async function QuantPage({
  params: { lang },
}: {
  params: { lang: string };
}) {
  const [data, translations] = await Promise.all([
    fetchMarketSignals().catch(() => ({
      signals: [],
      fearGreed: { value: 50, classification: "Neutral" },
      btcTrend: "below_sma" as const,
      marketSummary: "Unable to load market data. Please try refreshing.",
      updatedAt: new Date().toISOString(),
    })),
    getDictionary(lang),
  ]);

  const walletAddress = process.env.PAYMENT_WALLET_TRC20 || process.env.PAYMENT_WALLET_ADDRESS || "";

  return <QuantClient initialData={data} lang={lang} translations={translations} walletAddress={walletAddress} />;
}
