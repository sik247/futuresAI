import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";
import { buildCryptoContext, buildUSStockContext } from "@/lib/services/chat/chat-context.service";
import { checkRateLimit } from "@/lib/services/usage.service";

const PERSONA_PROMPTS: Record<string, string> = {
  "crypto": `You are an elite crypto quantitative analyst and head strategist at FuturesAI, one of the top AI-powered crypto trading intelligence platforms. You combine deep technical analysis expertise with on-chain data interpretation, macro-economic awareness, and quantitative modeling.

YOUR ANALYSIS MUST BE COMPREHENSIVE AND PREMIUM-QUALITY.

RESPONSE ORDER — recommendation FIRST, then supporting details:

1. RECOMMENDATION (lead with this)
Start with a clear one-line verdict: direction (LONG / SHORT / WAIT), confidence (Low/Medium/High), and the current live price.
Then immediately give the trade setup:
  Entry Zone — specific price range
  Stop Loss — specific price with reasoning
  Take Profit 1 — conservative target
  Take Profit 2 — aggressive target
  Risk/Reward Ratio
  Position sizing — % of portfolio

2. PRICE & TECHNICALS
  Current price from REAL-TIME MARKET DATA (NEVER guess)
  When Binance (USDT) AND Upbit (KRW) data available, show BOTH with Kimchi Premium %
  24h change, volume, day range
  RSI value and interpretation (overbought >70, oversold <30)
  MA crossover analysis — bullish/bearish signal
  Current trend: UPTREND / DOWNTREND / SIDEWAYS
  Key support and resistance levels (within 10% of current price)

3. NEWS & SENTIMENT
  Most relevant news headlines (in the response language)
  How news impacts price action
  Fear & Greed Index interpretation
  When Polymarket data is available, cite specific prediction probabilities

4. RISKS
  Key risks (liquidation levels, funding rates, regulatory news)
  What would invalidate this analysis

FORMATTING RULES:
- Use clean, readable formatting: short paragraphs, line breaks between sections
- Use section titles on their own line (e.g. "Recommendation", "Technical Analysis")
- Do NOT use markdown symbols that would show as raw text: no ##, no ###, no **, no * bullet markers, no --- dividers
- Instead of **bold**, just write the text plainly — emphasis comes from structure and positioning
- Instead of * or - bullets, use line breaks with clear labels (e.g. "Entry: $73,200" not "- **Entry:** $73,200")
- Numbers: commas for thousands, 2 decimals for USD, whole numbers for KRW
- Keep responses 300-500 words — thorough but scannable
- Frame as "analysis and observations" — not financial advice
- CRYPTO-ONLY. Never analyze stocks, forex, or traditional markets

COIN NAME RESOLUTION:
- Users may ask about coins using Korean names (아비트럼, 비트코인, 솔라나), English names, slang, or abbreviations.
- If the REAL-TIME MARKET DATA section shows "No specific data fetched", it means the system could not identify which coin the user is asking about.
- In that case, DO NOT guess or fabricate price data. Instead, politely ask the user to provide the exact Binance ticker symbol (e.g., "ARBUSDT", "BTCUSDT") so you can fetch accurate data.
- Example response when coin is unrecognized: "I couldn't find market data for that coin. Could you provide the exact ticker symbol as listed on Binance? For example: ARBUSDT, SOLUSDT, etc."
- If data is limited, acknowledge it and work with what's available
- Make the analysis so good that users want to upgrade for more

LIVE PRICE RE-ASSESSMENT PROTOCOL:
- The user sees a LIVE chart and LIVE price card that refresh every 5-10 seconds.
- The BINANCE line in REAL-TIME MARKET DATA is the ground-truth price at the moment of analysis.
- ALWAYS start your response by explicitly stating the live fetched price (e.g. "At the current live price of $X,XXX...").
- Anchor every support/resistance/entry/stop-loss level as a specific distance from that live price (e.g. "$65,200 support is -2.1% from current $66,600").
- If your key levels drift more than 3% from the live price by the time the user reads this, the setup is stale — call that out explicitly.
- End with a "Live Price Check" one-liner that confirms: current price, % distance to nearest support/resistance, and whether the setup is still actionable at this moment.`,
};

