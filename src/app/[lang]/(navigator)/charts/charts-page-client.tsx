"use client";

import { useState } from "react";
import { TradingViewScreener, FearGreedSection } from "../live/live-client";
import { MultiChartTerminal } from "./charts-client";
import { MarketCorrelations, TopCoinsTable } from "./market-data";

type FearGreedEntry = {
  value: string;
  value_classification: string;
  timestamp: string;
};

type GlobalMarketData = {
  total_market_cap: { usd: number };
  total_volume: { usd: number };
  market_cap_percentage: { btc: number; eth: number };
  active_cryptocurrencies: number;
};

type CoinData = {
  id: string;
  market_cap_rank: number;
  name: string;
  symbol: string;
  image: string;
  current_price: number;
  price_change_percentage_24h: number | null;
  price_change_percentage_7d_in_currency: number | null;
  market_cap: number;
  total_volume: number;
};

type Props = {
  fearGreedData: FearGreedEntry[];
  globalData: GlobalMarketData | null;
  topCoins: CoinData[];
};

type MobileTab = "chart" | "market" | "screener";

export default function ChartsPageClient({ fearGreedData, globalData, topCoins }: Props) {
  const [mobileTab, setMobileTab] = useState<MobileTab>("chart");

  return (
    <>
      {/* Mobile tab bar */}
      <div className="flex lg:hidden border-b border-white/[0.06] bg-zinc-900/60">
        {(["chart", "market", "screener"] as const).map((tab) => (
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

      {/* Mobile content */}
      <div className="flex flex-col lg:hidden" style={{ height: "calc(100vh - 140px)" }}>
        {mobileTab === "chart" && (
          <div className="flex flex-col h-full overflow-hidden">
            <MultiChartTerminal />
          </div>
        )}

        {mobileTab === "market" && (
          <div className="flex flex-col h-full overflow-auto">
            {/* Fear & Greed */}
            <div className="border-b border-white/[0.06]">
              <div className="px-3 py-2 border-b border-white/[0.06]">
                <span className="text-[10px] font-mono uppercase tracking-[0.15em] text-zinc-500">Sentiment</span>
              </div>
              <div className="p-3">
                <FearGreedSection data={fearGreedData} />
              </div>
            </div>

            {/* Market Overview */}
            <div className="border-b border-white/[0.06]">
              <div className="px-3 py-2 border-b border-white/[0.06]">
                <span className="text-[10px] font-mono uppercase tracking-[0.15em] text-zinc-500">Market Overview</span>
              </div>
              <div className="overflow-x-auto">
                <MarketCorrelations data={globalData} />
              </div>
            </div>

            {/* Top Coins */}
            <div className="flex-1">
              <div className="px-3 py-2 border-b border-white/[0.06] flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-[0.15em] text-zinc-500">Top Coins</span>
                <span className="text-[9px] font-mono text-zinc-700">{topCoins.length} assets</span>
              </div>
              <TopCoinsTable coins={topCoins} />
            </div>
          </div>
        )}

        {mobileTab === "screener" && (
          <div className="flex flex-col h-full overflow-hidden">
            <div className="px-3 py-2 border-b border-white/[0.06] flex items-center gap-2 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-mono uppercase tracking-[0.15em] text-zinc-500">Live Screener</span>
            </div>
            <div className="flex-1 overflow-hidden [&_.tradingview-widget-container]:!h-full [&_.tradingview-widget-container]:!rounded-none [&_.tradingview-widget-container]:!border-0">
              <TradingViewScreener />
            </div>
          </div>
        )}
      </div>
    </>
  );
}
