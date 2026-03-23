import Container from "@/components/ui/container";
import Image from "next/image";
import { Metadata } from "next";
import { fetchCryptoFeed } from "@/lib/services/social/x-feed.service";
import { fetchCryptoNews } from "@/lib/services/news/crypto-news.service";
import { fetchYouTubeFeeds } from "@/lib/services/social/youtube-feed.service";
import { CommunityTabs } from "./community-tabs";

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

// ── Constants ────────────────────────────────────────────────────────

const LIVE_STREAMS = [
  { title: "Bitcoin Live Price & Trading", channelName: "CoinDesk", embedId: "5KaNRCa1YuE" },
  { title: "Crypto Market Live", channelName: "CryptosRUs", embedId: "rSS5_P80GEQ" },
  { title: "Live Bitcoin Trading", channelName: "Ivan on Tech", embedId: "21X5lGlDOfg" },
];

const YOUTUBE_CHANNEL = "Futures AI";

const ALPHAI_SHORTS = [
  "1bZZIc2YglI", "3ilalTx5aPM", "78FoZ2PIzfY", "BGga9-UTW14",
  "BqVLcDRlRB8", "CO5YhZ1VgsQ", "Cy_K5UuMiks", "GySUu12FAq0",
  "HdlwZWeFUPs", "I-cOt7tYGYs", "IpnDPuQlmos", "REdP3WKp4iE",
  "UWnsDSqcAeU", "ViOq5IwWcLQ", "Xor9hKNCPOQ", "YoFxQe0xqsQ",
  "aRkECVfI8AQ", "cdxPv2ciK84", "eZY45Ftjqqs", "fBaRHZgIXbw",
  "kYRUzjKfluc", "kk2lMxmxU5Y", "n0IbKn8AdC8", "nml6QAMlxmU",
  "qWy8EiE0to8", "qoKrYblbP5A", "rrJQWec0xsw", "tJuD3h1SbY4",
  "y-z7mA1CiIk", "yM9cgaUxif4", "ymLoLSnsb5U",
];

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

