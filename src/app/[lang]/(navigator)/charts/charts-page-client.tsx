"use client";

import MobileCharts from "./mobile-charts";

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
  lang?: string;
};

/**
 * Mobile wrapper — renders a focus-first charts experience on <1024px.
 * Desktop multi-chart terminal is rendered separately in the parent page.
 */
export default function ChartsPageClient({
  fearGreedData,
  globalData,
  topCoins,
  lang = "en",
}: Props) {
  return (
    <MobileCharts
      fearGreedData={fearGreedData}
      globalData={globalData}
      topCoins={topCoins}
      lang={lang}
    />
  );
}
