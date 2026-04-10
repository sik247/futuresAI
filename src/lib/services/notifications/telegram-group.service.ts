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

// Track recently sent news to avoid repeats (in-memory, resets on cold start)
const recentlySentNews = new Set<string>();
const MAX_SENT_HISTORY = 50;

/**
 * Pick the single most important crypto news, translate to Korean,
 * add a brief AI analysis in both KO + EN, and send as one clean message.
 */
export async function sendHourlyNewsAlert(): Promise<boolean> {
  try {
    const allNews = await fetchCryptoNews();
    if (allNews.length === 0) return false;

    // Filter out recently sent news
    const freshNews = allNews.filter((n) => !recentlySentNews.has(n.title));
    if (freshNews.length === 0) return false;

    // Use Gemini to pick the most market-significant news
    const top10 = freshNews.slice(0, 10);
    const picked = await pickMostSignificantNews(
      top10.map((n) => ({ title: n.title, source: n.source, url: n.url }))
    );

    if (!picked) return false;

    const newsItem = top10[picked.index] || top10[0];
    const [translated] = await translateBatch([newsItem.title]);
    const koTitle = translated?.translated || newsItem.title;

    // Generate bilingual analysis
    const analysis = await generateNewsAnalysis(newsItem.title);

    const now = new Date().toLocaleString("ko-KR", {
      timeZone: "Asia/Seoul",
      hour: "2-digit",
      minute: "2-digit",
    });

    let msg = `<b>BREAKING NEWS</b> · ${now} KST\n\n`;
    msg += `<b>${koTitle}</b>\n`;
    msg += `<i>${newsItem.title}</i>\n\n`;

    // Analysis with strong opinions — "this means → this"
    if (analysis) {
      msg += `${analysis}\n\n`;
    }

    if (picked.reasonKo && picked.reasonEn) {
      msg += `<i>${picked.reasonKo}</i>\n`;
      msg += `<i>${picked.reasonEn}</i>\n\n`;
    } else if (picked.reasonKo) {
      msg += `<i>${picked.reasonKo}</i>\n\n`;
    }

    msg += `여러분은 어떻게 보시나요?\nWhat's your take?\n\n`;
    msg += `<a href="https://futuresai.io/ko/news">더 많은 분석 보기 | More on FuturesAI</a>\n`;
    msg += `<i>— FuturesAI Quant Desk</i>`;

    const sent = await sendGroupMessage(msg);
    if (sent) {
      recentlySentNews.add(newsItem.title);
      // Evict old entries
      if (recentlySentNews.size > MAX_SENT_HISTORY) {
        const first = recentlySentNews.values().next().value;
        if (first) recentlySentNews.delete(first);
      }
    }
    return sent;
  } catch (error) {
    console.error("[telegram-group] News alert failed:", error);
    return false;
  }
}

async function pickMostSignificantNews(
  articles: { title: string; source: string; url: string }[]
): Promise<{ index: number; reasonKo: string; reasonEn: string } | null> {
  try {
    // Cache key based on first 3 article titles (changes hourly as news refreshes)
    const cacheKey = `pick-news:${articles.slice(0, 3).map(a => a.title).join("|").slice(0, 100)}`;

    const raw = await cachedAI(cacheKey, async () => {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) return JSON.stringify({ index: 0, reasonKo: "", reasonEn: "" });

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

      const list = articles.map((a, i) => `${i}. [${a.source}] ${a.title}`).join("\n");

      const prompt = `Pick the 1 most market-significant crypto article from this list.

${list}

Criteria:
- Direct price impact (regulation, major partnership, hack, ETF, rates)
- Major coin related (BTC, ETH, SOL etc.)
- Macro impact (Fed, inflation, gold)
- Exclude marketing/promotional news

Respond in JSON: {"index": number, "reasonKo": "Korean 1-sentence reason why important", "reasonEn": "English 1-sentence reason why important"}

Use a professional quant analyst tone — concise, data-driven, no hype.`;

      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json" },
      });
      return result.response.text();
    }, 20 * 60 * 1000); // 20 min cache

    if (!raw) return { index: 0, reasonKo: "", reasonEn: "" };

    const parsed = JSON.parse(raw);
    return {
      index: Math.min(parsed.index ?? 0, articles.length - 1),
      reasonKo: parsed.reasonKo || parsed.reason || "",
      reasonEn: parsed.reasonEn || "",
    };
  } catch {
    return { index: 0, reasonKo: "", reasonEn: "" };
  }
}

