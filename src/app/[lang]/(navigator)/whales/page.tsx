import { Metadata } from "next";
import { fetchAllHLWhales, fetchAllHLTrades } from "@/lib/services/whales/hyperliquid.service";
import WhaleDashboard from "./whale-dashboard";

export const metadata: Metadata = {
  title: "Crypto Whale and Entity Tracker - On-Chain Intelligence",
  description:
    "Track crypto whale wallets, institutional funds like BlackRock, Grayscale, and MicroStrategy, and live on-chain Ethereum transaction activity. On-chain intelligence by Futures AI.",
  keywords: [
    "crypto whale tracker",
    "on-chain analytics",
    "institutional crypto holdings",
    "wallet tracker",
    "ethereum wallet monitor",
    "BlackRock bitcoin ETF",
    "MicroStrategy bitcoin",
    "Grayscale GBTC",
    "crypto whale alerts",
    "vitalik wallet",
    "blockchain intelligence",
  ],
  openGraph: {
    title: "Crypto Whale and Entity Tracker - On-Chain Intelligence | Futures AI",
    description:
      "Track crypto whale wallets, institutional funds like BlackRock and MicroStrategy, and live on-chain Ethereum transaction activity.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Crypto Whale and Entity Tracker - On-Chain Intelligence | Futures AI",
    description:
      "Track crypto whale wallets, institutional funds like BlackRock and MicroStrategy, and live on-chain Ethereum transaction activity.",
  },
};

/* ------------------------------------------------------------------ */
/*  Key Figures data                                                   */
/* ------------------------------------------------------------------ */

type KeyFigure = {
  name: string;
  role: string;
  image: string;
  walletAddress: string;
  stance: "Bullish" | "Bearish" | "Neutral" | "";
  knownHoldings: string[];
  category: "founder" | "trader" | "analyst" | "investor";
};

