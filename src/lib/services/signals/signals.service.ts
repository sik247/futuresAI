export type SignalItem = {
  coin: string;
  symbol: string;
  price: number;
  change24h: number;
  volume24h: number;
  signal: "Strong Buy" | "Buy" | "Neutral" | "Sell" | "Strong Sell";
  confidence: number;
  reasons: string[];
  rsi: number;
  macd: { value: number; signal: number; histogram: number };
  sparkline: number[];
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
  { id: "binancecoin", symbol: "BNB", name: "BNB" },
  { id: "dogecoin", symbol: "DOGE", name: "Dogecoin" },
  { id: "cardano", symbol: "ADA", name: "Cardano" },
  { id: "avalanche-2", symbol: "AVAX", name: "Avalanche" },
  { id: "polkadot", symbol: "DOT", name: "Polkadot" },
  { id: "chainlink", symbol: "LINK", name: "Chainlink" },
];

function getSignalFromChange(change: number): SignalItem["signal"] {
  if (change > 5) return "Strong Buy";
  if (change > 2) return "Buy";
  if (change > -2) return "Neutral";
  if (change > -5) return "Sell";
  return "Strong Sell";
}

function applyRsiFilter(
  signal: SignalItem["signal"],
  rsi: number
): SignalItem["signal"] {
  if (
    rsi > 70 &&
    (signal === "Buy" || signal === "Strong Buy")
  ) {
    return "Neutral";
  }
  if (
    rsi < 30 &&
    (signal === "Sell" || signal === "Strong Sell")
  ) {
    return "Neutral";
  }
  return signal;
}

function getConfidence(
  change: number,
  fearGreedValue: number,
  isBtc: boolean,
  btcAboveSma: boolean,
  rsi: number
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

  // RSI extremes indicate clearer signals
  if (rsi > 70 || rsi < 30) confidence += 10;

  return Math.min(Math.max(confidence, 10), 95);
}

function buildReasons(
  change: number,
  fearGreedValue: number,
  fearGreedClass: string,
  isBtc: boolean,
  btcAboveSma: boolean,
  rsi: number
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

  if (rsi > 70) reasons.push(`RSI at ${rsi.toFixed(1)} - overbought territory`);
  else if (rsi < 30) reasons.push(`RSI at ${rsi.toFixed(1)} - oversold territory`);

  return reasons;
}

async function fetchBinancePrices() {
  const symbols = COINS.map((c) => ({ id: c.id, symbol: `${c.symbol}USDT` }));

  try {
    const tickers = await Promise.all(
      symbols.map(async (s) => {
        const res = await fetch(
          `https://api.binance.com/api/v3/ticker/24hr?symbol=${s.symbol}`,
          { next: { revalidate: 60 } }
        );
        if (!res.ok) throw new Error(`Binance ${s.symbol}: ${res.status}`);
        const data = await res.json();
        return {
          id: s.id,
          usd: parseFloat(data.lastPrice) || 0,
          usd_24h_change: parseFloat(data.priceChangePercent) || 0,
          usd_24h_vol: parseFloat(data.quoteVolume) || 0,
        };
      })
    );

    // Verify we got actual prices (not all zeros)
    const hasValidPrices = tickers.some((t) => t.usd > 0);
    if (!hasValidPrices) throw new Error("Binance returned zero prices");

    const result: Record<string, { usd: number; usd_24h_change: number; usd_24h_vol: number }> = {};
    for (const t of tickers) {
      result[t.id] = { usd: t.usd, usd_24h_change: t.usd_24h_change, usd_24h_vol: t.usd_24h_vol };
    }
    return result;
  } catch {
    // Fallback to CoinGecko if Binance fails
    return fetchCoinGeckoPrices();
  }
}

async function fetchCoinGeckoPrices() {
  const ids = COINS.map((c) => c.id).join(",");
  const res = await fetch(
    `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true`,
    { next: { revalidate: 60 } }
  );
  const data = await res.json();

  const result: Record<string, { usd: number; usd_24h_change: number; usd_24h_vol: number }> = {};
  for (const id of ids.split(",")) {
    const coin = data[id];
    if (coin) {
      result[id] = {
        usd: coin.usd || 0,
        usd_24h_change: coin.usd_24h_change || 0,
        usd_24h_vol: coin.usd_24h_vol || 0,
      };
    }
  }
  return result;
}

