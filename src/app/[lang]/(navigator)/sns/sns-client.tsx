"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Tweet } from "react-tweet";
import gsap from "gsap";
import type { XFeedItem } from "@/lib/services/social/x-feed.service";

const CATEGORY_LABELS: Record<string, string> = {
  all: "All",
  news: "News",
  analyst: "Analysts",
  onchain: "On-Chain",
  analytics: "Analytics",
  exchange: "Exchanges",
  whales: "Whales",
};

const CATEGORY_COLORS: Record<string, string> = {
  news: "bg-rose-500/20 text-rose-400 border-rose-500/30",
  analyst: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  onchain: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  analytics: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  exchange: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  whales: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
};

type Props = {
  feedItems: XFeedItem[];
};

export default function SnsClient({ feedItems }: Props) {
  const [activeCategory, setActiveCategory] = useState("all");
  const gridRef = useRef<HTMLDivElement>(null);
  const tabsRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLDivElement>(null);

  const categories = ["all", ...Array.from(new Set(feedItems.map((item) => item.category)))];

  const filteredItems =
    activeCategory === "all"
      ? feedItems
      : feedItems.filter((item) => item.category === activeCategory);

  const animateCards = useCallback(() => {
    if (!gridRef.current) return;
    const cards = gridRef.current.querySelectorAll(".feed-card");
    if (cards.length === 0) return;

    gsap.set(cards, { opacity: 0, y: 30, scale: 0.97 });
    gsap.to(cards, {
      opacity: 1,
      y: 0,
      scale: 1,
      duration: 0.5,
      stagger: 0.06,
      ease: "power3.out",
      clearProps: "transform",
    });
  }, []);

  // Animate indicator on tab change
  const moveIndicator = useCallback((categoryKey: string) => {
    if (!tabsRef.current || !indicatorRef.current) return;
    const activeTab = tabsRef.current.querySelector(`[data-category="${categoryKey}"]`) as HTMLElement;
    if (!activeTab) return;

    gsap.to(indicatorRef.current, {
      x: activeTab.offsetLeft,
      width: activeTab.offsetWidth,
      duration: 0.35,
      ease: "power2.out",
    });
  }, []);

  useEffect(() => {
    animateCards();
  }, [activeCategory, animateCards]);

  useEffect(() => {
    moveIndicator(activeCategory);
  }, [activeCategory, moveIndicator]);

  // Initial tab indicator position
  useEffect(() => {
    const timeout = setTimeout(() => moveIndicator("all"), 100);
    return () => clearTimeout(timeout);
  }, [moveIndicator]);

  const handleCategoryChange = (category: string) => {
    if (category === activeCategory) return;
    setActiveCategory(category);
  };

  return (
    <div className="space-y-8">
      {/* Category Filter Tabs */}
      <div className="relative">
        <div
          ref={tabsRef}
          className="flex gap-1 p-1 rounded-2xl bg-zinc-900/80 border border-zinc-800/50 backdrop-blur-sm overflow-x-auto no-scrollbar"
        >
          <div
            ref={indicatorRef}
            className="absolute top-1 left-0 h-[calc(100%-8px)] rounded-xl bg-blue-600/30 border border-blue-500/40 pointer-events-none"
            style={{ width: 0 }}
          />
          {categories.map((cat) => (
            <button
              key={cat}
              data-category={cat}
              onClick={() => handleCategoryChange(cat)}
              className={`relative z-10 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors duration-200 ${
                activeCategory === cat
                  ? "text-white"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {CATEGORY_LABELS[cat] ?? cat}
              {activeCategory === cat && (
                <span className="ml-2 text-xs text-zinc-400">
                  {filteredItems.length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tweet Grid */}
      <div
        ref={gridRef}
        className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5"
      >
        {filteredItems.map((item) => (
          <div
            key={`${item.tweetId}-${item.username}`}
            className="feed-card group relative rounded-2xl border border-zinc-800/60 bg-zinc-900/40 backdrop-blur-md overflow-hidden hover:border-zinc-700/80 transition-all duration-300"
          >
            {/* Card header with account info */}
            <div className="flex items-center justify-between px-4 pt-4 pb-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-zinc-200">
                  @{item.username}
                </span>
              </div>
              <span
                className={`text-[10px] font-medium uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                  CATEGORY_COLORS[item.category] ?? "bg-zinc-800/50 text-zinc-400 border-zinc-700/50"
                }`}
              >
                {CATEGORY_LABELS[item.category] ?? item.category}
              </span>
            </div>

            {/* Subtle glow effect on hover */}
            <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none bg-gradient-to-b from-blue-500/5 via-transparent to-transparent" />

            {/* Tweet embed */}
            <div className="px-2 pb-3 min-w-0 overflow-hidden [&>div]:!my-0 [&_article]:!border-0 [&_article]:!bg-transparent">
              <Tweet id={item.tweetId} />
            </div>
          </div>
        ))}
      </div>

      {/* Empty state */}
      {filteredItems.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-zinc-800/50 flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
            </svg>
          </div>
          <p className="text-zinc-400 text-sm">No tweets in this category right now.</p>
          <button
            onClick={() => setActiveCategory("all")}
            className="mt-3 text-blue-400 text-sm hover:text-blue-300 transition-colors"
          >
            View all tweets
          </button>
        </div>
      )}
    </div>
  );
}