async function generateNewsAnalysis(title: string): Promise<string> {
  const cacheKey = `news-analysis-v2:${title.slice(0, 80)}`;
  return cachedAI(cacheKey, async () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return "";

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `Analyze this crypto news for a Korean trading Telegram group.

News: "${title}"

Write EXACTLY in this format (keep the bold HTML tags):

<b>이건 → 이런 의미 | What This Means</b>

[Korean 3-4 sentences]: "이 뉴스는 [구체적 영향]을 의미합니다." 형식으로 시작. 어떤 코인이 영향받는지, 왜 그런지 구체적으로. 가격 레벨이나 시나리오 언급. 마지막에 대담한 의견 하나. 예: "ETH가 이번 주 $3,200 지지선을 테스트할 가능성이 높습니다."

---

[English 3-4 sentences]: Start with "This means [specific impact]." Which coins win, which lose, and why. Give a specific price level or scenario. End with a bold call. Example: "BTC likely retests $85K support this week — accumulate below that level."

Rules: No emojis. Every sentence must be a concrete claim, not vague. "This means X" not "this could potentially maybe affect markets."`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    return text.length > 50 ? text : "";
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

    let msg = `<b>Tweet Alert</b> · ${now} KST\n\n`;
    msg += `<b>${tweet.displayName}</b> (@${tweet.username})\n`;
    msg += `"${tweet.koreanText.slice(0, 300)}"\n\n`;

    if (tweet.marketAnalysis) {
      msg += `<b>시장 영향 분석 | Market Impact</b>\n${tweet.marketAnalysis}\n\n`;
    }

    if (significant.reasonKo) {
      msg += `<i>${significant.reasonKo}</i>\n`;
    }
    if (significant.reasonEn) {
      msg += `<i>${significant.reasonEn}</i>\n\n`;
    }

    msg += `여러분의 의견은? 댓글로 알려주세요!\nWhat's your take? Share in the chat!\n\n`;
    msg += `<a href="${tweet.tweetUrl}">View Original</a> · <a href="https://futuresai.io/ko/news">FuturesAI</a>\n`;
    msg += `<i>— FuturesAI Quant Desk</i>`;

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
    console.error("[telegram-group] Tweet alert failed:", error);
    return false;
  }
}

