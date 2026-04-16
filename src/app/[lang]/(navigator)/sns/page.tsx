import Container from "@/components/ui/container";
import { Metadata } from "next";
import { fetchCryptoNews } from "@/lib/services/news/crypto-news.service";
import { fetchYouTubeFeeds } from "@/lib/services/social/youtube-feed.service";
import { fetchCryptoFeed } from "@/lib/services/social/x-feed.service";
import { CommunityTabs } from "./community-tabs";
import { getDictionary } from "@/i18n";
import { translateBatch } from "@/lib/services/social/korean-translator.service";

// ── Metadata ─────────────────────────────────────────────────────────

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Crypto Community Hub - Social Feed, News & Live Streams",
  description:
    "Real-time crypto news, X (Twitter) feed from top analysts and whale trackers, YouTube analysis, Korean translated content, live trading streams, and Futures AI shorts.",
  keywords: [
    "crypto twitter feed",
    "crypto social hub",
    "live crypto trading streams",
    "crypto analysts",
    "whale alerts",
    "crypto news aggregator",
    "crypto youtube analysis",
    "bitcoin twitter",
    "crypto community",
    "telegram crypto signals",
  ],
  openGraph: {
    title: "Crypto Community Hub - Social Feed, News & Live Streams | Futures AI",
    description:
      "Real-time crypto news, X feed from top analysts, YouTube analysis, live trading streams, and Futures AI Telegram signals — all in one place.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Crypto Community Hub - Social Feed, News & Live Streams | Futures AI",
    description:
      "Real-time crypto news, X feed from top analysts, YouTube analysis, live trading streams, and Futures AI Telegram signals — all in one place.",
  },
};

// ── Data Fetching ────────────────────────────────────────────────────

function timeAgo(dateInput: string | Date): string {
  const now = Date.now();
  const then = new Date(dateInput).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}d ago`;
}

// ── Page Component ───────────────────────────────────────────────────

export default async function SnsPage({ params: { lang } }: { params: { lang: string } }) {
  const [newsItems, youtubeItems, xFeedData, t] = await Promise.all([
    fetchCryptoNews().catch(() => []),
    fetchYouTubeFeeds().catch(() => []),
    fetchCryptoFeed().catch(() => []),
    getDictionary(lang),
  ]);

  // Compute last updated time
  const allTimestamps = [
    ...newsItems.map((n) => new Date(n.publishedAt).getTime()),
    ...youtubeItems.map((y) => y.publishedAt.getTime()),
  ].filter(Boolean);
  const lastUpdatedMs = allTimestamps.length > 0 ? Math.max(...allTimestamps) : Date.now();
  const updatedAgo = timeAgo(new Date(lastUpdatedMs).toISOString());

  // Translate news into Korean when on Korean route
  const isKo = lang === "ko";
  const TRANSLATE_LIMIT = 20;
  const koreanNewsMap: Record<string, { title: string; body: string }> = {};
  if (isKo && newsItems.length > 0) {
    try {
      const toTranslate = newsItems.slice(0, TRANSLATE_LIMIT);
      const titles = toTranslate.map((n) => n.title);
      const bodies = toTranslate.map((n) => n.body.slice(0, 200));
      const [trTitles, trBodies] = await Promise.all([
        translateBatch(titles, "en", "ko"),
        translateBatch(bodies, "en", "ko"),
      ]);
      toTranslate.forEach((n, i) => {
        koreanNewsMap[n.id] = {
          title: trTitles[i]?.translated || n.title,
          body: trBodies[i]?.translated || n.body,
        };
      });
    } catch {
      // Translation failed — show English fallback
    }
  }

  // Serialize dates for the client component
  const serializedNews = newsItems.map((n) => ({
    ...n,
    publishedAt: new Date(n.publishedAt).toISOString(),
  }));

  const serializedYoutube = youtubeItems.map((y) => ({
    ...y,
    publishedAt: y.publishedAt.toISOString(),
  }));

  // Top 10 headlines for the ticker
  const tickerHeadlines = newsItems.slice(0, 10).map((n) => ({
    title: n.title,
    source: n.source,
    url: n.url,
  }));

  return (
    <div className="min-h-screen bg-zinc-950 pb-16">
      {/* ── Compact Header ─────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-white/[0.06]">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-950/20 via-zinc-950 to-zinc-950" />
        <Container className="relative z-10 py-6 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              {lang === "ko" ? "소셜 & 뉴스" : "Social & News"}
            </h1>
            <p className="text-sm text-zinc-500 mt-1">
              {lang === "ko" ? "실시간 크립토 뉴스, 분석, 유튜브" : "Real-time crypto news, analysis, YouTube"}
            </p>
          </div>
          {/* Telegram link - compact */}
          <a
            href={lang === "ko" ? "https://t.me/FuturesAIOfficial" : "https://t.me/FuturesAI_Global"}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-lg border border-[#2AABEE]/20 bg-[#2AABEE]/[0.08] px-4 py-2 hover:bg-[#2AABEE]/[0.15] transition-all"
          >
            <svg className="w-4 h-4 text-[#2AABEE]" viewBox="0 0 24 24" fill="currentColor">
              <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
            </svg>
            <span className="text-xs font-medium text-[#2AABEE]">Telegram</span>
          </a>
        </Container>
      </section>

      {/* ── Main Content Tabs ────────────────────────────────────── */}
      <CommunityTabs
        newsItems={serializedNews}
        xFeedItems={xFeedData}
        youtubeItems={serializedYoutube}
        koreanNewsMap={koreanNewsMap}
        lang={lang}
      />

    </div>
  );
}
