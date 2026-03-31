"use client";

import React, { useRef, useEffect, useState } from "react";
import gsap from "gsap";
import { QUANT_BLOG_POSTS, type QuantBlogPost } from "@/lib/data/quant-blog-posts";

/* ------------------------------------------------------------------ */
/*  Direction badge                                                     */
/* ------------------------------------------------------------------ */
function DirectionBadge({ direction }: { direction: QuantBlogPost["direction"] }) {
  const styles = {
    LONG: "bg-emerald-500/90 text-white border border-emerald-400/50",
    SHORT: "bg-red-500/90 text-white border border-red-400/50",
    NEUTRAL: "bg-zinc-700/90 text-zinc-200 border border-zinc-500/50",
  };
  const labels = {
    LONG: "\u25B2 LONG",
    SHORT: "\u25BC SHORT",
    NEUTRAL: "\u25C6 NEUTRAL",
  };
  return (
    <span
      className={`absolute top-3 right-3 px-2.5 py-1 text-[10px] font-mono font-bold rounded-md backdrop-blur-sm ${styles[direction]}`}
    >
      {labels[direction]}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  RSI pill                                                            */
/* ------------------------------------------------------------------ */
function RsiPill({ rsi }: { rsi: number }) {
  let color = "text-yellow-400 bg-yellow-500/10 border-yellow-500/20";
  if (rsi >= 70) color = "text-red-400 bg-red-500/10 border-red-500/20";
  else if (rsi <= 30) color = "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
  else if (rsi >= 55) color = "text-orange-400 bg-orange-500/10 border-orange-500/20";
  else if (rsi <= 45) color = "text-blue-400 bg-blue-500/10 border-blue-500/20";
  return (
    <span className={`px-2 py-0.5 text-[10px] font-mono font-semibold rounded border ${color}`}>
      RSI {rsi}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Content renderer (markdown-style → basic HTML)                     */
/* ------------------------------------------------------------------ */
function ContentBody({ content }: { content: string }) {
  const lines = content.split("\n");
  return (
    <div className="text-sm text-zinc-400 leading-relaxed space-y-3 mt-4 font-mono">
      {lines.map((line, i) => {
        if (line.startsWith("## ")) {
          return (
            <h3 key={i} className="text-xs font-bold text-zinc-200 uppercase tracking-[0.12em] mt-5 mb-1 font-mono">
              {line.replace("## ", "")}
            </h3>
          );
        }
        if (line.startsWith("**") && line.endsWith("**")) {
          return (
            <p key={i} className="text-zinc-300 font-semibold text-xs">
              {line.replace(/\*\*/g, "")}
            </p>
          );
        }
        if (line.trim() === "") return null;
        // Inline bold replacement
        const parts = line.split(/(\*\*[^*]+\*\*)/g);
        return (
          <p key={i} className="text-[13px] text-zinc-400 leading-relaxed">
            {parts.map((part, j) =>
              part.startsWith("**") && part.endsWith("**") ? (
                <strong key={j} className="text-zinc-200 font-semibold">
                  {part.replace(/\*\*/g, "")}
                </strong>
              ) : (
                part
              )
            )}
          </p>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Blog card                                                           */
/* ------------------------------------------------------------------ */
function BlogCard({ post, lang }: { post: QuantBlogPost; lang: string }) {
  const [expanded, setExpanded] = useState(false);
  const isKo = lang === "ko";

  const priceFormatted =
    post.price >= 1000
      ? `$${post.price.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
      : `$${post.price.toFixed(2)}`;

  return (
    <article className="group relative flex flex-col rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] transition-colors duration-300 overflow-hidden cursor-pointer">
      {/* Chart image */}
      <div className="relative overflow-hidden">
        <img
          src={post.chartImage}
          alt={`${post.coin} 4H chart`}
          className="w-full h-52 object-cover transition-transform duration-500 ease-out group-hover:scale-105"
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-transparent to-transparent" />
        <DirectionBadge direction={post.direction} />
        {/* Coin label bottom-left of image */}
        <div className="absolute bottom-3 left-3 flex items-baseline gap-2">
          <span className="text-sm font-bold text-white font-mono">{post.symbol}</span>
          <span className="text-xs font-mono text-zinc-300">{priceFormatted}</span>
          <span
            className={`text-[11px] font-mono font-semibold ${
              post.change24h >= 0 ? "text-emerald-400" : "text-red-400"
            }`}
          >
            {post.change24h >= 0 ? "+" : ""}
            {post.change24h.toFixed(2)}%
          </span>
        </div>
      </div>

      {/* Card body */}
      <div className="flex flex-col flex-1 p-5 gap-3">
        {/* Title */}
        <h2 className="text-sm font-semibold text-zinc-100 leading-snug">
          {isKo ? post.titleKo : post.title}
        </h2>

        {/* Excerpt */}
        <p className="text-[13px] text-zinc-500 leading-relaxed line-clamp-3">
          {isKo ? post.excerptKo : post.excerpt}
        </p>

        {/* Meta row */}
        <div className="flex items-center gap-2 flex-wrap">
          <RsiPill rsi={post.rsi} />
          <span className="text-[11px] text-zinc-600 font-mono">
            {new Date(post.publishedAt).toLocaleDateString(isKo ? "ko-KR" : "en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </span>
          <span className="text-[11px] text-zinc-700 font-mono ml-auto">
            {post.author}
          </span>
        </div>

        {/* Expanded content */}
        {expanded && <ContentBody content={post.content} />}

        {/* Read more / collapse */}
        <button
          onClick={() => setExpanded((v) => !v)}
          className="mt-auto pt-2 text-[12px] font-mono font-semibold text-blue-400 hover:text-blue-300 transition-colors text-left cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50"
        >
          {expanded
            ? isKo
              ? "접기"
              : "Collapse"
            : isKo
            ? "전체 분석 보기 +"
            : "Read full analysis +"}
        </button>
      </div>
    </article>
  );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                      */
/* ------------------------------------------------------------------ */
export default function QuantBlog({ lang }: { lang: string }) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      if (sectionRef.current) {
        gsap.from(sectionRef.current.querySelector(".blog-header"), {
          opacity: 0,
          y: 20,
          duration: 0.7,
          ease: "power2.out",
        });
      }
      if (cardsRef.current) {
        gsap.from(cardsRef.current.children, {
          opacity: 0,
          y: 40,
          stagger: 0.15,
          duration: 0.7,
          ease: "power2.out",
          delay: 0.2,
        });
      }
    });
    return () => ctx.revert();
  }, []);

  const isKo = lang === "ko";
  const dateLabel = new Date("2026-03-31").toLocaleDateString(isKo ? "ko-KR" : "en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <section ref={sectionRef} className="max-w-7xl mx-auto px-6 pt-16 pb-24 sm:pb-32">
      {/* Section header */}
      <div className="blog-header flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
        <div>
          <p className="font-mono text-[11px] tracking-[0.3em] text-zinc-500 uppercase mb-2">
            {isKo ? "퀀트 리서치" : "Quant Research"}
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            {isKo ? "시장 분석 리포트" : "Market Analysis Reports"}
          </h2>
        </div>
        <span className="font-mono text-[12px] text-zinc-600 shrink-0">{dateLabel}</span>
      </div>

      {/* Divider */}
      <div className="h-px w-full bg-white/[0.06] mb-10" />

      {/* Cards grid */}
      <div
        ref={cardsRef}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {QUANT_BLOG_POSTS.map((post) => (
          <BlogCard key={post.id} post={post} lang={lang} />
        ))}
      </div>

      {/* Disclaimer */}
      <p className="mt-10 text-[11px] text-zinc-700 font-mono text-center leading-relaxed max-w-2xl mx-auto">
        {isKo
          ? "본 분석은 정보 제공 목적으로만 작성되었으며 투자 조언이 아닙니다. 모든 거래는 본인의 판단과 책임 하에 이루어져야 합니다."
          : "This analysis is for informational purposes only and does not constitute investment advice. All trades are made at your own risk and discretion."}
      </p>
    </section>
  );
}