export default async function SnsPage() {
  const [xFeed, newsItems, youtubeItems, koreanFeed] = await Promise.all([
    fetchCryptoFeed().catch(() => []),
    fetchCryptoNews().catch(() => []),
    fetchYouTubeFeeds().catch(() => []),
    fetchKoreanFeed(),
  ]);

  // Compute last updated time
  const allTimestamps = [
    ...newsItems.map((n) => new Date(n.publishedAt).getTime()),
    ...youtubeItems.map((y) => y.publishedAt.getTime()),
  ].filter(Boolean);
  const lastUpdatedMs = allTimestamps.length > 0 ? Math.max(...allTimestamps) : Date.now();
  const updatedAgo = timeAgo(new Date(lastUpdatedMs).toISOString());

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
    <div className="min-h-screen bg-zinc-950">
      {/* ── Hero Section ─────────────────────────────────────────── */}
      <section className="relative pt-28 pb-16 overflow-hidden">
        {/* Background gradient orbs */}
        <div className="absolute inset-0 bg-gradient-to-b from-blue-950/20 via-zinc-950 to-zinc-950" />
        <div className="absolute top-[-80px] left-1/4 w-[500px] h-[500px] bg-blue-600/[0.07] rounded-full blur-[120px] animate-pulse" />
        <div className="absolute top-[-40px] right-1/4 w-[400px] h-[400px] bg-cyan-600/[0.05] rounded-full blur-[100px] animate-pulse [animation-delay:2s]" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[200px] bg-indigo-600/[0.04] rounded-full blur-[80px]" />

        <Container className="relative z-10 flex flex-col gap-6">
          <p className="text-[11px] font-mono uppercase tracking-[0.3em] text-zinc-500">
            Real-Time Community Intelligence
          </p>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter leading-[0.9]">
            <span className="text-white">Crypto</span>
            <br />
            <span className="bg-gradient-to-r from-white via-blue-400 to-blue-400 bg-clip-text text-transparent">
              Community Hub
            </span>
          </h1>

          <p className="text-base md:text-lg text-zinc-400 max-w-2xl leading-relaxed">
            Real-time news, social feeds, and market intelligence from the
            crypto world. All in one place.
          </p>

          {/* Live Stats Bar */}
          <div className="flex flex-wrap items-center gap-4 sm:gap-6 mt-2">
            {[
              { label: `${xFeed.length} tweets`, color: "bg-blue-500" },
              { label: `${newsItems.length} articles`, color: "bg-emerald-500" },
              { label: `${youtubeItems.length} videos`, color: "bg-red-500" },
              { label: `Updated ${updatedAgo}`, color: "bg-amber-500" },
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
                {i < 3 && (
                  <div className="h-4 w-px bg-zinc-800 ml-2 hidden sm:block" />
                )}
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* ── Breaking News Ticker ────────────────────────────────── */}
      {tickerHeadlines.length > 0 && (
        <div className="relative border-y border-white/[0.06] bg-white/[0.02] backdrop-blur-xl overflow-hidden">
          {/* Fade edges */}
          <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-transparent to-zinc-950 z-10 pointer-events-none" />

          <div className="flex items-center py-3">
            {/* BREAKING pill */}
            <div className="relative z-20 shrink-0 flex items-center gap-2 bg-red-600/90 text-white text-[10px] font-bold uppercase tracking-[0.15em] px-4 py-1.5 mr-4">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white" />
              </span>
              Breaking
            </div>

            {/* Scrolling headlines */}
            <div className="sns-ticker-track flex items-center gap-8 whitespace-nowrap">
              {[...tickerHeadlines, ...tickerHeadlines].map((h, i) => (
                <span
                  key={`ticker-${i}`}
                  className="inline-flex items-center gap-3 text-xs text-zinc-300"
                >
                  <span className="px-2 py-0.5 rounded bg-white/[0.06] text-[10px] font-mono font-semibold uppercase tracking-wider text-zinc-500 border border-white/[0.06]">
                    {h.source}
                  </span>
                  <span className="hover:text-white transition-colors cursor-default">
                    {h.title}
                  </span>
                  <span className="text-zinc-700">|</span>
                </span>
              ))}
            </div>
          </div>

          <style>{`
            @keyframes sns-ticker {
              from { transform: translateX(0); }
              to { transform: translateX(-50%); }
            }
            .sns-ticker-track {
              animation: sns-ticker 60s linear infinite;
            }
            .sns-ticker-track:hover {
              animation-play-state: paused;
            }
          `}</style>
        </div>
      )}

      {/* ── Main Content Tabs ────────────────────────────────────── */}
      <CommunityTabs
        newsItems={serializedNews}
        xFeedItems={xFeed}
        youtubeItems={serializedYoutube}
        koreanFeedItems={koreanFeed}
      />

      {/* ── Divider ──────────────────────────────────────────────── */}
      <div className="w-full h-px bg-gradient-to-r from-transparent via-zinc-800 to-transparent" />

      {/* ── Live Streams Section ─────────────────────────────────── */}
      <section className="py-16">
        <Container className="flex flex-col gap-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
              </span>
              <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                Live Crypto Streams
              </h2>
            </div>
            <p className="text-zinc-500 text-sm">
              Live trading and analysis from top crypto channels
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">
            {LIVE_STREAMS.map((stream) => (
              <div
                key={stream.embedId}
                className="group rounded-xl overflow-hidden bg-white/[0.03] border border-white/[0.06] hover:border-blue-500/25 hover:shadow-[0_0_30px_-5px_rgba(37,99,235,0.12)] transition-all duration-300"
              >
                <div className="aspect-video relative">
                  <iframe
                    width="100%"
                    height="100%"
                    src={`https://www.youtube.com/embed/${stream.embedId}?autoplay=0`}
                    title={stream.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="border-0"
                  />
                  {/* Live badge */}
                  <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-red-600/90 backdrop-blur-sm text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white" />
                    </span>
                    Live
                  </div>
                </div>
                <div className="px-4 py-3.5">
                  <h3 className="font-medium text-zinc-100 text-sm">{stream.title}</h3>
                  <p className="text-zinc-500 text-xs mt-1">{stream.channelName}</p>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* ── Divider ──────────────────────────────────────────────── */}
      <div className="w-full h-px bg-gradient-to-r from-transparent via-zinc-800 to-transparent" />

      {/* ── Futures AI Shorts Section ────────────────────────────── */}
      <section className="py-16 pb-24">
        <Container className="flex flex-col gap-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
                Futures AI Shorts
              </h2>
              <p className="text-zinc-500 text-sm mt-2">
                @{YOUTUBE_CHANNEL} -- Quick trading insights and market analysis
              </p>
            </div>
            <a
              href={`https://www.youtube.com/@${YOUTUBE_CHANNEL}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-zinc-200 text-sm font-medium hover:bg-white/[0.08] hover:border-white/[0.12] transition-all duration-200"
            >
              <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
              </svg>
              Subscribe
            </a>
          </div>

          {/* Horizontal scroll on mobile, grid on larger screens */}
          <div className="relative">
            {/* Mobile: horizontal scroll */}
            <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar sm:hidden">
              {ALPHAI_SHORTS.slice(0, 12).map((id) => (
                <a
                  key={id}
                  href={`https://www.youtube.com/shorts/${id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative rounded-xl overflow-hidden bg-white/[0.03] border border-white/[0.06] hover:border-white/[0.12] transition-all duration-300 shrink-0 w-[140px]"
                >
                  <div className="aspect-[9/16] relative">
                    <Image
                      src={`https://i.ytimg.com/vi/${id}/oar2.jpg`}
                      alt="Futures AI Short"
                      fill
                      sizes="140px"
                      className="object-cover"
                      loading="lazy"
                    />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <svg className="w-10 h-10 text-white drop-shadow-lg" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                  <div className="absolute bottom-2 left-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-full backdrop-blur-sm border border-white/10">
                    Shorts
                  </div>
                </a>
              ))}
            </div>

            {/* Desktop: grid */}
            <div className="hidden sm:grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {ALPHAI_SHORTS.map((id) => (
                <a
                  key={id}
                  href={`https://www.youtube.com/shorts/${id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative rounded-xl overflow-hidden bg-white/[0.03] border border-white/[0.06] hover:border-white/[0.12] transition-all duration-300 hover:scale-[1.03]"
                >
                  <div className="aspect-[9/16] relative">
                    <Image
                      src={`https://i.ytimg.com/vi/${id}/oar2.jpg`}
                      alt="Futures AI Short"
                      fill
                      sizes="(max-width: 768px) 33vw, (max-width: 1024px) 25vw, (max-width: 1280px) 20vw, 16vw"
                      className="object-cover"
                      loading="lazy"
                    />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <svg className="w-10 h-10 text-white drop-shadow-lg" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                  <div className="absolute bottom-2 left-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-full backdrop-blur-sm border border-white/10">
                    Shorts
                  </div>
                </a>
              ))}
            </div>
          </div>

          {/* Mobile subscribe button */}
          <a
            href={`https://www.youtube.com/@${YOUTUBE_CHANNEL}`}
            target="_blank"
            rel="noopener noreferrer"
            className="sm:hidden flex items-center justify-center gap-2 w-full px-5 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-zinc-200 text-sm font-medium hover:bg-white/[0.08] transition-all duration-200"
          >
            <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
            </svg>
            Subscribe to Futures AI
          </a>
        </Container>
      </section>
    </div>
  );
}
