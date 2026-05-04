/**
 * End-to-end quant research pipeline:
 *   1. Pick the top movers from Binance perp futures (or use --pairs)
 *   2. Capture each chart from TradingView (4H by default)
 *   3. Run our chart-analysis pipeline (priceAgent + webSearch + Gemini Vision)
 *   4. Annotate the screenshot with entry / SL / TP / S/R levels
 *   5. Generate KO + EN blog content via Gemini using the analysis as input
 *   6. Insert as BlogArticle (published=true)
 *   7. Broadcast to the Korean Telegram channel via futuresAIadmin (multipart upload)
 *
 * CLI:
 *   npx tsx scripts/quant-research/run.ts                       # dry-run, top 3 movers
 *   npx tsx scripts/quant-research/run.ts --send                # actually publish + broadcast
 *   npx tsx scripts/quant-research/run.ts --pairs ZEC,DASH,LAB --send
 */
import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env" });
if (process.env.DIRECT_URL) process.env.DATABASE_URL = process.env.DIRECT_URL;

import path from "path";
import fs from "fs/promises";
import { PrismaClient } from "@prisma/client";
import { GoogleGenerativeAI } from "@google/generative-ai";

import { captureCharts, type CaptureResult } from "./capture";
import { annotateChart, colorFor, type AnnotationLine } from "./annotate";
import { uploadPng } from "./storage";

const prisma = new PrismaClient();
const SITE_URL = "https://futuresai.io";
const TELEGRAM_API = "https://api.telegram.org/bot";

// ----- args -----
const argv = process.argv.slice(2);
const SEND = argv.includes("--send");
const pairsIdx = argv.indexOf("--pairs");
const explicitPairs =
  pairsIdx >= 0 && argv[pairsIdx + 1]
    ? argv[pairsIdx + 1].split(",").map((s) => s.trim()).filter(Boolean)
    : null;

// ----- helpers -----
function escapeHtml(s: string): string {
  return s.replace(/[&<>]/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c] || c,
  );
}

async function topMovers(n = 3): Promise<string[]> {
  const r = await fetch("https://fapi.binance.com/fapi/v1/ticker/24hr");
  const data = (await r.json()) as Array<{
    symbol: string;
    priceChangePercent: string;
    quoteVolume: string;
  }>;
  return data
    .filter((d) => d.symbol.endsWith("USDT") && !d.symbol.includes("_") && parseFloat(d.quoteVolume) > 1e8)
    .map((d) => ({ sym: d.symbol, abs: Math.abs(parseFloat(d.priceChangePercent)) }))
    .sort((a, b) => b.abs - a.abs)
    .slice(0, n)
    .map((d) => `${d.sym}.P`);
}

// ----- chart-analysis (mirrors src/lib/services/chart-analysis but inlined for the script) -----
type Candle = { open: number; high: number; low: number; close: number; volume: number };
type PriceData = {
  currentPrice: number;
  changePercent24h: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  recentCandles: Candle[];
};

async function fetchPrice(pair: string): Promise<PriceData | null> {
  try {
    const sym = pair.replace(/\.P$/, "");
    const [t, k] = await Promise.all([
      fetch(`https://fapi.binance.com/fapi/v1/ticker/24hr?symbol=${sym}`).then((r) => r.json()),
      fetch(`https://fapi.binance.com/fapi/v1/klines?symbol=${sym}&interval=4h&limit=20`).then((r) => r.json()),
    ]);
    const candles: Candle[] = (k as any[]).map((c) => ({
      open: parseFloat(c[1]),
      high: parseFloat(c[2]),
      low: parseFloat(c[3]),
      close: parseFloat(c[4]),
      volume: parseFloat(c[5]),
    }));
    return {
      currentPrice: parseFloat(t.lastPrice),
      changePercent24h: parseFloat(t.priceChangePercent),
      high24h: parseFloat(t.highPrice),
      low24h: parseFloat(t.lowPrice),
      volume24h: parseFloat(t.quoteVolume),
      recentCandles: candles,
    };
  } catch (err) {
    console.warn(`[price] failed for ${pair}:`, (err as Error).message);
    return null;
  }
}

type ChartLine = {
  type: "support" | "resistance" | "trend" | "entry" | "stopLoss" | "takeProfit";
  price: number;
  label: string;
  color: string;
  dashed: boolean;
  hitProbability: number;
};

