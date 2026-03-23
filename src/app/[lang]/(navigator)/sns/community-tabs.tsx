"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Tweet } from "react-tweet";
import gsap from "gsap";
import Container from "@/components/ui/container";
import type { XFeedItem } from "@/lib/services/social/x-feed.service";
import type { KoreanFeedItem } from "./page";

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
  { key: "news", label: "News" },
  { key: "xfeed", label: "X Feed" },
  { key: "youtube", label: "YouTube" },
  { key: "korean", label: "Korean" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

const X_CATEGORY_LABELS: Record<string, string> = {
  all: "All",
  news: "News",
  analyst: "Analysts",
  onchain: "On-Chain",
  analytics: "Analytics",
  exchange: "Exchanges",
  whales: "Whales",
};

const X_CATEGORY_COLORS: Record<string, string> = {
  news: "bg-rose-500/20 text-rose-400 border-rose-500/30",
  analyst: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  onchain: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  analytics: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  exchange: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  whales: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
};

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
  type: "news" | "tweet" | "youtube" | "korean";
  timestamp: number;
  data: SerializedNewsItem | XFeedItem | SerializedYouTubeItem | KoreanFeedItem;
}

// ── Component ────────────────────────────────────────────────────────

export function CommunityTabs({
  newsItems,
  xFeedItems,
  youtubeItems,
  koreanFeedItems,
}: CommunityTabsProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("all");
  const [xCategory, setXCategory] = useState("all");
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

    xFeedItems.slice(0, 6).forEach((x) => {
      items.push({
        id: `tweet-${x.tweetId}`,
        type: "tweet",
        timestamp: parseInt(x.tweetId) / 1000000, // approximate from snowflake
        data: x,
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
    const byType: Record<string, UnifiedItem[]> = { news: [], tweet: [], youtube: [], korean: [] };
    items.forEach((item) => byType[item.type].push(item));
    const interleaved: UnifiedItem[] = [];
    const maxLen = Math.max(...Object.values(byType).map((a) => a.length));
    for (let i = 0; i < maxLen; i++) {
      if (byType.news[i]) interleaved.push(byType.news[i]);
      if (byType.tweet[i]) interleaved.push(byType.tweet[i]);
      if (byType.youtube[i]) interleaved.push(byType.youtube[i]);
      if (byType.korean[i]) interleaved.push(byType.korean[i]);
    }
    return interleaved;
  }, [newsItems, xFeedItems, youtubeItems, koreanFeedItems]);

  // ── Filtered X feed ──────────────────────────────────────────────
  const filteredXFeed = useMemo(() => {
    if (xCategory === "all") return xFeedItems;
    return xFeedItems.filter((item) => item.category === xCategory);
  }, [xFeedItems, xCategory]);

  const xCategories = useMemo(
    () => ["all", ...Array.from(new Set(xFeedItems.map((item) => item.category)))],
    [xFeedItems]
  );

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

  // ── GSAP entrance animation ──────────────────────────────────────
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
    const timeout = setTimeout(() => animateContent(), 50);
    return () => clearTimeout(timeout);
  }, [activeTab, xCategory, animateContent]);

  const handleTabChange = (tab: TabKey) => {
    if (tab === activeTab) return;
    setActiveTab(tab);
  };

  // ── Featured news article (for news tab) ─────────────────────────
  const featuredArticle = newsItems[0];
  const remainingNews = newsItems.slice(1);

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
          {/* ── ALL TAB ──────────────────────────────────────────── */}
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

                if (item.type === "tweet") {
                  const tweet = item.data as XFeedItem;
                  return (
                    <div
                      key={item.id}
                      className="community-card group relative rounded-xl bg-white/[0.03] border border-white/[0.06] overflow-hidden hover:border-blue-500/25 transition-all duration-300"
                    >
                      {/* Type indicator */}
                      <div className="absolute top-3 right-3 z-10 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-blue-500/15 text-blue-400 border border-blue-500/25">
                        Tweet
                      </div>
                      <div className="px-4 pt-4 pb-2 flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-white/[0.06] flex items-center justify-center text-xs font-bold text-blue-400">
                          {tweet.username.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <span className="text-sm font-semibold text-zinc-200">
                            @{tweet.username}
                          </span>
                          <span
                            className={`ml-2 text-[9px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                              X_CATEGORY_COLORS[tweet.category] ?? "bg-zinc-800/50 text-zinc-400 border-zinc-700/50"
                            }`}
                          >
                            {X_CATEGORY_LABELS[tweet.category] ?? tweet.category}
                          </span>
                        </div>
                      </div>
                      <div className="px-2 pb-3 min-w-0 overflow-hidden [&>div]:!my-0 [&_article]:!border-0 [&_article]:!bg-transparent">
                        <Tweet id={tweet.tweetId} />
                      </div>
                    </div>
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

          {/* ── NEWS TAB ─────────────────────────────────────────── */}
          {activeTab === "news" && (
            <div className="flex flex-col gap-6">
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
          )}

          {/* ── X FEED TAB ───────────────────────────────────────── */}
          {activeTab === "xfeed" && (
            <div className="flex flex-col gap-6">
              {/* Category filter pills */}
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                {xCategories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setXCategory(cat)}
                    className={`shrink-0 px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-200 border ${
                      xCategory === cat
                        ? "bg-blue-600/25 text-blue-300 border-blue-500/40"
                        : "bg-white/[0.03] text-zinc-400 border-white/[0.06] hover:bg-white/[0.06] hover:text-zinc-200"
                    }`}
                  >
                    {X_CATEGORY_LABELS[cat] ?? cat}
                    {xCategory === cat && (
                      <span className="ml-1.5 text-zinc-500">{filteredXFeed.length}</span>
                    )}
                  </button>
                ))}
              </div>

              {/* Tweet grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-5">
                {filteredXFeed.map((item) => (
                  <div
                    key={`${item.tweetId}-${item.username}`}
                    className="community-card group relative rounded-xl border border-white/[0.06] bg-white/[0.03] overflow-hidden hover:border-blue-500/25 transition-all duration-300"
                  >
                    {/* Top glow on hover */}
                    <div className="absolute top-0 inset-x-0 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />

                    {/* Header */}
                    <div className="flex items-center justify-between px-4 pt-4 pb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-white/[0.06] flex items-center justify-center text-xs font-bold text-blue-400">
                          {item.username.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm font-semibold text-zinc-200">
                          @{item.username}
                        </span>
                      </div>
                      <span
                        className={`text-[10px] font-medium uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                          X_CATEGORY_COLORS[item.category] ?? "bg-zinc-800/50 text-zinc-400 border-zinc-700/50"
                        }`}
                      >
                        {X_CATEGORY_LABELS[item.category] ?? item.category}
                      </span>
                    </div>

                    {/* Tweet embed */}
                    <div className="px-2 pb-3 min-w-0 overflow-hidden [&>div]:!my-0 [&_article]:!border-0 [&_article]:!bg-transparent">
                      <Tweet id={item.tweetId} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Empty state */}
              {filteredXFeed.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="w-16 h-16 rounded-full bg-white/[0.04] flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                    </svg>
                  </div>
                  <p className="text-zinc-400 text-sm">No tweets in this category right now.</p>
                  <button
                    onClick={() => setXCategory("all")}
                    className="mt-3 text-blue-400 text-sm hover:text-blue-300 transition-colors"
                  >
                    View all tweets
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── YOUTUBE TAB ──────────────────────────────────────── */}
          {activeTab === "youtube" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-5">
              {youtubeItems.map((video) => (
                <a
                  key={video.videoId}
                  href={`https://www.youtube.com/watch?v=${video.videoId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="community-card group flex flex-col rounded-xl bg-white/[0.03] border border-white/[0.06] overflow-hidden hover:border-red-500/25 hover:shadow-[0_0_25px_-5px_rgba(239,68,68,0.12)] transition-all duration-300 hover:scale-[1.02]"
                >
                  {/* Thumbnail */}
                  <div className="relative aspect-video overflow-hidden bg-zinc-900">
                    <img
                      src={video.thumbnailUrl}
                      alt={video.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/50 via-transparent to-transparent" />

                    {/* Play button overlay */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="w-14 h-14 rounded-full bg-red-600/90 flex items-center justify-center backdrop-blur-sm shadow-lg shadow-red-600/20">
                        <svg className="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                    </div>

                    {/* Category badge */}
                    <div className="absolute top-2 right-2 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-zinc-950/70 backdrop-blur-sm text-zinc-300 border border-white/[0.08]">
                      {video.category}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex flex-col gap-2 p-4 flex-1">
                    <h3 className="text-sm font-semibold text-zinc-100 leading-snug line-clamp-2">
                      {video.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-auto pt-1">
                      <div className="w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center">
                        <svg className="w-3 h-3 text-red-400" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                        </svg>
                      </div>
                      <span className="text-xs text-zinc-400">{video.channelName}</span>
                      <span className="text-zinc-700">-</span>
                      <span className="text-xs text-zinc-600">{timeAgo(video.publishedAt)}</span>
                    </div>
                  </div>
                </a>
              ))}

              {youtubeItems.length === 0 && (
                <div className="col-span-full flex flex-col items-center justify-center py-20 text-center">
                  <div className="w-16 h-16 rounded-full bg-white/[0.04] flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-zinc-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                    </svg>
                  </div>
                  <p className="text-zinc-400 text-sm">No YouTube videos available right now.</p>
                </div>
              )}
            </div>
          )}

          {/* ── KOREAN TAB ───────────────────────────────────────── */}
          {activeTab === "korean" && (
            <div className="flex flex-col gap-6">
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
          )}
        </div>
      </Container>
    </section>
  );
}
