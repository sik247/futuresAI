"use client";

import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import Image from "next/image";
import TradingProfileModal from "./trading-profile-modal";

/** Lightweight markdown → HTML for chat responses */
function renderMarkdown(text: string): string {
  return text
    // Code blocks (```...```)
    .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre class="bg-white/[0.04] border border-white/[0.06] rounded-lg p-3 my-2 overflow-x-auto text-xs font-mono text-zinc-300"><code>$2</code></pre>')
    // Inline code
    .replace(/`([^`]+)`/g, '<code class="bg-white/[0.06] px-1 py-0.5 rounded text-blue-300 text-xs">$1</code>')
    // Headers
    .replace(/^### (.+)$/gm, '<h3 class="text-sm font-bold text-white mt-4 mb-2">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-base font-bold text-white mt-5 mb-2">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-lg font-bold text-white mt-5 mb-2">$1</h1>')
    // Bold
    .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-white">$1</strong>')
    // Italic
    .replace(/\*(.+?)\*/g, '<em class="text-zinc-300 italic">$1</em>')
    // Bullet lists
    .replace(/^\* (.+)$/gm, '<li class="flex gap-2 text-zinc-300 ml-1"><span class="text-zinc-500 shrink-0">•</span><span>$1</span></li>')
    .replace(/^- (.+)$/gm, '<li class="flex gap-2 text-zinc-300 ml-1"><span class="text-zinc-500 shrink-0">•</span><span>$1</span></li>')
    // Numbered lists
    .replace(/^(\d+)\. (.+)$/gm, '<li class="flex gap-2 text-zinc-300 ml-1"><span class="text-zinc-500 font-mono shrink-0">$1.</span><span>$2</span></li>')
    // Wrap consecutive <li> in <ul>
    .replace(/((?:<li[^>]*>.*<\/li>\s*)+)/g, '<ul class="space-y-1.5 my-2">$1</ul>')
    // Paragraphs (double newline)
    .replace(/\n\n/g, '</p><p class="my-2.5">')
    // Single newlines within paragraphs
    .replace(/\n/g, '<br/>');
}

const PERSONA_AVATARS: Record<string, string> = {
  crypto: "/images/personas/quant-citadel.svg",
};
const PERSONA_NAMES: Record<string, Record<string, string>> = {
  crypto: { en: "FuturesAI Quant", ko: "FuturesAI 퀀트" },
};

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */
type Persona = "crypto";

interface TickerInfo {
  symbol: string;
  exchange: string;
}

interface NewsArticle {
  title: string;
  url: string;
  source: string;
}

interface TweetItem {
  author: string;
  text: string;
  url: string;
}

interface InternalLink {
  label: string;
  path: string;
  type: string;
}

interface DataSources {
  binance?: boolean;
  upbit?: boolean;
  technicals?: boolean;
  fearGreed?: boolean;
  news?: boolean;
  twitter?: boolean;
  polymarket?: boolean;
  webSearch?: boolean;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  ticker?: TickerInfo;
  timestamp?: number;
  news?: NewsArticle[];
  tweets?: TweetItem[];
  followUps?: string[];
  internalLinks?: InternalLink[];
  mentionedCoins?: string[];
  dataSources?: DataSources;
}

interface Props {
  lang: string;
  userName: string;
}

/* -------------------------------------------------------------------------- */
/*  SVG Icons                                                                  */
/* -------------------------------------------------------------------------- */
function SendIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
    </svg>
  );
}

function ChartBarIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M18.375 2.25c-1.035 0-1.875.84-1.875 1.875v15.75c0 1.035.84 1.875 1.875 1.875h.75c1.035 0 1.875-.84 1.875-1.875V4.125c0-1.036-.84-1.875-1.875-1.875h-.75zM9.75 8.625c0-1.036.84-1.875 1.875-1.875h.75c1.036 0 1.875.84 1.875 1.875v11.25c0 1.035-.84 1.875-1.875 1.875h-.75a1.875 1.875 0 01-1.875-1.875V8.625zM3 13.125c0-1.036.84-1.875 1.875-1.875h.75c1.036 0 1.875.84 1.875 1.875v6.75c0 1.035-.84 1.875-1.875 1.875h-.75A1.875 1.875 0 013 19.875v-6.75z" />
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/*  TradingView Chart Widget — with live price header + timeframe toggle       */
/* -------------------------------------------------------------------------- */
const TV_INTERVALS = [
  { key: "15", label: "15m" },
  { key: "60", label: "1h" },
  { key: "240", label: "4h" },
  { key: "D", label: "1D" },
  { key: "W", label: "1W" },
];

function TradingViewChart({ ticker }: { ticker: TickerInfo }) {
  const { symbol, exchange } = ticker;
  const [interval, setInterval] = useState("240"); // default 4H — matches quant analysis
  const [livePrice, setLivePrice] = useState<{ price: number; change: number } | null>(null);

  // Live price from Binance — refresh every 5s
  useEffect(() => {
    if (!symbol.endsWith("USDT")) return;
    async function fetchPrice() {
      try {
        const res = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}`);
        if (!res.ok) return;
        const data = await res.json();
        setLivePrice({
          price: parseFloat(data.lastPrice),
          change: parseFloat(data.priceChangePercent),
        });
      } catch {}
    }
    fetchPrice();
    const id = window.setInterval(fetchPrice, 5_000);
    return () => window.clearInterval(id);
  }, [symbol]);

  const src = `https://s.tradingview.com/widgetembed/?frameElementId=tv_chart&symbol=${exchange}:${symbol}&interval=${interval}&hidesidetoolbar=1&symboledit=1&saveimage=0&toolbarbg=0a0a0f&studies=%5B%22RSI%40tv-basicstudies%22%5D&theme=dark&style=1&timezone=exchange&withdateranges=1&showpopupbutton=0&locale=en&width=100%25&height=420`;

  const coinOnly = symbol.replace("USDT", "");

  return (
    <div className="mt-2 w-full rounded-lg overflow-hidden border border-white/[0.08] bg-zinc-900/60">
      {/* Header with live price + timeframe toggles */}
      <div className="flex items-center flex-wrap gap-2 px-3 py-2 border-b border-white/[0.06]">
        <ChartBarIcon className="w-3.5 h-3.5 text-blue-400 shrink-0" />
        <span className="text-xs font-mono text-white font-bold">
          {coinOnly}/USDT
        </span>

        {livePrice && (
          <>
            <span className="text-xs font-mono text-zinc-200 tabular-nums">
              ${livePrice.price.toLocaleString(undefined, { maximumFractionDigits: livePrice.price > 100 ? 0 : livePrice.price > 1 ? 2 : 4 })}
            </span>
            <span className={`text-[11px] font-mono font-semibold tabular-nums ${livePrice.change >= 0 ? "text-emerald-400" : "text-red-400"}`}>
              {livePrice.change >= 0 ? "+" : ""}{livePrice.change.toFixed(2)}%
            </span>
            <span className="flex items-center gap-1">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
              </span>
              <span className="text-[8px] font-mono text-emerald-400 uppercase tracking-[0.12em]">Live</span>
            </span>
          </>
        )}

        {/* Timeframe toggles */}
        <div className="ml-auto flex items-center gap-0.5">
          {TV_INTERVALS.map((tf) => (
            <button
              key={tf.key}
              onClick={() => setInterval(tf.key)}
              className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold transition-colors ${
                interval === tf.key
                  ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                  : "text-zinc-500 hover:text-zinc-300 border border-transparent"
              }`}
            >
              {tf.label}
            </button>
          ))}
        </div>
      </div>
      <iframe
        key={`${symbol}-${interval}`}
        src={src}
        className="w-full"
        style={{ height: 420 }}
        frameBorder="0"
        allowFullScreen
        title={`${exchange}:${symbol} Chart`}
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Loading Dots                                                               */
/* -------------------------------------------------------------------------- */
function ThinkingSteps({ step, ko }: { step: string; ko?: boolean }) {
  const allSteps = ko
    ? ["바이낸스 가격 데이터 수집 중", "업비트 + 김치 프리미엄 확인 중", "RSI, MA 기술적 분석 중", "뉴스 & 센티먼트 분석 중", "트레이딩 전략 생성 중"]
    : ["Fetching Binance price data", "Checking Upbit + Kimchi Premium", "Analyzing RSI, MA technicals", "Scanning news & sentiment", "Generating trading strategy"];
  const currentIdx = allSteps.findIndex((s) => step.startsWith(s));

  return (
    <div className="px-3 py-3 space-y-1.5">
      {allSteps.map((s, i) => {
        const done = i < currentIdx;
        const active = i === currentIdx;
        return (
          <div key={i} className={`flex items-center gap-2.5 transition-all ${active ? "opacity-100" : done ? "opacity-60" : "opacity-20"}`}>
            {done ? (
              <svg className="w-4 h-4 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            ) : active ? (
              <svg className="w-4 h-4 text-purple-400 animate-spin shrink-0" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <div className="w-4 h-4 rounded-full border border-zinc-700 shrink-0" />
            )}
            <span className={`text-xs font-medium ${active ? "text-purple-300" : done ? "text-zinc-500" : "text-zinc-700"}`}>
              {s}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function SourcePills({ dataSources, ko }: { dataSources: DataSources; ko?: boolean }) {
  const sources = [
    { key: "binance", label: "Binance", color: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20" },
    { key: "upbit", label: ko ? "업비트" : "Upbit", color: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
    { key: "technicals", label: ko ? "기술적분석" : "Technicals", color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20" },
    { key: "fearGreed", label: "F&G Index", color: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
    { key: "news", label: ko ? "뉴스" : "News", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
    { key: "twitter", label: "X/Twitter", color: "text-sky-400 bg-sky-500/10 border-sky-500/20" },
    { key: "polymarket", label: "Polymarket", color: "text-orange-400 bg-orange-500/10 border-orange-500/20" },
    { key: "webSearch", label: ko ? "웹검색" : "Web", color: "text-purple-400 bg-purple-500/10 border-purple-500/20" },
  ];
  const active = sources.filter((s) => dataSources[s.key as keyof DataSources]);
  if (active.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5 mb-2">
      <span className="text-[10px] text-zinc-600 self-center mr-1">{ko ? "출처" : "Sources"}:</span>
      {active.map((s) => (
        <span key={s.key} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${s.color}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60" />
          {s.label}
        </span>
      ))}
    </div>
  );
}

function CoinPriceCards({ coins, ko }: { coins: string[]; ko?: boolean }) {
  const [prices, setPrices] = useState<Record<string, { price: number; change: number }>>({});
  const [lastUpdate, setLastUpdate] = useState<number>(0);

  useEffect(() => {
    if (coins.length === 0) return;

    // Fetch live prices directly from Binance — faster & more accurate than CoinGecko
    async function fetchPrices() {
      try {
        const symbols = coins.map((c) => `${c}USDT`);
        const symbolParam = encodeURIComponent(JSON.stringify(symbols));
        const res = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbols=${symbolParam}`);
        if (!res.ok) return;
        const data: { symbol: string; lastPrice: string; priceChangePercent: string }[] = await res.json();
        const map: Record<string, { price: number; change: number }> = {};
        for (const t of data) {
          const coin = t.symbol.replace("USDT", "");
          if (coins.includes(coin)) {
            map[coin] = {
              price: parseFloat(t.lastPrice),
              change: parseFloat(t.priceChangePercent),
            };
          }
        }
        setPrices(map);
        setLastUpdate(Date.now());
      } catch {}
    }

    fetchPrices();
    const interval = setInterval(fetchPrices, 10_000); // refresh every 10s
    return () => clearInterval(interval);
  }, [coins]);

  if (Object.keys(prices).length === 0) return null;

  return (
    <div className="my-2">
      <div className="flex items-center gap-1.5 mb-1.5">
        <span className="relative flex h-1.5 w-1.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
        </span>
        <span className="text-[9px] font-mono text-emerald-400 uppercase tracking-[0.12em]">
          {ko ? "실시간" : "Live"}
        </span>
        <span className="text-[9px] font-mono text-zinc-600 uppercase tracking-wider">Binance</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {coins.map((coin) => {
          const p = prices[coin];
          if (!p) return null;
          return (
            <div key={coin} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06] hover:border-white/[0.12] transition-colors">
              <span className="text-xs font-bold text-white">{coin}</span>
              <span className="text-xs font-mono text-zinc-200 tabular-nums">
                ${p.price.toLocaleString(undefined, { maximumFractionDigits: p.price > 100 ? 0 : p.price > 1 ? 2 : 4 })}
              </span>
              <span className={`text-[11px] font-mono font-semibold tabular-nums ${p.change >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                {p.change >= 0 ? "+" : ""}{p.change.toFixed(2)}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Format timestamp                                                           */
/* -------------------------------------------------------------------------- */
function fmtTime(ts?: number) {
  if (!ts) return "";
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

/* -------------------------------------------------------------------------- */
/*  Home: Live Market Strip (BTC / ETH / SOL + Fear & Greed)                   */
/* -------------------------------------------------------------------------- */
const HOME_COINS = [
  { symbol: "BTC", gradient: "from-amber-500/20 to-orange-500/5", accent: "text-amber-300" },
  { symbol: "ETH", gradient: "from-indigo-500/20 to-blue-500/5", accent: "text-indigo-300" },
  { symbol: "SOL", gradient: "from-violet-500/20 to-fuchsia-500/5", accent: "text-violet-300" },
];

function HomeMarketStrip({ ko }: { ko: boolean }) {
  const [prices, setPrices] = useState<Record<string, { price: number; change: number }>>({});
  const [fng, setFng] = useState<{ value: number; classification: string } | null>(null);

  // Live Binance prices — 5s poll (matches TradingViewChart cadence)
  useEffect(() => {
    let cancelled = false;
    const symbols = HOME_COINS.map((c) => `${c.symbol}USDT`);
    async function fetchPrices() {
      try {
        const symbolParam = encodeURIComponent(JSON.stringify(symbols));
        const res = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbols=${symbolParam}`);
        if (!res.ok || cancelled) return;
        const data: { symbol: string; lastPrice: string; priceChangePercent: string }[] = await res.json();
        const map: Record<string, { price: number; change: number }> = {};
        for (const t of data) {
          const coin = t.symbol.replace("USDT", "");
          map[coin] = {
            price: parseFloat(t.lastPrice),
            change: parseFloat(t.priceChangePercent),
          };
        }
        if (!cancelled) setPrices(map);
      } catch {}
    }
    fetchPrices();
    const id = window.setInterval(fetchPrices, 5_000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

  // Fear & Greed Index — fetch once on mount (updates daily anyway)
  useEffect(() => {
    let cancelled = false;
    async function fetchFng() {
      try {
        const res = await fetch("https://api.alternative.me/fng/?limit=1");
        if (!res.ok || cancelled) return;
        const data = await res.json();
        const entry = data?.data?.[0];
        if (entry && !cancelled) {
          setFng({
            value: parseInt(entry.value, 10),
            classification: entry.value_classification ?? "",
          });
        }
      } catch {}
    }
    fetchFng();
  }, []);

  function classifyKo(c: string): string {
    const map: Record<string, string> = {
      "Extreme Fear": "극도의 공포",
      "Fear": "공포",
      "Neutral": "중립",
      "Greed": "탐욕",
      "Extreme Greed": "극도의 탐욕",
    };
    return map[c] ?? c;
  }

  function fngTone(v: number): string {
    if (v >= 75) return "text-emerald-300 bg-emerald-500/10 border-emerald-500/20";
    if (v >= 55) return "text-lime-300 bg-lime-500/10 border-lime-500/20";
    if (v >= 45) return "text-amber-300 bg-amber-500/10 border-amber-500/20";
    if (v >= 25) return "text-orange-300 bg-orange-500/10 border-orange-500/20";
    return "text-red-300 bg-red-500/10 border-red-500/20";
  }

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar -mx-4 px-4 pb-1">
      {HOME_COINS.map((c) => {
        const p = prices[c.symbol];
        const up = p ? p.change >= 0 : false;
        return (
          <div
            key={c.symbol}
            className={`shrink-0 flex items-center gap-2 pl-2.5 pr-3 py-2 rounded-xl bg-gradient-to-br ${c.gradient} border border-white/[0.06] backdrop-blur-sm`}
          >
            <span className={`flex items-center justify-center w-6 h-6 rounded-full bg-white/[0.06] text-[9px] font-bold ${c.accent} tracking-wider`}>
              {c.symbol}
            </span>
            <div className="flex flex-col leading-tight">
              {p ? (
                <>
                  <span className="text-[12px] font-mono font-semibold text-white tabular-nums">
                    ${p.price.toLocaleString(undefined, {
                      maximumFractionDigits: p.price > 100 ? 0 : p.price > 1 ? 2 : 4,
                    })}
                  </span>
                  <span
                    className={`text-[10px] font-mono font-semibold tabular-nums ${up ? "text-emerald-400" : "text-red-400"}`}
                  >
                    {up ? "+" : ""}
                    {p.change.toFixed(2)}%
                  </span>
                </>
              ) : (
                <>
                  <span className="h-3 w-12 bg-white/[0.06] rounded animate-pulse" />
                  <span className="h-2.5 w-8 bg-white/[0.04] rounded animate-pulse mt-0.5" />
                </>
              )}
            </div>
          </div>
        );
      })}

      {/* Fear & Greed pill */}
      <div
        className={`shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl border backdrop-blur-sm ${fng ? fngTone(fng.value) : "text-zinc-500 bg-white/[0.02] border-white/[0.06]"}`}
      >
        <span className="text-[9px] font-mono uppercase tracking-[0.12em] opacity-80">
          {ko ? "공포·탐욕" : "F&G"}
        </span>
        {fng ? (
          <>
            <span className="text-[13px] font-mono font-bold tabular-nums leading-none">{fng.value}</span>
            <span className="text-[10px] font-medium leading-none">
              {ko ? classifyKo(fng.classification) : fng.classification}
            </span>
          </>
        ) : (
          <span className="h-3 w-10 bg-white/[0.06] rounded animate-pulse" />
        )}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Home: Recent Chart Analyses strip                                          */
/* -------------------------------------------------------------------------- */
interface RecentAnalysis {
  id: string;
  pair: string | null;
  summary: string;
  trend: string;
  imageUrl: string;
  createdAt: string;
}

function HomeRecentStrip({ lang, ko }: { lang: string; ko: boolean }) {
  const [items, setItems] = useState<RecentAnalysis[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/chart-analysis");
        if (!res.ok) {
          if (!cancelled) setLoaded(true);
          return;
        }
        const data = await res.json();
        if (!cancelled) {
          const arr: RecentAnalysis[] = Array.isArray(data.analyses)
            ? data.analyses.slice(0, 3).map((a: any) => ({
                id: a.id,
                pair: a.pair ?? null,
                summary: a.summary ?? "",
                trend: a.trend ?? "",
                imageUrl: a.imageUrl ?? "",
                createdAt: a.createdAt ?? "",
              }))
            : [];
          setItems(arr);
          setLoaded(true);
        }
      } catch {
        if (!cancelled) setLoaded(true);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!loaded || items.length === 0) return null;

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2 px-0.5">
        <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-zinc-500 font-semibold">
          {ko ? "최근 분석" : "Recent analyses"}
        </span>
      </div>
      <div className="flex items-stretch gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 pb-1">
        {items.map((a) => {
          const trendUp = /bull|up|상승|롱|long/i.test(a.trend);
          const trendDown = /bear|down|하락|숏|short/i.test(a.trend);
          return (
            <a
              key={a.id}
              href={`/${lang}/chart-ideas/analyze?id=${a.id}`}
              className="group shrink-0 w-[220px] rounded-xl overflow-hidden bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.14] hover:bg-white/[0.04] transition-all duration-200"
            >
              {a.imageUrl && (
                <div className="relative w-full h-20 bg-zinc-900 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={a.imageUrl}
                    alt={a.pair ?? "chart"}
                    className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                  />
                  <span
                    className={`absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold tracking-wider ${
                      trendUp
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                        : trendDown
                        ? "bg-red-500/20 text-red-300 border border-red-500/30"
                        : "bg-white/[0.1] text-zinc-300 border border-white/[0.15]"
                    }`}
                  >
                    {a.pair ?? (ko ? "차트" : "CHART")}
                  </span>
                </div>
              )}
              <div className="px-2.5 py-2">
                <p className="text-[11px] text-zinc-300 line-clamp-2 leading-snug">{a.summary}</p>
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Main Chat Client Component                                                 */
/* -------------------------------------------------------------------------- */
export default function ChatClient({ lang, userName }: Props) {
  const ko = lang === "ko";

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [persona] = useState<Persona>("crypto");
  const [sessionId, setSessionId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [thinkingStep, setThinkingStep] = useState("");
  const [sessions, setSessions] = useState<{ sessionId: string; content: string; createdAt: string }[]>([]);
  const [showSidebar, setShowSidebar] = useState(true);
  const [showProfileModal, setShowProfileModal] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  /* Generate sessionId on mount + fetch sessions */
  useEffect(() => {
    setSessionId(crypto.randomUUID());
    fetch("/api/chat")
      .then((r) => r.json())
      .then((d) => d.sessions && setSessions(d.sessions))
      .catch(() => {});
  }, []);

  /* Scroll to keep the user's question in view (answer appears below) */
  const lastUserMsgIdxRef = useRef<number>(-1);
  useEffect(() => {
    if (messages.length === 0) return;
    const lastMsg = messages[messages.length - 1];

    if (loading) {
      // AI is thinking — scroll so the user's question stays at top with thinking indicator below
      const userMsgEl = document.querySelector(`[data-msg-idx="${messages.length - 1}"]`);
      if (userMsgEl) {
        userMsgEl.scrollIntoView({ behavior: "smooth", block: "start" });
        lastUserMsgIdxRef.current = messages.length - 1;
      }
    } else if (lastMsg.role === "assistant" && lastUserMsgIdxRef.current >= 0) {
      // AI response arrived — scroll to the user's question so the answer is visible below
      const userMsgEl = document.querySelector(`[data-msg-idx="${lastUserMsgIdxRef.current}"]`);
      if (userMsgEl) {
        userMsgEl.scrollIntoView({ behavior: "smooth", block: "start" });
      }
      lastUserMsgIdxRef.current = -1;
    } else if (lastMsg.role === "user") {
      // User just sent a message — scroll to it
      const el = document.querySelector(`[data-msg-idx="${messages.length - 1}"]`);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [messages, loading]);

  const handleNewChat = useCallback(() => {
    setMessages([]);
    setSessionId(crypto.randomUUID());
    setInput("");
    inputRef.current?.focus();
  }, []);

  const loadSession = useCallback(async (sid: string) => {
    try {
      const res = await fetch(`/api/chat?sessionId=${sid}`);
      const data = await res.json();
      if (data.messages) {
        setSessionId(sid);
        setMessages(
          data.messages.map((m: any) => ({
            role: m.role,
            content: m.content,
            ticker: m.ticker ? (() => {
              const [exchange, symbol] = m.ticker.split(":");
              return { exchange, symbol };
            })() : undefined,
            timestamp: new Date(m.createdAt).getTime(),
          }))
        );
      }
    } catch {}
  }, []);

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const userMessage: Message = { role: "user", content: trimmed, timestamp: Date.now() };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    // Thinking steps animation
    const steps = ko
      ? ["바이낸스 가격 데이터 수집 중...", "업비트 + 김치 프리미엄 확인 중...", "RSI, MA 기술적 분석 중...", "뉴스 & 센티먼트 분석 중...", "트레이딩 전략 생성 중..."]
      : ["Fetching Binance price data...", "Checking Upbit + Kimchi Premium...", "Analyzing RSI, MA technicals...", "Scanning news & sentiment...", "Generating trading strategy..."];
    let stepIdx = 0;
    setThinkingStep(steps[0]);
    const stepTimer = setInterval(() => {
      stepIdx = Math.min(stepIdx + 1, steps.length - 1);
      setThinkingStep(steps[stepIdx]);
    }, 1500);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed, persona, sessionId, lang }),
      });
      const data = await res.json();

      if (data.error) {
        let errorMsg: string;
        if (data.error === "rate_limit") {
          const mins = data.retryAfterMinutes ?? 1;
          errorMsg = ko
            ? `⏳ 요청 한도에 도달했습니다. ${mins}분 후에 다시 시도해 주세요.${data.shouldUpgrade ? " 프리미엄으로 업그레이드하면 더 많은 분석을 이용할 수 있습니다." : ""}`
            : `⏳ You've reached the request limit. Please try again in ${mins} minute${mins > 1 ? "s" : ""}.${data.shouldUpgrade ? " Upgrade to Premium for more analysis." : ""}`;
        } else if (res.status === 401) {
          errorMsg = ko ? "로그인이 필요합니다." : "Please log in to continue.";
        } else if (res.status === 503) {
          errorMsg = ko
            ? "🔧 AI 서비스에 일시적으로 연결할 수 없습니다. 잠시 후 다시 시도해 주세요."
            : "🔧 AI service is temporarily unavailable. Please try again in a moment.";
        } else {
          errorMsg = ko ? "오류가 발생했습니다. 다시 시도해 주세요." : "An error occurred. Please try again.";
        }
        setMessages((prev) => [...prev, { role: "assistant", content: errorMsg, timestamp: Date.now() }]);
        return;
      }

      const assistantMessage: Message = {
        role: "assistant",
        content: data.response || data.message || data.content || "",
        ticker: data.ticker ?? undefined,
        timestamp: Date.now(),
        news: data.news ?? undefined,
        tweets: data.tweets ?? undefined,
        followUps: data.followUps ?? undefined,
        internalLinks: data.internalLinks ?? undefined,
        mentionedCoins: data.mentionedCoins ?? undefined,
        dataSources: data.dataSources ?? undefined,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: ko ? "🔧 서버에 연결할 수 없습니다. 인터넷 연결을 확인하고 다시 시도해 주세요." : "🔧 Could not connect to the server. Check your connection and try again.", timestamp: Date.now() },
      ]);
    } finally {
      clearInterval(stepTimer);
      setThinkingStep("");
      setLoading(false);
      inputRef.current?.focus();
    }
  }, [loading, persona, sessionId, lang, ko]);

  const handleSend = useCallback(async () => {
    await sendMessage(input);
  }, [input, sendMessage]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  const placeholder = ko ? "크립토, 시장에 대해 물어보세요..." : "Ask about crypto and markets...";
  const isEmpty = messages.length === 0 && !loading;

  // Home quick-ask chips — prefill + auto-send on tap
  const quickAskChips: {
    key: string;
    label: string;
    payload: string;
    icon: JSX.Element;
    accent: string;
  }[] = useMemo(
    () => [
      {
        key: "btc-outlook",
        label: ko ? "BTC 오늘 전망" : "BTC outlook today",
        payload: "What's the BTC outlook today? Give entry, SL, TP.",
        accent: "text-amber-300 bg-amber-500/[0.08] border-amber-500/20 hover:border-amber-500/40",
        icon: (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 17l6-6 4 4 8-8M21 7h-6M21 7v6" />
          </svg>
        ),
      },
      {
        key: "eth-entry",
        label: ko ? "ETH 진입 가격" : "ETH entry zone",
        payload: "Best ETH entry zone right now?",
        accent: "text-indigo-300 bg-indigo-500/[0.08] border-indigo-500/20 hover:border-indigo-500/40",
        icon: (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        ),
      },
      {
        key: "whales",
        label: ko ? "고래 활동 요약" : "Whale activity",
        payload: "Summarize today's whale activity.",
        accent: "text-sky-300 bg-sky-500/[0.08] border-sky-500/20 hover:border-sky-500/40",
        icon: (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
      },
      {
        key: "news",
        label: ko ? "오늘 뉴스 임팩트" : "Top news impact",
        payload: "What's today's most market-moving news?",
        accent: "text-emerald-300 bg-emerald-500/[0.08] border-emerald-500/20 hover:border-emerald-500/40",
        icon: (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 01-2.25 2.25M16.5 7.5V18a2.25 2.25 0 002.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 002.25 2.25h13.5" />
          </svg>
        ),
      },
      {
        key: "btc-chart",
        label: ko ? "BTC 4H 차트" : "Chart BTC 4H",
        payload: "Analyze BTC 4H chart.",
        accent: "text-cyan-300 bg-cyan-500/[0.08] border-cyan-500/20 hover:border-cyan-500/40",
        icon: (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
          </svg>
        ),
      },
      {
        key: "polymarket",
        label: ko ? "Polymarket 베팅" : "Polymarket verdict",
        payload: "What's Polymarket betting on today for crypto?",
        accent: "text-orange-300 bg-orange-500/[0.08] border-orange-500/20 hover:border-orange-500/40",
        icon: (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
          </svg>
        ),
      },
    ],
    [ko]
  );

  /* ======================================================================== */
  /*  RENDER                                                                   */
  /* ======================================================================== */
  return (
    <div className="fixed inset-x-0 top-16 sm:top-[92px] bottom-[56px] lg:bottom-0 flex bg-zinc-950 font-mono z-10">
      {/* ── Left Sidebar: Session History ── */}
      {showSidebar && (
        <div className="hidden lg:flex w-[260px] border-r border-white/[0.06] flex-col overflow-hidden shrink-0">
          {/* Sidebar header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06] shrink-0">
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-zinc-400 font-semibold">Sessions</span>
            <button
              onClick={handleNewChat}
              className="text-[10px] font-mono text-blue-400 hover:text-blue-300 transition-colors cursor-pointer px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20"
            >
              + New
            </button>
          </div>

          {/* Session list */}
          <div className="flex-1 overflow-y-auto">
            {sessions.length === 0 ? (
              <div className="text-center py-8 text-[10px] text-zinc-700 font-mono">
                {ko ? "대화 기록이 없습니다" : "No chat history"}
              </div>
            ) : (
              sessions.map((s) => (
                <button
                  key={s.sessionId}
                  onClick={() => loadSession(s.sessionId)}
                  className={`w-full text-left px-4 py-2.5 border-b border-white/[0.04] hover:bg-white/[0.03] transition-colors cursor-pointer ${
                    s.sessionId === sessionId ? "bg-white/[0.04] border-l-2 border-l-blue-500" : ""
                  }`}
                >
                  <p className="text-[11px] text-zinc-300 truncate leading-tight">{s.content}</p>
                  <p className="text-[9px] text-zinc-600 mt-1 tabular-nums">
                    {new Date(s.createdAt).toLocaleDateString()}
                  </p>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* ── Main Chat Area ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <div className="flex items-center gap-3 px-4 py-2.5 bg-zinc-900/80 border-b border-white/[0.06] shrink-0">
          {/* Toggle sidebar */}
          <button
            onClick={() => setShowSidebar((s) => !s)}
            className="hidden lg:flex items-center justify-center w-7 h-7 rounded hover:bg-white/[0.06] transition-colors cursor-pointer"
          >
            <svg className="w-4 h-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>

          {/* Persona info */}
          <Image
            src={PERSONA_AVATARS[persona]}
            alt="AI"
            width={28}
            height={28}
            className="w-7 h-7 rounded-full object-cover ring-1 ring-white/10 shrink-0"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-white">
                {PERSONA_NAMES[persona]?.[ko ? "ko" : "en"]}
              </span>
              <span className="relative flex items-center gap-1">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                </span>
                <span className="text-[9px] text-emerald-400 uppercase tracking-[0.1em]">Online</span>
              </span>
            </div>
          </div>

          {/* Session controls */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[9px] font-mono text-zinc-600 tabular-nums hidden sm:block">
              {messages.length > 0 ? `${messages.length} msgs` : ""}
            </span>
            <button
              onClick={() => setShowProfileModal(true)}
              title={ko ? "트레이딩 프로필" : "Trading Profile"}
              className="text-[10px] font-mono text-zinc-500 hover:text-blue-400 transition-colors cursor-pointer px-2 py-1 rounded border border-white/[0.06] hover:border-blue-500/30 hover:bg-blue-500/[0.06] flex items-center gap-1"
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
              <span className="hidden sm:inline">{ko ? "프로필" : "Profile"}</span>
            </button>
            <button
              onClick={handleNewChat}
              className="text-[10px] font-mono text-zinc-500 hover:text-white transition-colors cursor-pointer px-2 py-1 rounded border border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.04]"
            >
              {ko ? "새 채팅" : "New Chat"}
            </button>
          </div>
        </div>
        <TradingProfileModal open={showProfileModal} onClose={() => setShowProfileModal(false)} ko={ko} />

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto">
          {isEmpty ? (
            /* ── Home-as-Chat Landing — mobile-first empty state ── */
            <div className="h-full overflow-y-auto">
              <div className="w-full max-w-3xl mx-auto px-4 pt-4 pb-8 flex flex-col gap-5 lg:gap-6">
                {/* A. Live market strip */}
                <section aria-label={ko ? "실시간 시장" : "Live markets"}>
                  <div className="flex items-center gap-1.5 mb-2 px-0.5">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                    </span>
                    <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-zinc-500 font-semibold">
                      {ko ? "실시간 시장" : "Live Markets"}
                    </span>
                    <span className="text-[9px] font-mono text-zinc-700 uppercase tracking-wider ml-1">
                      Binance
                    </span>
                  </div>
                  <HomeMarketStrip ko={ko} />
                </section>

                {/* B. Welcome headline */}
                <section className="pt-2">
                  <h1 className="text-[22px] sm:text-2xl lg:text-3xl font-semibold tracking-tight leading-tight text-transparent bg-clip-text bg-gradient-to-br from-white via-white to-zinc-400">
                    {ko ? "오늘 무엇을 분석해 드릴까요?" : "What should we analyze today?"}
                  </h1>
                  <p className="text-[12px] text-zinc-500 mt-1.5 leading-relaxed">
                    {ko
                      ? "실시간 시세 · 온체인 · 트레이드 셋업을 한 채팅에서 확인하세요."
                      : "Live market data, on-chain flows, and trade setups — all in one chat."}
                  </p>
                </section>

                {/* C. Quick-ask chip grid */}
                <section>
                  <div className="flex items-center gap-1.5 mb-2 px-0.5">
                    <svg className="w-3 h-3 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-zinc-500 font-semibold">
                      {ko ? "빠른 질문" : "Quick ask"}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {quickAskChips.map((chip) => (
                      <button
                        key={chip.key}
                        onClick={() => sendMessage(chip.payload)}
                        disabled={loading}
                        className={`group flex items-center gap-2 px-3 py-3 rounded-xl border text-left transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${chip.accent}`}
                      >
                        <span className="shrink-0 w-8 h-8 rounded-lg bg-white/[0.06] border border-white/[0.05] flex items-center justify-center group-hover:bg-white/[0.1] transition-colors">
                          {chip.icon}
                        </span>
                        <span className="text-[12px] font-medium leading-tight flex-1 min-w-0">
                          {chip.label}
                        </span>
                        <svg
                          className="shrink-0 w-3 h-3 opacity-0 group-hover:opacity-60 -translate-x-1 group-hover:translate-x-0 transition-all duration-200"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                      </button>
                    ))}
                  </div>
                </section>

                {/* D. Recent activity strip — auto-hides if user has no history */}
                <section>
                  <HomeRecentStrip lang={lang} ko={ko} />
                </section>
              </div>
            </div>
          ) : (
            /* ── Messages ── */
            <div className="max-w-3xl mx-auto px-4 py-4 w-full space-y-3">
              {messages.map((msg, idx) => (
                <React.Fragment key={idx}>
                  {msg.role === "user" ? (
                    <div data-msg-idx={idx} className="flex justify-end gap-2 items-end">
                      <span className="text-[8px] text-zinc-700 tabular-nums shrink-0">{fmtTime(msg.timestamp)}</span>
                      <div className="max-w-[75%] px-3 py-2 rounded-lg rounded-br-sm bg-blue-600/90 text-white text-[12px] leading-relaxed whitespace-pre-wrap">
                        {msg.content}
                      </div>
                    </div>
                  ) : (
                    <div data-msg-idx={idx} className="flex gap-2.5 items-start">
                      <Image
                        src={PERSONA_AVATARS[persona]}
                        alt="AI"
                        width={24}
                        height={24}
                        className="w-6 h-6 rounded-full object-cover ring-1 ring-white/10 shrink-0 mt-0.5"
                      />
                      <div className="flex-1 min-w-0 space-y-2.5">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[9px] font-semibold text-zinc-500 uppercase tracking-wide">
                            {ko ? "FuturesAI 퀀트" : "FuturesAI Quant"}
                          </span>
                          <span className="text-[8px] text-zinc-700 tabular-nums">{fmtTime(msg.timestamp)}</span>
                        </div>

                        {/* Data source pills (Perplexity-style) */}
                        {msg.dataSources && <SourcePills dataSources={msg.dataSources} ko={ko} />}

                        {/* News source cards */}
                        {msg.news && msg.news.length > 0 && (
                          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                            {msg.news.slice(0, 6).map((n, ni) => (
                              <a
                                key={ni}
                                href={n.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="shrink-0 flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06] hover:border-blue-500/20 hover:bg-white/[0.06] transition-all cursor-pointer max-w-[200px]"
                              >
                                <span className="w-5 h-5 rounded bg-blue-500/20 flex items-center justify-center text-[9px] font-bold text-blue-400 shrink-0">{ni + 1}</span>
                                <span className="text-[11px] text-zinc-400 truncate">{n.source}</span>
                              </a>
                            ))}
                          </div>
                        )}

                        {/* Inline coin price cards */}
                        {msg.mentionedCoins && msg.mentionedCoins.length > 0 && (
                          <CoinPriceCards coins={msg.mentionedCoins} ko={ko} />
                        )}

                        {/* Main AI response — rendered markdown */}
                        <div
                          className="text-sm text-zinc-200 leading-relaxed chat-markdown"
                          dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }}
                        />

                        {/* Inline TradingView chart */}
                        {msg.ticker && (
                          <div className="mt-3 rounded-xl overflow-hidden border border-white/[0.08]">
                            <div className="flex items-center gap-2 px-3 py-2 bg-zinc-900/80 border-b border-white/[0.06]">
                              <span className="relative flex h-2 w-2"><span className="animate-ping absolute h-full w-full rounded-full bg-emerald-400 opacity-75" /><span className="relative rounded-full h-2 w-2 bg-emerald-500" /></span>
                              <span className="text-xs font-mono text-emerald-400">{msg.ticker.exchange}:{msg.ticker.symbol}</span>
                              <span className="text-[10px] text-zinc-600 ml-auto">LIVE</span>
                            </div>
                            <TradingViewChart ticker={msg.ticker} />
                          </div>
                        )}

                        {/* Internal page links */}
                        {msg.internalLinks && msg.internalLinks.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {msg.internalLinks.map((link, li) => (
                              <a
                                key={li}
                                href={link.path}
                                className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/[0.03] border border-white/[0.06] hover:border-blue-500/30 hover:bg-blue-500/[0.05] transition-all text-[10px] text-zinc-400 hover:text-blue-400 cursor-pointer"
                              >
                                {link.type === "chart" && (
                                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>
                                )}
                                {link.type === "whale" && (
                                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                )}
                                {link.type === "signal" && (
                                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" /></svg>
                                )}
                                {(link.type === "news" || link.type === "market") && (
                                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 01-2.25 2.25M16.5 7.5V18a2.25 2.25 0 002.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 002.25 2.25h13.5" /></svg>
                                )}
                                {link.label}
                              </a>
                            ))}
                          </div>
                        )}

                        {/* Follow-up questions */}
                        {msg.followUps && msg.followUps.length > 0 && idx === messages.length - 1 && (
                          <div className="pt-2">
                            <span className="text-[9px] text-zinc-600 uppercase tracking-wider block mb-1.5">{ko ? "💡 이런 질문은 어떠세요?" : "💡 Ask next"}</span>
                            <div className="flex flex-wrap gap-1.5">
                              {msg.followUps.map((q, qi) => (
                                <button
                                  key={qi}
                                  onClick={() => sendMessage(q)}
                                  className="text-[10px] px-2.5 py-1.5 rounded-md bg-white/[0.02] text-zinc-400 hover:bg-white/[0.06] hover:text-zinc-200 border border-white/[0.06] hover:border-white/[0.12] transition-all cursor-pointer text-left"
                                >
                                  {q}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </React.Fragment>
              ))}

              {loading && (
                <div className="flex gap-2.5 items-start">
                  <Image
                    src={PERSONA_AVATARS[persona]}
                    alt="AI"
                    width={24}
                    height={24}
                    className="w-6 h-6 rounded-full object-cover ring-1 ring-white/10 shrink-0 mt-0.5"
                  />
                  <div>
                    <span className="text-[9px] font-semibold text-zinc-500 uppercase tracking-wide block mb-1">
                      {ko ? "FuturesAI 퀀트" : "FuturesAI Quant"}
                    </span>
                    <div className="pl-2.5 border-l-2 border-purple-500/20">
                      <ThinkingSteps step={thinkingStep} ko={ko} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Bottom Input Bar */}
        <div className="shrink-0 border-t border-white/[0.06] bg-zinc-900/60 px-4 py-3">
          <div className="max-w-3xl mx-auto w-full">
            <div className="relative flex items-end gap-2 bg-zinc-950/80 border border-white/[0.08] rounded-lg px-3 py-2.5 focus-within:border-white/[0.16] focus-within:bg-zinc-950 transition-all duration-200">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  e.target.style.height = "auto";
                  e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
                }}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                disabled={loading}
                rows={1}
                className="flex-1 resize-none bg-transparent text-[12px] text-white placeholder-zinc-600 focus:outline-none leading-relaxed min-h-[24px] max-h-[120px] overflow-y-auto disabled:opacity-50 disabled:cursor-not-allowed font-mono"
              />
              <button
                onClick={handleSend}
                disabled={loading || !input.trim()}
                aria-label={ko ? "전송" : "Send"}
                className={[
                  "shrink-0 w-7 h-7 rounded-md flex items-center justify-center transition-all duration-200 cursor-pointer",
                  loading || !input.trim()
                    ? "text-zinc-700 cursor-not-allowed"
                    : "bg-blue-600 text-white hover:bg-blue-500 active:scale-95",
                ].join(" ")}
              >
                <SendIcon className="w-3 h-3" />
              </button>
            </div>
            <div className="flex items-center justify-between mt-1.5">
              <p className="text-[9px] text-zinc-700">
                {ko ? "Enter 전송 · Shift+Enter 줄바꿈" : "Enter to send · Shift+Enter for newline"}
              </p>
              <p className="text-[9px] text-zinc-700">Gemini 2.5 Pro</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
