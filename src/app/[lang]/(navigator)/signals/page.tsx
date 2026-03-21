import { fetchMarketSignals } from "@/lib/services/signals/signals.service";
import { strategies } from "./strategies";
import SignalsClient from "./signals-client";

export const dynamic = "force-dynamic";
export const revalidate = 300;

export default async function SignalsPage() {
  let data;
  try {
    data = await fetchMarketSignals();
  } catch {
    data = {
      signals: [],
      fearGreed: { value: 50, classification: "Neutral" },
      btcTrend: "below_sma" as const,
      marketSummary: "Unable to load market data. Please try refreshing.",
      updatedAt: new Date().toISOString(),
    };
  }

  return <SignalsClient initialData={data} strategies={strategies} />;
}
