const HL_API = "https://api.hyperliquid.xyz/info";

export interface HLPosition {
  coin: string;
  szi: string; // signed size (+ = long, - = short)
  entryPx: string;
  liquidationPx: string | null;
  unrealizedPnl: string;
  returnOnEquity: string;
  leverage: { type: string; value: number };
  marginUsed: string;
}

export interface HLWalletData {
  address: string;
  name: string;
  accountValue: number;
  totalNotional: number;
  positions: {
    coin: string;
    direction: "LONG" | "SHORT";
    size: number;
    entryPrice: number;
    liquidationPrice: number | null;
    unrealizedPnl: number;
    roe: number;
    leverage: number;
    marginUsed: number;
  }[];
}

// Static whale list — well-known tracked wallets
const HL_WHALES_STATIC = [
  { name: "Mega Whale", address: "0xfc667adba8d4837586078f4fdcdc29804337ca06" },
  { name: "Crocodile Whale", address: "0x5b5d51203a0f9079f8aeb098a6523a13f298c060" },
  { name: "Machi Big Brother", address: "0x020ca66c30bec2c4fe3861a94e4db4a498a35872" },
  { name: "BTC 40x Shorter", address: "0xec326a384ae965647d87e1f85db46d2efa15ae82" },
  { name: "HyperLion", address: "0x30aabe810c91cb667be3590fb33359104fa5be8e" },
];

// Cache for dynamic leaderboard wallets
let leaderboardCache: { name: string; address: string }[] = [];
let leaderboardLastFetch = 0;
const LEADERBOARD_TTL = 10 * 60 * 1000; // 10 min

async function fetchHLLeaderboard(): Promise<{ name: string; address: string }[]> {
  if (Date.now() - leaderboardLastFetch < LEADERBOARD_TTL && leaderboardCache.length > 0) {
    return leaderboardCache;
  }
  try {
    // HL leaderboard API — get top PnL traders
    const res = await fetch(HL_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "leaderboard", timeWindow: "day" }),
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return [];
    const data = await res.json();
    const rows = data?.leaderboardRows || [];
    // Top 10 by account value, skip known wallets
    const known = new Set(HL_WHALES_STATIC.map((w) => w.address.toLowerCase()));
    const top = rows
      .filter((r: any) => !known.has((r.ethAddress || "").toLowerCase()) && parseFloat(r.accountValue || "0") > 100000)
      .sort((a: any, b: any) => parseFloat(b.accountValue || "0") - parseFloat(a.accountValue || "0"))
      .slice(0, 8)
      .map((r: any, i: number) => ({
        name: r.displayName || `Top Trader #${i + 1}`,
        address: r.ethAddress,
      }));
    leaderboardCache = top;
    leaderboardLastFetch = Date.now();
    return top;
  } catch {
    return leaderboardCache; // return stale cache on error
  }
}

// Combined whale list: static + dynamic leaderboard
async function getHL_WHALES(): Promise<{ name: string; address: string }[]> {
  const dynamic = await fetchHLLeaderboard();
  return [...HL_WHALES_STATIC, ...dynamic];
}

// Minimum account value to display (filter out empty/tiny wallets)
const MIN_ACCOUNT_VALUE = 1000;

/* ── Market-wide HL data (funding, OI, prices) ──────────────────────── */

export interface HLMarketData {
  coin: string;
  markPrice: number;
  openInterest: number;
  openInterestUsd: number;
  fundingRate: number;
  fundingRateApr: number;
  volume24h: number;
}

export async function fetchHLMarketData(): Promise<HLMarketData[]> {
  try {
    const res = await fetch(HL_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "metaAndAssetCtxs" }),
    });
    if (!res.ok) return [];
    const data = await res.json();
    if (!Array.isArray(data) || data.length < 2) return [];

    const meta = data[0];
    const ctxs = data[1];
    const coins = (meta.universe || []).map((u: any) => u.name);

    const markets: HLMarketData[] = [];
    for (let i = 0; i < Math.min(coins.length, ctxs.length); i++) {
      const ctx = ctxs[i];
      const markPrice = parseFloat(ctx.markPx || "0");
      const oi = parseFloat(ctx.openInterest || "0");
      const funding = parseFloat(ctx.funding || "0");
      const vol24h = parseFloat(ctx.dayNtlVlm || "0");

      if (oi === 0 && vol24h === 0) continue;

      markets.push({
        coin: coins[i],
        markPrice,
        openInterest: oi,
        openInterestUsd: oi * markPrice,
        fundingRate: funding,
        fundingRateApr: funding * 876000, // annualized (8h * 3 * 365)
        volume24h: vol24h,
      });
    }

    return markets.sort((a, b) => b.openInterestUsd - a.openInterestUsd);
  } catch {
    return [];
  }
};

export async function fetchHLWalletData(address: string, name: string): Promise<HLWalletData | null> {
  try {
    const res = await fetch(HL_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "clearinghouseState", user: address }),
    });
    if (!res.ok) return null;
    const data = await res.json();

    const accountValue = parseFloat(data.marginSummary?.accountValue || "0");
    const totalNotional = parseFloat(data.marginSummary?.totalNtlPos || "0");

    const positions = (data.assetPositions || [])
      .filter((p: any) => parseFloat(p.position?.szi || "0") !== 0)
      .map((p: any) => {
        const pos = p.position;
        const size = parseFloat(pos.szi || "0");
        return {
          coin: pos.coin,
          direction: size > 0 ? "LONG" : "SHORT" as "LONG" | "SHORT",
          size: Math.abs(size),
          entryPrice: parseFloat(pos.entryPx || "0"),
          liquidationPrice: pos.liquidationPx ? parseFloat(pos.liquidationPx) : null,
          unrealizedPnl: parseFloat(pos.unrealizedPnl || "0"),
          roe: parseFloat(pos.returnOnEquity || "0") * 100,
          leverage: pos.leverage?.value || 1,
          marginUsed: parseFloat(pos.marginUsed || "0"),
        };
      })
      .sort((a: any, b: any) => Math.abs(b.marginUsed) - Math.abs(a.marginUsed));

    return { address, name, accountValue, totalNotional, positions };
  } catch {
    return null;
  }
}

