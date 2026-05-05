/**
 * Binance Futures public-data fetchers for the Glassnode-style multi-metric
 * pipeline. All endpoints work without auth; small-caps and majors alike have
 * full derivative data once the perp is listed.
 */

const FAPI = "https://fapi.binance.com";

export type Candle = {
  time: number;        // unix seconds (lightweight-charts convention)
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

export type FundingPoint = { time: number; rate: number };          // rate as decimal, e.g. 0.0001 = 0.01%
export type OiPoint = { time: number; oi: number; oiValue: number }; // sumOpenInterest in coin units, sumOpenInterestValue in USDT
export type LsPoint = { time: number; ratio: number; longPct: number; shortPct: number };

function symbolFromPair(pair: string): string {
  // "BTCUSDT.P" → "BTCUSDT", "BTCUSDT" → "BTCUSDT"
  return pair.replace(/\.P$/, "");
}

export async function fetchKlines(pair: string, interval = "4h", limit = 200): Promise<Candle[]> {
  const sym = symbolFromPair(pair);
  const r = await fetch(`${FAPI}/fapi/v1/klines?symbol=${sym}&interval=${interval}&limit=${limit}`);
  if (!r.ok) throw new Error(`klines failed: ${r.status}`);
  const raw = (await r.json()) as any[][];
  return raw.map((c) => ({
    time: Math.floor(c[0] / 1000),
    open: parseFloat(c[1]),
    high: parseFloat(c[2]),
    low: parseFloat(c[3]),
    close: parseFloat(c[4]),
    volume: parseFloat(c[5]),
  }));
}

export async function fetchFunding(pair: string, limit = 100): Promise<FundingPoint[]> {
  const sym = symbolFromPair(pair);
  const r = await fetch(`${FAPI}/fapi/v1/fundingRate?symbol=${sym}&limit=${limit}`);
  if (!r.ok) throw new Error(`funding failed: ${r.status}`);
  const raw = (await r.json()) as Array<{ fundingTime: number; fundingRate: string }>;
  return raw.map((p) => ({ time: Math.floor(p.fundingTime / 1000), rate: parseFloat(p.fundingRate) }));
}

export async function fetchOi(pair: string, period = "4h", limit = 100): Promise<OiPoint[]> {
  const sym = symbolFromPair(pair);
  const r = await fetch(`${FAPI}/futures/data/openInterestHist?symbol=${sym}&period=${period}&limit=${limit}`);
  if (!r.ok) throw new Error(`oi failed: ${r.status}`);
  const raw = (await r.json()) as Array<{ timestamp: number; sumOpenInterest: string; sumOpenInterestValue: string }>;
  return raw.map((p) => ({
    time: Math.floor(p.timestamp / 1000),
    oi: parseFloat(p.sumOpenInterest),
    oiValue: parseFloat(p.sumOpenInterestValue),
  }));
}

/** Top-trader long/short *position* ratio — what whales actually hold. */
export async function fetchTopLongShort(pair: string, period = "4h", limit = 100): Promise<LsPoint[]> {
  const sym = symbolFromPair(pair);
  const r = await fetch(`${FAPI}/futures/data/topLongShortPositionRatio?symbol=${sym}&period=${period}&limit=${limit}`);
  if (!r.ok) throw new Error(`topLs failed: ${r.status}`);
  const raw = (await r.json()) as Array<{ timestamp: number; longShortRatio: string; longAccount: string; shortAccount: string }>;
  return raw.map((p) => ({
    time: Math.floor(p.timestamp / 1000),
    ratio: parseFloat(p.longShortRatio),
    longPct: parseFloat(p.longAccount),
    shortPct: parseFloat(p.shortAccount),
  }));
}

/** Global long/short *account* ratio — retail bias. */
export async function fetchGlobalLongShort(pair: string, period = "4h", limit = 100): Promise<LsPoint[]> {
  const sym = symbolFromPair(pair);
  const r = await fetch(`${FAPI}/futures/data/globalLongShortAccountRatio?symbol=${sym}&period=${period}&limit=${limit}`);
  if (!r.ok) throw new Error(`globalLs failed: ${r.status}`);
  const raw = (await r.json()) as Array<{ timestamp: number; longShortRatio: string; longAccount: string; shortAccount: string }>;
  return raw.map((p) => ({
    time: Math.floor(p.timestamp / 1000),
    ratio: parseFloat(p.longShortRatio),
    longPct: parseFloat(p.longAccount),
    shortPct: parseFloat(p.shortAccount),
  }));
}

// ---- indicator math (RSI / MACD) ----

export function rsi(closes: number[], period = 14): number[] {
  const out: number[] = new Array(closes.length).fill(NaN);
  if (closes.length <= period) return out;
  let gains = 0, losses = 0;
  for (let i = 1; i <= period; i++) {
    const d = closes[i] - closes[i - 1];
    if (d > 0) gains += d; else losses -= d;
  }
  let avgG = gains / period, avgL = losses / period;
  out[period] = avgL === 0 ? 100 : 100 - 100 / (1 + avgG / avgL);
  for (let i = period + 1; i < closes.length; i++) {
    const d = closes[i] - closes[i - 1];
    const g = d > 0 ? d : 0;
    const l = d < 0 ? -d : 0;
    avgG = (avgG * (period - 1) + g) / period;
    avgL = (avgL * (period - 1) + l) / period;
    out[i] = avgL === 0 ? 100 : 100 - 100 / (1 + avgG / avgL);
  }
  return out;
}

function ema(values: number[], period: number): number[] {
  const out: number[] = new Array(values.length).fill(NaN);
  if (values.length === 0) return out;
  const k = 2 / (period + 1);
  // Seed with SMA over first `period`
  if (values.length < period) return out;
  let sum = 0;
  for (let i = 0; i < period; i++) sum += values[i];
  out[period - 1] = sum / period;
  for (let i = period; i < values.length; i++) {
    out[i] = values[i] * k + out[i - 1] * (1 - k);
  }
  return out;
}

export function macd(closes: number[], fast = 12, slow = 26, signal = 9): {
  macd: number[];
  signal: number[];
  histogram: number[];
} {
  const fastE = ema(closes, fast);
  const slowE = ema(closes, slow);
  const macdLine = closes.map((_, i) =>
    Number.isFinite(fastE[i]) && Number.isFinite(slowE[i]) ? fastE[i] - slowE[i] : NaN,
  );
  // Signal EMA over macd line (only over defined values)
  const validIdx = macdLine.findIndex((v) => Number.isFinite(v));
  const subLine = validIdx >= 0 ? macdLine.slice(validIdx) : [];
  const sigSub = ema(subLine, signal);
  const sigLine = new Array(closes.length).fill(NaN);
  for (let i = 0; i < sigSub.length; i++) sigLine[validIdx + i] = sigSub[i];
  const hist = macdLine.map((v, i) => (Number.isFinite(v) && Number.isFinite(sigLine[i]) ? v - sigLine[i] : NaN));
  return { macd: macdLine, signal: sigLine, histogram: hist };
}
