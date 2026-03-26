import Container from "@/components/ui/container";
import { Metadata } from "next";
import {
  TradingViewScreener,
  FearGreedSection,
} from "../live/live-client";
import { MultiChartTerminal } from "./charts-client";
import { MarketCorrelations, TopCoinsTable } from "./market-data";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Crypto Charts and Market Analysis",
  description:
    "Professional crypto charting terminal with multi-chart TradingView views, Fear and Greed index, market correlations, and real-time screener. Powered by Futures AI.",
  keywords: ["crypto charts", "TradingView", "market analysis", "fear greed index", "crypto screener", "bitcoin chart"],
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
    <div className="min-h-screen bg-zinc-950 pt-24 sm:pt-28 pb-24 sm:pb-32">
      <Container className="flex flex-col gap-0">
        {/* ──────── Hero ──────── */}
        <section className="pt-16 pb-20">
          <p className="text-[11px] font-mono uppercase tracking-[0.3em] text-zinc-500 mb-5">
            QUANTITATIVE ANALYSIS
          </p>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold text-zinc-100 tracking-tight leading-[0.95]">
            Charts &<br />
            Market Data
          </h1>
          <p className="text-base text-zinc-500 max-w-lg mt-6 leading-relaxed">
            Professional-grade charting, real-time sentiment analysis, and
            comprehensive market intelligence.
          </p>

          {/* Stats Bar */}
          <div className="mt-8 flex flex-wrap gap-2 sm:gap-3">
            <div className="flex-1 min-w-[140px] rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 sm:px-5 py-3 flex flex-col gap-1 hover:border-white/[0.12] hover:bg-white/[0.04] hover:scale-[1.02] transition-all duration-200">
              <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-600">
                BTC PRICE
              </span>
              <span className="font-mono text-base sm:text-lg font-semibold text-zinc-100 tabular-nums">
                $
                {btcPrice.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>

            <div className="flex-1 min-w-[140px] rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 sm:px-5 py-3 flex flex-col gap-1 hover:border-white/[0.12] hover:bg-white/[0.04] hover:scale-[1.02] transition-all duration-200">
              <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-600">
                24H CHANGE
              </span>
              <span
                className={`font-mono text-base sm:text-lg font-semibold tabular-nums ${
                  btcChange >= 0 ? "text-emerald-400" : "text-red-400"
                }`}
              >
                {btcChange >= 0 ? "+" : ""}
                {btcChange.toFixed(2)}%
              </span>
            </div>

            <div className="flex-1 min-w-[140px] rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 sm:px-5 py-3 flex flex-col gap-1 hover:border-white/[0.12] hover:bg-white/[0.04] hover:scale-[1.02] transition-all duration-200">
              <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-600">
                FEAR & GREED
              </span>
              <span className="font-mono text-base sm:text-lg font-semibold text-zinc-100 tabular-nums">
                {fearValue}
              </span>
            </div>

            <div className="flex-1 min-w-[140px] rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 sm:px-5 py-3 flex flex-col gap-1 hover:border-white/[0.12] hover:bg-white/[0.04] hover:scale-[1.02] transition-all duration-200">
              <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-600">
                MARKET TREND
              </span>
              <span
                className={`font-mono text-base sm:text-lg font-semibold ${getTrendColor(
                  fearValue
                )}`}
              >
                {getTrend(fearValue)}
              </span>
            </div>
          </div>
        </section>

        {/* Divider */}
        <div className="w-full h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

        {/* ──────── Section 1: Multi-Chart Terminal ──────── */}
        <section className="py-16 sm:py-20">
          <div className="mb-8">
            <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-zinc-600 mb-2">
              01
            </p>
            <h2 className="text-2xl md:text-3xl font-bold text-zinc-100 tracking-tight">
              Multi-Chart Terminal
            </h2>
            <p className="text-sm text-zinc-500 mt-2">
              Advanced TradingView charts across major trading pairs
            </p>
          </div>
          <MultiChartTerminal />
        </section>

        <div className="w-full h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

        {/* ──────── Section 2: Fear & Greed Index ──────── */}
        <section className="py-16 sm:py-20">
          <div className="mb-8">
            <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-zinc-600 mb-2">
              02
            </p>
            <h2 className="text-2xl md:text-3xl font-bold text-zinc-100 tracking-tight">
              Fear & Greed Index
            </h2>
            <p className="text-sm text-zinc-500 mt-2 max-w-xl">
              Current market sentiment gauge based on volatility, momentum,
              social media, and surveys
            </p>
          </div>
          <FearGreedSection data={fearGreedData} />
        </section>

        <div className="w-full h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

        {/* ──────── Section 3: Market Correlations ──────── */}
        <section className="py-16 sm:py-20">
          <div className="mb-8">
            <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-zinc-600 mb-2">
              03
            </p>
            <h2 className="text-2xl md:text-3xl font-bold text-zinc-100 tracking-tight">
              Market Correlations
            </h2>
            <p className="text-sm text-zinc-500 mt-2">
              Global cryptocurrency market overview and dominance metrics
            </p>
          </div>
          <MarketCorrelations data={globalData} />
        </section>

        <div className="w-full h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

        {/* ──────── Section 4: Market Screener ──────── */}
        <section className="py-16 sm:py-20">
          <div className="mb-8">
            <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-zinc-600 mb-2">
              04
            </p>
            <h2 className="text-2xl md:text-3xl font-bold text-zinc-100 tracking-tight">
              Market Screener
            </h2>
            <p className="text-sm text-zinc-500 mt-2">
              Real-time crypto market screener with prices, volume, and
              performance data
            </p>
          </div>
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-md overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.06]">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-mono text-xs text-zinc-400">
                LIVE SCREENER
              </span>
            </div>
            <TradingViewScreener />
          </div>
        </section>

        <div className="w-full h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

        {/* ──────── Section 5: Key Metrics Dashboard ──────── */}
        <section className="py-16 sm:py-20">
          <div className="mb-8">
            <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-zinc-600 mb-2">
              05
            </p>
            <h2 className="text-2xl md:text-3xl font-bold text-zinc-100 tracking-tight">
              Key Metrics Dashboard
            </h2>
            <p className="text-sm text-zinc-500 mt-2">
              Top 10 cryptocurrencies ranked by market capitalization
            </p>
          </div>
          <TopCoinsTable coins={topCoins} />
        </section>
      </Container>
    </div>
  );
}
