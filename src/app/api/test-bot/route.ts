import { NextRequest, NextResponse } from "next/server";
import { fetchMarketSignals } from "@/lib/services/signals/signals.service";
import { fetchCryptoNews } from "@/lib/services/news/crypto-news.service";
import { translateBatch } from "@/lib/services/social/korean-translator.service";
import { fetchCryptoFeed } from "@/lib/services/social/x-feed.service";
import { getTweet } from "react-tweet/api";
import {
  getAnalyzedTweets,
  formatTweetAnalysisSection,
} from "@/lib/services/notifications/tweet-analysis.service";
import { sendGroupDigest } from "@/lib/services/notifications/telegram-group.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Test endpoint for Telegram bot functions.
 *
 * Usage:
 *   /api/test-bot?test=all        — run all tests (dry run, no Telegram send)
 *   /api/test-bot?test=signals    — test market signals fetch
 *   /api/test-bot?test=news       — test crypto news fetch + Korean translation
 *   /api/test-bot?test=tweets     — test tweet fetch + analysis
 *   /api/test-bot?test=translate  — test Korean translation
 *   /api/test-bot?test=send       — LIVE: actually send digest to Telegram group
 */
export async function GET(req: NextRequest) {
  const test = req.nextUrl.searchParams.get("test") || "all";
  const results: Record<string, unknown> = { test, timestamp: new Date().toISOString() };

  try {
    // ─── Test 1: Market Signals ───────────────────────────────────
    if (test === "all" || test === "signals") {
      console.log("[test-bot] Testing market signals...");
      const start = Date.now();
      try {
        const signals = await fetchMarketSignals();
        results.signals = {
          status: "OK",
          duration: `${Date.now() - start}ms`,
          data: {
            count: signals.signals.length,
            coins: signals.signals.map((s) => ({
              symbol: s.symbol,
              price: s.price,
              change24h: `${s.change24h.toFixed(2)}%`,
              signal: s.signal,
              confidence: `${s.confidence}%`,
            })),
            fearGreed: signals.fearGreed,
            btcTrend: signals.btcTrend,
            marketSummary: signals.marketSummary,
          },
        };
      } catch (error) {
        results.signals = { status: "FAIL", error: String(error), duration: `${Date.now() - start}ms` };
      }
    }

    // ─── Test 2: Crypto News ──────────────────────────────────────
    if (test === "all" || test === "news") {
      console.log("[test-bot] Testing crypto news...");
      const start = Date.now();
      try {
        const news = await fetchCryptoNews();
        const top3 = news.slice(0, 3);

        // Test Korean translation of headlines
        const titles = top3.map((n) => n.title);
        const translated = await translateBatch(titles);

        results.news = {
          status: "OK",
          duration: `${Date.now() - start}ms`,
          data: {
            totalArticles: news.length,
            top3: top3.map((n, i) => ({
              title: n.title,
              titleKo: translated[i]?.translated || "translation failed",
              source: n.source,
              url: n.url,
            })),
          },
        };
      } catch (error) {
        results.news = { status: "FAIL", error: String(error), duration: `${Date.now() - start}ms` };
      }
    }

    // ─── Test 3: Korean Translation ───────────────────────────────
    if (test === "all" || test === "translate") {
      console.log("[test-bot] Testing Korean translation...");
      const start = Date.now();
      try {
        const testTexts = [
          "Bitcoin surges past $90,000 as institutional demand grows",
          "Whale Alert: 5,000 BTC transferred from Binance to unknown wallet",
          "Federal Reserve signals potential rate cut in upcoming meeting",
        ];
        const translated = await translateBatch(testTexts);

        results.translate = {
          status: "OK",
          duration: `${Date.now() - start}ms`,
          data: testTexts.map((t, i) => ({
            original: t,
            korean: translated[i]?.translated || "FAILED",
          })),
        };
      } catch (error) {
        results.translate = { status: "FAIL", error: String(error), duration: `${Date.now() - start}ms` };
      }
    }

    // ─── Test 4: Tweet Fetch + Analysis ───────────────────────────
    if (test === "all" || test === "tweets") {
      console.log("[test-bot] Testing tweet fetch + analysis...");
      const start = Date.now();
      try {
        // First test: can we fetch the X feed?
        const feed = await fetchCryptoFeed();
        const feedSample = feed.slice(0, 5).map((f) => ({
          username: f.username,
          tweetId: f.tweetId,
          category: f.category,
        }));

        // Second test: can we fetch a tweet's full data?
        let tweetDataTest = null;
        if (feed.length > 0) {
          try {
            const tweet = await getTweet(feed[0].tweetId);
            tweetDataTest = {
              id: feed[0].tweetId,
              hasData: !!tweet,
              textPreview: tweet
                ? ((tweet as any).text || "").slice(0, 100)
                : null,
            };
          } catch {
            tweetDataTest = { id: feed[0].tweetId, hasData: false, error: "fetch failed" };
          }
        }

        // Third test: full tweet analysis pipeline
        const analyzedTweets = await getAnalyzedTweets(2);
        const tweetSection = formatTweetAnalysisSection(analyzedTweets);

        results.tweets = {
          status: "OK",
          duration: `${Date.now() - start}ms`,
          data: {
            feedCount: feed.length,
            feedSample,
            tweetDataTest,
            analyzedCount: analyzedTweets.length,
            analyzed: analyzedTweets.map((t) => ({
              username: t.username,
              originalText: t.originalText.slice(0, 150),
              koreanText: t.koreanText.slice(0, 150),
              marketAnalysis: t.marketAnalysis.slice(0, 200),
              hasMedia: t.hasMedia,
              tweetUrl: t.tweetUrl,
            })),
            formattedSectionLength: tweetSection.length,
          },
        };
      } catch (error) {
        results.tweets = { status: "FAIL", error: String(error), duration: `${Date.now() - start}ms` };
      }
    }

    // ─── Test 5: LIVE SEND to Telegram ────────────────────────────
    if (test === "send") {
      console.log("[test-bot] SENDING LIVE DIGEST TO TELEGRAM GROUP...");
      const start = Date.now();
      try {
        const success = await sendGroupDigest();
        results.send = {
          status: success ? "SENT" : "SEND_FAILED",
          duration: `${Date.now() - start}ms`,
          message: success
            ? "Digest successfully sent to Telegram group!"
            : "sendGroupDigest returned false — check bot token and group chat ID",
        };
      } catch (error) {
        results.send = { status: "FAIL", error: String(error), duration: `${Date.now() - start}ms` };
      }
    }

    // ─── Summary ──────────────────────────────────────────────────
    const statuses = Object.entries(results)
      .filter(([k]) => !["test", "timestamp"].includes(k))
      .map(([k, v]) => `${k}: ${(v as any)?.status || "?"}`);

    results.summary = statuses.join(" | ");

    return NextResponse.json(results, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return NextResponse.json(
      { error: String(error), test },
      { status: 500 }
    );
  }
}
