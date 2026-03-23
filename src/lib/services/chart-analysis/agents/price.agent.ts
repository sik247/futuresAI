export type PriceAgentResult = {
  currentPrice: number;
  change24h: number;
  changePercent24h: number;
  volume24h: number;
  high24h: number;
  low24h: number;
  recentCandles: {
    time: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  }[];
  orderBook: {
    topBids: { price: number; quantity: number }[];
    topAsks: { price: number; quantity: number }[];
    bidAskSpread: number;
    bidDepthTotal: number;
    askDepthTotal: number;
  };
};

function normalizePair(pair: string): string {
  return pair.replace(/[/\-_ ]/g, "").toUpperCase();
}

export async function runPriceAgent(pair: string): Promise<PriceAgentResult> {
  const symbol = normalizePair(pair);
  const base = "https://api.binance.com/api/v3";

  const [tickerRes, klinesRes, depthRes] = await Promise.all([
    fetch(`${base}/ticker/24hr?symbol=${symbol}`),
    fetch(`${base}/klines?symbol=${symbol}&interval=4h&limit=50`),
    fetch(`${base}/depth?symbol=${symbol}&limit=20`),
  ]);

  if (!tickerRes.ok) {
    throw new Error(`Binance ticker failed: ${tickerRes.status}`);
  }

  const ticker = await tickerRes.json();
  const klines = klinesRes.ok ? await klinesRes.json() : [];
  const depth = depthRes.ok ? await depthRes.json() : { bids: [], asks: [] };

  const recentCandles = (klines as unknown[][]).map((k: unknown[]) => ({
    time: k[0] as number,
    open: parseFloat(k[1] as string),
    high: parseFloat(k[2] as string),
    low: parseFloat(k[3] as string),
    close: parseFloat(k[4] as string),
    volume: parseFloat(k[5] as string),
  }));

  const topBids = (depth.bids as string[][]).slice(0, 10).map((b: string[]) => ({
    price: parseFloat(b[0]),
    quantity: parseFloat(b[1]),
  }));
  const topAsks = (depth.asks as string[][]).slice(0, 10).map((a: string[]) => ({
    price: parseFloat(a[0]),
    quantity: parseFloat(a[1]),
  }));

  const bidDepthTotal = topBids.reduce((sum, b) => sum + b.price * b.quantity, 0);
  const askDepthTotal = topAsks.reduce((sum, a) => sum + a.price * a.quantity, 0);
  const bidAskSpread =
    topAsks.length > 0 && topBids.length > 0
      ? topAsks[0].price - topBids[0].price
      : 0;

  return {
    currentPrice: parseFloat(ticker.lastPrice),
    change24h: parseFloat(ticker.priceChange),
    changePercent24h: parseFloat(ticker.priceChangePercent),
    volume24h: parseFloat(ticker.quoteVolume),
    high24h: parseFloat(ticker.highPrice),
    low24h: parseFloat(ticker.lowPrice),
    recentCandles,
    orderBook: { topBids, topAsks, bidAskSpread, bidDepthTotal, askDepthTotal },
  };
}
