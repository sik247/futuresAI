import { GoogleGenerativeAI } from "@google/generative-ai";
import { fetchCryptoNews, type CryptoNewsItem } from "@/lib/services/news/crypto-news.service";
import { fetchMarketSignals } from "@/lib/services/signals/signals.service";
import { sendGroupMessage } from "./telegram.service";
import { getSnapshotForText } from "./agents/price-snapshot.agent";

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
      // Real-time price snapshot for whichever tickers the headline touches.
      const priceBlock = await getSnapshotForText(item.title);
      const priceLine = priceBlock
        ? `현재가 (이 가격만 인용. 다른 가격 만들어내지 말 것):\n${priceBlock}`
        : "가격 데이터 없음 — 구체적 달러 수치 인용 금지.";

      const result = await model.generateContent(`한국 크립토 트레이더가 텔레그램 단톡방에 던지는 1-2줄 채팅. AI 보고서 말투 절대 금지.

${priceLine}

뉴스: ${item.title}
출처: ${item.source}
${item.body ? `상세: ${item.body.slice(0, 400)}` : ""}

정확히 2줄로 (HTML 태그 유지, 빈 줄 없음):
💬 [한 문장, 최대 80자. 위 가격 1개만 인용. 끝에 📈/📉/⚖️ 중 1개]
🎯 [롱/숏/관망] [⏸/🟢/🔴 1개]

규칙:
- 위에 안 적힌 가격은 절대 만들어내지 말 것.
- 금지 표현: "이 뉴스는 ~의미합니다", "~시사합니다", "투자자들이", "긍정적 반응", "추가적인 강세", "범위로 설정"
- 사용 어투: "~네", "~인 듯", "~할 듯", "~봐야할 듯", "~뚫으면", "~찍으면"
- 한 문장만, 풀어쓰지 말 것.
- 허용 이모지: 💬🎯📈📉⚖️⏸🟢🔴 만.

좋은 예:
💬 BTC 95K 매물대 못 뚫으면 92K까지 밀릴 듯 📉
🎯 관망 ⏸`);

      const analysis = result.response.text().trim();
      if (!analysis) continue;

      let msg = `🔴 <b>#속보 ${item.title}</b>\n`;
      msg += `${analysis}\n`;
      msg += `<a href="https://futuresai.io/ko/news">FuturesAI</a> · 다들 어떻게 보세요? 💬`;

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
