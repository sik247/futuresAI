import { GoogleGenerativeAI } from "@google/generative-ai";
import { fetchCryptoNews } from "@/lib/services/news/crypto-news.service";
import { fetchMarketSignals } from "@/lib/services/signals/signals.service";
import { translateBatch } from "@/lib/services/social/korean-translator.service";
import { sendGroupMessage, sendGroupPhoto } from "./telegram.service";
import { cachedAI } from "@/lib/services/ai-cache";
import { getAnalyzedTweets } from "./tweet-analysis.service";

/* ================================================================== */
/*  1. HOURLY NEWS ALERT — one significant news item per hour          */
/* ================================================================== */

/**
 * Pick the single most important crypto news, translate to Korean,
 * add a brief AI analysis, and send as one clean message.
 */
export async function sendHourlyNewsAlert(): Promise<boolean> {
  try {
    const allNews = await fetchCryptoNews();
    if (allNews.length === 0) return false;

    // Use Gemini to pick the most market-significant news
    const top10 = allNews.slice(0, 10);
    const picked = await pickMostSignificantNews(
      top10.map((n) => ({ title: n.title, source: n.source, url: n.url }))
    );

    if (!picked) return false;

    const newsItem = top10[picked.index] || top10[0];
    const [translated] = await translateBatch([newsItem.title]);
    const koTitle = translated?.translated || newsItem.title;

    // Generate Korean analysis of this single news item
    const analysis = await generateNewsAnalysis(newsItem.title);

    const now = new Date().toLocaleString("ko-KR", {
      timeZone: "Asia/Seoul",
      hour: "2-digit",
      minute: "2-digit",
    });

    let msg = `<b>속보</b> · ${now}\n\n`;
    msg += `<b>${koTitle}</b>\n`;
    msg += `<i>${newsItem.source}</i> · <a href="${newsItem.url}">원문 보기</a>\n\n`;

    if (analysis) {
      msg += `${analysis}\n\n`;
    }

    if (picked.reason) {
      msg += `<i>${picked.reason}</i>\n\n`;
    }

    msg += `<i>— FuturesAI</i>`;

    return await sendGroupMessage(msg);
  } catch (error) {
    console.error("[telegram-group] 뉴스 알림 실패:", error);
    return false;
  }
}

async function pickMostSignificantNews(
  articles: { title: string; source: string; url: string }[]
): Promise<{ index: number; reason: string } | null> {
  try {
    // Cache key based on first 3 article titles (changes hourly as news refreshes)
    const cacheKey = `pick-news:${articles.slice(0, 3).map(a => a.title).join("|").slice(0, 100)}`;

    const raw = await cachedAI(cacheKey, async () => {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) return JSON.stringify({ index: 0, reason: "" });

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

      const list = articles.map((a, i) => `${i}. [${a.source}] ${a.title}`).join("\n");

      const prompt = `다음 크립토 뉴스 중 시장에 가장 큰 영향을 미치는 기사 1개를 골라주세요.

${list}

판단 기준:
- 가격에 직접적 영향 (규제, 대형 파트너십, 해킹, ETF, 금리)
- 주요 코인 관련 (BTC, ETH, SOL 등)
- 거시경제 영향 (연준, 인플레이션, 금)
- 광고성/마케팅 뉴스는 제외

JSON으로 답변: {"index": 숫자, "reason": "한국어로 이 뉴스가 중요한 이유 1문장"}`;

      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json" },
      });
      return result.response.text();
    }, 20 * 60 * 1000); // 20 min cache

    if (!raw) return { index: 0, reason: "" };

    const parsed = JSON.parse(raw);
    return {
      index: Math.min(parsed.index ?? 0, articles.length - 1),
      reason: parsed.reason || "",
    };
  } catch {
    return { index: 0, reason: "" };
  }
}

async function generateNewsAnalysis(title: string): Promise<string> {
  const cacheKey = `news-analysis:${title.slice(0, 80)}`;
  return cachedAI(cacheKey, async () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return "";

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `크립토 뉴스: "${title}"

이 뉴스의 시장 영향을 한국어 2문장으로 분석하세요:
- 호재/악재/중립 판단
- 영향 받는 코인이나 섹터
이모지 사용 금지. 전문적이고 간결하게.`;

    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  }, 30 * 60 * 1000);
}

/* ================================================================== */
/*  2. TWEET ALERT — significant tweets only, one at a time            */
/* ================================================================== */

/**
 * Check for a significant tweet, translate + analyze, send if worthy.
 * Returns true if a tweet was sent, false if nothing significant.
 */
