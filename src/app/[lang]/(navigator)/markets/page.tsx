import { Metadata } from "next";
import MarketsClient from "./markets-client";
import { fetchMarketSignals } from "@/lib/services/signals/signals.service";

export const metadata: Metadata = {
  title: "Prediction Markets & Quant Signals",
  description:
    "Live prediction markets for crypto, politics, and business from Polymarket, plus real-time quant signals.",
  keywords: [
    "prediction markets",
    "Polymarket",
    "crypto trading signals",
    "politics predictions",
    "bitcoin price prediction",
  ],
  openGraph: {
    title: "Prediction Markets & Quant Signals | Futures AI",
    description:
      "Crypto, politics, and business prediction markets with real-time quant analysis.",
    type: "website",
  },
};

export const revalidate = 300;

function parseEvent(e: any, category: string) {
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
    category,
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

function isCompetitive(event: { category: string; markets: { outcomePrices: number[] }[] }): boolean {
  if (event.category === "crypto") return true;
  return event.markets.some((m) => {
    if (!m.outcomePrices || m.outcomePrices.length < 2) return true;
    const yes = parseFloat(String(m.outcomePrices[0]));
    return yes >= 0.15 && yes <= 0.85;
  });
}

async function fetchTagEvents(tag: string, category: string, limit: number) {
  try {
    const res = await fetch(
      `https://gamma-api.polymarket.com/events?closed=false&tag_slug=${tag}&limit=${limit}&order=volume&ascending=false`,
      { next: { revalidate: 300 } }
    );
    const events = await res.json();
    return (events as any[]).map((e) => parseEvent(e, category));
  } catch {
    return [];
  }
}

async function getAllEvents() {
  const [crypto, politics, business] = await Promise.all([
    fetchTagEvents("crypto", "crypto", 200),
    fetchTagEvents("politics", "politics", 100),
    fetchTagEvents("business", "business", 100),
  ]);

  // Deduplicate by event id
  const seen = new Set<string>();
  const merged = [];
  for (const event of [...crypto, ...politics, ...business]) {
    if (!seen.has(event.id)) {
      seen.add(event.id);
      merged.push(event);
    }
  }

  // Filter non-crypto for competitive ratios
  return merged.filter(isCompetitive);
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
    getAllEvents(),
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
