import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 300; // 5 min cache

export async function GET() {
  try {
    const res = await fetch(
      "https://gamma-api.polymarket.com/events?closed=false&tag=crypto&limit=12",
      { next: { revalidate: 300 } }
    );
    if (!res.ok) throw new Error("Polymarket API error");
    const events = await res.json();

    // Map to a clean shape
    const markets = events.map((event: any) => ({
      id: event.id,
      title: event.title,
      slug: event.slug,
      description: event.description,
      image: event.image,
      volume: event.volume,
      liquidity: event.liquidity,
      startDate: event.startDate,
      endDate: event.endDate,
      markets:
        event.markets?.map((m: any) => ({
          id: m.id,
          question: m.question,
          outcomePrices: m.outcomePrices ? JSON.parse(m.outcomePrices) : [],
          outcomes: m.outcomes ? JSON.parse(m.outcomes) : [],
          volume: m.volume,
          oneDayPriceChange: m.oneDayPriceChange,
        })) || [],
    }));

    return NextResponse.json({ markets });
  } catch (error) {
    console.error("Polymarket fetch error:", error);
    return NextResponse.json({ markets: [] }, { status: 500 });
  }
}
