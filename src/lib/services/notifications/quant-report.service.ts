import { GoogleGenerativeAI } from "@google/generative-ai";
import { runPriceAgent, type PriceAgentResult } from "@/lib/services/chart-analysis/agents/price.agent";
import { sendGroupMessage, sendGroupPhoto } from "./telegram.service";
import { cachedAI } from "@/lib/services/ai-cache";

/* ------------------------------------------------------------------ */
/*  Pairs to analyze — rotates through these                           */
/* ------------------------------------------------------------------ */
const REPORT_PAIRS = [
  { pair: "BTCUSDT", symbol: "BTC", name: "비트코인", tvSymbol: "BINANCE:BTCUSDT" },
  { pair: "ETHUSDT", symbol: "ETH", name: "이더리움", tvSymbol: "BINANCE:ETHUSDT" },
  { pair: "SOLUSDT", symbol: "SOL", name: "솔라나", tvSymbol: "BINANCE:SOLUSDT" },
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
/*  Generate the 300-500 word Korean quant report via Gemini            */
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
  const cacheKey = `quant:${pairInfo.symbol}:${priceBucket}`;

  return cachedAI(cacheKey, async () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return "";

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const recentCandles = priceData.recentCandles.slice(-10);
  const candleStr = recentCandles.map((c) =>
    `O:${c.open.toFixed(1)} H:${c.high.toFixed(1)} L:${c.low.toFixed(1)} C:${c.close.toFixed(1)} V:${(c.volume).toFixed(0)}`
  ).join("\n");

  const bbPosition = priceData.currentPrice > indicators.bb.upper ? "상단 밴드 돌파 (과매수)" :
    priceData.currentPrice < indicators.bb.lower ? "하단 밴드 이탈 (과매도)" :
    priceData.currentPrice > indicators.bb.middle ? "중심선 위 (상승 우위)" : "중심선 아래 (하락 우위)";

  const emaCross = indicators.ema9 > indicators.ema21 ? "골든크로스 (단기>장기)" : "데드크로스 (단기<장기)";

  const bidAskRatio = priceData.orderBook.bidDepthTotal / (priceData.orderBook.askDepthTotal || 1);
  const orderBookBias = bidAskRatio > 1.3 ? "매수 우위" : bidAskRatio < 0.7 ? "매도 우위" : "균형";

  const prompt = `당신은 한국 최고의 크립토 퀀트 트레이더입니다. ${pairInfo.name}(${pairInfo.symbol}) 4시간봉 차트 분석 리포트를 작성하세요.

=== 실시간 데이터 ===
현재가: $${priceData.currentPrice.toLocaleString()}
24시간 변동: ${priceData.changePercent24h > 0 ? "+" : ""}${priceData.changePercent24h.toFixed(2)}%
24시간 거래량: $${(priceData.volume24h / 1e6).toFixed(1)}M
24시간 고가: $${priceData.high24h.toLocaleString()} / 저가: $${priceData.low24h.toLocaleString()}

=== 기술적 지표 ===
RSI(14): ${indicators.rsi.toFixed(1)}
EMA 9/21: ${emaCross} (EMA9: $${indicators.ema9.toFixed(1)}, EMA21: $${indicators.ema21.toFixed(1)})
SMA 20: $${indicators.sma20.toFixed(1)}
볼린저 밴드: ${bbPosition} (상단: $${indicators.bb.upper.toFixed(1)}, 하단: $${indicators.bb.lower.toFixed(1)}, 폭: ${indicators.bb.width.toFixed(1)}%)
지지선: ${indicators.supports.map((s) => `$${s.toLocaleString()}`).join(", ") || "미확인"}
저항선: ${indicators.resistances.map((r) => `$${r.toLocaleString()}`).join(", ") || "미확인"}

=== 오더북 ===
매수/매도 비율: ${bidAskRatio.toFixed(2)} (${orderBookBias})
스프레드: $${priceData.orderBook.bidAskSpread.toFixed(2)}

=== 최근 10개 4H 캔들 ===
${candleStr}

=== 리포트 작성 지침 ===
300-500자 한국어 리포트를 작성하세요:

1. 현재 추세 판단 (상승/하락/횡보)과 근거
2. 주요 기술적 지표 해석 (RSI, EMA, 볼린저 밴드)
3. 핵심 지지/저항 레벨과 의미
4. 오더북 분석 (매수/매도 압력)
5. 구체적인 트레이딩 시나리오 (진입가, 손절가, 목표가)
6. 리스크 요인

실제 트레이더가 쓰는 것처럼 자연스럽고 전문적으로 작성하세요.
숫자는 정확하게, 판단은 명확하게.
이모지 사용하지 마세요.`;

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

      // Format header with key stats (send even if AI report fails)
      const changeStr = `${priceData.changePercent24h >= 0 ? "+" : ""}${priceData.changePercent24h.toFixed(2)}%`;
      const rsiLabel = rsi > 70 ? "과매수" : rsi < 30 ? "과매도" : rsi > 55 ? "강세" : rsi < 45 ? "약세" : "중립";
      const trendLabel = ema9 > ema21 ? "상승 추세" : "하락 추세";

      const now = new Date().toLocaleString("ko-KR", {
        timeZone: "Asia/Seoul",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });

      let msg = `<b>${pairInfo.name} 차트 분석</b> · ${now}\n\n`;

      // Key stats bar
      msg += `<b>${pairInfo.symbol}/USDT</b>  $${priceData.currentPrice.toLocaleString()}\n`;
      msg += `${changeStr} | RSI ${rsi.toFixed(0)} (${rsiLabel}) | ${trendLabel}\n`;
      msg += `고가 $${priceData.high24h.toLocaleString()} · 저가 $${priceData.low24h.toLocaleString()}\n\n`;

      // Supports & Resistances
      if (supports.length > 0) {
        msg += `<b>지지선:</b> ${supports.map((s) => `$${s.toLocaleString()}`).join(" / ")}\n`;
      }
      if (resistances.length > 0) {
        msg += `<b>저항선:</b> ${resistances.map((r) => `$${r.toLocaleString()}`).join(" / ")}\n`;
      }
      msg += `\n`;

      // AI Report (may be empty if Gemini rate limited)
      if (report) {
        msg += report;
        msg += `\n\n`;
      }

      // Chart link
      msg += `<a href="https://www.tradingview.com/chart/?symbol=${pairInfo.tvSymbol}&interval=240">TradingView 차트 열기</a>\n\n`;
      msg += `<i>— FuturesAI 퀀트 분석</i>`;

      await sendGroupMessage(msg);

      // Send chart image
      try {
        const chartImgUrl = `https://www.tradingview.com/x/snapshot/?symbol=${pairInfo.tvSymbol}&interval=240&theme=dark`;
        await sendGroupPhoto(
          chartImgUrl,
          `<b>${pairInfo.symbol}/USDT 4H</b> · $${priceData.currentPrice.toLocaleString()} (${changeStr})`,
        );
      } catch {
        // Chart image optional
      }
    }

    return true;
  } catch (error: any) {
    console.error("[quant-report] 퀀트 리포트 전송 실패:", error?.message || error);
    return false;
  }
}
