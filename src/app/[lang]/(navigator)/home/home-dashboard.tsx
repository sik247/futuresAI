"use client";

import { useState } from "react";
import Link from "next/link";
import type { CryptoNewsItem } from "@/lib/services/news/crypto-news.service";
import type { HLWalletData } from "@/lib/services/whales/hyperliquid.service";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type CoinMarket = {
  id: string;
  market_cap_rank: number;
  name: string;
  symbol: string;
  image: string;
  current_price: number;
  price_change_percentage_1h_in_currency: number | null;
  price_change_percentage_24h: number | null;
  price_change_percentage_7d_in_currency: number | null;
  market_cap: number;
};

type BinanceTicker = {
  symbol: string;
  lastPrice: string;
  priceChangePercent: string;
};

type FearGreedData = {
  data: { value: string; value_classification: string }[];
};

type GlobalMarket = {
  data: {
    total_market_cap: { usd: number };
    total_volume: { usd: number };
    market_cap_percentage: { btc: number };
  };
};

type SortKey = "rank" | "price" | "pct1h" | "pct24h" | "pct7d" | "marketCap";

export type HomeDashboardProps = {
  lang: string;
  btcData: BinanceTicker | null;
  ethData: BinanceTicker | null;
  fearGreed: FearGreedData | null;
  globalData: GlobalMarket | null;
  topCoins: CoinMarket[];
  hlWhales: HLWalletData[];
  news: CryptoNewsItem[];
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function fmtUsd(v: number) {
  if (v >= 1_000_000_000_000) return `$${(v / 1_000_000_000_000).toFixed(2)}T`;
  if (v >= 1_000_000_000) return `$${(v / 1_000_000_000).toFixed(2)}B`;
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
  return `$${v.toFixed(2)}`;
}

function fmtPrice(v: number) {
  if (v >= 10000) return v.toLocaleString(undefined, { maximumFractionDigits: 0 });
  if (v >= 1) return v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return v.toFixed(6);
}

function fmtNum(v: number) {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(2)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}K`;
  if (v >= 1) return v.toFixed(2);
  return v.toFixed(4);
}

function pctColor(v: number | null) {
  if (v === null) return "text-zinc-600";
  return v >= 0 ? "text-emerald-400" : "text-red-400";
}

function pctFmt(v: number | null) {
  if (v === null) return "--";
  return `${v >= 0 ? "+" : ""}${v.toFixed(2)}%`;
}

function timeAgo(date: Date) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 0) return "just now";
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  return `${Math.floor(seconds / 86400)}d`;
}

/* ------------------------------------------------------------------ */
/*  Stat Bar                                                           */
/* ------------------------------------------------------------------ */

function StatBar({
  btcData,
  ethData,
  fearGreed,
  globalData,
}: Pick<HomeDashboardProps, "btcData" | "ethData" | "fearGreed" | "globalData">) {
  const btcPrice = btcData ? parseFloat(btcData.lastPrice) : null;
  const btcPct = btcData ? parseFloat(btcData.priceChangePercent) : null;
  const ethPrice = ethData ? parseFloat(ethData.lastPrice) : null;
  const ethPct = ethData ? parseFloat(ethData.priceChangePercent) : null;
  const fg = fearGreed?.data?.[0];
  const mktCap = globalData?.data?.total_market_cap?.usd ?? null;
  const vol = globalData?.data?.total_volume?.usd ?? null;
  const btcDom = globalData?.data?.market_cap_percentage?.btc ?? null;

  return (
    <div className="flex items-center gap-2 px-4 py-2.5 bg-zinc-900/80 border-b border-white/[0.06] text-[11px] font-mono overflow-x-auto shrink-0 whitespace-nowrap">
      {/* BTC */}
      <span className="text-zinc-500">BTC</span>
      {btcPrice !== null ? (
        <>
          <span className="text-white font-bold tabular-nums">${fmtPrice(btcPrice)}</span>
          <span className={`tabular-nums ${pctColor(btcPct)}`}>{pctFmt(btcPct)}</span>
        </>
      ) : (
        <span className="text-zinc-600">--</span>
      )}
      <span className="text-zinc-700">|</span>
      {/* ETH */}
      <span className="text-zinc-500">ETH</span>
      {ethPrice !== null ? (
        <>
          <span className="text-white font-bold tabular-nums">${fmtPrice(ethPrice)}</span>
          <span className={`tabular-nums ${pctColor(ethPct)}`}>{pctFmt(ethPct)}</span>
        </>
      ) : (
        <span className="text-zinc-600">--</span>
      )}
      <span className="text-zinc-700">|</span>
      {/* Fear & Greed */}
      <span className="text-zinc-500">F&amp;G</span>
      {fg ? (
        <span
          className={
            parseInt(fg.value) <= 25
              ? "text-red-400 font-bold"
              : parseInt(fg.value) >= 75
              ? "text-emerald-400 font-bold"
              : "text-amber-400 font-bold"
          }
        >
          {fg.value} {fg.value_classification.toUpperCase()}
        </span>
      ) : (
        <span className="text-zinc-600">--</span>
      )}
      <span className="text-zinc-700">|</span>
      {/* Market Cap */}
      <span className="text-zinc-500">Mkt Cap</span>
      <span className="text-white tabular-nums">{mktCap ? fmtUsd(mktCap) : "--"}</span>
      <span className="text-zinc-700">|</span>
      {/* BTC Dom */}
      <span className="text-zinc-500">BTC Dom</span>
      <span className="text-white tabular-nums">{btcDom ? `${btcDom.toFixed(1)}%` : "--"}</span>
      <span className="text-zinc-700">|</span>
      {/* 24h Vol */}
      <span className="text-zinc-500">24h Vol</span>
      <span className="text-white tabular-nums">{vol ? fmtUsd(vol) : "--"}</span>
      <span className="text-zinc-700">|</span>
      {/* Live indicator */}
      <span className="relative flex items-center gap-1.5 shrink-0">
        <span className="relative flex h-1.5 w-1.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
        </span>
        <span className="text-emerald-400 text-[10px] uppercase tracking-[0.15em]">LIVE</span>
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Top Movers Table                                                   */
/* ------------------------------------------------------------------ */

function TopMoversTable({ coins }: { coins: CoinMarket[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("rank");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "rank" ? "asc" : "desc");
    }
  }

  const sorted = [...coins].slice(0, 15).sort((a, b) => {
    let aVal: number, bVal: number;
    switch (sortKey) {
      case "rank":
        aVal = a.market_cap_rank;
        bVal = b.market_cap_rank;
        break;
      case "price":
        aVal = a.current_price;
        bVal = b.current_price;
        break;
      case "pct1h":
        aVal = a.price_change_percentage_1h_in_currency ?? -999;
        bVal = b.price_change_percentage_1h_in_currency ?? -999;
        break;
      case "pct24h":
        aVal = a.price_change_percentage_24h ?? -999;
        bVal = b.price_change_percentage_24h ?? -999;
        break;
      case "pct7d":
        aVal = a.price_change_percentage_7d_in_currency ?? -999;
        bVal = b.price_change_percentage_7d_in_currency ?? -999;
        break;
      case "marketCap":
        aVal = a.market_cap;
        bVal = b.market_cap;
        break;
      default:
        aVal = a.market_cap_rank;
        bVal = b.market_cap_rank;
    }
    return sortDir === "asc" ? aVal - bVal : bVal - aVal;
  });

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <span className="text-zinc-700 ml-0.5">↕</span>;
    return <span className="text-blue-400 ml-0.5">{sortDir === "asc" ? "↑" : "↓"}</span>;
  };

  const ColHeader = ({
    col,
    label,
    align = "left",
  }: {
    col: SortKey;
    label: string;
    align?: "left" | "right";
  }) => (
    <button
      onClick={() => handleSort(col)}
      className={`text-[9px] font-mono uppercase tracking-[0.1em] text-zinc-600 hover:text-zinc-400 transition-colors cursor-pointer ${
        align === "right" ? "text-right w-full" : ""
      }`}
    >
      {label}
      <SortIcon col={col} />
    </button>
  );

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Panel header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/[0.06] shrink-0">
        <span className="text-[10px] font-mono uppercase tracking-[0.15em] text-zinc-500">Top Movers</span>
        <span className="text-[9px] font-mono text-zinc-700">{sorted.length} coins</span>
      </div>
      {/* Column headers */}
      <div className="grid grid-cols-[24px_32px_1fr_72px_60px_60px_60px_72px] gap-1.5 items-center px-3 py-1.5 border-b border-white/[0.04] shrink-0">
        <ColHeader col="rank" label="#" />
        <span />
        <ColHeader col="rank" label="Coin" />
        <div className="text-right"><ColHeader col="price" label="Price" align="right" /></div>
        <div className="text-right"><ColHeader col="pct1h" label="1h%" align="right" /></div>
        <div className="text-right"><ColHeader col="pct24h" label="24h%" align="right" /></div>
        <div className="text-right"><ColHeader col="pct7d" label="7d%" align="right" /></div>
        <div className="text-right"><ColHeader col="marketCap" label="Mkt Cap" align="right" /></div>
      </div>
      {/* Rows */}
      <div className="flex-1 overflow-y-auto">
        {sorted.length === 0 ? (
          <div className="flex items-center justify-center h-full text-[10px] font-mono text-zinc-700">
            No market data
          </div>
        ) : (
          sorted.map((coin) => (
            <div
              key={coin.id}
              className="grid grid-cols-[24px_32px_1fr_72px_60px_60px_60px_72px] gap-1.5 items-center px-3 py-1.5 border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors"
            >
              <span className="text-[10px] font-mono text-zinc-600 tabular-nums">
                {coin.market_cap_rank}
              </span>
              <div className="w-5 h-5 rounded-full overflow-hidden bg-white/[0.05] shrink-0">
                {coin.image && (
                  <img src={coin.image} alt={coin.symbol} className="w-full h-full object-cover" />
                )}
              </div>
              <div className="min-w-0">
                <div className="text-[10px] font-mono font-semibold text-white uppercase truncate">
                  {coin.symbol}
                </div>
                <div className="text-[9px] font-mono text-zinc-600 truncate">{coin.name}</div>
              </div>
              <span className="text-[10px] font-mono text-white tabular-nums text-right">
                ${fmtPrice(coin.current_price)}
              </span>
              <span className={`text-[10px] font-mono tabular-nums text-right ${pctColor(coin.price_change_percentage_1h_in_currency)}`}>
                {pctFmt(coin.price_change_percentage_1h_in_currency)}
              </span>
              <span className={`text-[10px] font-mono tabular-nums text-right ${pctColor(coin.price_change_percentage_24h)}`}>
                {pctFmt(coin.price_change_percentage_24h)}
              </span>
              <span className={`text-[10px] font-mono tabular-nums text-right ${pctColor(coin.price_change_percentage_7d_in_currency)}`}>
                {pctFmt(coin.price_change_percentage_7d_in_currency)}
              </span>
              <span className="text-[10px] font-mono text-zinc-400 tabular-nums text-right">
                {fmtUsd(coin.market_cap)}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  HL Whale Card                                                      */
/* ------------------------------------------------------------------ */

function HLWhaleCard({ whale }: { whale: HLWalletData }) {
  const topPositions = whale.positions.slice(0, 4);
  return (
    <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-2.5 flex flex-col overflow-hidden cursor-default transition-colors duration-200 hover:border-white/[0.10]">
      {/* Header */}
      <div className="flex items-start justify-between mb-1.5">
        <div className="min-w-0">
          <div className="text-[10px] font-semibold text-white truncate">{whale.name}</div>
          <div className="text-[9px] font-mono text-zinc-500 mt-0.5">
            {whale.address.slice(0, 6)}...{whale.address.slice(-4)}
          </div>
        </div>
        <div className="text-right shrink-0 ml-1">
          <div className="text-[10px] font-mono font-bold text-white">{fmtUsd(whale.accountValue)}</div>
          <div className="text-[8px] font-mono text-zinc-500">acct</div>
        </div>
      </div>
      {/* Notional */}
      <div className="flex items-center gap-1.5 mb-1.5 pb-1.5 border-b border-white/[0.04]">
        <span className="text-[8px] font-mono text-zinc-600">NTL</span>
        <span className="text-[9px] font-mono text-blue-400 font-bold">{fmtUsd(whale.totalNotional)}</span>
        <span className="text-[8px] font-mono text-zinc-600 ml-auto">{whale.positions.length}p</span>
      </div>
      {/* Positions */}
      <div className="space-y-0.5 flex-1 overflow-hidden">
        {topPositions.length === 0 ? (
          <div className="text-[9px] font-mono text-zinc-700 text-center py-1">No open positions</div>
        ) : (
          topPositions.map((pos, i) => (
            <div key={i} className="flex items-center gap-1 text-[9px] font-mono">
              <span className="text-white font-semibold w-10 truncate">{pos.coin}</span>
              <span
                className={`text-[7px] font-bold px-0.5 py-0.5 rounded ${
                  pos.direction === "LONG"
                    ? "bg-emerald-500/15 text-emerald-400"
                    : "bg-red-500/15 text-red-400"
                }`}
              >
                {pos.direction === "LONG" ? "L" : "S"}
              </span>
              <span className="text-zinc-500 text-[8px]">{pos.leverage}x</span>
              <span
                className={`ml-auto ${
                  pos.unrealizedPnl >= 0 ? "text-emerald-400" : "text-red-400"
                }`}
              >
                {pos.unrealizedPnl >= 0 ? "+" : ""}{fmtUsd(pos.unrealizedPnl)}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  News Feed                                                          */
/* ------------------------------------------------------------------ */

function NewsFeed({ news }: { news: CryptoNewsItem[] }) {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/[0.06] shrink-0">
        <span className="text-[10px] font-mono uppercase tracking-[0.15em] text-zinc-500">Live News</span>
        <span className="text-[9px] font-mono text-zinc-700">{news.length} stories</span>
      </div>
      <div className="flex-1 overflow-y-auto">
        {news.length === 0 ? (
          <div className="flex items-center justify-center h-full text-[10px] font-mono text-zinc-700">
            No news available
          </div>
        ) : (
          news.map((item, i) => (
            <a
              key={item.id ?? i}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start gap-2 px-3 py-2 border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors cursor-pointer group"
            >
              {/* Time */}
              <span className="text-[9px] font-mono text-zinc-600 shrink-0 w-7 tabular-nums pt-0.5">
                {timeAgo(item.publishedAt)}
              </span>
              {/* Source badge */}
              <span className="text-[8px] font-mono bg-blue-500/10 text-blue-400 border border-blue-500/20 px-1 py-0.5 rounded shrink-0 max-w-[64px] truncate">
                {item.source}
              </span>
              {/* Title */}
              <span className="text-[10px] font-mono text-zinc-300 group-hover:text-white transition-colors leading-snug flex-1 line-clamp-2 min-w-0">
                {item.title}
              </span>
              {/* Link icon */}
              <svg
                className="w-3 h-3 text-zinc-700 group-hover:text-zinc-400 transition-colors shrink-0 mt-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          ))
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Quick Actions                                                      */
/* ------------------------------------------------------------------ */

const QUICK_ACTIONS = [
  {
    title: "AI Quant Chat",
    description: "Ask AI about any crypto",
    path: "chat",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
      </svg>
    ),
    gradient: "from-purple-500/10 to-blue-500/5",
    hoverGradient: "hover:from-purple-500/20 hover:to-blue-500/10",
    glow: "hover:shadow-[0_0_20px_rgba(139,92,246,0.12)]",
    iconColor: "text-purple-400",
    borderHover: "hover:border-purple-500/30",
  },
  {
    title: "Charts Terminal",
    description: "Bloomberg-style charting",
    path: "charts",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </svg>
    ),
    gradient: "from-cyan-500/10 to-teal-500/5",
    hoverGradient: "hover:from-cyan-500/20 hover:to-teal-500/10",
    glow: "hover:shadow-[0_0_20px_rgba(6,182,212,0.12)]",
    iconColor: "text-cyan-400",
    borderHover: "hover:border-cyan-500/30",
  },
  {
    title: "Whale Tracker",
    description: "Track whale positions",
    path: "whales",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    gradient: "from-emerald-500/10 to-green-500/5",
    hoverGradient: "hover:from-emerald-500/20 hover:to-green-500/10",
    glow: "hover:shadow-[0_0_20px_rgba(16,185,129,0.12)]",
    iconColor: "text-emerald-400",
    borderHover: "hover:border-emerald-500/30",
  },
  {
    title: "Social Hub",
    description: "News, X, YouTube feeds",
    path: "sns",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
      </svg>
    ),
    gradient: "from-blue-500/10 to-indigo-500/5",
    hoverGradient: "hover:from-blue-500/20 hover:to-indigo-500/10",
    glow: "hover:shadow-[0_0_20px_rgba(59,130,246,0.12)]",
    iconColor: "text-blue-400",
    borderHover: "hover:border-blue-500/30",
  },
  {
    title: "Quant Signals",
    description: "RSI, MACD, AI signals",
    path: "quant",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
      </svg>
    ),
    gradient: "from-amber-500/10 to-orange-500/5",
    hoverGradient: "hover:from-amber-500/20 hover:to-orange-500/10",
    glow: "hover:shadow-[0_0_20px_rgba(245,158,11,0.12)]",
    iconColor: "text-amber-400",
    borderHover: "hover:border-amber-500/30",
  },
  {
    title: "Premium",
    description: "Unlock full access",
    path: "pricing",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
      </svg>
    ),
    gradient: "from-rose-500/10 to-pink-500/5",
    hoverGradient: "hover:from-rose-500/20 hover:to-pink-500/10",
    glow: "hover:shadow-[0_0_20px_rgba(244,63,94,0.12)]",
    iconColor: "text-rose-400",
    borderHover: "hover:border-rose-500/30",
  },
];

function QuickActions({ lang }: { lang: string }) {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/[0.06] shrink-0">
        <span className="text-[10px] font-mono uppercase tracking-[0.15em] text-zinc-500">Quick Access</span>
      </div>
      <div className="flex-1 overflow-hidden p-2">
        <div className="grid grid-cols-2 gap-2 h-full">
          {QUICK_ACTIONS.map((action) => (
            <Link
              key={action.path}
              href={`/${lang}/${action.path}`}
              className={`group flex flex-col justify-between p-3 rounded-lg border border-white/[0.06] bg-gradient-to-br ${action.gradient} ${action.hoverGradient} ${action.glow} ${action.borderHover} transition-all duration-200 cursor-pointer`}
            >
              <div className={`${action.iconColor} mb-2`}>{action.icon}</div>
              <div>
                <div className="text-[10px] font-mono font-semibold text-white">{action.title}</div>
                <div className="text-[9px] font-mono text-zinc-500 mt-0.5">{action.description}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Dashboard                                                     */
/* ------------------------------------------------------------------ */

export default function HomeDashboard({
  lang,
  btcData,
  ethData,
  fearGreed,
  globalData,
  topCoins,
  hlWhales,
  news,
}: HomeDashboardProps) {
  const [mobileTab, setMobileTab] = useState<"market" | "whales" | "news">("market");

  return (
    <div className="bg-zinc-950 font-mono flex flex-col" style={{ height: "calc(100vh - 64px)" }}>
      {/* Stat Bar */}
      <StatBar
        btcData={btcData}
        ethData={ethData}
        fearGreed={fearGreed}
        globalData={globalData}
      />

      {/* Mobile tab bar */}
      <div className="flex lg:hidden border-b border-white/[0.06] bg-zinc-900/60 shrink-0">
        {(["market", "whales", "news"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setMobileTab(tab)}
            className={`flex-1 py-2 text-[10px] font-mono uppercase tracking-[0.1em] transition-colors cursor-pointer ${
              mobileTab === tab
                ? "text-white border-b-2 border-emerald-500"
                : "text-zinc-600 hover:text-zinc-400"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ── Desktop: Two-row layout ─────────────────────────────── */}
      <div className="hidden lg:flex flex-col flex-1 overflow-hidden min-h-0">
        {/* Top row (60%) */}
        <div
          className="flex border-b border-white/[0.06] overflow-hidden shrink-0"
          style={{ height: "60%" }}
        >
          {/* Left: Top Movers (55%) */}
          <div className="border-r border-white/[0.06] overflow-hidden flex flex-col" style={{ width: "55%" }}>
            <TopMoversTable coins={topCoins} />
          </div>
          {/* Right: Whale Positions (45%) */}
          <div className="flex flex-col overflow-hidden flex-1">
            <div className="flex items-center justify-between px-3 py-2 border-b border-white/[0.06] shrink-0">
              <span className="text-[10px] font-mono uppercase tracking-[0.15em] text-zinc-500">
                Whale Positions
              </span>
              <span className="text-[9px] font-mono text-zinc-700">
                {hlWhales.reduce((s, w) => s + w.positions.length, 0)} open
              </span>
            </div>
            {hlWhales.length === 0 ? (
              <div className="flex items-center justify-center flex-1 text-[10px] font-mono text-zinc-700">
                No active positions
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 p-2 flex-1 overflow-y-auto content-start">
                {hlWhales.map((whale) => (
                  <HLWhaleCard key={whale.address} whale={whale} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Bottom row (40%) */}
        <div className="flex flex-1 overflow-hidden min-h-0">
          {/* Left: News Feed (55%) */}
          <div className="border-r border-white/[0.06] overflow-hidden flex flex-col" style={{ width: "55%" }}>
            <NewsFeed news={news} />
          </div>
          {/* Right: Quick Actions (45%) */}
          <div className="overflow-hidden flex flex-col flex-1">
            <QuickActions lang={lang} />
          </div>
        </div>
      </div>

      {/* ── Mobile: tab-driven panels ─────────────────────────── */}
      <div className="lg:hidden flex-1 overflow-hidden min-h-0">
        {mobileTab === "market" && (
          <div className="h-full overflow-hidden flex flex-col">
            <TopMoversTable coins={topCoins} />
          </div>
        )}
        {mobileTab === "whales" && (
          <div className="h-full overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-3 py-2 border-b border-white/[0.06] shrink-0">
              <span className="text-[10px] font-mono uppercase tracking-[0.15em] text-zinc-500">
                Whale Positions
              </span>
              <span className="text-[9px] font-mono text-zinc-700">
                {hlWhales.reduce((s, w) => s + w.positions.length, 0)} open
              </span>
            </div>
            {hlWhales.length === 0 ? (
              <div className="flex items-center justify-center flex-1 text-[10px] font-mono text-zinc-700">
                No active positions
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2 p-2 flex-1 overflow-y-auto">
                {hlWhales.map((whale) => (
                  <HLWhaleCard key={whale.address} whale={whale} />
                ))}
              </div>
            )}
          </div>
        )}
        {mobileTab === "news" && (
          <div className="h-full overflow-hidden flex flex-col">
            <NewsFeed news={news} />
          </div>
        )}
      </div>
    </div>
  );
}
