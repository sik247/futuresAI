import { fetchStockData } from "./stock-data.agent";
import { fetchCryptoNews, type CryptoNewsItem } from "@/lib/services/news/crypto-news.service";
import { fetchCryptoFeed } from "@/lib/services/social/x-feed.service";

// Extract ticker from user message
export function extractTicker(message: string, persona: string): { ticker: string; exchange: string } | null {
  const cryptoMap: Record<string, string> = {
    bitcoin: "BTC", btc: "BTC", ethereum: "ETH", eth: "ETH",
    solana: "SOL", sol: "SOL", xrp: "XRP", ripple: "XRP",
    bnb: "BNB", doge: "DOGE", dogecoin: "DOGE",
    ada: "ADA", cardano: "ADA", avax: "AVAX", dot: "DOT", link: "LINK",
    matic: "MATIC", polygon: "MATIC", near: "NEAR", atom: "ATOM",
    sui: "SUI", apt: "APT", aptos: "APT", arb: "ARB", arbitrum: "ARB",
    op: "OP", optimism: "OP", pepe: "PEPE", shib: "SHIB",
  };

  const lower = message.toLowerCase();

  if (persona === "crypto") {
    for (const [key, val] of Object.entries(cryptoMap)) {
      if (lower.includes(key)) return { ticker: val + "USDT", exchange: "BINANCE" };
    }
    const explicitMatch = message.match(/\$([A-Z]{2,6})/);
    if (explicitMatch) return { ticker: explicitMatch[1].toUpperCase() + "USDT", exchange: "BINANCE" };
    const pairMatch = message.match(/\b([A-Z]{2,6})(?:\/USDT|USDT)\b/);
    if (pairMatch) return { ticker: pairMatch[1].toUpperCase() + "USDT", exchange: "BINANCE" };
  }

  if (persona === "us-stocks") {
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
  LINK: "KRW-LINK", BNB: "KRW-BNB", MATIC: "KRW-MATIC", NEAR: "KRW-NEAR",
  SUI: "KRW-SUI", APT: "KRW-APT", ARB: "KRW-ARB", PEPE: "KRW-PEPE",
  SHIB: "KRW-SHIB", ATOM: "KRW-ATOM",
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

    let gains = 0, losses = 0;
    for (let i = 1; i < 14; i++) {
      const diff = closes[i] - closes[i - 1];
      if (diff > 0) gains += diff; else losses -= diff;
    }
    const avgGain = gains / 14;
    const avgLoss = losses / 14;
    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    const rsi = 100 - (100 / (1 + rs));

    const ma7 = closes.slice(-7).reduce((a: number, b: number) => a + b, 0) / 7;
    const ma20 = closes.slice(-20).reduce((a: number, b: number) => a + b, 0) / Math.min(closes.length, 20);
    const currentPrice = closes[closes.length - 1];
    const trend = currentPrice > ma7 && ma7 > ma20 ? "UPTREND" : currentPrice < ma7 && ma7 < ma20 ? "DOWNTREND" : "SIDEWAYS";

    return `RSI(14,4h): ${rsi.toFixed(1)} | MA7: $${ma7.toLocaleString(undefined, { maximumFractionDigits: 2 })} | MA20: $${ma20.toLocaleString(undefined, { maximumFractionDigits: 2 })} | Trend: ${trend}`;
  } catch {
    return null;
  }
}

/* ── Filter news/tweets relevant to the query ── */

function filterRelevantNews(items: CryptoNewsItem[], query: string, symbol: string | null): CryptoNewsItem[] {
  const lower = query.toLowerCase();
  const keywords = lower.split(/\s+/).filter(w => w.length > 2);
  if (symbol) keywords.push(symbol.toLowerCase());

  return items
    .filter((item) => {
      const text = `${item.title} ${item.body} ${item.categories.join(" ")}`.toLowerCase();
      return keywords.some(kw => text.includes(kw));
    })
    .slice(0, 8);
}


/* ── Main context builder ── */

