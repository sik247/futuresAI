"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import type { KoreanFeedItem } from "../page";

// ── Constants ────────────────────────────────────────────────────────

const KOREAN_TYPE_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  tweet: {
    label: "Tweet",
    color: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    icon: "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z",
  },
  youtube: {
    label: "YouTube",
    color: "bg-red-500/15 text-red-400 border-red-500/30",
    icon: "M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z",
  },
  news: {
    label: "News",
    color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    icon: "M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z",
  },
  short: {
    label: "Short",
    color: "bg-purple-500/15 text-purple-400 border-purple-500/30",
    icon: "M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z",
  },
};

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

// ── Props ────────────────────────────────────────────────────────────

interface KoreanTabProps {
  koreanFeedItems: KoreanFeedItem[];
}

// ── Component ────────────────────────────────────────────────────────

export default function KoreanTab({ koreanFeedItems }: KoreanTabProps) {
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

  return (
    <div ref={containerRef} className="flex flex-col gap-6">
      {/* Korean header */}
      <div className="flex items-center gap-3">
        <span className="text-2xl" role="img" aria-label="Korean flag">&#127472;&#127479;</span>
        <div>
          <h3 className="text-xl font-bold text-white tracking-tight">
            한국어 크립토 피드
          </h3>
          <p className="text-zinc-500 text-xs mt-0.5">
            Auto-translated and curated content from Korean crypto communities
          </p>
        </div>
      </div>

      {koreanFeedItems.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-5">
          {koreanFeedItems.map((item) => {
            const typeConfig = KOREAN_TYPE_CONFIG[item.type] || KOREAN_TYPE_CONFIG.news;
            const isStroke = item.type === "news" || item.type === "short";
            return (
              <a
                key={item.id}
                href={item.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="community-card group relative rounded-xl border border-white/[0.06] bg-white/[0.03] overflow-hidden hover:border-cyan-500/25 hover:shadow-[0_0_25px_-5px_rgba(6,182,212,0.12)] transition-all duration-300"
              >
                {/* Top-edge glow on hover */}
                <div className="absolute top-0 inset-x-0 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />

                {/* Thumbnail */}
                {item.thumbnailUrl && (
                  <div className="aspect-video relative overflow-hidden">
                    <img
                      src={item.thumbnailUrl}
                      alt={item.titleKo || item.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-transparent to-transparent" />
                  </div>
                )}

                <div className="p-4 flex flex-col gap-3">
                  {/* Type badge and time */}
                  <div className="flex items-center justify-between">
                    <span className={`inline-flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider px-2.5 py-1 rounded-full border ${typeConfig.color}`}>
                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill={isStroke ? "none" : "currentColor"} stroke={isStroke ? "currentColor" : "none"} strokeWidth={isStroke ? "1.5" : "0"}>
                        <path d={typeConfig.icon} strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      {typeConfig.label}
                    </span>
                    <span className="text-[11px] text-zinc-600">{timeAgo(item.publishedAt)}</span>
                  </div>

                  {/* Title */}
                  <h3 className="font-semibold text-zinc-100 text-sm leading-snug line-clamp-2">
                    {item.titleKo || item.title}
                  </h3>

                  {/* Description */}
                  {(item.descriptionKo || item.description) && (
                    <p className="text-zinc-500 text-xs leading-relaxed line-clamp-3">
                      {item.descriptionKo || item.description}
                    </p>
                  )}

                  {/* Source */}
                  <div className="flex items-center gap-2 pt-1 border-t border-white/[0.04]">
                    <span className="text-[11px] text-zinc-600">{item.sourceName}</span>
                  </div>
                </div>
              </a>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-14 h-14 rounded-full bg-white/[0.04] flex items-center justify-center mb-4">
            <span className="text-2xl">&#127472;&#127479;</span>
          </div>
          <p className="text-zinc-400 text-sm">Korean feed content is being prepared.</p>
          <p className="text-zinc-600 text-xs mt-1">
            Check back soon for curated Korean crypto content.
          </p>
        </div>
      )}
    </div>
  );
}
