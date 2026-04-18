"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import type { MarketSignals, SignalItem } from "@/lib/services/signals/signals.service";
import type { HLWhaleTrade } from "@/lib/services/whales/hyperliquid.service";
import type { CryptoNewsItem } from "@/lib/services/news/crypto-news.service";

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */

interface UserInfo {
  name: string | null;
  email: string;
  role: string;
  credits: number;
  isPremium: boolean;
}

interface PortfolioStats {
  totalValue: number;
  totalCost: number;
  holdingCount: number;
  change24h: number;
}

interface PaybackAccount {
  exchangeName: string;
  exchangeImage: string | null;
  totalEarned: number;
  unpaid: number;
  tradeCount: number;
}

interface RecentAnalysis {
  id: string;
  pair: string | null;
  trend: string;
  confidence: number;
  createdAt: string;
}

interface PolymarketMarket {
  id: string;
  question: string;
  outcomePrices: string[];
  outcomes: string[];
  volume: number;
  oneDayPriceChange: number;
}

interface PolymarketEvent {
  id: string;
  title: string;
  slug: string;
  image: string;
  volume: number;
  markets: PolymarketMarket[];
}

interface Props {
  lang: string;
  user: UserInfo;
  signals: MarketSignals;
  portfolio: PortfolioStats;
  paybackAccounts: PaybackAccount[];
  whalesTrades: HLWhaleTrade[];
  recentAnalyses: RecentAnalysis[];
  news: CryptoNewsItem[];
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                             */
/* ------------------------------------------------------------------ */

function formatUSD(v: number) {
  return `$${Math.abs(v).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatCompact(v: number) {
  if (v >= 1e6) return `$${(v / 1e6).toFixed(1)}M`;
  if (v >= 1e3) return `$${(v / 1e3).toFixed(1)}K`;
  return `$${v.toFixed(0)}`;
}

function decodeHTML(s: string) {
  return s.replace(/&#8217;/g, "'").replace(/&#8216;/g, "'").replace(/&#8220;/g, "\u201C").replace(/&#8221;/g, "\u201D").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#039;/g, "'");
}

function timeAgo(ts: string | number) {
  const ms = typeof ts === "string" ? Date.now() - new Date(ts).getTime() : Date.now() - ts;
  const m = Math.floor(ms / 60000);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

function fearGreedColor(v: number) {
  if (v <= 25) return "text-red-400";
  if (v <= 45) return "text-orange-400";
  if (v <= 55) return "text-yellow-400";
  if (v <= 75) return "text-lime-400";
  return "text-emerald-400";
}

function fearGreedBg(v: number) {
  if (v <= 25) return "bg-red-500";
  if (v <= 45) return "bg-orange-500";
  if (v <= 55) return "bg-yellow-500";
  if (v <= 75) return "bg-lime-500";
  return "bg-emerald-500";
}

/* ------------------------------------------------------------------ */
/*  Constants                                                           */
/* ------------------------------------------------------------------ */

const COIN_ICONS: Record<string, { emoji: string; gradient: string }> = {
  BTC: { emoji: "₿", gradient: "from-orange-500 to-amber-500" },
  ETH: { emoji: "Ξ", gradient: "from-blue-400 to-indigo-500" },
  SOL: { emoji: "◎", gradient: "from-purple-500 to-fuchsia-500" },
  XRP: { emoji: "✕", gradient: "from-zinc-300 to-zinc-500" },
  BNB: { emoji: "B", gradient: "from-yellow-500 to-amber-500" },
  DOGE: { emoji: "D", gradient: "from-amber-400 to-yellow-500" },
  ADA: { emoji: "A", gradient: "from-blue-500 to-cyan-500" },
  AVAX: { emoji: "A", gradient: "from-red-500 to-rose-500" },
  DOT: { emoji: "D", gradient: "from-pink-500 to-rose-500" },
  LINK: { emoji: "L", gradient: "from-blue-400 to-blue-600" },
};

/* ------------------------------------------------------------------ */
/*  Sparkline                                                           */
/* ------------------------------------------------------------------ */

function Sparkline({ data, className }: { data?: number[]; className?: string }) {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data), max = Math.max(...data), range = max - min || 1;
  const w = 56, h = 18;
  const points = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`).join(" ");
  const color = data[data.length - 1] >= data[0] ? "#00C805" : "#FF5000";
  return (
    <svg width={w} height={h} className={className}>
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Signal badge                                                        */
/* ------------------------------------------------------------------ */

function SignalBadge({ signal }: { signal: SignalItem["signal"] }) {
  const map: Record<string, string> = {
    "Strong Buy": "bg-emerald-500/20 text-emerald-400 border-emerald-500/40",
    "Buy": "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    "Neutral": "bg-zinc-500/15 text-zinc-400 border-zinc-500/30",
    "Sell": "bg-red-500/15 text-red-400 border-red-500/30",
    "Strong Sell": "bg-red-500/20 text-red-400 border-red-500/40",
  };
  return (
    <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border ${map[signal] ?? map["Neutral"]}`}>
      {signal}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Section header                                                      */
/* ------------------------------------------------------------------ */

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-2 select-none">
      {children}
    </p>
  );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                      */
/* ------------------------------------------------------------------ */

export default function UnifiedDashboard({
  lang,
  user,
  signals,
  portfolio,
  paybackAccounts,
  whalesTrades,
  recentAnalyses,
  news,
}: Props) {
  /* ---- Polymarket client-side fetch ---- */
  const [polyEvents, setPolyEvents] = useState<PolymarketEvent[]>([]);

  useEffect(() => {
    fetch("/api/polymarket")
      .then((r) => r.json())
      .then((d) => setPolyEvents((d.markets ?? []).slice(0, 4)))
      .catch(() => {});
  }, []);

  const isGuest = !user.email;

  /* ---- Derived values ---- */
  const pnl = portfolio.totalValue - portfolio.totalCost;
  const pnlPct = portfolio.totalCost > 0 ? (pnl / portfolio.totalCost) * 100 : 0;
  const totalPayback = paybackAccounts.reduce((s, a) => s + a.totalEarned, 0);
  const totalUnpaid = paybackAccounts.reduce((s, a) => s + a.unpaid, 0);

  const topSignals = [...signals.signals].sort((a, b) => b.confidence - a.confidence).slice(0, 3);
  const buyCount = signals.signals.filter((s) => s.signal === "Buy" || s.signal === "Strong Buy").length;
  const sellCount = signals.signals.filter((s) => s.signal === "Sell" || s.signal === "Strong Sell").length;
  const neutralCount = signals.signals.filter((s) => s.signal === "Neutral").length;

  const btcSignal = signals.signals.find((s) => s.symbol === "BTC") ?? signals.signals[0];

  return (
    <div className="bg-black text-zinc-100 min-h-screen flex flex-col" style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}>

      {/* ── Top bar: BTC price header ── */}
      <div className="bg-zinc-900 border-b border-zinc-800 px-4 py-1.5 flex items-center gap-4 select-none shrink-0 overflow-x-auto">
        {btcSignal && (
          <>
            <span className="font-mono font-bold text-zinc-100 text-sm tabular-nums">
              BTC/USDT
            </span>
            <span className="font-mono font-bold text-zinc-100 tabular-nums">
              {formatUSD(btcSignal.price)}
            </span>
            <span className={`font-mono text-sm tabular-nums font-semibold ${btcSignal.change24h >= 0 ? "text-[#00C805]" : "text-[#FF5000]"}`}>
              {btcSignal.change24h >= 0 ? "▲" : "▼"} {btcSignal.change24h >= 0 ? "+" : ""}{btcSignal.change24h.toFixed(2)}%
            </span>
          </>
        )}
        <span className="text-zinc-700 hidden sm:inline">|</span>
        <span className={`text-sm font-mono tabular-nums ${fearGreedColor(signals.fearGreed.value)}`}>
          Fear &amp; Greed: <span className="font-bold">{signals.fearGreed.value}</span>{" "}
          <span className="text-zinc-500 text-xs">{signals.fearGreed.classification}</span>
        </span>
        <span className="text-zinc-700 hidden sm:inline">|</span>
        <span className="text-xs font-mono tabular-nums">
          <span className="text-[#00C805] font-semibold">{buyCount} Buy</span>
          <span className="text-zinc-600"> / </span>
          <span className="text-zinc-400 font-semibold">{neutralCount} Neutral</span>
          <span className="text-zinc-600"> / </span>
          <span className="text-[#FF5000] font-semibold">{sellCount} Sell</span>
        </span>
        {signals.marketSummary && (
          <>
            <span className="text-zinc-700 hidden lg:inline">|</span>
            <span className={`text-xs font-semibold hidden lg:block truncate max-w-xs ${
              signals.marketSummary.startsWith("[LONG]") ? "text-[#00C805]" :
              signals.marketSummary.startsWith("[SHORT]") ? "text-[#FF5000]" : "text-zinc-400"
            }`}>
              {signals.marketSummary.startsWith("[LONG]")
                ? (lang === "ko" ? "롱 포지션 우세" : "Long Dominant")
                : signals.marketSummary.startsWith("[SHORT]")
                ? (lang === "ko" ? "숏 포지션 우세" : "Short Dominant")
                : (lang === "ko" ? "횡보" : "Neutral")}
            </span>
          </>
        )}
      </div>

      {/* ── Main 3-column layout ── */}
      <div className="flex flex-1 overflow-hidden lg:h-[calc(100dvh-120px)]">

        {/* ══════════ LEFT PANEL ══════════ */}
        <div className="hidden xl:flex flex-col w-[260px] shrink-0 border-r border-zinc-800 overflow-y-auto">

          {/* Account Overview */}
          <div className="p-3 border-b border-zinc-800">
            <SectionHeader>Account</SectionHeader>
            {isGuest ? (
              <div className="py-2">
                <p className="text-xs text-zinc-500 mb-3">
                  {lang === "ko" ? "로그인하여 포트폴리오를 확인하세요" : "Sign in to view your portfolio"}
                </p>
                <div className="flex gap-2">
                  <Link
                    href={`/${lang}/login`}
                    className="flex-1 py-1.5 text-center rounded bg-[#00C805] text-black text-xs font-bold hover:brightness-110 transition-all"
                  >
                    {lang === "ko" ? "로그인" : "Log In"}
                  </Link>
                  <Link
                    href={`/${lang}/signup`}
                    className="flex-1 py-1.5 text-center rounded border border-zinc-700 text-zinc-300 text-xs font-semibold hover:border-zinc-500 transition-all"
                  >
                    {lang === "ko" ? "가입" : "Sign Up"}
                  </Link>
                </div>
              </div>
            ) : (
              <>
                <p className="text-2xl font-bold tabular-nums text-zinc-100 font-mono">
                  {portfolio.totalValue > 0 ? formatUSD(portfolio.totalValue) : "—"}
                </p>
                {portfolio.totalCost > 0 && (
                  <p className={`text-sm font-mono tabular-nums mt-0.5 ${pnl >= 0 ? "text-[#00C805]" : "text-[#FF5000]"}`}>
                    {pnl >= 0 ? "▲" : "▼"} {pnl >= 0 ? "+" : "-"}{formatUSD(pnl)}{" "}
                    <span className="text-xs">({pnl >= 0 ? "+" : ""}{pnlPct.toFixed(2)}%)</span>
                  </p>
                )}
                {portfolio.totalValue === 0 && paybackAccounts.length === 0 && (
                  <Link
                    href={`/${lang}/me/refund-withdraw`}
                    className="mt-2 flex items-center justify-between px-2.5 py-1.5 rounded bg-amber-500/10 border border-amber-500/25 hover:bg-amber-500/15 transition-colors"
                  >
                    <span className="text-[11px] font-semibold text-amber-300">
                      {lang === "ko" ? "💎 거래소 UID 연동" : "💎 Connect Exchange UID"}
                    </span>
                    <span className="text-[11px] text-amber-400">→</span>
                  </Link>
                )}
                <div className="mt-3 space-y-1">
                  <SectionHeader>Overview</SectionHeader>
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-500">Payback earned</span>
                    <span className="font-mono tabular-nums text-amber-400">{totalPayback > 0 ? formatUSD(totalPayback) : "—"}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-500">Unpaid</span>
                    <span className={`font-mono tabular-nums ${totalUnpaid > 0 ? "text-red-400" : "text-zinc-500"}`}>
                      {totalUnpaid > 0 ? formatUSD(totalUnpaid) : "—"}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-500">Credits</span>
                    <span className="font-mono tabular-nums text-zinc-300">{user.credits.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-500">Holdings</span>
                    <span className="font-mono tabular-nums text-zinc-300">{portfolio.holdingCount}</span>
                  </div>
                  {portfolio.change24h !== 0 && portfolio.totalValue > 0 && (
                    <div className="flex justify-between text-xs">
                      <span className="text-zinc-500">24h change</span>
                      <span className={`font-mono tabular-nums ${portfolio.change24h >= 0 ? "text-[#00C805]" : "text-[#FF5000]"}`}>
                        {portfolio.change24h >= 0 ? "+" : "-"}{formatUSD(portfolio.change24h)}
                      </span>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Fear & Greed */}
          <div className="p-3 border-b border-zinc-800">
            <SectionHeader>Fear &amp; Greed</SectionHeader>
            <div className="flex items-center gap-3">
              <span className={`text-3xl font-black tabular-nums font-mono leading-none ${fearGreedColor(signals.fearGreed.value)}`}>
                {signals.fearGreed.value}
              </span>
              <div className="flex-1">
                <p className={`text-xs font-semibold ${fearGreedColor(signals.fearGreed.value)}`}>
                  {signals.fearGreed.classification}
                </p>
                <div className="mt-1 h-1 rounded-none bg-zinc-800 overflow-hidden">
                  <div
                    className={`h-full ${fearGreedBg(signals.fearGreed.value)} transition-all`}
                    style={{ width: `${signals.fearGreed.value}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* AI Top 3 Signals */}
          <div className="p-3 border-b border-zinc-800">
            <div className="flex items-center justify-between mb-2">
              <SectionHeader>Top Signals</SectionHeader>
              <Link href={`/${lang}/quant`} className="text-[10px] text-zinc-500 hover:text-zinc-300 transition-colors">
                {lang === "ko" ? "전체 →" : "All →"}
              </Link>
            </div>
            <div className="space-y-1.5">
              {topSignals.map((sig) => {
                const icon = COIN_ICONS[sig.symbol];
                const isLong = sig.direction === "LONG";
                const isShort = sig.direction === "SHORT";
                return (
                  <div key={sig.symbol} className="flex items-center gap-2 py-1">
                    <span className={`text-xs font-bold w-5 text-center ${icon ? "" : "text-zinc-400"}`}>
                      {icon?.emoji ?? sig.symbol[0]}
                    </span>
                    <span className="text-xs font-semibold text-zinc-200 w-8">{sig.symbol}</span>
                    <span className={`text-[10px] font-bold px-1 py-0.5 rounded ${isLong ? "text-[#00C805]" : isShort ? "text-[#FF5000]" : "text-zinc-500"}`}>
                      {isLong ? "▲ LONG" : isShort ? "▼ SHORT" : "◆ NEUT"}
                    </span>
                    <span className="text-[10px] text-zinc-500 flex-1">{sig.signal}</span>
                    <span className="text-[10px] font-mono tabular-nums text-zinc-400">{sig.confidence}%</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* News Headlines */}
          <div className="p-3 border-b border-zinc-800 flex-1">
            <SectionHeader>Latest News</SectionHeader>
            <div className="space-y-2">
              {news.slice(0, 5).map((item, i) => (
                <a
                  key={i}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-1.5 group cursor-pointer"
                >
                  <span className="text-zinc-600 text-xs mt-0.5 shrink-0">•</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] text-zinc-300 group-hover:text-zinc-100 leading-snug line-clamp-2 transition-colors">
                      {decodeHTML(item.title)}
                    </p>
                    <span className="text-[10px] text-zinc-600">{timeAgo(item.publishedAt.toString())}</span>
                  </div>
                </a>
              ))}
              {news.length === 0 && (
                <p className="text-xs text-zinc-600">{lang === "ko" ? "로딩 중..." : "Loading..."}</p>
              )}
            </div>
          </div>

          {/* Guest CTA (bottom) */}
          {isGuest && (
            <div className="p-3 border-t border-zinc-800 bg-zinc-900/50">
              <p className="text-[11px] text-zinc-500 mb-2 leading-relaxed">
                {lang === "ko"
                  ? "AI 시그널, 고래 추적, 페이백 — 한 곳에서"
                  : "AI signals, whale tracking, payback — all in one place"}
              </p>
              <div className="flex gap-1.5">
                <Link
                  href={`/${lang}/login`}
                  className="flex-1 py-1.5 text-center rounded bg-[#00C805] text-black text-xs font-bold hover:brightness-110 transition-all"
                >
                  {lang === "ko" ? "로그인" : "Log In"}
                </Link>
                <Link
                  href={`/${lang}/signup`}
                  className="flex-1 py-1.5 text-center rounded border border-zinc-700 text-zinc-300 text-xs font-semibold hover:border-zinc-500 transition-all"
                >
                  {lang === "ko" ? "회원가입" : "Sign Up"}
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* ══════════ CENTER PANEL (flex-1) ══════════ */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">

          {/* Signals Table */}
          <div className="flex-1 p-0 overflow-hidden flex flex-col">
            <div className="px-4 pt-3 pb-2 border-b border-zinc-800 flex items-center justify-between">
              <SectionHeader>{lang === "ko" ? "시장 신호" : "Market Signals"}</SectionHeader>
              <Link href={`/${lang}/quant`} className="lg:hidden text-[10px] text-zinc-500 hover:text-zinc-300 transition-colors">
                {lang === "ko" ? "전체 →" : "All →"}
              </Link>
            </div>

            {/* Mobile: vertical card list */}
            <div className="lg:hidden flex-1 overflow-y-auto divide-y divide-zinc-800/60">
              {signals.signals.slice(0, 10).map((sig) => {
                const icon = COIN_ICONS[sig.symbol];
                const isLong = sig.direction === "LONG";
                const isShort = sig.direction === "SHORT";
                return (
                  <div key={sig.symbol} className="px-4 py-3 flex items-center gap-3 hover:bg-zinc-900/40 transition-colors">
                    <span className="shrink-0 text-base w-6 text-center">{icon?.emoji ?? sig.symbol[0]}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-bold text-zinc-100">{sig.symbol}</span>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            isLong
                              ? "bg-[#00C805]/15 text-[#00C805]"
                              : isShort
                              ? "bg-[#FF5000]/15 text-[#FF5000]"
                              : "bg-zinc-700/30 text-zinc-500"
                          }`}
                        >
                          {isLong ? "▲ LONG" : isShort ? "▼ SHORT" : "◆ NEUT"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[11px] font-mono text-zinc-400 tabular-nums">{formatUSD(sig.price)}</span>
                        <span
                          className={`text-[11px] font-mono tabular-nums ${
                            sig.change24h >= 0 ? "text-[#00C805]" : "text-[#FF5000]"
                          }`}
                        >
                          {sig.change24h >= 0 ? "+" : ""}
                          {sig.change24h.toFixed(2)}%
                        </span>
                      </div>
                    </div>
                    <div className="shrink-0 text-right min-w-[70px]">
                      <SignalBadge signal={sig.signal} />
                      <div className="mt-1 flex items-center justify-end gap-1">
                        <div className="w-8 h-0.5 bg-zinc-800 overflow-hidden">
                          <div
                            className={`h-full ${
                              sig.confidence >= 70
                                ? "bg-[#00C805]"
                                : sig.confidence >= 40
                                ? "bg-yellow-500"
                                : "bg-[#FF5000]"
                            }`}
                            style={{ width: `${sig.confidence}%` }}
                          />
                        </div>
                        <span className="text-[9px] text-zinc-500 tabular-nums">{sig.confidence}%</span>
                      </div>
                    </div>
                  </div>
                );
              })}
              {signals.signals.length === 0 && (
                <div className="py-8 text-center text-zinc-600 text-xs">
                  {lang === "ko" ? "신호 데이터를 불러오는 중..." : "Loading signal data..."}
                </div>
              )}
            </div>

            {/* Desktop: table */}
            <div className="hidden lg:block flex-1 overflow-y-auto overflow-x-auto">
              <table className="w-full text-xs min-w-[600px]" style={{ fontVariantNumeric: "tabular-nums" }}>
                <thead className="sticky top-0 bg-black z-10">
                  <tr className="border-b border-zinc-800 text-zinc-500">
                    <th className="text-left px-4 py-2 font-semibold text-[10px] uppercase tracking-wider">
                      {lang === "ko" ? "코인" : "Coin"}
                    </th>
                    <th className="text-right px-3 py-2 font-semibold text-[10px] uppercase tracking-wider">
                      {lang === "ko" ? "가격" : "Price"}
                    </th>
                    <th className="text-right px-3 py-2 font-semibold text-[10px] uppercase tracking-wider">24h</th>
                    <th className="text-center px-3 py-2 font-semibold text-[10px] uppercase tracking-wider">
                      {lang === "ko" ? "신호" : "Signal"}
                    </th>
                    <th className="text-left px-3 py-2 font-semibold text-[10px] uppercase tracking-wider">
                      {lang === "ko" ? "신뢰도" : "Conf."}
                    </th>
                    <th className="text-right px-3 py-2 font-semibold text-[10px] uppercase tracking-wider">
                      {lang === "ko" ? "방향" : "Dir."}
                    </th>
                    <th className="px-4 py-2 w-16" />
                  </tr>
                </thead>
                <tbody>
                  {signals.signals.slice(0, 10).map((sig, idx) => {
                    const icon = COIN_ICONS[sig.symbol];
                    return (
                      <tr
                        key={sig.symbol}
                        className="border-b border-zinc-800 hover:bg-zinc-900/60 transition-colors"
                      >
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-2">
                            <span className="text-sm w-5 text-center select-none">{icon?.emoji ?? sig.symbol[0]}</span>
                            <div>
                              <p className="font-semibold text-zinc-100 text-xs">{sig.symbol}</p>
                              <p className="text-[10px] text-zinc-600">{sig.coin}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono text-zinc-200 text-xs tabular-nums">
                          {formatUSD(sig.price)}
                        </td>
                        <td className={`px-3 py-2.5 text-right font-mono text-xs tabular-nums ${sig.change24h >= 0 ? "text-[#00C805]" : "text-[#FF5000]"}`}>
                          {sig.change24h >= 0 ? "+" : ""}{sig.change24h.toFixed(2)}%
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          <SignalBadge signal={sig.signal} />
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-1.5">
                            <div className="w-12 h-1 bg-zinc-800 overflow-hidden rounded-none">
                              <div
                                className={`h-full ${sig.confidence >= 70 ? "bg-[#00C805]" : sig.confidence >= 40 ? "bg-yellow-500" : "bg-[#FF5000]"}`}
                                style={{ width: `${sig.confidence}%` }}
                              />
                            </div>
                            <span className="text-[10px] text-zinc-500 tabular-nums w-6">{sig.confidence}%</span>
                          </div>
                        </td>
                        <td className="px-3 py-2.5 text-right">
                          <span className={`text-[10px] font-bold font-mono ${
                            sig.direction === "LONG" ? "text-[#00C805]" :
                            sig.direction === "SHORT" ? "text-[#FF5000]" : "text-zinc-500"
                          }`}>
                            {sig.direction === "LONG" ? "▲ " : sig.direction === "SHORT" ? "▼ " : ""}
                            {sig.direction}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 w-16">
                          <Sparkline data={sig.sparkline} />
                        </td>
                      </tr>
                    );
                  })}
                  {signals.signals.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-zinc-600 text-xs">
                        {lang === "ko" ? "신호 데이터를 불러오는 중..." : "Loading signal data..."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── Center Widgets (below signals) ── */}
          <div className="hidden xl:grid grid-cols-3 gap-0 border-t border-zinc-800">
            {/* Payback Widget */}
            <div className="p-4 border-r border-zinc-800">
              <SectionHeader>{lang === "ko" ? "페이백" : "Payback"}</SectionHeader>
              {paybackAccounts.length > 0 ? (
                <div className="mt-2 space-y-1.5">
                  {paybackAccounts.slice(0, 3).map((acc, i) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <span className="text-zinc-400 truncate">{acc.exchangeName}</span>
                      <span className="text-amber-400 font-mono tabular-nums">{formatCompact(acc.totalEarned)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between text-xs pt-1 border-t border-zinc-800">
                    <span className="text-zinc-500 font-semibold">Total</span>
                    <span className="text-amber-400 font-mono font-semibold tabular-nums">{formatCompact(totalPayback)}</span>
                  </div>
                </div>
              ) : (
                <div className="mt-2">
                  <p className="text-[11px] text-zinc-500 mb-2">
                    {lang === "ko" ? "선물 거래 수수료를 환급받으세요" : "Get futures fee rebates"}
                  </p>
                  <Link href={`/${lang}/payback`} className="text-[10px] text-amber-400 hover:text-amber-300">
                    {lang === "ko" ? "거래소 연결 →" : "Link Exchange →"}
                  </Link>
                </div>
              )}
            </div>

            {/* AI Chart Analysis Widget */}
            <div className="p-4 border-r border-zinc-800">
              <SectionHeader>{lang === "ko" ? "AI 차트 분석" : "AI Chart Analysis"}</SectionHeader>
              {recentAnalyses.length > 0 ? (
                <div className="mt-2 space-y-1.5">
                  {recentAnalyses.slice(0, 3).map((a) => (
                    <div key={a.id} className="flex items-center justify-between text-xs">
                      <span className="text-zinc-300 font-mono">{a.pair ?? "—"}</span>
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[10px] font-bold ${
                          a.trend?.toLowerCase().includes("bull") ? "text-[#00C805]" :
                          a.trend?.toLowerCase().includes("bear") ? "text-[#FF5000]" : "text-zinc-500"
                        }`}>{a.trend}</span>
                        <span className="text-zinc-600 text-[10px]">{a.confidence}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-2">
                  <p className="text-[11px] text-zinc-500 mb-2">
                    {lang === "ko" ? "차트를 업로드하고 AI 분석" : "Upload chart for AI analysis"}
                  </p>
                  <Link href={`/${lang}/chart-ideas/analyze`} className="text-[10px] text-blue-400 hover:text-blue-300">
                    {lang === "ko" ? "분석 시작 →" : "Start Analysis →"}
                  </Link>
                </div>
              )}
            </div>

            {/* Market Overview Widget */}
            <div className="p-4">
              <SectionHeader>{lang === "ko" ? "마켓 요약" : "Market Overview"}</SectionHeader>
              <div className="mt-2 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-500">BTC Dominance</span>
                  <span className="text-zinc-300 font-mono tabular-nums">
                    {btcSignal ? `${((btcSignal.price * 100) / signals.signals.reduce((s, c) => s + c.price, 1)).toFixed(0)}%` : "—"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-500">{lang === "ko" ? "매수 신호" : "Buy Signals"}</span>
                  <span className="text-[#00C805] font-mono tabular-nums">{buyCount}/10</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-500">{lang === "ko" ? "매도 신호" : "Sell Signals"}</span>
                  <span className="text-[#FF5000] font-mono tabular-nums">{sellCount}/10</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-500">{lang === "ko" ? "총 거래량" : "Total Volume"}</span>
                  <span className="text-zinc-300 font-mono tabular-nums">
                    {formatCompact(signals.signals.reduce((s, c) => s + c.volume24h, 0))}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile-only: stacked sections */}
          <div className="xl:hidden p-4 space-y-4">
            {/* Mobile Account */}
            <div className="border border-zinc-800 p-3">
              <SectionHeader>Account</SectionHeader>
              {isGuest ? (
                <div className="flex gap-2 mt-1">
                  <Link href={`/${lang}/login`} className="flex-1 py-2 text-center bg-[#00C805] text-black text-xs font-bold rounded">
                    {lang === "ko" ? "로그인" : "Log In"}
                  </Link>
                  <Link href={`/${lang}/signup`} className="flex-1 py-2 text-center border border-zinc-700 text-zinc-300 text-xs font-semibold rounded">
                    {lang === "ko" ? "회원가입" : "Sign Up"}
                  </Link>
                </div>
              ) : (
                <>
                  <p className="text-xl font-bold font-mono tabular-nums">{portfolio.totalValue > 0 ? formatUSD(portfolio.totalValue) : "—"}</p>
                  {portfolio.totalCost > 0 && (
                    <p className={`text-sm font-mono ${pnl >= 0 ? "text-[#00C805]" : "text-[#FF5000]"}`}>
                      {pnl >= 0 ? "▲ +" : "▼ -"}{formatUSD(pnl)} ({pnl >= 0 ? "+" : ""}{pnlPct.toFixed(2)}%)
                    </p>
                  )}
                  {portfolio.totalValue === 0 && paybackAccounts.length === 0 && (
                    <Link
                      href={`/${lang}/me/refund-withdraw`}
                      className="mt-3 flex items-center justify-between px-3 py-2 rounded bg-amber-500/10 border border-amber-500/25"
                    >
                      <span className="text-xs font-semibold text-amber-300">
                        {lang === "ko" ? "💎 거래소 UID 연동하고 페이백 받기" : "💎 Connect exchange UID to earn payback"}
                      </span>
                      <span className="text-xs text-amber-400">→</span>
                    </Link>
                  )}
                </>
              )}
            </div>

            {/* Mobile Payback */}
            {!isGuest && paybackAccounts.length > 0 && (
              <div className="border border-zinc-800 p-3">
                <SectionHeader>{lang === "ko" ? "페이백" : "Payback"}</SectionHeader>
                <div className="flex items-center justify-between mt-1">
                  <div>
                    <p className="text-xs text-zinc-500">{lang === "ko" ? "총 수익" : "Total Earned"}</p>
                    <p className="text-lg font-bold font-mono tabular-nums text-emerald-400">{formatUSD(totalPayback)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-zinc-500">{lang === "ko" ? "미지급" : "Unpaid"}</p>
                    <p className="text-sm font-mono tabular-nums text-amber-400">{formatUSD(totalUnpaid)}</p>
                  </div>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-[10px] text-zinc-600">{paybackAccounts.length} {lang === "ko" ? "거래소 연결됨" : "exchanges linked"}</span>
                  <Link href={`/${lang}/me/refund-withdraw`} className="text-[10px] text-blue-400 hover:text-blue-300">
                    {lang === "ko" ? "상세 보기 →" : "View Details →"}
                  </Link>
                </div>
              </div>
            )}

            {/* Mobile Fear & Greed */}
            <div className="border border-zinc-800 p-3">
              <SectionHeader>Fear &amp; Greed</SectionHeader>
              <div className="flex items-center gap-3">
                <span className={`text-3xl font-black font-mono ${fearGreedColor(signals.fearGreed.value)}`}>{signals.fearGreed.value}</span>
                <div className="flex-1">
                  <p className={`text-xs font-semibold ${fearGreedColor(signals.fearGreed.value)}`}>{signals.fearGreed.classification}</p>
                  <div className="mt-1 h-1 bg-zinc-800">
                    <div className={`h-full ${fearGreedBg(signals.fearGreed.value)}`} style={{ width: `${signals.fearGreed.value}%` }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile News */}
            <div className="border border-zinc-800 p-3">
              <SectionHeader>Latest News</SectionHeader>
              <div className="space-y-2">
                {news.slice(0, 5).map((item, i) => (
                  <a key={i} href={item.url} target="_blank" rel="noopener noreferrer" className="flex gap-1.5 group">
                    <span className="text-zinc-600 text-xs shrink-0 mt-0.5">•</span>
                    <div>
                      <p className="text-[11px] text-zinc-300 group-hover:text-zinc-100 line-clamp-2 leading-snug">{decodeHTML(item.title)}</p>
                      <span className="text-[10px] text-zinc-600">{timeAgo(item.publishedAt.toString())}</span>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ══════════ RIGHT PANEL (320px) ══════════ */}
        <div className="hidden xl:flex flex-col w-[280px] shrink-0 border-l border-zinc-800 overflow-y-auto">

          {/* Online Users Badge */}
          <div className="px-3 py-2 border-b border-zinc-800 flex items-center justify-between">
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">{lang === "ko" ? "실시간" : "Live"}</span>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00C805] animate-pulse" />
              <span className="text-[11px] text-[#00C805] font-mono font-bold tabular-nums">
                {78 + Math.floor(Math.random() * 25)} {lang === "ko" ? "명 접속 중" : "online"}
              </span>
            </div>
          </div>

          {/* Whale Trades */}
          <div className="p-3 border-b border-zinc-800 flex-shrink-0">
            <div className="flex items-center justify-between mb-2">
              <SectionHeader>Whale Trades</SectionHeader>
              <Link href={`/${lang}/whales`} className="text-[10px] text-zinc-500 hover:text-zinc-300 transition-colors">
                {lang === "ko" ? "전체 →" : "All →"}
              </Link>
            </div>
            <div className="space-y-0">
              {whalesTrades.slice(0, 8).map((t, i) => (
                <div key={i} className="flex items-center gap-2 py-1.5 border-b border-zinc-800/60 last:border-0">
                  <span className={`text-[10px] font-bold px-1 py-0.5 rounded shrink-0 ${
                    t.side === "BUY" ? "bg-[#00C805]/10 text-[#00C805]" : "bg-[#FF5000]/10 text-[#FF5000]"
                  }`}>
                    {t.side}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-semibold text-zinc-300 truncate">{t.whale}</p>
                    <p className="text-[10px] text-zinc-600 truncate">{t.coin}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[11px] font-mono tabular-nums text-zinc-300">{formatCompact(t.notional)}</p>
                    <p className="text-[10px] text-zinc-600">{timeAgo(t.time)}</p>
                  </div>
                </div>
              ))}
              {whalesTrades.length === 0 && (
                <p className="text-xs text-zinc-600 py-2 text-center">{lang === "ko" ? "데이터 없음" : "No recent trades"}</p>
              )}
            </div>
          </div>

          {/* Locked AI Chat */}
          <div className="p-3 border-b border-zinc-800 flex-shrink-0">
            <SectionHeader>AI Quant Assistant</SectionHeader>
            {/* Chat preview */}
            <div className="space-y-2 mb-3">
              <div className="flex gap-1.5">
                <div className="w-5 h-5 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center shrink-0 mt-0.5">
                  <svg className="w-2.5 h-2.5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                  </svg>
                </div>
                <div className="bg-zinc-900 border border-zinc-800 px-2 py-1.5 rounded max-w-[85%]">
                  <p className="text-[11px] text-zinc-300 leading-snug">
                    {lang === "ko"
                      ? "BTC RSI 58, MACD 양전환 중. 단기 상승..."
                      : "BTC RSI 58, MACD turning positive. Short-term..."}
                  </p>
                </div>
              </div>
              <div className="flex gap-1.5 justify-end">
                <div className="bg-blue-900/30 border border-blue-800/40 px-2 py-1.5 rounded max-w-[85%]">
                  <p className="text-[11px] text-blue-300">
                    {lang === "ko" ? "ETH 진입 시점은?" : "When to enter ETH?"}
                  </p>
                </div>
              </div>
              <div className="flex gap-1.5">
                <div className="w-5 h-5 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center shrink-0 mt-0.5">
                  <svg className="w-2.5 h-2.5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                  </svg>
                </div>
                <div className="bg-zinc-900 border border-zinc-800 px-2 py-1.5 rounded max-w-[85%] select-none">
                  <p className="text-[11px] text-zinc-400 blur-[3px] pointer-events-none">
                    ETH $2,135 support confirmed. Entry at $2,140 with SL $2,080. Target $2,280.
                  </p>
                </div>
              </div>
            </div>
            {/* Lock */}
            <div className="flex flex-col items-center gap-1.5 py-2 border-t border-zinc-800">
              <div className="flex items-center gap-1.5">
                <svg className="w-3 h-3 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                </svg>
                <span className="text-[10px] font-semibold text-amber-400 uppercase tracking-wider">Premium Only</span>
              </div>
              <Link
                href={`/${lang}/pricing`}
                className="px-4 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-semibold hover:bg-amber-500/20 transition-colors rounded"
              >
                {lang === "ko" ? "프리미엄 시작하기" : "Get Premium"}
              </Link>
            </div>
          </div>

          {/* Predictions (Polymarket) */}
          <div className="p-3 flex-1">
            <SectionHeader>Predictions</SectionHeader>
            {polyEvents.length > 0 ? (
              <div className="space-y-3">
                {polyEvents.slice(0, 4).map((event) => {
                  const market = event.markets?.[0];
                  const yesPrice = market?.outcomePrices?.[0] ? parseFloat(market.outcomePrices[0]) * 100 : null;
                  const noPrice = market?.outcomePrices?.[1] ? parseFloat(market.outcomePrices[1]) * 100 : null;
                  return (
                    <div key={event.id} className="space-y-1">
                      <div className="flex items-start gap-2">
                        {event.image && (
                          <img src={event.image} alt="" className="w-6 h-6 object-cover shrink-0 bg-zinc-800 rounded" />
                        )}
                        <p className="text-[11px] text-zinc-300 leading-snug line-clamp-2 flex-1">
                          {decodeHTML(event.title)}
                        </p>
                      </div>
                      {yesPrice !== null && noPrice !== null ? (
                        <div>
                          <div className="flex justify-between text-[10px] mb-0.5">
                            <span className="text-[#00C805] font-semibold">Yes {yesPrice.toFixed(0)}%</span>
                            <span className="text-[#FF5000] font-semibold">No {noPrice.toFixed(0)}%</span>
                          </div>
                          <div className="h-1 bg-zinc-800 overflow-hidden flex">
                            <div className="bg-[#00C805] h-full" style={{ width: `${yesPrice}%` }} />
                            <div className="bg-[#FF5000] h-full flex-1" />
                          </div>
                        </div>
                      ) : (
                        <p className="text-[10px] text-zinc-600">{lang === "ko" ? "가격 데이터 없음" : "No price data"}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2 py-4">
                <div className="w-3 h-3 rounded-full border border-t-transparent border-zinc-500 animate-spin" />
                <p className="text-[10px] text-zinc-600">{lang === "ko" ? "로딩 중..." : "Loading..."}</p>
              </div>
            )}

            {/* Recent Analyses (use remaining space) */}
            {recentAnalyses.length > 0 && (
              <div className="mt-4 pt-3 border-t border-zinc-800">
                <SectionHeader>Recent Analyses</SectionHeader>
                <div className="space-y-1.5">
                  {recentAnalyses.slice(0, 3).map((a) => (
                    <div key={a.id} className="flex items-center gap-2">
                      <span className="text-[10px] font-semibold text-zinc-300 w-10">{a.pair ?? "—"}</span>
                      <span className={`text-[10px] font-semibold ${a.trend === "LONG" || a.trend === "up" ? "text-[#00C805]" : a.trend === "SHORT" || a.trend === "down" ? "text-[#FF5000]" : "text-zinc-500"}`}>
                        {a.trend.toUpperCase()}
                      </span>
                      <span className="text-[10px] font-mono tabular-nums text-zinc-500 ml-auto">{a.confidence}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Payback summary if no accounts shown elsewhere */}
            {paybackAccounts.length > 0 && (
              <div className="mt-4 pt-3 border-t border-zinc-800">
                <div className="flex items-center justify-between mb-2">
                  <SectionHeader>Payback</SectionHeader>
                  <Link href={`/${lang}/payback`} className="text-[10px] text-zinc-500 hover:text-zinc-300 transition-colors">
                    {lang === "ko" ? "전체 →" : "All →"}
                  </Link>
                </div>
                <div className="space-y-1.5">
                  {paybackAccounts.slice(0, 2).map((acc, i) => (
                    <div key={i} className="flex items-center gap-2">
                      {acc.exchangeImage ? (
                        <img src={acc.exchangeImage} alt={acc.exchangeName} className="w-4 h-4 rounded-full object-cover bg-zinc-800" />
                      ) : (
                        <div className="w-4 h-4 rounded-full bg-zinc-800 flex items-center justify-center text-[8px] font-bold text-zinc-400">
                          {acc.exchangeName[0]}
                        </div>
                      )}
                      <span className="text-[11px] text-zinc-300 flex-1 truncate">{acc.exchangeName}</span>
                      <span className="text-[11px] font-mono tabular-nums text-amber-400">{formatCompact(acc.totalEarned)}</span>
                      {acc.unpaid > 0 && (
                        <span className="text-[10px] font-mono text-red-400">-{formatCompact(acc.unpaid)}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
