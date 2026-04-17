"use client";

import { useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { TradingViewScreener, FearGreedSection } from "../live/live-client";
import { MarketCorrelations, TopCoinsTable } from "./market-data";

/* ──────────────── Types ──────────────── */
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

/* ──────────────── Mobile TradingView Chart with interval prop ──────────────── */
function MobileTVChart({ symbol, interval }: { symbol: string; interval: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { resolvedTheme } = useTheme();
  const tvTheme = resolvedTheme === "dark" ? "dark" : "light";

  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.innerHTML = "";
    const script = document.createElement("script");
    script.src =
      "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol,
      interval,
      timezone: "Etc/UTC",
      theme: tvTheme,
      style: "1",
      locale: "en",
      allow_symbol_change: false,
      calendar: false,
      hide_side_toolbar: true,
      hide_top_toolbar: false,
      save_image: false,
      backgroundColor: "rgba(9,9,11,1)",
      gridColor: "rgba(255,255,255,0.04)",
      support_host: "https://www.tradingview.com",
    });
    containerRef.current.appendChild(script);
  }, [symbol, interval, tvTheme]);

  return (
    <div
      ref={containerRef}
      className="tradingview-widget-container h-full w-full"
      style={{ height: "100%", width: "100%" }}
    />
  );
}

/* ──────────────── Constants ──────────────── */
type CoinKey = "BTC" | "ETH" | "SOL" | "XRP";
const COINS: { key: CoinKey; label: string; symbol: string }[] = [
  { key: "BTC", label: "BTC", symbol: "BINANCE:BTCUSDT" },
  { key: "ETH", label: "ETH", symbol: "BINANCE:ETHUSDT" },
  { key: "SOL", label: "SOL", symbol: "BINANCE:SOLUSDT" },
  { key: "XRP", label: "XRP", symbol: "BINANCE:XRPUSDT" },
];

const TIMEFRAMES: { key: string; label: string; tv: string }[] = [
  { key: "15m", label: "15m", tv: "15" },
  { key: "1h", label: "1h", tv: "60" },
  { key: "4h", label: "4h", tv: "240" },
  { key: "1D", label: "1D", tv: "D" },
  { key: "1W", label: "1W", tv: "W" },
];

/* ──────────────── Accordion section ──────────────── */
function Accordion({
  title,
  subtitle,
  defaultOpen = false,
  children,
}: {
  title: string;
  subtitle?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-white/[0.04]">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-3 px-4 h-12 text-left transition-colors duration-150 hover:bg-white/[0.02] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50"
        aria-expanded={open}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-[11px] font-mono uppercase tracking-[0.15em] text-zinc-400">
            {title}
          </span>
          {subtitle && (
            <span className="text-[10px] font-mono text-zinc-600 truncate">{subtitle}</span>
          )}
        </div>
        <svg
          className={`w-4 h-4 text-zinc-500 shrink-0 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>
      {open && (
        <div className="animate-in fade-in slide-in-from-top-1 duration-200 pb-2">{children}</div>
      )}
    </div>
  );
}

/* ──────────────── Main mobile component ──────────────── */
export default function MobileCharts({
  fearGreedData,
  globalData,
  topCoins,
  lang,
}: {
  fearGreedData: FearGreedEntry[];
  globalData: GlobalMarketData | null;
  topCoins: CoinData[];
  lang: string;
}) {
  const ko = lang === "ko";
  const [coin, setCoin] = useState<CoinKey>("BTC");
  const [tf, setTf] = useState("1h");

  const activeCoin = COINS.find((c) => c.key === coin) || COINS[0];
  const activeTf = TIMEFRAMES.find((t) => t.key === tf) || TIMEFRAMES[1];

  return (
    <div className="lg:hidden flex flex-col bg-zinc-950">
      {/* ── Coin segmented control ── */}
      <div className="px-4 pt-3 pb-2 border-b border-white/[0.04]">
        <div className="flex gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/[0.06]">
          {COINS.map((c) => {
            const active = coin === c.key;
            return (
              <button
                key={c.key}
                onClick={() => setCoin(c.key)}
                className={`flex-1 h-9 rounded-lg text-xs font-mono font-bold tracking-wide transition-all duration-150 active:scale-[0.97] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 ${
                  active
                    ? "bg-blue-500/20 text-blue-300 shadow-[0_0_12px_rgba(59,130,246,0.15)]"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {c.label}
              </button>
            );
          })}
        </div>

        {/* ── Timeframe chips ── */}
        <div className="flex gap-1.5 mt-2 overflow-x-auto no-scrollbar">
          {TIMEFRAMES.map((t) => {
            const active = tf === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setTf(t.key)}
                className={`shrink-0 px-3 h-7 rounded-full text-[11px] font-mono font-semibold border transition-all duration-150 active:scale-[0.97] cursor-pointer ${
                  active
                    ? "bg-blue-500/15 border-blue-500/40 text-blue-300"
                    : "bg-transparent border-white/[0.08] text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {t.label}
              </button>
            );
          })}
          <div className="ml-auto shrink-0 flex items-center gap-1.5 px-2 text-[10px] font-mono text-zinc-500">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
            </span>
            <span className="uppercase tracking-[0.15em]">{ko ? "실시간" : "Live"}</span>
          </div>
        </div>
      </div>

      {/* ── Large chart (60vh of available space) ── */}
      <div
        className="w-full overflow-hidden border-b border-white/[0.04]"
        style={{ height: "60dvh", minHeight: 360 }}
        key={`${activeCoin.symbol}-${activeTf.tv}`}
      >
        <MobileTVChart symbol={activeCoin.symbol} interval={activeTf.tv} />
      </div>

      {/* ── Collapsible sections ── */}
      <Accordion
        title={ko ? "공포·탐욕 지수" : "Fear & Greed"}
        subtitle={ko ? "시장 심리" : "Market sentiment"}
        defaultOpen
      >
        <div className="px-4 pb-2">
          <FearGreedSection data={fearGreedData} />
        </div>
      </Accordion>

      <Accordion
        title={ko ? "시장 상관관계" : "Market Correlations"}
        subtitle={ko ? "시총·도미넌스" : "Cap · Dominance"}
      >
        <div className="overflow-x-auto">
          <MarketCorrelations data={globalData} />
        </div>
      </Accordion>

      <Accordion
        title={ko ? "상위 코인" : "Top Coins"}
        subtitle={`${topCoins.length} ${ko ? "자산" : "assets"}`}
      >
        <TopCoinsTable coins={topCoins} />
      </Accordion>

      <Accordion title={ko ? "스크리너" : "Screener"} subtitle={ko ? "실시간" : "Live"}>
        <div
          className="w-full [&_.tradingview-widget-container]:!h-full [&_.tradingview-widget-container]:!rounded-none [&_.tradingview-widget-container]:!border-0"
          style={{ height: 420 }}
        >
          <TradingViewScreener />
        </div>
      </Accordion>

      <div className="px-4 py-6 text-center">
        <p className="text-[10px] font-mono text-zinc-700">
          {ko
            ? "데이터 출처: CoinGecko · TradingView"
            : "Data: CoinGecko · TradingView"}
        </p>
      </div>
    </div>
  );
}
