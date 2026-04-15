import { GoogleGenerativeAI } from "@google/generative-ai";
import { fetchCryptoNews, type CryptoNewsItem } from "@/lib/services/news/crypto-news.service";
import { fetchMarketSignals } from "@/lib/services/signals/signals.service";
import { sendGroupMessage } from "./telegram.service";

/**
 * Market Watch — Change-detection service
 *
 * Runs every 10 minutes. Detects meaningful changes in:
 * 1. Breaking news (new headlines not seen before)
 * 2. Price signals (direction flips, RSI extremes)
 * 3. Polymarket odds shifts
 *
 * Only sends Telegram alerts when something actually changes.
 */

// ── In-memory state (resets on cold start) ──

const seenNewsIds = new Set<string>();
let newsInitialized = false;
const lastSignalDirection: Record<string, string> = {};
let lastFearGreed = -1;
let lastPolymarketState: Record<string, number> = {};
const MAX_SEEN = 100;

// ── Thresholds ──

const PRICE_MOVE_THRESHOLD = 3; // % in 24h to trigger alert
const FNG_CHANGE_THRESHOLD = 10; // Fear & Greed shift to trigger
const POLYMARKET_SHIFT_THRESHOLD = 5; // % odds change to trigger

// ── Main entry point ──

export async function runMarketWatch(force = false): Promise<{ alerts: number; types: string[] }> {
  const alerts: string[] = [];
  const types: string[] = [];

  // Force mode: send news immediately without change detection
  if (force) {
    const forceNews = await sendForceNews();
    if (forceNews.messages.length > 0) {
      alerts.push(...forceNews.messages);
      types.push("news");
    }
    // Send alerts
    for (let i = 0; i < alerts.length; i++) {
      await sendGroupMessage(alerts[i]);
      if (i < alerts.length - 1) await new Promise(r => setTimeout(r, 2000));
    }
    return { alerts: alerts.length, types };
  }

  // Run all checks in parallel
  const [newsResult, signalResult, polyResult] = await Promise.allSettled([
    checkBreakingNews(),
    checkSignalChanges(),
    checkPolymarketShifts(),
  ]);

  if (newsResult.status === "fulfilled" && newsResult.value) {
    alerts.push(...newsResult.value.messages);
    if (newsResult.value.messages.length > 0) types.push("news");
  }
  if (signalResult.status === "fulfilled" && signalResult.value) {
    alerts.push(...signalResult.value.messages);
    if (signalResult.value.messages.length > 0) types.push("signal");
  }
  if (polyResult.status === "fulfilled" && polyResult.value) {
    alerts.push(...polyResult.value.messages);
    if (polyResult.value.messages.length > 0) types.push("polymarket");
  }

  // Send alerts with delay between each
  for (let i = 0; i < alerts.length; i++) {
    await sendGroupMessage(alerts[i]);
    if (i < alerts.length - 1) await new Promise(r => setTimeout(r, 2000));
  }

  return { alerts: alerts.length, types };
}

// ── Force mode: send top news immediately (no change detection) ──

