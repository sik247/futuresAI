"use client";

import { useState, useEffect, useRef } from "react";
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

type BlogPost = {
  slug: string;
  title: string;
  titleKo: string;
  coin: string;
  symbol: string;
  direction: "LONG" | "SHORT" | "NEUTRAL";
  chartImage: string;
  price: number;
  rsi: number;
  publishedAt: string;
};

type YouTubeItem = {
  videoId: string;
  title: string;
  channelName: string;
  publishedAt: string;
  thumbnailUrl: string;
};

type SignalItem = {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  signal: string;
  direction: string;
  rsi: number;
  macdHistogram: number;
  confidence: number;
  volume24h: number;
};

type SignalsData = {
  signals: SignalItem[];
  fearGreed: { value: number; classification: string };
  btcTrend: string;
  marketSummary: string;
  updatedAt: string;
};

type PolymarketEvent = {
  id: string;
  title: string;
  image: string;
  volume: number;
  markets: {
    question: string;
    outcomePrices: string[];
    outcomes: string[];
    volume: number;
    groupItemTitle?: string;
    oneDayPriceChange?: number | string;
  }[];
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
  youtubeItems: YouTubeItem[];
  signals: SignalsData;
  polymarketEvents: PolymarketEvent[];
  blogPosts: BlogPost[];
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
  if (isNaN(v) || !isFinite(v)) return "--";
  if (v >= 10000) return v.toLocaleString(undefined, { maximumFractionDigits: 0 });
  if (v >= 1) return v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return v.toFixed(6);
}

function pctColor(v: number | null) {
  if (v === null) return "text-zinc-600";
  return v >= 0 ? "text-emerald-400" : "text-red-400";
}

function pctFmt(v: number | null) {
  if (v === null) return "--";
  return `${v >= 0 ? "+" : ""}${v.toFixed(2)}%`;
}

