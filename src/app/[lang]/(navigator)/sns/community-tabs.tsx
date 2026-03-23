"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import gsap from "gsap";
import Container from "@/components/ui/container";
import type { KoreanFeedItem } from "./page";
import type { XFeedItem } from "@/lib/services/social/x-feed.service";

// ── Tab Skeleton (loading placeholder) ───────────────────────────────

function TabSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-5">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl bg-white/[0.03] border border-white/[0.06] overflow-hidden animate-pulse"
        >
          <div className="h-[180px] bg-white/[0.04]" />
          <div className="p-4 flex flex-col gap-3">
            <div className="h-3 w-20 rounded bg-white/[0.06]" />
            <div className="h-4 w-full rounded bg-white/[0.06]" />
            <div className="h-4 w-3/4 rounded bg-white/[0.06]" />
            <div className="h-3 w-1/2 rounded bg-white/[0.04]" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Lazy-loaded tab components ───────────────────────────────────────

const NewsTab = dynamic(() => import("./tabs/news-tab"), {
  loading: () => <TabSkeleton />,
});

const YouTubeTab = dynamic(() => import("./tabs/youtube-tab"), {
  loading: () => <TabSkeleton />,
});

const KoreanTab = dynamic(() => import("./tabs/korean-tab"), {
  loading: () => <TabSkeleton />,
});

const XFeedTab = dynamic(() => import("./tabs/x-feed-tab"), {
  loading: () => <TabSkeleton />,
});

// ── Serialized Types (dates come as ISO strings from server) ─────────

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

interface SerializedYouTubeItem {
  videoId: string;
  title: string;
  description: string;
  channelName: string;
  channelId: string;
  publishedAt: string;
  thumbnailUrl: string;
  category: string;
}

// ── Props ────────────────────────────────────────────────────────────

interface CommunityTabsProps {
  newsItems: SerializedNewsItem[];
  xFeedItems: XFeedItem[];
  youtubeItems: SerializedYouTubeItem[];
  koreanFeedItems: KoreanFeedItem[];
}

// ── Constants ────────────────────────────────────────────────────────

