import { Metadata } from "next";
import { fetchAllHLWhales } from "@/lib/services/whales/hyperliquid.service";
import { fetchCryptoNews } from "@/lib/services/news/crypto-news.service";
import HomeDashboard from "./home-dashboard";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "CryptoX - Bloomberg-Style Crypto Command Center",
  description:
    "Real-time crypto market dashboard: BTC/ETH prices, whale positions, fear & greed index, top movers, live news, and AI trading tools. Your complete crypto intelligence center.",
  openGraph: {
    title: "CryptoX - Bloomberg-Style Crypto Command Center",
    description:
      "Real-time crypto market dashboard with whale tracking, live prices, AI trading signals, and market intelligence.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "CryptoX - Bloomberg-Style Crypto Command Center",
    description:
      "Real-time crypto market dashboard with whale tracking, live prices, AI trading signals, and market intelligence.",
  },
};

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default async function HomePage({
  params: { lang },
}: {
  params: { lang: string };
}) {
  const results = await Promise.allSettled([
    fetch("https://api.binance.com/api/v3/ticker/24hr?symbol=BTCUSDT", {
      signal: AbortSignal.timeout(5000),
      next: { revalidate: 60 },
    }).then((r) => r.json()),
    fetch("https://api.binance.com/api/v3/ticker/24hr?symbol=ETHUSDT", {
      signal: AbortSignal.timeout(5000),
      next: { revalidate: 60 },
    }).then((r) => r.json()),
    fetch("https://api.alternative.me/fng/?limit=1", {
      signal: AbortSignal.timeout(5000),
      next: { revalidate: 300 },
    }).then((r) => r.json()),
    fetch("https://api.coingecko.com/api/v3/global", {
      signal: AbortSignal.timeout(5000),
      next: { revalidate: 120 },
    }).then((r) => r.json()),
    fetch(
      "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=20&sparkline=false&price_change_percentage=1h,24h,7d",
      {
        signal: AbortSignal.timeout(5000),
        next: { revalidate: 120 },
      }
    ).then((r) => r.json()),
    fetchAllHLWhales(),
    fetchCryptoNews(),
  ]);

  const btcData = results[0].status === "fulfilled" ? results[0].value : null;
  const ethData = results[1].status === "fulfilled" ? results[1].value : null;
  const fearGreed = results[2].status === "fulfilled" ? results[2].value : null;
  const globalData = results[3].status === "fulfilled" ? results[3].value : null;
  const topCoins = results[4].status === "fulfilled" ? results[4].value : [];
  const hlWhales = results[5].status === "fulfilled" ? results[5].value : [];
  const news = results[6].status === "fulfilled" ? results[6].value : [];

  return (
    <HomeDashboard
      lang={lang}
      btcData={btcData}
      ethData={ethData}
      fearGreed={fearGreed}
      globalData={globalData}
      topCoins={Array.isArray(topCoins) ? topCoins : []}
      hlWhales={hlWhales}
      news={news.slice(0, 10)}
    />
  );
}
