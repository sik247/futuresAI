import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { buildCryptoContext, buildUSStockContext } from "@/lib/services/chat/chat-context.service";
import { checkDailyLimit } from "@/lib/services/usage.service";

const PERSONA_PROMPTS: Record<string, string> = {
  "crypto": `You are an elite crypto quantitative analyst at FuturesAI. You have deep expertise in blockchain technology, DeFi protocols, and crypto derivatives markets.

CRITICAL RULES:
- ALWAYS use the REAL-TIME MARKET DATA provided below for current prices. NEVER guess prices.
- When both Binance (USDT) and Upbit (KRW) data is available, ALWAYS mention BOTH prices and the Kimchi Premium. This is critical for Korean users.
- Support and resistance levels MUST be within 15% of the current price.
- Entry, Stop Loss, and Take Profit levels must be realistic (SL within 5-10%, TP within 10-20%).
- Always reference specific prices, percentages, RSI, and MA levels from the provided market data.
- When TECHNICALS data is provided, use RSI and MA values to support your analysis. Mention overbought (>70) or oversold (<30) conditions.
- Structure your response clearly with sections: Price Overview (both exchanges), Technical Analysis, and Recommendation.
- Keep responses to 80-150 words. Use bullet points for key levels.
- Be direct, actionable, and data-driven.
- When mentioning a specific asset, always include its ticker symbol (BTC, ETH, SOL, etc.)
- Include risk warnings when giving trade ideas.
- Never give financial advice — frame as analysis and observations.
- You are a CRYPTO-ONLY analyst. Do NOT analyze stocks, forex, or traditional markets.
- Format numbers professionally: use commas for thousands, 2 decimal places for USD, whole numbers for KRW.`,
};

