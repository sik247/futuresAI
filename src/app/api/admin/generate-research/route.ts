import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { runPriceAgent } from "@/lib/services/chart-analysis/agents/price.agent";
import { runWebSearchAgent } from "@/lib/services/chart-analysis/agents/web-search.agent";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

/**
 * POST /api/admin/generate-research
 * Generates a deep research blog post for a given trading pair.
 * Runs price agent + web search agent, then uses Gemini 2.5 Pro to write
 * an institutional-grade research report, saved as a BlogArticle.
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || (session.user as { role?: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { pair = "BTCUSDT" } = await req.json();
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "GEMINI_API_KEY not configured" }, { status: 500 });
  }

  try {
    // Phase 1: Gather live data in parallel
    const [priceSettled, webSettled] = await Promise.allSettled([
      runPriceAgent(pair),
      runWebSearchAgent(pair),
    ]);

    const priceData = priceSettled.status === "fulfilled" ? priceSettled.value : null;
    const webResults = webSettled.status === "fulfilled" ? webSettled.value : null;

    // Build context for Gemini
    const symbol = pair.replace("USDT", "");
    const priceContext = priceData
      ? `Current Price: $${Number(priceData.currentPrice).toLocaleString()}
24h Change: ${priceData.changePercent24h}%
24h High: $${Number(priceData.high24h).toLocaleString()}
24h Low: $${Number(priceData.low24h).toLocaleString()}
24h Volume: $${(Number(priceData.volume24h) / 1e6).toFixed(1)}M
Recent 4H candles (last 10): ${JSON.stringify(priceData.recentCandles?.slice(-10).map(c => ({
  open: c.open, high: c.high, low: c.low, close: c.close, volume: c.volume
})))}`
      : "Price data unavailable.";

    const newsContext = webResults?.length
      ? webResults.map(w =>
          `Sentiment: ${w.sentiment}\nKey Events: ${w.keyEvents?.join("; ") || "none"}\nHeadlines:\n${w.results.map(r => `- ${r.title}: ${r.snippet}`).join("\n")}`
        ).join("\n\n")
      : "No news data available.";

    // Phase 2: Generate deep research with Gemini 2.5 Pro
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });

    const prompt = `You are a senior crypto research analyst at a top institutional fund. Write a comprehensive, in-depth research report on ${symbol}/USDT (${symbol}) for publication as a professional blog post.

## LIVE MARKET DATA (as of ${new Date().toISOString()}):
${priceContext}

## RECENT NEWS & SENTIMENT:
${newsContext}

## REQUIREMENTS:
Write the report in **HTML format** (use <h2>, <h3>, <p>, <ul>, <li>, <strong>, <em> tags). This will be published directly as a blog post.

The report MUST include ALL of the following sections with substantial depth (each section should be multiple paragraphs):

1. **Executive Summary** — 3-4 sentence overview with current price, key thesis, and recommendation
2. **Market Structure Analysis** — Current trend, market phase (accumulation/distribution/markup/markdown), higher timeframe structure
3. **Technical Analysis**
   - Key support and resistance levels with specific prices
   - Chart patterns (if identifiable from price action)
   - Moving averages analysis (MA25, MA50, MA200 relative positions)
   - RSI analysis and any divergences
   - MACD signal analysis
   - Bollinger Band positioning
   - Volume profile analysis
4. **Fibonacci Analysis** — Key retracement and extension levels with specific prices
5. **On-Chain Analysis** — Exchange flows, whale activity, active addresses (use your knowledge + news context)
6. **Macro Context** — Fed policy, DXY correlation, global liquidity, ETF flows
7. **Trading Thesis** — Primary thesis (bullish/bearish/neutral) with supporting evidence
8. **Trade Setup**
   - Recommended direction (LONG/SHORT/NEUTRAL)
   - Entry zone (specific price range)
   - Stop loss level with reasoning
   - Take profit targets (multiple levels)
   - Risk/Reward ratio
   - Position sizing recommendation (% of portfolio)
9. **Key Risks** — 3-5 specific risk factors that could invalidate the thesis
10. **Key Catalysts** — 3-5 upcoming events or conditions that could accelerate the thesis
11. **Statistical Targets** — Price targets with probability estimates and timeframes
12. **Conclusion** — Final verdict with confidence level

## STYLE:
- Professional, institutional tone
- Use specific numbers and prices throughout
- Include percentage calculations where relevant
- Reference specific technical indicators with values
- Each section should have meaningful depth (not just bullet points)
- Total length: 2000-3000 words
- Use bold for key numbers and important conclusions

Write the full HTML blog post now.`;

    const result = await model.generateContent(prompt);
    const contentEn = result.response.text()
      .replace(/^```html\n?/i, "")
      .replace(/\n?```$/i, "")
      .trim();

    // Phase 3: Generate Korean version
    const koResult = await model.generateContent(
      `Translate the following crypto research report from English to Korean. Keep ALL technical terms (RSI, MACD, BTC, LONG, SHORT, etc.) in English. Keep all numbers and prices as-is. Output ONLY the translated HTML, no explanation.\n\n${contentEn}`
    );
    const contentKo = koResult.response.text()
      .replace(/^```html\n?/i, "")
      .replace(/\n?```$/i, "")
      .trim();

    // Phase 4: Generate metadata
    const titleEn = `${symbol}/USDT Deep Research: Institutional Analysis & Trade Setup — ${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`;
    const titleKo = `${symbol}/USDT 심층 리서치: 기관급 분석 & 트레이드 셋업 — ${new Date().toLocaleDateString("ko-KR", { month: "long", day: "numeric", year: "numeric" })}`;

    const excerptEn = `Comprehensive institutional-grade research report on ${symbol}/USDT covering market structure, technical analysis, on-chain metrics, macro context, and a detailed trade setup with specific entry, stop loss, and take profit levels.`;
    const excerptKo = `${symbol}/USDT에 대한 기관급 종합 리서치 리포트. 시장 구조, 기술적 분석, 온체인 지표, 매크로 환경, 구체적 진입/손절/익절 레벨을 포함한 상세 트레이드 셋업.`;

    // Phase 5: Save as BlogArticle
    const admin = await prisma.user.findFirst({ where: { role: "ADMIN" } });
    if (!admin) {
      return NextResponse.json({ error: "No admin user found" }, { status: 500 });
    }

    const article = await prisma.blogArticle.create({
      data: {
        title: titleEn,
        titleKo,
        content: contentEn,
        contentKo,
        excerpt: excerptEn,
        excerptKo,
        imageUrl: "",
        category: "research",
        tags: [symbol, "technical-analysis", "trade-setup", "deep-research", "institutional"],
        published: true,
        authorId: admin.id,
        publishedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      articleId: article.id,
      title: titleEn,
      pair,
      contentLength: contentEn.length,
    });
  } catch (error: any) {
    console.error("[generate-research]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
