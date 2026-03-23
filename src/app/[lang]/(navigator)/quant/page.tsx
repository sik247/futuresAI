import { Metadata } from "next";
import { fetchMarketSignals } from "@/lib/services/signals/signals.service";
import { getDictionary } from "@/i18n";
import QuantClient from "./quant-client";

export const metadata: Metadata = {
  title: "AI Quant Terminal",
  description:
    "Real-time AI-powered trading signals, chart analysis, and quantitative insights for professional crypto traders.",
  keywords: [
    "AI quant terminal",
    "crypto signals",
    "chart analysis",
    "quantitative trading",
    "market sentiment",
    "fear greed index",
  ],
};

export const revalidate = 300;

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

  return <QuantClient initialData={data} lang={lang} translations={translations} />;
}
