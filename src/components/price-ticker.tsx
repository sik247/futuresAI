"use client";

import { useEffect, useState } from "react";

interface CoinPrice {
  id: string;
  symbol: string;
  current_price: number;
  price_change_percentage_24h: number;
}

const COINS = "bitcoin,ethereum,solana,ripple,binancecoin";

export function PriceTicker() {
  const [prices, setPrices] = useState<CoinPrice[]>([]);

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const res = await fetch(
          `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${COINS}&order=market_cap_desc&sparkline=false`
        );
        if (res.ok) setPrices(await res.json());
      } catch {
        // silently fail — ticker will remain hidden
      }
    };
    fetchPrices();
    const interval = setInterval(fetchPrices, 60000);
    return () => clearInterval(interval);
  }, []);

  if (prices.length === 0) return null;

  // Duplicate items for seamless infinite scroll
  const items = [...prices, ...prices];

  return (
    <div className="fixed inset-x-0 top-0 z-[60] w-full bg-zinc-950 border-b border-white/[0.04] overflow-hidden h-[30px]">
      <div className="flex animate-ticker whitespace-nowrap py-[7px]">
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
  );
}
