"use client";

import type { CryptoNewsItem } from "@/lib/services/news/crypto-news.service";
import Link from "next/link";
import Image from "next/image";
import React, { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

type TNewsSection = {
  newsList: CryptoNewsItem[];
  lang?: string;
};

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

const NewsSection = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & TNewsSection
>(({ newsList, lang, ...props }, ref) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Header entrance
      if (headerRef.current) {
        gsap.from(headerRef.current.children, {
          y: 30,
          opacity: 0,
          duration: 0.8,
          ease: "power3.out",
          stagger: 0.15,
          scrollTrigger: {
            trigger: headerRef.current,
            start: "top 85%",
            once: true,
          },
        });
      }

      // Staggered card entrance
      if (cardsRef.current) {
        const cards = cardsRef.current.querySelectorAll(".news-card");
        gsap.from(cards, {
          x: 60,
          opacity: 0,
          duration: 0.7,
          ease: "power3.out",
          stagger: 0.1,
          scrollTrigger: {
            trigger: cardsRef.current,
            start: "top 85%",
            once: true,
          },
        });
      }

      // Drag scrolling
      if (scrollRef.current) {
        const el = scrollRef.current;
        let startX = 0;
        let scrollLeft = 0;
        let isDragging = false;

        const onPointerDown = (e: PointerEvent) => {
          isDragging = true;
          startX = e.pageX - el.offsetLeft;
          scrollLeft = el.scrollLeft;
          el.style.cursor = "grabbing";
        };

        const onPointerMove = (e: PointerEvent) => {
          if (!isDragging) return;
          e.preventDefault();
          const x = e.pageX - el.offsetLeft;
          const walk = (x - startX) * 1.5;
          gsap.to(el, {
            scrollLeft: scrollLeft - walk,
            duration: 0.3,
            ease: "power2.out",
            overwrite: true,
          });
        };

        const onPointerUp = () => {
          isDragging = false;
          el.style.cursor = "grab";
        };

        el.addEventListener("pointerdown", onPointerDown);
        el.addEventListener("pointermove", onPointerMove);
        el.addEventListener("pointerup", onPointerUp);
        el.addEventListener("pointerleave", onPointerUp);

        return () => {
          el.removeEventListener("pointerdown", onPointerDown);
          el.removeEventListener("pointermove", onPointerMove);
          el.removeEventListener("pointerup", onPointerUp);
          el.removeEventListener("pointerleave", onPointerUp);
        };
      }
    });

    return () => ctx.revert();
  }, [newsList]);

  return (
    <section ref={ref} {...props} className="flex flex-col gap-8">
      <div ref={headerRef} className="flex items-end justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-mono uppercase tracking-[0.2em] text-blue-400">
            Latest Intel
          </span>
          <h2 className="text-2xl md:text-3xl font-bold text-white leading-tight">
            Crypto Market News
          </h2>
        </div>
        <Link
          href={`/${lang ?? "en"}/news`}
          className="shrink-0 text-sm font-medium px-5 py-2 rounded-full border border-white/10 bg-white/5 text-zinc-300 hover:bg-blue-600 hover:text-white hover:border-blue-500 transition-all duration-300"
        >
          View All
        </Link>
      </div>

      <div
        ref={(node: HTMLDivElement | null) => {
          (scrollRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
          if (cardsRef.current === null) (cardsRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
        }}
        className="w-full gap-4 inline-flex overflow-x-auto no-scrollbar cursor-grab select-none"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        {newsList.map((news) => (
          <NewsCard key={news.id} news={news} />
        ))}
      </div>
    </section>
  );
});

NewsSection.displayName = "NewsSection";

export { NewsSection };

type TNewsCard = {
  news: CryptoNewsItem;
};

const NewsCard: React.FC<TNewsCard> = ({ news }) => {
  const cardRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    if (!cardRef.current) return;
    const card = cardRef.current;
    const img = card.querySelector(".news-img") as HTMLElement;

    const onEnter = () => {
      gsap.to(card, {
        y: -6,
        duration: 0.35,
        ease: "power2.out",
      });
      if (img) {
        gsap.to(img, { scale: 1.08, duration: 0.5, ease: "power2.out" });
      }
    };

    const onLeave = () => {
      gsap.to(card, {
        y: 0,
        duration: 0.35,
        ease: "power2.out",
      });
      if (img) {
        gsap.to(img, { scale: 1, duration: 0.5, ease: "power2.out" });
      }
    };

    card.addEventListener("mouseenter", onEnter);
    card.addEventListener("mouseleave", onLeave);
    return () => {
      card.removeEventListener("mouseenter", onEnter);
      card.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  return (
    <a
      ref={cardRef}
      href={news.url}
      target="_blank"
      rel="noopener noreferrer"
      className="news-card group flex flex-col rounded-xl w-[340px] shrink-0 overflow-hidden
        backdrop-blur-md bg-white/[0.04] border border-white/[0.08]
        hover:border-blue-500/40 hover:shadow-[0_0_30px_-5px_rgba(37,99,235,0.15)]
        transition-[border-color,box-shadow] duration-300"
    >
      <div className="relative w-full h-[160px] overflow-hidden bg-zinc-900">
        <Image
          src={news.imageUrl}
          alt={news.title}
          fill
          className="news-img object-cover will-change-transform"
          sizes="340px"
          unoptimized
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="absolute bottom-3 left-3">
          <span className="text-[10px] font-mono uppercase tracking-wider text-blue-300 bg-blue-500/20 backdrop-blur-sm px-2 py-0.5 rounded-full border border-blue-400/20">
            {news.source}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-2.5 p-4 flex-1">
        <span className="text-sm font-semibold text-zinc-100 line-clamp-2 leading-snug group-hover:text-white transition-colors">
          {news.title}
        </span>
        <p className="text-xs text-zinc-400 line-clamp-2 flex-1 leading-relaxed">
          {news.body}
        </p>
        <div className="flex items-center justify-end pt-1">
          <span className="text-zinc-500 text-[11px] font-mono">
            {timeAgo(news.publishedAt)}
          </span>
        </div>
      </div>
    </a>
  );
};

export default NewsCard;
