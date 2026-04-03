import { Metadata } from "next";
import MarketsClient from "./markets-client";
import { fetchMarketSignals } from "@/lib/services/signals/signals.service";

export const metadata: Metadata = {
  title: "Crypto Markets - Prediction Markets & Quant Signals",
  description:
    "Live prediction markets from Polymarket and real-time quant signals (RSI, MACD) for top cryptocurrencies.",
  keywords: [
    "crypto prediction markets",
    "Polymarket",
    "RSI MACD signals",
    "crypto trading signals",
    "bitcoin price prediction",
  ],
  openGraph: {
    title: "Crypto Markets - Predictions & Quant Signals | Futures AI",
    description:
      "Toggle between live Polymarket predictions and real-time quant analysis for crypto markets.",
    type: "website",
  },
};

export const revalidate = 300;

function parseEvent(e: any) {
  return {
    id: e.id,
    title: e.title,
    slug: e.slug,
    image: e.image || e.icon,
    volume: e.volume,
    liquidity: e.liquidity,
    endDate: e.endDate,
    startDate: e.startDate,
    volume24hr: e.volume24hr,
    markets: (e.markets || []).map((m: any) => ({
      question: m.question,
      outcomePrices:
        typeof m.outcomePrices === "string"
          ? JSON.parse(m.outcomePrices)
          : m.outcomePrices || [],
      outcomes:
        typeof m.outcomes === "string"
          ? JSON.parse(m.outcomes)
          : m.outcomes || ["Yes", "No"],
      volume: m.volume,
      groupItemTitle: m.groupItemTitle,
      groupItemThreshold: m.groupItemThreshold,
    })),
  };
}

async function getCryptoEvents() {
  try {
    const res = await fetch(
      "https://gamma-api.polymarket.com/events?closed=false&tag_slug=crypto&limit=200&order=volume&ascending=false",
      { next: { revalidate: 300 } }
    );
    const events = await res.json();
    return events.map(parseEvent);
  } catch {
    return [];
  }
}

async function getSignals() {
  try {
    return await fetchMarketSignals();
  } catch {
    return {
      signals: [],
      fearGreed: { value: 50, classification: "Neutral" },
      btcTrend: "above_sma" as const,
      marketSummary: "",
      updatedAt: new Date().toISOString(),
    };
  }
}

export default async function MarketsPage({
  params: { lang },
}: {
  params: { lang: string };
}) {
  const [cryptoEvents, signalsData] = await Promise.all([
    getCryptoEvents(),
    getSignals(),
  ]);
  return (
    <MarketsClient
      events={cryptoEvents}
      signals={signalsData}
      lang={lang}
    />
  );
}