export async function sendTweetAlert(): Promise<boolean> {
  try {
    const tweets = await getAnalyzedTweets(5);
    if (tweets.length === 0) return false;

    // Use Gemini to determine if any tweet is significant enough to alert
    const significant = await pickSignificantTweet(
      tweets.map((t) => ({
        username: t.username,
        displayName: t.displayName,
        text: t.originalText,
      }))
    );

    if (!significant || !significant.worthy) return false;

    const tweet = tweets[significant.index] || tweets[0];

    const now = new Date().toLocaleString("ko-KR", {
      timeZone: "Asia/Seoul",
      hour: "2-digit",
      minute: "2-digit",
    });

    let msg = `<b>트윗 알림</b> · ${now}\n\n`;
    msg += `<b>${tweet.displayName}</b> (@${tweet.username})\n`;
    msg += `"${tweet.koreanText.slice(0, 300)}"\n\n`;

    if (tweet.marketAnalysis) {
      msg += `<b>시장 영향 분석</b>\n${tweet.marketAnalysis}\n\n`;
    }

    if (significant.reason) {
      msg += `<i>${significant.reason}</i>\n\n`;
    }

    msg += `<a href="${tweet.tweetUrl}">원문 보기</a>\n`;
    msg += `<i>— FuturesAI</i>`;

    const sent = await sendGroupMessage(msg);

    // Send tweet media if available
    if (tweet.hasMedia && tweet.mediaUrl) {
      try {
        await sendGroupPhoto(tweet.mediaUrl, `@${tweet.username}`);
      } catch {
        // Optional
      }
    }

    return sent;
  } catch (error) {
    console.error("[telegram-group] 트윗 알림 실패:", error);
    return false;
  }
}

async function pickSignificantTweet(
  tweets: { username: string; displayName: string; text: string }[]
): Promise<{ worthy: boolean; index: number; reason: string } | null> {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return null;

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const list = tweets
      .map((t, i) => `${i}. @${t.username} (${t.displayName}): "${t.text.slice(0, 200)}"`)
      .join("\n");

    const prompt = `다음 크립토 트윗 중 시장에 실질적 영향을 주는 것이 있는지 판단하세요.

${list}

중요한 트윗 기준:
- 고래 이동 (대량 BTC/ETH 전송)
- 규제 뉴스 (SEC, 연준 등)
- 거래소 중요 공지 (상장, 해킹, 점검)
- 시장 급변 알림
- 주요 인물 발언 (CZ, Vitalik 등)

중요하지 않은 것:
- 일반 마케팅/프로모션
- 밈/유머
- 일반적인 가격 코멘트

JSON으로 답변: {"worthy": true/false, "index": 숫자, "reason": "한국어로 왜 중요한지 1문장 (worthy=false이면 빈 문자열)"}`;

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json" },
    });

    return JSON.parse(result.response.text());
  } catch {
    return null;
  }
}

/* ================================================================== */
/*  3. DAILY SENTIMENT — full quant analysis, once per day             */
/* ================================================================== */

const SIGNAL_KO: Record<string, string> = {
  "Strong Buy": "강력 매수",
  Buy: "매수",
  Neutral: "중립",
  Sell: "매도",
  "Strong Sell": "강력 매도",
};

const SIGNAL_EMOJI: Record<string, string> = {
  "Strong Buy": "🟢🟢",
  Buy: "🟢",
  Neutral: "⚪",
  Sell: "🔴",
  "Strong Sell": "🔴🔴",
};

/**
 * Send a comprehensive daily sentiment analysis — once per day.
 * Includes quant signals, fear/greed, BTC trend, AI market briefing,
 * and TradingView chart links.
 */
