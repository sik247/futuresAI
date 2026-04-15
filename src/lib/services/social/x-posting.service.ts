import { TwitterApi } from "twitter-api-v2";
import { fetchMarketSignals, type SignalItem } from "@/lib/services/signals/signals.service";
import { fetchCryptoNews } from "@/lib/services/news/crypto-news.service";
import { GoogleGenerativeAI } from "@google/generative-ai";

// ── X Client ──

function getXClient(): TwitterApi | null {
  const appKey = process.env.X_API_KEY;
  const appSecret = process.env.X_API_SECRET;
  const accessToken = process.env.X_ACCESS_TOKEN;
  const accessSecret = process.env.X_ACCESS_SECRET;

  if (!appKey || !appSecret || !accessToken || !accessSecret) {
    console.warn("[x-posting] Missing X API credentials");
    return null;
  }

  return new TwitterApi({
    appKey,
    appSecret,
    accessToken,
    accessSecret,
  });
}

async function postTweet(text: string): Promise<{ id: string } | null> {
  const client = getXClient();
  if (!client) return null;

  try {
    const result = await client.v2.tweet(text);
    console.log("[x-posting] Tweet posted:", result.data.id);
    return { id: result.data.id };
  } catch (err) {
    console.error("[x-posting] Failed to post tweet:", err instanceof Error ? err.message : err);
    return null;
  }
}

// ── Signal Emoji Mapping ──

const SIGNAL_EMOJI: Record<string, string> = {
  "Strong Buy": "🟢🟢",
  "Buy": "🟢",
  "Neutral": "⚪",
  "Sell": "🔴",
  "Strong Sell": "🔴🔴",
};

// ── Post Types ──

export type XPostType = "signal" | "news" | "market-mood" | "top-mover";

// ── Signal Post ──