const TABS = [
  { key: "all", label: "All" },
  { key: "xfeed", label: "X Feed" },
  { key: "news", label: "News" },
  { key: "youtube", label: "YouTube" },
  { key: "korean", label: "Korean" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

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

// ── Unified feed item for "All" tab ─────────────────────────────────

interface UnifiedItem {
  id: string;
  type: "news" | "youtube" | "korean";
  timestamp: number;
  data: SerializedNewsItem | SerializedYouTubeItem | KoreanFeedItem;
}

// ── Component ────────────────────────────────────────────────────────

export function CommunityTabs({
  newsItems,
  xFeedItems,
  youtubeItems,
  koreanFeedItems,
}: CommunityTabsProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("all");
  const tabsRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // ── Unified feed for "All" tab ──────────────────────────────────
  const unifiedFeed = useMemo<UnifiedItem[]>(() => {
    const items: UnifiedItem[] = [];

    newsItems.slice(0, 8).forEach((n) => {
      items.push({
        id: `news-${n.id}`,
        type: "news",
        timestamp: new Date(n.publishedAt).getTime(),
        data: n,
      });
    });

    youtubeItems.slice(0, 6).forEach((y) => {
      items.push({
        id: `yt-${y.videoId}`,
        type: "youtube",
        timestamp: new Date(y.publishedAt).getTime(),
        data: y,
      });
    });

    koreanFeedItems.slice(0, 4).forEach((k) => {
      items.push({
        id: `kr-${k.id}`,
        type: "korean",
        timestamp: new Date(k.publishedAt).getTime(),
        data: k,
      });
    });

    // Interleave by type for visual variety rather than strict chronological
    const byType: Record<string, UnifiedItem[]> = { news: [], youtube: [], korean: [] };
    items.forEach((item) => byType[item.type].push(item));
    const interleaved: UnifiedItem[] = [];
    const maxLen = Math.max(...Object.values(byType).map((a) => a.length));
    for (let i = 0; i < maxLen; i++) {
      if (byType.news[i]) interleaved.push(byType.news[i]);
      if (byType.youtube[i]) interleaved.push(byType.youtube[i]);
      if (byType.korean[i]) interleaved.push(byType.korean[i]);
    }
    return interleaved;
  }, [newsItems, xFeedItems, youtubeItems, koreanFeedItems]);

  // ── GSAP tab indicator ───────────────────────────────────────────
  const moveIndicator = useCallback((tabKey: string) => {
    if (!tabsRef.current || !indicatorRef.current) return;
    const tab = tabsRef.current.querySelector(`[data-tab="${tabKey}"]`) as HTMLElement;
    if (!tab) return;
    gsap.to(indicatorRef.current, {
      x: tab.offsetLeft,
      width: tab.offsetWidth,
      duration: 0.35,
      ease: "power2.out",
    });
  }, []);

  // ── GSAP entrance animation for "All" tab cards ────────────────
  const animateContent = useCallback(() => {
    if (!contentRef.current) return;
    const cards = contentRef.current.querySelectorAll(".community-card");
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

  useEffect(() => {
    moveIndicator(activeTab);
  }, [activeTab, moveIndicator]);

  useEffect(() => {
    const timeout = setTimeout(() => moveIndicator("all"), 100);
    return () => clearTimeout(timeout);
  }, [moveIndicator]);

  useEffect(() => {
    if (activeTab === "all") {
      const timeout = setTimeout(() => animateContent(), 50);
      return () => clearTimeout(timeout);
    }
  }, [activeTab, animateContent]);

  const handleTabChange = (tab: TabKey) => {
    if (tab === activeTab) return;
    setActiveTab(tab);
  };

  return (
    <section className="py-10">
      <Container className="flex flex-col gap-8">
        {/* ── Sticky Tab Bar ──────────────────────────────────────── */}
        <div className="sticky top-[64px] z-30 -mx-6 px-6 py-3 bg-zinc-950/90 backdrop-blur-xl border-b border-white/[0.04]">
          <div className="relative">
            <div
              ref={tabsRef}
              className="flex gap-1 p-1 rounded-2xl bg-white/[0.03] border border-white/[0.06] backdrop-blur-sm overflow-x-auto no-scrollbar"
            >
              <div
                ref={indicatorRef}
                className="absolute top-1 left-0 h-[calc(100%-8px)] rounded-xl bg-blue-600/25 border border-blue-500/35 pointer-events-none"
                style={{ width: 0 }}
              />
              {TABS.map((tab) => (
                <button
                  key={tab.key}
                  data-tab={tab.key}
                  onClick={() => handleTabChange(tab.key)}
                  className={`relative z-10 px-5 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-colors duration-200 ${
                    activeTab === tab.key
                      ? "text-white"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  {tab.key === "korean" ? (
                    <span className="flex items-center gap-1.5">
                      <span role="img" aria-label="Korean flag">&#127472;&#127479;</span>
                      {tab.label}
                    </span>
                  ) : (
                    tab.label
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Tab Content ─────────────────────────────────────────── */}
        <div ref={contentRef}>
          {/* ── ALL TAB (inline for fast initial load) ────────────── */}
          {activeTab === "all" && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-5">
              {unifiedFeed.map((item) => {
                if (item.type === "news") {
                  const news = item.data as SerializedNewsItem;
                  return (
                    <a
                      key={item.id}
                      href={news.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="community-card group relative flex flex-col rounded-xl bg-white/[0.03] border border-white/[0.06] overflow-hidden hover:border-blue-500/25 hover:shadow-[0_0_25px_-5px_rgba(37,99,235,0.12)] transition-all duration-300"
                    >
                      {/* Type indicator */}
                      <div className="absolute top-3 right-3 z-10 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                        News
                      </div>
                      {news.imageUrl && (
                        <div className="relative h-[180px] overflow-hidden">
                          <img
                            src={news.imageUrl}
                            alt={news.title}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-transparent to-transparent" />
                          <div className="absolute bottom-2 left-3">
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-zinc-950/70 backdrop-blur-sm text-[10px] font-mono font-semibold uppercase tracking-wider text-blue-400 border border-white/[0.08]">
                              {news.sourceImg && (
                                <img src={news.sourceImg} alt="" className="w-3.5 h-3.5 rounded-sm" />
                              )}
                              {news.source}
                            </span>
                          </div>
                        </div>
                      )}
                      <div className="flex flex-col gap-2.5 p-4 flex-1">
                        <span className="text-[11px] text-zinc-500 font-mono">
                          {timeAgo(news.publishedAt)}
                        </span>
                        <h3 className="text-sm font-semibold text-zinc-100 leading-snug line-clamp-2">
                          {news.title}
                        </h3>
                        <p className="text-xs text-zinc-500 line-clamp-2 flex-1">{news.body}</p>
                        {news.categories.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {news.categories.slice(0, 3).map((cat) => (
                              <span
                                key={cat}
                                className="px-2 py-0.5 text-[9px] font-mono uppercase tracking-wider rounded-full bg-white/[0.05] text-zinc-500 border border-white/[0.06]"
                              >
                                {cat}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </a>
                  );
                }

                if (item.type === "youtube") {
                  const video = item.data as SerializedYouTubeItem;
                  return (
                    <a
                      key={item.id}
                      href={`https://www.youtube.com/watch?v=${video.videoId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="community-card group relative flex flex-col rounded-xl bg-white/[0.03] border border-white/[0.06] overflow-hidden hover:border-red-500/25 hover:shadow-[0_0_25px_-5px_rgba(239,68,68,0.12)] transition-all duration-300"
                    >
                      {/* Type indicator */}
                      <div className="absolute top-3 right-3 z-10 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-red-500/15 text-red-400 border border-red-500/25">
                        Video
                      </div>
                      <div className="relative aspect-video overflow-hidden">
                        <img
                          src={video.thumbnailUrl}
                          alt={video.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/60 via-transparent to-transparent" />
                        {/* Play button overlay */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <div className="w-14 h-14 rounded-full bg-red-600/90 flex items-center justify-center backdrop-blur-sm">
                            <svg className="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M8 5v14l11-7z" />
                            </svg>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 p-4 flex-1">
                        <h3 className="text-sm font-semibold text-zinc-100 leading-snug line-clamp-2">
                          {video.title}
                        </h3>
                        <div className="flex items-center gap-2 mt-auto">
                          <span className="text-xs text-zinc-500">{video.channelName}</span>
                          <span className="text-zinc-700">-</span>
                          <span className="text-xs text-zinc-600">{timeAgo(video.publishedAt)}</span>
                        </div>
                      </div>
                    </a>
                  );
                }

                if (item.type === "korean") {
                  const kr = item.data as KoreanFeedItem;
                  const typeConfig = KOREAN_TYPE_CONFIG[kr.type] || KOREAN_TYPE_CONFIG.news;
                  const isStroke = kr.type === "news" || kr.type === "short";
                  return (
                    <a
                      key={item.id}
                      href={kr.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="community-card group relative flex flex-col rounded-xl bg-white/[0.03] border border-white/[0.06] overflow-hidden hover:border-cyan-500/25 transition-all duration-300"
                    >
                      {/* Type indicator */}
                      <div className="absolute top-3 right-3 z-10 flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-400 border border-amber-500/25">
                        <span>&#127472;&#127479;</span> KR
                      </div>
                      {kr.thumbnailUrl && (
                        <div className="aspect-video relative overflow-hidden">
                          <img
                            src={kr.thumbnailUrl}
                            alt={kr.titleKo || kr.title}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-transparent to-transparent" />
                        </div>
                      )}
                      <div className="p-4 flex flex-col gap-2.5 flex-1">
                        <div className="flex items-center justify-between">
                          <span className={`inline-flex items-center gap-1.5 text-[9px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-full border ${typeConfig.color}`}>
                            <svg className="w-3 h-3" viewBox="0 0 24 24" fill={isStroke ? "none" : "currentColor"} stroke={isStroke ? "currentColor" : "none"} strokeWidth={isStroke ? "1.5" : "0"}>
                              <path d={typeConfig.icon} strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            {typeConfig.label}
                          </span>
                          <span className="text-[11px] text-zinc-600">{timeAgo(kr.publishedAt)}</span>
                        </div>
                        <h3 className="font-semibold text-zinc-100 text-sm leading-snug line-clamp-2">
                          {kr.titleKo || kr.title}
                        </h3>
                        {(kr.descriptionKo || kr.description) && (
                          <p className="text-zinc-500 text-xs leading-relaxed line-clamp-2 flex-1">
                            {kr.descriptionKo || kr.description}
                          </p>
                        )}
                        <div className="flex items-center gap-2 pt-1 border-t border-white/[0.04]">
                          <span className="text-[11px] text-zinc-600">{kr.sourceName}</span>
                        </div>
                      </div>
                    </a>
                  );
                }

                return null;
              })}
            </div>
          )}

          {/* ── Lazy-loaded tabs ───────────────────────────────────── */}
          {activeTab === "xfeed" && <XFeedTab xFeedItems={xFeedItems} />}
          {activeTab === "news" && <NewsTab newsItems={newsItems} />}
          {activeTab === "youtube" && <YouTubeTab youtubeItems={youtubeItems} />}
          {activeTab === "korean" && <KoreanTab koreanFeedItems={koreanFeedItems} />}
        </div>
      </Container>
    </section>
  );
}
