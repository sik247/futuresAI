import Container from "@/components/ui/container";
import { Metadata } from "next";
import { fetchCryptoNews } from "@/lib/services/news/crypto-news.service";
import { fetchYouTubeFeeds } from "@/lib/services/social/youtube-feed.service";
import { fetchCryptoFeed } from "@/lib/services/social/x-feed.service";
import { CommunityTabs } from "./community-tabs";
import { getDictionary } from "@/i18n";
import { translateBatch } from "@/lib/services/social/korean-translator.service";

// ── Types ────────────────────────────────────────────────────────────

export interface KoreanFeedItem {
  id: string;
  type: "tweet" | "youtube" | "news" | "short";
  title: string;
  titleKo?: string;
  description?: string;
  descriptionKo?: string;
  thumbnailUrl?: string;
  sourceUrl: string;
  sourceName: string;
  publishedAt: string;
}

// ── Metadata ─────────────────────────────────────────────────────────

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Crypto Community Hub - Social Feed & Live Streams",
  description:
    "Real-time crypto news, X feed from top analysts and whale trackers, YouTube analysis, Korean translated content, live trading streams, and Futures AI shorts.",
  keywords: [
    "crypto twitter",
    "crypto social",
    "live trading streams",
    "crypto analysts",
    "whale alerts",
    "crypto news",
    "crypto youtube",
  ],
};

// ── Data Fetching ────────────────────────────────────────────────────

async function fetchKoreanFeed(): Promise<KoreanFeedItem[]> {
  try {
    const baseUrl =
      process.env.NEXTAUTH_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      `http://localhost:${process.env.PORT || 3000}`;
    const res = await fetch(`${baseUrl}/api/content-bot/korean-feed?limit=20`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.feed || [];
  } catch {
    return [];
  }
}

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
  const [newsItems, youtubeItems, koreanFeed, xFeedData, t] = await Promise.all([
    fetchCryptoNews().catch(() => []),
    fetchYouTubeFeeds().catch(() => []),
    fetchKoreanFeed(),
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

  // Translate news for Korean users (limit for speed)
  const TRANSLATE_LIMIT = 20;
  const translatedNewsItems = lang === "ko" && newsItems.length > 0
    ? await (async () => {
        try {
          const toTranslate = newsItems.slice(0, TRANSLATE_LIMIT);
          const rest = newsItems.slice(TRANSLATE_LIMIT);
          const titles = toTranslate.map((n) => n.title);
          const bodies = toTranslate.map((n) => n.body.slice(0, 200));
          const [trTitles, trBodies] = await Promise.all([
            translateBatch(titles, "en", "ko"),
            translateBatch(bodies, "en", "ko"),
          ]);
          const translated = toTranslate.map((n, i) => ({
            ...n,
            title: trTitles[i]?.translated || n.title,
            body: trBodies[i]?.translated || n.body,
          }));
          return [...translated, ...rest];
        } catch {
          return newsItems;
        }
      })()
    : newsItems;

  // Serialize dates for the client component
  const serializedNews = translatedNewsItems.map((n) => ({
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
    <div className="min-h-screen bg-zinc-950 pt-24 sm:pt-28 pb-24 sm:pb-32">
      {/* ── Hero Section ─────────────────────────────────────────── */}
      <section className="relative pt-16 pb-20 overflow-hidden">
        {/* Background gradient orbs */}
        <div className="absolute inset-0 bg-gradient-to-b from-blue-950/20 via-zinc-950 to-zinc-950" />
        <div className="absolute top-[-80px] left-1/4 w-[500px] h-[500px] bg-blue-600/[0.07] rounded-full blur-[120px] animate-pulse" />
        <div className="absolute top-[-40px] right-1/4 w-[400px] h-[400px] bg-cyan-600/[0.05] rounded-full blur-[100px] animate-pulse [animation-delay:2s]" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[200px] bg-indigo-600/[0.04] rounded-full blur-[80px]" />

        <Container className="relative z-10 flex flex-col gap-6">
          <p className="text-[11px] font-mono uppercase tracking-[0.3em] text-zinc-500">
            {t.sns_realtime}
          </p>

          <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-bold tracking-tighter leading-[0.9]">
            <span className="text-white">Crypto</span>
            <br />
            <span className="bg-gradient-to-r from-white via-blue-400 to-blue-400 bg-clip-text text-transparent">
              {t.sns_title}
            </span>
          </h1>

          <p className="text-base md:text-lg text-zinc-400 max-w-2xl leading-relaxed">
            {t.sns_subtitle}
          </p>

          {/* Live Stats Bar */}
          <div className="flex flex-wrap items-center gap-4 sm:gap-6 mt-2">
            {[
              { label: `${newsItems.length} ${t.sns_articles}`, color: "bg-emerald-500" },
              { label: `${youtubeItems.length} ${t.sns_videos}`, color: "bg-red-500" },
              { label: `${t.sns_updated} ${updatedAgo}`, color: "bg-amber-500" },
            ].map((stat, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span
                    className={`animate-ping absolute inline-flex h-full w-full rounded-full ${stat.color} opacity-75`}
                  />
                  <span
                    className={`relative inline-flex rounded-full h-2 w-2 ${stat.color}`}
                  />
                </span>
                <span className="text-xs text-zinc-400 font-mono tracking-wide">
                  {stat.label}
                </span>
                {i < 2 && (
                  <div className="h-4 w-px bg-zinc-800 ml-2 hidden sm:block" />
                )}
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Breaking news ticker removed */}

      {/* ── Main Content Tabs ────────────────────────────────────── */}
      <CommunityTabs
        newsItems={serializedNews}
        xFeedItems={xFeedData}
        youtubeItems={serializedYoutube}
        koreanFeedItems={koreanFeed}
      />

    </div>
  );
}