function extractTickerFromResponse(
  response: string,
  persona: string
): { symbol: string; exchange: string } | null {
  const cryptoTickers = ["BTC", "ETH", "SOL", "XRP", "BNB", "DOGE", "ADA", "AVAX", "DOT", "LINK"];
  const stockTickers = ["AAPL", "GOOGL", "AMZN", "MSFT", "TSLA", "NVDA", "META", "NFLX", "SPY", "QQQ"];

  const tickers = persona === "crypto" ? cryptoTickers : stockTickers;
  const exchange = persona === "crypto" ? "BINANCE" : "NASDAQ";

  for (const t of tickers) {
    if (new RegExp(`\\b${t}\\b`, "i").test(response)) {
      return { symbol: persona === "crypto" ? t + "USDT" : t, exchange };
    }
  }
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const { message, persona, sessionId, lang } = await req.json();
    if (!message || !persona || !sessionId) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // Daily chat limit (free: 10/day, premium: 30/day, admin: unlimited)
    if (user.role !== "ADMIN") {
      const { allowed, used, limit } = await checkDailyLimit(user.id, user.isPremium, "chat");
      if (!allowed) {
        return NextResponse.json(
          { error: "Daily message limit reached", used, limit },
          { status: 429 }
        );
      }
    }

    // Save user message
    await prisma.chatMessage.create({
      data: { sessionId, role: "user", content: message, persona, userId: user.id },
    });

    // Fetch context based on persona
    let context = "";
    let newsArticles: { title: string; url: string; source: string }[] = [];
    let detectedSymbol: string | null = null;
    if (persona === "crypto") {
      const result = await buildCryptoContext(message);
      context = result.context;
      newsArticles = result.newsArticles;
      detectedSymbol = result.detectedSymbol;
    }

    // Get recent conversation history (last 10 messages)
    const history = await prisma.chatMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: "desc" },
      take: 10,
    });
    const historyText = history
      .reverse()
      .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
      .join("\n");

    // Build Gemini prompt
    const systemPrompt = PERSONA_PROMPTS[persona] || PERSONA_PROMPTS["crypto"];
    const langNote =
      lang === "ko"
        ? "\n\nIMPORTANT: 한국어로 답변하세요. 금융 전문 용어를 사용하고 존댓말로 작성하세요. 예: 시장 전망, 저항선, 지지선, 매수/매도, 변동성, 수익률, 시가총액. 기술적 분석 용어는 영어로 유지하세요 (RSI, MACD, EMA 등)."
        : "";

    const fullPrompt = `${systemPrompt}${langNote}

REAL-TIME MARKET DATA:
${context || "No specific data fetched for this query."}

CONVERSATION HISTORY:
${historyText}

User: ${message}

Respond concisely (80-150 words unless asked for more). Be specific with numbers.

IMPORTANT: After your analysis, add a line "---FOLLOWUPS---" followed by exactly 3 short follow-up questions the user might want to ask next (one per line). These should be relevant to the conversation and encourage deeper analysis. Keep each under 40 characters.`;

    // Call Gemini
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "AI not configured" }, { status: 500 });

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });
    const result = await model.generateContent(fullPrompt);
    const response = result.response.text();

    // Parse follow-up questions from response
    let mainResponse = response;
    let followUps: string[] = [];
    if (response.includes("---FOLLOWUPS---")) {
      const [main, followUpSection] = response.split("---FOLLOWUPS---");
      mainResponse = main.trim();
      followUps = followUpSection
        .trim()
        .split("\n")
        .map((q: string) => q.replace(/^[-•*\d.)\s]+/, "").trim())
        .filter((q: string) => q.length > 0)
        .slice(0, 3);
    }

    // Detect ticker from AI response
    const tickerInfo = extractTickerFromResponse(mainResponse, persona);

    // Build internal page links based on detected symbol and query content
    const internalLinks: { label: string; path: string; type: string }[] = [];
    const lowerMsg = message.toLowerCase();
    if (detectedSymbol || tickerInfo) {
      internalLinks.push({ label: lang === "ko" ? "실시간 차트 보기" : "View Live Chart", path: `/${lang}/charts`, type: "chart" });
    }
    if (lowerMsg.includes("whale") || lowerMsg.includes("고래") || lowerMsg.includes("on-chain") || lowerMsg.includes("온체인")) {
      internalLinks.push({ label: lang === "ko" ? "고래 트래커" : "Whale Tracker", path: `/${lang}/whales`, type: "whale" });
    }
    if (lowerMsg.includes("fear") || lowerMsg.includes("greed") || lowerMsg.includes("공포") || lowerMsg.includes("탐욕") || lowerMsg.includes("sentiment") || lowerMsg.includes("심리")) {
      internalLinks.push({ label: lang === "ko" ? "시장 데이터" : "Market Data", path: `/${lang}/charts`, type: "market" });
    }
    if (lowerMsg.includes("signal") || lowerMsg.includes("시그널") || lowerMsg.includes("rsi") || lowerMsg.includes("macd")) {
      internalLinks.push({ label: lang === "ko" ? "퀀트 시그널" : "Quant Signals", path: `/${lang}/quant`, type: "signal" });
    }
    // Always add news link
    internalLinks.push({ label: lang === "ko" ? "최신 뉴스" : "Latest News", path: `/${lang}/news`, type: "news" });

    // Save assistant message
    await prisma.chatMessage.create({
      data: {
        sessionId,
        role: "assistant",
        content: mainResponse,
        persona,
        ticker: tickerInfo ? `${tickerInfo.exchange}:${tickerInfo.symbol}` : null,
        userId: user.id,
      },
    });

    return NextResponse.json({
      response: mainResponse,
      ticker: tickerInfo ? { symbol: tickerInfo.symbol, exchange: tickerInfo.exchange } : null,
      news: newsArticles,
      followUps,
      internalLinks,
    });
  } catch (error) {
    console.error("[Chat API]", error);
    return NextResponse.json({ error: "Chat failed" }, { status: 500 });
  }
}

// GET: Fetch chat history
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const sessionId = req.nextUrl.searchParams.get("sessionId");

  if (sessionId) {
    const messages = await prisma.chatMessage.findMany({
      where: { sessionId, userId: user.id },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json({ messages });
  }

  // Get list of sessions
  const sessions = await prisma.chatMessage.findMany({
    where: { userId: user.id, role: "user" },
    distinct: ["sessionId"],
    orderBy: { createdAt: "desc" },
    take: 20,
    select: { sessionId: true, content: true, persona: true, createdAt: true },
  });
  return NextResponse.json({ sessions });
}
