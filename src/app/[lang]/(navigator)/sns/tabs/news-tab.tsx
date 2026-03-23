"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

// ── Types ────────────────────────────────────────────────────────────

interface SerializedNewsItem {
  id: string;
  title: string;
  body: string;
  source: string;
  sourceImg: string;
  url: string;
  imageUrl: string;
  publishedAt: string;
  categories: string[];
}

interface NewsTabProps {
  newsItems: SerializedNewsItem[];
}

// ── Helpers ──────────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}d ago`;
}

// ── Component ────────────────────────────────────────────────────────

export default function NewsTab({ newsItems }: NewsTabProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const cards = containerRef.current.querySelectorAll(".community-card");
    if (cards.length === 0) return;
    gsap.set(cards, { opacity: 0, y: 30, scale: 0.97 });
    gsap.to(cards, {
      opacity: 1,
      y: 0,
      scale: 1,
      duration: 0.5,
      stagger: 0.05,
      ease: "power3.out",
      clearProps: "transform",
    });
  }, []);

  const featuredArticle = newsItems[0];
  const remainingNews = newsItems.slice(1);

  return (
    <div ref={containerRef} className="flex flex-col gap-6">
      {/* Featured article */}
      {featuredArticle && (
        <a
          href={featuredArticle.url}
          target="_blank"
          rel="noopener noreferrer"
          className="community-card group grid grid-cols-1 lg:grid-cols-2 gap-0 rounded-xl bg-white/[0.03] backdrop-blur-md border border-white/[0.06] overflow-hidden transition-all duration-300 hover:border-blue-500/30 hover:shadow-[0_0_30px_-5px_rgba(37,99,235,0.15)]"
        >
          {featuredArticle.imageUrl ? (
            <div className="relative w-full h-[240px] lg:h-[380px] bg-zinc-900 overflow-hidden">
              <img
                src={featuredArticle.imageUrl}
                alt={featuredArticle.title}
                className="w-full h-full object-cover transition-transform duration-600 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/60 via-transparent to-transparent" />
            </div>
          ) : (
            <div className="relative w-full h-[240px] lg:h-[380px] bg-gradient-to-br from-blue-950/40 to-zinc-900 flex items-center justify-center">
              <span className="text-5xl font-bold text-white/10">{featuredArticle.source}</span>
            </div>
          )}
          <div className="flex flex-col justify-center gap-5 p-8 lg:p-10">
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-blue-500/15 text-blue-400 font-mono text-[10px] font-semibold uppercase tracking-wider border border-blue-500/20">
                {featuredArticle.sourceImg && (
                  <img src={featuredArticle.sourceImg} alt="" className="w-4 h-4 rounded-sm" />
                )}
                {featuredArticle.source}
              </span>
              <span className="font-mono text-zinc-500">
                {timeAgo(featuredArticle.publishedAt)}
              </span>
            </div>
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white leading-tight tracking-tight">
              {featuredArticle.title}
            </h2>
            <p className="text-sm text-zinc-400 leading-relaxed line-clamp-3">
              {featuredArticle.body}
            </p>
            {featuredArticle.categories.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {featuredArticle.categories.slice(0, 4).map((cat) => (
                  <span
                    key={cat}
                    className="px-2.5 py-0.5 text-[10px] font-mono font-medium uppercase tracking-wider rounded-full bg-white/[0.05] text-zinc-400 border border-white/[0.08]"
                  >
                    {cat}
                  </span>
                ))}
              </div>
            )}
          </div>
        </a>
      )}

      {/* News grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-5">
        {remainingNews.map((news) => (
          <a
            key={news.id}
            href={news.url}
            target="_blank"
            rel="noopener noreferrer"
            className="community-card group flex flex-col rounded-xl bg-white/[0.03] border border-white/[0.06] overflow-hidden transition-all duration-300 hover:border-blue-500/25 hover:shadow-[0_0_25px_-5px_rgba(37,99,235,0.12)] hover:-translate-y-1"
          >
            {news.imageUrl ? (
              <div className="relative w-full h-[200px] bg-zinc-900 overflow-hidden">
                <img
                  src={news.imageUrl}
                  alt={news.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/70 via-zinc-950/20 to-transparent" />
                <div className="absolute bottom-3 left-3">
                  <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-zinc-950/70 backdrop-blur-sm text-[10px] font-mono font-semibold uppercase tracking-wider text-blue-400 border border-white/[0.08]">
                    {news.sourceImg && (
                      <img src={news.sourceImg} alt="" className="w-3.5 h-3.5 rounded-sm" />
                    )}
                    {news.source}
                  </span>
                </div>
              </div>
            ) : (
              <div className="relative w-full h-[200px] bg-gradient-to-br from-blue-950/30 to-zinc-900 flex items-center justify-center">
                <span className="text-3xl font-bold text-white/[0.06]">{news.source}</span>
                <div className="absolute bottom-3 left-3">
                  <span className="px-2 py-0.5 rounded-md bg-zinc-950/70 backdrop-blur-sm text-[10px] font-mono font-semibold uppercase tracking-wider text-blue-400 border border-white/[0.08]">
                    {news.source}
                  </span>
                </div>
              </div>
            )}
            <div className="flex flex-col gap-2.5 p-5 flex-1">
              <span className="font-mono text-[11px] text-zinc-500">
                {timeAgo(news.publishedAt)}
              </span>
              <h3 className="text-base font-semibold text-white leading-snug tracking-tight line-clamp-2">
                {news.title}
              </h3>
              <p className="text-sm text-zinc-500 leading-relaxed line-clamp-2 flex-1">
                {news.body}
              </p>
              {news.categories.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {news.categories.slice(0, 3).map((cat) => (
                    <span
                      key={cat}
                      className="px-2 py-0.5 text-[10px] font-mono font-medium uppercase tracking-wider rounded-full bg-white/[0.05] text-zinc-500 border border-white/[0.06]"
                    >
                      {cat}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
