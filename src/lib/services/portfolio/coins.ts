// Top 100 coins mapped: CoinGecko ID → symbol → name
// Used for coin search, CSV parsing, and OCR symbol resolution
export const COIN_LIST = [
  { id: "bitcoin", symbol: "BTC", name: "Bitcoin" },
  { id: "ethereum", symbol: "ETH", name: "Ethereum" },
  { id: "tether", symbol: "USDT", name: "Tether" },
  { id: "binancecoin", symbol: "BNB", name: "BNB" },
  { id: "solana", symbol: "SOL", name: "Solana" },
  { id: "usd-coin", symbol: "USDC", name: "USD Coin" },
  { id: "ripple", symbol: "XRP", name: "XRP" },
  { id: "dogecoin", symbol: "DOGE", name: "Dogecoin" },
  { id: "cardano", symbol: "ADA", name: "Cardano" },
  { id: "staked-ether", symbol: "STETH", name: "Lido Staked Ether" },
  { id: "tron", symbol: "TRX", name: "TRON" },
  { id: "avalanche-2", symbol: "AVAX", name: "Avalanche" },
  { id: "the-open-network", symbol: "TON", name: "Toncoin" },
  { id: "shiba-inu", symbol: "SHIB", name: "Shiba Inu" },
  { id: "chainlink", symbol: "LINK", name: "Chainlink" },
  { id: "bitcoin-cash", symbol: "BCH", name: "Bitcoin Cash" },
  { id: "polkadot", symbol: "DOT", name: "Polkadot" },
  { id: "dai", symbol: "DAI", name: "Dai" },
  { id: "litecoin", symbol: "LTC", name: "Litecoin" },
  { id: "uniswap", symbol: "UNI", name: "Uniswap" },
  { id: "leo-token", symbol: "LEO", name: "LEO Token" },
  { id: "near", symbol: "NEAR", name: "NEAR Protocol" },
  { id: "cosmos", symbol: "ATOM", name: "Cosmos" },
  { id: "ethereum-classic", symbol: "ETC", name: "Ethereum Classic" },
  { id: "aptos", symbol: "APT", name: "Aptos" },
  { id: "internet-computer", symbol: "ICP", name: "Internet Computer" },
  { id: "hedera-hashgraph", symbol: "HBAR", name: "Hedera" },
  { id: "mantle", symbol: "MNT", name: "Mantle" },
  { id: "filecoin", symbol: "FIL", name: "Filecoin" },
  { id: "stellar", symbol: "XLM", name: "Stellar" },
  { id: "crypto-com-chain", symbol: "CRO", name: "Cronos" },
  { id: "immutable-x", symbol: "IMX", name: "Immutable" },
  { id: "render-token", symbol: "RNDR", name: "Render" },
  { id: "vechain", symbol: "VET", name: "VeChain" },
  { id: "optimism", symbol: "OP", name: "Optimism" },
  { id: "arbitrum", symbol: "ARB", name: "Arbitrum" },
  { id: "injective-protocol", symbol: "INJ", name: "Injective" },
  { id: "pepe", symbol: "PEPE", name: "Pepe" },
  { id: "sui", symbol: "SUI", name: "Sui" },
  { id: "sei-network", symbol: "SEI", name: "Sei" },
  { id: "aave", symbol: "AAVE", name: "Aave" },
  { id: "maker", symbol: "MKR", name: "Maker" },
  { id: "the-graph", symbol: "GRT", name: "The Graph" },
  { id: "algorand", symbol: "ALGO", name: "Algorand" },
  { id: "matic-network", symbol: "MATIC", name: "Polygon" },
  { id: "fantom", symbol: "FTM", name: "Fantom" },
  { id: "thorchain", symbol: "RUNE", name: "THORChain" },
  { id: "fetch-ai", symbol: "FET", name: "Fetch.ai" },
  { id: "theta-token", symbol: "THETA", name: "Theta Network" },
  { id: "worldcoin-wld", symbol: "WLD", name: "Worldcoin" },
  { id: "floki", symbol: "FLOKI", name: "FLOKI" },
  { id: "bonk", symbol: "BONK", name: "Bonk" },
  { id: "ondo-finance", symbol: "ONDO", name: "Ondo" },
  { id: "jupiter-exchange-solana", symbol: "JUP", name: "Jupiter" },
  { id: "pendle", symbol: "PENDLE", name: "Pendle" },
  { id: "celestia", symbol: "TIA", name: "Celestia" },
  { id: "starknet", symbol: "STRK", name: "Starknet" },
  { id: "wormhole", symbol: "W", name: "Wormhole" },
  { id: "pyth-network", symbol: "PYTH", name: "Pyth Network" },
  { id: "eos", symbol: "EOS", name: "EOS" },
  { id: "flow", symbol: "FLOW", name: "Flow" },
  { id: "gala", symbol: "GALA", name: "Gala" },
  { id: "sandbox", symbol: "SAND", name: "The Sandbox" },
  { id: "axie-infinity", symbol: "AXS", name: "Axie Infinity" },
  { id: "decentraland", symbol: "MANA", name: "Decentraland" },
  { id: "lido-dao", symbol: "LDO", name: "Lido DAO" },
  { id: "ens", symbol: "ENS", name: "Ethereum Name Service" },
  { id: "1inch", symbol: "1INCH", name: "1inch" },
  { id: "curve-dao-token", symbol: "CRV", name: "Curve DAO" },
  { id: "dydx", symbol: "DYDX", name: "dYdX" },
];

export type CoinInfo = { id: string; symbol: string; name: string };

const symbolMap = new Map(COIN_LIST.map((c) => [c.symbol.toUpperCase(), c]));
const idMap = new Map(COIN_LIST.map((c) => [c.id, c]));

export function findCoinBySymbol(symbol: string): CoinInfo | undefined {
  return symbolMap.get(symbol.toUpperCase());
}

export function findCoinById(id: string): CoinInfo | undefined {
  return idMap.get(id);
}
