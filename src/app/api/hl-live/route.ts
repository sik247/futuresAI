import { NextResponse } from "next/server";
import { fetchAllHLWhales, fetchAllHLTrades, fetchHLMarketData } from "@/lib/services/whales/hyperliquid.service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [whales, trades, markets] = await Promise.allSettled([
      fetchAllHLWhales(),
      fetchAllHLTrades(),
      fetchHLMarketData(),
    ]);

    return NextResponse.json({
      whales: whales.status === "fulfilled" ? whales.value : [],
      trades: trades.status === "fulfilled" ? trades.value : [],
      markets: markets.status === "fulfilled" ? markets.value : [],
      updatedAt: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json({ whales: [], trades: [], markets: [], updatedAt: new Date().toISOString() }, { status: 500 });
  }
}
