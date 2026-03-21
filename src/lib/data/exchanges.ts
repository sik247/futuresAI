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
    logo: "/icons/footer-icons/bybit-logo.png",
    makerFee: 0.02,
    takerFee: 0.055,
    paybackRate: 0.9,
    color: "#f7a600",
    features: ["Lowest Maker Fees", "High Liquidity"],
  },
  {
    id: "bitget",
    name: "Bitget",
    logo: "/icons/footer-icons/bitget.svg",
    makerFee: 0.02,
    takerFee: 0.06,
    paybackRate: 0.85,
    color: "#00b894",
    features: ["Copy Trading", "Social Features"],
  },
  {
    id: "bingx",
    name: "BingX",
    logo: "/icons/footer-icons/bingX.webp",
    makerFee: 0.02,
    takerFee: 0.05,
    paybackRate: 0.85,
    color: "#2d8cf0",
    features: ["Grid Trading", "Demo Account"],
  },
  {
    id: "okx",
    name: "OKX",
    logo: "/icons/footer-icons/okx.svg",
    makerFee: 0.02,
    takerFee: 0.05,
    paybackRate: 0.9,
    color: "#ffffff",
    features: ["DEX Aggregator", "Earn Products"],
  },
];