export async function fetchAllHLWhales(): Promise<HLWalletData[]> {
  const whales = await getHL_WHALES();
  const results = await Promise.allSettled(
    whales.map(w => fetchHLWalletData(w.address, w.name))
  );
  return results
    .filter((r): r is PromiseFulfilledResult<HLWalletData | null> => r.status === "fulfilled" && r.value !== null)
    .map(r => r.value!)
    .filter(w => w.accountValue >= MIN_ACCOUNT_VALUE)
    .sort((a, b) => b.accountValue - a.accountValue); // Largest accounts first
}

/* ── Recent fills (trades) for a whale ─────────────────────────────── */

export interface HLFill {
  coin: string;
  side: "B" | "A"; // B = buy, A = sell
  px: string;
  sz: string;
  time: number;
  closedPnl: string;
  fee: string;
}

export interface HLWhaleTrade {
  whale: string;
  coin: string;
  side: "BUY" | "SELL";
  price: number;
  size: number;
  notional: number;
  closedPnl: number;
  time: number;
}

async function fetchHLFills(address: string): Promise<HLFill[]> {
  try {
    const res = await fetch(HL_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "userFills", user: address }),
      next: { revalidate: 300 },
    } as any);
    if (!res.ok) return [];
    const fills: HLFill[] = await res.json();
    return fills.slice(0, 50); // last 50 fills
  } catch {
    return [];
  }
}

export async function fetchAllHLTrades(): Promise<HLWhaleTrade[]> {
  const whales = await getHL_WHALES();
  const results = await Promise.allSettled(
    whales.map(async (w) => {
      const fills = await fetchHLFills(w.address);
      return fills.map((f) => ({
        whale: w.name,
        coin: f.coin,
        side: (f.side === "B" ? "BUY" : "SELL") as "BUY" | "SELL",
        price: parseFloat(f.px),
        size: parseFloat(f.sz),
        notional: parseFloat(f.px) * parseFloat(f.sz),
        closedPnl: parseFloat(f.closedPnl || "0"),
        time: f.time,
      }));
    })
  );

  const allTrades: HLWhaleTrade[] = [];
  for (const r of results) {
    if (r.status === "fulfilled") allTrades.push(...r.value);
  }

  // Sort by time descending, take top 100
  return allTrades.sort((a, b) => b.time - a.time).slice(0, 100);
}

/* ── Movement Detection — significant whale activity ──────────────── */

export interface WhaleMovement {
  whale: string;
  type: "NEW_POSITION" | "LARGE_TRADE" | "POSITION_CLOSED" | "LIQUIDATION_RISK";
  coin: string;
  direction: "LONG" | "SHORT";
  notional: number;
  details: string;
  timestamp: number;
}

const LARGE_TRADE_THRESHOLD = 50000; // $50K+ notional = significant
const LIQUIDATION_RISK_THRESHOLD = 0.15; // within 15% of liquidation price

export async function detectWhaleMovements(): Promise<WhaleMovement[]> {
  const movements: WhaleMovement[] = [];
  const whales = await getHL_WHALES();

  const [walletsResult, tradesResult] = await Promise.allSettled([
    fetchAllHLWhales(),
    fetchAllHLTrades(),
  ]);

  const wallets = walletsResult.status === "fulfilled" ? walletsResult.value : [];
  const trades = tradesResult.status === "fulfilled" ? tradesResult.value : [];

  // 1. Large trades in the last 30 minutes
  const thirtyMinAgo = Date.now() - 30 * 60 * 1000;
  for (const trade of trades) {
    if (trade.time > thirtyMinAgo && trade.notional >= LARGE_TRADE_THRESHOLD) {
      movements.push({
        whale: trade.whale,
        type: "LARGE_TRADE",
        coin: trade.coin,
        direction: trade.side === "BUY" ? "LONG" : "SHORT",
        notional: trade.notional,
        details: `${trade.side} ${trade.coin} $${(trade.notional / 1000).toFixed(1)}K at $${trade.price.toLocaleString()}`,
        timestamp: trade.time,
      });
    }
  }

  // 2. Positions near liquidation
  for (const wallet of wallets) {
    for (const pos of wallet.positions) {
      if (pos.liquidationPrice && pos.liquidationPrice > 0) {
        const distanceToLiq = Math.abs(pos.entryPrice - pos.liquidationPrice) / pos.entryPrice;
        if (distanceToLiq < LIQUIDATION_RISK_THRESHOLD && pos.marginUsed > 10000) {
          movements.push({
            whale: wallet.name,
            type: "LIQUIDATION_RISK",
            coin: pos.coin,
            direction: pos.direction,
            notional: pos.size * pos.entryPrice,
            details: `${pos.direction} ${pos.coin} at ${pos.leverage}x — liq price $${pos.liquidationPrice.toLocaleString()} (${(distanceToLiq * 100).toFixed(1)}% away)`,
            timestamp: Date.now(),
          });
        }
      }
    }
  }

  return movements.sort((a, b) => b.timestamp - a.timestamp);
}
