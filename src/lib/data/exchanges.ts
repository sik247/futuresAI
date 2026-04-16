export interface ExchangeInfo {
  id: string;
  name: string;
  logo: string;
  makerFee: number;
  takerFee: number;
  paybackRate: number;
  color: string;
  features: string[];
  referralLink?: string;
}

export const EXCHANGES: ExchangeInfo[] = [
  {
    id: "bybit",
    name: "Bybit",
    logo: "/icons/exchange/bybit.png",
    makerFee: 0.016,
    takerFee: 0.044,
    paybackRate: 0.20,
    color: "#f7a600",
    features: ["Lowest Maker Fees", "High Liquidity"],
    referralLink: "https://partner.bybit.com/b/FUTURESAI",
  },
  {
    id: "bitget",
    name: "Bitget",
    logo: "/icons/exchange/bitget.png",
    makerFee: 0.009,
    takerFee: 0.018,
    paybackRate: 0.55,
    color: "#00b894",
    features: ["Copy Trading", "Social Features"],
    referralLink: "https://partner.bitget.com/bg/FuturesAI",
  },
  {
    id: "okx",
    name: "OKX",
    logo: "/icons/exchange/okx.png",
    makerFee: 0.016,
    takerFee: 0.04,
    paybackRate: 0.20,
    color: "#ffffff",
    features: ["DEX Aggregator", "Earn Products"],
    referralLink: "https://www.okx.com/join/futuresai",
  },
  {
    id: "gate",
    name: "Gate.io",
    logo: "/icons/exchange/gate.png",
    makerFee: 0.005,
    takerFee: 0.0125,
    paybackRate: 0.75,
    color: "#2d8cf0",
    features: ["Wide Token Selection", "Margin Trading"],
    referralLink: "https://www.gate.com/share/FuturesAI",
  },
  {
    id: "bingx",
    name: "BingX",
    logo: "/icons/exchange/bingx.png",
    makerFee: 0.01,
    takerFee: 0.025,
    paybackRate: 0.50,
    color: "#2c6ecf",
    features: ["Copy Trading", "Grid Trading"],
    referralLink: "https://bingx.com/en/invite/FCC9QDJK",
  },
  {
    id: "htx",
    name: "HTX",
    logo: "/icons/exchange/htx.png",
    makerFee: 0.0092,
    takerFee: 0.023,
    paybackRate: 0.54,
    color: "#2b6aff",
    features: ["Global Exchange", "Staking Rewards"],
    referralLink: "https://www.htx.com.gt/invite/en-us/1h?invite_code=miqkc223",
  },
  {
    id: "edgex",
    name: "EdgeX",
    logo: "/icons/exchange/edgex.png",
    makerFee: 0.0081,
    takerFee: 0.0225,
    paybackRate: 0,
    color: "#7c3aed",
    features: ["DEX", "10% Fee Discount"],
    referralLink: "https://pro.edgex.exchange/en-US/referral/FUTURESAI",
  },
];
