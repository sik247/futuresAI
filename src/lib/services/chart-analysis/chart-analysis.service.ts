import { GoogleGenerativeAI } from "@google/generative-ai";
import type { PriceAgentResult } from "./agents/price.agent";
import type { WebSearchResult } from "./agents/web-search.agent";

export type LiveContext = {
  currentPrice: number;
  change24h: number;
  volume24h: number;
  sentiment: string;
  keyNews: { title: string; snippet: string }[];
  orderBookBias: "BUY_PRESSURE" | "SELL_PRESSURE" | "BALANCED";
};

export type ChartAnalysisResult = {
  summary: string;
  trend: string;
  patterns: string[];
  supportLevels: number[];
  resistanceLevels: number[];
  indicators: {
    name: string;
    value: string;
    signal: "BUY" | "SELL" | "NEUTRAL";
  }[];
  tradeSetup: {
    direction: "LONG" | "SHORT" | "NEUTRAL";
    entry: number;
    stopLoss: number;
    takeProfit: number;
    riskReward: string;
    confidence: number;
  };
  riskScore: number;
  confidence: number;
  ocrData: {
    currentPrice: number;
    priceRange: { high: number; low: number };
    timeframe: string;
    visibleIndicators: string[];
    readValues: Record<string, string>;
  };
  quantAnalysis: {
    fibonacciLevels: { level: string; price: number; significance: string }[];
    bollingerPosition: string;
    rsiValue: number;
    rsiDivergence: string | null;
    volumeProfile: string;
    statisticalTargets: { price: number; probability: number; timeframe: string }[];
  };
  lines: ChartLine[];
  liveContext?: LiveContext;
  professionalSummary?: {
    executiveSummary: string;
    marketStructure: string;
    tradingThesis: string;
    keyRisks: string[];
    keyCatalysts: string[];
  };
};

export type ChartLine = {
  type: "support" | "resistance" | "trend" | "entry" | "stopLoss" | "takeProfit";
  yPercent: number;
  label: string;
  color: string;
  dashed: boolean;
  hitProbability: number;
};

