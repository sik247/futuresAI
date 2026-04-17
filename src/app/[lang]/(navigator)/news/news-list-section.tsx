"use client";

import type { CryptoNewsItem } from "@/lib/services/news/crypto-news.service";
import Image from "next/image";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import MobileNewsFeed from "./mobile-news-feed";

gsap.registerPlugin(ScrollTrigger);

/** Decode HTML entities like &#8217; → ' and &amp; → & */
function decodeHtml(html: string): string {
  if (typeof document === "undefined") {
    return html
      .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&apos;/g, "'");
  }
  const el = document.createElement("textarea");
  el.innerHTML = html;
  return el.value;
}

interface INewsListSection {
  news: CryptoNewsItem[];
  lang?: string;
}

const CATEGORIES = [
  "All",
  "BTC",
  "ETH",
  "Exchange",
  "DeFi",
  "Market",
  "Blockchain",
  "Regulation",
  "Technology",
];

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function isBreakingNews(date: Date): boolean {
  const oneHour = 60 * 60 * 1000;
  return Date.now() - new Date(date).getTime() < oneHour;
}

const NewsListSection = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"section"> & INewsListSection
>(({ news, lang = "en", ...props }, ref) => {
  const [activeCategory, setActiveCategory] = useState("All");
  const tabsRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const featuredRef = useRef<HTMLAnchorElement>(null);

  const filteredNews = useMemo(() => {
    if (activeCategory === "All") return news;
    return news.filter((item) =>
      item.categories.some(
        (c) => c.toLowerCase() === activeCategory.toLowerCase()
      )
    );
  }, [news, activeCategory]);

  const featuredArticle = filteredNews[0];
  const remainingArticles = filteredNews.slice(1);

  // Check for breaking news (most recent article < 1 hour old)
  const breakingArticle = useMemo(() => {
    if (news.length === 0) return null;
    const sorted = [...news].sort(
      (a, b) =>
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );
    return isBreakingNews(sorted[0].publishedAt) ? sorted[0] : null;
  }, [news]);

  // GSAP sliding indicator for category tabs
  const moveIndicator = useCallback((categoryKey: string) => {
    if (!tabsRef.current || !indicatorRef.current) return;
    const activeTab = tabsRef.current.querySelector(
      `[data-category="${categoryKey}"]`
    ) as HTMLElement;
    if (!activeTab) return;

    gsap.to(indicatorRef.current, {
      x: activeTab.offsetLeft,
      width: activeTab.offsetWidth,
      duration: 0.35,
      ease: "power2.out",
    });
  }, []);

  // Animate cards entrance
  const animateCards = useCallback(() => {
    if (!gridRef.current) return;
    const cards = gridRef.current.querySelectorAll(".news-card");
    if (cards.length === 0) return;

    gsap.set(cards, { opacity: 0, y: 40, scale: 0.96 });
    gsap.to(cards, {
      opacity: 1,
      y: 0,
      scale: 1,
      duration: 0.55,
      stagger: 0.07,
      ease: "power3.out",
      clearProps: "transform",
    });
  }, []);

  // Animate featured card
  const animateFeatured = useCallback(() => {
    if (!featuredRef.current) return;
    gsap.fromTo(
      featuredRef.current,
      { opacity: 0, scale: 0.97, y: 20 },
      {
        opacity: 1,
        scale: 1,
        y: 0,
        duration: 0.6,
        ease: "power3.out",
        clearProps: "transform",
      }
    );
  }, []);

  // Move indicator on mount and category change
  useEffect(() => {
    moveIndicator(activeCategory);
  }, [activeCategory, moveIndicator]);

  // Re-animate on category change
  useEffect(() => {
    animateFeatured();
    // Small delay so featured animates first
    const timer = setTimeout(() => animateCards(), 100);
    return () => clearTimeout(timer);
  }, [activeCategory, animateFeatured, animateCards]);

  // Scroll-triggered staggered entrance for grid cards
  useEffect(() => {
    if (!gridRef.current) return;
    const cards = gridRef.current.querySelectorAll(".news-card");

    const triggers: ScrollTrigger[] = [];
    cards.forEach((card) => {
      const st = ScrollTrigger.create({
        trigger: card,
        start: "top 90%",
        once: true,
        onEnter: () => {
          gsap.fromTo(
            card,
            { opacity: 0, y: 30 },
            { opacity: 1, y: 0, duration: 0.5, ease: "power3.out", clearProps: "transform" }
          );
        },
      });
      triggers.push(st);
    });

    return () => {
      triggers.forEach((st) => st.kill());
    };
  }, [filteredNews]);

  return (
    <section ref={ref} {...props} className="flex flex-col gap-8 w-full">
      {/* Mobile condensed feed (<1024px) */}
      <MobileNewsFeed news={news} lang={lang} />

      {/* Desktop layout (≥1024px) — unchanged */}
      <div className="hidden lg:flex flex-col gap-8 w-full">
      {/* Breaking news ticker — removed */}

      {/* Category filter with GSAP sliding indicator */}
      <div className="relative rounded-xl bg-white/[0.03] backdrop-blur-md border border-white/[0.06] p-1.5 overflow-x-auto scrollbar-none">
        <div ref={tabsRef} className="relative flex items-center gap-1">
          {/* Sliding indicator */}
          <div
            ref={indicatorRef}
            className="absolute top-0 left-0 h-full rounded-lg bg-white/[0.08] border border-white/[0.1] pointer-events-none"
            style={{ width: 0 }}
          />
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              data-category={cat}
              onClick={() => setActiveCategory(cat)}
              className={`relative z-10 px-4 py-2 rounded-lg text-xs font-medium tracking-wide transition-colors whitespace-nowrap ${
                activeCategory === cat
                  ? "text-white"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Featured article */}
      {featuredArticle && (
        <FeaturedCard ref={featuredRef} news={featuredArticle} />
      )}

      {/* 2-column grid */}
      {remainingArticles.length > 0 && (
        <div
          ref={gridRef}
          className="grid grid-cols-1 md:grid-cols-2 gap-5"
        >
          {remainingArticles.map((item) => (
            <NewsCard key={item.id} news={item} />
          ))}
        </div>
      )}

      {filteredNews.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-600">
            No results
          </span>
          <p className="text-sm text-zinc-500">
            No news found for this category.
          </p>
        </div>
      )}
      </div>
    </section>
  );
});

NewsListSection.displayName = "NewsListSection";
export { NewsListSection };

/* ------------------------------------------------------------------ */
/*  Featured Card                                                      */
/* ------------------------------------------------------------------ */

const FeaturedCard = React.forwardRef<
  HTMLAnchorElement,
  { news: CryptoNewsItem }
>(({ news }, ref) => {
  const imageRef = useRef<HTMLDivElement>(null);

  const handleMouseEnter = () => {
    if (!imageRef.current) return;
    gsap.to(imageRef.current.querySelector("img"), {
      scale: 1.05,
      duration: 0.6,
      ease: "power2.out",
    });
  };

  const handleMouseLeave = () => {
    if (!imageRef.current) return;
    gsap.to(imageRef.current.querySelector("img"), {
      scale: 1,
      duration: 0.6,
      ease: "power2.out",
    });
  };

  return (
    <a
      ref={ref}
      href={news.url}
      target="_blank"
      rel="noopener noreferrer"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="group grid grid-cols-1 lg:grid-cols-2 gap-0 rounded-xl bg-white/[0.03] backdrop-blur-md border border-white/[0.06] overflow-hidden transition-all duration-300 hover:border-white/[0.12] hover:bg-white/[0.05] hover:shadow-[0_0_30px_-5px_rgba(37,99,235,0.15)]"
    >
      {/* Image */}
      <div
        ref={imageRef}
        className="relative w-full h-[240px] lg:h-[380px] bg-zinc-900 overflow-hidden"
      >
        <Image
          src={news.imageUrl}
          alt={news.title}
          fill
          className="object-cover"
          sizes="(max-width: 1024px) 100vw, 50vw"
          priority
          unoptimized
        />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/60 via-transparent to-transparent" />
      </div>

      {/* Content */}
      <div className="flex flex-col justify-center gap-5 p-8 lg:p-10">
        {/* Source + time */}
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-blue-500/15 text-blue-400 font-mono text-[10px] font-semibold uppercase tracking-wider border border-blue-500/20">
            {news.sourceImg && (
              <img src={news.sourceImg} alt="" className="w-4 h-4 rounded-sm" />
            )}
            {news.source}
          </span>
          <span className="font-mono text-zinc-500">
            {timeAgo(news.publishedAt)}
          </span>
        </div>

        {/* Title */}
        <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white leading-tight tracking-tight group-hover:text-zinc-100 transition-colors">
          {decodeHtml(news.title)}
        </h2>

        {/* Body excerpt */}
        <p className="text-sm text-zinc-400 leading-relaxed line-clamp-3">
          {news.body}
        </p>

        {/* Category tags */}
        {news.categories.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-1">
            {news.categories.slice(0, 4).map((cat) => (
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
  );
});

FeaturedCard.displayName = "FeaturedCard";

/* ------------------------------------------------------------------ */
/*  News Card                                                          */
/* ------------------------------------------------------------------ */

const NewsCard: React.FC<{ news: CryptoNewsItem }> = ({ news }) => {
  const cardRef = useRef<HTMLAnchorElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);

  const handleMouseEnter = () => {
    if (cardRef.current) {
      gsap.to(cardRef.current, {
        y: -4,
        duration: 0.3,
        ease: "power2.out",
      });
    }
    if (imageRef.current) {
      gsap.to(imageRef.current.querySelector("img"), {
        scale: 1.06,
        duration: 0.5,
        ease: "power2.out",
      });
    }
  };

  const handleMouseLeave = () => {
    if (cardRef.current) {
      gsap.to(cardRef.current, {
        y: 0,
        duration: 0.3,
        ease: "power2.out",
      });
    }
    if (imageRef.current) {
      gsap.to(imageRef.current.querySelector("img"), {
        scale: 1,
        duration: 0.5,
        ease: "power2.out",
      });
    }
  };

  return (
    <a
      ref={cardRef}
      href={news.url}
      target="_blank"
      rel="noopener noreferrer"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="news-card group flex flex-col rounded-xl bg-white/[0.03] backdrop-blur-md border border-white/[0.06] overflow-hidden transition-all duration-300 hover:border-white/[0.12] hover:bg-white/[0.05] hover:shadow-[0_0_25px_-5px_rgba(37,99,235,0.12)]"
    >
      {/* Image */}
      <div
        ref={imageRef}
        className="relative w-full h-[200px] bg-zinc-900 overflow-hidden"
      >
        <Image
          src={news.imageUrl}
          alt={news.title}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 50vw"
          loading="lazy"
          unoptimized
        />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/70 via-zinc-950/20 to-transparent" />

        {/* Source badge overlaid on image */}
        <div className="absolute bottom-3 left-3">
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-500/15 backdrop-blur-sm text-[10px] font-mono font-semibold uppercase tracking-wider text-blue-400 border border-blue-500/20">
            {news.sourceImg && (
              <img src={news.sourceImg} alt="" className="w-3.5 h-3.5 rounded-sm" />
            )}
            {news.source}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col gap-3 p-5 flex-1">
        {/* Time */}
        <span className="font-mono text-[11px] text-zinc-500">
          {timeAgo(news.publishedAt)}
        </span>

        {/* Title */}
        <h3 className="text-base md:text-lg font-semibold text-white leading-snug tracking-tight line-clamp-2 group-hover:text-zinc-100 transition-colors">
          {decodeHtml(news.title)}
        </h3>

        {/* Body */}
        <p className="text-sm text-zinc-500 leading-relaxed line-clamp-2 flex-1">
          {news.body}
        </p>

        {/* Category tags */}
        {news.categories.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {news.categories.slice(0, 3).map((cat) => (
              <span
                key={cat}
                className="px-2 py-0.5 text-[10px] font-mono font-medium uppercase tracking-wider rounded-full bg-white/[0.05] text-zinc-400 border border-white/[0.08]"
              >
                {cat}
              </span>
            ))}
          </div>
        )}
      </div>
    </a>
  );
};
