import { Metadata } from "next";
import {
  TradingViewScreener,
  FearGreedSection,
} from "../live/live-client";
import { MultiChartTerminal } from "./charts-client";
import { MarketCorrelations, TopCoinsTable } from "./market-data";
import ChartsPageClient from "./charts-page-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Crypto Charts and Market Analysis - TradingView Terminal",
  description:
    "Professional crypto charting terminal with multi-chart TradingView views, Fear and Greed index, market correlations, top coins dashboard, and real-time screener. Powered by Futures AI.",
  keywords: [
    "crypto charts",
    "TradingView crypto",
    "bitcoin chart analysis",
    "market analysis",
    "fear greed index",
    "crypto screener",
    "market correlations",
    "crypto market data",
    "multi-chart terminal",
    "BTC ETH chart",
  ],
  openGraph: {
    title: "Crypto Charts and Market Analysis - TradingView Terminal | Futures AI",
    description:
      "Professional crypto charting terminal with multi-chart TradingView views, Fear and Greed index, market correlations, and real-time screener.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Crypto Charts and Market Analysis - TradingView Terminal | Futures AI",
    description:
      "Professional crypto charting terminal with multi-chart TradingView views, Fear and Greed index, market correlations, and real-time screener.",
  },
};

/* ──────────────────────────── Data fetchers ──────────────────────────── */

async function getFearGreedIndex() {
  try {
    const res = await fetch("https://api.alternative.me/fng/?limit=30", {
      next: { revalidate: 300 },
    });
    if (!res.ok) return [];
    const json = await res.json();
    return Array.isArray(json?.data) ? json.data : [];
  } catch {
    return [];
  }
}

async function getBtcPrice() {
  try {
    const res = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true",
      { next: { revalidate: 300 } }
    );
    if (!res.ok) return null;
    const json = await res.json();
    return json?.bitcoin ?? null;
  } catch {
    return null;
  }
}

