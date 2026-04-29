/**
 * Lightweight price-snapshot agent for Telegram news/analysis prompts.
 *
 * Why this exists: news analysis prompts that don't include real prices
 * cause the LLM to hallucinate stale numbers from training data
 * (e.g. ETH at $3,000–$3,200 in 2026). This agent fetches a fresh
 * snapshot from Binance so prompts can quote ground-truth prices.
 *
 * Resilience requirements:
 *   - Binance's batch endpoint fails the WHOLE request if any one symbol
 *     is invalid (400 Bad Request). We fall back to per-symbol fetches
 *     so a single missing pair never blanks the whole snapshot.
 *   - 60s in-memory cache absorbs tightly-spaced cron firings.
 *   - Stale cache is preferred over an empty string when the network is
 *     flaky — better to quote a 5-min-old price than invent one.
 */

const DEFAULT_TICKERS = ["BTC", "ETH", "SOL", "XRP", "BNB", "DOGE"];

// Tight regex of liquid majors that we trust to have a Binance USDT pair.
// Matches WORD boundaries so prose like "BTCUSDT" still hits "BTC".
const TICKER_REGEX =
  /\b(BTC|ETH|SOL|XRP|BNB|DOGE|ADA|AVAX|LINK|MATIC|DOT|TRX|TON|SHIB|SUI|APT|ARB|OP|NEAR|ATOM|LTC|UNI|PEPE|WIF|FIL|ETC|ICP|HBAR|INJ|RUNE|TIA|RNDR)\b/gi;

const SNAPSHOT_TTL_MS = 60_000;
// Stale-but-usable window: if the network is down we still quote prices up
// to 5 min old rather than letting the LLM hallucinate fresh ones.
const STALE_OK_MS = 5 * 60_000;

type TickerSnapshot = {
  symbol: string;
  price: number;
  changePct24h: number;
  high24h: number;
  low24h: number;
};

let cache: { at: number; data: Record<string, TickerSnapshot> } = {
  at: 0,
  data: {},
};

type BinanceTicker = {
  symbol: string;
  lastPrice: string;
  priceChangePercent: string;
  highPrice: string;
  lowPrice: string;
};

function toTickerSnapshot(t: BinanceTicker): TickerSnapshot | null {
  const price = parseFloat(t.lastPrice);
  const changePct24h = parseFloat(t.priceChangePercent);
  if (!Number.isFinite(price) || price <= 0) return null;
  return {
    symbol: t.symbol.replace(/USDT$/, ""),
    price,
    changePct24h: Number.isFinite(changePct24h) ? changePct24h : 0,
    high24h: parseFloat(t.highPrice) || price,
    low24h: parseFloat(t.lowPrice) || price,
  };
}

async function fetchBatch(symbols: string[]): Promise<TickerSnapshot[]> {
  const pairs = symbols.map((s) => `${s}USDT`);
  // The whole `["BTCUSDT",...]` string must be URL-encoded — brackets and
  // quotes included. Building the JSON first then encoding is safest.
  const url = `https://api.binance.com/api/v3/ticker/24hr?symbols=${encodeURIComponent(
    JSON.stringify(pairs)
  )}`;

  const res = await fetch(url, {
    cache: "no-store",
    signal: AbortSignal.timeout(4000),
  });
  if (!res.ok) throw new Error(`Binance batch ${res.status}`);
  const arr = (await res.json()) as BinanceTicker[];
  return arr.map(toTickerSnapshot).filter((x): x is TickerSnapshot => x !== null);
}

async function fetchSingle(symbol: string): Promise<TickerSnapshot | null> {
  try {
    const res = await fetch(
      `https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}USDT`,
      { cache: "no-store", signal: AbortSignal.timeout(3000) }
    );
    if (!res.ok) return null;
    return toTickerSnapshot((await res.json()) as BinanceTicker);
  } catch {
    return null;
  }
}

