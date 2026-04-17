"use client";

import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Tweet } from "react-tweet";
import gsap from "gsap";
import type { XFeedItem } from "@/lib/services/social/x-feed.service";

// ── Constants ────────────────────────────────────────────────────────

const X_CATEGORY_LABELS: Record<string, string> = {
  all: "All",
  official: "FuturesAI",
  news: "News",
  analyst: "Analysts",
  onchain: "On-Chain",
  analytics: "Analytics",
  exchange: "Exchanges",
  whales: "Whales",
};

const X_CATEGORY_COLORS: Record<string, string> = {
  official: "bg-blue-500/20 text-blue-300 border-blue-400/40",
  news: "bg-rose-500/20 text-rose-400 border-rose-500/30",
  analyst: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  onchain: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  analytics: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  exchange: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  whales: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
};

// ── Tweet Components ─────────────────────────────────────────────────

function TweetSkeleton() {
  return (
    <div className="min-h-[200px] flex flex-col gap-3 p-4 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-white/[0.06]" />
        <div className="flex flex-col gap-1.5">
          <div className="h-3.5 w-28 rounded bg-white/[0.06]" />
          <div className="h-3 w-20 rounded bg-white/[0.04]" />
        </div>
      </div>
      <div className="flex flex-col gap-2 mt-2">
        <div className="h-3.5 w-full rounded bg-white/[0.06]" />
        <div className="h-3.5 w-full rounded bg-white/[0.06]" />
        <div className="h-3.5 w-3/4 rounded bg-white/[0.05]" />
      </div>
      <div className="h-3 w-24 rounded bg-white/[0.04] mt-2" />
    </div>
  );
}

function TweetFallback({ username, tweetId }: { username: string; tweetId: string }) {
  return (
    <a
      href={`https://x.com/${username}/status/${tweetId}`}
      target="_blank"
      rel="noopener noreferrer"
      className="block min-h-[200px] rounded-xl bg-zinc-900/80 border border-white/[0.06] p-6 hover:bg-zinc-900 hover:border-white/[0.1] transition-all duration-200"
    >
      <div className="flex flex-col items-center justify-center gap-4 py-4">
        {/* X icon */}
        <div className="w-12 h-12 rounded-full bg-white/[0.06] flex items-center justify-center">
          <svg className="w-6 h-6 text-zinc-300" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
        </div>

        {/* Username */}
        <span className="text-base font-semibold text-zinc-200">@{username}</span>

        {/* Description */}
        <p className="text-sm text-zinc-500 text-center">
          This post couldn&apos;t be loaded directly.
        </p>

        {/* CTA button */}
        <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/[0.08] border border-white/[0.1] text-sm font-medium text-zinc-200 hover:bg-white/[0.14] transition-colors">
          View on X
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
          </svg>
        </span>
      </div>
    </a>
  );
}

// ── Error Boundary ───────────────────────────────────────────────────

class TweetErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}

// ── Twitter Timeline Embed ───────────────────────────────────────────

function TwitterTimeline({ username, height = 600 }: { username: string; height?: number }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    // Load Twitter widget.js if not already loaded
    const win = window as any;
    const render = () => {
      if (win.twttr?.widgets) {
        // Clear previous content
        if (containerRef.current) containerRef.current.innerHTML = "";
        win.twttr.widgets.createTimeline(
          { sourceType: "profile", screenName: username },
          containerRef.current,
          { theme: "dark", chrome: "noheader nofooter noborders transparent", height, dnt: true, tweetLimit: 10 }
        ).then(() => setLoaded(true)).catch(() => {});
      }
    };

    if (win.twttr?.widgets) {
      render();
    } else {
      const script = document.createElement("script");
      script.src = "https://platform.twitter.com/widgets.js";
      script.async = true;
      script.onload = render;
      document.head.appendChild(script);
    }
  }, [username, height]);

  return (
    <div className="rounded-xl border-2 border-blue-500/20 bg-blue-500/[0.03] overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-3 border-b border-blue-500/10 bg-blue-500/[0.04]">
        <svg className="w-5 h-5 text-blue-400" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
        <span className="text-sm font-semibold text-white">@{username}</span>
        <a
          href={`https://x.com/${username}`}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto text-xs text-blue-400 hover:text-blue-300 transition-colors"
        >
          Follow
        </a>
      </div>
      {!loaded && (
        <div className="flex items-center justify-center py-12">
          <div className="w-6 h-6 border-2 border-blue-500/30 border-t-blue-400 rounded-full animate-spin" />
        </div>
      )}
      <div ref={containerRef} className="[&_iframe]:!border-0" />
    </div>
  );
}

// ── Safe Tweet Wrapper ───────────────────────────────────────────────

function SafeTweet({ id, username }: { id: string; username: string }) {
  const fallback = <TweetFallback username={username} tweetId={id} />;

  return (
    <TweetErrorBoundary fallback={fallback}>
      <Suspense fallback={<TweetSkeleton />}>
        <div data-theme="dark" className="[&>div]:!my-0">
          <Tweet
            id={id}
            apiUrl={`/api/tweet/${id}`}
            fallback={<TweetSkeleton />}
          />
        </div>
      </Suspense>
    </TweetErrorBoundary>
  );
}

// ── Props ────────────────────────────────────────────────────────────

interface XFeedTabProps {
  xFeedItems: XFeedItem[];
}

// ── Component ────────────────────────────────────────────────────────

export default function XFeedTab({ xFeedItems }: XFeedTabProps) {
  const [xCategory, setXCategory] = useState("all");
  const containerRef = useRef<HTMLDivElement>(null);

  const filteredXFeed = useMemo(() => {
    // Official tweets are shown in the embedded timeline, exclude from grid
    const items = xCategory === "all"
      ? xFeedItems.filter((item) => item.category !== "official")
      : xFeedItems.filter((item) => item.category === xCategory);
    return items;
  }, [xFeedItems, xCategory]);

  const xCategories = useMemo(() => {
    const cats = Array.from(new Set(xFeedItems.map((item) => item.category)));
    // Put "official" first if present
    const sorted = cats.sort((a, b) => {
      if (a === "official") return -1;
      if (b === "official") return 1;
      return 0;
    });
    return ["all", ...sorted];
  }, [xFeedItems]);

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
  }, [xCategory]);

  return (
    <div ref={containerRef} className="flex flex-col gap-6">
      {/* FuturesAI Official Timeline */}
      {(xCategory === "all" || xCategory === "official") && (
        <TwitterTimeline username="FuturesAI_io" height={500} />
      )}

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
            className={`community-card group relative rounded-xl overflow-hidden transition-all duration-300 ${
              item.category === "official"
                ? "border-2 border-blue-500/30 bg-blue-500/[0.04] hover:border-blue-400/50 hover:bg-blue-500/[0.07] hover:shadow-[0_0_30px_-5px_rgba(59,130,246,0.25)] ring-1 ring-blue-500/10"
                : "border border-white/[0.06] bg-white/[0.03] hover:border-blue-500/25 hover:bg-white/[0.05] hover:shadow-[0_0_20px_-5px_rgba(59,130,246,0.15)]"
            }`}
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
            <div className="px-2 pb-3 min-w-0 overflow-hidden">
              <SafeTweet id={item.tweetId} username={item.username} />
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
  );
}
