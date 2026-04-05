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

// Upbit ticker mapping (KRW pairs)
const UPBIT_TICKER_MAP: Record<string, string> = {
  BTC: "KRW-BTC", ETH: "KRW-ETH", SOL: "KRW-SOL", XRP: "KRW-XRP",
  DOGE: "KRW-DOGE", ADA: "KRW-ADA", AVAX: "KRW-AVAX", DOT: "KRW-DOT",
  LINK: "KRW-LINK", BNB: "KRW-BNB",
};

async function fetchUpbitPrice(symbol: string): Promise<{ price: number; change: number; volume: number; high: number; low: number } | null> {
  const upbitTicker = UPBIT_TICKER_MAP[symbol];
  if (!upbitTicker) return null;
  try {
    const res = await fetch(`https://api.upbit.com/v1/ticker?markets=${upbitTicker}`, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return null;
    const [data] = await res.json();
    return {
      price: data.trade_price,
      change: data.signed_change_rate * 100,
      volume: data.acc_trade_price_24h,
      high: data.high_price,
      low: data.low_price,
    };
  } catch {
    return null;
  }
}

async function fetchBinanceKlines(symbol: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://api.binance.com/api/v3/klines?symbol=${symbol}USDT&interval=4h&limit=20`,
      { signal: AbortSignal.timeout(3000) }
    );
    if (!res.ok) return null;
    const klines = await res.json();
    const closes = klines.map((k: any[]) => parseFloat(k[4]));
    if (closes.length < 14) return null;

    // Simple RSI calculation
    let gains = 0, losses = 0;
    for (let i = 1; i < 14; i++) {
      const diff = closes[i] - closes[i - 1];
      if (diff > 0) gains += diff; else losses -= diff;
    }
    const avgGain = gains / 14;
    const avgLoss = losses / 14;
    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    const rsi = 100 - (100 / (1 + rs));

    // Simple MA
    const ma7 = closes.slice(-7).reduce((a: number, b: number) => a + b, 0) / 7;
    const ma20 = closes.slice(-20).reduce((a: number, b: number) => a + b, 0) / Math.min(closes.length, 20);
    const currentPrice = closes[closes.length - 1];
    const trend = currentPrice > ma7 && ma7 > ma20 ? "UPTREND" : currentPrice < ma7 && ma7 < ma20 ? "DOWNTREND" : "SIDEWAYS";

    return `RSI(14,4h): ${rsi.toFixed(1)} | MA7: $${ma7.toLocaleString(undefined, { maximumFractionDigits: 2 })} | MA20: $${ma20.toLocaleString(undefined, { maximumFractionDigits: 2 })} | Trend: ${trend}`;
  } catch {
    return null;
  }
}

export async function buildCryptoContext(query: string): Promise<{ context: string; newsArticles: { title: string; url: string; source: string }[]; detectedSymbol: string | null }> {
  const parts: string[] = [];

  const ticker = extractTicker(query, "crypto");
  const baseSymbol = ticker ? ticker.ticker.replace("USDT", "") : null;

  if (ticker) {
    // Fetch Binance, Upbit, and technical data in parallel
    const [binanceRes, upbitData, technicals] = await Promise.allSettled([
      fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${ticker.ticker}`, { signal: AbortSignal.timeout(3000) }),
      baseSymbol ? fetchUpbitPrice(baseSymbol) : Promise.resolve(null),
      baseSymbol ? fetchBinanceKlines(baseSymbol) : Promise.resolve(null),
    ]);

    // Binance price
    if (binanceRes.status === "fulfilled" && binanceRes.value.ok) {
      const data = await binanceRes.value.json();
      const price = parseFloat(data.lastPrice);
      const pct = parseFloat(data.priceChangePercent);
      parts.push(`BINANCE ${ticker.ticker}: $${price.toLocaleString()} | 24h: ${pct >= 0 ? "+" : ""}${pct.toFixed(2)}% | Vol: $${(parseFloat(data.quoteVolume) / 1e6).toFixed(1)}M | High: $${parseFloat(data.highPrice).toLocaleString()} | Low: $${parseFloat(data.lowPrice).toLocaleString()}`);

      // Upbit price with kimchi premium
      const upbit = upbitData.status === "fulfilled" ? upbitData.value : null;
      if (upbit && price > 0) {
        const krwRate = upbit.price / price;
        const premium = ((krwRate / 1370) - 1) * 100; // approx kimchi premium vs ~1370 KRW/USD
        parts.push(`UPBIT ${baseSymbol}/KRW: ₩${upbit.price.toLocaleString()} | 24h: ${upbit.change >= 0 ? "+" : ""}${upbit.change.toFixed(2)}% | Vol: ₩${(upbit.volume / 1e8).toFixed(1)}억 | Kimchi Premium: ${premium >= 0 ? "+" : ""}${premium.toFixed(1)}%`);
      }
    }

    // Technicals
    const tech = technicals.status === "fulfilled" ? technicals.value : null;
    if (tech) parts.push(`TECHNICALS: ${tech}`);
  }

  // Fear & Greed + news in parallel
  const [fngRes, newsRes] = await Promise.allSettled([
    fetch("https://api.alternative.me/fng/?limit=1", { signal: AbortSignal.timeout(3000) }),
    fetch("https://cryptopanic.com/api/free/v1/posts/?auth_token=free&public=true&kind=news&filter=hot", { signal: AbortSignal.timeout(3000) }),
  ]);

  if (fngRes.status === "fulfilled" && fngRes.value.ok) {
    try {
      const fngData = await fngRes.value.json();
      const fg = fngData?.data?.[0];
      if (fg) parts.push(`FEAR & GREED: ${fg.value} (${fg.value_classification})`);
    } catch {}
  }

  let newsArticles: { title: string; url: string; source: string }[] = [];
  if (newsRes.status === "fulfilled" && newsRes.value.ok) {
    try {
      const newsData = await newsRes.value.json();
      const results = (newsData.results || []).slice(0, 5);
      newsArticles = results.map((n: any) => ({
        title: n.title,
        url: n.url,
        source: n.source?.title || "CryptoPanic",
      }));
      const headlines = results.slice(0, 3).map((n: any) => n.title).join(" | ");
      if (headlines) parts.push(`NEWS: ${headlines}`);
    } catch {}
  }

  return {
    context: parts.join("\n\n") || "No real-time data available.",
    newsArticles,
    detectedSymbol: baseSymbol,
  };
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
