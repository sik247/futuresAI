import { search, SafeSearchType } from "duck-duck-scrape";

export type WebSearchResult = {
  query: string;
  results: {
    title: string;
    url: string;
    snippet: string;
  }[];
  sentiment: "BULLISH" | "BEARISH" | "MIXED" | "NEUTRAL";
  keyEvents: string[];
};

const BULLISH_KEYWORDS = [
  "surge", "rally", "breakout", "bullish", "pump", "soar", "gain",
  "upside", "buy", "accumulation", "all-time high", "ath",
];
const BEARISH_KEYWORDS = [
  "crash", "dump", "bearish", "plunge", "sell", "decline", "drop",
  "downside", "liquidation", "fear", "capitulation",
];

function deriveSentiment(snippets: string[]): "BULLISH" | "BEARISH" | "MIXED" | "NEUTRAL" {
  const text = snippets.join(" ").toLowerCase();
  let bullScore = 0;
  let bearScore = 0;
  for (const kw of BULLISH_KEYWORDS) {
    if (text.includes(kw)) bullScore++;
  }
  for (const kw of BEARISH_KEYWORDS) {
    if (text.includes(kw)) bearScore++;
  }
  if (bullScore > bearScore + 1) return "BULLISH";
  if (bearScore > bullScore + 1) return "BEARISH";
  if (bullScore > 0 && bearScore > 0) return "MIXED";
  return "NEUTRAL";
}

function extractKeyEvents(snippets: string[]): string[] {
  const events: string[] = [];
  for (const snippet of snippets.slice(0, 5)) {
    const sentences = snippet.split(/[.!?]/).filter((s) => s.trim().length > 20);
    if (sentences[0]) events.push(sentences[0].trim());
  }
  return events.slice(0, 5);
}

export async function runWebSearchAgent(pair: string): Promise<WebSearchResult[]> {
  const cleanPair = pair.replace(/usdt$/i, "").replace(/usd$/i, "");

  const queries = [
    `${cleanPair} crypto news today`,
    `${cleanPair} market sentiment analysis`,
  ];

  const results: WebSearchResult[] = [];

  for (const query of queries) {
    try {
      const response = await search(query, {
        safeSearch: SafeSearchType.OFF,
      });

      const webResults = (response.results || []).slice(0, 5).map((item) => ({
        title: item.title || "",
        url: item.url || "",
        snippet: item.description || "",
      }));

      const snippets = webResults.map((r) => r.snippet);

      results.push({
        query,
        results: webResults,
        sentiment: deriveSentiment(snippets),
        keyEvents: extractKeyEvents(snippets),
      });
    } catch (err) {
      console.error(`DuckDuckGo search error for "${query}":`, err);
    }
  }

  return results;
}
