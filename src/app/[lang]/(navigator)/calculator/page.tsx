import { Metadata } from "next";
import { getExchangesForCalculator } from "./actions";
import { EXCHANGES } from "@/lib/data/exchanges";
import CalculatorClient from "./calculator-client";

export const metadata: Metadata = {
  title: "Crypto Trading Fee Calculator - Compare Exchange Fees & Rebates",
  description:
    "Calculate your crypto futures trading fees and potential rebate savings across partner exchanges. Compare maker and taker fees for Bitget, Bybit, BingX, OKX, and more. Save on every trade.",
  keywords: [
    "crypto trading fee calculator",
    "futures fee calculator",
    "exchange fee comparison",
    "trading rebates",
    "Bitget fees",
    "Bybit fees",
    "BingX fees",
    "OKX fees",
    "maker taker fees",
    "crypto cost calculator",
  ],
  openGraph: {
    title: "Crypto Trading Fee Calculator - Compare Exchange Fees & Rebates | Futures AI",
    description:
      "Calculate your crypto futures trading fees and rebate savings across Bitget, Bybit, BingX, OKX, and more. Find the cheapest exchange for your trading style.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Crypto Trading Fee Calculator - Compare Exchange Fees & Rebates | Futures AI",
    description:
      "Calculate your crypto futures trading fees and rebate savings across Bitget, Bybit, BingX, OKX, and more.",
  },
};

export const dynamic = "force-dynamic";

export default async function CalculatorPage() {
  const dbExchanges = await getExchangesForCalculator();
  const exchanges = dbExchanges.length > 0 ? dbExchanges : EXCHANGES;

  return <CalculatorClient exchanges={exchanges} />;
}
