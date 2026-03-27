import { GoogleGenerativeAI } from "@google/generative-ai";

export type OCRHolding = {
  symbol: string;
  quantity: number;
  avgBuyPrice: number;
};

const PORTFOLIO_OCR_PROMPT = `You are a financial data extraction specialist. Analyze this screenshot of a crypto exchange portfolio/wallet.

Extract each cryptocurrency holding visible in the screenshot. For each holding, extract:
- symbol: The ticker symbol (e.g., BTC, ETH, SOL)
- quantity: The amount held (number)
- avgBuyPrice: The average buy/entry price in USD (number). If not visible, use 0.

Rules:
- Only extract actual holdings with non-zero quantities
- Ignore stablecoins (USDT, USDC, DAI, BUSD) unless they have significant quantity
- If you see a total USD value but no buy price, set avgBuyPrice to 0
- Clean up symbols: remove suffixes like "USDT", just return the base symbol

Return a JSON array of objects with exactly these fields: symbol, quantity, avgBuyPrice

Example: [{"symbol":"BTC","quantity":0.5,"avgBuyPrice":42000},{"symbol":"ETH","quantity":10,"avgBuyPrice":2200}]`;

async function fetchImageAsBase64(
  url: string
): Promise<{ data: string; mimeType: string }> {
  const response = await fetch(url);
  const buffer = await response.arrayBuffer();
  const data = Buffer.from(buffer).toString("base64");
  const mimeType = response.headers.get("content-type") || "image/png";
  return { data, mimeType };
}

export async function parsePortfolioScreenshot(
  imageUrl: string
): Promise<OCRHolding[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY not configured");

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-pro",
  });

  const { data, mimeType } = await fetchImageAsBase64(imageUrl);

  const result = await model.generateContent({
    contents: [
      {
        role: "user",
        parts: [
          { inlineData: { data, mimeType } },
          { text: PORTFOLIO_OCR_PROMPT },
        ],
      },
    ],
    generationConfig: {
      responseMimeType: "application/json",
    },
  });

  const text = result.response.text();
  const parsed = JSON.parse(text);

  if (!Array.isArray(parsed)) return [];

  return parsed
    .filter(
      (h: { symbol?: string; quantity?: number }) =>
        h.symbol && typeof h.quantity === "number" && h.quantity > 0
    )
    .map((h: { symbol: string; quantity: number; avgBuyPrice?: number }) => ({
      symbol: h.symbol.toUpperCase().replace(/USDT$/, ""),
      quantity: h.quantity,
      avgBuyPrice: h.avgBuyPrice || 0,
    }));
}