const CHART_ANALYSIS_PROMPT = `You are an elite quantitative crypto/forex chart analyst with deep expertise in technical analysis, statistical modeling, and OCR.

STEP 1 — OCR (Read the chart):
- Read the Y-axis price scale: extract exact price values visible on the chart
- Read the X-axis: identify the timeframe (1m, 5m, 15m, 1H, 4H, 1D, 1W) and date range
- Identify the current/last candle close price
- Read any indicator panels: exact RSI value, MACD histogram, Bollinger Band values, volume bars
- Note any visible moving averages and their approximate values

STEP 2 — QUANTITATIVE ANALYSIS:
- Calculate Fibonacci retracement levels (0.236, 0.382, 0.5, 0.618, 0.786) from the most prominent swing high to swing low visible on the chart
- Assess Bollinger Band position: is price at upper/middle/lower band? Is there a squeeze?
- Evaluate RSI: current value, any bullish or bearish divergences
- Volume profile analysis: identify accumulation/distribution zones, point of control
- Identify chart patterns: head & shoulders, double top/bottom, triangles, wedges, flags, channels
- Calculate statistical probability of price reaching each key level based on:
  - Distance from current price (closer = higher probability)
  - Number of previous touches (more touches = stronger level)
  - Confluence with Fibonacci levels
  - Volume support at the level
  - Trend direction alignment

STEP 3 — TRADE SETUP with probabilities:
- Provide entry, stop loss, take profit — each with a hitProbability (0-100%)
- hitProbability = estimated % chance price reaches that level within the visible timeframe
- Be conservative and statistically grounded with probability estimates

Return a JSON object with this EXACT structure:

{
  "summary": "2-3 sentence professional overview with specific price references",
  "trend": "BULLISH" or "BEARISH" or "NEUTRAL" or "CONSOLIDATING",
  "patterns": ["pattern1", "pattern2"],
  "supportLevels": [price1, price2, price3],
  "resistanceLevels": [price1, price2, price3],
  "indicators": [
    {"name": "RSI (14)", "value": "exact value read from chart or estimate", "signal": "BUY" or "SELL" or "NEUTRAL"},
    {"name": "MACD", "value": "description of histogram and signal line", "signal": "BUY" or "SELL" or "NEUTRAL"},
    {"name": "Volume", "value": "description of volume trend", "signal": "BUY" or "SELL" or "NEUTRAL"},
    {"name": "Bollinger Bands", "value": "price position relative to bands", "signal": "BUY" or "SELL" or "NEUTRAL"},
    {"name": "Moving Averages", "value": "EMA/SMA crossover status", "signal": "BUY" or "SELL" or "NEUTRAL"}
  ],
  "tradeSetup": {
    "direction": "LONG" or "SHORT" or "NEUTRAL",
    "entry": exact_price,
    "stopLoss": exact_price,
    "takeProfit": exact_price,
    "riskReward": "1:X.X",
    "confidence": 0-100
  },
  "riskScore": 1-10,
  "confidence": 0-100,
  "ocrData": {
    "currentPrice": exact_price_read_from_chart,
    "priceRange": {"high": highest_visible_price, "low": lowest_visible_price},
    "timeframe": "4H",
    "visibleIndicators": ["RSI 14", "MACD 12,26,9", "BB 20,2"],
    "readValues": {"RSI": "58.3", "MACD": "-125.4", "BB_upper": "67500", "BB_lower": "63200"}
  },
  "quantAnalysis": {
    "fibonacciLevels": [
      {"level": "0.236", "price": 66800, "significance": "Minor resistance"},
      {"level": "0.382", "price": 65500, "significance": "Key retracement"},
      {"level": "0.5", "price": 64500, "significance": "Midpoint"},
      {"level": "0.618", "price": 63500, "significance": "Golden ratio - strong support"},
      {"level": "0.786", "price": 62200, "significance": "Deep retracement"}
    ],
    "bollingerPosition": "Price trading near lower band with narrowing bands suggesting potential squeeze",
    "rsiValue": 58.3,
    "rsiDivergence": "Bearish divergence: price making higher highs while RSI makes lower highs" or null,
    "volumeProfile": "Declining volume on recent rally suggests weak buying pressure. POC at $64,800.",
    "statisticalTargets": [
      {"price": 68000, "probability": 35, "timeframe": "within 7 days"},
      {"price": 62000, "probability": 55, "timeframe": "within 7 days"},
      {"price": 60000, "probability": 25, "timeframe": "within 14 days"}
    ]
  },
  "lines": [
    {"type": "support", "yPercent": 70, "label": "S1 $63,500", "color": "#22c55e", "dashed": false, "hitProbability": 72},
    {"type": "support", "yPercent": 85, "label": "S2 $62,000", "color": "#22c55e", "dashed": false, "hitProbability": 55},
    {"type": "resistance", "yPercent": 25, "label": "R1 $67,200", "color": "#ef4444", "dashed": false, "hitProbability": 45},
    {"type": "resistance", "yPercent": 10, "label": "R2 $68,500", "color": "#ef4444", "dashed": false, "hitProbability": 30},
    {"type": "trend", "yPercent": 50, "label": "Trendline", "color": "#f59e0b", "dashed": true, "hitProbability": 60},
    {"type": "entry", "yPercent": 45, "label": "Entry $64,200", "color": "#3b82f6", "dashed": false, "hitProbability": 85},
    {"type": "stopLoss", "yPercent": 88, "label": "SL $61,500", "color": "#ef4444", "dashed": true, "hitProbability": 20},
    {"type": "takeProfit", "yPercent": 15, "label": "TP $68,000", "color": "#22c55e", "dashed": true, "hitProbability": 40}
  ],
  "professionalSummary": {
    "executiveSummary": "Concise 2-3 sentence institutional-grade overview of the setup, referencing specific prices and probabilities.",
    "marketStructure": "Description of current market structure: trend phase, key swing points, order flow dynamics.",
    "tradingThesis": "Clear thesis for the trade: why this direction, what confluence supports it, what invalidates it.",
    "keyRisks": ["Risk 1 with specific price level", "Risk 2"],
    "keyCatalysts": ["Catalyst 1 that could drive the move", "Catalyst 2"]
  }
}

CRITICAL RULES:
- Write as if preparing a research note for an institutional trading desk. Use precise language, reference specific price levels, and quantify probabilities.
- Use REAL prices read from the chart via OCR. Do NOT make up prices.
- yPercent is vertical position on the image (0 = top, 100 = bottom)
- hitProbability must be statistically grounded, not arbitrary
- If you cannot read a value precisely, provide your best estimate and note uncertainty in the readValues
- Include at least 2 support, 2 resistance, and all trade setup lines
- Fibonacci levels must be calculated from actual swing points visible on the chart`;

async function fetchImageAsBase64(url: string): Promise<{ base64: string; mimeType: string }> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch image: ${res.status}`);
  const buffer = await res.arrayBuffer();
  const base64 = Buffer.from(buffer).toString("base64");
  const contentType = res.headers.get("content-type") || "image/jpeg";
  return { base64, mimeType: contentType };
}

function buildLiveContextBlock(
  priceData: PriceAgentResult | null,
  webResults: WebSearchResult[] | null
): string {
  if (!priceData && !webResults) return "";

  let block = `\n\nLIVE MARKET CONTEXT (from real-time data feeds — use this to validate and enhance your chart reading):\n`;

  if (priceData) {
    const last10 = priceData.recentCandles.slice(-10);
    const candleStr = last10
      .map((c) => `O:${c.open} H:${c.high} L:${c.low} C:${c.close} V:${c.volume.toFixed(0)}`)
      .join(" | ");

    block += `
