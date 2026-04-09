export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Vercel Cron: validates price data sources are returning accurate data
// Schedule: "0 */4 * * *" (every 4 hours)

type PriceSource = {
  name: string;
  fetch: () => Promise<number | null>;
};

async function fetchBinanceBTC(): Promise<number | null> {
  try {
    const res = await fetch("https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT", { signal: AbortSignal.timeout(5000) });
    const data = await res.json();
    return parseFloat(data.price) || null;
  } catch { return null; }
}

async function fetchCoinGeckoBTC(): Promise<number | null> {
  try {
    const res = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd", { signal: AbortSignal.timeout(5000) });
    const data = await res.json();
    return data?.bitcoin?.usd || null;
  } catch { return null; }
}

async function fetchCryptoCompareBTC(): Promise<number | null> {
  try {
    const res = await fetch("https://min-api.cryptocompare.com/data/price?fsym=BTC&tsyms=USD", { signal: AbortSignal.timeout(5000) });
    const data = await res.json();
    return data?.USD || null;
  } catch { return null; }
}

export async function GET(request: Request) {
  if (process.env.CRON_SECRET) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const sources: PriceSource[] = [
    { name: "Binance", fetch: fetchBinanceBTC },
    { name: "CoinGecko", fetch: fetchCoinGeckoBTC },
    { name: "CryptoCompare", fetch: fetchCryptoCompareBTC },
  ];

  const results = await Promise.allSettled(
    sources.map(async (s) => ({
      name: s.name,
      price: await s.fetch(),
    }))
  );

  const prices: { name: string; price: number | null }[] = results.map((r) =>
    r.status === "fulfilled" ? r.value : { name: "unknown", price: null }
  );

  const validPrices = prices.filter((p) => p.price !== null && p.price > 0);
  const avgPrice = validPrices.length > 0
    ? validPrices.reduce((sum, p) => sum + p.price!, 0) / validPrices.length
    : 0;

  // Check for anomalies (any source > 5% off from average)
  const anomalies: string[] = [];
  for (const p of validPrices) {
    const deviation = Math.abs(p.price! - avgPrice) / avgPrice * 100;
    if (deviation > 5) {
      anomalies.push(`${p.name}: $${p.price!.toLocaleString()} (${deviation.toFixed(1)}% off avg)`);
    }
  }

  // Check which sources are down
  const downSources = prices.filter((p) => p.price === null).map((p) => p.name);

  const status = {
    healthy: anomalies.length === 0 && downSources.length <= 1,
    avgPrice: avgPrice > 0 ? `$${avgPrice.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : "N/A",
    sources: prices.map((p) => ({
      name: p.name,
      price: p.price ? `$${p.price.toLocaleString()}` : "DOWN",
      status: p.price ? "OK" : "DOWN",
    })),
    anomalies,
    downSources,
    timestamp: new Date().toISOString(),
  };

  // Log to DB
  try {
    await prisma.contentBotLog.create({
      data: {
        action: "price-check",
        details: `Price check: ${status.healthy ? "HEALTHY" : "ALERT"} | Avg: ${status.avgPrice} | Down: ${downSources.join(",") || "none"} | Anomalies: ${anomalies.join(",") || "none"}`,
        itemCount: validPrices.length,
      },
    });
  } catch {}

  return NextResponse.json(status);
}