function calculateRSI(closes: number[], period = 14): number {
  if (closes.length < period + 1) return 50;
  let gains = 0, losses = 0;
  for (let i = 1; i <= period; i++) {
    const change = closes[i] - closes[i - 1];
    if (change > 0) gains += change;
    else losses -= change;
  }
  let avgGain = gains / period;
  let avgLoss = losses / period;
  for (let i = period + 1; i < closes.length; i++) {
    const change = closes[i] - closes[i - 1];
    avgGain = (avgGain * (period - 1) + (change > 0 ? change : 0)) / period;
    avgLoss = (avgLoss * (period - 1) + (change < 0 ? -change : 0)) / period;
  }
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

function calculateEMA(data: number[], period: number): number[] {
  const k = 2 / (period + 1);
  const ema = [data[0]];
  for (let i = 1; i < data.length; i++) {
    ema.push(data[i] * k + ema[i - 1] * (1 - k));
  }
  return ema;
}

function calculateMACD(closes: number[]): { value: number; signal: number; histogram: number } {
  if (closes.length < 26) return { value: 0, signal: 0, histogram: 0 };
  const ema12 = calculateEMA(closes, 12);
  const ema26 = calculateEMA(closes, 26);
  const macdLine = ema12.map((v, i) => v - ema26[i]);
  const signalLine = calculateEMA(macdLine.slice(26), 9);
  const macdValue = macdLine[macdLine.length - 1];
  const signalValue = signalLine[signalLine.length - 1];
  return { value: macdValue, signal: signalValue, histogram: macdValue - signalValue };
}

async function fetchAllKlines(): Promise<Record<string, string[][]>> {
  const results: Record<string, string[][]> = {};
  const fetches = COINS.map(async (coin) => {
    try {
      const res = await fetch(
        `https://api.binance.com/api/v3/klines?symbol=${coin.symbol}USDT&interval=4h&limit=50`,
        { next: { revalidate: 60 } }
      );
      if (!res.ok) return;
      results[coin.id] = await res.json();
    } catch { /* skip */ }
  });
  await Promise.allSettled(fetches);
  return results;
}

async function fetchSparklineData(): Promise<Record<string, number[]>> {
  const results: Record<string, number[]> = {};
  const fetches = COINS.map(async (coin) => {
    try {
      const res = await fetch(
        `https://api.binance.com/api/v3/klines?symbol=${coin.symbol}USDT&interval=1h&limit=24`,
        { next: { revalidate: 60 } }
      );
      if (!res.ok) return;
      const klines = await res.json();
      results[coin.id] = klines.map((k: (string | number)[]) => parseFloat(k[4] as string)); // close prices
    } catch { /* skip */ }
  });
  await Promise.allSettled(fetches);
  return results;
}

export async function fetchMarketSignals(): Promise<MarketSignals> {
  const [priceData, fngRes, allKlines, sparklineData] = await Promise.all([
    fetchBinancePrices(),
    fetch("https://api.alternative.me/fng/?limit=1", {
      next: { revalidate: 300 },
    }),
    fetchAllKlines(),
    fetchSparklineData(),
  ]);

  const fngData = await fngRes.json();

  // Fear & Greed
  const fngEntry = fngData?.data?.[0] ?? { value: "50", value_classification: "Neutral" };
  const fearGreedValue = parseInt(fngEntry.value, 10);
  const fearGreedClass: string = fngEntry.value_classification;

  // BTC SMA calculation from OHLC (close prices are index 4)
  const btcRawKlines = allKlines["bitcoin"] ?? [];
  const ohlcData: number[][] = Array.isArray(btcRawKlines)
    ? btcRawKlines.map((k) => [
        parseFloat(k[0]),
        parseFloat(k[1]),
        parseFloat(k[2]),
        parseFloat(k[3]),
        parseFloat(k[4]),
      ])
    : [];

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

    // RSI & MACD from 4h klines
    const rawKlines = allKlines[coin.id] ?? [];
    const coinCloses = rawKlines.map((k) => parseFloat(k[4]));
    const rsi = calculateRSI(coinCloses);
    const macd = calculateMACD(coinCloses);

    // Sparkline from 1h klines
    const sparkline = sparklineData[coin.id] ?? [];

    const baseSignal = getSignalFromChange(change24h);
    const signal = applyRsiFilter(baseSignal, rsi);

    return {
      coin: coin.name,
      symbol: coin.symbol,
      price,
      change24h,
      volume24h,
      signal,
      confidence: getConfidence(change24h, fearGreedValue, isBtc, btcAboveSma, rsi),
      reasons: buildReasons(change24h, fearGreedValue, fearGreedClass, isBtc, btcAboveSma, rsi),
      rsi,
      macd,
      sparkline,
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