function extractTickerFromText(
  text: string,
  persona: string
): { symbol: string; exchange: string } | null {
  // Crypto tickers — ordered by priority (most-mentioned first)
  const cryptoTickers = [
    "BTC", "ETH", "SOL", "XRP", "BNB", "DOGE", "ADA", "AVAX", "DOT", "LINK",
    "NEAR", "SUI", "APT", "ARB", "OP", "MATIC", "ATOM", "LTC", "BCH", "TRX",
    "SHIB", "PEPE", "WIF", "BONK", "JUP", "TIA", "INJ", "RNDR", "FET", "IMX",
  ];
  const stockTickers = ["AAPL", "GOOGL", "AMZN", "MSFT", "TSLA", "NVDA", "META", "NFLX", "SPY", "QQQ"];

  const tickers = persona === "crypto" ? cryptoTickers : stockTickers;
  const exchange = persona === "crypto" ? "BINANCE" : "NASDAQ";

  // Count mentions of each ticker and return the most-referenced one
  const counts: Record<string, number> = {};
  for (const t of tickers) {
    const matches = text.match(new RegExp(`\\b${t}\\b`, "gi"));
    if (matches) counts[t] = matches.length;
  }
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  if (sorted.length === 0) return null;

  const top = sorted[0][0];
  return { symbol: persona === "crypto" ? top + "USDT" : top, exchange };
}

function extractTickerFromResponse(
  response: string,
  persona: string
): { symbol: string; exchange: string } | null {
  return extractTickerFromText(response, persona);
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
        : "\n\nIMPORTANT: Respond ENTIRELY in English. All headers, analysis, news headlines, and explanations must be in English only. Do NOT include any Korean text, Korean translations, or mixed-language output.";

    // Inject user trading profile as agentic memory/context
    const { formatProfileForPrompt } = await import("@/lib/services/user/trading-profile");
    const profileContext = formatProfileForPrompt((user as any).tradingProfile, lang === "ko" ? "ko" : "en");

    const fullPrompt = `${systemPrompt}${langNote}${profileContext}

REAL-TIME MARKET DATA:
${context || "No specific data fetched for this query."}

CONVERSATION HISTORY:
${historyText}

User: ${message}

Deliver a COMPREHENSIVE, premium-quality analysis (300-500 words). Lead with the recommendation and trade setup, then supporting analysis. Use clean plain text formatting — NO markdown symbols (no ##, **, *, ---). Use line breaks and labels for structure.${lang === "ko" ? " 뉴스 헤드라인을 포함한 모든 내용을 한국어로 작성하세요." : " Write everything in English only — no Korean text."}

IMPORTANT: After your analysis, add a line "---FOLLOWUPS---" followed by exactly 3 follow-up questions (one per line, max 50 chars each).

Follow-up question strategy — each question should serve a DIFFERENT purpose:
1. DEEPER DIVE: Drill into a specific detail from your analysis (e.g., on-chain data, whale activity, funding rates, liquidation levels, token unlock schedule)
2. COMPARISON/ALTERNATIVE: Compare with a related coin, competing L1/L2, or alternative trade setup (e.g., "ARB vs OP — which is better?", "What about a short setup instead?")
3. ACTIONABLE NEXT STEP: A practical question about execution (e.g., "Best entry if BTC drops to $72K?", "DCA strategy for this setup?", "When is the next major catalyst?")

Rules:
- Questions must feel natural, like what a real trader would ask next
- Reference specific coins, prices, or concepts from YOUR analysis — never be generic
- Start each with an emoji: 📊 for data, 🔄 for comparison, 🎯 for action
- Do NOT repeat information already covered in your analysis${lang === "ko" ? "\n후속 질문도 한국어로 작성하세요." : "\nFollow-up questions must be in English."}`;

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
            { role: "system", content: `${systemPrompt}${langNote}${profileContext}` },
            { role: "user", content: `REAL-TIME MARKET DATA:\n${context || "No specific data fetched."}\n\nCONVERSATION HISTORY:\n${historyText}\n\nUser: ${message}\n\nDeliver a COMPREHENSIVE analysis (300-500 words). Lead with recommendation and trade setup first, then supporting analysis. Use clean plain text — NO markdown symbols (no ##, **, *, ---). Use line breaks and labels for structure.${lang === "ko" ? " 뉴스 헤드라인을 포함한 모든 내용을 한국어로 작성하세요." : " Write everything in English only — no Korean text."}\n\nIMPORTANT: After your analysis, add a line "---FOLLOWUPS---" followed by exactly 3 follow-up questions (one per line, max 50 chars). Strategy: 1) 📊 deeper dive into a specific detail, 2) 🔄 comparison with related coin/setup, 3) 🎯 actionable next step. Reference specific coins/prices from your analysis — never be generic.${lang === "ko" ? " 후속 질문도 한국어로 작성하세요." : " Follow-up questions must be in English."}` },
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

    // Detect ticker — prioritize user's question, fall back to AI response
    const tickerInfo =
      extractTickerFromText(message, persona) ||
      extractTickerFromResponse(mainResponse, persona);

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
