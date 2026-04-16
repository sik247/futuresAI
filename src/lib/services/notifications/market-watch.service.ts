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

const PRICE_MOVE_THRESHOLD = 10; // % in 24h to trigger alert
const FNG_CHANGE_THRESHOLD = 15; // Fear & Greed shift to trigger
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
    const now = new Date().toLocaleString("ko-KR", { timeZone: "Asia/Seoul", month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false });
    let msg = `<b>📡 시그널 업데이트</b> · ${now} KST\n\n`;
    for (const s of signals.signals.slice(0, 6)) {
      const emoji = EMOJI[s.signal] || "";
      const price = s.price > 100 ? `$${s.price.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : `$${s.price.toFixed(4)}`;
      const change = `${s.change24h >= 0 ? "+" : ""}${s.change24h.toFixed(1)}%`;
      msg += `${emoji} <b>${s.symbol}</b> ${price} (${change}) ${s.direction}\n`;
    }
    const fgVal = signals.fearGreed.value;
    const fgLabel = fgVal <= 25 ? "극도의 공포" : fgVal <= 45 ? "공포" : fgVal <= 55 ? "중립" : fgVal <= 75 ? "탐욕" : "극도의 탐욕";
    msg += `\nFear & Greed: ${fgVal}/100 (${fgLabel})\n`;
    msg += `${signals.btcTrend === "above_sma" ? "BTC 7일 이동평균 상향 ↑" : "BTC 7일 이동평균 하향 ↓"}\n\n`;
    msg += `<a href="https://futuresai.io/ko/home">실시간 시그널 보기</a>\n<i>— FuturesAI드림</i>`;
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
      const result = await model.generateContent(`당신은 수석 트레이더입니다. 이 뉴스가 "오늘 내 포트폴리오에 어떤 의미인지" 답하세요.

정확히 3개 문단으로 작성:

1. 무슨 일이 일어났나 (1문장 — 사실만, 의견 없이)

2. 가격에 미치는 영향 — 가장 중요한 부분:
   - 영향받는 코인과 방향(상승/하락) 명시
   - 변동폭 예상: "2-4% 움직임 예상" (모호하게 "영향 있을 수 있음" 금지)
   - 시간대: "24시간 이내" 또는 "1주일 내"
   - 지금 매수/매도/관망 중 무엇을 해야 하는지 명시

3. 근거 — 역사적 선례(날짜, 수치 포함) 또는 구조적 이유 1문장

모호한 표현 금지. "영향 있을 수 있음", "주시해야 함" 등 금지. 무엇이 일어날 것인지 단정적으로 서술.
최대 500자. 마크다운, 이모지, 해시태그 금지.

뉴스: ${item.title}
출처: ${item.source}
${item.body ? `상세: ${item.body.slice(0, 500)}` : ""}`);

      const analysis = result.response.text().trim();

      const now = new Date().toLocaleString("ko-KR", {
        timeZone: "Asia/Seoul",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });

      let msg = `<b>🔴 속보</b> · ${now} KST\n\n`;
      msg += `<b>${item.title}</b>\n`;
      msg += `<i>${item.source}</i>\n\n`;
      msg += `${analysis}\n\n`;
      msg += `<a href="https://futuresai.io/ko/news">FuturesAI에서 더 보기</a>\n<i>— FuturesAI드림</i>`;

      messages.push(msg);
    } catch (err) {
      console.warn("[market-watch] News analysis failed:", err instanceof Error ? err.message : err);
    }
  }

  return { messages };
}

// ── 2. Signal Change Detection ──

async function checkSignalChanges(): Promise<{ messages: string[] }> {
  // Signal change alerts disabled — only the 4-hour cron-quick-signals report sends signals now
  return { messages: [] };
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

    const result = await model.generateContent(`당신은 수석 트레이더입니다. Polymarket 예측 시장 확률이 변동했습니다:

${shiftsText}

2개 문단으로 답하세요:

1. 어떻게 할 것인가 — 이 확률 변동이 현물 가격을 선행하는가 후행하는가? 선행이면 매수/매도할 코인과 시점을 구체적으로. 후행이면 "이미 반영됨 — 조치 불필요."

2. 과거 사례 — 비슷한 확률 변동이 있었던 과거 사례, 이후 현물 가격 움직임(날짜, 변동폭 포함).

모호한 표현 금지. 명확한 매매 방향 제시.
최대 400자. 마크다운, 이모지, 해시태그 금지.`);

    const analysis = result.response.text().trim();

    const now = new Date().toLocaleString("ko-KR", {
      timeZone: "Asia/Seoul",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

    let msg = `<b>🎯 예측 시장 변동</b> · ${now} KST\n\n`;
    for (const s of shifts) {
      const arrow = s.newOdds > s.oldOdds ? "↑" : "↓";
      msg += `${arrow} ${s.title}\n`;
      msg += `   ${s.oldOdds.toFixed(0)}% → <b>${s.newOdds.toFixed(0)}%</b> | Vol: $${(s.volume / 1e6).toFixed(1)}M\n\n`;
    }
    msg += `${analysis}\n\n`;
    msg += `<a href="https://futuresai.io/ko/markets">예측 시장 분석 보기</a>\n<i>— FuturesAI드림</i>`;

    messages.push(msg);
  } catch (err) {
    console.warn("[market-watch] Polymarket check failed:", err instanceof Error ? err.message : err);
  }

  return { messages };
}