async function pickSignificantTweet(
  tweets: { username: string; displayName: string; text: string }[]
): Promise<{ worthy: boolean; index: number; reasonKo: string; reasonEn: string } | null> {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return null;

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const list = tweets
      .map((t, i) => `${i}. @${t.username} (${t.displayName}): "${t.text.slice(0, 200)}"`)
      .join("\n");

    const prompt = `Determine if any of these crypto tweets have real market significance.

${list}

SIGNIFICANT:
- Whale movements (large BTC/ETH transfers)
- Regulatory news (SEC, Fed etc.)
- Exchange announcements (listings, hacks, maintenance)
- Sudden market moves
- Key figure statements (CZ, Vitalik etc.)

NOT SIGNIFICANT:
- Marketing/promotions
- Memes/humor
- Generic price commentary

Respond JSON: {"worthy": true/false, "index": number, "reasonKo": "Korean 1-sentence why significant", "reasonEn": "English 1-sentence why significant (quant tone)"}
If worthy=false, set reasons to empty strings.`;

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
 * Bilingual KO/EN with quant signals, fear/greed, BTC trend, AI briefing,
 * and TradingView chart links.
 */
export async function sendDailySentiment(): Promise<boolean> {
  try {
    const signals = await fetchMarketSignals();
    const headlines = (await fetchCryptoNews()).slice(0, 5).map((n) => n.title);

    // AI market briefing (bilingual)
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

    const nowEn = new Date().toLocaleDateString("en-US", {
      timeZone: "Asia/Seoul",
      month: "short",
      day: "numeric",
    });

    let msg = `<b>Daily Market Report</b> · ${now} (${nowEn})\n\n`;

    // AI briefing (bilingual)
    if (aiBriefing) {
      msg += `<b>AI Market Analysis</b>\n${aiBriefing}\n\n`;
    }

    // Quant signals
    msg += `<b>AI Quant Signals</b>\n\n`;
    for (const s of signals.signals) {
      const sigKo = SIGNAL_KO[s.signal] || s.signal;
      const emoji = SIGNAL_EMOJI[s.signal] || "";
      const changeStr = `${s.change24h >= 0 ? "+" : ""}${s.change24h.toFixed(2)}%`;
      const volStr = s.volume24h >= 1e9
        ? `$${(s.volume24h / 1e9).toFixed(1)}B`
        : `$${(s.volume24h / 1e6).toFixed(0)}M`;

      msg += `${emoji} <b>${s.symbol}</b>  $${s.price.toLocaleString(undefined, { maximumFractionDigits: s.price > 100 ? 0 : 2 })}\n`;
      msg += `   ${changeStr} | Vol ${volStr} | Conf ${s.confidence.toFixed(1)}%\n`;
      msg += `   Signal: <b>${sigKo} (${s.signal})</b>\n\n`;
    }

    // Fear & Greed
    const fgLabelKo =
      signals.fearGreed.value <= 25 ? "극도의 공포" :
      signals.fearGreed.value <= 45 ? "공포" :
      signals.fearGreed.value <= 55 ? "중립" :
      signals.fearGreed.value <= 75 ? "탐욕" : "극도의 탐욕";

    const fgLabelEn =
      signals.fearGreed.value <= 25 ? "Extreme Fear" :
      signals.fearGreed.value <= 45 ? "Fear" :
      signals.fearGreed.value <= 55 ? "Neutral" :
      signals.fearGreed.value <= 75 ? "Greed" : "Extreme Greed";

    msg += `<b>Fear & Greed:</b> ${signals.fearGreed.value}/100 (${fgLabelKo} | ${fgLabelEn})\n`;

    const btcTrendKo = signals.btcTrend === "above_sma" ? "7일 SMA 상향 (강세)" : "7일 SMA 하향 (약세)";
    const btcTrendEn = signals.btcTrend === "above_sma" ? "Above 7D SMA (Bullish)" : "Below 7D SMA (Bearish)";
    msg += `<b>BTC Trend:</b> ${btcTrendKo} | ${btcTrendEn}\n\n`;

    // Generate conclusive recommendation
    const topSignal = signals.signals[0]; // BTC
    const bullCount = signals.signals.filter(s => s.signal === "Strong Buy" || s.signal === "Buy").length;
    const bearCount = signals.signals.filter(s => s.signal === "Strong Sell" || s.signal === "Sell").length;
    const fgVal = signals.fearGreed.value;

    let verdictKo: string;
    let verdictEn: string;
    if (bullCount >= 7) {
      verdictKo = "시장 전반 강세 시그널 우세 — 리스크 관리하며 롱 포지션 유지 권장.";
      verdictEn = "Broad bullish signals across the board — maintain long exposure with proper risk management.";
    } else if (bearCount >= 7) {
      verdictKo = "시장 전반 약세 시그널 우세 — 현금 비중 확대 또는 헤지 권장.";
      verdictEn = "Bearish signals dominating — consider raising cash or hedging existing positions.";
    } else if (fgVal <= 25) {
      verdictKo = "극도의 공포 구간 — 역발상 매수 기회 탐색, 단 분할 진입 필수.";
      verdictEn = "Extreme fear zone — contrarian buy opportunities emerging, but scale in gradually.";
    } else if (fgVal >= 75) {
      verdictKo = "극도의 탐욕 구간 — 이익 실현 고려, 신규 롱 진입은 자제.";
      verdictEn = "Extreme greed zone — consider taking profits, avoid chasing new longs.";
    } else {
      verdictKo = "혼조 시그널 — 확실한 방향성 나올 때까지 소규모 포지션 유지 권장.";
      verdictEn = "Mixed signals — keep position sizes small until a clear directional catalyst emerges.";
    }

    msg += `<b>Verdict | 결론</b>\n`;
    msg += `${verdictKo}\n${verdictEn}\n\n`;

    msg += `오늘 시장 어떻게 보시나요? 의견을 나눠주세요!\nHow are you positioned today? Share your view!\n\n`;
    msg += `<a href="https://futuresai.io/ko/chart-ideas">무료 AI 차트 분석 | Free AI Chart Analysis</a>\n`;
    msg += `<i>— FuturesAI Daily Report</i>`;

    const sent = await sendGroupMessage(msg);

    return sent;
  } catch (error) {
    console.error("[telegram-group] Daily sentiment failed:", error);
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

    const prompt = `You are a senior crypto quant analyst writing a daily market briefing for professional traders.

Today's market data:
${signalSummary}

Fear & Greed Index: ${fearGreed.value}/100 (${fearGreed.classification})
BTC Trend: ${btcTrend === "above_sma" ? "Above 7D SMA (Bullish)" : "Below 7D SMA (Bearish)"}

Today's headlines:
${headlines.join("\n")}

Write a BILINGUAL briefing in this exact format:

[Korean section: 3-4 sentences of comprehensive market analysis]

---

[English section: 3-4 sentences — same analysis in English]

Requirements for BOTH sections:
1. Overall market sentiment and direction with supporting data
2. Key coin-specific observations worth noting
3. Risk factors traders should watch
4. Actionable insight for positioning

Tone: Professional quant desk — precise, data-driven, no hype, no emojis. Write like a Goldman Sachs morning note.`;

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
