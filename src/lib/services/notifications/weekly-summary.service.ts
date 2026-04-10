import { GoogleGenerativeAI } from "@google/generative-ai";
import { sendGroupMessage } from "./telegram.service";

type CoinMarketData = {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  market_cap: number;
  total_volume: number;
  price_change_percentage_7d_in_currency: number;
  price_change_percentage_24h: number;
};

/**
 * Send comprehensive weekly performance summary every Sunday 9 AM KST.
 * Bilingual KO/EN with quant tone.
 */
export async function sendWeeklySummary(): Promise<boolean> {
  try {
    const res = await fetch(
      "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=30&sparkline=false&price_change_percentage=7d",
      { cache: "no-store" }
    );

    if (!res.ok) return false;
    const coins: CoinMarketData[] = await res.json();

    // Sort by 7d performance
    const sorted = [...coins].sort(
      (a, b) =>
        (b.price_change_percentage_7d_in_currency ?? 0) -
        (a.price_change_percentage_7d_in_currency ?? 0)
    );

    const best5 = sorted.slice(0, 5);
    const worst5 = sorted.slice(-5).reverse();

    // BTC & ETH stats
    const btc = coins.find((c) => c.symbol === "btc");
    const eth = coins.find((c) => c.symbol === "eth");

    // Total market volume
    const totalVol = coins.reduce((sum, c) => sum + (c.total_volume || 0), 0);

    // Generate AI weekly analysis (bilingual)
    const analysis = await generateWeeklyAnalysis(best5, worst5, btc, eth);

    // Format dates
    const today = new Date();
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const dateRangeKo = `${formatDateKo(weekAgo)} ~ ${formatDateKo(today)}`;
    const dateRangeEn = `${formatDateEn(weekAgo)} — ${formatDateEn(today)}`;

    let msg = `<b>Weekly Market Report | 주간 시장 리포트</b>\n${dateRangeKo} (${dateRangeEn})\n\n`;

    // Best performers
    msg += `<b>Top 5 Performers | 주간 베스트 5</b>\n`;
    best5.forEach((c, i) => {
      const pct = c.price_change_percentage_7d_in_currency ?? 0;
      msg += `${i + 1}. <b>${c.symbol.toUpperCase()}</b> ${pct >= 0 ? "+" : ""}${pct.toFixed(1)}% ($${formatPrice(c.current_price)})\n`;
    });

    msg += `\n<b>Bottom 5 | 주간 워스트 5</b>\n`;
    worst5.forEach((c, i) => {
      const pct = c.price_change_percentage_7d_in_currency ?? 0;
      msg += `${i + 1}. <b>${c.symbol.toUpperCase()}</b> ${pct >= 0 ? "+" : ""}${pct.toFixed(1)}% ($${formatPrice(c.current_price)})\n`;
    });

    // Key stats
    msg += `\n<b>Key Metrics | 주요 지표</b>\n`;
    if (btc) {
      msg += `BTC: $${formatPrice(btc.current_price)} (7D ${(btc.price_change_percentage_7d_in_currency ?? 0) >= 0 ? "+" : ""}${(btc.price_change_percentage_7d_in_currency ?? 0).toFixed(1)}%)\n`;
    }
    if (eth) {
      msg += `ETH: $${formatPrice(eth.current_price)} (7D ${(eth.price_change_percentage_7d_in_currency ?? 0) >= 0 ? "+" : ""}${(eth.price_change_percentage_7d_in_currency ?? 0).toFixed(1)}%)\n`;
    }
    msg += `Top 30 Volume: $${(totalVol / 1e9).toFixed(1)}B\n`;

    // AI Analysis (bilingual)
    if (analysis) {
      msg += `\n<b>Weekly Analysis | 주간 분석</b>\n${analysis}\n`;
    }

    msg += `\n<i>— FuturesAI Weekly Report</i>`;

    return await sendGroupMessage(msg);
  } catch (error) {
    console.error("[weekly-summary]", error);
    return false;
  }
}

async function generateWeeklyAnalysis(
  best: CoinMarketData[],
  worst: CoinMarketData[],
  btc?: CoinMarketData,
  eth?: CoinMarketData
): Promise<string> {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return "";

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const bestStr = best.map((c) =>
      `${c.symbol.toUpperCase()} ${(c.price_change_percentage_7d_in_currency ?? 0).toFixed(1)}%`
    ).join(", ");
    const worstStr = worst.map((c) =>
      `${c.symbol.toUpperCase()} ${(c.price_change_percentage_7d_in_currency ?? 0).toFixed(1)}%`
    ).join(", ");

    const prompt = `You are a senior crypto quant strategist writing a weekly market review.

This week's data:
BTC: $${btc?.current_price.toLocaleString()} (${(btc?.price_change_percentage_7d_in_currency ?? 0).toFixed(1)}%)
ETH: $${eth?.current_price.toLocaleString()} (${(eth?.price_change_percentage_7d_in_currency ?? 0).toFixed(1)}%)

Top performers: ${bestStr}
Bottom performers: ${worstStr}

Write bilingual weekly analysis:

[Korean: 4-5 sentences covering market direction, sector flows, next week risks, positioning advice]

---

[English: 4-5 sentences — same analysis, institutional quant tone]

Requirements:
1. This week's overall market direction and key drivers
2. Sector rotation (DeFi, L1, meme coins etc.)
3. Next week's key events and risk factors
4. Actionable positioning for traders

Tone: Professional quant desk — Goldman Sachs weekly review style. No emojis, no hype.`;

    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  } catch {
    return "";
  }
}

function formatPrice(price: number): string {
  if (price >= 1000) return price.toLocaleString(undefined, { maximumFractionDigits: 0 });
  if (price >= 1) return price.toFixed(2);
  if (price >= 0.01) return price.toFixed(4);
  return price.toFixed(6);
}

function formatDateKo(date: Date): string {
  return date.toLocaleDateString("ko-KR", {
    timeZone: "Asia/Seoul",
    month: "long",
    day: "numeric",
  });
}

function formatDateEn(date: Date): string {
  return date.toLocaleDateString("en-US", {
    timeZone: "Asia/Seoul",
    month: "short",
    day: "numeric",
  });
}
