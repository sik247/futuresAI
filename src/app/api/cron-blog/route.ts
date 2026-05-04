export const dynamic = "force-dynamic";
export const maxDuration = 60;

import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import prisma from "@/lib/prisma";
import { broadcastBlogArticle } from "@/lib/services/notifications/blog-broadcast.service";

// Vercel Cron: runs every 3 days to generate AdSense-quality blog posts
// Schedule: "0 3 */3 * *" (3 AM UTC every 3 days)

const TOPICS = [
  {
    category: "guide",
    themes: [
      "How to read crypto candlestick charts for beginners",
      "Understanding crypto futures: leverage, margin, and liquidation explained",
      "What is dollar-cost averaging (DCA) and why it works for crypto",
      "How to set stop-loss and take-profit orders effectively",
      "Understanding blockchain gas fees: how to save money on transactions",
      "Spot trading vs futures trading: which is right for you",
      "How to create a crypto portfolio diversification strategy",
      "Understanding market orders vs limit orders in crypto trading",
      "What are funding rates in perpetual futures and how to use them",
      "How to use RSI and MACD indicators for crypto trading",
      "Risk management strategies every crypto trader should know",
      "How to identify support and resistance levels in crypto charts",
      "Understanding crypto exchange order books and market depth",
      "A complete guide to crypto wallet security best practices",
      "How to calculate your actual trading costs including fees and slippage",
    ],
  },
  {
    category: "research",
    themes: [
      "Bitcoin halving cycles: historical analysis and future predictions",
      "How institutional investors are changing the crypto market landscape",
      "The relationship between Bitcoin and traditional markets: correlation analysis",
      "Understanding crypto market cycles: accumulation, markup, distribution, markdown",
      "How whale wallets move the crypto market: on-chain analysis guide",
      "The impact of regulatory changes on cryptocurrency prices",
      "DeFi yield farming: risks and rewards compared to traditional savings",
      "Layer 2 scaling solutions: how they affect transaction costs and speed",
      "Stablecoin mechanisms: algorithmic vs collateralized comparison",
      "The role of market makers in cryptocurrency exchanges",
      "Understanding crypto liquidation cascades and their market impact",
      "Bitcoin as a hedge against inflation: data-driven analysis",
      "How crypto exchange reserves signal market tops and bottoms",
      "The evolution of crypto derivatives markets",
      "Comparing proof-of-work vs proof-of-stake energy consumption",
    ],
  },
  {
    category: "news",
    themes: [
      "Weekly crypto market recap and key developments",
      "Major cryptocurrency regulatory updates this month",
      "New exchange features and platform updates traders should know",
      "Crypto ETF developments and institutional adoption trends",
      "Emerging blockchain projects gaining traction in the market",
      "Central bank digital currencies (CBDCs): latest global developments",
      "Major crypto partnerships and enterprise blockchain adoption",
      "Crypto taxation updates and compliance changes",
      "Security incidents and lessons learned for crypto users",
      "Upcoming token launches and crypto events to watch",
    ],
  },
];

function pickTopic(usedTitles: string[]): {
  category: string;
  theme: string;
} {
  // Rotate through categories
  const allThemes = TOPICS.flatMap((t) =>
    t.themes.map((theme) => ({ category: t.category, theme }))
  );
  const available = allThemes.filter(
    (t) => !usedTitles.some((used) => used.toLowerCase().includes(t.theme.substring(0, 30).toLowerCase()))
  );
  const pool = available.length > 0 ? available : allThemes;
  return pool[Math.floor(Math.random() * pool.length)];
}

async function generateBlogPost(
  topic: { category: string; theme: string },
  apiKey: string
): Promise<{
  title: string;
  titleKo: string;
  content: string;
  contentKo: string;
  excerpt: string;
  excerptKo: string;
  tags: string[];
}> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-preview-04-17" });

  const prompt = `You are a professional crypto finance writer for FuturesAI (futuresai.io), an AI-powered crypto trading intelligence platform. Write a high-quality, original blog article that meets Google AdSense content quality guidelines.

TOPIC: "${topic.theme}"
CATEGORY: ${topic.category}

REQUIREMENTS FOR GOOGLE ADSENSE APPROVAL:
1. MINIMUM 1500 words of original, well-researched content
2. Clear structure with H2 and H3 headings (use HTML tags)
3. Informative, educational tone — NOT promotional or clickbait
4. Include practical examples and actionable advice
5. No copied content - must be 100% original
6. Professional language, well-organized paragraphs
7. Include a clear introduction and conclusion
8. Add relevant internal context about crypto trading concepts
9. NO affiliate links or excessive promotional content
10. Write as an authoritative expert providing genuine value

FORMAT — Return ONLY valid JSON (no markdown code fences):
{
  "title": "Engaging SEO-friendly title in English (50-70 chars)",
  "titleKo": "Same title translated to natural Korean",
  "content": "Full HTML article in English with <h2>, <h3>, <p>, <ul>, <li>, <strong>, <em> tags. Minimum 1500 words.",
  "contentKo": "Full HTML article translated to natural Korean. Same structure and depth.",
  "excerpt": "Compelling 2-sentence summary in English (under 160 chars for meta description)",
  "excerptKo": "Same summary in Korean",
  "tags": ["relevant", "keyword", "tags", "4-6 tags"]
}

CRITICAL: Output MUST be valid JSON only. No extra text before or after the JSON object.`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  // Parse JSON - try to extract from potential markdown fences
  let jsonStr = text.trim();
  if (jsonStr.startsWith("```")) {
    jsonStr = jsonStr.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "");
  }

  const parsed = JSON.parse(jsonStr);

  return {
    title: parsed.title,
    titleKo: parsed.titleKo,
    content: parsed.content,
    contentKo: parsed.contentKo,
    excerpt: parsed.excerpt,
    excerptKo: parsed.excerptKo,
    tags: parsed.tags || [],
  };
}