export async function sendDailySentiment(): Promise<boolean> {
  try {
    const signals = await fetchMarketSignals();
    const headlines = (await fetchCryptoNews()).slice(0, 5).map((n) => n.title);

    // AI market briefing
    const aiBriefing = await generateDailyBriefing(
      headlines,
      signals.signals,
      signals.fearGreed,
      signals.btcTrend
    );

    const now = new Date().toLocaleString("ko-KR", {
      timeZone: "Asia/Seoul",
      month: "long",
      day: "numeric",
    });

    let msg = `<b>데일리 마켓 리포트</b> · ${now}\n\n`;

    // AI briefing
    if (aiBriefing) {
      msg += `<b>AI 마켓 분석</b>\n${aiBriefing}\n\n`;
    }

    // Quant signals
    msg += `<b>AI 퀀트 시그널</b>\n\n`;
    for (const s of signals.signals) {
      const sigKo = SIGNAL_KO[s.signal] || s.signal;
      const emoji = SIGNAL_EMOJI[s.signal] || "";
      const changeStr = `${s.change24h >= 0 ? "+" : ""}${s.change24h.toFixed(2)}%`;
      const volStr = s.volume24h >= 1e9
        ? `$${(s.volume24h / 1e9).toFixed(1)}B`
        : `$${(s.volume24h / 1e6).toFixed(0)}M`;

      msg += `${emoji} <b>${s.symbol}</b>  $${s.price.toLocaleString(undefined, { maximumFractionDigits: s.price > 100 ? 0 : 2 })}\n`;
      msg += `   ${changeStr} | 거래량 ${volStr} | 신뢰도 ${s.confidence}%\n`;
      msg += `   시그널: <b>${sigKo}</b>\n\n`;
    }

    // Fear & Greed
    const fgLabel =
      signals.fearGreed.value <= 25 ? "극도의 공포" :
      signals.fearGreed.value <= 45 ? "공포" :
      signals.fearGreed.value <= 55 ? "중립" :
      signals.fearGreed.value <= 75 ? "탐욕" : "극도의 탐욕";

    msg += `<b>공포탐욕지수:</b> ${signals.fearGreed.value}/100 (${fgLabel})\n`;
    msg += `<b>BTC 추세:</b> ${signals.btcTrend === "above_sma" ? "7일 SMA 상향 (강세)" : "7일 SMA 하향 (약세)"}\n\n`;

    // Chart links
    msg += `<b>실시간 차트</b>\n`;
    msg += `<a href="https://www.tradingview.com/chart/?symbol=BINANCE:BTCUSDT&interval=240">BTC/USDT 4시간봉</a>\n`;
    msg += `<a href="https://www.tradingview.com/chart/?symbol=BINANCE:ETHUSDT&interval=240">ETH/USDT 4시간봉</a>\n`;
    msg += `<a href="https://www.tradingview.com/chart/?symbol=BINANCE:SOLUSDT&interval=240">SOL/USDT 4시간봉</a>\n\n`;

    msg += `무료 AI 차트 분석: cryptox.co\n`;
    msg += `<i>— FuturesAI 데일리 리포트</i>`;

    const sent = await sendGroupMessage(msg);

    // BTC chart image
    try {
      await sendGroupPhoto(
        `https://www.tradingview.com/x/snapshot/?symbol=BINANCE:BTCUSDT&interval=240&theme=dark`,
        `<b>BTC/USDT 4시간봉</b>\n현재가: $${signals.signals.find(s => s.symbol === "BTC")?.price.toLocaleString() || "N/A"}`,
      );
    } catch {
      // Optional
    }

    return sent;
  } catch (error) {
    console.error("[telegram-group] 데일리 센티먼트 전송 실패:", error);
    return false;
  }
}

async function generateDailyBriefing(
  headlines: string[],
  signals: { symbol: string; price: number; change24h: number; signal: string }[],
  fearGreed: { value: number; classification: string },
  btcTrend: string
): Promise<string> {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return "";

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const signalSummary = signals
      .map((s) => `${s.symbol}: $${s.price.toLocaleString()} (${s.change24h > 0 ? "+" : ""}${s.change24h.toFixed(2)}%) - ${s.signal}`)
      .join("\n");

    const prompt = `당신은 한국 크립토 투자자를 위한 전문 시장 분석가입니다.

오늘의 시장 데이터:
${signalSummary}

공포탐욕지수: ${fearGreed.value}/100 (${fearGreed.classification})
BTC 트렌드: ${btcTrend === "above_sma" ? "7일 SMA 상향 돌파 (강세)" : "7일 SMA 하향 이탈 (약세)"}

오늘의 주요 뉴스:
${headlines.join("\n")}

한국어로 4-5문장의 종합 시장 분석을 작성하세요:
1. 전체 시장 분위기와 방향성
2. 주요 코인별 주목 포인트
3. 오늘의 리스크 요인
4. 트레이더를 위한 핵심 조언

전문적이고 통찰력 있게. 이모지 사용 금지.`;

    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  } catch {
    return "";
  }
}

/* ================================================================== */
/*  LEGACY: Keep sendGroupDigest for backward compat (test endpoint)   */
/* ================================================================== */
export async function sendGroupDigest(): Promise<boolean> {
  // Run all three in sequence for testing
  const news = await sendHourlyNewsAlert();
  const sentiment = await sendDailySentiment();
  return news || sentiment;
}
