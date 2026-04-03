"use client";

import { useEffect, useState } from "react";

interface CoinPrice {
  id: string;
  symbol: string;
  current_price: number;
  price_change_percentage_24h: number;
}

const SYMBOLS = [
  { id: "bitcoin", symbol: "BTC", binance: "BTCUSDT" },
  { id: "ethereum", symbol: "ETH", binance: "ETHUSDT" },
  { id: "solana", symbol: "SOL", binance: "SOLUSDT" },
  { id: "ripple", symbol: "XRP", binance: "XRPUSDT" },
  { id: "binancecoin", symbol: "BNB", binance: "BNBUSDT" },
];

export function PriceTicker() {
  const [prices, setPrices] = useState<CoinPrice[]>([]);

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const results = await Promise.all(
          SYMBOLS.map(async (s) => {
            const res = await fetch(
              `https://api.binance.com/api/v3/ticker/24hr?symbol=${s.binance}`
            );
            const data = await res.json();
            return {
              id: s.id,
              symbol: s.symbol,
              current_price: parseFloat(data.lastPrice) || 0,
              price_change_percentage_24h: parseFloat(data.priceChangePercent) || 0,
            };
          })
        );
        setPrices(results);
      } catch {
        // silently fail
      }
    };
    fetchPrices();
    const interval = setInterval(fetchPrices, 60000);
    return () => clearInterval(interval);
  }, []);

  if (prices.length === 0) return null;

  const items = [...prices, ...prices];

  return (
    <div className="fixed inset-x-0 top-0 z-[60] w-full bg-zinc-950 border-b border-white/[0.04] overflow-hidden h-[28px] hidden sm:flex items-center">
      {/* Scrolling prices */}
      <div className="flex-1 overflow-hidden">
        <div className="flex animate-ticker whitespace-nowrap py-1">
          {items.map((coin, i) => (
            <div
              key={`${coin.id}-${i}`}
              className="flex items-center gap-1.5 px-4 shrink-0"
            >
              <span className="text-[11px] font-mono font-semibold text-zinc-300 uppercase">
                {coin.symbol}
              </span>
              <span className="text-[11px] font-mono text-zinc-400 tabular-nums">
                $
                {coin.current_price.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
              <span
                className={`text-[11px] font-mono font-medium tabular-nums ${
                  coin.price_change_percentage_24h >= 0
                    ? "text-emerald-400"
                    : "text-red-400"
                }`}
              >
                {coin.price_change_percentage_24h >= 0 ? "+" : ""}
                {coin.price_change_percentage_24h.toFixed(2)}%
              </span>
              <span className="text-zinc-800 ml-2">&middot;</span>
            </div>
          ))}
        </div>
      </div>

      {/* Telegram channel CTA */}
      <a
        href="https://t.me/FuturesAIOfficial"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 px-3 h-full bg-[#2AABEE]/10 border-l border-[#2AABEE]/20 hover:bg-[#2AABEE]/20 transition-colors shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2AABEE]/50"
      >
        <svg className="w-3 h-3 text-[#2AABEE]" viewBox="0 0 24 24" fill="currentColor">
          <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
        </svg>
        <span className="text-[10px] font-medium text-[#2AABEE] whitespace-nowrap">
          Live Quant Alerts
        </span>
      </a>
    </div>
  );
}
