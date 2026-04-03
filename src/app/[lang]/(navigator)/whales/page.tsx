import Container from "@/components/ui/container";
import { Metadata } from "next";
import WhalesAnimations from "./whales-animations";
import WhaleActivityFeed from "./whale-activity-feed";
import KeyFiguresGrid from "./key-figures";
import { fetchAllHLWhales } from "@/lib/services/whales/hyperliquid.service";

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
/*  Wallet list                                                       */
/* ------------------------------------------------------------------ */

const WALLETS = [
  { name: "WLFI Treasury", address: "0x5be9a4959308A0D0c7bC0870E319314d8D957dBB", entity: "World Liberty Financial", type: "treasury" },
  { name: "Justin Sun", address: "0x176F3DAb24a159341c0509bB36B833E7fdd0a132", entity: "TRON / HTX", type: "whale" },
  { name: "Binance Hot Wallet 1", address: "0x28C6c06298d514Db089934071355E5743bf21d60", entity: "Binance", type: "exchange" },
  { name: "Binance Cold Wallet", address: "0xBE0eB53F46cd790Cd13851d5EFf43D12404d33E8", entity: "Binance", type: "exchange" },
  { name: "Bitfinex", address: "0x1151314c646Ce4E0eFD76d1aF4760aE66a9Fe30F", entity: "Bitfinex", type: "exchange" },
  { name: "Coinbase Prime", address: "0xA090e606E30bD747d4E6245a1517EbE430F0057e", entity: "Coinbase", type: "exchange" },
  { name: "Robinhood", address: "0x40B38765696e3d5d8d9d834D8AaD4bB6e418E489", entity: "Robinhood", type: "exchange" },
  { name: "OKX Hot Wallet", address: "0x6cC5F688a315f3dC28A7781717a9A798a59fDA7b", entity: "OKX", type: "exchange" },
];

/* ------------------------------------------------------------------ */
/*  Institutional funds (static)                                      */
/* ------------------------------------------------------------------ */

const INSTITUTIONAL_FUNDS = [
  {
    name: "BlackRock",
    ticker: "IBIT",
    icon: "B",
    description: "iShares Bitcoin Trust -- largest spot Bitcoin ETF",
    arkhamUrl: "https://platform.arkhamintelligence.com/explorer/entity/blackrock",
    bullets: [
      "Custody via Coinbase Prime",
      "Largest Bitcoin ETF by AUM (~$50B+)",
      "Also launched Ethereum ETF (ETHA)",
      "Addresses tracked by Arkham Intelligence",
    ],
  },
  {
    name: "Grayscale",
    ticker: "GBTC / ETHE",
    icon: "G",
    description: "Digital asset management -- GBTC, ETHE, and mini trusts",
    arkhamUrl: "https://platform.arkhamintelligence.com/explorer/entity/grayscale",
    bullets: [
      "1,750+ identified wallet addresses",
      "Custody via Coinbase",
      "Converted GBTC from trust to ETF in Jan 2024",
      "Also manages Ethereum and Solana trusts",
    ],
  },
  {
    name: "Fidelity",
    ticker: "FBTC",
    icon: "F",
    description: "Fidelity Wise Origin Bitcoin Fund",
    arkhamUrl: "https://platform.arkhamintelligence.com/explorer/entity/fidelity",
    bullets: [
      "Self-custody via Fidelity Digital Assets",
      "Second largest spot Bitcoin ETF",
      "In-house blockchain infrastructure",
      "Also launched Ethereum ETF",
    ],
  },
  {
    name: "MicroStrategy",
    ticker: "MSTR",
    icon: "M",
    description: "Largest corporate Bitcoin holder",
    arkhamUrl: "https://platform.arkhamintelligence.com/explorer/entity/microstrategy",
    bullets: [
      "Holdings: 450,000+ BTC",
      "Strategy: continuous Bitcoin accumulation",
      "CEO Michael Saylor's Bitcoin treasury strategy",
      "Funded via convertible notes and equity offerings",
    ],
  },
  {
    name: "Vanguard",
    ticker: "N/A",
    icon: "V",
    description: "Traditional asset manager -- limited direct crypto exposure",
    arkhamUrl: "",
    bullets: [
      "No direct on-chain crypto holdings",
      "Allows clients to trade crypto ETFs (IBIT, FBTC) on brokerage",
      "Reversed anti-crypto stance in late 2025",
      "No proprietary crypto fund yet",
    ],
  },
];

