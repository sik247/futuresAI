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
  const btcPrice = btcData ? parseFloat(btcData.lastPrice) : null;
  const btcPct = btcData ? parseFloat(btcData.priceChangePercent) : null;
  const ethPrice = ethData ? parseFloat(ethData.lastPrice) : null;
  const ethPct = ethData ? parseFloat(ethData.priceChangePercent) : null;
  const fg = fearGreed?.data?.[0];
  const mktCap = globalData?.data?.total_market_cap?.usd ?? null;
  const vol = globalData?.data?.total_volume?.usd ?? null;
  const btcDom = globalData?.data?.market_cap_percentage?.btc ?? null;

  return (
    <div className="flex items-center gap-2 px-4 py-2.5 bg-zinc-900/80 border-b border-white/[0.06] text-xs font-mono overflow-x-auto shrink-0 whitespace-nowrap">
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
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/[0.06] shrink-0">
        <span className="text-[10px] font-mono uppercase tracking-[0.15em] text-zinc-500">Feed</span>
        <Link href={`/${lang}/sns`} className="text-[9px] font-mono text-blue-400 hover:text-blue-300 transition-colors">All →</Link>
      </div>
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
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/[0.06] shrink-0">
        <span className="text-[10px] font-mono uppercase tracking-[0.15em] text-zinc-500">Market Research</span>
        <Link href={`/${lang}/quant`} className="text-[9px] font-mono text-blue-400 hover:text-blue-300 transition-colors">
          All →
        </Link>
      </div>
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
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/[0.06] shrink-0">
        <span className="text-[10px] font-mono uppercase tracking-[0.15em] text-zinc-500">Quant Signals</span>
        <Link href={`/${lang}/quant`} className="text-[9px] font-mono text-blue-400 hover:text-blue-300 transition-colors">All →</Link>
      </div>
      <div className="flex-1 overflow-y-auto">
        {topSignals.length === 0 ? (
          <div className="flex items-center justify-center h-full text-[10px] font-mono text-zinc-700">No signals</div>
        ) : (
          topSignals.map((s) => {
            const signalColor = s.signal === "Strong Buy" ? "text-emerald-400 bg-emerald-500/15" :
              s.signal === "Buy" ? "text-emerald-400 bg-emerald-500/10" :
              s.signal === "Sell" ? "text-red-400 bg-red-500/10" :
              s.signal === "Strong Sell" ? "text-red-400 bg-red-500/15" :
              "text-zinc-400 bg-zinc-500/10";
            const dirColor = s.direction === "LONG" ? "text-emerald-400" : s.direction === "SHORT" ? "text-red-400" : "text-zinc-500";
            return (
              <div key={s.symbol} className="flex items-center gap-2 px-3 py-1.5 border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                <span className="text-[10px] font-mono font-bold text-white w-10">{s.symbol}</span>
                <span className={`text-[8px] font-mono font-bold px-1.5 py-0.5 rounded ${signalColor}`}>{s.signal}</span>
                <span className={`text-[8px] font-mono font-bold ${dirColor}`}>{s.direction}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="text-[8px] font-mono text-zinc-600">RSI</span>
                    <div className="flex-1 h-1 bg-zinc-800 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${s.rsi > 70 ? "bg-red-500" : s.rsi < 30 ? "bg-emerald-500" : "bg-blue-500"}`} style={{ width: `${Math.min(s.rsi, 100)}%` }} />
                    </div>
                    <span className={`text-[8px] font-mono tabular-nums ${s.rsi > 70 ? "text-red-400" : s.rsi < 30 ? "text-emerald-400" : "text-zinc-400"}`}>{s.rsi?.toFixed(0)}</span>
                  </div>
                </div>
                <span className="text-[9px] font-mono text-zinc-600 tabular-nums">{s.confidence}%</span>
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
  // Parse and filter predictions
  const interesting = events
    .map((e) => {
      if (!e.markets || e.markets.length === 0) return null;
      const m = e.markets[0];
      // outcomePrices can be a JSON string or already parsed array
      let prices: string[] = [];
      if (typeof m.outcomePrices === "string") {
        try { prices = JSON.parse(m.outcomePrices); } catch { prices = []; }
      } else if (Array.isArray(m.outcomePrices)) {
        prices = m.outcomePrices;
      }
      if (prices.length < 2) return null;
      const yesPrice = parseFloat(prices[0] || "0");
      // Skip boring 0/100 outcomes
      if (yesPrice <= 0.02 || yesPrice >= 0.98) return null;
      return { ...e, parsedYes: yesPrice };
    })
    .filter((e): e is PolymarketEvent & { parsedYes: number } => e !== null)
    .slice(0, 10);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/[0.06] shrink-0">
        <span className="text-[10px] font-mono uppercase tracking-[0.15em] text-zinc-500">Predictions</span>
        <Link href={`/${lang}/markets`} className="text-[9px] font-mono text-blue-400 hover:text-blue-300 transition-colors">
          All →
        </Link>
      </div>
      <div className="flex-1 overflow-y-auto">
        {interesting.length === 0 ? (
          <div className="flex items-center justify-center h-full text-[10px] font-mono text-zinc-700">
            No active predictions
          </div>
        ) : (
          interesting.map((event) => {
            const yesPrice = event.parsedYes;
            return (
              <div
                key={event.id}
                className="flex items-center gap-2 px-3 py-2 border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors"
              >
                {event.image && (
                  <img
                    src={event.image}
                    alt=""
                    className="w-6 h-6 rounded-full shrink-0 object-cover"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-zinc-300 truncate">{event.title}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[9px] font-mono text-emerald-400 tabular-nums">
                    Yes {(yesPrice * 100).toFixed(0)}%
                  </span>
                  <div className="w-16 h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-emerald-500"
                      style={{ width: `${yesPrice * 100}%` }}
                    />
                  </div>
                  <span className="text-[9px] font-mono text-red-400 tabular-nums">
                    No {((1 - yesPrice) * 100).toFixed(0)}%
                  </span>
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
  youtubeItems,
  signals,
  polymarketEvents,
  blogPosts,
}: HomeDashboardProps) {
  const [mobileTab, setMobileTab] = useState<"market" | "whales" | "news" | "research" | "predictions">("market");

  return (
    <div className="bg-zinc-950 font-mono flex flex-col pt-[92px]" style={{ height: "100vh" }}>
      {/* Stat Bar */}
      <StatBar
        btcData={btcData}
        ethData={ethData}
        fearGreed={fearGreed}
        globalData={globalData}
      />

      {/* Mobile tab bar */}
      <div className="flex lg:hidden border-b border-white/[0.06] bg-zinc-900/60 shrink-0 overflow-x-auto">
        {(["market", "whales", "news", "research", "predictions"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setMobileTab(tab)}
            className={`flex-shrink-0 px-3 py-2 text-[10px] font-mono uppercase tracking-[0.1em] transition-colors cursor-pointer ${
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
        {/* Top row (50%) — Predictions + Whales + Signals */}
        <div className="flex border-b border-white/[0.06] overflow-hidden shrink-0" style={{ height: "50%" }}>
          {/* Predictions (40%) — main focus */}
          <div className="border-r border-white/[0.06] overflow-hidden flex flex-col" style={{ width: "40%" }}>
            <PredictionCards events={polymarketEvents} lang={lang} />
          </div>
          {/* Whale Positions (35%) */}
          <div className="border-r border-white/[0.06] flex flex-col overflow-hidden" style={{ width: "35%" }}>
            <div className="flex items-center justify-between px-3 py-2 border-b border-white/[0.06] shrink-0">
              <span className="text-[11px] font-mono uppercase tracking-[0.15em] text-zinc-500">Whale Positions</span>
              <Link href={`/${lang}/whales`} className="text-[10px] font-mono text-blue-400 hover:text-blue-300 transition-colors">All →</Link>
            </div>
            {hlWhales.length === 0 ? (
              <div className="flex items-center justify-center flex-1 text-[11px] font-mono text-zinc-700">No active positions</div>
            ) : (
              <div className="grid grid-cols-2 gap-2 p-2 flex-1 overflow-y-auto content-start">
                {hlWhales.map((whale) => (
                  <HLWhaleCard key={whale.address} whale={whale} />
                ))}
              </div>
            )}
          </div>
          {/* Quant Signals (25%) */}
          <div className="overflow-hidden flex flex-col flex-1">
            <SignalsWidget signals={signals} lang={lang} />
          </div>
        </div>

        {/* Bottom row (50%) — News (bigger) + Research (bigger) */}
        <div className="flex flex-1 overflow-hidden min-h-0">
          {/* Content Feed — News + YouTube (55%) */}
          <div className="border-r border-white/[0.06] overflow-hidden flex flex-col" style={{ width: "55%" }}>
            <ContentFeed news={news} youtubeItems={youtubeItems} lang={lang} />
          </div>
          {/* Market Research (45%) */}
          <div className="overflow-hidden flex flex-col flex-1">
            <BlogCards posts={blogPosts} lang={lang} />
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
                {hlWhales.reduce((s, w) => s + (w.positions?.length ?? 0), 0)} open
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
            <ContentFeed news={news} youtubeItems={youtubeItems} lang={lang} />
          </div>
        )}
        {mobileTab === "research" && (
          <div className="h-full overflow-hidden flex flex-col">
            <BlogCards posts={blogPosts} lang={lang} />
          </div>
        )}
        {mobileTab === "predictions" && (
          <div className="h-full overflow-hidden flex flex-col">
            <PredictionCards events={polymarketEvents} lang={lang} />
          </div>
        )}
      </div>
    </div>
  );
}
