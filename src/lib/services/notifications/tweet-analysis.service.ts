import { getTweet } from "react-tweet/api";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { translateBatch } from "@/lib/services/social/korean-translator.service";
import { fetchCryptoFeed, type XFeedItem } from "@/lib/services/social/x-feed.service";

// High-impact accounts to prioritize for market analysis
const HIGH_IMPACT_ACCOUNTS = [
  "WatcherGuru",
  "DeItaone",
  "whale_alert",
  "CryptoQuant_com",
  "lookonchain",
  "Cointelegraph",
  "CoinDesk",
  "TheBlock__",
  "binance",
  "Bitcoin",
];

export type TweetAnalysis = {
  tweetId: string;
  username: string;
  displayName: string;
  originalText: string;
  koreanText: string;
  marketAnalysis: string;
  tweetUrl: string;
  hasMedia: boolean;
  mediaUrl?: string;
};

/**
 * Fetch the most impactful recent tweets, translate to Korean,
 * and generate market influence analysis via Gemini AI.
 */
export async function getAnalyzedTweets(
  count: number = 3
): Promise<TweetAnalysis[]> {
  try {
    // Fetch recent tweet IDs from high-impact accounts
    const feed = await fetchCryptoFeed();
    const highImpact = feed.filter((item) =>
      HIGH_IMPACT_ACCOUNTS.some(
        (acc) => acc.toLowerCase() === item.username.toLowerCase()
      )
    );

    // Take the most recent ones (they come sorted by recency)
    const candidates = highImpact.slice(0, count * 2);
    if (candidates.length === 0) return [];

    // Fetch full tweet data for each
    const tweetResults = await Promise.allSettled(
      candidates.map((item) => fetchTweetData(item))
    );

    const validTweets = tweetResults
      .filter(
        (r): r is PromiseFulfilledResult<TweetAnalysis | null> =>
          r.status === "fulfilled" && r.value !== null
      )
      .map((r) => r.value!)
      .slice(0, count);

    if (validTweets.length === 0) return [];

    // Batch translate tweet texts to Korean
    const originals = validTweets.map((t) => t.originalText);
    const translated = await translateBatch(originals);

    // Generate market influence analysis for each
    const analyzed = await Promise.allSettled(
      validTweets.map(async (tweet, i) => {
        const koreanText =
          translated[i]?.translated || tweet.originalText;
        const marketAnalysis = await analyzeMarketInfluence(
          tweet.originalText,
          tweet.username,
          tweet.displayName
        );
        return {
          ...tweet,
          koreanText,
          marketAnalysis,
        };
      })
    );

    return analyzed
      .filter(
        (r): r is PromiseFulfilledResult<TweetAnalysis> =>
          r.status === "fulfilled"
      )
      .map((r) => r.value);
  } catch (error) {
    console.error("[tweet-analysis] Failed:", error);
    return [];
  }
}

async function fetchTweetData(
  item: XFeedItem
): Promise<TweetAnalysis | null> {
  try {
    const tweet = await getTweet(item.tweetId);
    if (!tweet) return null;

    // Extract text — handle both tweet formats
    const text =
      (tweet as any).text ||
      (tweet as any).full_text ||
      "";

    if (!text || text.length < 10) return null;

    // Check for media
    const photos = (tweet as any).photos || (tweet as any).mediaDetails || [];
    const hasMedia = photos.length > 0;
    const mediaUrl = hasMedia
      ? photos[0]?.media_url_https || photos[0]?.url || undefined
      : undefined;

    return {
      tweetId: item.tweetId,
      username: item.username,
      displayName: item.displayName,
      originalText: text.slice(0, 500),
      koreanText: "", // filled later
      marketAnalysis: "", // filled later
      tweetUrl: `https://x.com/${item.username}/status/${item.tweetId}`,
      hasMedia,
      mediaUrl,
    };
  } catch {
    return null;
  }
}

async function analyzeMarketInfluence(
  tweetText: string,
  username: string,
  displayName: string
): Promise<string> {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return "";

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `You are a senior quant strategist. Analyze what this tweet means for the market — not just sentiment, but the transmission mechanism.

Author: ${displayName} (@${username})
Content: "${tweetText}"

Write bilingual commentary:

[Korean: 2-3 sentences. What does this mean for market structure? Which assets see direct flow impact? What's the positioning read — are longs/shorts exposed? Give a specific scenario or level to watch.]

---

[English: 2-3 sentences. Same depth — explain the second-order effects. "This suggests..." not "This is bullish." Which pairs, what timeframe, what confirms or invalidates.]

No emojis. Quant desk note style — precise, causal, actionable.`;

    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  } catch {
    return "";
  }
}

/**
 * Format analyzed tweets into a Korean Telegram message section.
 */
export function formatTweetAnalysisSection(
  tweets: TweetAnalysis[]
): string {
  if (tweets.length === 0) return "";

  let msg = "<b>Key Tweet Analysis | 주요 트윗 분석</b>\n\n";

  for (const t of tweets) {
    msg += `<b>${t.displayName}</b> (@${t.username})\n`;
    msg += `"${t.koreanText.slice(0, 200)}${t.koreanText.length > 200 ? "..." : ""}"\n`;

    if (t.marketAnalysis) {
      msg += `<i>${t.marketAnalysis}</i>\n`;
    }

    msg += `<a href="${t.tweetUrl}">View Original</a>\n\n`;
  }

  return msg;
}
