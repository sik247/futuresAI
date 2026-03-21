import { getExchangesForCalculator } from "./actions";
import { EXCHANGES } from "@/lib/data/exchanges";
import CalculatorClient from "./calculator-client";

export default async function CalculatorPage() {
  const dbExchanges = await getExchangesForCalculator();
  const exchanges = dbExchanges.length > 0 ? dbExchanges : EXCHANGES;

  return <CalculatorClient exchanges={exchanges} />;
}