const KEY_FIGURES: KeyFigure[] = [
  // ── Founders & CEOs ──
  { name: "Vitalik Buterin", role: "Ethereum Co-founder", image: "https://upload.wikimedia.org/wikipedia/commons/1/1c/Vitalik_Buterin_TechCrunch_London_2015_%28cropped%29.jpg", walletAddress: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045", stance: "Bullish", knownHoldings: ["ETH"], category: "founder" },
  { name: "Justin Sun", role: "TRON Founder", image: "https://upload.wikimedia.org/wikipedia/commons/5/52/Head_of_the_Grenadian_Delegation_to_the_12th_World_Trade_Organization_Ministerial_Conference_Justin_Sun.jpg", walletAddress: "0x176F3DAb24a159341c0509bB36B833E7fdd0a132", stance: "Bullish", knownHoldings: ["TRX", "ETH", "BTC"], category: "founder" },
  { name: "Michael Saylor", role: "MicroStrategy CEO", image: "https://upload.wikimedia.org/wikipedia/commons/f/f4/Michael_Saylor_2022.png", walletAddress: "", stance: "Bullish", knownHoldings: ["BTC"], category: "founder" },
  { name: "CZ (Changpeng Zhao)", role: "Binance Founder", image: "https://upload.wikimedia.org/wikipedia/commons/e/e1/Changpeng_Zhao_in_2022.jpg", walletAddress: "0x8894E0a0c962CB723c1ef41B4F31334e14d5d68d", stance: "Bullish", knownHoldings: ["BNB", "BTC"], category: "founder" },
  { name: "Brian Armstrong", role: "Coinbase CEO", image: "https://upload.wikimedia.org/wikipedia/commons/9/91/Brian_Armstrong_-_TechCrunch_Disrupt_2018_01.jpg", walletAddress: "0x5b76f5B8fc9D700624F78208132f91AD4e61a1f0", stance: "Bullish", knownHoldings: ["BTC", "ETH"], category: "founder" },
  { name: "Do Kwon", role: "Terraform Labs", image: "https://upload.wikimedia.org/wikipedia/commons/2/29/Do_Kwon.png", walletAddress: "", stance: "", knownHoldings: ["BTC"], category: "founder" },
  // ── Traders ──
  { name: "Arthur Hayes", role: "BitMEX Co-founder", image: "https://cryptoslate.com/wp-content/uploads/2019/05/person-arthur-hayes-01.jpg", walletAddress: "0x94845333028B1204Fbe14E1278Fd4Adde46B22ce", stance: "Bullish", knownHoldings: ["BTC", "ETH", "SOL"], category: "trader" },
  { name: "WLFI Treasury", role: "World Liberty Financial", image: "", walletAddress: "0x5be9a4959308A0D0c7bC0870E319314d8D957dBB", stance: "Bullish", knownHoldings: ["ETH", "WBTC"], category: "founder" },
  { name: "Wintermute", role: "Market Maker", image: "", walletAddress: "0x0000006daea1723962647b7e189d311d757Fb793", stance: "", knownHoldings: ["ETH", "USDC"], category: "trader" },
  { name: "Alameda Research", role: "FTX Trading Arm", image: "", walletAddress: "0x84D34f4f83a87596Cd3FB6887cFf8F17Bf5A7B83", stance: "", knownHoldings: ["ETH"], category: "trader" },
  // ── Investors ──
  { name: "Elon Musk", role: "Tesla / X CEO", image: "https://upload.wikimedia.org/wikipedia/commons/0/0e/Elon_Musk_%2854816836217%29_%28cropped_2%29_%28b%29.jpg", walletAddress: "", stance: "Neutral", knownHoldings: ["BTC", "DOGE"], category: "investor" },
  { name: "Cathie Wood", role: "ARK Invest CEO", image: "https://upload.wikimedia.org/wikipedia/commons/4/44/Cathie_Wood_ARK_Invest_Photo.jpg", walletAddress: "", stance: "Bullish", knownHoldings: ["BTC", "ETH", "COIN"], category: "investor" },
  { name: "Anthony Pompliano", role: "Pomp Investments", image: "https://cryptoslate.com/wp-content/uploads/2019/05/person-anthony-pompliano-03.jpg", walletAddress: "", stance: "Bullish", knownHoldings: ["BTC"], category: "investor" },
  { name: "Raoul Pal", role: "Real Vision CEO", image: "https://media.realvision.com/wp/20230929154944/Raoul-Pal-3.png", walletAddress: "", stance: "Bullish", knownHoldings: ["SOL", "ETH", "BTC"], category: "investor" },
  // ── Analysts ──
  { name: "Kiyoung Ju", role: "CryptoQuant CEO", image: "https://cdn.theorg.com/6c3b6406-673d-408e-9a0c-2f423f45a88c_medium.jpg", walletAddress: "", stance: "Neutral", knownHoldings: ["BTC"], category: "analyst" },
  { name: "Willy Woo", role: "On-chain Analyst", image: "https://cryptoslate.com/wp-content/uploads/2019/05/person-willy-woo.jpg", walletAddress: "", stance: "Bullish", knownHoldings: ["BTC"], category: "analyst" },
  { name: "Gareth Soloway", role: "Chief Market Strategist", image: "https://verifiedinvesting.com/cdn/shop/files/vi-2025-pro-photo-gareth-16x9.jpg?v=1749581417&width=1920", walletAddress: "", stance: "Bearish", knownHoldings: ["BTC", "GOLD"], category: "analyst" },
  { name: "Benjamin Cowen", role: "Crypto Analyst", image: "https://benjamincowen.com/images/benjamin-portrait.jpg", walletAddress: "", stance: "Neutral", knownHoldings: ["BTC", "ETH"], category: "analyst" },
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function delayMs(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
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

async function fetchAddressData(address: string): Promise<{ balance: number; tokens: any[] }> {
  try {
    const res = await fetch(
      `https://api.ethplorer.io/getAddressInfo/${address}?apiKey=freekey`,
      { next: { revalidate: 300 } }
    );
    const data = await res.json();
    const balance = data?.ETH?.balance ?? 0;
    const tokens = (data?.tokens || [])
      .filter((t: any) => t.tokenInfo?.price)
      .map((t: any) => {
        const decimals = Number(t.tokenInfo.decimals || 18);
        const rawBalance = Number(t.balance) / Math.pow(10, decimals);
        return {
          symbol: t.tokenInfo.symbol || "???",
          balance: rawBalance,
          usdValue: rawBalance * (t.tokenInfo.price?.rate || 0),
        };
      })
      .sort((a: any, b: any) => b.usdValue - a.usdValue)
      .slice(0, 5);
    return { balance, tokens };
  } catch {
    return { balance: 0, tokens: [] };
  }
}

/* ------------------------------------------------------------------ */
/*  Page component                                                     */
/* ------------------------------------------------------------------ */

export default async function WhalesPage({
  params: { lang },
}: {
  params: { lang: string };
}) {
  // Fetch ETH price and Hyperliquid data in parallel
  const [ethPrice, hlWhales, hlTrades] = await Promise.all([
    fetchEthPrice(),
    fetchAllHLWhales(),
    fetchAllHLTrades(),
  ]);

  // Fetch on-chain data for figures with wallet addresses
  const figuresWithWallets = KEY_FIGURES.filter((f) => f.walletAddress);
  const walletDataMap: Record<string, { ethBalance: number; ethUsd: number; tokens: { symbol: string; balance: number; usdValue: number }[] }> = {};

  for (const fig of figuresWithWallets) {
    const addrData = await fetchAddressData(fig.walletAddress);
    walletDataMap[fig.walletAddress] = {
      ethBalance: addrData.balance,
      ethUsd: addrData.balance * ethPrice,
      tokens: addrData.tokens,
    };
    await delayMs(400);
  }

  // Merge figures with wallet data
  const figures = KEY_FIGURES.map((fig) => ({
    name: fig.name,
    role: fig.role,
    image: fig.image,
    walletAddress: fig.walletAddress,
    stance: fig.stance,
    knownHoldings: fig.knownHoldings,
    category: fig.category,
    walletData: fig.walletAddress ? walletDataMap[fig.walletAddress] : undefined,
  }));

  return (
    <WhaleDashboard
      ethPrice={ethPrice}
      figures={figures}
      hlWhales={hlWhales}
      hlTrades={hlTrades}
      lang={lang}
    />
  );
}
