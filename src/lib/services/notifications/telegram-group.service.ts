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

    const impactEmoji = picked.impactEmoji || "🚨";

    let msg = `${impactEmoji} <b>#속보 ${koTitle}</b>\n\n`;

    // Analysis with strong opinions
    if (analysis) {
      msg += `${analysis}\n\n`;
    }

    if (picked.reasonKo) {
      msg += `<i>${picked.reasonKo}</i>\n\n`;
    }

    msg += `여러분은 어떻게 보시나요? 💬\n\n`;
    msg += `<a href="https://futuresai.io/ko/news">📊 FuturesAI에서 더 보기</a>\n`;
    msg += `<i>— FuturesAI드림</i>`;

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
): Promise<{ index: number; reasonKo: string; impactEmoji?: string } | null> {
  try {
    // Cache key based on first 3 article titles (changes hourly as news refreshes)
    const cacheKey = `pick-news:${articles.slice(0, 3).map(a => a.title).join("|").slice(0, 100)}`;

    const raw = await cachedAI(cacheKey, async () => {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) return JSON.stringify({ index: 0, reasonKo: "" });

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

      const list = articles.map((a, i) => `${i}. [${a.source}] ${a.title}`).join("\n");

      const prompt = `이 목록에서 가장 시장에 영향을 미치는 기사 1개를 선택하세요.

${list}

기준:
- 가격에 직접 영향 (규제, 대형 파트너십, 해킹, ETF, 금리)
- 주요 코인 관련 (BTC, ETH, SOL 등)
- 매크로 영향 (연준, 인플레이션, 금)
- 마케팅/프로모션 뉴스 제외

JSON으로 응답: {"index": number, "reasonKo": "이 뉴스가 중요한 이유 1문장 한국어", "impactEmoji": "📈 또는 📉 또는 ⚠️ 또는 🔥", "recommendation": "매수 또는 매도 또는 관망"}

전문 퀀트 애널리스트 톤 — 간결, 데이터 기반, 과대광고 금지.`;

      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json" },
      });
      return result.response.text();
    }, 20 * 60 * 1000); // 20 min cache

    if (!raw) return { index: 0, reasonKo: "" };

    const parsed = JSON.parse(raw);
    return {
      index: Math.min(parsed.index ?? 0, articles.length - 1),
      reasonKo: parsed.reasonKo || parsed.reason || "",
      impactEmoji: parsed.impactEmoji || "🚨",
    };
  } catch {
    return { index: 0, reasonKo: "" };
  }
}

