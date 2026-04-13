import { Metadata } from "next";
import {
  TradingViewScreener,
  FearGreedSection,
} from "../live/live-client";
import { MultiChartTerminal } from "./charts-client";
import { MarketCorrelations, TopCoinsTable } from "./market-data";
import ChartsPageClient from "./charts-page-client";
import { fetchMarketSignals } from "@/lib/services/signals/signals.service";
import ChartsDashboard from "./charts-dashboard";

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
  const [fearGreedData, btcData, globalData, topCoins, signalsData] = await Promise.all([
    getFearGreedIndex(),
    getBtcPrice(),
    getGlobalMarketData(),
    getTopCoins(),
    fetchMarketSignals().catch(() => ({
      signals: [], fearGreed: { value: 50, classification: "Neutral" },
      btcTrend: "above_sma" as const, marketSummary: "", updatedAt: new Date().toISOString(),
    })),
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

      {/* Desktop layout */}
      <div className="hidden lg:flex flex-col flex-1 overflow-hidden" style={{ height: "calc(100dvh - 92px - 44px)" }}>
        {/* Top row (60%): Chart + Sentiment + Signals */}
        <div className="flex border-b border-white/[0.06]" style={{ flex: "60 0 0" }}>
          {/* Chart Terminal (55%) */}
          <div className="border-r border-white/[0.06] flex flex-col overflow-hidden" style={{ width: "55%" }}>
            <MultiChartTerminal />
          </div>

          {/* Middle: Sentiment + Market Stats (20%) */}
          <div className="border-r border-white/[0.06] flex flex-col overflow-hidden" style={{ width: "20%" }}>
            <div className="border-b border-white/[0.06] flex-1 overflow-hidden">
              <div className="px-3 py-2 border-b border-white/[0.06] shrink-0">
                <span className="text-[12px] font-mono uppercase tracking-[0.15em] text-zinc-400">Sentiment</span>
              </div>
              <div className="p-2 h-[calc(100%-36px)] overflow-hidden">
                <FearGreedSection data={fearGreedData} />
              </div>
            </div>
            <div className="shrink-0">
              <div className="px-3 py-2 border-b border-white/[0.06]">
                <span className="text-[12px] font-mono uppercase tracking-[0.15em] text-zinc-400">Market</span>
              </div>
              <MarketCorrelations data={globalData} />
            </div>
          </div>

          {/* Right: Quant Signals (25%) */}
          <div className="flex flex-col overflow-hidden flex-1">
            <div className="px-3 py-2 border-b border-white/[0.06] flex items-center justify-between shrink-0">
              <span className="text-[12px] font-mono uppercase tracking-[0.15em] text-zinc-400">Quant Signals</span>
              <a href={`/${lang}/quant`} className="text-[11px] text-blue-400 hover:text-blue-300">All →</a>
            </div>
            <ChartsDashboard signals={JSON.parse(JSON.stringify(signalsData))} lang={lang} />
          </div>
        </div>

        {/* Bottom row (40%): Top Coins + Screener + AI Chat */}
        <div className="flex flex-1 overflow-hidden">
          {/* Top Coins (40%) */}
          <div className="border-r border-white/[0.06] flex flex-col overflow-hidden" style={{ width: "40%" }}>
            <div className="px-3 py-2 border-b border-white/[0.06] flex items-center justify-between shrink-0">
              <span className="text-[12px] font-mono uppercase tracking-[0.15em] text-zinc-400">Top Coins</span>
              <span className="text-[10px] font-mono text-zinc-600">{topCoins.length} assets</span>
            </div>
            <div className="flex-1 overflow-auto">
              <TopCoinsTable coins={topCoins} />
            </div>
          </div>

          {/* Screener (35%) */}
          <div className="border-r border-white/[0.06] flex flex-col overflow-hidden" style={{ width: "35%" }}>
            <div className="px-3 py-2 border-b border-white/[0.06] flex items-center gap-2 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[12px] font-mono uppercase tracking-[0.15em] text-zinc-400">Live Screener</span>
            </div>
            <div className="flex-1 overflow-hidden [&_.tradingview-widget-container]:!h-full [&_.tradingview-widget-container]:!rounded-none [&_.tradingview-widget-container]:!border-0">
              <TradingViewScreener />
            </div>
          </div>

          {/* AI Chat (25%) - Premium locked */}
          <div className="flex flex-col overflow-hidden flex-1 relative">
            <div className="px-3 py-2 border-b border-white/[0.06] flex items-center justify-between shrink-0">
              <span className="text-[12px] font-mono uppercase tracking-[0.15em] text-zinc-400">AI Chat</span>
              <div className="flex items-center gap-1.5">
                <svg className="w-3 h-3 text-amber-400" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" d="M12 1.5a5.25 5.25 0 00-5.25 5.25v3a3 3 0 00-3 3v6.75a3 3 0 003 3h10.5a3 3 0 003-3v-6.75a3 3 0 00-3-3v-3c0-2.9-2.35-5.25-5.25-5.25zm3.75 8.25v-3a3.75 3.75 0 10-7.5 0v3h7.5z" clipRule="evenodd" /></svg>
                <span className="text-[10px] font-mono text-amber-400 uppercase">Premium</span>
              </div>
            </div>
            {/* Premium Lock Overlay */}
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/20 flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                </svg>
              </div>
              <h3 className="text-[14px] font-semibold text-white mb-1">
                {lang === "ko" ? "프리미엄 전용" : "Premium Only"}
              </h3>
              <p className="text-[12px] text-zinc-500 mb-4 max-w-[200px]">
                {lang === "ko" ? "AI 퀀트 채팅으로 실시간 시장 분석을 받으세요" : "Get real-time AI market analysis with Quant Chat"}
              </p>
              <a
                href={`/${lang}/pricing`}
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 text-white text-[12px] font-semibold hover:from-amber-400 hover:to-amber-500 transition-all shadow-lg shadow-amber-500/20 cursor-pointer"
              >
                {lang === "ko" ? "프리미엄 시작하기" : "Get Premium"}
              </a>
              <p className="text-[10px] text-zinc-600 mt-2">$99 USDT / {lang === "ko" ? "월" : "month"}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
