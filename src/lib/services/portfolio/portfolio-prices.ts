export type CoinPrice = {
  usd: number;
  usd_24h_change: number;
};

export async function fetchPortfolioPrices(
  coinIds: string[]
): Promise<Record<string, CoinPrice>> {
  if (coinIds.length === 0) return {};

  const ids = coinIds.join(",");
  const res = await fetch(
    `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`,
    { next: { revalidate: 60 } }
  );

  if (!res.ok) return {};

  const data = await res.json();
  const result: Record<string, CoinPrice> = {};

  for (const id of coinIds) {
    if (data[id]) {
      result[id] = {
        usd: data[id].usd ?? 0,
        usd_24h_change: data[id].usd_24h_change ?? 0,
      };
    }
  }

  return result;
}
