import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";
import { buildCryptoContext, buildUSStockContext } from "@/lib/services/chat/chat-context.service";
import { checkRateLimit } from "@/lib/services/usage.service";

const PERSONA_PROMPTS: Record<string, string> = {
  "crypto": `You are an elite crypto quantitative analyst and head strategist at FuturesAI, one of the top AI-powered crypto trading intelligence platforms. You combine deep technical analysis expertise with on-chain data interpretation, macro-economic awareness, and quantitative modeling.

YOUR ANALYSIS MUST BE COMPREHENSIVE AND PREMIUM-QUALITY:

## FORMAT (use markdown headers, bold, bullet points):

### 1. Price Overview
- ALWAYS use REAL-TIME MARKET DATA provided below. NEVER guess prices.
- When Binance (USDT) AND Upbit (KRW) data available: show BOTH prices side-by-side
- Calculate and display the Kimchi Premium percentage (critical for Korean users)
- Show 24h change, volume, and day range

### 2. Technical Analysis
- Reference specific RSI value and interpret it (overbought >70, oversold <30, neutral zone)
- MA7 vs MA20 crossover analysis — bullish/bearish signal
- Identify the current trend: UPTREND / DOWNTREND / SIDEWAYS with reasoning
- Key support and resistance levels (MUST be within 10% of current price)
- Chart pattern recognition if applicable (double top, ascending triangle, etc.)

### 3. Trading Strategy
- **Entry Zone:** specific price range for entry
- **Stop Loss:** specific price with reasoning (key support break)
- **Take Profit 1:** conservative target
- **Take Profit 2:** aggressive target
- **Risk/Reward Ratio:** calculate and display
- **Position sizing recommendation:** % of portfolio
- **Direction:** LONG / SHORT / WAIT with confidence level

### 4. News, Sentiment & Prediction Markets
- Summarize the most relevant news headlines affecting this asset
- Translate news titles to the user's language
- Explain HOW the news impacts price action
- Fear & Greed Index interpretation
- When PREDICTION MARKETS (Polymarket) data is available, cite specific prediction probabilities
  Example: "Polymarket shows 36% probability BTC hits $100K by 2026, supporting a cautious long bias"
- Use prediction market odds to validate or challenge your technical analysis

### 5. Risk Assessment
- Key risks to watch (liquidation levels, funding rates, regulatory news)
- What would invalidate this analysis
- Volatility warning

CRITICAL RULES:
- Deliver 300-500 word responses. This is a PREMIUM product — be thorough.
- Use markdown: ### headers, **bold** for key levels, * bullet points
- Every number must come from the REAL-TIME DATA. Never fabricate prices.
- Format numbers: commas for thousands, 2 decimals for USD, whole numbers for KRW
- Include the ticker symbol always (BTC, ETH, SOL)
- Frame as "analysis and observations" — not financial advice
- CRYPTO-ONLY. Never analyze stocks, forex, or traditional markets.
- Show confidence level for your recommendation (Low/Medium/High)
- If data is limited, acknowledge it and work with what's available
- Make the analysis so good that users want to upgrade for more`,
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

    // Rolling rate limit (admin: unlimited)
    if (user.role !== "ADMIN") {
      const rateCheck = await checkRateLimit(user.id, user.isPremium, "chat", user.credits);
      if (!rateCheck.allowed) {
        return NextResponse.json(
          {
            error: "rate_limit",
            shouldUpgrade: rateCheck.shouldUpgrade,
            retryAfterMinutes: rateCheck.retryAfterMinutes,
            tier: rateCheck.tier,
          },
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
    let tweets: { author: string; text: string; url: string }[] = [];
    let detectedSymbol: string | null = null;
    if (persona === "crypto") {
      const result = await buildCryptoContext(message);
      context = result.context;
      newsArticles = result.newsArticles;
      tweets = result.tweets;
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
        ? "\n\nIMPORTANT: 한국어로 답변하세요. 금융 전문 용어를 사용하고 존댓말로 작성하세요. 뉴스 헤드라인도 한국어로 번역하세요. 예: 시장 전망, 저항선, 지지선, 매수/매도, 변동성, 수익률, 시가총액, 손절매, 익절, 진입가, 리스크/리워드 비율. 기술적 분석 용어는 영어로 유지하세요 (RSI, MACD, EMA, MA 등). 분석은 전문적이고 상세하게 작성하여 사용자가 프리미엄 서비스의 가치를 느낄 수 있도록 하세요."
        : "";

    const fullPrompt = `${systemPrompt}${langNote}

REAL-TIME MARKET DATA:
${context || "No specific data fetched for this query."}

CONVERSATION HISTORY:
${historyText}

User: ${message}

Deliver a COMPREHENSIVE, premium-quality analysis (300-500 words). Use markdown formatting with ### headers, **bold** for key numbers, and * bullet points. Include specific entry/exit strategy with stop loss and take profit levels. Translate all news headlines to the user's language. Make the analysis so thorough and actionable that it demonstrates the full power of FuturesAI.

IMPORTANT: After your analysis, add a line "---FOLLOWUPS---" followed by exactly 3 short follow-up questions the user might want to ask next (one per line). These should be relevant to the conversation and encourage deeper analysis. Keep each under 40 characters.`;

    // Call AI — Gemini primary, GPT-5.4 fallback
    let response = "";
    let usedModel = "gemini-2.5-pro";

    const geminiKey = process.env.GEMINI_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;

    if (!geminiKey && !openaiKey) {
      return NextResponse.json({ error: "AI not configured" }, { status: 500 });
    }

    // Try Gemini first
    if (geminiKey) {
      try {
        const genAI = new GoogleGenerativeAI(geminiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });
        const result = await model.generateContent(fullPrompt);
        response = result.response.text();
      } catch (geminiErr) {
        console.warn("[Chat] Gemini failed, trying GPT-5.4 fallback:", geminiErr instanceof Error ? geminiErr.message : geminiErr);
        response = ""; // Reset to trigger fallback
      }
    }

    // Fallback to GPT-5.4 if Gemini failed or unavailable
    if (!response && openaiKey) {
      try {
        const openai = new OpenAI({ apiKey: openaiKey });
        const completion = await openai.chat.completions.create({
          model: "gpt-5.4",
          messages: [
            { role: "system", content: `${systemPrompt}${langNote}` },
            { role: "user", content: `REAL-TIME MARKET DATA:\n${context || "No specific data fetched."}\n\nCONVERSATION HISTORY:\n${historyText}\n\nUser: ${message}\n\nDeliver a COMPREHENSIVE, premium-quality analysis (300-500 words). Use markdown formatting with ### headers, **bold** for key numbers, and * bullet points. Include specific entry/exit strategy with stop loss and take profit levels. Translate all news headlines to the user's language.\n\nIMPORTANT: After your analysis, add a line "---FOLLOWUPS---" followed by exactly 3 short follow-up questions (one per line, under 40 chars each).` },
          ],
          max_tokens: 2000,
          temperature: 0.7,
        });
        response = completion.choices[0]?.message?.content || "";
        usedModel = "gpt-5.4";
      } catch (gptErr) {
        console.error("[Chat] GPT-5.4 also failed:", gptErr instanceof Error ? gptErr.message : gptErr);
        return NextResponse.json({ error: "AI service temporarily unavailable" }, { status: 503 });
      }
    }

    if (!response) {
      return NextResponse.json({ error: "AI service temporarily unavailable" }, { status: 503 });
    }

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

    // Detect all coin tickers mentioned in the response for inline price cards
    const mentionedCoins: string[] = [];
    const coinPatterns = ["BTC", "ETH", "SOL", "XRP", "BNB", "DOGE", "ADA", "AVAX", "DOT", "LINK", "NEAR", "SUI", "APT", "ARB"];
    for (const coin of coinPatterns) {
      if (new RegExp(`\\b${coin}\\b`).test(mainResponse)) mentionedCoins.push(coin);
    }

    return NextResponse.json({
      response: mainResponse,
      ticker: tickerInfo ? { symbol: tickerInfo.symbol, exchange: tickerInfo.exchange } : null,
      mentionedCoins,
      news: newsArticles,
      tweets,
      followUps,
      internalLinks,
      dataSources: {
        binance: context.includes("BINANCE") || context.includes("/USD"),
        upbit: context.includes("UPBIT"),
        technicals: context.includes("TECHNICALS"),
        fearGreed: context.includes("FEAR & GREED"),
        news: newsArticles.length > 0,
        twitter: tweets.length > 0,
        polymarket: context.includes("PREDICTION MARKETS"),
        webSearch: context.includes("WEB SEARCH"),
      },
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
