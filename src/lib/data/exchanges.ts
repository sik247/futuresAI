export interface ExchangeInfo {
  id: string;
  name: string;
  logo: string;
  makerFee: number;
  takerFee: number;
  paybackRate: number;
  color: string;
  features: string[];
}

export const EXCHANGES: ExchangeInfo[] = [
  {
    id: "bybit",
    name: "Bybit",
    logo: "/icons/exchange/bybit.svg",
    makerFee: 0.02,
    takerFee: 0.055,
    paybackRate: 0.20,
    color: "#f7a600",
    features: ["Lowest Maker Fees", "High Liquidity"],
  },
  {
    id: "bitget",
    name: "Bitget",
    logo: "/icons/exchange/bitget.svg",
    makerFee: 0.02,
    takerFee: 0.06,
    paybackRate: 0.55,
    color: "#00b894",
    features: ["Copy Trading", "Social Features"],
  },
  {
    id: "okx",
    name: "OKX",
    logo: "/icons/exchange/okx.svg",
    makerFee: 0.02,
    takerFee: 0.05,
    paybackRate: 0.20,
    color: "#ffffff",
    features: ["DEX Aggregator", "Earn Products"],
  },
  {
    id: "gate",
    name: "Gate.io",
    logo: "/icons/exchange/gate.svg",
    makerFee: 0.02,
    takerFee: 0.05,
    paybackRate: 0.75,
    color: "#2d8cf0",
    features: ["Wide Token Selection", "Margin Trading"],
  },
  {
    id: "htx",
    name: "HTX",
    logo: "/icons/exchange/htx.svg",
    makerFee: 0.02,
    takerFee: 0.05,
    paybackRate: 0.54,
    color: "#2b6aff",
    features: ["Global Exchange", "Staking Rewards"],
  },
];
