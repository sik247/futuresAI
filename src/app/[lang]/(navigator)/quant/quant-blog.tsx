"use client";

import React, { useRef, useEffect, useCallback, useState } from "react";
import Link from "next/link";
import gsap from "gsap";
import { QUANT_BLOG_POSTS, type QuantBlogPost, type TradeSetup } from "@/lib/data/quant-blog-posts";

/* ------------------------------------------------------------------ */
/*  Annotated chart — draws Entry/SL/TP lines on the chart image       */
/* ------------------------------------------------------------------ */
function AnnotatedChart({
  src,
  alt,
  tradeSetup,
  direction,
  className,
}: {
  src: string;
  alt: string;
  tradeSetup: TradeSetup;
  direction: QuantBlogPost["direction"];
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const w = container.clientWidth;
      const h = (w / img.naturalWidth) * img.naturalHeight;
      canvas.width = w;
      canvas.height = h;
      ctx.drawImage(img, 0, 0, w, h);

      // Only draw lines for posts with real trade setups
      if (tradeSetup.entry === 0) { setLoaded(true); return; }

      // Map price levels to Y positions (use chart proportions)
      // We place entry at 45%, SL at 70%, TP at 15% of chart height
      const entryY = direction === "SHORT" ? h * 0.35 : h * 0.45;
      const slY = direction === "SHORT" ? h * 0.18 : h * 0.68;
      const tpY = direction === "SHORT" ? h * 0.65 : h * 0.20;

      const fmt = (n: number) => n >= 1000 ? `$${n.toLocaleString()}` : `$${n.toFixed(n >= 10 ? 2 : 4)}`;

      // Draw Entry line (blue, dashed)
      drawLine(ctx, w, entryY, "#3B82F6", [8, 4], `Entry ${fmt(tradeSetup.entry)}`, 2);
      // Draw Stop Loss line (red, dashed)
      drawLine(ctx, w, slY, "#EF4444", [6, 3], `SL ${fmt(tradeSetup.stopLoss)}`, 1.5);
      // Draw Take Profit line (green, dashed)
      drawLine(ctx, w, tpY, "#22C55E", [6, 3], `TP ${fmt(tradeSetup.takeProfit)}`, 1.5);

      // Draw zones between entry and SL/TP
      // Risk zone (entry to SL)
      ctx.fillStyle = "rgba(239, 68, 68, 0.06)";
      ctx.fillRect(0, Math.min(entryY, slY), w, Math.abs(slY - entryY));
      // Reward zone (entry to TP)
      ctx.fillStyle = "rgba(34, 197, 94, 0.06)";
      ctx.fillRect(0, Math.min(entryY, tpY), w, Math.abs(tpY - entryY));

      setLoaded(true);
    };
    img.src = src;
  }, [src, tradeSetup, direction]);

  useEffect(() => { draw(); }, [draw]);

  return (
    <div ref={containerRef} className={className}>
      <canvas ref={canvasRef} className="w-full block" style={{ display: loaded ? "block" : "none" }} />
      {!loaded && <div className="w-full h-52 bg-white/[0.03] animate-pulse" />}
    </div>
  );
}

