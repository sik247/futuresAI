import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { buildCryptoContext, buildUSStockContext, extractTicker } from "@/lib/services/chat/chat-context.service";

const PERSONA_PROMPTS: Record<string, string> = {
  "crypto": `You are an elite crypto quant analyst at FuturesAI. Provide data-driven insights using the real-time market data provided below. Reference specific prices, percentages, and levels. Keep responses to 50-100 words unless the user asks for depth. Be direct and actionable. If you reference a specific asset, include its ticker symbol.`,
  "us-stocks": `You are a Wall Street quantitative analyst at FuturesAI. Provide concise, data-driven insights on US stocks using the real-time data provided below. Reference specific prices, P/E ratios, earnings dates, and macro factors. Keep responses to 50-100 words unless the user asks for depth. Be direct and actionable. If you reference a specific stock, include its ticker symbol.`,
};

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // Check access: admin always allowed, others need chatEnabled
    if (user.role !== "ADMIN" && !user.chatEnabled) {
      return NextResponse.json({ error: "Chat access required. Contact admin." }, { status: 403 });
    }

    const { message, persona, sessionId, lang } = await req.json();
    if (!message || !persona || !sessionId) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // Rate limit: 50 messages/day
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const msgCount = await prisma.chatMessage.count({
      where: { userId: user.id, role: "user", createdAt: { gte: today } },
    });
    if (user.role !== "ADMIN" && msgCount >= 50) {
      return NextResponse.json({ error: "Daily message limit reached (50/day)" }, { status: 429 });
    }

    // Save user message
    await prisma.chatMessage.create({
      data: { sessionId, role: "user", content: message, persona, userId: user.id },
    });

    // Fetch context based on persona
    let context = "";
    if (persona === "crypto") {
      context = await buildCryptoContext(message);
    } else if (persona === "us-stocks") {
      context = await buildUSStockContext(message);
    }

    // Detect ticker for chart rendering
    const tickerInfo = extractTicker(message, persona);

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
        ? "\n\nIMPORTANT: Respond in Korean (한국어). Keep technical terms in English."
        : "";

    const fullPrompt = `${systemPrompt}${langNote}

REAL-TIME MARKET DATA:
${context || "No specific data fetched for this query."}

CONVERSATION HISTORY:
${historyText}

User: ${message}

Respond concisely (50-100 words unless asked for more). Be specific with numbers.`;

    // Call Gemini
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "AI not configured" }, { status: 500 });

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });
    const result = await model.generateContent(fullPrompt);
    const response = result.response.text();

    // Save assistant message
    await prisma.chatMessage.create({
      data: {
        sessionId,
        role: "assistant",
        content: response,
        persona,
        ticker: tickerInfo ? `${tickerInfo.exchange}:${tickerInfo.ticker}` : null,
        userId: user.id,
      },
    });

    return NextResponse.json({
      response,
      ticker: tickerInfo ? { symbol: tickerInfo.ticker, exchange: tickerInfo.exchange } : null,
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
