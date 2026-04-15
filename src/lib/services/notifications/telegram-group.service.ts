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
/*  4. FAST NEWS FLASH — rapid-fire short news, like 트레이딩 PRO      */
/* ================================================================== */

const recentFlashNews = new Set<string>();
const MAX_FLASH_HISTORY = 100;

/**
 * Send 3-5 short news items as separate messages — concise Korean
 * headline + 1-2 sentence AI analysis + related tickers + site link.
 */
export async function sendFastNewsFlash(): Promise<{ sent: number }> {
  try {
    const allNews = await fetchCryptoNews();
    if (allNews.length === 0) return { sent: 0 };

    // Filter already sent
    const freshNews = allNews.filter(
      (n) => !recentFlashNews.has(n.title) && !recentlySentNews.has(n.title)
    );
    if (freshNews.length === 0) return { sent: 0 };

    // Use Gemini to rank and summarize top 5 news for flash format
    const top15 = freshNews.slice(0, 15);
    const flashItems = await rankNewsForFlash(top15);
    if (!flashItems || flashItems.length === 0) return { sent: 0 };

    let sentCount = 0;
    for (const item of flashItems.slice(0, 5)) {
      const newsItem = top15[item.index];
      if (!newsItem) continue;

      const now = new Date().toLocaleString("ko-KR", {
        timeZone: "Asia/Seoul",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });

      let msg = `<b>#뉴스</b>\n\n`;
      msg += `<b>${item.headlineKo}</b>\n\n`;
      msg += `AI: ${item.analysisKo}\n\n`;

      if (item.tickers && item.tickers.length > 0) {
        msg += `관련 : ${item.tickers.map((t: string) => `$${t}`).join(", ")}\n\n`;
      }

      msg += `${now}\n`;
      msg += `<a href="https://futuresai.io/ko/news">FuturesAI에서 더 보기</a>`;

      const sent = await sendGroupMessage(msg);
      if (sent) {
        recentFlashNews.add(newsItem.title);
        if (recentFlashNews.size > MAX_FLASH_HISTORY) {
          const first = recentFlashNews.values().next().value;
          if (first) recentFlashNews.delete(first);
        }
        sentCount++;
      }

      // Small delay between messages to avoid rate limiting
      if (sentCount < flashItems.length) {
        await new Promise((r) => setTimeout(r, 1500));
      }
    }

    return { sent: sentCount };
  } catch (error) {
    console.error("[telegram-group] Fast news flash failed:", error);
    return { sent: 0 };
  }
}

async function rankNewsForFlash(
  articles: { title: string; body: string; source: string; url: string }[]
): Promise<
  { index: number; headlineKo: string; analysisKo: string; tickers: string[] }[] | null
> {
  try {
    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey) return null;

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const list = articles
      .map((a, i) => `${i}. [${a.source}] ${a.title}\n   ${a.body.slice(0, 150)}`)
      .join("\n");

    const prompt = `You are a crypto news desk editor. Pick the top 3-5 most market-significant articles and rewrite them as SHORT Korean news flashes for a Telegram trading channel.

Articles:
${list}

For EACH selected article, provide:
- index: original article index
- headlineKo: Korean headline (1 sentence, max 80 chars, factual)
- analysisKo: Korean AI analysis (1-2 sentences, max 150 chars, what it means for the market, be specific about impact)
- tickers: array of related ticker symbols (e.g. ["BTC", "ETH"] or ["CNY", "USDCNY"])

Selection criteria:
- Regulatory/policy news (SEC, Fed, rate decisions, trade war)
- Major price moves, whale activity, exchange events
- Macro events affecting crypto (trade data, CPI, employment)
- Skip promotional content, opinion pieces, generic commentary

Respond as a JSON object with a "results" key: {"results": [{"index": 0, "headlineKo": "...", "analysisKo": "...", "tickers": ["BTC"]}]}

Tone: Factual, concise, Korean financial news style. No emojis. Be specific with numbers and data points when available.`;

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json" },
    });

    const raw = result.response.text();
    const parsed = JSON.parse(raw);
    const items = Array.isArray(parsed) ? parsed : parsed?.results;
    return Array.isArray(items) ? items : null;
  } catch (error: any) {
    console.error("[telegram-group] Flash ranking failed:", error?.message || error);
    return null;
  }
}

/* ================================================================== */
/*  5. QUICK SIGNAL DIGEST — condensed signals 3x/day                  */
/* ================================================================== */

/**
 * Send a condensed signal update — top movers with direction,
 * key levels, and a short market read. Much shorter than daily sentiment.
 */