/* ------------------------------------------------------------------ */
/*  Key Figures (crypto influencers & leaders)                        */
/* ------------------------------------------------------------------ */

type KeyFigure = {
  name: string;
  role: string;
  image: string;
  link: string;
  arkhamUrl: string;
  walletAddress: string;
  stance: "Bullish" | "Bearish" | "Neutral" | "";
  knownHoldings: string[];
  category: "founder" | "trader" | "analyst" | "investor";
};

const KEY_FIGURES: KeyFigure[] = [
  // ── Founders & CEOs ──
  { name: "Michael Saylor", role: "MicroStrategy CEO", image: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f4/Michael_Saylor_2022.png/800px-Michael_Saylor_2022.png", link: "https://x.com/saylor", arkhamUrl: "https://platform.arkhamintelligence.com/explorer/entity/microstrategy", walletAddress: "", stance: "Bullish", knownHoldings: ["BTC"], category: "founder" },
  { name: "Vitalik Buterin", role: "Ethereum Co-founder", image: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1c/Vitalik_Buterin_TechCrunch_London_2015_%28cropped%29.jpg/800px-Vitalik_Buterin_TechCrunch_London_2015_%28cropped%29.jpg", link: "https://x.com/VitalikButerin", arkhamUrl: "https://platform.arkhamintelligence.com/explorer/entity/vitalik-buterin", walletAddress: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045", stance: "Bullish", knownHoldings: ["ETH"], category: "founder" },
  { name: "CZ (Changpeng Zhao)", role: "Binance Founder", image: "https://upload.wikimedia.org/wikipedia/commons/e/e1/Changpeng_Zhao_in_2022.jpg", link: "https://x.com/cz_binance", arkhamUrl: "https://platform.arkhamintelligence.com/explorer/entity/cz", walletAddress: "", stance: "Bullish", knownHoldings: ["BNB", "BTC"], category: "founder" },
  { name: "Justin Sun", role: "TRON Founder", image: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/52/Head_of_the_Grenadian_Delegation_to_the_12th_World_Trade_Organization_Ministerial_Conference_Justin_Sun.jpg/800px-Head_of_the_Grenadian_Delegation_to_the_12th_World_Trade_Organization_Ministerial_Conference_Justin_Sun.jpg", link: "https://x.com/justinsuntron", arkhamUrl: "https://platform.arkhamintelligence.com/explorer/entity/justin-sun", walletAddress: "0x176F3DAb24a159341c0509bB36B833E7fdd0a132", stance: "Bullish", knownHoldings: ["TRX", "ETH", "BTC"], category: "founder" },
  { name: "Brian Armstrong", role: "Coinbase CEO", image: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Brian_Armstrong_-_TechCrunch_Disrupt_2018_01.jpg/800px-Brian_Armstrong_-_TechCrunch_Disrupt_2018_01.jpg", link: "https://x.com/brian_armstrong", arkhamUrl: "", walletAddress: "", stance: "Bullish", knownHoldings: ["BTC", "ETH"], category: "founder" },
  { name: "Do Kwon", role: "Terraform Labs", image: "https://upload.wikimedia.org/wikipedia/commons/2/29/Do_Kwon.png", link: "https://x.com/stablekwon", arkhamUrl: "https://platform.arkhamintelligence.com/explorer/entity/do-kwon", walletAddress: "", stance: "", knownHoldings: ["BTC"], category: "founder" },
  // ── Traders ──
  { name: "Arthur Hayes", role: "BitMEX Co-founder", image: "https://cryptoslate.com/wp-content/uploads/2019/05/person-arthur-hayes-01.jpg", link: "https://x.com/CryptoHayes", arkhamUrl: "https://platform.arkhamintelligence.com/explorer/entity/arthur-hayes", walletAddress: "", stance: "Bullish", knownHoldings: ["BTC", "ETH", "SOL"], category: "trader" },
  { name: "Elon Musk", role: "Tesla / X CEO", image: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0e/Elon_Musk_%2854816836217%29_%28cropped_2%29_%28b%29.jpg/800px-Elon_Musk_%2854816836217%29_%28cropped_2%29_%28b%29.jpg", link: "https://x.com/elonmusk", arkhamUrl: "", walletAddress: "", stance: "Neutral", knownHoldings: ["BTC", "DOGE"], category: "investor" },
  // ── Investors ──
  { name: "Cathie Wood", role: "ARK Invest CEO", image: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Cathie_Wood_ARK_Invest_Photo.jpg/800px-Cathie_Wood_ARK_Invest_Photo.jpg", link: "https://x.com/CathieDWood", arkhamUrl: "", walletAddress: "", stance: "Bullish", knownHoldings: ["BTC", "ETH", "COIN"], category: "investor" },
  { name: "Anthony Pompliano", role: "Pomp Investments", image: "https://cryptoslate.com/wp-content/uploads/2019/05/person-anthony-pompliano-03.jpg", link: "https://x.com/APompliano", arkhamUrl: "", walletAddress: "", stance: "Bullish", knownHoldings: ["BTC"], category: "investor" },
  { name: "Raoul Pal", role: "Real Vision CEO", image: "https://media.realvision.com/wp/20230929154944/Raoul-Pal-3.png", link: "https://x.com/RaoulGMI", arkhamUrl: "", walletAddress: "", stance: "Bullish", knownHoldings: ["SOL", "ETH", "BTC"], category: "investor" },
  // ── Analysts ──
  { name: "Kiyoung Ju", role: "CryptoQuant CEO", image: "https://cdn.theorg.com/6c3b6406-673d-408e-9a0c-2f423f45a88c_medium.jpg", link: "https://x.com/ki_young_ju", arkhamUrl: "", walletAddress: "", stance: "Neutral", knownHoldings: ["BTC"], category: "analyst" },
  { name: "Willy Woo", role: "On-chain Analyst", image: "https://cryptoslate.com/wp-content/uploads/2019/05/person-willy-woo.jpg", link: "https://x.com/woonomic", arkhamUrl: "", walletAddress: "", stance: "Bullish", knownHoldings: ["BTC"], category: "analyst" },
  { name: "Gareth Soloway", role: "Chief Market Strategist", image: "https://verifiedinvesting.com/cdn/shop/files/vi-2025-pro-photo-gareth-16x9.jpg?v=1749581417&width=1920", link: "https://x.com/GarethSoloway", arkhamUrl: "", walletAddress: "", stance: "Bearish", knownHoldings: ["BTC", "GOLD"], category: "analyst" },
  { name: "Benjamin Cowen", role: "Crypto Analyst", image: "https://benjamincowen.com/images/benjamin-portrait.jpg", link: "https://x.com/intocryptoverse", arkhamUrl: "", walletAddress: "", stance: "Neutral", knownHoldings: ["BTC", "ETH"], category: "analyst" },
];

/* ------------------------------------------------------------------ */
/*  Etherscan helpers (server-side, free tier, revalidate: 300)       */
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
          tokenSymbol: t.tokenInfo.symbol || "???",
          tokenName: t.tokenInfo.name || "Unknown",
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

async function fetchRecentTokenTxs(address: string) {
  try {
    const res = await fetch(
      `https://api.ethplorer.io/getAddressHistory/${address}?apiKey=freekey&limit=5&type=transfer`,
      { next: { revalidate: 300 } }
    );
    const data = await res.json();
    if (data?.operations && Array.isArray(data.operations)) {
      return data.operations.map((op: any) => ({
        hash: op.transactionHash as string,
        from: op.from as string,
        to: op.to as string,
        tokenName: (op.tokenInfo?.name || "Unknown") as string,
        tokenSymbol: (op.tokenInfo?.symbol || "???") as string,
        value: (
          Number(op.value) / Math.pow(10, Number(op.tokenInfo?.decimals || 18))
        ).toFixed(4),
        tokenDecimal: (op.tokenInfo?.decimals || "18") as string,
        timeStamp: String(op.timestamp),
      }));
    }
    return [];
  } catch {
    return [];
  }
}

/* ------------------------------------------------------------------ */
/*  Formatting helpers                                                */
/* ------------------------------------------------------------------ */

function truncateAddress(addr: string) {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function formatEth(val: number) {
  return val.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  });
}

function formatUsd(val: number) {
  return `$${val.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

function timeAgo(timestamp: string) {
  const seconds = Math.floor(Date.now() / 1000 - Number(timestamp));
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

function formatTokenAmount(value: string) {
  const num = parseFloat(value);
  if (isNaN(num)) return value;
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  if (num >= 1) return num.toFixed(2);
  return num.toFixed(4);
}

/* ------------------------------------------------------------------ */
/*  Type color map                                                    */
/* ------------------------------------------------------------------ */

const TYPE_COLORS: Record<string, { border: string; tag: string; accent: string; leftBorder: string }> = {
  treasury:   { border: "border-blue-500/10", tag: "bg-blue-500/15 text-blue-400", accent: "text-blue-400", leftBorder: "border-l-blue-500" },
  operations: { border: "border-blue-500/10", tag: "bg-blue-500/15 text-blue-400", accent: "text-blue-400", leftBorder: "border-l-blue-500" },
  exchange:   { border: "border-emerald-500/10", tag: "bg-emerald-500/15 text-emerald-400", accent: "text-emerald-400", leftBorder: "border-l-emerald-500" },
  whale:      { border: "border-amber-500/10", tag: "bg-amber-500/15 text-amber-400", accent: "text-amber-400", leftBorder: "border-l-amber-500" },
  founder:    { border: "border-cyan-500/10", tag: "bg-cyan-500/15 text-cyan-400", accent: "text-cyan-400", leftBorder: "border-l-cyan-500" },
  foundation: { border: "border-cyan-500/10", tag: "bg-cyan-500/15 text-cyan-400", accent: "text-cyan-400", leftBorder: "border-l-cyan-500" },
};

function getColors(type: string) {
  return TYPE_COLORS[type] || TYPE_COLORS.whale;
}

/* ------------------------------------------------------------------ */
/*  Page component                                                    */
/* ------------------------------------------------------------------ */

export default async function WhalesPage({
  params: { lang },
}: {
  params: { lang: string };
}) {
  type TokenTxEntry = {
    hash: string;
    from: string;
    to: string;
    tokenName: string;
    tokenSymbol: string;
    value: string;
    tokenDecimal: string;
    timeStamp: string;
  };
  type WalletData = {
    name: string;
    address: string;
    entity: string;
    type: string;
    balance: number;
    balanceUsd: number;
    recentTokenTxs: TokenTxEntry[];
  };

  // Fetch ETH price and Hyperliquid data in parallel
  const [ethPrice, hlWhales] = await Promise.all([
    fetchEthPrice(),
    fetchAllHLWhales(),
  ]);

  // Fetch all wallet data sequentially to respect free-tier rate limits
  const walletsData: WalletData[] = [];

  for (const wallet of WALLETS) {
    const results = await Promise.allSettled([
      fetchAddressData(wallet.address),
      fetchRecentTokenTxs(wallet.address),
    ]);

    const addrData = results[0].status === "fulfilled" ? results[0].value : { balance: 0, tokens: [] };

    walletsData.push({
      ...wallet,
      balance: addrData.balance,
      balanceUsd: addrData.balance * ethPrice,
      recentTokenTxs: results[1].status === "fulfilled" ? results[1].value : [],
    });

    await delayMs(500);
  }

  const totalPortfolioUsd = walletsData.reduce((sum, w) => sum + w.balanceUsd, 0);

  return (
    <div className="min-h-screen bg-zinc-950">
      <WhalesAnimations />

      {/* ---- Hero ---- */}
      <section className="relative pt-16 pb-20 overflow-hidden">
        {/* Background geometry */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-20 left-[10%] w-72 h-72 rounded-full bg-blue-500/[0.03] blur-3xl" />
          <div className="absolute top-40 right-[15%] w-56 h-56 rounded-full bg-cyan-500/[0.03] blur-3xl" />
          <div className="absolute top-12 left-[20%] w-px h-32 bg-gradient-to-b from-transparent via-white/[0.06] to-transparent rotate-12" />
          <div className="absolute top-8 right-[25%] w-px h-24 bg-gradient-to-b from-transparent via-white/[0.06] to-transparent -rotate-12" />
          {/* Grid pattern hint */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:64px_64px]" />
        </div>

        <Container className="relative z-10">
          <div data-whale-heading>
            <p className="text-[10px] font-mono uppercase tracking-[0.35em] text-zinc-600 mb-5">
              On-Chain Intelligence
            </p>
            <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-bold text-white tracking-tighter leading-[0.9]">
              Entity
              <br />
              Tracker
            </h1>
            <div
              data-hero-line
              className="mt-6 w-20 h-px bg-gradient-to-r from-white/30 to-transparent origin-left"
            />
            <p className="text-sm md:text-base text-zinc-500 max-w-md mt-5 leading-relaxed">
              Live wallet intelligence, token flows, and entity monitoring
              across the Ethereum network.
            </p>
          </div>

          {/* Stat cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-10">
            {/* ETH Price */}
            <div className="rounded-xl backdrop-blur-md bg-white/[0.03] border border-white/[0.06] p-5">
              <p className="text-[9px] font-mono uppercase tracking-[0.2em] text-zinc-600 mb-2">
                ETH Price
              </p>
              <div className="flex items-baseline gap-2">
                <span
                  data-counter={ethPrice}
                  data-counter-prefix="$"
                  className="text-2xl font-bold font-mono text-white"
                >
                  ${ethPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className="text-xs text-zinc-600 font-mono">USD</span>
              </div>
            </div>

            {/* Portfolio Value */}
            <div className="rounded-xl backdrop-blur-md bg-white/[0.03] border border-white/[0.06] p-5">
              <p className="text-[9px] font-mono uppercase tracking-[0.2em] text-zinc-600 mb-2">
                Tracked Portfolio
              </p>
              <div className="flex items-baseline gap-2">
                <span
                  data-counter={totalPortfolioUsd}
                  data-counter-prefix="$"
                  className="text-2xl font-bold font-mono text-white"
                >
                  {formatUsd(totalPortfolioUsd)}
                </span>
              </div>
            </div>

            {/* Wallets Monitored */}
            <div className="rounded-xl backdrop-blur-md bg-white/[0.03] border border-white/[0.06] p-5">
              <p className="text-[9px] font-mono uppercase tracking-[0.2em] text-zinc-600 mb-2">
                Wallets Monitored
              </p>
              <div className="flex items-baseline gap-2">
                <span
                  data-counter={WALLETS.length}
                  className="text-2xl font-bold font-mono text-white"
                >
                  {WALLETS.length}
                </span>
                <span className="flex items-center gap-1.5 ml-2">
                  <span data-live-pulse className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                  </span>
                  <span className="text-[10px] font-mono text-emerald-500 uppercase tracking-wider">
                    Live
                  </span>
                </span>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* ---- Divider ---- */}
      <div className="w-full h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

      {/* ---- Entity Cards ---- */}
      <section className="py-16 sm:py-20">
        <Container>
          <div data-whale-heading className="mb-10">
            <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-zinc-600 mb-3">
              Ethereum Mainnet
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
              Tracked Entities
            </h2>
            <p className="text-sm text-zinc-500 mt-2 max-w-md">
              On-chain monitored wallets with live ETH balances and recent token activity.
            </p>
          </div>

          <div
            data-whale-grid
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            {walletsData.map((wallet) => {
              const colors = getColors(wallet.type);
              return (
                <div
                  key={wallet.address}
                  data-whale-card
                  className={`rounded-xl backdrop-blur-md bg-white/[0.03] border ${colors.border} border-l-2 ${colors.leftBorder} p-5 transition-all duration-300 hover:bg-white/[0.04] hover:border-white/[0.1] group`}
                >
                  {/* Top row: badge + name + type */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`inline-flex items-center justify-center w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.06] text-xs font-bold ${colors.accent}`}
                      >
                        {wallet.name.charAt(0)}
                      </span>
                      <div>
                        <h3 className="text-sm font-semibold text-white leading-tight">
                          {wallet.name}
                        </h3>
                        <span
                          className={`inline-block text-[9px] font-medium uppercase tracking-widest ${colors.tag} px-1.5 py-0.5 rounded mt-0.5`}
                        >
                          {wallet.entity}
                        </span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-white/[0.04] text-[9px] font-mono uppercase tracking-wider text-zinc-500">
                      {wallet.type}
                    </span>
                  </div>

                  {/* Address row */}
                  <div className="flex items-center gap-2 mb-4">
                    <a
                      href={`https://etherscan.io/address/${wallet.address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-mono text-zinc-600 hover:text-white transition-colors"
                    >
                      {truncateAddress(wallet.address)}
                      <svg
                        className="w-2.5 h-2.5 inline ml-1 opacity-40"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 17L17 7M17 7H7M17 7v10"
                        />
                      </svg>
                    </a>
                    <button
                      data-copy-address={wallet.address}
                      className="text-[10px] font-mono text-zinc-700 hover:text-zinc-300 transition-colors cursor-pointer px-1.5 py-0.5 rounded bg-white/[0.03] border border-white/[0.04]"
                    >
                      Copy
                    </button>
                  </div>

                  {/* Balance */}
                  <div className="flex items-baseline gap-3 mb-1">
                    <span
                      data-eth-balance={wallet.balance}
                      className="text-2xl font-bold font-mono text-white"
                    >
                      {formatEth(wallet.balance)}
                    </span>
                    <span className="text-xs text-zinc-600 font-mono">ETH</span>
                  </div>
                  <div className="mb-4">
                    <span
                      data-usd-value={wallet.balanceUsd}
                      className="text-sm font-mono text-zinc-500"
                    >
                      {formatUsd(wallet.balanceUsd)}
                    </span>
                  </div>

                  {/* Recent Token Activity */}
                  {wallet.recentTokenTxs.length > 0 && (
                    <div>
                      <p className="text-[9px] font-mono uppercase tracking-[0.2em] text-zinc-700 mb-2">
                        Recent Token Activity
                      </p>
                      <div className="space-y-1">
                        {wallet.recentTokenTxs.slice(0, 5).map((tx, i) => {
                          const isOut =
                            tx.from.toLowerCase() === wallet.address.toLowerCase();
                          return (
                            <a
                              key={`${tx.hash}-${i}`}
                              href={`https://etherscan.io/tx/${tx.hash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center justify-between text-[11px] py-1 px-2 rounded hover:bg-white/[0.03] transition-colors group/row"
                            >
                              <div className="flex items-center gap-2">
                                <span
                                  className={`text-[9px] font-mono font-bold w-7 ${
                                    isOut ? "text-red-400" : "text-emerald-400"
                                  }`}
                                >
                                  {isOut ? "OUT" : "IN"}
                                </span>
                                <span className="font-mono font-semibold text-zinc-300">
                                  {tx.tokenSymbol}
                                </span>
                                <span className="font-mono text-zinc-500">
                                  {formatTokenAmount(tx.value)}
                                </span>
                              </div>
                              <span className="text-zinc-700 font-mono text-[10px]">
                                {timeAgo(tx.timeStamp)}
                              </span>
                            </a>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Container>
      </section>

      {/* ---- Divider ---- */}
      <div className="w-full h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

      {/* ---- Activity Feed ---- */}
      <section className="py-16 sm:py-20">
        <Container>
          <div data-whale-heading className="mb-8">
            <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-zinc-600 mb-3">
              All Entities
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
              Transaction Feed
            </h2>
            <p className="text-sm text-zinc-500 mt-2 max-w-md">
              Aggregated live transaction stream across all monitored wallets.
            </p>
          </div>

          <WhaleActivityFeed />
        </Container>
      </section>

      {/* ---- Divider ---- */}
      <div className="w-full h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

      {/* ---- Hyperliquid Whale Positions ---- */}
      <section className="py-16 sm:py-20">
        <Container>
          <div data-whale-heading className="mb-10">
            <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-zinc-600 mb-3">
              Hyperliquid Perps
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
              Whale Positions
            </h2>
            <p className="text-sm text-zinc-500 mt-2 max-w-md">
              Live perpetuals positions held by known crypto whales on Hyperliquid.
            </p>
          </div>

          {hlWhales.length === 0 ? (
            <p className="text-sm font-mono text-zinc-600">No position data available.</p>
          ) : (
            <div data-whale-grid className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {hlWhales.map((whale) => (
                <div
                  key={whale.address}
                  data-whale-card
                  className="rounded-xl backdrop-blur-md bg-white/[0.03] border border-amber-500/10 border-l-2 border-l-amber-500 p-5 transition-all duration-300 hover:bg-white/[0.04] hover:border-white/[0.1]"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.06] text-xs font-bold text-amber-400">
                        {whale.name.charAt(0)}
                      </span>
                      <div>
                        <h3 className="text-sm font-semibold text-white leading-tight">
                          {whale.name}
                        </h3>
                        <a
                          href={`https://app.hyperliquid.xyz/explorer/address/${whale.address}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] font-mono text-zinc-600 hover:text-white transition-colors"
                        >
                          {whale.address.slice(0, 6)}...{whale.address.slice(-4)}
                          <svg className="w-2.5 h-2.5 inline ml-1 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17L17 7M17 7H7M17 7v10" />
                          </svg>
                        </a>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-white/[0.04] text-[9px] font-mono uppercase tracking-wider text-zinc-500">
                      HL Perps
                    </span>
                  </div>

                  {/* Account stats */}
                  <div className="flex gap-4 mb-4">
                    <div>
                      <p className="text-[9px] font-mono uppercase tracking-[0.2em] text-zinc-600 mb-1">Account Value</p>
                      <p className="text-lg font-bold font-mono text-white">
                        ${whale.accountValue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </p>
                    </div>
                    <div>
                      <p className="text-[9px] font-mono uppercase tracking-[0.2em] text-zinc-600 mb-1">Total Notional</p>
                      <p className="text-lg font-bold font-mono text-zinc-300">
                        ${whale.totalNotional.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </p>
                    </div>
                  </div>

                  {/* Positions */}
                  {whale.positions.length > 0 ? (
                    <div>
                      <p className="text-[9px] font-mono uppercase tracking-[0.2em] text-zinc-700 mb-2">Open Positions</p>
                      <div className="space-y-1.5">
                        {whale.positions.slice(0, 5).map((pos, i) => (
                          <div
                            key={`${pos.coin}-${i}`}
                            className="flex items-center justify-between text-[11px] py-1 px-2 rounded bg-white/[0.02] border border-white/[0.04]"
                          >
                            <div className="flex items-center gap-2">
                              <span className={`text-[9px] font-mono font-bold w-9 ${pos.direction === "LONG" ? "text-emerald-400" : "text-red-400"}`}>
                                {pos.direction}
                              </span>
                              <span className="font-mono font-semibold text-zinc-300">{pos.coin}</span>
                              <span className="font-mono text-zinc-600 text-[10px]">{pos.leverage}x</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className={`font-mono text-[10px] ${pos.unrealizedPnl >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                                {pos.unrealizedPnl >= 0 ? "+" : ""}${pos.unrealizedPnl.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                              </span>
                              <span className="font-mono text-zinc-600 text-[10px]">
                                {pos.roe >= 0 ? "+" : ""}{pos.roe.toFixed(1)}%
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs font-mono text-zinc-700">No open positions</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </Container>
      </section>

      {/* ---- Divider ---- */}
      <div className="w-full h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

      {/* ---- Key Figures ---- */}
      <section className="py-16 sm:py-20">
        <Container>
          <div data-whale-heading className="mb-10">
            <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-zinc-600 mb-3">
              Crypto Influencers & Leaders
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
              Key Figures
            </h2>
            <p className="text-sm text-zinc-500 mt-2 max-w-md">
              Notable crypto traders, analysts, and industry leaders — track their known positions and market calls.
            </p>
          </div>

          <KeyFiguresGrid figures={KEY_FIGURES} lang={lang} />
        </Container>
      </section>

      {/* ---- Divider ---- */}
      <div className="w-full h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

      {/* ---- Institutional Funds ---- */}
      <section className="py-16 sm:py-20">
        <Container>
          <div data-whale-heading className="mb-10">
            <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-zinc-600 mb-3">
              TradFi Meets DeFi
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
              Institutional Funds
            </h2>
            <p className="text-sm text-zinc-500 mt-2 max-w-md">
              Major institutional crypto holders and their on-chain strategies.
            </p>
          </div>

          <div
            data-whale-grid
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {INSTITUTIONAL_FUNDS.map((fund) => (
              <div
                key={fund.name}
                data-whale-card
                className="rounded-xl backdrop-blur-md bg-white/[0.03] border border-white/[0.06] p-5 transition-all duration-300 hover:bg-white/[0.04] hover:border-white/[0.1] flex flex-col"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-lg font-bold text-white flex-shrink-0">
                    {fund.icon}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">
                      {fund.name}
                    </h3>
                    <span className="text-[10px] font-mono text-zinc-600">
                      {fund.ticker}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-zinc-500 mb-4 leading-relaxed">
                  {fund.description}
                </p>

                <ul className="space-y-1.5 flex-1">
                  {fund.bullets.map((b, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-xs text-zinc-500"
                    >
                      <span className="text-zinc-700 mt-0.5 flex-shrink-0 font-mono text-[10px]">
                        --
                      </span>
                      {b}
                    </li>
                  ))}
                </ul>

                {fund.arkhamUrl ? (
                  <a
                    href={fund.arkhamUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-5 inline-flex items-center justify-center gap-2 text-xs font-mono text-zinc-400 hover:text-white transition-colors px-4 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.06] hover:border-white/[0.1]"
                  >
                    Track on Arkham
                    <svg
                      className="w-3 h-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 17L17 7M17 7H7M17 7v10"
                      />
                    </svg>
                  </a>
                ) : (
                  <div className="mt-5 text-center text-[10px] font-mono text-zinc-700 px-4 py-2.5 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                    No on-chain tracking available
                  </div>
                )}
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* ---- Data Disclaimer ---- */}
      <div className="w-full h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      <section className="py-10">
        <Container>
          <p className="text-[10px] font-mono text-zinc-700 leading-relaxed text-center max-w-2xl mx-auto">
            Data sourced from Etherscan. Entity labels curated by Futures AI.
            For comprehensive on-chain intelligence, visit{" "}
            <a
              href="https://www.arkhamintelligence.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-zinc-500 hover:text-white transition-colors underline underline-offset-2"
            >
              Arkham Intelligence
            </a>
            .
          </p>
        </Container>
      </section>

      {/* ---- Footer spacer ---- */}
      <div className="pb-24 sm:pb-32" />
    </div>
  );
}
