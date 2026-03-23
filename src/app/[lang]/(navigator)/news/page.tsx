import Container from "@/components/ui/container";
import { getCryptoNews } from "./actions";
import { NewsListSection } from "./news-list-section";
import { getDictionary } from "@/i18n";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Crypto News and Market Updates",
  description:
    "Latest cryptocurrency news, Bitcoin and altcoin market updates, and real-time trading insights aggregated from top sources. Stay informed with Futures AI.",
  keywords: ["crypto news", "bitcoin news", "cryptocurrency updates", "market intelligence", "trading insights"],
};

const TRENDING_TICKERS = [
  "BTC",
  "ETH",
  "SOL",
  "XRP",
  "DOGE",
  "ADA",
  "AVAX",
  "DOT",
  "LINK",
  "MATIC",
];

export default async function NewsList({
  params: { lang },
}: {
  params: { lang: string };
}) {
  const [news, dict] = await Promise.all([
    getCryptoNews(),
    getDictionary(lang),
  ]);

  // Extract trending categories from actual news data
  const categoryCounts = new Map<string, number>();
  news.forEach((item) => {
    item.categories.forEach((cat) => {
      const upper = cat.toUpperCase();
      categoryCounts.set(upper, (categoryCounts.get(upper) || 0) + 1);
    });
  });

  const trendingFromNews = Array.from(categoryCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([cat]) => cat);

  const trending =
    trendingFromNews.length > 0 ? trendingFromNews : TRENDING_TICKERS;

  // Collect unique sources
  const uniqueSources = new Set(news.map((item) => item.source));

  // Last updated timestamp
  const lastUpdated = news.length > 0
    ? new Date(
        Math.max(...news.map((n) => new Date(n.publishedAt).getTime()))
      ).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      })
    : "--:--";

  // Double the tickers for seamless marquee loop
  const marqueeItems = [...trending, ...trending];

  return (
    <div className="pt-20 pb-16 min-h-screen bg-zinc-950">
      {/* Scrolling ticker bar */}
      <div className="relative border-b border-white/[0.06] bg-white/[0.02] backdrop-blur-xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-transparent to-zinc-950 z-10 pointer-events-none" />
        <div className="flex items-center py-2.5">
          <div className="animate-marquee-news flex items-center gap-6 whitespace-nowrap">
            {marqueeItems.map((ticker, i) => (
              <span
                key={`${ticker}-${i}`}
                className="inline-flex items-center gap-2 text-xs font-mono text-zinc-400 tracking-wider"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500/60" />
                {ticker}
              </span>
            ))}
          </div>
        </div>

        <style>{`
          @keyframes marquee-news {
            from { transform: translateX(0); }
            to { transform: translateX(-50%); }
          }
          .animate-marquee-news {
            animation: marquee-news 30s linear infinite;
          }
        `}</style>
      </div>

      {/* Hero section */}
      <Container className="flex flex-col gap-10">
        <section className="pt-10 pb-4 flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <span className="font-mono text-[11px] font-medium uppercase tracking-[0.2em] text-blue-400">
              {dict.news_marketIntelligence}
            </span>
            <h1 className="text-3xl md:text-5xl font-bold text-white tracking-tight">
              {dict.news_title}
            </h1>
          </div>

          {/* Stats bar */}
          <div className="flex items-center gap-6 flex-wrap">
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06]">
              <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">
                {dict.news_articles}
              </span>
              <span className="font-mono text-sm font-semibold text-white">
                {news.length}
              </span>
            </div>
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06]">
              <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">
                {dict.news_sources}
              </span>
              <span className="font-mono text-sm font-semibold text-white">
                {uniqueSources.size}
              </span>
            </div>
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06]">
              <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">
                {dict.news_updated}
              </span>
              <span className="font-mono text-sm font-semibold text-white">
                {lastUpdated}
              </span>
            </div>
          </div>
        </section>

        <NewsListSection news={news} />
      </Container>
    </div>
  );
}