export async function sendQuickSignals(): Promise<boolean> {
  try {
    const signals = await fetchMarketSignals();
    const topCoins = signals.signals.slice(0, 6); // BTC, ETH, SOL, XRP, BNB, DOGE

    const now = new Date().toLocaleString("ko-KR", {
      timeZone: "Asia/Seoul",
      hour: "2-digit",
      minute: "2-digit",
    });

    const session = getSessionLabel();

    let msg = `<b>#시그널 ${session}</b> · ${now} KST\n\n`;

    for (const s of topCoins) {
      const sigKo = SIGNAL_KO[s.signal] || s.signal;
      const emoji = SIGNAL_EMOJI[s.signal] || "";
      const changeStr = `${s.change24h >= 0 ? "+" : ""}${s.change24h.toFixed(2)}%`;
      const priceStr = s.price > 100
        ? `$${s.price.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
        : `$${s.price.toFixed(4)}`;
      const dirKo = s.direction === "LONG" ? "롱" : s.direction === "SHORT" ? "숏" : "관망";

      msg += `${emoji} <b>${s.symbol}</b> ${priceStr} (${changeStr})\n`;
      msg += `   ${sigKo} | ${s.direction} (${dirKo}) | 신뢰도 ${s.confidence.toFixed(0)}%\n\n`;
    }

    // Market summary
    const longCount = signals.signals.filter((s) => s.direction === "LONG").length;
    const shortCount = signals.signals.filter((s) => s.direction === "SHORT").length;

    const fgVal = signals.fearGreed.value;
    const fgKo =
      fgVal <= 25 ? "극도의 공포" :
      fgVal <= 45 ? "공포" :
      fgVal <= 55 ? "중립" :
      fgVal <= 75 ? "탐욕" : "극도의 탐욕";

    msg += `<b>시장 요약</b>\n`;
    msg += `Fear & Greed: ${fgVal}/100 (${fgKo})\n`;
    msg += `롱 ${longCount} / 숏 ${shortCount} / 중립 ${signals.signals.length - longCount - shortCount}\n`;

    const btcKo = signals.btcTrend === "above_sma" ? "BTC 7D SMA 상향 ↑" : "BTC 7D SMA 하향 ↓";
    msg += `${btcKo}\n\n`;

    msg += `<a href="https://futuresai.io/ko/chart-ideas">AI 차트 분석 보기</a> · <a href="https://futuresai.io/ko/home">실시간 시그널</a>\n`;
    msg += `<i>— FuturesAI Signal Desk</i>`;

    return await sendGroupMessage(msg);
  } catch (error) {
    console.error("[telegram-group] Quick signals failed:", error);
    return false;
  }
}

function getSessionLabel(): string {
  const hour = new Date().toLocaleString("en-US", {
    timeZone: "Asia/Seoul",
    hour: "numeric",
    hour12: false,
  });
  const h = parseInt(hour, 10);
  if (h >= 6 && h < 12) return "아시아 세션";
  if (h >= 12 && h < 21) return "유럽/미국 세션";
  return "야간 세션";
}

/* ================================================================== */
/*  POLYMARKET PREDICTION SPOTLIGHT — engaging card with image          */
/* ================================================================== */

export async function sendPolymarketPrediction(): Promise<boolean> {
  try {
    const res = await fetch(
      "https://gamma-api.polymarket.com/events?closed=false&tag=crypto&limit=12&order=volume&ascending=false",
      { signal: AbortSignal.timeout(5000) }
    );
    const events = await res.json();
    if (!Array.isArray(events) || events.length === 0) return false;

    // Pick the most interesting event: highest volume with meaningful odds movement
    let best = events[0];
    let bestScore = 0;
    for (const event of events) {
      if (!event.markets?.[0]) continue;
      const m = event.markets[0];
      const vol = parseFloat(event.volume || m.volume || "0");
      const change = m.oneDayPriceChange ? Math.abs(parseFloat(m.oneDayPriceChange)) : 0;
      const score = vol / 1e6 + change * 100; // weight volume + change
      if (score > bestScore) {
        bestScore = score;
        best = event;
      }
    }

    const market = best.markets?.[0];
    if (!market) return false;

    const outcomes = market.outcomes ? JSON.parse(market.outcomes) : ["Yes", "No"];
    const prices = market.outcomePrices ? JSON.parse(market.outcomePrices) : [];
    const yesOdds = prices[0] ? (parseFloat(prices[0]) * 100).toFixed(0) : "?";
    const noOdds = prices[1] ? (parseFloat(prices[1]) * 100).toFixed(0) : "?";
    const vol = parseFloat(best.volume || market.volume || "0");
    const change = market.oneDayPriceChange ? parseFloat(market.oneDayPriceChange) : null;

    // Visual odds bar
    const yesPct = parseInt(yesOdds) || 50;
    const filled = Math.round(yesPct / 10);
    const bar = "█".repeat(filled) + "░".repeat(10 - filled);

    // AI commentary
    let commentary = "";
    const geminiKey = process.env.GEMINI_API_KEY;
    if (geminiKey) {
      try {
        const genAI = new GoogleGenerativeAI(geminiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        const result = await model.generateContent(`You are a head trader. This Polymarket prediction market is trending:

"${best.title}"
Current odds: ${yesOdds}% YES / ${noOdds}% NO
Volume: $${(vol / 1e6).toFixed(1)}M
${change ? `24h odds change: ${change > 0 ? "+" : ""}${(change * 100).toFixed(1)}%` : ""}

Write 2-3 sentences answering: What does this prediction tell us about where crypto is heading? Should traders position differently because of these odds?

Be specific — name coins, give direction, give timeframe. No vague language.
한국어로 작성하세요. Max 280 characters. No markdown, no emojis, no hashtags.`);
        commentary = result.response.text().trim();
      } catch {}
    }

    // Build caption
    const changeStr = change ? ` | 24h: ${change > 0 ? "+" : ""}${(change * 100).toFixed(1)}%` : "";

    let caption = `<b>🎯 예측 시장 스포트라이트</b>\n\n`;
    caption += `<b>"${best.title}"</b>\n\n`;
    caption += `${outcomes[0] || "YES"}: <b>${yesOdds}%</b> ${bar} ${outcomes[1] || "NO"}: ${noOdds}%\n`;
    caption += `거래량: $${(vol / 1e6).toFixed(1)}M${changeStr}\n`;

    if (commentary) {
      caption += `\n${commentary}\n`;
    }

    caption += `\n<a href="https://polymarket.com/event/${best.slug}">Polymarket에서 보기</a>`;
    caption += ` · <a href="https://futuresai.io/ko/markets">FuturesAI 마켓</a>`;

    // Send as photo if image available, otherwise text
    if (best.image) {
      return await sendGroupPhoto(best.image, caption);
    } else {
      return await sendGroupMessage(caption);
    }
  } catch (error) {
    console.error("[telegram-group] Polymarket prediction failed:", error);
    return false;
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
