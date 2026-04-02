import { fetchStockData } from "./stock-data.agent";

// Extract ticker from user message
export function extractTicker(message: string, persona: string): { ticker: string; exchange: string } | null {
  // Common patterns: "BTC", "$AAPL", "BTCUSDT", "bitcoin", "apple stock"
  const cryptoMap: Record<string, string> = {
    bitcoin: "BTC", btc: "BTC", ethereum: "ETH", eth: "ETH",
    solana: "SOL", sol: "SOL", xrp: "XRP", ripple: "XRP",
    bnb: "BNB", doge: "DOGE", dogecoin: "DOGE",
    ada: "ADA", cardano: "ADA", avax: "AVAX", dot: "DOT", link: "LINK",
  };

  const lower = message.toLowerCase();

  if (persona === "crypto") {
    for (const [key, val] of Object.entries(cryptoMap)) {
      if (lower.includes(key)) return { ticker: val + "USDT", exchange: "BINANCE" };
    }
    // Only match explicit $SYMBOL or SYMBOL/USDT or SYMBOLUSDT patterns
    const explicitMatch = message.match(/\$([A-Z]{2,6})/);
    if (explicitMatch) return { ticker: explicitMatch[1].toUpperCase() + "USDT", exchange: "BINANCE" };
    const pairMatch = message.match(/\b([A-Z]{2,6})(?:\/USDT|USDT)\b/);
    if (pairMatch) return { ticker: pairMatch[1].toUpperCase() + "USDT", exchange: "BINANCE" };
  }

  if (persona === "us-stocks") {
    // Match $AAPL or stock names
    const stockMap: Record<string, string> = {
      apple: "AAPL", google: "GOOGL", amazon: "AMZN", microsoft: "MSFT",
      tesla: "TSLA", nvidia: "NVDA", meta: "META", netflix: "NFLX",
      "s&p": "SPY", spy: "SPY", qqq: "QQQ", nasdaq: "QQQ",
    };
    for (const [key, val] of Object.entries(stockMap)) {
      if (lower.includes(key)) return { ticker: val, exchange: "NASDAQ" };
    }
    const match = message.match(/\$([A-Z]{1,5})/);
    if (match) return { ticker: match[1], exchange: "NASDAQ" };
  }

  return null;
}

export async function buildCryptoContext(query: string): Promise<string> {
  const parts: string[] = [];

  // Try to get specific price
  const ticker = extractTicker(query, "crypto");
  if (ticker) {
    try {
      const res = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${ticker.ticker}`);
      if (res.ok) {
        const data = await res.json();
        parts.push(`PRICE DATA: ${ticker.ticker} = $${parseFloat(data.lastPrice).toLocaleString()} | 24h: ${parseFloat(data.priceChangePercent) >= 0 ? "+" : ""}${parseFloat(data.priceChangePercent).toFixed(2)}% | Vol: $${(parseFloat(data.quoteVolume) / 1e6).toFixed(1)}M | High: $${parseFloat(data.highPrice).toLocaleString()} | Low: $${parseFloat(data.lowPrice).toLocaleString()}`);
      }
    } catch {}
  }

  // Fear & Greed
  try {
    const fng = await fetch("https://api.alternative.me/fng/?limit=1");
    const fngData = await fng.json();
    const fg = fngData?.data?.[0];
    if (fg) parts.push(`FEAR & GREED: ${fg.value} (${fg.value_classification})`);
  } catch {}

  // Recent news headlines
  try {
    const newsRes = await fetch("https://cryptopanic.com/api/free/v1/posts/?auth_token=free&public=true&kind=news&filter=hot");
    if (newsRes.ok) {
      const newsData = await newsRes.json();
      const headlines = (newsData.results || []).slice(0, 3).map((n: { title: string }) => n.title).join(" | ");
      if (headlines) parts.push(`NEWS: ${headlines}`);
    }
  } catch {}

  return parts.join("\n\n") || "No real-time data available.";
}

export async function buildUSStockContext(query: string): Promise<string> {
  const parts: string[] = [];

  const ticker = extractTicker(query, "us-stocks");
  if (ticker) {
    const data = await fetchStockData(ticker.ticker);
    if (data) {
      parts.push(`STOCK DATA: ${data.symbol} (${data.name}) = $${data.price.toFixed(2)} | Change: ${data.change >= 0 ? "+" : ""}$${data.change.toFixed(2)} (${data.changePercent >= 0 ? "+" : ""}${data.changePercent.toFixed(2)}%) | Vol: ${(data.volume / 1e6).toFixed(1)}M | Day: $${data.dayLow.toFixed(2)}-$${data.dayHigh.toFixed(2)} | 52W: $${data.low52w.toFixed(2)}-$${data.high52w.toFixed(2)}`);
    }
  }

  return parts.join("\n\n") || "No real-time data available.";
}
