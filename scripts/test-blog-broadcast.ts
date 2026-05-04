/**
 * One-off: generate a chart-research blog post end-to-end and verify the
 * Telegram broadcast pipeline (futuresAIadmin caption with image + Korean
 * summary + link).
 *
 *   npx tsx scripts/test-blog-broadcast.ts          # dry run, no DB write, no send
 *   npx tsx scripts/test-blog-broadcast.ts --send   # writes BlogArticle, fires Telegram
 *
 * Requires .env with: DATABASE_URL, GEMINI_API_KEY, TELEGRAM_BOT_TOKEN,
 *   TELEGRAM_GROUP_CHAT_ID.
 */

import { config as loadEnv } from "dotenv";
// NOTE: only load .env. .env.local has literal "\n" sequences in DATABASE_URL
// that dotenv expands into real newlines, corrupting the connection string.
loadEnv({ path: ".env" });
// pgbouncer (port 6543) is unreachable from this network for some reason —
// fall back to DIRECT_URL (port 5432) for the script run.
if (process.env.DIRECT_URL) {
  process.env.DATABASE_URL = process.env.DIRECT_URL;
}

import { PrismaClient } from "@prisma/client";
import { GoogleGenerativeAI } from "@google/generative-ai";

const prisma = new PrismaClient();

const SHOULD_SEND = process.argv.includes("--send");

const SITE_URL = "https://futuresai.io";
const CHART_IMAGE_URL = `${SITE_URL}/images/blog/btc-4h-chart-20260421.png`;

const TELEGRAM_API = "https://api.telegram.org/bot";

function hashContent(...parts: string[]): string {
  // Local copy of the dedup hash to avoid src/* imports in this script.
  // Kept stable (sha256, first 32 hex) so re-runs are deduped if the broadcast
  // cron later catches the same article id.
  const { createHash } = require("crypto") as typeof import("crypto");
  return createHash("sha256").update(parts.join("")).digest("hex").slice(0, 32);
}

async function ensureDedupSchema() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "TelegramSendLog" (
      "kind" TEXT NOT NULL,
      "hash" TEXT NOT NULL,
      "sentAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY ("kind", "hash")
    )
  `);
}

async function wasSent(kind: string, hash: string): Promise<boolean> {
  const rows = await prisma.$queryRawUnsafe<{ exists: boolean }[]>(
    `SELECT EXISTS(
       SELECT 1 FROM "TelegramSendLog"
       WHERE "kind" = $1 AND "hash" = $2
       AND "sentAt" > NOW() - INTERVAL '30 days'
     ) AS "exists"`,
    kind,
    hash,
  );
  return rows[0]?.exists === true;
}

async function markSent(kind: string, hash: string) {
  await prisma.$executeRawUnsafe(
    `INSERT INTO "TelegramSendLog" ("kind", "hash", "sentAt")
     VALUES ($1, $2, NOW())
     ON CONFLICT ("kind", "hash") DO UPDATE SET "sentAt" = NOW()`,
    kind,
    hash,
  );
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>]/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c] || c,
  );
}

async function generatePost(apiKey: string) {
  const ai = new GoogleGenerativeAI(apiKey);
  const model = ai.getGenerativeModel({ model: "gemini-2.5-flash" });

  const prompt = `You are a quant analyst writing for FuturesAI. Produce a chart-research blog post about BTC's 4H structure right now (May 2026 context). Keep the tone of a working trader explaining what they see — concrete levels, no fluff.

Return ONLY valid JSON, no markdown fences:
{
  "title": "Engaging English title, 50-70 chars",
  "titleKo": "Same title in natural Korean",
  "excerpt": "2-sentence summary in English under 200 chars",
  "excerptKo": "Same summary in natural Korean under 200 chars",
  "content": "Full HTML article in English with <h2>, <p>, <ul>, <li>, <strong> tags. 800-1200 words. Cover: current price action, key support/resistance, RSI/MACD, trade setup with entry/stop/target.",
  "contentKo": "Full HTML article in Korean. Same structure.",
  "tags": ["BTC", "chart-analysis", "4H", "technical-analysis"]
}

CRITICAL: Output MUST be valid JSON only.`;

  const result = await model.generateContent(prompt);
  const text = result.response.text().trim();
  const jsonStr = text.startsWith("```")
    ? text.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "")
    : text;
  return JSON.parse(jsonStr) as {
    title: string;
    titleKo: string;
    excerpt: string;
    excerptKo: string;
    content: string;
    contentKo: string;
    tags: string[];
  };
}

