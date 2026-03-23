import { GoogleGenerativeAI } from "@google/generative-ai";

const ANALYSIS_COST = 5.0; // $5 or 5 USDT per analysis

export type ChartAnalysisResult = {
  summary: string;
  trend: string; // "BULLISH" | "BEARISH" | "NEUTRAL" | "CONSOLIDATING"
  patterns: string[]; // detected chart patterns
  supportLevels: number[]; // price levels
  resistanceLevels: number[]; // price levels
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
    confidence: number; // 0-100
  };
  riskScore: number; // 1-10
  confidence: number; // 0-100
  lines: ChartLine[];
};

export type ChartLine = {
  type: "support" | "resistance" | "trend" | "entry" | "stopLoss" | "takeProfit";
  yPercent: number; // 0-100 from top of image
  label: string;
  color: string;
  dashed: boolean;
};

const CHART_ANALYSIS_PROMPT = `You are an expert quantitative crypto/forex chart analyst. Analyze this trading chart image and provide a detailed technical analysis.

Return your analysis as a JSON object with EXACTLY this structure (no markdown, no code blocks, just raw JSON):

{
  "summary": "2-3 sentence overview of the chart setup and market context",
  "trend": "BULLISH" or "BEARISH" or "NEUTRAL" or "CONSOLIDATING",
  "patterns": ["pattern1", "pattern2"],
  "supportLevels": [price1, price2, price3],
  "resistanceLevels": [price1, price2, price3],
  "indicators": [
    {"name": "RSI", "value": "estimated value or range", "signal": "BUY" or "SELL" or "NEUTRAL"},
    {"name": "MACD", "value": "description", "signal": "BUY" or "SELL" or "NEUTRAL"},
    {"name": "Volume", "value": "description", "signal": "BUY" or "SELL" or "NEUTRAL"},
    {"name": "Moving Averages", "value": "description", "signal": "BUY" or "SELL" or "NEUTRAL"}
  ],
  "tradeSetup": {
    "direction": "LONG" or "SHORT" or "NEUTRAL",
    "entry": estimated_entry_price,
    "stopLoss": estimated_stop_loss,
    "takeProfit": estimated_take_profit,
    "riskReward": "1:2.5",
    "confidence": 75
  },
  "riskScore": 7,
  "confidence": 75,
  "lines": [
    {"type": "support", "yPercent": 75, "label": "Support $X", "color": "#22c55e", "dashed": false},
    {"type": "resistance", "yPercent": 25, "label": "Resistance $X", "color": "#ef4444", "dashed": false},
    {"type": "trend", "yPercent": 50, "label": "Trendline", "color": "#f59e0b", "dashed": true},
    {"type": "entry", "yPercent": 45, "label": "Entry $X", "color": "#3b82f6", "dashed": false},
    {"type": "stopLoss", "yPercent": 80, "label": "SL $X", "color": "#ef4444", "dashed": true},
    {"type": "takeProfit", "yPercent": 15, "label": "TP $X", "color": "#22c55e", "dashed": true}
  ]
}

IMPORTANT for lines:
- yPercent represents vertical position on the chart image (0 = top, 100 = bottom)
- Place support lines near the bottom (higher yPercent), resistance near the top (lower yPercent)
- Include entry, stop loss, and take profit lines based on your trade setup
- Use realistic positions based on what you see in the chart
- Include 2-3 support levels, 2-3 resistance levels, and the trade setup lines

Be specific with price levels if visible on the chart. If prices aren't clearly visible, estimate based on the chart structure and use relative positioning for the lines.`;

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
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  // Fetch image and convert to base64 for Gemini
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

  // Parse JSON response (strip any markdown code blocks if present)
  const jsonStr = content.replace(/```json?\n?/g, "").replace(/```\n?/g, "").trim();
  const parsed: ChartAnalysisResult = JSON.parse(jsonStr);

  return parsed;
}

export { ANALYSIS_COST };