PRICE DATA:
- Current Price: $${priceData.currentPrice.toLocaleString()}
- 24h Change: ${priceData.changePercent24h >= 0 ? "+" : ""}${priceData.changePercent24h.toFixed(2)}%
- 24h Volume: $${(priceData.volume24h / 1e6).toFixed(1)}M
- 24h High/Low: $${priceData.high24h.toLocaleString()} / $${priceData.low24h.toLocaleString()}
- Order Book: Bid depth $${(priceData.orderBook.bidDepthTotal / 1e6).toFixed(2)}M, Ask depth $${(priceData.orderBook.askDepthTotal / 1e6).toFixed(2)}M, Spread: $${priceData.orderBook.bidAskSpread.toFixed(2)}
- Recent 4H Candles (last 10): ${candleStr}
`;
  }

  if (webResults && webResults.length > 0) {
    const allResults = webResults.flatMap((w) => w.results);
    const headlines = allResults
      .slice(0, 5)
      .map((r) => `- ${r.title}: ${r.snippet}`)
      .join("\n");
    const sentiments = webResults.map((w) => w.sentiment);
    const overallSentiment = sentiments.includes("BULLISH") && sentiments.includes("BEARISH")
      ? "MIXED"
      : sentiments.find((s) => s !== "NEUTRAL") || "NEUTRAL";
    const keyEvents = webResults
      .flatMap((w) => w.keyEvents)
      .slice(0, 5)
      .map((e) => `- ${e}`)
      .join("\n");

    block += `
NEWS & SENTIMENT:
${headlines}
Overall Market Sentiment: ${overallSentiment}
Key Events:
${keyEvents}
`;
  }

  block += `
IMPORTANT: Cross-reference the chart's OCR price with the live current price.
If they diverge significantly, the chart may be stale — note this in your summary.
Factor news sentiment and order book imbalance into your probability estimates.`;

  return block;
}

function buildLiveContext(
  priceData: PriceAgentResult | null,
  webResults: WebSearchResult[] | null
): LiveContext | undefined {
  if (!priceData) return undefined;

  const allResults = webResults?.flatMap((w) => w.results) || [];
  const sentiments = webResults?.map((w) => w.sentiment) || [];
  const overallSentiment = sentiments.includes("BULLISH") && sentiments.includes("BEARISH")
    ? "MIXED"
    : sentiments.find((s) => s !== "NEUTRAL") || "NEUTRAL";

  const bidTotal = priceData.orderBook.bidDepthTotal;
  const askTotal = priceData.orderBook.askDepthTotal;
  const ratio = bidTotal / (askTotal || 1);
  const orderBookBias: LiveContext["orderBookBias"] =
    ratio > 1.3 ? "BUY_PRESSURE" : ratio < 0.7 ? "SELL_PRESSURE" : "BALANCED";

  return {
    currentPrice: priceData.currentPrice,
    change24h: priceData.changePercent24h,
    volume24h: priceData.volume24h,
    sentiment: overallSentiment,
    keyNews: allResults.slice(0, 3).map((r) => ({ title: r.title, snippet: r.snippet })),
    orderBookBias,
  };
}

export async function analyzeChart(
  imageUrl: string,
  priceData?: PriceAgentResult | null,
  webResults?: WebSearchResult[] | null,
  lang: string = "en"
): Promise<ChartAnalysisResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-pro",
    generationConfig: {
      responseMimeType: "application/json",
    },
  });

  const { base64, mimeType } = await fetchImageAsBase64(imageUrl);

  const liveBlock = buildLiveContextBlock(priceData || null, webResults || null);
  const langInstruction = lang === "ko"
    ? "\n\nIMPORTANT: Write ALL text fields (summary, professionalSummary, patterns, indicators values, volumeProfile, bollingerPosition, rsiDivergence, statisticalTargets timeframe, fibonacciLevels significance) in Korean (한국어). Keep technical terms (LONG, SHORT, BUY, SELL, NEUTRAL, BULLISH, BEARISH) in English. Price numbers stay as numbers."
    : "";
  const fullPrompt = CHART_ANALYSIS_PROMPT + (liveBlock || "") + langInstruction;

  const result = await model.generateContent([
    fullPrompt,
    {
      inlineData: {
        data: base64,
        mimeType,
      },
    },
  ]);

  const content = result.response.text();
  if (!content) {
    throw new Error("No analysis returned from AI");
  }

  const jsonStr = content.replace(/```json?\n?/g, "").replace(/```\n?/g, "").trim();
  const parsed: ChartAnalysisResult = JSON.parse(jsonStr);

  // Attach live context to the result
  parsed.liveContext = buildLiveContext(priceData || null, webResults || null);

  return parsed;
}