function buildKoCaption(article: {
  id: string;
  title: string;
  titleKo: string;
  excerpt: string;
  excerptKo: string;
}): string {
  const title = article.titleKo || article.title;
  const excerpt = article.excerptKo || article.excerpt;
  const url = `${SITE_URL}/ko/blog/${article.id}`;
  return [
    `<b>${escapeHtml(title)}</b>`,
    "",
    escapeHtml(excerpt),
    "",
    `📖 <a href="${url}">전체 글 보기</a>`,
    `<i>— FuturesAI드림</i>`,
  ].join("\n");
}

async function sendPhotoToChannel(
  token: string,
  chatId: string,
  photoUrl: string,
  caption: string,
) {
  const res = await fetch(`${TELEGRAM_API}${token}/sendPhoto`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      photo: photoUrl,
      caption,
      parse_mode: "HTML",
    }),
  });
  return res.json() as Promise<{ ok: boolean; description?: string; result?: { message_id: number } }>;
}

async function main() {
  const apiKey = process.env.GEMINI_API_KEY;
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_GROUP_CHAT_ID;

  if (!apiKey) throw new Error("GEMINI_API_KEY not set");
  if (!botToken) throw new Error("TELEGRAM_BOT_TOKEN not set");
  if (!chatId) throw new Error("TELEGRAM_GROUP_CHAT_ID not set");

  console.log(`mode: ${SHOULD_SEND ? "LIVE (--send)" : "dry-run"}`);
  console.log(`image: ${CHART_IMAGE_URL}`);

  const admin = await prisma.user.findFirst({
    where: { role: "ADMIN" },
    select: { id: true, email: true },
  });
  if (!admin) throw new Error("no admin user found in DB");
  console.log(`admin author: ${admin.email}`);

  console.log("\n[1/3] generating post via Gemini…");
  const post = await generatePost(apiKey);
  console.log(`  title:    ${post.title}`);
  console.log(`  titleKo:  ${post.titleKo}`);
  console.log(`  excerpt:  ${post.excerpt}`);
  console.log(`  excerptKo:${post.excerptKo}`);
  const wordCount = post.content.replace(/<[^>]*>/g, "").split(/\s+/).length;
  console.log(`  words:    ${wordCount} (en)`);

  if (!SHOULD_SEND) {
    console.log("\ndry run — no DB write, no Telegram send. re-run with --send to fire.");
    return;
  }

  console.log("\n[2/3] inserting BlogArticle…");
  const article = await prisma.blogArticle.create({
    data: {
      title: post.title,
      titleKo: post.titleKo,
      content: post.content,
      contentKo: post.contentKo,
      excerpt: post.excerpt,
      excerptKo: post.excerptKo,
      imageUrl: CHART_IMAGE_URL,
      category: "research",
      tags: post.tags ?? [],
      published: true,
      publishedAt: new Date(),
      authorId: admin.id,
    },
    select: { id: true, publishedAt: true },
  });
  console.log(`  articleId:  ${article.id}`);
  console.log(`  blog url:   ${SITE_URL}/ko/blog/${article.id}`);

  console.log("\n[3/3] broadcasting to KO channel…");
  await ensureDedupSchema();
  const kind = "blog-broadcast-ko";
  const hash = hashContent("blog", article.id);
  if (await wasSent(kind, hash)) {
    console.log("  already broadcast (dedup hit) — skipping");
  } else {
    const caption = buildKoCaption({
      id: article.id,
      title: post.title,
      titleKo: post.titleKo,
      excerpt: post.excerpt,
      excerptKo: post.excerptKo,
    });
    console.log("  caption preview:");
    console.log(caption.split("\n").map((l) => `    ${l}`).join("\n"));

    const tg = await sendPhotoToChannel(botToken, chatId, CHART_IMAGE_URL, caption);
    if (tg.ok) {
      await markSent(kind, hash);
      console.log(`  ✅ telegram sent (message_id: ${tg.result?.message_id})`);
    } else {
      console.error(`  ❌ telegram send failed: ${tg.description}`);
      process.exitCode = 1;
    }
  }
}

main()
  .catch((err) => {
    console.error("\nfailed:", err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
