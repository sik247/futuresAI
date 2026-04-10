import { GoogleGenerativeAI } from "@google/generative-ai";
import { runPriceAgent, type PriceAgentResult } from "@/lib/services/chart-analysis/agents/price.agent";
import { sendGroupMessage, sendGroupPhoto } from "./telegram.service";
import { cachedAI } from "@/lib/services/ai-cache";

/* ------------------------------------------------------------------ */
/*  Pairs to analyze — rotates through these                           */
/* ------------------------------------------------------------------ */
const REPORT_PAIRS = [
  { pair: "BTCUSDT", symbol: "BTC", nameKo: "비트코인", nameEn: "Bitcoin", tvSymbol: "BINANCE:BTCUSDT" },
  { pair: "ETHUSDT", symbol: "ETH", nameKo: "이더리움", nameEn: "Ethereum", tvSymbol: "BINANCE:ETHUSDT" },
  { pair: "SOLUSDT", symbol: "SOL", nameKo: "솔라나", nameEn: "Solana", tvSymbol: "BINANCE:SOLUSDT" },
];

/* ------------------------------------------------------------------ */
/*  Calculate technical indicators from candle data                     */
/* ------------------------------------------------------------------ */
function calcRSI(candles: PriceAgentResult["recentCandles"], period = 14): number {
  if (candles.length < period + 1) return 50;
  const changes = candles.slice(-period - 1).map((c, i, arr) =>
    i === 0 ? 0 : c.close - arr[i - 1].close
  ).slice(1);

  const gains = changes.filter((c) => c > 0);
  const losses = changes.filter((c) => c < 0).map((c) => Math.abs(c));

  const avgGain = gains.length > 0 ? gains.reduce((a, b) => a + b, 0) / period : 0;
  const avgLoss = losses.length > 0 ? losses.reduce((a, b) => a + b, 0) / period : 0.001;

  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

function calcSMA(candles: PriceAgentResult["recentCandles"], period: number): number {
  const slice = candles.slice(-period);
  return slice.reduce((sum, c) => sum + c.close, 0) / slice.length;
}

function calcEMA(candles: PriceAgentResult["recentCandles"], period: number): number {
  const multiplier = 2 / (period + 1);
  let ema = candles[0]?.close || 0;
  for (const c of candles.slice(1)) {
    ema = (c.close - ema) * multiplier + ema;
  }
  return ema;
}

function calcBollingerBands(candles: PriceAgentResult["recentCandles"], period = 20) {
  const slice = candles.slice(-period);
  const sma = slice.reduce((sum, c) => sum + c.close, 0) / slice.length;
  const variance = slice.reduce((sum, c) => sum + Math.pow(c.close - sma, 2), 0) / slice.length;
  const stdDev = Math.sqrt(variance);
  return { upper: sma + 2 * stdDev, middle: sma, lower: sma - 2 * stdDev, width: (4 * stdDev / sma) * 100 };
}

function calcSupportsResistances(candles: PriceAgentResult["recentCandles"]): { supports: number[]; resistances: number[] } {
  const recent = candles.slice(-30);
  const currentPrice = recent[recent.length - 1]?.close || 0;

  // Find local swing lows (supports) and highs (resistances)
  const pivots: { price: number; type: "high" | "low" }[] = [];
  for (let i = 2; i < recent.length - 2; i++) {
    if (recent[i].low < recent[i - 1].low && recent[i].low < recent[i - 2].low &&
        recent[i].low < recent[i + 1].low && recent[i].low < recent[i + 2].low) {
      pivots.push({ price: recent[i].low, type: "low" });
    }
    if (recent[i].high > recent[i - 1].high && recent[i].high > recent[i - 2].high &&
        recent[i].high > recent[i + 1].high && recent[i].high > recent[i + 2].high) {
      pivots.push({ price: recent[i].high, type: "high" });
    }
  }

  const supports = pivots.filter((p) => p.type === "low" && p.price < currentPrice)
    .sort((a, b) => b.price - a.price).slice(0, 3).map((p) => p.price);
  const resistances = pivots.filter((p) => p.type === "high" && p.price > currentPrice)
    .sort((a, b) => a.price - b.price).slice(0, 3).map((p) => p.price);

  return { supports, resistances };
}

/* ------------------------------------------------------------------ */
/*  Generate bilingual quant report via Gemini                         */
/* ------------------------------------------------------------------ */
async function generateQuantReport(
  pairInfo: typeof REPORT_PAIRS[0],
  priceData: PriceAgentResult,
  indicators: {
    rsi: number;
    sma20: number;
    ema9: number;
    ema21: number;
    bb: { upper: number; middle: number; lower: number; width: number };
    supports: number[];
    resistances: number[];
  }
): Promise<string> {
  // Cache key based on pair + current price bucket (rounds to nearest $100 for BTC)
  const priceBucket = Math.round(priceData.currentPrice / 100) * 100;
  const cacheKey = `quant-bi:${pairInfo.symbol}:${priceBucket}`;

  return cachedAI(cacheKey, async () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return "";

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const recentCandles = priceData.recentCandles.slice(-10);
  const candleStr = recentCandles.map((c) =>
    `O:${c.open.toFixed(1)} H:${c.high.toFixed(1)} L:${c.low.toFixed(1)} C:${c.close.toFixed(1)} V:${(c.volume).toFixed(0)}`
  ).join("\n");

  const bbPosition = priceData.currentPrice > indicators.bb.upper ? "Above upper band (overbought)" :
    priceData.currentPrice < indicators.bb.lower ? "Below lower band (oversold)" :
    priceData.currentPrice > indicators.bb.middle ? "Above midline (bullish bias)" : "Below midline (bearish bias)";

  const emaCross = indicators.ema9 > indicators.ema21 ? "Golden cross (short > long)" : "Death cross (short < long)";

  const bidAskRatio = priceData.orderBook.bidDepthTotal / (priceData.orderBook.askDepthTotal || 1);
  const orderBookBias = bidAskRatio > 1.3 ? "Buy dominant" : bidAskRatio < 0.7 ? "Sell dominant" : "Balanced";

  const prompt = `You are a top-tier crypto quant trader. Write a bilingual ${pairInfo.nameEn} (${pairInfo.symbol}) 4H chart analysis.

=== LIVE DATA ===
Price: $${priceData.currentPrice.toLocaleString()}
24H Change: ${priceData.changePercent24h > 0 ? "+" : ""}${priceData.changePercent24h.toFixed(2)}%
24H Volume: $${(priceData.volume24h / 1e6).toFixed(1)}M
24H High: $${priceData.high24h.toLocaleString()} / Low: $${priceData.low24h.toLocaleString()}

=== TECHNICALS ===
RSI(14): ${indicators.rsi.toFixed(1)}
EMA 9/21: ${emaCross} (EMA9: $${indicators.ema9.toFixed(1)}, EMA21: $${indicators.ema21.toFixed(1)})
SMA 20: $${indicators.sma20.toFixed(1)}
Bollinger: ${bbPosition} (Upper: $${indicators.bb.upper.toFixed(1)}, Lower: $${indicators.bb.lower.toFixed(1)}, Width: ${indicators.bb.width.toFixed(1)}%)
Support: ${indicators.supports.map((s) => `$${s.toLocaleString()}`).join(", ") || "Unconfirmed"}
Resistance: ${indicators.resistances.map((r) => `$${r.toLocaleString()}`).join(", ") || "Unconfirmed"}

=== ORDER BOOK ===
Bid/Ask Ratio: ${bidAskRatio.toFixed(2)} (${orderBookBias})
Spread: $${priceData.orderBook.bidAskSpread.toFixed(2)}

=== RECENT 10x 4H CANDLES ===
${candleStr}

=== OUTPUT FORMAT ===
Write a bilingual report:

[Korean section: 200-300 characters covering trend, key indicators, support/resistance, trading scenarios with specific levels, risks]

---

[English section: 200-300 words covering the same — trend assessment, indicator interpretation, key levels, concrete trading scenarios (entry/stop/target), risk factors]

TONE: Professional quant desk note. Precise numbers, clear directional bias, no hedging language, no emojis. Write like you're briefing a prop trading desk.`;

  const result = await model.generateContent(prompt);
  return result.response.text().trim();
  }, 20 * 60 * 1000); // 20 min cache — refreshes as price moves
}

