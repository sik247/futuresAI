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

          {/* Telegram Channel Banner */}
          <a
            href="https://t.me/FuturesAIOfficial"
            target="_blank"
            rel="noopener noreferrer"
            className="group mt-2 flex items-center gap-4 w-fit rounded-2xl border border-[#2AABEE]/20 bg-[#2AABEE]/[0.08] px-6 py-4 transition-all duration-300 hover:bg-[#2AABEE]/[0.15] hover:border-[#2AABEE]/40 hover:shadow-[0_0_30px_rgba(42,171,238,0.15)] hover:-translate-y-0.5"
          >
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[#2AABEE]/20">
              <svg className="w-5 h-5 text-[#2AABEE]" viewBox="0 0 24 24" fill="currentColor">
                <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-white group-hover:text-[#2AABEE] transition-colors">
                Futures AI Official
              </span>
              <span className="text-xs text-zinc-400">
                {lang === "ko" ? "텔레그램 채널에서 실시간 퀀트 알림을 받으세요" : "Join our Telegram for live quant alerts"}
              </span>
            </div>
            <svg className="w-4 h-4 text-zinc-500 group-hover:text-[#2AABEE] group-hover:translate-x-1 transition-all ml-2" fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth="2">
              <path d="M1 8h14M9 2l6 6-6 6" />
            </svg>
          </a>

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
        koreanNewsMap={koreanNewsMap}
        lang={lang}
      />

    </div>
  );
}