type ChartAnalysis = {
  summary: string;
  trend: string;
  patterns: string[];
  supportLevels: number[];
  resistanceLevels: number[];
  indicators: { name: string; value: string; signal: "BUY" | "SELL" | "NEUTRAL" }[];
  tradeSetup: {
    direction: "LONG" | "SHORT" | "NEUTRAL";
    entry: number;
    stopLoss: number;
    takeProfit: number;
    riskReward: string;
    confidence: number;
  };
  riskScore: number;
  confidence: number;
  lines: ChartLine[];
  chartCalibration: {
    scale: "linear" | "log";
    anchors: { price: number; yPercent: number }[];
    plotArea?: { topYPercent: number; bottomYPercent: number };
    confidence: "high" | "medium" | "low";
  };
};

async function analyzeChartImage(
  imageBuffer: Buffer,
  pair: string,
  priceData: PriceData | null,
  apiKey: string,
): Promise<ChartAnalysis> {
  const ai = new GoogleGenerativeAI(apiKey);
  const model = ai.getGenerativeModel({
    model: "gemini-2.5-pro",
    generationConfig: { responseMimeType: "application/json" },
  });

  const liveBlock = priceData
    ? `\n\nLIVE MARKET CONTEXT:\nPrice: ${priceData.currentPrice} | 24h: ${priceData.changePercent24h}% | High: ${priceData.high24h} | Low: ${priceData.low24h} | Vol: ${priceData.volume24h}\nRecent 4H candles: ${priceData.recentCandles.slice(-10).map((c) => `O${c.open}/H${c.high}/L${c.low}/C${c.close}`).join(" | ")}`
    : "";

  const prompt = `You are a senior quant analyst. Analyze this 4H crypto chart for ${pair} and return a STRICT JSON object with this exact shape (no commentary, no markdown):

{
  "summary": "2-3 sentence summary of the chart structure and current setup",
  "trend": "BULLISH" | "BEARISH" | "NEUTRAL",
  "patterns": ["pattern 1", "pattern 2"],
  "supportLevels": [number, number, number],
  "resistanceLevels": [number, number, number],
  "indicators": [{"name":"RSI","value":"52","signal":"NEUTRAL"}, ...],
  "tradeSetup": {"direction":"LONG"|"SHORT"|"NEUTRAL","entry":number,"stopLoss":number,"takeProfit":number,"riskReward":"1:2.5","confidence":70},
  "riskScore": 0-100,
  "confidence": 0-100,
  "lines": [
    {"type":"entry","price":number,"label":"Entry","color":"#3b82f6","dashed":false,"hitProbability":70},
    {"type":"stopLoss","price":number,"label":"Stop","color":"#ef4444","dashed":true,"hitProbability":30},
    {"type":"takeProfit","price":number,"label":"Target","color":"#22c55e","dashed":false,"hitProbability":50},
    {"type":"support","price":number,"label":"Support","color":"#10b981","dashed":true,"hitProbability":60},
    {"type":"resistance","price":number,"label":"Resistance","color":"#f59e0b","dashed":true,"hitProbability":60}
  ],
  "chartCalibration": {
    "scale":"linear"|"log",
    "anchors":[{"price":number,"yPercent":number},{"price":number,"yPercent":number},{"price":number,"yPercent":number}],
    "plotArea":{"topYPercent":number,"bottomYPercent":number},
    "confidence":"high"|"medium"|"low"
  }
}

CRITICAL CALIBRATION RULES:
- yPercent grows downward (0=top of image, 100=bottom).
- The plotArea.topYPercent / bottomYPercent must be the y-percent boundaries of the candle region only — exclude headers/legends and the volume panel.
- Provide AT LEAST 3 anchor pairs spanning the visible price range, drawn from the y-axis tick labels you can read on the right side of the chart.
- Use scale=linear for normal charts, scale=log only if y-axis labels are clearly logarithmic.
- All price levels in lines/supportLevels/resistanceLevels MUST fall within or near the visible candle range and be consistent with the anchors.${liveBlock}`;

  const res = await model.generateContent([
    prompt,
    { inlineData: { data: imageBuffer.toString("base64"), mimeType: "image/png" } },
  ]);
  const txt = res.response.text().trim();
  const jsonStr = txt.replace(/^```json?\s*/i, "").replace(/\s*```$/i, "").trim();
  return JSON.parse(jsonStr) as ChartAnalysis;
}