export async function postSignalTweet(): Promise<{ id: string; type: XPostType } | null> {
  const signals = await fetchMarketSignals();
  const topCoins = signals.signals.slice(0, 6);

  const lines: string[] = [];
  lines.push("📡 FuturesAI Signal Update\n");

  for (const s of topCoins) {
    const emoji = SIGNAL_EMOJI[s.signal] || "";
    const change = `${s.change24h >= 0 ? "+" : ""}${s.change24h.toFixed(1)}%`;
    const price = s.price > 100
      ? `$${s.price.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
      : `$${s.price.toFixed(4)}`;
    lines.push(`${emoji} $${s.symbol} ${price} (${change}) ${s.direction}`);
  }

  const fgVal = signals.fearGreed.value;
  const fgLabel = fgVal <= 25 ? "Extreme Fear" : fgVal <= 45 ? "Fear" : fgVal <= 55 ? "Neutral" : fgVal <= 75 ? "Greed" : "Extreme Greed";

  lines.push("");
  lines.push(`😱 Fear & Greed: ${fgVal}/100 (${fgLabel})`);

  const longCount = signals.signals.filter(s => s.direction === "LONG").length;
  const shortCount = signals.signals.filter(s => s.direction === "SHORT").length;
  lines.push(`Long ${longCount} / Short ${shortCount} / Watch ${signals.signals.length - longCount - shortCount}`);
  lines.push("");
  lines.push("🤖 futuresai.io");
  lines.push("#CryptoSignals #Bitcoin #AITrading");

  const tweet = lines.join("\n");
  const result = await postTweet(tweet);
  return result ? { ...result, type: "signal" } : null;
}

// ── News Post ──

export async function postNewsTweet(): Promise<{ id: string; type: XPostType } | null> {
  const news = await fetchCryptoNews();
  if (news.length === 0) return null;

  // Pick a random top news item (not always the first)
  const topNews = news.slice(0, 5);
  const picked = topNews[Math.floor(Math.random() * topNews.length)];

  // Use Gemini Flash to generate a concise take
  const geminiKey = process.env.GEMINI_API_KEY;
  let aiTake = "";
  if (geminiKey) {
    try {
      const genAI = new GoogleGenerativeAI(geminiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
      const result = await model.generateContent(
        `You are a crypto analyst posting on X (Twitter). Given this crypto news headline, write a 1-2 sentence sharp take on its market impact. Be concise, insightful, and opinionated. No hashtags. Max 180 characters.\n\nHeadline: ${picked.title}\nSource: ${picked.source}`
      );
      aiTake = result.response.text().trim();
    } catch {}
  }

  const lines: string[] = [];
  lines.push(`📰 ${picked.title}`);
  if (aiTake) {
    lines.push("");
    lines.push(aiTake);
  }
  lines.push("");
  lines.push(`Source: ${picked.source}`);
  lines.push("🤖 futuresai.io");
  lines.push("#CryptoNews #Bitcoin");

  // Truncate to 280 chars
  let tweet = lines.join("\n");
  if (tweet.length > 280) {
    tweet = tweet.slice(0, 277) + "...";
  }

  const result = await postTweet(tweet);
  return result ? { ...result, type: "news" } : null;
}

// ── Market Mood Post ──

export async function postMarketMoodTweet(): Promise<{ id: string; type: XPostType } | null> {
  const signals = await fetchMarketSignals();

  const fgVal = signals.fearGreed.value;
  const fgLabel = fgVal <= 25 ? "Extreme Fear 😱" : fgVal <= 45 ? "Fear 😟" : fgVal <= 55 ? "Neutral 😐" : fgVal <= 75 ? "Greed 🤑" : "Extreme Greed 🤯";

  const btc = signals.signals.find(s => s.symbol === "BTC");
  const eth = signals.signals.find(s => s.symbol === "ETH");
  const sol = signals.signals.find(s => s.symbol === "SOL");

  const longCount = signals.signals.filter(s => s.direction === "LONG").length;
  const shortCount = signals.signals.filter(s => s.direction === "SHORT").length;
  const dominance = longCount > shortCount ? "Long positions dominate" : shortCount > longCount ? "Short positions dominate" : "Market indecisive";

  const lines: string[] = [];
  lines.push(`Market Mood: ${fgLabel}\n`);

  if (btc) lines.push(`$BTC ${formatPrice(btc)} (${formatChange(btc)})`);
  if (eth) lines.push(`$ETH ${formatPrice(eth)} (${formatChange(eth)})`);
  if (sol) lines.push(`$SOL ${formatPrice(sol)} (${formatChange(sol)})`);

  lines.push("");
  lines.push(`${dominance}`);
  lines.push(`${signals.btcTrend === "above_sma" ? "BTC above 7D SMA ↑" : "BTC below 7D SMA ↓"}`);
  lines.push("");
  lines.push("🤖 futuresai.io");
  lines.push("#Crypto #MarketUpdate");

  const result = await postTweet(lines.join("\n"));
  return result ? { ...result, type: "market-mood" } : null;
}

// ── Top Mover Post ──

export async function postTopMoverTweet(): Promise<{ id: string; type: XPostType } | null> {
  const signals = await fetchMarketSignals();
  const sorted = [...signals.signals].sort((a, b) => Math.abs(b.change24h) - Math.abs(a.change24h));
  const mover = sorted[0];
  if (!mover || Math.abs(mover.change24h) < 2) return null; // Only post if significant move

  const direction = mover.change24h > 0 ? "📈" : "📉";
  const verb = mover.change24h > 0 ? "surges" : "drops";

  const lines: string[] = [];
  lines.push(`${direction} $${mover.symbol} ${verb} ${formatChange(mover)} in 24h\n`);
  lines.push(`Price: ${formatPrice(mover)}`);
  lines.push(`RSI: ${mover.rsi.toFixed(0)} | Signal: ${mover.signal}`);
  lines.push(`Direction: ${mover.direction}`);

  if (mover.reasons.length > 0) {
    lines.push("");
    lines.push(mover.reasons[0]);
  }

  lines.push("");
  lines.push("🤖 futuresai.io");
  lines.push("#CryptoSignals #AITrading");

  const result = await postTweet(lines.join("\n"));
  return result ? { ...result, type: "top-mover" } : null;
}

// ── Random Post (picks a random type) ──

export async function postRandomTweet(): Promise<{ id: string; type: XPostType } | null> {
  const types: (() => Promise<{ id: string; type: XPostType } | null>)[] = [
    postSignalTweet,
    postNewsTweet,
    postMarketMoodTweet,
    postTopMoverTweet,
  ];

  // Weighted random: signals 35%, news 30%, mood 20%, top-mover 15%
  const weights = [0.35, 0.30, 0.20, 0.15];
  const rand = Math.random();
  let cumulative = 0;
  let selectedIdx = 0;
  for (let i = 0; i < weights.length; i++) {
    cumulative += weights[i];
    if (rand <= cumulative) {
      selectedIdx = i;
      break;
    }
  }

  return types[selectedIdx]();
}

// ── Helpers ──

function formatPrice(s: SignalItem): string {
  return s.price > 100
    ? `$${s.price.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
    : `$${s.price.toFixed(4)}`;
}

function formatChange(s: SignalItem): string {
  return `${s.change24h >= 0 ? "+" : ""}${s.change24h.toFixed(1)}%`;
}
