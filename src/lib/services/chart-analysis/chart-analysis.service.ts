import { GoogleGenerativeAI } from "@google/generative-ai";

const ANALYSIS_COST = 50.0; // 50 USDT per analysis

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
  ]
}

CRITICAL RULES:
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

export async function analyzeChart(
  imageUrl: string
): Promise<ChartAnalysisResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-pro-preview-06-05",
    generationConfig: {
      responseMimeType: "application/json",
    },
  });

  const { base64, mimeType } = await fetchImageAsBase64(imageUrl);

  const result = await model.generateContent([
    CHART_ANALYSIS_PROMPT,
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

  // Parse JSON (responseMimeType should give clean JSON, but strip markdown as fallback)
  const jsonStr = content.replace(/```json?\n?/g, "").replace(/```\n?/g, "").trim();
  const parsed: ChartAnalysisResult = JSON.parse(jsonStr);

  return parsed;
}

export { ANALYSIS_COST };