async function getGlobalMarketData() {
  try {
    const res = await fetch("https://api.coingecko.com/api/v3/global", {
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json?.data ?? null;
  } catch {
    return null;
  }
}

async function getTopCoins() {
  try {
    const res = await fetch(
      "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=10&sparkline=false&price_change_percentage=7d",
      { next: { revalidate: 300 } }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

/* ──────────────────────────── Helpers ──────────────────────────── */

function getTrend(fearValue: number): string {
  if (fearValue <= 24) return "BEARISH";
  if (fearValue <= 44) return "CAUTIOUS";
  if (fearValue <= 55) return "NEUTRAL";
  if (fearValue <= 74) return "BULLISH";
  return "EUPHORIC";
}

function getTrendColor(fearValue: number): string {
  if (fearValue <= 24) return "text-red-400";
  if (fearValue <= 44) return "text-orange-400";
  if (fearValue <= 55) return "text-yellow-400";
  if (fearValue <= 74) return "text-emerald-400";
  return "text-emerald-300";
}

/* ──────────────────────────── Page ──────────────────────────── */

export default async function ChartsPage({
  params: { lang },
}: {
  params: { lang: string };
}) {
  const [fearGreedData, btcData, globalData, topCoins] = await Promise.all([
    getFearGreedIndex(),
    getBtcPrice(),
    getGlobalMarketData(),
    getTopCoins(),
  ]);

  const fearValue =
    fearGreedData && fearGreedData.length > 0
      ? Number(fearGreedData[0].value)
      : 0;
  const btcPrice = btcData?.usd ?? 0;
  const btcChange = btcData?.usd_24h_change ?? 0;

  return (
    <div className="bg-zinc-950 font-mono">
      {/* Stat Bar */}
      <div className="flex items-center gap-3 px-4 py-3 bg-zinc-900/80 border-b border-white/[0.06] text-xs font-mono overflow-x-auto shrink-0">
        <span className="text-zinc-500 shrink-0">BTC</span>
        <span className="text-white font-bold tabular-nums shrink-0">
          ${btcPrice.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
        <span className={`tabular-nums shrink-0 ${btcChange >= 0 ? "text-emerald-400" : "text-red-400"}`}>
          {btcChange >= 0 ? "+" : ""}{btcChange.toFixed(2)}%
        </span>
        <span className="text-zinc-700 shrink-0">|</span>
        <span className="text-zinc-500 shrink-0">Fear/Greed</span>
        <span className={`font-bold shrink-0 ${getTrendColor(fearValue)}`}>{fearValue}</span>
        <span className={`text-[10px] shrink-0 ${getTrendColor(fearValue)}`}>{getTrend(fearValue)}</span>
        <span className="text-zinc-700 shrink-0">|</span>
        {globalData && (
          <>
            <span className="text-zinc-500 shrink-0">Mkt Cap</span>
            <span className="text-white tabular-nums shrink-0">${(globalData.total_market_cap.usd / 1e12).toFixed(2)}T</span>
            <span className="text-zinc-700 shrink-0">|</span>
            <span className="text-zinc-500 shrink-0">BTC Dom</span>
            <span className="text-white tabular-nums shrink-0">{globalData.market_cap_percentage.btc.toFixed(1)}%</span>
            <span className="text-zinc-700 shrink-0">|</span>
            <span className="text-zinc-500 shrink-0">Vol 24h</span>
            <span className="text-white tabular-nums shrink-0">${(globalData.total_volume.usd / 1e9).toFixed(1)}B</span>
          </>
        )}
        <span className="text-zinc-700 shrink-0">|</span>
        <span className="relative flex items-center gap-1.5 shrink-0">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
          </span>
          <span className="text-emerald-400 text-[10px] uppercase tracking-[0.15em]">LIVE</span>
        </span>
      </div>

      {/* Mobile: tab selector + content */}
      <ChartsPageClient
        fearGreedData={fearGreedData}
        globalData={globalData}
        topCoins={topCoins}
      />

      {/* Desktop layout: single screen, no scroll */}
      <div className="hidden lg:grid h-[calc(100vh-140px)] grid-rows-[60%_40%] overflow-hidden">
        {/* Top row: Chart (65%) + Fear & Greed / Market Stats (35%) */}
        <div className="grid grid-cols-[1fr_380px] border-b border-white/[0.06] overflow-hidden">
          {/* Chart Terminal */}
          <div className="border-r border-white/[0.06] flex flex-col overflow-hidden">
            <MultiChartTerminal />
          </div>

          {/* Right sidebar: Fear & Greed + Market Stats */}
          <div className="flex flex-col overflow-hidden">
            {/* Fear & Greed compact */}
            <div className="border-b border-white/[0.06] flex-1 overflow-hidden">
              <div className="px-3 py-2 border-b border-white/[0.06] shrink-0">
                <span className="text-[10px] font-mono uppercase tracking-[0.15em] text-zinc-500">Sentiment</span>
              </div>
              <div className="p-3 h-[calc(100%-36px)] overflow-hidden">
                <FearGreedSection data={fearGreedData} />
              </div>
            </div>

            {/* Market Stats compact */}
            <div className="shrink-0">
              <div className="px-3 py-2 border-b border-white/[0.06]">
                <span className="text-[10px] font-mono uppercase tracking-[0.15em] text-zinc-500">Market Overview</span>
              </div>
              <MarketCorrelations data={globalData} />
            </div>
          </div>
        </div>

        {/* Bottom row: Top Coins (60%) + Screener (40%) */}
        <div className="grid grid-cols-[60%_40%] overflow-hidden">
          {/* Top Coins */}
          <div className="border-r border-white/[0.06] flex flex-col overflow-hidden">
            <div className="px-3 py-2 border-b border-white/[0.06] flex items-center justify-between shrink-0">
              <span className="text-[10px] font-mono uppercase tracking-[0.15em] text-zinc-500">Top Coins</span>
              <span className="text-[9px] font-mono text-zinc-700">{topCoins.length} assets</span>
            </div>
            <div className="flex-1 overflow-auto">
              <TopCoinsTable coins={topCoins} />
            </div>
          </div>

          {/* Screener */}
          <div className="flex flex-col overflow-hidden">
            <div className="px-3 py-2 border-b border-white/[0.06] flex items-center gap-2 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-mono uppercase tracking-[0.15em] text-zinc-500">Live Screener</span>
            </div>
            <div className="flex-1 overflow-hidden [&_.tradingview-widget-container]:!h-full [&_.tradingview-widget-container]:!rounded-none [&_.tradingview-widget-container]:!border-0">
              <TradingViewScreener />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
