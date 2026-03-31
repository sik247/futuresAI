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
  { name: "James Wynn", address: "0x5078c2fbea2b2ad61bc840bc023e35fce56bedb6" },
];

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
    .map(r => r.value!);
}