/* ------------------------------------------------------------------ */
/*  Format and send the full quant report to Telegram                   */
/* ------------------------------------------------------------------ */
export async function sendQuantReport(): Promise<boolean> {
  try {
    // Pick pair based on time — BTC always, rotate ETH/SOL
    const hour = new Date().getUTCHours();
    const pairs = [REPORT_PAIRS[0]]; // Always BTC
    if (hour % 2 === 0 && REPORT_PAIRS[1]) pairs.push(REPORT_PAIRS[1]); // ETH on even hours
    if (hour % 2 === 1 && REPORT_PAIRS[2]) pairs.push(REPORT_PAIRS[2]); // SOL on odd hours

    for (const pairInfo of pairs) {
      // Fetch live data from Binance
      const priceData = await runPriceAgent(pairInfo.pair);

      // Calculate indicators
      const rsi = calcRSI(priceData.recentCandles);
      const sma20 = calcSMA(priceData.recentCandles, 20);
      const ema9 = calcEMA(priceData.recentCandles, 9);
      const ema21 = calcEMA(priceData.recentCandles, 21);
      const bb = calcBollingerBands(priceData.recentCandles);
      const { supports, resistances } = calcSupportsResistances(priceData.recentCandles);

      // Generate report
      const report = await generateQuantReport(pairInfo, priceData, {
        rsi, sma20, ema9, ema21, bb, supports, resistances,
      });

      // Format header with key stats
      const changeStr = `${priceData.changePercent24h >= 0 ? "+" : ""}${priceData.changePercent24h.toFixed(2)}%`;

      const rsiLabelKo = rsi > 70 ? "과매수" : rsi < 30 ? "과매도" : rsi > 55 ? "강세" : rsi < 45 ? "약세" : "중립";
      const rsiLabelEn = rsi > 70 ? "Overbought" : rsi < 30 ? "Oversold" : rsi > 55 ? "Bullish" : rsi < 45 ? "Bearish" : "Neutral";
      const trendKo = ema9 > ema21 ? "상승 추세" : "하락 추세";
      const trendEn = ema9 > ema21 ? "Uptrend" : "Downtrend";

      const now = new Date().toLocaleString("ko-KR", {
        timeZone: "Asia/Seoul",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });

      let msg = `<b>${pairInfo.nameEn} Chart Analysis | ${pairInfo.nameKo} 차트 분석</b> · ${now} KST\n\n`;

      // Key stats bar
      msg += `<b>${pairInfo.symbol}/USDT</b>  $${priceData.currentPrice.toLocaleString()}\n`;
      msg += `${changeStr} | RSI ${rsi.toFixed(0)} (${rsiLabelKo}/${rsiLabelEn}) | ${trendKo}/${trendEn}\n`;
      msg += `H $${priceData.high24h.toLocaleString()} · L $${priceData.low24h.toLocaleString()}\n\n`;

      // Supports & Resistances
      if (supports.length > 0) {
        msg += `<b>Support:</b> ${supports.map((s) => `$${s.toLocaleString()}`).join(" / ")}\n`;
      }
      if (resistances.length > 0) {
        msg += `<b>Resistance:</b> ${resistances.map((r) => `$${r.toLocaleString()}`).join(" / ")}\n`;
      }
      msg += `\n`;

      // AI Report (bilingual, may be empty if Gemini rate limited)
      if (report) {
        msg += report;
        msg += `\n\n`;
      }

      // Conclusive recommendation based on technicals
      let verdictKo: string;
      let verdictEn: string;
      if (rsi > 70 && ema9 > ema21) {
        verdictKo = `과매수 구간 진입 — 추격 매수보다 $${supports[0]?.toLocaleString() || "지지선"} 부근 눌림 대기 권장.`;
        verdictEn = `Overbought territory — avoid chasing, wait for pullback to ${supports[0] ? `$${supports[0].toLocaleString()}` : "support"} region.`;
      } else if (rsi < 30 && ema9 < ema21) {
        verdictKo = `과매도 구간 — 반등 가능성 있으나 $${resistances[0]?.toLocaleString() || "저항선"} 돌파 확인 후 진입 권장.`;
        verdictEn = `Oversold — bounce likely but wait for confirmation above ${resistances[0] ? `$${resistances[0].toLocaleString()}` : "resistance"} before entry.`;
      } else if (ema9 > ema21 && rsi > 50) {
        verdictKo = `상승 추세 유지 중 — 눌림 시 매수 전략 유효. 손절 $${supports[0]?.toLocaleString() || "지지선"}.`;
        verdictEn = `Uptrend intact — buy-the-dip strategy valid. Stop below $${supports[0]?.toLocaleString() || "support"}.`;
      } else if (ema9 < ema21 && rsi < 50) {
        verdictKo = `하락 추세 지속 — 반등 시 매도 전략 유효. $${resistances[0]?.toLocaleString() || "저항선"} 돌파 시 전략 재검토.`;
        verdictEn = `Downtrend persists — sell rallies. Reassess if price reclaims $${resistances[0]?.toLocaleString() || "resistance"}.`;
      } else {
        verdictKo = `방향성 불명확 — 레인지 바운드 대응. 핵심 레벨 이탈 시까지 관망 권장.`;
        verdictEn = `No clear direction — range-bound. Wait for a decisive break of key levels before committing.`;
      }

      msg += `<b>Verdict | 결론</b>\n`;
      msg += `${verdictKo}\n${verdictEn}\n\n`;

      msg += `<a href="https://futuresai.io/ko/chart-ideas">Free AI Chart Analysis | 무료 AI 차트 분석</a>\n`;
      msg += `<i>— FuturesAI Quant Analysis</i>`;

      await sendGroupMessage(msg);
    }

    return true;
  } catch (error: any) {
    console.error("[quant-report] Quant report failed:", error?.message || error);
    return false;
  }
}