export type ChatContextResult = {
  context: string;
  newsArticles: { title: string; url: string; source: string }[];
  tweets: { author: string; text: string; url: string }[];
  detectedSymbol: string | null;
};

// CoinGecko ID map (shared)
const CG_ID_MAP: Record<string, string> = {
  BTC: "bitcoin", ETH: "ethereum", SOL: "solana", XRP: "ripple",
  BNB: "binancecoin", DOGE: "dogecoin", ADA: "cardano", AVAX: "avalanche-2",
  DOT: "polkadot", LINK: "chainlink", NEAR: "near", ATOM: "cosmos",
  SUI: "sui", APT: "aptos", ARB: "arbitrum", OP: "optimism",
  PEPE: "pepe", SHIB: "shiba-inu", MATIC: "matic-network",
};

// Fetch Binance price with fallback endpoints
async function fetchBinancePrice(symbol: string): Promise<Response | null> {
  const endpoints = [
    `https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}`,
    `https://api1.binance.com/api/v3/ticker/24hr?symbol=${symbol}`,
    `https://data-api.binance.vision/api/v3/ticker/24hr?symbol=${symbol}`,
  ];
  for (const url of endpoints) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(3000), cache: "no-store" });
      if (res.ok) return res;
    } catch { continue; }
  }
  return null;
}

// CoinGecko price fallback
async function fetchCoinGeckoPrice(symbol: string): Promise<{ price: number; change24h: number; vol: number; high: number; low: number } | null> {
  const cgId = CG_ID_MAP[symbol];
  if (!cgId) return null;
  try {
    const res = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${cgId}&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true&include_high_24h=true&include_low_24h=true`,
      { signal: AbortSignal.timeout(5000) }
    );
    const data = await res.json();
    const coin = data[cgId];
    if (!coin?.usd) return null;
    return {
      price: coin.usd,
      change24h: coin.usd_24h_change || 0,
      vol: coin.usd_24h_vol || 0,
      high: coin.usd_24h_high || 0,
      low: coin.usd_24h_low || 0,
    };
  } catch { return null; }
}

// CryptoCompare price fallback (3rd source)
async function fetchCryptoComparePrice(symbol: string): Promise<{ price: number; change24h: number } | null> {
  try {
    const res = await fetch(
      `https://min-api.cryptocompare.com/data/pricemultifull?fsyms=${symbol}&tsyms=USD`,
      { signal: AbortSignal.timeout(4000) }
    );
    const data = await res.json();
    const raw = data?.RAW?.[symbol]?.USD;
    if (!raw?.PRICE) return null;
    return { price: raw.PRICE, change24h: raw.CHANGEPCT24HOUR || 0 };
  } catch { return null; }
}

// Always fetch top market prices as baseline context
async function fetchTopMarketPrices(): Promise<string> {
  try {
    const res = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana,ripple,binancecoin&vs_currencies=usd&include_24hr_change=true",
      { signal: AbortSignal.timeout(5000) }
    );
    const data = await res.json();
    const lines: string[] = [];
    const names: Record<string, string> = { bitcoin: "BTC", ethereum: "ETH", solana: "SOL", ripple: "XRP", binancecoin: "BNB" };
    for (const [id, sym] of Object.entries(names)) {
      const c = data[id];
      if (c?.usd) {
        const pct = c.usd_24h_change || 0;
        lines.push(`${sym}: $${c.usd.toLocaleString()} (${pct >= 0 ? "+" : ""}${pct.toFixed(2)}%)`);
      }
    }
    return lines.length > 0 ? `TOP PRICES: ${lines.join(" | ")}` : "";
  } catch { return ""; }
}

// Web search for latest info (DuckDuckGo Instant Answer API — no key needed)
async function webSearchContext(query: string): Promise<string> {
  try {
    const q = encodeURIComponent(`${query} crypto latest`);
    const res = await fetch(`https://api.duckduckgo.com/?q=${q}&format=json&no_html=1&skip_disambig=1`, {
      signal: AbortSignal.timeout(4000),
    });
    const data = await res.json();
    const parts: string[] = [];
    if (data.Abstract) parts.push(data.Abstract);
    if (data.RelatedTopics?.length) {
      for (const topic of data.RelatedTopics.slice(0, 3)) {
        if (topic.Text) parts.push(topic.Text);
      }
    }
    return parts.length > 0 ? `WEB SEARCH RESULTS:\n${parts.join("\n")}` : "";
  } catch { return ""; }
}

