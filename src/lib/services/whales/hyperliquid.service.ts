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

const HL_WHALES = [
  { name: "Mega Whale", address: "0xfc667adba8d4837586078f4fdcdc29804337ca06" },
  { name: "Crocodile Whale", address: "0x5b5d51203a0f9079f8aeb098a6523a13f298c060" },
  { name: "Machi Big Brother", address: "0x020ca66c30bec2c4fe3861a94e4db4a498a35872" },
  { name: "BTC 40x Shorter", address: "0xec326a384ae965647d87e1f85db46d2efa15ae82" },
];

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
  const results = await Promise.allSettled(
    HL_WHALES.map(w => fetchHLWalletData(w.address, w.name))
  );
  return results
    .filter((r): r is PromiseFulfilledResult<HLWalletData | null> => r.status === "fulfilled" && r.value !== null)
    .map(r => r.value!)
    .filter(w => w.accountValue >= MIN_ACCOUNT_VALUE); // Only show major wallets
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
  const results = await Promise.allSettled(
    HL_WHALES.map(async (w) => {
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
