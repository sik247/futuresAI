import { NextResponse } from "next/server";

export const revalidate = 300; // 5 minutes

const WALLETS = [
  { name: "WLFI Treasury", address: "0x5be9a4959308A0D0c7bC0870E319314d8D957dBB", entity: "World Liberty Financial", type: "treasury" },
  { name: "WLFI Operations", address: "0x97f1f8003ad0fb1c99361170310c65dc84f921e3", entity: "World Liberty Financial", type: "operations" },
  { name: "vitalik.eth", address: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045", entity: "Ethereum Foundation", type: "founder" },
  { name: "Justin Sun", address: "0x176F3DAb24a159341c0509bB36B833E7fdd0a132", entity: "TRON / HTX", type: "whale" },
  { name: "WBTC Deployer", address: "0x2faf487a4414fe77e2327f0bf4ae2a264a776ad2", entity: "FTX / Alameda", type: "exchange" },
  { name: "Binance Hot Wallet", address: "0x28C6c06298d514Db089934071355E5743bf21d60", entity: "Binance", type: "exchange" },
  { name: "Kraken Hot Wallet", address: "0x2910543af39aba0cd09dbb2d50200b3e800a63d2", entity: "Kraken", type: "exchange" },
  { name: "Arbitrum Foundation", address: "0xd5B31E7C3F4C9cfe5E7D48481437F2B3E16f7B6a", entity: "Arbitrum", type: "foundation" },
];

const INSTITUTIONS = [
  {
    name: "BlackRock IBIT",
    entity: "BlackRock",
    type: "etf",
    description: "iShares Bitcoin Trust - Custody via Coinbase Prime",
    arkhamUrl: "https://platform.arkhamintelligence.com/explorer/entity/blackrock",
  },
  {
    name: "Grayscale GBTC",
    entity: "Grayscale",
    type: "etf",
    description: "Grayscale Bitcoin Trust - 1,750+ wallet addresses",
    arkhamUrl: "https://platform.arkhamintelligence.com/explorer/entity/grayscale",
  },
  {
    name: "Fidelity FBTC",
    entity: "Fidelity",
    type: "etf",
    description: "Fidelity Wise Origin Bitcoin Fund - Self-custody",
    arkhamUrl: "https://platform.arkhamintelligence.com/explorer/entity/fidelity",
  },
  {
    name: "MicroStrategy",
    entity: "MicroStrategy",
    type: "corporate",
    description: "Largest corporate Bitcoin holder - 450,000+ BTC",
    arkhamUrl: "https://platform.arkhamintelligence.com/explorer/entity/microstrategy",
  },
];

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchEthPrice(): Promise<number> {
  try {
    const res = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd",
      { next: { revalidate: 120 } }
    );
    const data = await res.json();
    return data?.ethereum?.usd ?? 0;
  } catch {
    return 0;
  }
}

async function fetchAddressInfo(address: string) {
  try {
    const res = await fetch(
      `https://api.ethplorer.io/getAddressInfo/${address}?apiKey=freekey`,
      { next: { revalidate: 300 } }
    );
    const data = await res.json();
    const ethBalance = data?.ETH?.balance ?? 0;
    const ethPrice = data?.ETH?.price?.rate ?? 0;

    // Top token holdings (by USD value)
    const tokens = (data?.tokens || [])
      .filter((t: any) => t.tokenInfo?.price)
      .map((t: any) => {
        const decimals = Number(t.tokenInfo.decimals || 18);
        const rawBalance = Number(t.balance) / Math.pow(10, decimals);
        const usdValue = rawBalance * (t.tokenInfo.price?.rate || 0);
        return {
          tokenName: t.tokenInfo.name || "Unknown",
          tokenSymbol: t.tokenInfo.symbol || "???",
          balance: rawBalance,
          usdValue,
          contractAddress: t.tokenInfo.address,
        };
      })
      .sort((a: any, b: any) => b.usdValue - a.usdValue)
      .slice(0, 10);

    return { ethBalance, ethPrice, tokens };
  } catch {
    return { ethBalance: 0, ethPrice: 0, tokens: [] };
  }
}

async function fetchRecentTxs(address: string) {
  try {
    const res = await fetch(
      `https://api.ethplorer.io/getAddressTransactions/${address}?apiKey=freekey&limit=5`,
      { next: { revalidate: 300 } }
    );
    const data = await res.json();
    if (Array.isArray(data)) {
      return data.map((tx: any) => ({
        hash: tx.hash,
        from: tx.from,
        to: tx.to,
        value: (Number(tx.value) || 0).toFixed(4),
        timeStamp: String(tx.timestamp),
      }));
    }
    return [];
  } catch {
    return [];
  }
}

async function fetchRecentTokenTxs(address: string) {
  try {
    const res = await fetch(
      `https://api.ethplorer.io/getAddressHistory/${address}?apiKey=freekey&limit=10&type=transfer`,
      { next: { revalidate: 300 } }
    );
    const data = await res.json();
    if (data?.operations && Array.isArray(data.operations)) {
      return data.operations.map((op: any) => ({
        hash: op.transactionHash,
        from: op.from,
        to: op.to,
        tokenName: op.tokenInfo?.name || "Unknown",
        tokenSymbol: op.tokenInfo?.symbol || "???",
        value: (Number(op.value) / Math.pow(10, Number(op.tokenInfo?.decimals || 18))).toFixed(4),
        tokenDecimal: op.tokenInfo?.decimals || "18",
        timeStamp: String(op.timestamp),
        contractAddress: op.tokenInfo?.address || "",
      }));
    }
    return [];
  } catch {
    return [];
  }
}

async function fetchWalletData(wallet: (typeof WALLETS)[number], globalEthPrice: number) {
  const addressInfo = await fetchAddressInfo(wallet.address);
  await delay(500);

  const recentTxs = await fetchRecentTxs(wallet.address);
  await delay(500);

  const recentTokenTxs = await fetchRecentTokenTxs(wallet.address);

  const ethPrice = addressInfo.ethPrice || globalEthPrice;
  const balanceUsd = addressInfo.ethBalance * ethPrice;

  return {
    ...wallet,
    balance: addressInfo.ethBalance,
    balanceUsd,
    topTokens: addressInfo.tokens,
    recentTxs,
    recentTokenTxs,
  };
}

export async function GET() {
  try {
    const ethPrice = await fetchEthPrice();

    const results: Awaited<ReturnType<typeof fetchWalletData>>[] = [];

    for (const wallet of WALLETS) {
      const settled = await Promise.allSettled([fetchWalletData(wallet, ethPrice)]);
      const result = settled[0];
      if (result.status === "fulfilled") {
        results.push(result.value);
      } else {
        results.push({
          ...wallet,
          balance: 0,
          balanceUsd: 0,
          topTokens: [],
          recentTxs: [],
          recentTokenTxs: [],
        });
      }
      await delay(200);
    }

    const totalPortfolioUsd = results.reduce((sum, w) => sum + w.balanceUsd, 0);

    return NextResponse.json({
      wallets: results,
      institutions: INSTITUTIONS,
      ethPrice,
      totalPortfolioUsd,
      walletCount: results.length,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Whale wallet fetch error:", error);
    return NextResponse.json(
      {
        wallets: [],
        institutions: [],
        ethPrice: 0,
        totalPortfolioUsd: 0,
        walletCount: 0,
        updatedAt: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
