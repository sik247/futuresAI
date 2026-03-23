import { runPriceAgent, type PriceAgentResult } from "./agents/price.agent";
import { runWebSearchAgent, type WebSearchResult } from "./agents/web-search.agent";
import { analyzeChart, type ChartAnalysisResult } from "./chart-analysis.service";

export async function runMultiAgentAnalysis(
  imageUrl: string,
  pair: string
): Promise<{
  analysis: ChartAnalysisResult;
  priceData: PriceAgentResult | null;
  webResults: WebSearchResult[] | null;
}> {
  // Phase 1: Run price + web search agents concurrently (graceful degradation)
  const [priceSettled, webSettled] = await Promise.allSettled([
    runPriceAgent(pair),
    runWebSearchAgent(pair),
  ]);

  const priceData =
    priceSettled.status === "fulfilled" ? priceSettled.value : null;
  const webResults =
    webSettled.status === "fulfilled" ? webSettled.value : null;

  if (priceSettled.status === "rejected") {
    console.error("Price agent failed:", priceSettled.reason);
  }
  if (webSettled.status === "rejected") {
    console.error("Web search agent failed:", webSettled.reason);
  }

  // Phase 2: Run quant agent with all available context
  const analysis = await analyzeChart(imageUrl, priceData, webResults);

  return { analysis, priceData, webResults };
}