async function refresh(symbols: string[]): Promise<void> {
  const need = symbols.map((s) => s.toUpperCase());
  if (need.length === 0) return;

  // Try one batch call first — covers the happy path in 1 RTT.
  try {
    const fresh = await fetchBatch(need);
    if (fresh.length > 0) {
      const merged = { ...cache.data };
      for (const t of fresh) merged[t.symbol] = t;
      cache = { at: Date.now(), data: merged };
      // Mark anything that didn't come back (Binance silently drops it
      // from the response only if every symbol resolved — but be safe)
      const got = new Set(fresh.map((t) => t.symbol));
      const missed = need.filter((s) => !got.has(s));
      if (missed.length === 0) return;
      // Fall through to fill missed via single calls.
      need.length = 0;
      need.push(...missed);
    }
  } catch {
    // batch failed; fall through to per-symbol fallback below
  }

  // Per-symbol fallback. Parallel but bounded by the array length (≤6 typ).
  const results = await Promise.all(need.map((s) => fetchSingle(s)));
  const merged = { ...cache.data };
  for (const r of results) {
    if (r) merged[r.symbol] = r;
  }
  if (Object.keys(merged).length > Object.keys(cache.data).length) {
    cache = { at: Date.now(), data: merged };
  }
}

async function getSnapshots(
  symbols: string[]
): Promise<Record<string, TickerSnapshot>> {
  const want = symbols.map((s) => s.toUpperCase());
  const now = Date.now();
  const fresh = now - cache.at < SNAPSHOT_TTL_MS;
  const allCovered = want.every((s) => cache.data[s]);

  if (!fresh || !allCovered) {
    await refresh(want);
  }
  return cache.data;
}

function formatPrice(p: number): string {
  if (p >= 1000) return `$${p.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  if (p >= 1) return `$${p.toFixed(2)}`;
  return `$${p.toPrecision(4)}`;
}

/**
 * Pull tickers (BTC/ETH/...) referenced in arbitrary text.
 * Returns uppercase, deduped symbols. Empty array if none match.
 */
export function extractTickers(text: string): string[] {
  if (!text) return [];
  const matches = text.match(TICKER_REGEX);
  if (!matches) return [];
  return Array.from(new Set(matches.map((m) => m.toUpperCase())));
}

/**
 * Returns a compact one-line price block ready to paste into an AI prompt.
 *
 * Example output:
 *   "BTC $95,432 (+2.1%) | ETH $3,521 (-0.8%) | SOL $185 (+5.4%)"
 *
 * Returns "" only if there is no usable data at all (no fresh fetch and
 * no cache, even stale). Callers should treat "" as "do not quote prices".
 */
export async function getPriceSnapshot(
  symbols: string[] = DEFAULT_TICKERS
): Promise<string> {
  const want = (symbols.length > 0 ? symbols : DEFAULT_TICKERS).map((s) =>
    s.toUpperCase()
  );
  const data = await getSnapshots(want);

  // If the cache is too stale even after a refresh attempt, refuse to quote
  // — better empty than wrong.
  if (Date.now() - cache.at > STALE_OK_MS) return "";

  const lines: string[] = [];
  for (const sym of want) {
    const t = data[sym];
    if (!t || !Number.isFinite(t.price)) continue;
    const sign = t.changePct24h >= 0 ? "+" : "";
    lines.push(
      `${sym} ${formatPrice(t.price)} (${sign}${t.changePct24h.toFixed(1)}%)`
    );
  }
  return lines.join(" | ");
}

/**
 * Same data as getPriceSnapshot, but returns the raw map.
 * Use when you need exact numbers (e.g. to compute support/resistance).
 */
export async function getPriceSnapshotRaw(
  symbols: string[] = DEFAULT_TICKERS
): Promise<Record<string, TickerSnapshot>> {
  return getSnapshots(symbols);
}

/**
 * Convenience: extract tickers from a headline, then fetch a snapshot
 * for just those (falls back to BTC/ETH/SOL if none found).
 */
export async function getSnapshotForText(text: string): Promise<string> {
  const tickers = extractTickers(text);
  const target = tickers.length > 0 ? tickers : ["BTC", "ETH", "SOL"];
  return getPriceSnapshot(target);
}