export async function GET(request: Request) {
  // Validate cron secret
  if (process.env.CRON_SECRET) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY not configured" },
      { status: 500 }
    );
  }

  const startTime = Date.now();

  try {
    console.log("[cron-blog] Starting blog generation...");

    // Get admin user as author
    const admin = await prisma.user.findFirst({
      where: { role: "ADMIN" },
      select: { id: true },
    });
    if (!admin) {
      return NextResponse.json(
        { error: "No admin user found" },
        { status: 500 }
      );
    }

    // Get recent titles to avoid duplicates
    const recentArticles = await prisma.blogArticle.findMany({
      select: { title: true },
      orderBy: { createdAt: "desc" },
      take: 30,
    });
    const usedTitles = recentArticles.map((a) => a.title);

    // Pick topic and generate
    const topic = pickTopic(usedTitles);
    console.log(`[cron-blog] Generating: "${topic.theme}" (${topic.category})`);

    const post = await generateBlogPost(topic, apiKey);

    // Validate content length (AdSense needs substantial content)
    const wordCount = post.content.replace(/<[^>]*>/g, "").split(/\s+/).length;
    if (wordCount < 500) {
      console.warn(`[cron-blog] Generated content too short (${wordCount} words), retrying...`);
      // Still save but as draft
      const article = await prisma.blogArticle.create({
        data: {
          title: post.title,
          titleKo: post.titleKo,
          content: post.content,
          contentKo: post.contentKo,
          excerpt: post.excerpt,
          excerptKo: post.excerptKo,
          category: topic.category,
          tags: post.tags,
          published: false,
          authorId: admin.id,
        },
      });

      return NextResponse.json({
        success: true,
        status: "draft",
        reason: `Content too short (${wordCount} words)`,
        articleId: article.id,
        duration: `${Date.now() - startTime}ms`,
      });
    }

    // Create and publish
    const article = await prisma.blogArticle.create({
      data: {
        title: post.title,
        titleKo: post.titleKo,
        content: post.content,
        contentKo: post.contentKo,
        excerpt: post.excerpt,
        excerptKo: post.excerptKo,
        category: topic.category,
        tags: post.tags,
        published: true,
        publishedAt: new Date(),
        authorId: admin.id,
      },
    });

    // Push the freshly published post to the Korean Telegram channel.
    // Failures don't block the cron — dedup-store prevents re-sends if the
    // safety-net /api/cron-blog-broadcast picks it up later.
    let broadcastSent = false;
    try {
      const r = await broadcastBlogArticle({
        id: article.id,
        title: article.title,
        titleKo: article.titleKo,
        excerpt: article.excerpt,
        excerptKo: article.excerptKo,
        imageUrl: article.imageUrl,
      });
      broadcastSent = r.ko;
    } catch (err) {
      console.error("[cron-blog] broadcast failed:", err);
    }

    // Log
    try {
      await prisma.contentBotLog.create({
        data: {
          action: "blog-publish",
          details: `Auto-published: "${post.title}" (${wordCount} words, ${topic.category})`,
          itemCount: 1,
        },
      });
    } catch {
      console.log("[cron-blog] DB logging skipped");
    }

    const result = {
      success: true,
      status: "published",
      articleId: article.id,
      title: post.title,
      category: topic.category,
      wordCount,
      broadcastSent,
      duration: `${Date.now() - startTime}ms`,
    };

    console.log("[cron-blog] Complete:", result);
    return NextResponse.json(result);
  } catch (error) {
    console.error("[cron-blog] Failed:", error);

    try {
      await prisma.contentBotLog.create({
        data: {
          action: "error",
          details: `Blog generation error: ${error instanceof Error ? error.message : "Unknown"}`,
          itemCount: 0,
        },
      });
    } catch {}

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Generation failed",
        duration: `${Date.now() - startTime}ms`,
      },
      { status: 500 }
    );
  }
}
