import { Metadata } from "next";
import HomeDashboard from "./home-dashboard";
import MobileHome from "./mobile-home";
import { fetchCryptoNews } from "@/lib/services/news/crypto-news.service";
import { fetchYouTubeFeeds } from "@/lib/services/social/youtube-feed.service";
import { fetchAllHLWhales } from "@/lib/services/whales/hyperliquid.service";
import { fetchMarketSignals } from "@/lib/services/signals/signals.service";
import { QUANT_BLOG_POSTS } from "@/lib/data/quant-blog-posts";
import { translateBatch } from "@/lib/services/social/korean-translator.service";

export const dynamic = "force-dynamic";
export const revalidate = 60;

export const metadata: Metadata = {
  title: "FuturesAI - Crypto Command Center",
  description:
    "Real-time crypto dashboard: signals, whale tracking, predictions, news, and market research — all at a glance.",
  openGraph: {
    title: "FuturesAI - Crypto Command Center",
    description:
      "Real-time crypto dashboard with whale tracking, live prices, AI trading signals, and market intelligence.",
    type: "website",
  },
};

export default async function HomePage({
  params: { lang },
}: {
  params: { lang: string };
}) {
  const [
    btcR,
    ethR,
    fearGreedR,
    globalR,
    topCoinsR,
    hlWhalesR,
    newsR,
    youtubeR,
    signalsR,
    polymarketR,
  ] = await Promise.allSettled([
    // BTC price from Binance
    fetch("https://api.binance.com/api/v3/ticker/24hr?symbol=BTCUSDT", {
      signal: AbortSignal.timeout(5000),
      next: { revalidate: 60 },
    }).then((r) => r.json()),
    // ETH price from Binance
    fetch("https://api.binance.com/api/v3/ticker/24hr?symbol=ETHUSDT", {
      signal: AbortSignal.timeout(5000),
      next: { revalidate: 60 },
    }).then((r) => r.json()),
    // Fear & Greed
    fetch("https://api.alternative.me/fng/?limit=1", {
      signal: AbortSignal.timeout(5000),
      next: { revalidate: 300 },
    }).then((r) => r.json()),
    // Global market data
    fetch("https://api.coingecko.com/api/v3/global", {
      signal: AbortSignal.timeout(5000),
      next: { revalidate: 120 },
    }).then((r) => r.json()),
    // Top coins
    fetch(
      "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=15&sparkline=false&price_change_percentage=1h,7d",
      {
        signal: AbortSignal.timeout(5000),
        next: { revalidate: 120 },
      }
    ).then((r) => r.json()),
    // HL Whale positions
    fetchAllHLWhales().catch(() => []),
    // Crypto news
    fetchCryptoNews().catch(() => []),
    // YouTube feeds
    fetchYouTubeFeeds().catch(() => []),
    // Quant signals
    fetchMarketSignals().catch(() => ({ signals: [], fearGreed: { value: 50, classification: "Neutral" }, btcTrend: "above_sma", marketSummary: "", updatedAt: new Date().toISOString() })),
    // Polymarket events (crypto + popular)
    Promise.all([
      fetch("https://gamma-api.polymarket.com/events?closed=false&tag_slug=crypto&limit=20&order=volume&ascending=false", { signal: AbortSignal.timeout(5000), next: { revalidate: 120 } }).then(r => r.json()).catch(() => []),
      fetch("https://gamma-api.polymarket.com/events?closed=false&limit=20&order=volume&ascending=false", { signal: AbortSignal.timeout(5000), next: { revalidate: 120 } }).then(r => r.json()).catch(() => []),
    ]).then(([crypto, all]) => {
      // Merge, dedup by id, crypto first
      const seen = new Set<string>();
      const merged: any[] = [];
      for (const e of [...(crypto || []), ...(all || [])]) {
        if (!seen.has(e.id)) { seen.add(e.id); merged.push(e); }
      }
      return merged;
    }),
  ]);

  let btcData = btcR.status === "fulfilled" ? btcR.value : null;
  let ethData = ethR.status === "fulfilled" ? ethR.value : null;

  // Server-side fallback: if Binance failed, try CoinGecko
  if (!btcData?.lastPrice || !ethData?.lastPrice) {
    try {
      const cgR = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd&include_24hr_change=true", {
        signal: AbortSignal.timeout(5000),
        next: { revalidate: 60 },
      }).then((r) => r.json());
      if (!btcData?.lastPrice && cgR?.bitcoin) {
        btcData = { symbol: "BTCUSDT", lastPrice: String(cgR.bitcoin.usd), priceChangePercent: String(cgR.bitcoin.usd_24h_change?.toFixed(2) || "0") };
      }
      if (!ethData?.lastPrice && cgR?.ethereum) {
        ethData = { symbol: "ETHUSDT", lastPrice: String(cgR.ethereum.usd), priceChangePercent: String(cgR.ethereum.usd_24h_change?.toFixed(2) || "0") };
      }
    } catch {}
  }
  const fearGreed = fearGreedR.status === "fulfilled" ? fearGreedR.value : null;
  const globalData = globalR.status === "fulfilled" ? globalR.value : null;
  const topCoins =
    topCoinsR.status === "fulfilled" && Array.isArray(topCoinsR.value)
      ? topCoinsR.value
      : [];
  const hlWhales = hlWhalesR.status === "fulfilled" ? hlWhalesR.value : [];
  const news = newsR.status === "fulfilled" ? newsR.value : [];
  const youtubeItems = youtubeR.status === "fulfilled" ? youtubeR.value : [];
  const signals = signalsR.status === "fulfilled" ? signalsR.value : { signals: [], fearGreed: { value: 50, classification: "Neutral" }, btcTrend: "above_sma", marketSummary: "", updatedAt: new Date().toISOString() };
  const polymarketEvents =
    polymarketR.status === "fulfilled" && Array.isArray(polymarketR.value)
      ? polymarketR.value
      : [];

  // Translate news to Korean if needed
  const isKo = lang === "ko";
  let translatedNews = news.slice(0, 12);
  if (isKo && translatedNews.length > 0) {
    try {
      const titles = translatedNews.map((n: any) => n.title);
      const bodies = translatedNews.map((n: any) => (n.body || "").slice(0, 150));
      const [trTitles, trBodies] = await Promise.all([
        translateBatch(titles, "en", "ko"),
        translateBatch(bodies, "en", "ko"),
      ]);
      translatedNews = translatedNews.map((n: any, i: number) => ({
        ...n,
        title: trTitles[i]?.translated || n.title,
        body: trBodies[i]?.translated || n.body,
      }));
    } catch {
      // Translation failed — show English fallback
    }
  }

  // Translate prediction titles to Korean if needed
  let translatedPoly = Array.isArray(polymarketEvents) ? polymarketEvents : [];
  if (isKo && translatedPoly.length > 0) {
    try {
      const polyTitles = translatedPoly.slice(0, 15).map((e: any) => e.title || "");
      const trPolyTitles = await translateBatch(polyTitles, "en", "ko");
      translatedPoly = translatedPoly.map((e: any, i: number) => ({
        ...e,
        title: i < 15 && trPolyTitles[i]?.translated ? trPolyTitles[i].translated : e.title,
      }));
    } catch {
      // Translation failed — show English fallback
    }
  }

  // Latest 10 blog posts (most recent first)
  const blogPosts = [...QUANT_BLOG_POSTS].reverse().slice(0, 10);

  const serializedNews = JSON.parse(JSON.stringify(translatedNews));
  const serializedSignals = JSON.parse(JSON.stringify(signals));

  return (
    <>
      {/* Mobile: clean dedicated layout */}
      <div className="lg:hidden">
        <MobileHome
          lang={lang}
          btcData={btcData}
          ethData={ethData}
          fearGreed={fearGreed}
          globalData={globalData}
          news={serializedNews}
          signals={serializedSignals}
        />
      </div>
      {/* Desktop: full grid dashboard */}
      <div className="hidden lg:block">
        <HomeDashboard
          lang={lang}
          btcData={btcData}
          ethData={ethData}
          fearGreed={fearGreed}
          globalData={globalData}
          topCoins={JSON.parse(JSON.stringify(topCoins))}
          hlWhales={JSON.parse(JSON.stringify(hlWhales.slice(0, 8)))}
          news={serializedNews}
          youtubeItems={JSON.parse(JSON.stringify(youtubeItems.slice(0, 6).map((y: any) => ({ ...y, publishedAt: y.publishedAt.toISOString() }))))}
          signals={serializedSignals}
          polymarketEvents={JSON.parse(JSON.stringify(translatedPoly))}
          blogPosts={JSON.parse(JSON.stringify(blogPosts))}
        />
      </div>
    </>
  );
}
