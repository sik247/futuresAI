import { GoogleGenerativeAI } from "@google/generative-ai";

export type OCROrder = {
  pair: string;       // e.g. "BTCUSDT"
  side: "BUY" | "SELL";
  quantity: number;
  price: number;
  total: number;      // price * quantity
  date?: string;      // ISO date if visible
  pnl?: number;       // realized P&L if visible
  fee?: number;
};

const ORDER_OCR_PROMPT = `You are a financial data extraction specialist. Analyze this screenshot of a crypto exchange order history, trade history, or position list.

Extract each trade/order visible in the screenshot. For each order, extract:
- pair: The trading pair (e.g., "BTCUSDT", "ETHUSDT"). Include the quote currency.
- side: "BUY" or "SELL"
- quantity: The amount/size of the order (number)
- price: The execution/entry price in USD (number)
- total: price * quantity (calculate if not shown)
- date: The date/time of the order in ISO format (e.g., "2026-03-25") if visible. If not, omit.
- pnl: Realized profit/loss if visible (number, positive for profit, negative for loss). If not visible, omit.
- fee: Trading fee if visible (number). If not visible, omit.

Rules:
- Extract ALL visible orders, not just open ones
- Handle various exchange formats (Binance, Bybit, OKX, Bitget, etc.)
- If the screenshot shows a position (not individual orders), extract the position data as a single entry
- For futures/perp positions: include the leverage info in the pair if visible (e.g., "BTCUSDT 10x")
- If you see Korean text, parse it correctly (매수=BUY, 매도=SELL, 수량=quantity, 가격=price)
- Normalize pairs: always use UPPERCASE with USDT suffix

Return a JSON array of objects.

Example: [{"pair":"BTCUSDT","side":"BUY","quantity":0.1,"price":71000,"total":7100,"date":"2026-03-25","pnl":150}]`;

const CSV_PARSE_PROMPT = `You are a financial data parser. Parse this CSV/spreadsheet data containing crypto trade history.

Extract each trade row. For each trade, extract:
- pair: Trading pair (e.g., "BTCUSDT")
- side: "BUY" or "SELL"
- quantity: Amount traded
- price: Execution price
- total: Total value
- date: Date if available (ISO format)
- pnl: P&L if available
- fee: Fee if available

Handle various CSV formats from different exchanges. Column headers may be in English or Korean.
Common Korean headers: 거래쌍, 종류(매수/매도), 수량, 가격, 체결금액, 날짜, 수수료

Return a JSON array of objects.`;

async function fetchImageAsBase64(
  url: string
): Promise<{ data: string; mimeType: string }> {
  const response = await fetch(url);
  const buffer = await response.arrayBuffer();
  const data = Buffer.from(buffer).toString("base64");
  const mimeType = response.headers.get("content-type") || "image/png";
  return { data, mimeType };
}

export async function parseOrderScreenshot(
  imageUrl: string
): Promise<OCROrder[]> {
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
          { text: ORDER_OCR_PROMPT },
        ],
      },
    ],
    generationConfig: {
      responseMimeType: "application/json",
    },
  });

  const text = result.response.text();
  return parseOrderJSON(text);
}

export async function parseOrderCSV(csvText: string): Promise<OCROrder[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY not configured");

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const result = await model.generateContent({
    contents: [
      {
        role: "user",
        parts: [{ text: `${CSV_PARSE_PROMPT}\n\nCSV Data:\n${csvText}` }],
      },
    ],
    generationConfig: {
      responseMimeType: "application/json",
    },
  });

  const text = result.response.text();
  return parseOrderJSON(text);
}

function parseOrderJSON(text: string): OCROrder[] {
  try {
    const parsed = JSON.parse(text);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter((o: any) => o.pair && o.quantity > 0 && o.price > 0)
      .map((o: any) => ({
        pair: String(o.pair).toUpperCase(),
        side: o.side === "SELL" ? "SELL" as const : "BUY" as const,
        quantity: Number(o.quantity),
        price: Number(o.price),
        total: Number(o.total || o.quantity * o.price),
        date: o.date || undefined,
        pnl: o.pnl != null ? Number(o.pnl) : undefined,
        fee: o.fee != null ? Number(o.fee) : undefined,
      }));
  } catch {
    return [];
  }
}
