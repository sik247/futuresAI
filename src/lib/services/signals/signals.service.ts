export type SignalItem = {
  coin: string;
  symbol: string;
  price: number;
  change24h: number;
  volume24h: number;
  signal: "Strong Buy" | "Buy" | "Neutral" | "Sell" | "Strong Sell";
  confidence: number;
  reasons: string[];
  timestamp: string;
};

export type MarketSignals = {
  signals: SignalItem[];
  fearGreed: { value: number; classification: string };
  btcTrend: "above_sma" | "below_sma";
  marketSummary: string;
  updatedAt: string;
};

const COINS = [
  { id: "bitcoin", symbol: "BTC", name: "Bitcoin" },
  { id: "ethereum", symbol: "ETH", name: "Ethereum" },
  { id: "solana", symbol: "SOL", name: "Solana" },
  { id: "ripple", symbol: "XRP", name: "Ripple" },
];

function getSignalFromChange(change: number): SignalItem["signal"] {
  if (change > 5) return "Strong Buy";
  if (change > 2) return "Buy";
  if (change > -2) return "Neutral";
  if (change > -5) return "Sell";
  return "Strong Sell";
}

function getConfidence(
  change: number,
  fearGreedValue: number,
  isBtc: boolean,
  btcAboveSma: boolean
): number {
  let confidence = 50;
  const absChange = Math.abs(change);
  if (absChange > 5) confidence += 15;
  else if (absChange > 2) confidence += 8;

  if (fearGreedValue > 70) confidence += 10;
  else if (fearGreedValue < 30) confidence += 10;
  else confidence += 5;

  if (isBtc && btcAboveSma) confidence += 10;
  else if (isBtc) confidence -= 5;

  return Math.min(Math.max(confidence, 10), 95);
}

function buildReasons(
  change: number,
  fearGreedValue: number,
  fearGreedClass: string,
  isBtc: boolean,
  btcAboveSma: boolean
): string[] {
  const reasons: string[] = [];

  if (change > 5) reasons.push("Strong upward momentum in the last 24h");
  else if (change > 2) reasons.push("Positive price movement in the last 24h");
  else if (change > -2) reasons.push("Price consolidating within a tight range");
  else if (change > -5) reasons.push("Downward pressure observed in the last 24h");
  else reasons.push("Significant sell-off in the last 24h");

  if (fearGreedValue > 70)
    reasons.push(`Market sentiment: ${fearGreedClass} - potential overextension`);
  else if (fearGreedValue < 30)
    reasons.push(`Market sentiment: ${fearGreedClass} - potential buying opportunity`);
  else reasons.push(`Market sentiment: ${fearGreedClass}`);

  if (isBtc) {
    reasons.push(
      btcAboveSma
        ? "BTC trading above 7-day SMA - bullish trend"
        : "BTC trading below 7-day SMA - bearish trend"
    );
  }

  return reasons;
}

async function fetchBinancePrices() {
  const symbols = [
    { id: "bitcoin", symbol: "BTCUSDT" },
    { id: "ethereum", symbol: "ETHUSDT" },
    { id: "solana", symbol: "SOLUSDT" },
    { id: "ripple", symbol: "XRPUSDT" },
  ];

  const tickers = await Promise.all(
    symbols.map(async (s) => {
      const res = await fetch(
        `https://api.binance.com/api/v3/ticker/24hr?symbol=${s.symbol}`,
        { next: { revalidate: 300 } }
      );
      const data = await res.json();
      return {
        id: s.id,
        usd: parseFloat(data.lastPrice),
        usd_24h_change: parseFloat(data.priceChangePercent),
        usd_24h_vol: parseFloat(data.quoteVolume),
      };
    })
  );

  const result: Record<string, { usd: number; usd_24h_change: number; usd_24h_vol: number }> = {};
  for (const t of tickers) {
    result[t.id] = { usd: t.usd, usd_24h_change: t.usd_24h_change, usd_24h_vol: t.usd_24h_vol };
  }
  return result;
}

async function fetchBtcKlines(): Promise<number[][]> {
  const res = await fetch(
    "https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=4h&limit=42",
    { next: { revalidate: 300 } }
  );
  return res.json();
}

export async function fetchMarketSignals(): Promise<MarketSignals> {
  const [priceData, fngRes, klineData] = await Promise.all([
    fetchBinancePrices(),
    fetch("https://api.alternative.me/fng/?limit=1", {
      next: { revalidate: 300 },
    }),
    fetchBtcKlines(),
  ]);

  const fngData = await fngRes.json();
  // Binance klines: [openTime, open, high, low, close, ...]
  const ohlcData: number[][] = Array.isArray(klineData)
    ? klineData.map((k: any) => [k[0], parseFloat(k[1]), parseFloat(k[2]), parseFloat(k[3]), parseFloat(k[4])])
    : [];

  // Fear & Greed
  const fngEntry = fngData?.data?.[0] ?? { value: "50", value_classification: "Neutral" };
  const fearGreedValue = parseInt(fngEntry.value, 10);
  const fearGreedClass: string = fngEntry.value_classification;

  // BTC SMA calculation from OHLC (close prices are index 4)
  const closes = Array.isArray(ohlcData) ? ohlcData.map((c) => c[4]) : [];
  const sma = closes.length > 0 ? closes.reduce((a, b) => a + b, 0) / closes.length : 0;
  const latestClose = closes.length > 0 ? closes[closes.length - 1] : 0;
  const btcAboveSma = latestClose > sma;
  const btcTrend: MarketSignals["btcTrend"] = btcAboveSma ? "above_sma" : "below_sma";

  // Build signals
  const signals: SignalItem[] = COINS.map((coin) => {
    const data = priceData[coin.id];
    const price: number = data?.usd ?? 0;
    const change24h: number = data?.usd_24h_change ?? 0;
    const volume24h: number = data?.usd_24h_vol ?? 0;
    const isBtc = coin.id === "bitcoin";

    return {
      coin: coin.name,
      symbol: coin.symbol,
      price,
      change24h,
      volume24h,
      signal: getSignalFromChange(change24h),
      confidence: getConfidence(change24h, fearGreedValue, isBtc, btcAboveSma),
      reasons: buildReasons(change24h, fearGreedValue, fearGreedClass, isBtc, btcAboveSma),
      timestamp: new Date().toISOString(),
    };
  });

  // Market summary
  const bullCount = signals.filter((s) => s.signal === "Strong Buy" || s.signal === "Buy").length;
  const bearCount = signals.filter((s) => s.signal === "Strong Sell" || s.signal === "Sell").length;
  let marketSummary: string;
  if (bullCount > bearCount)
    marketSummary = "Market conditions are generally favorable with bullish momentum across major assets.";
  else if (bearCount > bullCount)
    marketSummary = "Market conditions show bearish pressure. Consider risk management strategies.";
  else
    marketSummary = "Market is in a consolidation phase. Mixed signals across major assets.";

  return {
    signals,
    fearGreed: { value: fearGreedValue, classification: fearGreedClass },
    btcTrend,
    marketSummary,
    updatedAt: new Date().toISOString(),
  };
}
