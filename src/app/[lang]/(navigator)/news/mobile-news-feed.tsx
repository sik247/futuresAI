"use client";

import type { CryptoNewsItem } from "@/lib/services/news/crypto-news.service";
import Image from "next/image";
import { useMemo, useState } from "react";

/** Decode HTML entities for SSR safety */
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

function timeAgo(date: Date, ko: boolean): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return ko ? "방금" : "just now";
  const m = Math.floor(seconds / 60);
  if (m < 60) return ko ? `${m}분 전` : `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return ko ? `${h}시간 전` : `${h}h ago`;
  const d = Math.floor(h / 24);
  return ko ? `${d}일 전` : `${d}d ago`;
}

function isBreaking(date: Date): boolean {
  return Date.now() - new Date(date).getTime() < 60 * 60 * 1000;
}

type Category = "All" | "Breaking" | "Market" | "Regulation" | "KR";

const CATEGORY_LABEL: Record<Category, { en: string; ko: string }> = {
  All: { en: "All", ko: "전체" },
  Breaking: { en: "Breaking", ko: "속보" },
  Market: { en: "Market", ko: "시장" },
  Regulation: { en: "Regulation", ko: "규제" },
  KR: { en: "KR", ko: "한국" },
};

const KR_SOURCES = /xangle|zdnet korea|코인니스|coinness|코인데스크코리아|digital asset|digitaltoday/i;

function matchCategory(item: CryptoNewsItem, category: Category): boolean {
  if (category === "All") return true;
  if (category === "Breaking") return isBreaking(item.publishedAt);
  if (category === "KR") {
    return KR_SOURCES.test(item.source || "") || /[가-힣]/.test(item.title || "");
  }
  // Market | Regulation — match via categories array (case-insensitive)
  const hay = (item.categories || []).map((c) => c.toLowerCase());
  if (category === "Market") {
    return hay.some((c) =>
      ["market", "markets", "btc", "eth", "exchange", "defi", "price"].includes(c)
    );
  }
  if (category === "Regulation") {
    return hay.some((c) =>
      ["regulation", "legal", "policy", "government", "sec"].includes(c)
    );
  }
  return false;
}

/* ──────────────── Condensed card ──────────────── */
function MobileNewsCard({ item, ko }: { item: CryptoNewsItem; ko: boolean }) {
  const breaking = isBreaking(item.publishedAt);
  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-start gap-3 px-4 py-3 border-b border-white/[0.04] hover:bg-white/[0.02] active:bg-white/[0.04] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40"
    >
      {/* Thumbnail */}
      <div className="relative shrink-0 w-20 h-20 rounded-xl overflow-hidden bg-zinc-900 border border-white/[0.06]">
        {item.imageUrl ? (
          <Image
            src={item.imageUrl}
            alt={item.title}
            fill
            className="object-cover"
            sizes="80px"
            loading="lazy"
            unoptimized
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg className="w-6 h-6 text-zinc-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>
          </div>
        )}
        {breaking && (
          <span className="absolute top-1 left-1 px-1.5 py-0.5 text-[8px] font-mono font-bold uppercase tracking-wider rounded bg-red-500 text-white shadow-lg animate-pulse">
            {ko ? "속보" : "Live"}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 py-0.5">
        <h3 className="text-[13px] font-semibold text-white leading-snug line-clamp-2 group-hover:text-zinc-100 transition-colors">
          {decodeHtml(item.title)}
        </h3>
        <div className="flex items-center gap-1.5 mt-1.5">
          <span className="flex items-center gap-1 text-[10px] font-mono font-semibold text-blue-400 truncate">
            {item.sourceImg && (
              <img src={item.sourceImg} alt="" className="w-3 h-3 rounded-sm shrink-0" />
            )}
            <span className="truncate">{item.source}</span>
          </span>
          <span className="text-zinc-800 shrink-0">·</span>
          <span className="text-[10px] font-mono text-zinc-500 shrink-0 tabular-nums">
            {timeAgo(item.publishedAt, ko)}
          </span>
        </div>
      </div>
    </a>
  );
}

/* ──────────────── Main ──────────────── */
export default function MobileNewsFeed({
  news,
  lang,
}: {
  news: CryptoNewsItem[];
  lang: string;
}) {
  const ko = lang === "ko";
  const [category, setCategory] = useState<Category>("All");

  const filtered = useMemo(
    () => news.filter((n) => matchCategory(n, category)),
    [news, category]
  );

  const categories: Category[] = ["All", "Breaking", "Market", "Regulation", "KR"];

  return (
    <div className="lg:hidden -mx-4 sm:-mx-6">
      {/* Sticky category chips — top offset accounts for fixed header (64px mobile, 92px sm). */}
      <div className="sticky top-[64px] sm:top-[92px] z-20 bg-zinc-950/95 backdrop-blur-xl border-b border-white/[0.04]">
        <div className="flex gap-2 px-4 py-3 overflow-x-auto no-scrollbar">
          {categories.map((c) => {
            const active = category === c;
            const label = ko ? CATEGORY_LABEL[c].ko : CATEGORY_LABEL[c].en;
            const isBreaking_ = c === "Breaking";
            return (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`shrink-0 px-4 h-9 rounded-full text-xs font-semibold tracking-wide border transition-all duration-150 active:scale-[0.97] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 ${
                  active
                    ? isBreaking_
                      ? "bg-red-500/20 border-red-500/40 text-red-300 shadow-[0_0_12px_rgba(239,68,68,0.15)]"
                      : "bg-blue-500/15 border-blue-500/40 text-blue-300 shadow-[0_0_12px_rgba(59,130,246,0.15)]"
                    : "bg-white/[0.03] border-white/[0.06] text-zinc-400"
                }`}
              >
                {isBreaking_ && !active && (
                  <span className="inline-flex items-center gap-1.5">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500" />
                    </span>
                    {label}
                  </span>
                )}
                {(!isBreaking_ || active) && label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Feed */}
      <div>
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 px-4 text-center">
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-600">
              {ko ? "결과 없음" : "No results"}
            </span>
            <p className="text-sm text-zinc-500">
              {ko ? "이 카테고리에 뉴스가 없습니다." : "No news in this category."}
            </p>
          </div>
        ) : (
          filtered.map((item) => <MobileNewsCard key={item.id} item={item} ko={ko} />)
        )}
      </div>
    </div>
  );
}