// ----- blog content (Glassnode-style long form, KO + EN) -----
async function generateBlogContent(
  symbol: string,
  pair: string,
  analysis: ChartAnalysis,
  priceData: PriceData | null,
  imageUrls: { fourH: string; oneD: string; oneW: string },
  apiKey: string,
): Promise<{
  title: string;
  titleKo: string;
  excerpt: string;
  excerptKo: string;
  content: string;
  contentKo: string;
  /** 3-paragraph Korean body sized for the Telegram caption (~300-400 chars). */
  telegramBodyKo: string;
  /** Single-line Korean summary for ✏️ 한 줄 요약. */
  oneLineKo: string;
  tags: string[];
}> {
  const ai = new GoogleGenerativeAI(apiKey);
  const model = ai.getGenerativeModel({
    model: "gemini-2.5-pro",
    generationConfig: { responseMimeType: "application/json" },
  });

  const setup = analysis.tradeSetup;
  const ctxBlock = priceData
    ? `Current Price: $${priceData.currentPrice}, 24h Change: ${priceData.changePercent24h}%, Volume: $${(priceData.volume24h / 1e6).toFixed(1)}M`
    : "Live price unavailable.";

  const tmpl = `<h2>Executive Summary</h2>
<ul>
  <li>BULLET 1: top-line thesis with the key level</li>
  <li>BULLET 2: market structure / trend phase</li>
  <li>BULLET 3: critical support cluster</li>
  <li>BULLET 4: critical resistance cluster</li>
  <li>BULLET 5: indicator read (RSI / MACD / volume)</li>
  <li>BULLET 6: trade direction and bias</li>
  <li>BULLET 7: entry / stop / target with R:R</li>
</ul>

<h2>Market Context</h2>
<img src="${imageUrls.oneW}" alt="${symbol} weekly chart" />
<p>2 paragraphs on the higher-timeframe regime. Reference the 1W chart explicitly.</p>

<h2>Chart Structure</h2>
<img src="${imageUrls.oneD}" alt="${symbol} daily chart" />
<p>2 paragraphs on the daily structure: market phase (accumulation/markup/distribution/markdown), key swing points, the dominant pattern. Reference the 1D chart.</p>

<h2>Key Levels</h2>
<p>Support cluster: list every support price from the analysis with one-line reasoning per level.</p>
<p>Resistance cluster: same for resistance levels.</p>

<h2>Indicators &amp; Momentum</h2>
<p>2 paragraphs covering each indicator from the analysis with its read.</p>

<h2>Trade Setup</h2>
<img src="${imageUrls.fourH}" alt="${symbol} 4H chart with annotated entry, stop loss, take profit" />
<p>Direction: ${setup.direction}. 2 paragraphs explaining the structural reasoning behind the setup.</p>
<ul>
  <li>Entry: ${setup.entry}</li>
  <li>Stop Loss: ${setup.stopLoss}</li>
  <li>Take Profit: ${setup.takeProfit}</li>
  <li>R:R: ${setup.riskReward}</li>
  <li>Confidence: ${setup.confidence}/100</li>
</ul>

<h2>Risks &amp; Catalysts</h2>
<ul>
  <li>3-5 specific risk factors that could invalidate this thesis.</li>
</ul>

<h2>Conclusion</h2>
<p>1 synthesizing paragraph (~150 words) that ties the multi-timeframe view, the levels, and the trade together.</p>

<p><em>Disclaimer: This research is for informational purposes only and does not constitute financial advice. Always do your own research and trade with proper risk management.</em></p>`;

  const prompt = `You're writing for FuturesAI's quant research desk in the long-form Glassnode "Week On-Chain" style: institutional voice, paragraphs of ~3-5 sentences, concrete numbers throughout, no hype, no clickbait. Audience: experienced crypto futures traders.

Subject: ${symbol} (${pair}) — multi-timeframe chart analysis
${ctxBlock}

Structured chart analysis (use as ground truth — do NOT invent levels):
- Trend: ${analysis.trend}
- Patterns: ${analysis.patterns.join(", ")}
- Supports: ${analysis.supportLevels.join(", ")}
- Resistances: ${analysis.resistanceLevels.join(", ")}
- Indicators: ${analysis.indicators.map((i) => `${i.name}=${i.value}/${i.signal}`).join(", ")}
- Trade setup: ${setup.direction} | entry ${setup.entry} | SL ${setup.stopLoss} | TP ${setup.takeProfit} | R:R ${setup.riskReward} | conf ${setup.confidence}
- Summary: ${analysis.summary}

Output the article EXACTLY in this HTML structure (replace the placeholder text in each section, keep ALL <img> tags VERBATIM with the URLs as given). Total length: 1,800-2,400 words across all sections. Each <p> should be a real paragraph, not a single sentence:

${tmpl}

Return ONLY valid JSON, no markdown fences:
{
  "title": "engaging English title 60-90 chars, professional tone (no clickbait)",
  "titleKo": "same title in natural Korean",
  "excerpt": "2-sentence English summary, ~180 chars",
  "excerptKo": "same in natural Korean, ~180 chars",
  "content": "FULL English HTML article following the template above EXACTLY. Keep the <img> tags exactly as shown. 1,800-2,400 words total.",
  "contentKo": "FULL Korean HTML article following the same template. Keep the <img> tags exactly as shown (English alt text is fine). 1,800-2,400 words total.",
  "telegramBodyKo": "3 short Korean paragraphs separated by a blank line (\\n\\n between paragraphs). Each ~110 chars, 350 total max. P1: 24h move + trend. P2: market structure / key zones (broad — say 'major resistance overhead' / 'support cluster nearby', no exact prices). P3: tease the setup without revealing it (e.g., '구체적인 진입가/손절/목표는 본 분석에서 확인하세요'). Trader voice, no fluff. Plain text only — no HTML.",
  "oneLineKo": "single Korean sentence, 80-130 chars, restating the thesis and the key zone to watch — STRICTLY NO entry/stop/target prices.",
  "tags": ["${symbol}","chart-analysis","multi-timeframe","technical-analysis","futures"]
}

CRITICAL:
- The 3 <img> tags in content/contentKo MUST appear with the exact src URLs given above, in the sections shown.
- telegramBodyKo and oneLineKo are PLAIN TEXT (no HTML).
- telegramBodyKo and oneLineKo are PUBLIC-FACING TEASERS. They MUST NOT contain specific entry, stop loss, or take profit prices — those are premium-only content kept inside the full blog article (content/contentKo). Specific support/resistance prices, RSI numbers, and Fibonacci levels are also premium — keep them in the blog only. Use phrasing like "a setup is forming above the recent base" or "key resistance overhead" instead of naming numbers.
- Paragraphs in telegramBodyKo must be separated by \\n\\n (a blank line) so they render with breathing room in Telegram.
- Inside the FULL blog article (content / contentKo) you SHOULD include exact levels — the article is where premium analysis lives.
- Do not invent prices outside the structured analysis — use the supports/resistances/setup levels exactly inside the article body.`;

  const res = await model.generateContent(prompt);
  const txt = res.response.text().trim();
  const jsonStr = txt.replace(/^```json?\s*/i, "").replace(/\s*```$/i, "").trim();
  return JSON.parse(jsonStr);
}