export async function buildCryptoContext(query: string): Promise<ChatContextResult> {
  const parts: string[] = [];

  const ticker = extractTicker(query, "crypto");
  const baseSymbol = ticker ? ticker.ticker.replace("USDT", "") : null;

  // Fetch ALL data sources in parallel (including fallbacks)
  const [binanceRes, upbitData, technicals, fngRes, cryptoPanicRes, rssNewsResult, xFeedResult, topPricesRes, webSearchRes] = await Promise.allSettled([
    ticker ? fetchBinancePrice(ticker.ticker) : Promise.resolve(null),
    baseSymbol ? fetchUpbitPrice(baseSymbol) : Promise.resolve(null),
    baseSymbol ? fetchBinanceKlines(baseSymbol) : Promise.resolve(null),
    fetch("https://api.alternative.me/fng/?limit=1", { signal: AbortSignal.timeout(3000) }),
    fetch("https://cryptopanic.com/api/free/v1/posts/?auth_token=free&public=true&kind=news&filter=hot", { signal: AbortSignal.timeout(3000) }),
    fetchCryptoNews().catch(() => [] as CryptoNewsItem[]),
    fetchCryptoFeed(3).catch(() => []),
    fetchTopMarketPrices(),
    webSearchContext(query),
  ]);

  // ── Always include top market prices as baseline ──
  const topPrices = topPricesRes.status === "fulfilled" ? topPricesRes.value : "";
  if (topPrices) parts.push(topPrices);

  // ── Price data (3-tier fallback: Binance → CoinGecko → CryptoCompare) ──
  let gotPrice = false;
  let usdPrice = 0;

  // Tier 1: Binance
  if (ticker && binanceRes.status === "fulfilled" && binanceRes.value && "ok" in binanceRes.value && binanceRes.value.ok) {
    try {
      const data = await binanceRes.value.json();
      const price = parseFloat(data.lastPrice);
      const pct = parseFloat(data.priceChangePercent);
      if (price > 0) {
        gotPrice = true;
        usdPrice = price;
        parts.push(`BINANCE ${ticker.ticker}: $${price.toLocaleString()} | 24h: ${pct >= 0 ? "+" : ""}${pct.toFixed(2)}% | Vol: $${(parseFloat(data.quoteVolume) / 1e6).toFixed(1)}M | High: $${parseFloat(data.highPrice).toLocaleString()} | Low: $${parseFloat(data.lowPrice).toLocaleString()}`);
      }
    } catch {}
  }

  // Tier 2: CoinGecko
  if (baseSymbol && !gotPrice) {
    const cgData = await fetchCoinGeckoPrice(baseSymbol);
    if (cgData) {
      gotPrice = true;
      usdPrice = cgData.price;
      parts.push(`${baseSymbol}/USD: $${cgData.price.toLocaleString()} | 24h: ${cgData.change24h >= 0 ? "+" : ""}${cgData.change24h.toFixed(2)}%${cgData.vol ? ` | Vol: $${(cgData.vol / 1e6).toFixed(1)}M` : ""}${cgData.high ? ` | High: $${cgData.high.toLocaleString()}` : ""}${cgData.low ? ` | Low: $${cgData.low.toLocaleString()}` : ""}`);
    }
  }

  // Tier 3: CryptoCompare
  if (baseSymbol && !gotPrice) {
    const ccData = await fetchCryptoComparePrice(baseSymbol);
    if (ccData) {
      gotPrice = true;
      usdPrice = ccData.price;
      parts.push(`${baseSymbol}/USD: $${ccData.price.toLocaleString()} | 24h: ${ccData.change24h >= 0 ? "+" : ""}${ccData.change24h.toFixed(2)}%`);
    }
  }

  // Upbit KRW price + Kimchi Premium
  const upbit = upbitData.status === "fulfilled" ? upbitData.value : null;
  if (upbit && usdPrice > 0 && baseSymbol) {
    const krwRate = upbit.price / usdPrice;
    const premium = ((krwRate / 1370) - 1) * 100;
    parts.push(`UPBIT ${baseSymbol}/KRW: ₩${upbit.price.toLocaleString()} | 24h: ${upbit.change >= 0 ? "+" : ""}${upbit.change.toFixed(2)}% | Vol: ₩${(upbit.volume / 1e8).toFixed(1)}억 | Kimchi Premium: ${premium >= 0 ? "+" : ""}${premium.toFixed(1)}%`);
  }

  // ── Technicals ──
  const tech = technicals.status === "fulfilled" ? technicals.value : null;
  if (tech) parts.push(`TECHNICALS: ${tech}`);

  // ── Fear & Greed ──
  if (fngRes.status === "fulfilled" && fngRes.value && "ok" in fngRes.value && fngRes.value.ok) {
    try {
      const fngData = await fngRes.value.json();
      const fg = fngData?.data?.[0];
      if (fg) parts.push(`FEAR & GREED: ${fg.value} (${fg.value_classification})`);
    } catch {}
  }

  // ── Aggregate news from ALL sources ──
  let newsArticles: { title: string; url: string; source: string }[] = [];

  // CryptoPanic (trending/hot)
  if (cryptoPanicRes.status === "fulfilled" && cryptoPanicRes.value && "ok" in cryptoPanicRes.value && cryptoPanicRes.value.ok) {
    try {
      const data = await cryptoPanicRes.value.json();
      const results = (data.results || []).slice(0, 5);
      newsArticles.push(...results.map((n: any) => ({
        title: n.title,
        url: n.url,
        source: n.source?.title || "CryptoPanic",
      })));
    } catch {}
  }

  // RSS aggregated news (CoinTelegraph, CoinDesk, Decrypt, etc.)
  const rssNews = rssNewsResult.status === "fulfilled" ? rssNewsResult.value : [];
  if (Array.isArray(rssNews) && rssNews.length > 0) {
    const relevant = filterRelevantNews(rssNews, query, baseSymbol);
    const rssFiltered = relevant.length > 0 ? relevant : rssNews.slice(0, 5);
    for (const n of rssFiltered) {
      // Avoid duplicates by title similarity
      if (!newsArticles.some(existing => existing.title.toLowerCase().includes(n.title.slice(0, 30).toLowerCase()))) {
        newsArticles.push({ title: n.title, url: n.url, source: n.source });
      }
    }
  }

  // Build news context for AI
  const topHeadlines = newsArticles.slice(0, 5).map(n => `[${n.source}] ${n.title}`).join("\n");
  if (topHeadlines) parts.push(`LATEST NEWS:\n${topHeadlines}`);

  // ── X/Twitter feed (analyst tweets) ──
  let tweets: { author: string; text: string; url: string }[] = [];
  const xFeed = xFeedResult.status === "fulfilled" ? xFeedResult.value : [];
  if (Array.isArray(xFeed) && xFeed.length > 0) {
    // XFeedItem has: tweetId, username, displayName, category
    const selection = xFeed.slice(0, 5);
    tweets = selection.map(t => ({
      author: t.displayName || t.username,
      text: `Latest from @${t.username} (${t.category})`,
      url: `https://x.com/${t.username}/status/${t.tweetId}`,
    }));

    const tweetContext = selection.map(t => `@${t.username} (${t.category})`).join(", ");
    if (tweetContext) parts.push(`ACTIVE ANALYSTS: ${tweetContext}`);
  }

  // ── Web search results (additional context for general queries) ──
  const webSearch = webSearchRes.status === "fulfilled" ? webSearchRes.value : "";
  if (webSearch) parts.push(webSearch);

  // Cap news at 8 items for the response
  newsArticles = newsArticles.slice(0, 8);

  return {
    context: parts.join("\n\n") || "No real-time data available.",
    newsArticles,
    tweets,
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
