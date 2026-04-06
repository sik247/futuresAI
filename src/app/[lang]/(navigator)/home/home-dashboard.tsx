"use client";

import { useState } from "react";
import Link from "next/link";
import type { JSX } from "react";
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
    <div className="flex items-center gap-2 px-4 py-2.5 bg-zinc-900/80 border-b border-white/[0.06] text-xs font-mono overflow-x-auto shrink-0 whitespace-nowrap">
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
                    <p className="text-[10px] text-zinc-300 group-hover:text-white leading-snug line-clamp-2 transition-colors">{yt.title}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-[8px] text-zinc-600">{yt.channelName}</span>
                      <span className="text-[8px] text-zinc-700">{timeAgo(new Date(yt.publishedAt))}</span>
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
                  <span className="text-[8px] font-mono text-zinc-600">{timeAgo(n.publishedAt)}</span>
                  <p className="text-[10px] text-zinc-300 group-hover:text-white leading-snug line-clamp-2 transition-colors mt-0.5">{n.title}</p>
                  {n.categories && n.categories.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {n.categories.slice(0, 2).map((cat) => (
                        <span key={cat} className="px-1 py-0.5 text-[7px] font-mono uppercase rounded bg-white/[0.04] text-zinc-600">{cat}</span>
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
                  <span className="text-[8px] font-mono font-bold text-white bg-white/[0.08] px-1 py-0.5 rounded">
                    {post.symbol}
                  </span>
                  <span
                    className={`text-[8px] font-mono font-bold px-1 py-0.5 rounded ${
                      post.direction === "LONG"
                        ? "bg-emerald-500/15 text-emerald-400"
                        : post.direction === "SHORT"
                        ? "bg-red-500/15 text-red-400"
                        : "bg-zinc-500/15 text-zinc-400"
                    }`}
                  >
                    {post.direction}
                  </span>
                  <span className="text-[8px] font-mono text-zinc-600">RSI {post.rsi}</span>
                </div>
                <p className="text-[10px] text-zinc-300 group-hover:text-white leading-snug line-clamp-2 transition-colors">
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
                      <span className="text-[10px] font-mono font-bold text-white">{s.symbol}</span>
                      <span className="text-[8px] font-mono text-zinc-600 truncate">{s.name}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] font-mono text-zinc-300 tabular-nums">${fmtPrice(s.price)}</span>
                      <span className={`text-[9px] font-mono tabular-nums ${s.change24h >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                        {s.change24h >= 0 ? "+" : ""}{s.change24h?.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                  {/* Badges */}
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${signalColor}`}>{s.signal}</span>
                    <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${dirBg}`}>{s.direction}</span>
                  </div>
                </div>
                {/* Bottom row: RSI bar + confidence */}
                <div className="flex items-center gap-2">
                  <span className="text-[8px] font-mono text-zinc-600 shrink-0">RSI</span>
                  <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${s.rsi > 70 ? "bg-red-500" : s.rsi < 30 ? "bg-emerald-500" : "bg-blue-500"}`}
                      style={{ width: `${Math.min(s.rsi, 100)}%` }}
                    />
                  </div>
                  <span className={`text-[9px] font-mono tabular-nums shrink-0 ${s.rsi > 70 ? "text-red-400" : s.rsi < 30 ? "text-emerald-400" : "text-zinc-400"}`}>
                    {s.rsi?.toFixed(0)}
                  </span>
                  <span className="text-[8px] font-mono text-zinc-600 shrink-0">|</span>
                  <span className="text-[9px] font-mono text-zinc-400 tabular-nums shrink-0">{s.confidence}%</span>
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
                <h3 className="text-[12px] font-semibold text-zinc-100 leading-snug flex-1">{event.title}</h3>
                {event.totalVol > 0 && (
                  <span className="text-[9px] font-mono text-zinc-600 bg-white/[0.04] px-1.5 py-0.5 rounded shrink-0 tabular-nums">
                    {fmtUsd(event.totalVol)} vol
                  </span>
                )}
              </div>

              {/* Outcomes table */}
              <div className="space-y-1.5">
                {event.outcomes.map((o, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-[11px] text-zinc-400 flex-1 truncate">{o.label}</span>
                    <span className="text-[11px] font-mono font-bold text-zinc-200 tabular-nums w-12 text-right">{o.pct.toFixed(0)}%</span>
                    <span className={`text-[10px] font-mono tabular-nums w-14 text-right ${
                      o.change > 0 ? "text-emerald-400" : o.change < 0 ? "text-red-400" : "text-zinc-600"
                    }`}>
                      {o.change > 0 ? "↑" : o.change < 0 ? "↓" : "—"} {Math.abs(o.change).toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-white/[0.04]">
                {event.image && (
                  <img src={event.image} alt="" className="w-4 h-4 rounded-full" />
                )}
                <span className="text-[8px] font-mono text-zinc-600">
                  {event.markets.length} {event.markets.length === 1 ? "market" : "markets"}
                </span>
                <span className="text-[8px] font-mono text-blue-400">Polymarket</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Widget System                                                      */
/* ------------------------------------------------------------------ */

const WIDGET_KEYS = ["predictions", "feed", "signals", "chat", "research"] as const;
type WidgetKey = typeof WIDGET_KEYS[number];

const WIDGET_META: Record<WidgetKey, { label: string; labelKo: string; icon: JSX.Element }> = {
  predictions: {
    label: "Predictions",
    labelKo: "예측 시장",
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </svg>
    ),
  },
  feed: {
    label: "Feed",
    labelKo: "뉴스",
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 01-2.25 2.25M16.5 7.5V18a2.25 2.25 0 002.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 002.25 2.25h13.5M6 7.5h3v3H6V7.5z" />
      </svg>
    ),
  },
  signals: {
    label: "Signals",
    labelKo: "시그널",
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z" />
      </svg>
    ),
  },
  chat: {
    label: "AI Chat",
    labelKo: "AI 채팅",
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
      </svg>
    ),
  },
  research: {
    label: "Research",
    labelKo: "리서치",
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
      </svg>
    ),
  },
};

const DEFAULT_WIDGETS: Record<WidgetKey, boolean> = {
  predictions: true,
  feed: true,
  signals: true,
  chat: true,
  research: true,
};

function WidgetCard({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/[0.06] shrink-0">
        <span className="text-[11px] font-mono uppercase tracking-[0.15em] text-zinc-400">{title}</span>
        <button onClick={onClose} className="text-zinc-600 hover:text-red-400 transition-colors cursor-pointer p-0.5">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="flex-1 overflow-auto">{children}</div>
    </div>
  );
}

function ChatWidget({ lang }: { lang: string }) {
  const [input, setInput] = useState("");
  const [lastResponse, setLastResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const ko = lang === "ko";

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input, persona: "crypto", sessionId: "widget", lang }),
      });
      const data = await res.json();
      setLastResponse(data.response || data.error || "No response");
      setInput("");
    } catch {
      setLastResponse("Error. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-3">
        {lastResponse ? (
          <div className="text-[11px] text-zinc-300 leading-relaxed whitespace-pre-wrap">{lastResponse}</div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <span className="text-2xl mb-2">🤖</span>
            <p className="text-[11px] text-zinc-500">{ko ? "암호화폐에 대해 물어보세요" : "Ask about any crypto"}</p>
          </div>
        )}
      </div>
      <div className="border-t border-white/[0.06] p-2 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder={ko ? "질문하기..." : "Ask anything..."}
          className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-1.5 text-[11px] text-white placeholder-zinc-600 focus:outline-none focus:border-white/[0.16]"
          disabled={loading}
        />
        <button
          onClick={handleSend}
          disabled={loading || !input.trim()}
          className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-[10px] font-mono disabled:opacity-30 cursor-pointer hover:bg-blue-500"
        >
          {loading ? "..." : "Ask"}
        </button>
      </div>
      <Link
        href={`/${lang}/chat`}
        className="text-center py-1.5 text-[9px] text-blue-400 hover:text-blue-300 border-t border-white/[0.04]"
      >
        {ko ? "전체 채팅 열기 →" : "Open full chat →"}
      </Link>
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
  hlWhales: _hlWhales,
  news,
  youtubeItems,
  signals,
  polymarketEvents,
  blogPosts,
}: HomeDashboardProps) {
  const [widgets, setWidgets] = useState<Record<WidgetKey, boolean>>(() => {
    if (typeof window === "undefined") return { ...DEFAULT_WIDGETS };
    try {
      const saved = localStorage.getItem("dashboard-widgets");
      return saved ? JSON.parse(saved) : { ...DEFAULT_WIDGETS };
    } catch {
      return { ...DEFAULT_WIDGETS };
    }
  });

  const toggleWidget = (key: WidgetKey) => {
    setWidgets((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      if (typeof window !== "undefined") {
        localStorage.setItem("dashboard-widgets", JSON.stringify(next));
      }
      return next;
    });
  };

  const ko = lang === "ko";

  return (
    <div className="bg-zinc-950 font-mono flex flex-col" style={{ height: "calc(100vh - 92px)" }}>
      {/* Stat Bar */}
      <StatBar
        btcData={btcData}
        ethData={ethData}
        fearGreed={fearGreed}
        globalData={globalData}
      />

      {/* Widget Toggle Bar */}
      <div className="flex items-center gap-1.5 px-3 py-2 border-b border-white/[0.06] bg-zinc-900/40 shrink-0 overflow-x-auto">
        <span className="text-[9px] font-mono text-zinc-600 uppercase tracking-wider shrink-0 mr-1">Widgets:</span>
        {WIDGET_KEYS.map((key) => {
          const meta = WIDGET_META[key];
          const active = widgets[key];
          return (
            <button
              key={key}
              onClick={() => toggleWidget(key)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-mono transition-all cursor-pointer shrink-0 ${
                active
                  ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                  : "bg-white/[0.02] text-zinc-600 border border-white/[0.04] hover:text-zinc-400"
              }`}
            >
              {meta.icon}
              <span>{ko ? meta.labelKo : meta.label}</span>
              {active && (
                <svg className="w-3 h-3 ml-0.5 text-zinc-600 hover:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Desktop: Fixed panel layout (bigger, cleaner) ──── */}
      <div className="hidden lg:flex flex-col flex-1 overflow-hidden min-h-0">
        {/* Top row — Predictions + Feed + Signals */}
        <div className="flex border-b border-white/[0.06] overflow-hidden" style={{ flex: "1 1 0" }}>
          {/* Predictions (35%) */}
          {widgets.predictions && (
            <div className="border-r border-white/[0.06] overflow-hidden flex flex-col" style={{ width: "35%" }}>
              <WidgetCard title={ko ? "예측 시장" : "Predictions"} onClose={() => toggleWidget("predictions")}>
                <PredictionCards events={polymarketEvents} lang={lang} />
              </WidgetCard>
            </div>
          )}
          {/* News Feed (40%) */}
          {widgets.feed && (
            <div className="border-r border-white/[0.06] overflow-hidden flex flex-col" style={{ width: "40%" }}>
              <WidgetCard title={ko ? "뉴스 피드" : "Feed"} onClose={() => toggleWidget("feed")}>
                <ContentFeed news={news} youtubeItems={youtubeItems} lang={lang} />
              </WidgetCard>
            </div>
          )}
          {/* Quant Signals (25%) */}
          {widgets.signals && (
            <div className="overflow-hidden flex flex-col flex-1">
              <WidgetCard title={ko ? "퀀트 시그널" : "Signals"} onClose={() => toggleWidget("signals")}>
                <SignalsWidget signals={signals} lang={lang} />
              </WidgetCard>
            </div>
          )}
        </div>

        {/* Bottom row — AI Chat + Research */}
        <div className="flex overflow-hidden" style={{ flex: "1 1 0" }}>
          {/* AI Chat (40%) */}
          {widgets.chat && (
            <div className="border-r border-white/[0.06] overflow-hidden flex flex-col" style={{ width: "40%" }}>
              <WidgetCard title={ko ? "AI 채팅" : "AI Chat"} onClose={() => toggleWidget("chat")}>
                <ChatWidget lang={lang} />
              </WidgetCard>
            </div>
          )}
          {/* Market Research (60%) */}
          {widgets.research && (
            <div className="overflow-hidden flex flex-col flex-1">
              <WidgetCard title={ko ? "마켓 리서치" : "Market Research"} onClose={() => toggleWidget("research")}>
                <BlogCards posts={blogPosts} lang={lang} />
              </WidgetCard>
            </div>
          )}
        </div>
      </div>

      {/* ── Mobile: scrollable widgets ──── */}
      <div className="lg:hidden flex-1 overflow-auto p-3 space-y-3">
        {widgets.predictions && (
          <WidgetCard title={ko ? "예측 시장" : "Predictions"} onClose={() => toggleWidget("predictions")}>
            <PredictionCards events={polymarketEvents} lang={lang} />
          </WidgetCard>
        )}
        {widgets.feed && (
          <WidgetCard title={ko ? "뉴스 피드" : "Feed"} onClose={() => toggleWidget("feed")}>
            <ContentFeed news={news} youtubeItems={youtubeItems} lang={lang} />
          </WidgetCard>
        )}
        {widgets.signals && (
          <WidgetCard title={ko ? "퀀트 시그널" : "Signals"} onClose={() => toggleWidget("signals")}>
            <SignalsWidget signals={signals} lang={lang} />
          </WidgetCard>
        )}
        {widgets.chat && (
          <WidgetCard title={ko ? "AI 채팅" : "AI Chat"} onClose={() => toggleWidget("chat")}>
            <ChatWidget lang={lang} />
          </WidgetCard>
        )}
        {widgets.research && (
          <WidgetCard title={ko ? "마켓 리서치" : "Market Research"} onClose={() => toggleWidget("research")}>
            <BlogCards posts={blogPosts} lang={lang} />
          </WidgetCard>
        )}
      </div>
    </div>
  );
}