function timeAgo(date: Date | string) {
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
  const btcPriceRaw = btcData?.lastPrice ? parseFloat(btcData.lastPrice) : null;
  const btcPrice = btcPriceRaw !== null && !isNaN(btcPriceRaw) ? btcPriceRaw : null;
  const btcPctRaw = btcData?.priceChangePercent ? parseFloat(btcData.priceChangePercent) : null;
  const btcPct = btcPctRaw !== null && !isNaN(btcPctRaw) ? btcPctRaw : null;
  const ethPriceRaw = ethData?.lastPrice ? parseFloat(ethData.lastPrice) : null;
  const ethPrice = ethPriceRaw !== null && !isNaN(ethPriceRaw) ? ethPriceRaw : null;
  const ethPctRaw = ethData?.priceChangePercent ? parseFloat(ethData.priceChangePercent) : null;
  const ethPct = ethPctRaw !== null && !isNaN(ethPctRaw) ? ethPctRaw : null;
  const fg = fearGreed?.data?.[0];
  const mktCap = globalData?.data?.total_market_cap?.usd ?? null;
  const vol = globalData?.data?.total_volume?.usd ?? null;
  const btcDom = globalData?.data?.market_cap_percentage?.btc ?? null;

  return (
    <div className="flex items-center gap-2 px-4 py-2.5 bg-zinc-900/80 border-b border-white/[0.06] text-[13px] font-mono overflow-x-auto shrink-0 whitespace-nowrap">
      {/* BTC */}
      <span className="text-zinc-500">BTC</span>
      {btcPrice !== null && !isNaN(btcPrice) ? (
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
      {ethPrice !== null && !isNaN(ethPrice) ? (
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
        <span className="text-emerald-400 text-[12px] uppercase tracking-[0.15em]">LIVE</span>
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
  const topPositions = (whale.positions ?? []).slice(0, 4);
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
/*  News Cards                                                         */
/* ------------------------------------------------------------------ */

function ContentFeed({ news, youtubeItems, lang }: { news: CryptoNewsItem[]; youtubeItems: YouTubeItem[]; lang: string }) {
  // Interleave news and YouTube for visual variety
  type FeedItem = { type: "news"; data: CryptoNewsItem } | { type: "youtube"; data: YouTubeItem };
  const items: FeedItem[] = [];
  const maxNews = Math.min(news.length, 8);
  const maxYt = Math.min(youtubeItems.length, 4);
  let ni = 0, yi = 0;
  while (ni < maxNews || yi < maxYt) {
    if (ni < maxNews) items.push({ type: "news", data: news[ni++] });
    if (ni < maxNews) items.push({ type: "news", data: news[ni++] });
    if (yi < maxYt) items.push({ type: "youtube", data: youtubeItems[yi++] });
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto p-2 grid grid-cols-3 gap-2 auto-rows-min">
        {items.length === 0 ? (
          <div className="col-span-3 flex items-center justify-center py-6 text-[10px] font-mono text-zinc-700">No content</div>
        ) : (
          items.map((item, i) => {
            if (item.type === "youtube") {
              const yt = item.data;
              return (
                <a key={`yt-${yt.videoId}`} href={`https://www.youtube.com/watch?v=${yt.videoId}`} target="_blank" rel="noopener noreferrer"
                  className="group relative rounded-lg border border-white/[0.06] bg-white/[0.02] overflow-hidden hover:border-red-500/25 hover:bg-white/[0.04] transition-all cursor-pointer">
                  <div className="absolute top-2 right-2 z-10 px-1.5 py-0.5 rounded-full text-[8px] font-bold uppercase bg-red-500/20 text-red-400 border border-red-500/25">Video</div>
                  <div className="relative h-24 bg-zinc-900 overflow-hidden">
                    <img src={yt.thumbnailUrl} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                    <div className="absolute inset-0 bg-zinc-950/30 flex items-center justify-center">
                      <div className="w-8 h-8 rounded-full bg-red-600/90 flex items-center justify-center">
                        <svg className="w-3.5 h-3.5 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                      </div>
                    </div>
                  </div>
                  <div className="p-2">
                    <p className="text-[14px] text-zinc-300 group-hover:text-white leading-snug line-clamp-2 transition-colors">{yt.title}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-[12px] text-zinc-600">{yt.channelName}</span>
                      <span className="text-[12px] text-zinc-700">{timeAgo(new Date(yt.publishedAt))}</span>
                    </div>
                  </div>
                </a>
              );
            }
            const n = item.data;
            return (
              <a key={`n-${n.id ?? i}`} href={n.url} target="_blank" rel="noopener noreferrer"
                className="group relative rounded-lg border border-white/[0.06] bg-white/[0.02] overflow-hidden hover:border-blue-500/25 hover:bg-white/[0.04] transition-all cursor-pointer">
                <div className="absolute top-2 right-2 z-10 px-1.5 py-0.5 rounded-full text-[8px] font-bold uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/25">News</div>
                {n.imageUrl ? (
                  <div className="h-24 bg-zinc-900 overflow-hidden">
                    <img src={n.imageUrl} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                    <div className="absolute bottom-[calc(100%-96px+8px)] left-2">
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-zinc-950/70 backdrop-blur-sm text-[8px] font-mono text-blue-400 border border-white/[0.08]">
                        {n.source}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="h-24 bg-gradient-to-br from-blue-950/40 to-zinc-900 flex items-center justify-center">
                    <span className="text-xl font-bold text-white/[0.06]">{n.source[0]}</span>
                  </div>
                )}
                <div className="p-2">
                  <span className="text-[12px] font-mono text-zinc-600">{timeAgo(n.publishedAt)}</span>
                  <p className="text-[14px] text-zinc-300 group-hover:text-white leading-snug line-clamp-2 transition-colors mt-0.5">{n.title}</p>
                  {n.categories && n.categories.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {n.categories.slice(0, 2).map((cat) => (
                        <span key={cat} className="px-1 py-0.5 text-[10px] font-mono uppercase rounded bg-white/[0.04] text-zinc-600">{cat}</span>
                      ))}
                    </div>
                  )}
                </div>
              </a>
            );
          })
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Blog Research Cards                                                */
/* ------------------------------------------------------------------ */

function BlogCards({ posts, lang }: { posts: BlogPost[]; lang: string }) {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {posts.length === 0 ? (
          <div className="flex items-center justify-center py-6 text-[10px] font-mono text-zinc-700">
            No research posts
          </div>
        ) : (
          posts.slice(0, 5).map((post) => (
            <Link
              key={post.slug}
              href={`/${lang}/quant/blog/${post.slug}`}
              className="group flex gap-2.5 p-2 rounded-lg border border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12] hover:bg-white/[0.04] transition-all cursor-pointer"
            >
              {/* Chart thumbnail */}
              <div className="w-16 h-12 rounded bg-zinc-900 overflow-hidden shrink-0">
                <img
                  src={post.chartImage}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                  <span className="text-[11px] font-mono font-bold text-white bg-white/[0.08] px-1 py-0.5 rounded">
                    {post.symbol}
                  </span>
                  <span
                    className={`text-[11px] font-mono font-bold px-1 py-0.5 rounded ${
                      post.direction === "LONG"
                        ? "bg-emerald-500/15 text-emerald-400"
                        : post.direction === "SHORT"
                        ? "bg-red-500/15 text-red-400"
                        : "bg-zinc-500/15 text-zinc-400"
                    }`}
                  >
                    {post.direction}
                  </span>
                  <span className="text-[11px] font-mono text-zinc-600">RSI {post.rsi}</span>
                </div>
                <p className="text-[14px] text-zinc-300 group-hover:text-white leading-snug line-clamp-2 transition-colors">
                  {lang === "ko" ? post.titleKo : post.title}
                </p>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Quant Signals Widget                                               */
/* ------------------------------------------------------------------ */

function SignalsWidget({ signals, lang }: { signals: SignalsData; lang: string }) {
  const topSignals = (signals.signals || []).slice(0, 6);
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
        {topSignals.length === 0 ? (
          <div className="flex items-center justify-center h-full text-[10px] font-mono text-zinc-700">No signals</div>
        ) : (
          topSignals.map((s) => {
            const signalColor = s.signal === "Strong Buy" ? "text-emerald-300 bg-emerald-500/20 border-emerald-500/30" :
              s.signal === "Buy" ? "text-emerald-400 bg-emerald-500/15 border-emerald-500/25" :
              s.signal === "Sell" ? "text-red-400 bg-red-500/15 border-red-500/25" :
              s.signal === "Strong Sell" ? "text-red-300 bg-red-500/20 border-red-500/30" :
              "text-zinc-400 bg-zinc-500/15 border-zinc-500/25";
            const dirBg = s.direction === "LONG" ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" :
              s.direction === "SHORT" ? "bg-red-500/20 text-red-300 border-red-500/30" :
              "bg-zinc-500/15 text-zinc-400 border-zinc-500/25";
            const coinLetter = s.symbol[0];
            const coinColor = s.direction === "LONG" ? "bg-emerald-500/20 text-emerald-400" :
              s.direction === "SHORT" ? "bg-red-500/20 text-red-400" :
              "bg-zinc-700 text-zinc-400";
            return (
              <div key={s.symbol} className="rounded-lg border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.10] transition-all px-2.5 py-2.5">
                {/* Top row: coin icon + symbol/name + price + change */}
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold ${coinColor}`}>
                    {coinLetter}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="text-[13px] font-mono font-bold text-white">{s.symbol}</span>
                      <span className="text-[12px] font-mono text-zinc-600 truncate">{s.name}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[12px] font-mono text-zinc-300 tabular-nums">${fmtPrice(s.price)}</span>
                      <span className={`text-[12px] font-mono tabular-nums ${s.change24h >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                        {s.change24h >= 0 ? "+" : ""}{s.change24h?.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                  {/* Badges */}
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className={`text-[11px] font-mono font-bold px-1.5 py-0.5 rounded border ${signalColor}`}>{s.signal}</span>
                    <span className={`text-[11px] font-mono font-bold px-1.5 py-0.5 rounded border ${dirBg}`}>{s.direction}</span>
                  </div>
                </div>
                {/* Bottom row: RSI bar + confidence */}
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono text-zinc-600 shrink-0">RSI</span>
                  <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${s.rsi > 70 ? "bg-red-500" : s.rsi < 30 ? "bg-emerald-500" : "bg-blue-500"}`}
                      style={{ width: `${Math.min(s.rsi, 100)}%` }}
                    />
                  </div>
                  <span className={`text-[11px] font-mono tabular-nums shrink-0 ${s.rsi > 70 ? "text-red-400" : s.rsi < 30 ? "text-emerald-400" : "text-zinc-400"}`}>
                    {s.rsi?.toFixed(0)}
                  </span>
                  <span className="text-[11px] font-mono text-zinc-600 shrink-0">|</span>
                  <span className="text-[11px] font-mono text-zinc-400 tabular-nums shrink-0">{s.confidence}%</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Prediction Cards (Polymarket)                                      */
/* ------------------------------------------------------------------ */

function PredictionCards({ events, lang }: { events: PolymarketEvent[]; lang: string }) {
  // Parse multi-outcome events (Perplexity-style)
  const parsed = events
    .filter((e) => e.markets && e.markets.length > 0)
    .map((e) => {
      // Parse all outcomes for multi-market events
      const outcomes: { label: string; pct: number; change: number }[] = [];
      for (const m of e.markets.slice(0, 6)) {
        let prices: string[] = [];
        if (typeof m.outcomePrices === "string") {
          try { prices = JSON.parse(m.outcomePrices); } catch { prices = []; }
        } else if (Array.isArray(m.outcomePrices)) {
          prices = m.outcomePrices;
        }
        const yesPrice = parseFloat(prices[0] || "0");
        if (yesPrice <= 0.01) continue; // skip 0%
        const label = m.groupItemTitle || m.question || "";
        const change = typeof m.oneDayPriceChange === "number" ? m.oneDayPriceChange * 100 :
          typeof m.oneDayPriceChange === "string" ? parseFloat(m.oneDayPriceChange) * 100 : 0;
        outcomes.push({ label, pct: yesPrice * 100, change });
      }
      if (outcomes.length === 0) return null;
      // Sort by probability descending
      outcomes.sort((a, b) => b.pct - a.pct);
      const totalVol = e.volume || 0;
      return { ...e, outcomes: outcomes.slice(0, 4), totalVol };
    })
    .filter(Boolean)
    .slice(0, 8) as (PolymarketEvent & { outcomes: { label: string; pct: number; change: number }[]; totalVol: number })[];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto p-2 space-y-3">
        {parsed.length === 0 ? (
          <div className="flex items-center justify-center h-full text-[11px] font-mono text-zinc-700">
            No active predictions
          </div>
        ) : (
          parsed.map((event) => (
            <div key={event.id} className="rounded-lg border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.12] transition-all p-3">
              {/* Header: title + volume */}
              <div className="flex items-start justify-between gap-2 mb-2.5">
                <h3 className="text-[15px] font-semibold text-zinc-100 leading-snug flex-1">{event.title}</h3>
                {event.totalVol > 0 && (
                  <span className="text-[12px] font-mono text-zinc-600 bg-white/[0.04] px-1.5 py-0.5 rounded shrink-0 tabular-nums">
                    {fmtUsd(event.totalVol)} vol
                  </span>
                )}
              </div>

              {/* Outcomes table */}
              <div className="space-y-1.5">
                {event.outcomes.map((o, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-[13px] text-zinc-400 flex-1 truncate">{o.label}</span>
                    <span className="text-[14px] font-mono font-bold text-zinc-200 tabular-nums w-12 text-right">{o.pct.toFixed(0)}%</span>
                    <span className={`text-[12px] font-mono tabular-nums w-14 text-right ${
                      o.change > 0 ? "text-emerald-400" : o.change < 0 ? "text-red-400" : "text-zinc-600"
                    }`}>
                      {o.change > 0 ? "↑" : o.change < 0 ? "↓" : "—"} {Math.abs(o.change).toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>

              {/* Analysis text */}
              <p className="text-[12px] text-zinc-500 leading-relaxed mt-2">
                {event.outcomes[0] && `${event.outcomes[0].label} leads at ${event.outcomes[0].pct.toFixed(0)}% probability${
                  event.outcomes[0].change !== 0 ? `, ${event.outcomes[0].change > 0 ? "up" : "down"} ${Math.abs(event.outcomes[0].change).toFixed(1)}% in 24h` : ""
                }. ${event.outcomes.length > 1 ? `${event.outcomes[1].label} follows at ${event.outcomes[1].pct.toFixed(0)}%.` : ""}`}
              </p>

              {/* Footer */}
              <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-white/[0.04]">
                {event.image && (
                  <img src={event.image} alt="" className="w-4 h-4 rounded-full" />
                )}
                <span className="text-[11px] font-mono text-zinc-600">
                  {event.markets.length} {event.markets.length === 1 ? "market" : "markets"}
                </span>
                <span className="text-[11px] font-mono text-blue-400">Polymarket</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}


const FREE_MSG_LIMIT = 5;

type ChatMsg = {
  role: "user" | "ai";
  text: string;
  ticker?: { symbol: string; exchange: string };
  news?: { title: string; url: string; source: string }[];
};

function ChatWidget({ lang }: { lang: string }) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [loading, setLoading] = useState(false);
  const [msgCount, setMsgCount] = useState(0);
  const ko = lang === "ko";
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  const atLimit = msgCount >= FREE_MSG_LIMIT;

  const suggestions = ko
    ? ["BTC 지금 사도 될까요?", "ETH 분석해줘", "오늘 시장 전망은?"]
    : ["Should I buy BTC now?", "Analyze ETH for me", "Market outlook today?"];

  const handleSend = async (msg?: string) => {
    const text = (msg || input).trim();
    if (!text || loading || atLimit) return;
    setMessages((prev) => [...prev, { role: "user", text }]);
    setInput("");
    setLoading(true);
    setMsgCount((c) => c + 1);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, persona: "crypto", sessionId: "home-widget", lang }),
      });
      const data = await res.json();
      if (data.error === "Daily message limit reached") {
        setMessages((prev) => [...prev, { role: "ai", text: ko ? "일일 무료 메시지 한도에 도달했습니다. 프리미엄으로 업그레이드하세요." : "Free message limit reached. Upgrade to Premium for more." }]);
        setMsgCount(FREE_MSG_LIMIT);
      } else {
        setMessages((prev) => [...prev, {
          role: "ai",
          text: data.response || data.error || "No response",
          ticker: data.ticker ?? undefined,
          news: data.news ?? undefined,
        }]);
      }
    } catch {
      setMessages((prev) => [...prev, { role: "ai", text: "Error. Try again." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30 flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
            </div>
            <p className="text-xs text-zinc-400 text-center">{ko ? "AI 퀀트 애널리스트에게\n무엇이든 물어보세요" : "Ask our AI quant analyst\nanything about crypto"}</p>
            <div className="flex flex-col gap-1.5 w-full px-2">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(s)}
                  className="text-left text-[11px] text-zinc-400 bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2 hover:bg-white/[0.06] hover:border-white/[0.1] hover:text-zinc-200 transition-all cursor-pointer"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[90%] rounded-xl px-3 py-2 ${
                m.role === "user"
                  ? "bg-blue-600/20 border border-blue-500/30 text-blue-100"
                  : "bg-white/[0.04] border border-white/[0.06] text-zinc-300"
              }`}>
                <p className="text-[12px] leading-relaxed whitespace-pre-wrap">{m.text}</p>
                {/* TradingView chart if ticker detected */}
                {m.ticker && (
                  <div className="mt-2 rounded-lg overflow-hidden border border-white/[0.06]">
                    <div className="flex items-center gap-2 px-2 py-1 border-b border-white/[0.06] bg-zinc-900/60">
                      <span className="w-1 h-1 rounded-full bg-emerald-500" />
                      <span className="text-[10px] font-mono text-zinc-400">{m.ticker.exchange}:{m.ticker.symbol}</span>
                    </div>
                    <iframe
                      src={`https://s.tradingview.com/widgetembed/?frameElementId=tv_mini&symbol=${m.ticker.exchange}:${m.ticker.symbol}&interval=D&hidesidetoolbar=1&symboledit=0&saveimage=0&toolbarbg=0a0a0f&studies=[]&theme=dark&style=1&timezone=exchange&withdateranges=0&showpopupbutton=0&locale=${ko ? "kr" : "en"}&width=100%25&height=200`}
                      className="w-full border-0"
                      style={{ height: 200 }}
                      title={`${m.ticker.symbol} Chart`}
                    />
                  </div>
                )}
                {/* Related news */}
                {m.news && m.news.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {m.news.slice(0, 3).map((n, ni) => (
                      <a key={ni} href={n.url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-[10px] text-zinc-500 hover:text-blue-400 transition-colors">
                        <span className="w-3 h-3 rounded-sm bg-blue-500/15 flex items-center justify-center text-[7px] font-bold text-blue-400">{ni + 1}</span>
                        <span className="truncate">{n.title}</span>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white/[0.04] border border-white/[0.06] rounded-xl px-3 py-2">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" />
              </div>
            </div>
          </div>
        )}
      </div>
      {/* Input area or premium lock */}
      {atLimit ? (
        <div className="border-t border-white/[0.06] p-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" d="M12 1.5a5.25 5.25 0 00-5.25 5.25v3a3 3 0 00-3 3v6.75a3 3 0 003 3h10.5a3 3 0 003-3v-6.75a3 3 0 00-3-3v-3c0-2.9-2.35-5.25-5.25-5.25zm3.75 8.25v-3a3.75 3.75 0 10-7.5 0v3h7.5z" clipRule="evenodd" /></svg>
            <span className="text-[12px] font-semibold text-amber-400">{ko ? "무료 메시지 소진" : "Free messages used"}</span>
          </div>
          <p className="text-[11px] text-zinc-500 mb-3">{ko ? "프리미엄으로 업그레이드하여 무제한 AI 분석을 받으세요" : "Upgrade to Premium for unlimited AI analysis"}</p>
          <Link href={`/${lang}/pricing`} className="inline-block px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-lg text-[11px] font-semibold hover:from-amber-400 hover:to-amber-500 transition-all cursor-pointer">
            {ko ? "프리미엄 시작 →" : "Get Premium →"}
          </Link>
        </div>
      ) : (
        <>
          <div className="border-t border-white/[0.06] p-2.5 flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder={ko ? "BTC 전망이 어때요?" : "What's the outlook for BTC?"}
              className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500/40 transition-colors"
              disabled={loading}
            />
            <button
              onClick={() => handleSend()}
              disabled={loading || !input.trim()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold disabled:opacity-30 cursor-pointer transition-colors"
            >
              {loading ? "..." : ko ? "전송" : "Send"}
            </button>
          </div>
          <div className="flex items-center justify-between px-3 py-1.5 border-t border-white/[0.04]">
            <span className="text-[9px] text-zinc-600">{ko ? `무료 ${FREE_MSG_LIMIT - msgCount}/${FREE_MSG_LIMIT}` : `Free ${FREE_MSG_LIMIT - msgCount}/${FREE_MSG_LIMIT}`}</span>
            <Link href={`/${lang}/chat`} className="text-[10px] text-blue-400 hover:text-blue-300 font-medium transition-colors">
              {ko ? "전체 채팅 →" : "Full chat →"}
            </Link>
          </div>
        </>
      )}
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
  topCoins: _topCoins,
  hlWhales,
  news,
  youtubeItems,
  signals,
  polymarketEvents,
  blogPosts,
}: HomeDashboardProps) {
  const ko = lang === "ko";

  return (
    <div className="bg-zinc-950 font-mono flex flex-col" style={{ height: "calc(100vh - 92px)" }}>
      <StatBar
        btcData={btcData}
        ethData={ethData}
        fearGreed={fearGreed}
        globalData={globalData}
      />

      {/* ── Desktop: 3-column layout ── */}
      <div className="hidden lg:flex flex-1 overflow-hidden">
        {/* LEFT: Prediction Markets (30%) */}
        <div className="border-r border-white/[0.06] flex flex-col overflow-hidden" style={{ width: "30%" }}>
          <div className="px-4 py-2.5 border-b border-white/[0.06] flex items-center justify-between shrink-0">
            <span className="text-[13px] font-mono uppercase tracking-[0.12em] text-zinc-400 font-semibold">{ko ? "예측 시장" : "Prediction Markets"}</span>
            <Link href={`/${lang}/markets`} className="text-[11px] text-blue-400 hover:text-blue-300">All →</Link>
          </div>
          <div className="flex-1 overflow-y-auto">
            <PredictionCards events={polymarketEvents} lang={lang} />
          </div>
        </div>

        {/* CENTER: Chart + News + Signals + Research (40%) */}
        <div className="border-r border-white/[0.06] flex flex-col overflow-hidden" style={{ width: "40%" }}>
          {/* TradingView Chart (top 35%) */}
          <div className="border-b border-white/[0.06] flex flex-col overflow-hidden" style={{ flex: "35 0 0", minHeight: 0 }}>
            <div className="px-4 py-2 border-b border-white/[0.06] flex items-center gap-3 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[13px] font-mono text-zinc-300">BTC/USDT</span>
              <span className="text-[11px] font-mono text-zinc-600 uppercase tracking-wider">Live</span>
            </div>
            <div className="flex-1 overflow-hidden">
              <iframe
                src="https://s.tradingview.com/widgetembed/?frameElementId=tv_chart&symbol=BINANCE:BTCUSDT&interval=D&hidesidetoolbar=1&symboledit=1&saveimage=0&toolbarbg=0a0a0f&studies=[]&theme=dark&style=1&timezone=exchange&withdateranges=1&showpopupbutton=0&locale=en&width=100%25&height=100%25"
                className="w-full h-full border-0"
                title="BTC/USDT Chart"
              />
            </div>
          </div>

          {/* Bottom: News | Signals | Research — 3 equal columns (65%) */}
          <div className="flex overflow-hidden" style={{ flex: "65 0 0", minHeight: 0 }}>
            {/* News Feed */}
            <div className="border-r border-white/[0.06] flex flex-col overflow-hidden flex-1">
              <div className="px-3 py-2 border-b border-white/[0.06] flex items-center justify-between shrink-0">
                <span className="text-[12px] font-mono uppercase tracking-[0.12em] text-zinc-400">{ko ? "뉴스" : "News"}</span>
                <Link href={`/${lang}/sns`} className="text-[10px] text-blue-400">All →</Link>
              </div>
              <div className="flex-1 overflow-y-auto">
                <ContentFeed news={news} youtubeItems={youtubeItems} lang={lang} />
              </div>
            </div>

            {/* Quant Signals */}
            <div className="border-r border-white/[0.06] flex flex-col overflow-hidden flex-1">
              <div className="px-3 py-2 border-b border-white/[0.06] flex items-center justify-between shrink-0">
                <span className="text-[12px] font-mono uppercase tracking-[0.12em] text-zinc-400">{ko ? "시그널" : "Signals"}</span>
                <Link href={`/${lang}/quant`} className="text-[10px] text-blue-400">All →</Link>
              </div>
              <div className="flex-1 overflow-y-auto">
                <SignalsWidget signals={signals} lang={lang} />
              </div>
            </div>

            {/* Market Research */}
            <div className="flex flex-col overflow-hidden flex-1">
              <div className="px-3 py-2 border-b border-white/[0.06] flex items-center justify-between shrink-0">
                <span className="text-[12px] font-mono uppercase tracking-[0.12em] text-zinc-400">{ko ? "리서치" : "Research"}</span>
                <Link href={`/${lang}/quant`} className="text-[10px] text-blue-400">All →</Link>
              </div>
              <div className="flex-1 overflow-y-auto">
                <BlogCards posts={blogPosts} lang={lang} />
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: AI Quant Chat (30%) */}
        <div className="flex flex-col overflow-hidden flex-1">
          <div className="px-4 py-2.5 border-b border-white/[0.06] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
              <span className="text-[13px] font-mono uppercase tracking-[0.12em] text-zinc-400 font-semibold">{ko ? "AI 퀀트 채팅" : "AI Quant Chat"}</span>
            </div>
            <Link href={`/${lang}/chat`} className="text-[11px] text-blue-400 hover:text-blue-300">{ko ? "전체 →" : "Full →"}</Link>
          </div>
          <div className="flex-1 overflow-hidden">
            <ChatWidget lang={lang} />
          </div>
        </div>
      </div>

      {/* (old layout removed) */}

      {/* Mobile: simple scrollable stack */}
      <div className="lg:hidden flex-1 overflow-auto p-3 space-y-4">
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
          <div className="px-4 py-2.5 border-b border-white/[0.06] flex items-center justify-between">
            <span className="text-[13px] font-mono uppercase tracking-[0.12em] text-zinc-400">
              {ko ? "예측 시장" : "Prediction Markets"}
            </span>
            <Link href={`/${lang}/markets`} className="text-[12px] text-blue-400">All →</Link>
          </div>
          <div className="max-h-96 overflow-y-auto">
            <PredictionCards events={polymarketEvents} lang={lang} />
          </div>
        </div>
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
          <div className="px-4 py-2.5 border-b border-white/[0.06] flex items-center justify-between">
            <span className="text-[13px] font-mono uppercase tracking-[0.12em] text-zinc-400">
              {ko ? "웨일 포지션" : "Whale Positions"}
            </span>
            <Link href={`/${lang}/whales`} className="text-[12px] text-blue-400">All →</Link>
          </div>
          <div className="max-h-96 overflow-y-auto p-2">
            <div className="grid grid-cols-2 gap-2">
              {hlWhales.slice(0, 6).map((whale) => (
                <HLWhaleCard key={whale.address} whale={whale} />
              ))}
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
          <div className="px-4 py-2.5 border-b border-white/[0.06] flex items-center justify-between">
            <span className="text-[13px] font-mono uppercase tracking-[0.12em] text-zinc-400">
              {ko ? "퀀트 시그널" : "Quant Signals"}
            </span>
            <Link href={`/${lang}/quant`} className="text-[12px] text-blue-400">All →</Link>
          </div>
          <div className="max-h-96 overflow-y-auto">
            <SignalsWidget signals={signals} lang={lang} />
          </div>
        </div>
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
          <div className="px-4 py-2.5 border-b border-white/[0.06] flex items-center justify-between">
            <span className="text-[13px] font-mono uppercase tracking-[0.12em] text-zinc-400">
              {ko ? "뉴스 피드" : "News Feed"}
            </span>
            <Link href={`/${lang}/news`} className="text-[12px] text-blue-400">All →</Link>
          </div>
          <div className="max-h-96 overflow-y-auto">
            <ContentFeed news={news} youtubeItems={youtubeItems} lang={lang} />
          </div>
        </div>
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
          <div className="px-4 py-2.5 border-b border-white/[0.06] flex items-center justify-between">
            <span className="text-[13px] font-mono uppercase tracking-[0.12em] text-zinc-400">
              {ko ? "마켓 리서치" : "Market Research"}
            </span>
            <Link href={`/${lang}/quant`} className="text-[12px] text-blue-400">All →</Link>
          </div>
          <div className="max-h-96 overflow-y-auto">
            <BlogCards posts={blogPosts} lang={lang} />
          </div>
        </div>
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
          <div className="px-4 py-2.5 border-b border-white/[0.06] flex items-center justify-between">
            <span className="text-[13px] font-mono uppercase tracking-[0.12em] text-zinc-400">
              {ko ? "AI 채팅" : "AI Chat"}
            </span>
            <Link href={`/${lang}/chat`} className="text-[12px] text-blue-400">{ko ? "전체 →" : "Full →"}</Link>
          </div>
          <div className="h-80 overflow-hidden">
            <ChatWidget lang={lang} />
          </div>
        </div>
      </div>
    </div>
  );
}