// ----- minimal Telegram broadcast (multipart upload of annotated PNG) -----
const BRAND = {
  author: "FuturesAI Quant Desk",
  xUrl: "https://x.com/FuturesAI_io",
  tgUrl: "https://t.me/FuturesAIOfficial",
};

const CAPTION_LIMIT = 1024;

function buildKoCaption(article: {
  id: string;
  symbol: string;
  titleKo: string;
  telegramBodyKo: string;
  oneLineKo: string;
}): string {
  const articleUrl = `${SITE_URL}/ko/blog/${article.id}`;
  const titleLine = `"#${article.symbol} ${article.titleKo}"`;
  const lines = [
    `🔗 <a href="${articleUrl}">Original</a> | Author ${BRAND.author}`,
    ``,
    `📈 <a href="${articleUrl}">전체 분석 보기</a>`,
    ``,
    `<b>${escapeHtml(titleLine)}</b>`,
    ``,
    escapeHtml(article.telegramBodyKo),
    ``,
    `✏️ <b>한 줄 요약</b>`,
    escapeHtml(article.oneLineKo),
    ``,
    `✖️ <a href="${BRAND.xUrl}">공식 FuturesAI 엑스(🇰🇷한국어)</a>`,
    `✈️ <a href="${BRAND.tgUrl}">공식 FuturesAI 텔레그램(🇰🇷한국어)</a>`,
  ];
  let caption = lines.join("\n");

  // Telegram caption limit is 1024. If the body pushes over, trim it.
  if (caption.length > CAPTION_LIMIT) {
    const overflow = caption.length - CAPTION_LIMIT + 20; // headroom for "…"
    const trimmedBody = article.telegramBodyKo.slice(0, Math.max(60, article.telegramBodyKo.length - overflow)) + "…";
    lines[6] = escapeHtml(trimmedBody);
    caption = lines.join("\n");
  }
  return caption;
}

