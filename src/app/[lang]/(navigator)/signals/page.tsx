import { Metadata } from "next";
import { fetchMarketSignals } from "@/lib/services/signals/signals.service";
import { strategies } from "./strategies";
import SignalsClient from "./signals-client";

export const metadata: Metadata = {
  title: "AI Trading Signals",
  description:
    "Real-time AI-powered crypto trading signals with market sentiment analysis, Fear and Greed index, and curated strategies. Make smarter trades with Futures AI.",
  keywords: ["AI trading signals", "crypto signals", "trading strategies", "market sentiment", "fear greed index", "bitcoin signals"],
};

export const dynamic = "force-dynamic";
export const revalidate = 300;

export default async function SignalsPage() {
  let data;
  try {
    data = await fetchMarketSignals();
  } catch {
    data = {
      signals: [],
      fearGreed: { value: 50, classification: "Neutral" },
      btcTrend: "below_sma" as const,
      marketSummary: "Unable to load market data. Please try refreshing.",
      updatedAt: new Date().toISOString(),
    };
  }

  return <SignalsClient initialData={data} strategies={strategies} />;
}