function drawLine(
  ctx: CanvasRenderingContext2D,
  width: number,
  y: number,
  color: string,
  dash: number[],
  label: string,
  lineWidth: number
) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.setLineDash(dash);
  ctx.globalAlpha = 0.85;
  ctx.beginPath();
  ctx.moveTo(0, y);
  ctx.lineTo(width, y);
  ctx.stroke();
  ctx.setLineDash([]);

  // Right-side price tag
  ctx.font = "bold 10px monospace";
  const textW = ctx.measureText(label).width;
  const pad = 5;
  const tagW = textW + pad * 2;
  const tagH = 16;
  const tagX = width - tagW - 3;
  const tagY = y - tagH / 2;

  ctx.globalAlpha = 0.92;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(tagX, tagY, tagW, tagH, 2);
  ctx.fill();

  // Arrow
  ctx.beginPath();
  ctx.moveTo(tagX - 3, y);
  ctx.lineTo(tagX, y - 3);
  ctx.lineTo(tagX, y + 3);
  ctx.closePath();
  ctx.fill();

  // Text
  ctx.globalAlpha = 1;
  ctx.fillStyle = "#FFFFFF";
  ctx.fillText(label, tagX + pad, tagY + 12);
  ctx.restore();
}

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
/*  Trade setup panel (TradingView-style)                              */
/* ------------------------------------------------------------------ */
function TradeSetupPanel({
  setup,
  direction,
  supportLevels,
  resistanceLevels,
  isKo,
}: {
  setup: TradeSetup;
  direction: QuantBlogPost["direction"];
  supportLevels: number[];
  resistanceLevels: number[];
  isKo: boolean;
}) {
  const fmt = (n: number) =>
    n >= 1000
      ? `$${n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
      : `$${n.toFixed(2)}`;

  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
      {/* Header */}
      <div className={`px-4 py-2 text-[10px] font-mono font-bold uppercase tracking-[0.15em] ${
        direction === "LONG"
          ? "bg-emerald-500/10 text-emerald-400 border-b border-emerald-500/20"
          : direction === "SHORT"
          ? "bg-red-500/10 text-red-400 border-b border-red-500/20"
          : "bg-zinc-800/50 text-zinc-400 border-b border-white/[0.06]"
      }`}>
        {isKo ? "트레이드 셋업" : "Trade Setup"} - {direction === "LONG" ? "LONG" : direction === "SHORT" ? "SHORT" : "WAIT"}
      </div>

      {/* Entry / SL / TP grid */}
      <div className="grid grid-cols-3 divide-x divide-white/[0.04]">
        <div className="p-3 text-center">
          <p className="text-[9px] font-mono text-zinc-600 uppercase mb-1">{isKo ? "진입가" : "Entry"}</p>
          <p className="text-sm font-mono font-bold text-blue-400">{fmt(setup.entry)}</p>
        </div>
        <div className="p-3 text-center">
          <p className="text-[9px] font-mono text-zinc-600 uppercase mb-1">{isKo ? "손절가" : "Stop Loss"}</p>
          <p className="text-sm font-mono font-bold text-red-400">{fmt(setup.stopLoss)}</p>
        </div>
        <div className="p-3 text-center">
          <p className="text-[9px] font-mono text-zinc-600 uppercase mb-1">{isKo ? "목표가" : "Take Profit"}</p>
          <p className="text-sm font-mono font-bold text-emerald-400">{fmt(setup.takeProfit)}</p>
        </div>
      </div>

      {/* R:R + Levels */}
      <div className="px-4 py-3 border-t border-white/[0.04] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-mono text-zinc-500">R:R</span>
          <span className="text-xs font-mono font-bold text-purple-400">{setup.riskReward}</span>
        </div>
        <div className="flex items-center gap-2">
          {supportLevels.slice(0, 2).map((l, i) => (
            <span key={`s${i}`} className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-500/70 border border-emerald-500/15">
              S{i + 1}: {fmt(l)}
            </span>
          ))}
          {resistanceLevels.slice(0, 1).map((l, i) => (
            <span key={`r${i}`} className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-red-500/10 text-red-500/70 border border-red-500/15">
              R1: {fmt(l)}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Blog card                                                           */
/* ------------------------------------------------------------------ */
function BlogCard({ post, lang }: { post: QuantBlogPost; lang: string }) {
  const isKo = lang === "ko";

  const priceFormatted =
    post.price >= 1000
      ? `$${post.price.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
      : `$${post.price.toFixed(4)}`;

  const postUrl = `/${lang}/quant/blog/${post.slug}`;

  return (
    <article className="group relative flex flex-col rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] transition-colors duration-300 overflow-hidden">
      {/* Annotated chart — links to post */}
      <Link href={postUrl} className="block relative overflow-hidden">
        <AnnotatedChart
          src={post.chartImage}
          alt={`${post.coin} 4H chart`}
          tradeSetup={post.tradeSetup}
          direction={post.direction}
          className="w-full"
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-transparent to-transparent pointer-events-none" />
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
      </Link>

      {/* Card body */}
      <div className="flex flex-col flex-1 p-5 gap-3">
        {/* Title — links to post */}
        <Link href={postUrl}>
          <h2 className="text-sm font-semibold text-zinc-100 leading-snug hover:text-blue-300 transition-colors">
            {isKo ? post.titleKo : post.title}
          </h2>
        </Link>

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

        {/* Trade Setup Panel */}
        <TradeSetupPanel
          setup={post.tradeSetup}
          direction={post.direction}
          supportLevels={post.supportLevels}
          resistanceLevels={post.resistanceLevels}
          isKo={isKo}
        />

        {/* Read Full Analysis button */}
        <Link
          href={postUrl}
          className="mt-auto pt-2 inline-flex items-center gap-1.5 text-[12px] font-mono font-semibold text-blue-400 hover:text-blue-300 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50"
        >
          {isKo ? "전체 분석 보기" : "Read Full Analysis"}
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </article>
  );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                      */
/* ------------------------------------------------------------------ */
export default function QuantBlog({ lang, limit }: { lang: string; limit?: number }) {
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
    <section ref={sectionRef} className={limit ? "" : "max-w-7xl mx-auto px-6 pt-16 pb-24 sm:pb-32"}>
      {/* Section header — hidden when used as preview */}
      <div className={`blog-header flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10 ${limit ? "hidden" : ""}`}>
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
        {(limit ? QUANT_BLOG_POSTS.slice(0, limit) : QUANT_BLOG_POSTS).map((post) => (
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
