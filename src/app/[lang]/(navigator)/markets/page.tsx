import { Metadata } from "next";
import MarketsClient from "./markets-client";

export const metadata: Metadata = {
  title: "Crypto Prediction Markets - Live Polymarket Data",
  description:
    "Live prediction markets from Polymarket. Track real-time probabilities, trading volume, and trends across crypto and global events.",
  keywords: [
    "crypto prediction markets",
    "Polymarket",
    "crypto predictions",
    "market probabilities",
    "bitcoin price prediction",
  ],
  openGraph: {
    title: "Crypto Prediction Markets - Live Polymarket Data | Futures AI",
    description:
      "Track real-time probabilities, trading volume, and trends across crypto and global prediction markets.",
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

export default async function MarketsPage({
  params: { lang },
}: {
  params: { lang: string };
}) {
  const cryptoEvents = await getCryptoEvents();
  return <MarketsClient events={cryptoEvents} lang={lang} />;
}
