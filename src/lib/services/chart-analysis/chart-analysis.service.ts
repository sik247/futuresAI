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

const CHART_ANALYSIS_PROMPT = `You are a senior quantitative analyst at a top-tier proprietary trading firm. You are preparing a chart analysis report for the risk committee. Your analysis must be precise, data-driven, and actionable.

## PHASE 1: OPTICAL DATA EXTRACTION (OCR)

Read the chart image with extreme precision:

1. **Price Axis (Y-axis):** Extract exact prices at gridlines. Note the scale (linear/log).
2. **Time Axis (X-axis):** Identify timeframe (1m/5m/15m/1H/4H/1D/1W) and date range.
3. **Last Candle:** Read the exact OHLC of the most recent candle.
4. **Indicator Panels:** Read exact values — RSI number, MACD histogram height, Bollinger Band levels, EMA/SMA values. If not visible, state "Not visible on chart" — never fabricate.
5. **Volume:** Note if volume is increasing/decreasing on recent candles. Identify any volume climax bars.

## PHASE 2: MARKET STRUCTURE ANALYSIS

Analyze the chart's structure before making any trade decisions:

1. **Trend Identification:** Is price making higher highs + higher lows (uptrend), lower highs + lower lows (downtrend), or range-bound? Reference specific swing points with prices.
2. **Key Levels:** Identify horizontal support/resistance from multiple touches. These are levels where price previously reversed — minimum 2 touches to qualify.
3. **Pattern Recognition:** Identify only CONFIRMED or FORMING patterns (not speculative). Include: Head & Shoulders, Double Top/Bottom, Triangles (ascending/descending/symmetrical), Wedges, Flags, Channels, Cup & Handle. Specify if pattern is confirmed or still forming.
4. **Moving Average Analysis:** Where is price relative to visible MAs? Any crossovers? Are MAs fanning (trending) or converging (consolidating)?

## PHASE 3: QUANTITATIVE ANALYSIS

Apply mathematical rigor:

1. **Fibonacci Retracement:** Draw from the most prominent swing high to swing low visible on chart. Calculate levels at 0.236, 0.382, 0.5, 0.618, 0.786. Note which levels align with horizontal S/R (confluence).
2. **RSI Analysis:** Current value, overbought (>70) / oversold (<30) status. Check for divergences: bullish divergence (price lower low + RSI higher low) or bearish divergence (price higher high + RSI lower high).
3. **Volume Profile:** Is volume confirming or diverging from price movement? Rising price + rising volume = healthy. Rising price + falling volume = weak/distribution.
4. **Bollinger Band Position:** Is price at upper/lower band? Is there a Bollinger squeeze (narrowing bands)? A squeeze often precedes a large move.
5. **Statistical Targets:** For each key level, estimate probability of price reaching it based on: distance from current price, trend alignment, volume support, number of previous tests, and Fibonacci confluence.

## PHASE 4: TRADE STRATEGY

Construct a professional trade setup:

1. **Direction:** LONG, SHORT, or NEUTRAL. Must align with trend and indicator confluence.
2. **Entry:** Choose a logical entry — at a support bounce, resistance break, or pullback to MA. Not just the current price.
3. **Stop Loss:** Below the nearest support (for longs) or above the nearest resistance (for shorts). Must be at a level that invalidates the thesis — not arbitrary.
4. **Take Profit:** At the next significant resistance (for longs) or support (for shorts). Should have historical significance.
5. **Risk:Reward:** Must be at least 1:1.5. If the setup doesn't offer this, direction should be NEUTRAL.
6. **Confidence:** 0-100 based on: indicator alignment, volume confirmation, pattern clarity, trend support.

## PHASE 5: CHART OVERLAY LINES

Generate precise overlay lines for the chart image:

- yPercent = vertical position on the image (0 = top of image, 100 = bottom of image)
- Map each price level to its approximate vertical position based on the Y-axis you read in Phase 1
- Colors: support=#22c55e, resistance=#ef4444, entry=#3b82f6, stopLoss=#ef4444, takeProfit=#22c55e, trend=#f59e0b
- Include at minimum: 2 supports, 2 resistances, entry, stopLoss, takeProfit
- hitProbability = estimated % chance price reaches this level within the chart's timeframe

## OUTPUT FORMAT

Return a JSON object with this exact structure:

{
  "summary": "2-3 sentence institutional-grade overview referencing specific prices and probabilities",
  "trend": "BULLISH" | "BEARISH" | "NEUTRAL" | "CONSOLIDATING",
  "patterns": ["Pattern 1 (confirmed/forming)", "Pattern 2"],
  "supportLevels": [price1, price2, price3],
  "resistanceLevels": [price1, price2, price3],
  "indicators": [
    {"name": "RSI (14)", "value": "exact value or 'Not visible'", "signal": "BUY" | "SELL" | "NEUTRAL"},
    {"name": "MACD", "value": "histogram and signal line status", "signal": "BUY" | "SELL" | "NEUTRAL"},
    {"name": "Volume", "value": "volume trend description", "signal": "BUY" | "SELL" | "NEUTRAL"},
    {"name": "Bollinger Bands", "value": "position relative to bands", "signal": "BUY" | "SELL" | "NEUTRAL"},
    {"name": "Moving Averages", "value": "crossover status and price position", "signal": "BUY" | "SELL" | "NEUTRAL"}
  ],
  "tradeSetup": {
    "direction": "LONG" | "SHORT" | "NEUTRAL",
    "entry": exact_price,
    "stopLoss": exact_price,
    "takeProfit": exact_price,
    "riskReward": "1:X.X",
    "confidence": 0-100
  },
  "riskScore": 1-10,
  "confidence": 0-100,
  "ocrData": {
    "currentPrice": exact_price_from_chart,
    "priceRange": {"high": highest_visible, "low": lowest_visible},
    "timeframe": "4H",
    "visibleIndicators": ["RSI 14", "MACD 12,26,9"],
    "readValues": {"RSI": "58.3", "MACD": "-125.4"}
  },
  "quantAnalysis": {
    "fibonacciLevels": [
      {"level": "0.236", "price": number, "significance": "description + confluence note"},
      {"level": "0.382", "price": number, "significance": "description"},
      {"level": "0.5", "price": number, "significance": "description"},
      {"level": "0.618", "price": number, "significance": "description"},
      {"level": "0.786", "price": number, "significance": "description"}
    ],
    "bollingerPosition": "detailed description",
    "rsiValue": number_or_null,
    "rsiDivergence": "description" | null,
    "volumeProfile": "detailed analysis with specific observations",
    "statisticalTargets": [
      {"price": number, "probability": 0-100, "timeframe": "within X days"}
    ]
  },
  "lines": [
    {"type": "support|resistance|trend|entry|stopLoss|takeProfit", "yPercent": 0-100, "label": "S1 $price", "color": "hex", "dashed": boolean, "hitProbability": 0-100}
  ],
  "professionalSummary": {
    "executiveSummary": "2-3 sentence summary for a portfolio manager — mention direction, key levels, and risk/reward",
    "marketStructure": "Current phase: accumulation/distribution/markup/markdown. Key swing points with prices.",
    "tradingThesis": "Clear thesis: WHY this direction, WHAT confluence supports it, WHAT invalidates it",
    "keyRisks": ["Specific risk with price level that would invalidate the trade", "Risk 2"],
    "keyCatalysts": ["What could accelerate the move with timeframe", "Catalyst 2"]
  }
}

## RULES
- Use ONLY prices read from the chart. Never fabricate values.
- If an indicator is not visible, state "Not visible on chart" — do not guess its value.
- All price levels must be within the visible range of the chart.
- Support levels must be BELOW current price. Resistance must be ABOVE.
- Stop loss must be on the opposite side of entry from take profit.
- yPercent must accurately map to the price's position on the chart image.
- CRITICAL: Ensure minimum 4% vertical spacing between adjacent lines (yPercent values). If two levels are too close, merge them or drop the less significant one. Overlapping labels make the chart unreadable.
- Maximum 8 lines total. Prioritize: entry > stopLoss > takeProfit > strongest support > strongest resistance > trend. Drop weak levels rather than overcrowding.
- Write with the precision of a research analyst at Goldman Sachs or Two Sigma.`;

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