async function sendForceNews(): Promise<{ messages: string[] }> {
  const messages: string[] = [];

  // Always send signal summary in force mode — it's reliable
  try {
    const signals = await fetchMarketSignals();
    const EMOJI: Record<string, string> = {
      "Strong Buy": "🟢🟢", "Buy": "🟢", "Neutral": "⚪", "Sell": "🔴", "Strong Sell": "🔴🔴",
    };
    const now = new Date().toLocaleString("en-US", { timeZone: "Asia/Seoul", month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false });
    let msg = `<b>📡 Signal Update</b> · ${now} KST\n\n`;
    for (const s of signals.signals.slice(0, 6)) {
      const emoji = EMOJI[s.signal] || "";
      const price = s.price > 100 ? `$${s.price.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : `$${s.price.toFixed(4)}`;
      const change = `${s.change24h >= 0 ? "+" : ""}${s.change24h.toFixed(1)}%`;
      msg += `${emoji} <b>${s.symbol}</b> ${price} (${change}) ${s.direction}\n`;
    }
    const fgVal = signals.fearGreed.value;
    const fgLabel = fgVal <= 25 ? "Extreme Fear" : fgVal <= 45 ? "Fear" : fgVal <= 55 ? "Neutral" : fgVal <= 75 ? "Greed" : "Extreme Greed";
    msg += `\nFear & Greed: ${fgVal}/100 (${fgLabel})\n`;
    msg += `${signals.btcTrend === "above_sma" ? "BTC above 7D SMA ↑" : "BTC below 7D SMA ↓"}\n\n`;
    msg += `<a href="https://futuresai.io/ko/home">실시간 시그널 보기</a>`;
    messages.push(msg);
  } catch (err) {
    console.error("[market-watch] Force signal failed:", err);
  }

  return { messages };
}

// ── 1. Breaking News Detection ──

async function checkBreakingNews(): Promise<{ messages: string[] }> {
  const messages: string[] = [];
  const news = await fetchCryptoNews();
  if (news.length === 0) return { messages };

  // First run after cold start: seed the set, don't alert
  if (!newsInitialized) {
    for (const n of news) seenNewsIds.add(n.title);
    newsInitialized = true;
    console.log(`[market-watch] Cold start — seeded ${news.length} news items, will alert on next new headlines`);
    return { messages };
  }

  // Find unseen news
  const fresh = news.filter(n => !seenNewsIds.has(n.title));
  if (fresh.length === 0) return { messages };

  // Mark all as seen
  for (const n of news) {
    seenNewsIds.add(n.title);
    if (seenNewsIds.size > MAX_SEEN) {
      const first = seenNewsIds.values().next().value;
      if (first) seenNewsIds.delete(first);
    }
  }

  // Pick top 2 most important fresh news
  const top = fresh.slice(0, 2);

  // AI analysis for each
  const geminiKey = process.env.GEMINI_API_KEY;
  if (!geminiKey) return { messages };

  const genAI = new GoogleGenerativeAI(geminiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  for (const item of top) {
    try {
      const result = await model.generateContent(`You are a head trader writing a morning note. Your job is to answer ONE question: "What does this news mean for my portfolio TODAY?"

Write exactly 3 short paragraphs:

1. WHAT HAPPENED (1 sentence max — just the fact, no opinion)

2. WHAT IT MEANS FOR PRICES — this is the most important part. Be extremely specific:
   - Name exact coins affected and whether they go UP or DOWN
   - Give a magnitude estimate: "expect 2-4% move" not "could impact prices"
   - Give a timeframe: "within 24h" or "over the next week"
   - Say whether to BUY, SELL, or DO NOTHING right now
   Example: "Bearish for ETH short-term. Expect 3-5% pullback within 48h. Reduce long exposure above $2,400."

3. WHY — one sentence of evidence. Either a historical precedent with a date and number, or a structural reason.
   Example: "Last comparable ruling (Nov 2023) triggered a 12% BTC selloff over 4 days."

DO NOT be vague. DO NOT say "could impact" or "may affect" or "traders should watch." State what WILL likely happen.
English only. Max 450 characters. No markdown, no emojis, no hashtags.

News: ${item.title}
Source: ${item.source}
${item.body ? `Detail: ${item.body.slice(0, 500)}` : ""}`);

      const analysis = result.response.text().trim();

      const now = new Date().toLocaleString("en-US", {
        timeZone: "Asia/Seoul",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });

      let msg = `<b>🔴 Breaking</b> · ${now} KST\n\n`;
      msg += `<b>${item.title}</b>\n`;
      msg += `<i>${item.source}</i>\n\n`;
      msg += `${analysis}\n\n`;
      msg += `<a href="https://futuresai.io/en/news">More on FuturesAI →</a>`;

      messages.push(msg);
    } catch (err) {
      console.warn("[market-watch] News analysis failed:", err instanceof Error ? err.message : err);
    }
  }

  return { messages };
}

// ── 2. Signal Change Detection ──

async function checkSignalChanges(): Promise<{ messages: string[] }> {
  const messages: string[] = [];
  const signals = await fetchMarketSignals();

  // Check for direction flips (LONG → SHORT or vice versa)
  const flips: string[] = [];
  for (const s of signals.signals) {
    const prev = lastSignalDirection[s.symbol];
    if (prev && prev !== s.direction && s.direction !== "NEUTRAL" && prev !== "NEUTRAL") {
      flips.push(s.symbol);
    }
    lastSignalDirection[s.symbol] = s.direction;
  }

  // Check for big price moves
  const bigMovers = signals.signals.filter(s => Math.abs(s.change24h) >= PRICE_MOVE_THRESHOLD);

  // Check for Fear & Greed shift
  const fgChanged = lastFearGreed >= 0 && Math.abs(signals.fearGreed.value - lastFearGreed) >= FNG_CHANGE_THRESHOLD;
  const prevFG = lastFearGreed;
  lastFearGreed = signals.fearGreed.value;

  // Build alert if any signal change detected
  if (flips.length === 0 && bigMovers.length === 0 && !fgChanged) return { messages };

  const now = new Date().toLocaleString("en-US", {
    timeZone: "Asia/Seoul",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  let msg = `<b>⚡ Signal Change Detected</b> · ${now} KST\n\n`;

  if (flips.length > 0) {
    msg += `<b>Direction Flip:</b>\n`;
    for (const sym of flips) {
      const s = signals.signals.find(x => x.symbol === sym);
      if (!s) continue;
      const prev = lastSignalDirection[sym] === "LONG" ? "SHORT" : "LONG";
      const price = s.price > 100
        ? `$${s.price.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
        : `$${s.price.toFixed(4)}`;
      msg += `${sym} ${prev} → ${s.direction} (${price})\n`;
    }
    msg += `\n`;
  }

  if (bigMovers.length > 0) {
    msg += `<b>Big Moves (24h):</b>\n`;
    for (const s of bigMovers.slice(0, 3)) {
      const emoji = s.change24h > 0 ? "📈" : "📉";
      const price = s.price > 100
        ? `$${s.price.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
        : `$${s.price.toFixed(4)}`;
      msg += `${emoji} ${s.symbol} ${price} (${s.change24h >= 0 ? "+" : ""}${s.change24h.toFixed(1)}%)\n`;
    }
    msg += `\n`;
  }

  if (fgChanged) {
    const fgLabel = (v: number) =>
      v <= 25 ? "Extreme Fear" :
      v <= 45 ? "Fear" :
      v <= 55 ? "Neutral" :
      v <= 75 ? "Greed" : "Extreme Greed";
    msg += `<b>Fear & Greed Shift:</b>\n`;
    msg += `${prevFG} → ${signals.fearGreed.value} (${fgLabel(signals.fearGreed.value)})\n\n`;
  }

  msg += `<a href="https://futuresai.io/en/home">Live Signals →</a>`;
  messages.push(msg);

  return { messages };
}

// ── 3. Polymarket Odds Change Detection ──

async function checkPolymarketShifts(): Promise<{ messages: string[] }> {
  const messages: string[] = [];

  try {
    const res = await fetch(
      "https://gamma-api.polymarket.com/events?closed=false&tag=crypto&limit=10&order=volume&ascending=false",
      { signal: AbortSignal.timeout(5000) }
    );
    const events = await res.json();
    if (!Array.isArray(events) || events.length === 0) return { messages };

    const shifts: { title: string; oldOdds: number; newOdds: number; volume: number }[] = [];

    for (const event of events.slice(0, 8)) {
      if (!event.markets?.[0]) continue;
      const market = event.markets[0];
      try {
        const prices = JSON.parse(market.outcomePrices || "[]");
        const yesPrice = prices[0] ? parseFloat(prices[0]) * 100 : 0;
        const vol = parseFloat(market.volume || event.volume || "0");
        const key = event.title || market.question;

        const prev = lastPolymarketState[key];
        if (prev !== undefined && Math.abs(yesPrice - prev) >= POLYMARKET_SHIFT_THRESHOLD) {
          shifts.push({ title: key, oldOdds: prev, newOdds: yesPrice, volume: vol });
        }
        lastPolymarketState[key] = yesPrice;
      } catch { continue; }
    }

    if (shifts.length === 0) return { messages };

    // AI analysis of odds shifts
    const geminiKey = process.env.GEMINI_API_KEY;
    if (!geminiKey) return { messages };

    const genAI = new GoogleGenerativeAI(geminiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const shiftsText = shifts.map(s =>
      `"${s.title}": ${s.oldOdds.toFixed(0)}% → ${s.newOdds.toFixed(0)}% (Vol: $${(s.volume / 1e6).toFixed(1)}M)`
    ).join("\n");

    const result = await model.generateContent(`You are a head trader. Polymarket prediction odds just shifted:

${shiftsText}

Answer in 2 short paragraphs:

1. WHAT TO DO — Are these odds LEADING or LAGGING spot prices? If leading, name exactly which coins to buy or sell and by when. If lagging, say "already priced in — no action needed."

2. PRECEDENT — One specific past example where prediction market odds moved like this and what happened to spot prices after. Include the date and percentage move.

DO NOT be vague. State a clear trade direction.
English only. Max 350 characters. No markdown, no emojis, no hashtags.`);

    const analysis = result.response.text().trim();

    const now = new Date().toLocaleString("en-US", {
      timeZone: "Asia/Seoul",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

    let msg = `<b>🎯 Polymarket Shift</b> · ${now} KST\n\n`;
    for (const s of shifts) {
      const arrow = s.newOdds > s.oldOdds ? "↑" : "↓";
      msg += `${arrow} ${s.title}\n`;
      msg += `   ${s.oldOdds.toFixed(0)}% → <b>${s.newOdds.toFixed(0)}%</b> | Vol: $${(s.volume / 1e6).toFixed(1)}M\n\n`;
    }
    msg += `${analysis}\n\n`;
    msg += `<a href="https://futuresai.io/en/markets">Polymarket Analysis →</a>`;

    messages.push(msg);
  } catch (err) {
    console.warn("[market-watch] Polymarket check failed:", err instanceof Error ? err.message : err);
  }

  return { messages };
}
