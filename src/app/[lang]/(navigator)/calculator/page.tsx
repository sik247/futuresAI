import { Metadata } from "next";
import { getExchangesForCalculator } from "./actions";
import { EXCHANGES } from "@/lib/data/exchanges";
import CalculatorClient from "./calculator-client";

export const metadata: Metadata = {
  title: "Trading Fee Calculator",
  description:
    "Calculate your crypto trading fees and potential rebate savings across partner exchanges. Compare maker and taker fees for Bitget, Bybit, BingX, OKX, and more.",
  keywords: ["trading fee calculator", "crypto fees", "exchange comparison", "trading rebates", "futures fees"],
};

export const dynamic = "force-dynamic";

export default async function CalculatorPage() {
  const dbExchanges = await getExchangesForCalculator();
  const exchanges = dbExchanges.length > 0 ? dbExchanges : EXCHANGES;

  return <CalculatorClient exchanges={exchanges} />;
}