async function sendPhotoBuffer(
  buf: Buffer,
  caption: string,
  filename: string,
): Promise<{ ok: boolean; messageId?: number; description?: string }> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_GROUP_CHAT_ID;
  if (!token || !chatId) return { ok: false, description: "telegram env not set" };
  const fd = new FormData();
  fd.append("chat_id", chatId);
  fd.append("photo", new Blob([buf as any], { type: "image/png" }), filename);
  fd.append("caption", caption);
  fd.append("parse_mode", "HTML");
  const res = await fetch(`${TELEGRAM_API}${token}/sendPhoto`, { method: "POST", body: fd });
  const json = await res.json();
  return { ok: json.ok === true, messageId: json.result?.message_id, description: json.description };
}

// ----- per-coin pipeline (multi-timeframe: 4H drives analysis + Telegram, 1D + 1W embed in article) -----
type PairCaptures = {
  pair: string;
  symbol: string;
  fourH: CaptureResult;
  oneD: CaptureResult | null;
  oneW: CaptureResult | null;
};

async function runForPair(p: PairCaptures, apiKey: string, adminUserId: string) {
  console.log(`\n=== ${p.symbol} (${p.pair}) ===`);
  const c = p.fourH;

  const rawBuf = await fs.readFile(c.filePath);

  const priceData = await fetchPrice(c.pair);
  if (priceData) {
    console.log(`  px=$${priceData.currentPrice} 24h=${priceData.changePercent24h}%`);
  }

  console.log("  analyzing 4H chart…");
  const analysis = await analyzeChartImage(rawBuf, c.pair, priceData, apiKey);
  console.log(`  trend=${analysis.trend} setup=${analysis.tradeSetup.direction} entry=${analysis.tradeSetup.entry} sl=${analysis.tradeSetup.stopLoss} tp=${analysis.tradeSetup.takeProfit}`);

  console.log("  annotating 4H chart…");
  const annotatedPath = c.filePath.replace(/\.png$/i, "-annotated.png");
  const lines: AnnotationLine[] = (analysis.lines || []).map((l) => ({
    price: l.price,
    label: l.label || l.type,
    color: l.color || colorFor(l.type),
    dashed: !!l.dashed,
  }));
  await annotateChart({
    chartImagePath: c.filePath,
    outPath: annotatedPath,
    calibration: analysis.chartCalibration,
    lines,
  });
  console.log(`  → ${path.relative(process.cwd(), annotatedPath)}`);

  // Upload all 4 PNGs (4H raw, 4H annotated, 1D, 1W) to Supabase Storage so
  // the article and Telegram caption reference CDN URLs that work without a
  // Vercel deploy. Annotated 4H is the hero image; 1D + 1W are body embeds.
  console.log("  uploading charts to supabase…");
  const annotatedFilename = path.basename(annotatedPath);
  const fourHUrl = await uploadPng(annotatedPath, annotatedFilename);
  const oneDUrl = p.oneD ? await uploadPng(p.oneD.filePath) : fourHUrl;
  const oneWUrl = p.oneW ? await uploadPng(p.oneW.filePath) : fourHUrl;
  console.log(`  4h: ${fourHUrl}`);
  console.log(`  1d: ${oneDUrl}`);
  console.log(`  1w: ${oneWUrl}`);

  console.log("  generating Glassnode-style article…");
  const post = await generateBlogContent(
    c.symbol,
    c.pair,
    analysis,
    priceData,
    { fourH: fourHUrl, oneD: oneDUrl, oneW: oneWUrl },
    apiKey,
  );
  console.log(`  title:    ${post.title}`);
  console.log(`  titleKo:  ${post.titleKo}`);
  const wordCount = post.content.replace(/<[^>]*>/g, "").split(/\s+/).length;
  console.log(`  words:    ${wordCount} (en)`);

  if (!SEND) {
    // Print the would-be Telegram caption so we can review wording / line breaks.
    const previewCaption = buildKoCaption({
      id: "preview",
      symbol: c.symbol,
      titleKo: post.titleKo,
      telegramBodyKo: post.telegramBodyKo,
      oneLineKo: post.oneLineKo,
    });
    console.log(`  caption preview (${previewCaption.length} chars):`);
    console.log(previewCaption.split("\n").map((l) => `    ${l}`).join("\n"));
    console.log("  (dry-run — no DB write, no Telegram send)");
    return;
  }

  const article = await prisma.blogArticle.create({
    data: {
      title: post.title,
      titleKo: post.titleKo,
      content: post.content,
      contentKo: post.contentKo,
      excerpt: post.excerpt,
      excerptKo: post.excerptKo,
      imageUrl: fourHUrl,
      category: "research",
      tags: post.tags || [c.symbol, "chart-analysis", "multi-timeframe"],
      published: true,
      publishedAt: new Date(),
      authorId: adminUserId,
    },
    select: { id: true },
  });
  console.log(`  articleId: ${article.id}`);
  console.log(`  blog:      ${SITE_URL}/ko/blog/${article.id}`);

  const annotatedBuf = await fs.readFile(annotatedPath);
  const caption = buildKoCaption({
    id: article.id,
    symbol: c.symbol,
    titleKo: post.titleKo,
    telegramBodyKo: post.telegramBodyKo,
    oneLineKo: post.oneLineKo,
  });
  const tg = await sendPhotoBuffer(annotatedBuf, caption, annotatedFilename);
  if (tg.ok) {
    console.log(`  ✅ telegram sent (msg_id=${tg.messageId})`);
  } else {
    console.error(`  ❌ telegram failed: ${tg.description}`);
  }
}