async function generateNewsAnalysis(title: string): Promise<string> {
  const cacheKey = `news-analysis-v2:${title.slice(0, 80)}`;
  return cachedAI(cacheKey, async () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return "";

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `크립토 뉴스를 분석하세요.

뉴스: "${title}"

정확히 이 형식으로 작성 (HTML 태그 유지):

<b>💡 시장 영향 분석</b>

3-4문장으로 작성:
- "이 뉴스는 [구체적 영향]을 의미합니다." 형식으로 시작
- 어떤 코인이 영향받는지, 왜 그런지 구체적으로
- 가격 레벨이나 시나리오 언급
- 마지막에 대담한 의견 하나. 예: "ETH가 이번 주 $3,200 지지선을 테스트할 가능성이 높습니다."

🎯 추천: [매수/매도/관망] — [구체적 근거와 가격 레벨]

규칙: 모든 문장은 구체적 주장. 모호한 표현 금지. "이것은 X를 의미합니다" 형식. 이모지는 💡🎯만 사용. 최대 500자.`;

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
      msg += `<b>💡 시장 영향 분석</b>\n${tweet.marketAnalysis}\n\n`;
    }

    if (significant.reasonKo) {
      msg += `<i>${significant.reasonKo}</i>\n\n`;
    }

    msg += `⚠️ 본 분석은 투자 조언이 아닙니다.\n`;
    msg += `<a href="${tweet.tweetUrl}">원문 보기</a> · <a href="https://futuresai.io/ko/news">FuturesAI</a>\n`;
    msg += `<i>— FuturesAI드림</i>`;

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

    let msg = `<b>📊 일일 시장 리포트</b> · ${now}\n\n`;

    // AI briefing
    if (aiBriefing) {
      msg += `<b>💡 AI 시장 분석</b>\n${aiBriefing}\n\n`;
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
      msg += `   ${changeStr} | Vol ${volStr} | Conf ${s.confidence.toFixed(1)}%\n`;
      msg += `   Signal: <b>${sigKo} (${s.signal})</b>\n\n`;
    }

    // Fear & Greed
    const fgLabelKo =
      signals.fearGreed.value <= 25 ? "극도의 공포" :
      signals.fearGreed.value <= 45 ? "공포" :
      signals.fearGreed.value <= 55 ? "중립" :
      signals.fearGreed.value <= 75 ? "탐욕" : "극도의 탐욕";

    msg += `<b>공포탐욕지수:</b> ${signals.fearGreed.value}/100 (${fgLabelKo})\n`;

    const btcTrendKo = signals.btcTrend === "above_sma" ? "7일 이동평균 상향 (강세)" : "7일 이동평균 하향 (약세)";
    msg += `<b>BTC 추세:</b> ${btcTrendKo}\n\n`;

    // Generate conclusive recommendation
    const topSignal = signals.signals[0]; // BTC
    const bullCount = signals.signals.filter(s => s.signal === "Strong Buy" || s.signal === "Buy").length;
    const bearCount = signals.signals.filter(s => s.signal === "Strong Sell" || s.signal === "Sell").length;
    const fgVal = signals.fearGreed.value;

    let verdictKo: string;
    if (bullCount >= 7) {
      verdictKo = "시장 전반 강세 시그널 우세 — 리스크 관리하며 롱 포지션 유지 권장.";
    } else if (bearCount >= 7) {
      verdictKo = "시장 전반 약세 시그널 우세 — 현금 비중 확대 또는 헤지 권장.";
    } else if (fgVal <= 25) {
      verdictKo = "극도의 공포 구간 — 역발상 매수 기회 탐색, 단 분할 진입 필수.";
    } else if (fgVal >= 75) {
      verdictKo = "극도의 탐욕 구간 — 이익 실현 고려, 신규 롱 진입은 자제.";
    } else {
      verdictKo = "혼조 시그널 — 확실한 방향성 나올 때까지 소규모 포지션 유지 권장.";
    }

    msg += `<b>🎯 결론</b>\n`;
    msg += `${verdictKo}\n\n`;

    msg += `⚠️ 본 분석은 투자 조언이 아닙니다.\n`;
    msg += `<a href="https://futuresai.io/ko/chart-ideas">AI 차트 분석 보기</a>\n`;
    msg += `<i>— FuturesAI드림</i>`;

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

    const prompt = `당신은 시니어 크립토 퀀트 애널리스트입니다. 전문 트레이더를 위한 일일 시장 브리핑을 작성하세요.

오늘의 시장 데이터:
${signalSummary}

공포탐욕지수: ${fearGreed.value}/100 (${fearGreed.classification})
BTC 추세: ${btcTrend === "above_sma" ? "7일 이동평균 상향 (강세)" : "7일 이동평균 하향 (약세)"}

오늘의 주요 헤드라인:
${headlines.join("\n")}

한국어로 3-4문장의 종합 시장 분석을 작성하세요:

요구사항:
1. 전체 시장 심리와 방향성 (데이터 근거 포함)
2. 주목할 만한 코인별 관찰 사항
3. 트레이더가 주시해야 할 리스크 요인
4. 포지셔닝에 대한 구체적 조언

톤: 전문 퀀트 데스크 — 정확하고 데이터 기반, 과대광고 없음, 이모지 없음. 골드만삭스 모닝 노트 스타일. 최대 500자.`;

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

      const impactEmoji = item.impactEmoji || "📰";
      const recommendation = item.recommendation || "";

      // Fast, concise format inspired by 특파원 style — speed + AI analysis
      let msg = `${impactEmoji} <b>#속보 ${item.headlineKo}</b>\n`;
      msg += `• ${item.analysisKo}\n`;

      if (recommendation) {
        msg += `🎯 ${recommendation}\n`;
      }

      if (item.tickers && item.tickers.length > 0) {
        msg += `${item.tickers.map((t: string) => `$${t}`).join(" ")}\n`;
      }

      msg += `${now}\n`;
      msg += `<a href="https://futuresai.io/ko/news">📊 FuturesAI</a>`;
      msg += ` · 여러분은 어떻게 보시나요? 💬`;

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
  { index: number; headlineKo: string; analysisKo: string; impactEmoji?: string; recommendation?: string; tickers: string[] }[] | null
> {
  try {
    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey) return null;

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const list = articles
      .map((a, i) => `${i}. [${a.source}] ${a.title}\n   ${a.body.slice(0, 150)}`)
      .join("\n");

    const prompt = `크립토 뉴스 데스크 편집장으로서 가장 시장 영향이 큰 기사 3-5개를 선택하고 텔레그램 트레이딩 채널용 한국어 뉴스 플래시로 작성하세요.

기사:
${list}

각 선택된 기사에 대해 제공:
- index: 원본 기사 인덱스
- headlineKo: 한국어 헤드라인 (1문장, 최대 80자, 사실 기반)
- analysisKo: 한국어 AI 분석 (1-2문장, 최대 150자, 시장에 미치는 영향을 구체적으로)
- impactEmoji: 시장 영향 이모지 (📈 상승영향 / 📉 하락영향 / ⚠️ 주의 / 🔥 긴급)
- recommendation: 추천 (매수 / 매도 / 관망 + 간단한 근거)
- tickers: 관련 티커 심볼 배열 (예: ["BTC", "ETH"])

선택 기준:
- 규제/정책 뉴스 (SEC, 연준, 금리, 무역전쟁)
- 대형 가격 변동, 고래 활동, 거래소 이벤트
- 크립토에 영향을 미치는 매크로 이벤트 (무역 데이터, CPI, 고용)
- 마케팅/프로모션, 의견 기사, 일반 논평 제외

JSON으로 응답: {"results": [{"index": 0, "headlineKo": "...", "analysisKo": "...", "impactEmoji": "📈", "recommendation": "매수 — BTC $80K 이하 분할 매수", "tickers": ["BTC"]}]}

톤: 사실 기반, 간결한 한국어 금융 뉴스 스타일. 숫자와 데이터 포인트 포함.`;

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
    // Only BTC, ETH, SOL — skip altcoin noise
    const topCoins = signals.signals.filter((s) => ["BTC", "ETH", "SOL"].includes(s.symbol));

    const now = new Date().toLocaleString("ko-KR", {
      timeZone: "Asia/Seoul",
      hour: "2-digit",
      minute: "2-digit",
    });

    const session = getSessionLabel();

    const fgVal = signals.fearGreed.value;
    const fgKo =
      fgVal <= 25 ? "극도의 공포" :
      fgVal <= 45 ? "공포" :
      fgVal <= 55 ? "중립" :
      fgVal <= 75 ? "탐욕" : "극도의 탐욕";

    // Generate AI trade setups per coin with entry/SL/TP
    let tradeSetups = "";
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (apiKey) {
        const { GoogleGenerativeAI: GenAI } = await import("@google/generative-ai");
        const genAI = new GenAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const coinData = topCoins
          .map((s) => `${s.symbol}: 현재가 $${s.price.toLocaleString()}, 24시간 변동 ${s.change24h >= 0 ? "+" : ""}${s.change24h.toFixed(2)}%, RSI 기반 시그널: ${s.signal}, 방향: ${s.direction}, 신뢰도: ${s.confidence.toFixed(0)}%`)
          .join("\n");

        const result = await model.generateContent(`당신은 수석 크립토 파생상품 트레이더입니다. 텔레그램 트레이딩 채널에 보낼 4시간 시그널 리포트를 작성하세요.

현재 시장 데이터:
${coinData}
공포탐욕지수: ${fgVal}/100 (${fgKo})
BTC 추세: ${signals.btcTrend === "above_sma" ? "7일 이동평균 상향 (강세)" : "7일 이동평균 하향 (약세)"}

각 코인(BTC, ETH, SOL)에 대해 정확히 이 형식으로 작성 (HTML 태그 유지):

<b>[이모지] [코인] — [롱/숏/관망]</b>
현재가: $XX,XXX (±X.X%)
진입가: $XX,XXX
손절가: $XX,XXX (−X.X%)
목표가 1: $XX,XXX (+X.X%)
목표가 2: $XX,XXX (+X.X%)
R:R 비율: X:X
💡 근거: [1-2문장 — 왜 이 방향인지, 어떤 기술적/구조적 근거가 있는지]

이모지 규칙: 📈 롱, 📉 숏, ⏸ 관망

그 다음 시장 요약 작성:

<b>📋 시장 요약</b>
[2-3문장: 전체 시장 분위기, 핵심 이벤트, 주의할 점]

규칙:
- 진입가는 현재가에서 ±1-3% 범위의 현실적 레벨
- 손절가는 진입가에서 2-5% 이내
- 목표가는 R:R 최소 1.5:1 이상
- 관망이면 진입/손절/목표가 대신 "관망 조건: [어떤 조건이 충족되면 진입 고려]" 작성
- 모호한 표현 금지. 구체적 가격 레벨만 제시
- 마크다운 금지 (**, ##, --- 금지). HTML <b> 태그만 사용`);

        tradeSetups = result.response.text().trim()
          // Strip unsupported HTML tags — Telegram only allows <b>, <i>, <a>, <code>, <pre>
          .replace(/<br\s*\/?>/gi, "\n")
          .replace(/<\/?(p|div|span|h[1-6]|ul|ol|li|strong|em|hr)[^>]*>/gi, "")
          .replace(/\*\*/g, "")
          .replace(/^#{1,6}\s/gm, "")
          .replace(/^---+$/gm, "");
      }
    } catch (err) {
      console.warn("[telegram-group] AI trade setup generation failed:", err);
    }

    let msg = `📊 <b>시그널 리포트</b> · ${session} · ${now} KST\n\n`;

    if (tradeSetups && tradeSetups.length > 50) {
      msg += `${tradeSetups}\n\n`;
    } else {
      // Fallback: basic signal display if AI fails
      for (const s of topCoins) {
        const sigKo = SIGNAL_KO[s.signal] || s.signal;
        const emoji = SIGNAL_EMOJI[s.signal] || "";
        const changeStr = `${s.change24h >= 0 ? "+" : ""}${s.change24h.toFixed(2)}%`;
        const priceStr = s.price > 100
          ? `$${s.price.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
          : `$${s.price.toFixed(4)}`;
        const dirKo = s.direction === "LONG" ? "롱" : s.direction === "SHORT" ? "숏" : "관망";

        msg += `${emoji} <b>${s.symbol}</b> ${priceStr} (${changeStr})\n`;
        msg += `   ${sigKo} | ${dirKo} | 신뢰도 ${s.confidence.toFixed(0)}%\n\n`;
      }

      msg += `공포탐욕지수: ${fgVal}/100 (${fgKo})\n`;
      msg += `BTC ${signals.btcTrend === "above_sma" ? "7일 이동평균 상향 ↑" : "7일 이동평균 하향 ↓"}\n\n`;
    }

    msg += `여러분은 어떤 포지션을 잡고 계신가요? 💬\n\n`;
    msg += `⚠️ 본 분석은 투자 조언이 아닙니다.\n`;
    msg += `<a href="https://futuresai.io/ko/home">실시간 시그널 보기</a>\n`;
    msg += `<i>— FuturesAI드림</i>`;

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

    // Filter out irrelevant political markets that don't affect crypto
    const SKIP_KEYWORDS = [
      "presidential nominee", "presidential election", "democratic", "republican",
      "governor", "senator", "congress", "mayor", "party leader", "primary",
      "nomination", "vice president", "cabinet", "impeach",
    ];
    const relevantEvents = events.filter((e: any) => {
      const title = (e.title || "").toLowerCase();
      return !SKIP_KEYWORDS.some(kw => title.includes(kw));
    });

    if (relevantEvents.length === 0) return false;

    // Pick the most interesting event: highest volume with meaningful odds movement
    let best = relevantEvents[0];
    let bestScore = 0;
    for (const event of relevantEvents) {
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

    // Polymarket returns these as JSON strings OR pre-parsed arrays depending on version.
    const parseMaybeArray = (v: any, fallback: any[]) => {
      if (!v) return fallback;
      if (Array.isArray(v)) return v;
      if (typeof v === "string") {
        try { return JSON.parse(v); } catch { return fallback; }
      }
      return fallback;
    };
    const outcomes = parseMaybeArray(market.outcomes, ["Yes", "No"]);
    const prices = parseMaybeArray(market.outcomePrices, []);
    const yesOdds = prices[0] ? (parseFloat(prices[0]) * 100).toFixed(0) : "?";
    const noOdds = prices[1] ? (parseFloat(prices[1]) * 100).toFixed(0) : "?";
    const vol = parseFloat(best.volume || market.volume || "0");
    const change = market.oneDayPriceChange ? parseFloat(market.oneDayPriceChange) : null;

    // Visual odds bar
    const yesPct = parseInt(yesOdds) || 50;
    const filled = Math.round(yesPct / 10);
    const bar = "█".repeat(filled) + "░".repeat(10 - filled);

    // AI verdict — structured JSON, skip send if weak
    const geminiKey = process.env.GEMINI_API_KEY;
    if (!geminiKey) {
      console.warn("[telegram-group] Polymarket skipped: no GEMINI_API_KEY");
      return false;
    }

    type Verdict = {
      verdict: string;
      rationale: string;
      action: string;
      timeframe: string;
      confidence: "high" | "medium" | "low";
    };

    let verdict: Verdict | null = null;
    try {
      const genAI = new GoogleGenerativeAI(geminiKey);
      const model = genAI.getGenerativeModel({
        model: "gemini-2.0-flash",
        generationConfig: { responseMimeType: "application/json" },
      });
      const prompt = `당신은 수석 크립토 트레이더입니다. 이 Polymarket 예측 시장을 분석해 트레이더가 당장 행동할 수 있는 한 줄 판단(verdict)을 내리세요.

예측 시장:
"${best.title}"
현재 확률: ${yesOdds}% YES / ${noOdds}% NO
거래량: $${(vol / 1e6).toFixed(1)}M
${change ? `24시간 확률 변동: ${change > 0 ? "+" : ""}${(change * 100).toFixed(1)}%` : ""}

아래 JSON 스키마로만 답하세요. 모호하거나 양다리 전망이면 confidence를 "low"로 자진 표시하세요.

{
  "verdict": "한 문장 판단 — 반드시 방향(bullish/bearish/neutral) + 대상 자산(BTC/ETH/SOL 등) 명시. 예: '시장은 BTC $100K 돌파를 68% 확률로 베팅 중 — 단기 매수 편향'",
  "rationale": "한 문장 이유 — 오즈 변동을 움직인 구체적 촉매(ETF 유입, Fed 코멘트, 규제 이슈 등)",
  "action": "한 문장 실행안 — 구체적 가격/범위/조건. 예: 'BTC $95K 이하 분할 매수, $102K 돌파 시 추격'",
  "timeframe": "이번 주 | 이번 달 | 이번 분기 중 하나",
  "confidence": "high | medium | low"
}

규칙:
- 모든 필드 한국어로.
- verdict에 '불확실', '관망', '혼조', '반반', '양방향' 같은 표현 금지.
- action에 '상황 주시', '지켜본다' 같은 비행동 표현 금지. 구체적 가격 레벨 필수.
- 이모지, 마크다운, 해시태그 금지. 순수 JSON만.`;
      const result = await model.generateContent(prompt);
      const raw = result.response.text();
      // Strip fences, then pull the first balanced {...} block — Gemini sometimes prefixes
      // explanations or emits multiple objects. This survives most drift.
      const stripped = raw.replace(/```json?\n?/g, "").replace(/```\n?/g, "").trim();
      const jsonStr = stripped.match(/\{[\s\S]*\}/)?.[0] ?? stripped;
      verdict = JSON.parse(jsonStr) as Verdict;
    } catch (err) {
      console.error("[telegram-group] Polymarket Gemini verdict failed:", err);
      return false;
    }

    // Skip if verdict is weak / generic
    if (!verdict || verdict.confidence === "low") {
      console.log("[telegram-group] Polymarket skipped: low-confidence verdict");
      return false;
    }
    const weakPhrases = ["불확실", "관망", "혼조", "반반", "양방향", "알 수 없", "예측 불가"];
    if (weakPhrases.some((p) => verdict!.verdict.includes(p) || verdict!.action.includes(p))) {
      console.log("[telegram-group] Polymarket skipped: weak-phrase verdict");
      return false;
    }

    // Build verdict-led caption
    const changeStr = change ? ` · 24h ${change > 0 ? "+" : ""}${(change * 100).toFixed(1)}%` : "";

    let caption = `<b>🎯 오늘의 예측 시장 베팅</b>\n\n`;
    caption += `<b>${verdict.verdict}</b>\n\n`;
    caption += `<b>근거</b>\n`;
    caption += `• <i>"${best.title}"</i>\n`;
    caption += `• ${verdict.rationale}\n`;
    caption += `• ${verdict.action}\n\n`;
    caption += `<b>시간대</b>: ${verdict.timeframe}\n\n`;
    caption += `┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n`;
    caption += `📊 ${outcomes[0] || "YES"} ${yesOdds}% ${bar} ${noOdds}% ${outcomes[1] || "NO"}\n`;
    caption += `거래량 $${(vol / 1e6).toFixed(1)}M${changeStr}\n\n`;
    caption += `⚠️ 투자 조언이 아닙니다.\n`;
    caption += `<a href="https://futuresai.io/ko/markets">FuturesAI 예측 시장</a>\n`;
    caption += `<i>— FuturesAI드림</i>`;

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