function groupCaptures(captures: CaptureResult[]): PairCaptures[] {
  const byPair: Record<string, CaptureResult[]> = {};
  for (const c of captures) {
    (byPair[c.pair] ??= []).push(c);
  }
  const groups: PairCaptures[] = [];
  for (const pair of Object.keys(byPair)) {
    const arr = byPair[pair];
    const fourH = arr.find((x: CaptureResult) => x.interval === "240");
    const oneD = arr.find((x: CaptureResult) => x.interval === "1D" || x.interval === "D") ?? null;
    const oneW = arr.find((x: CaptureResult) => x.interval === "1W" || x.interval === "W") ?? null;
    if (!fourH) {
      console.warn(`[group] ${pair}: missing 4H capture, skipping`);
      continue;
    }
    groups.push({ pair, symbol: fourH.symbol, fourH, oneD, oneW });
  }
  return groups;
}

async function main() {
  const apiKey = process.env.GEMINI_API_KEY;
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_GROUP_CHAT_ID;
  if (!apiKey) throw new Error("GEMINI_API_KEY not set");
  if (SEND && (!botToken || !chatId)) throw new Error("TELEGRAM_BOT_TOKEN / TELEGRAM_GROUP_CHAT_ID not set");

  const admin = await prisma.user.findFirst({ where: { role: "ADMIN" }, select: { id: true, email: true } });
  if (!admin) throw new Error("no admin user");
  console.log(`mode: ${SEND ? "LIVE (--send)" : "DRY-RUN"}    author: ${admin.email}`);

  const pairs = explicitPairs ?? (await topMovers(3));
  console.log(`pairs: ${pairs.join(", ")}`);

  // Capture 3 timeframes per pair: 4H (drives analysis + Telegram), 1D + 1W (embedded in article)
  const captures = await captureCharts({ pairs, intervals: ["240", "1D", "1W"] });
  const groups = groupCaptures(captures);

  for (const g of groups) {
    try {
      await runForPair(g, apiKey, admin.id);
    } catch (err) {
      console.error(`[${g.symbol}] failed:`, err);
    }
  }
}

main()
  .catch((e) => {
    console.error("\nfatal:", e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
