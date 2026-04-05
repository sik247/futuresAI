"use client";

import { useState, useCallback } from "react";

/* ──────────────────────────── Types ──────────────────────────── */

type GlobalMarketData = {
  total_market_cap: { usd: number };
  total_volume: { usd: number };
  market_cap_percentage: { btc: number; eth: number };
  active_cryptocurrencies: number;
};

type CoinData = {
  id: string;
  market_cap_rank: number;
  name: string;
  symbol: string;
  image: string;
  current_price: number;
  price_change_percentage_24h: number | null;
  price_change_percentage_7d_in_currency: number | null;
  market_cap: number;
  total_volume: number;
};

type SortKey =
  | "market_cap_rank"
  | "current_price"
  | "price_change_percentage_24h"
  | "price_change_percentage_7d_in_currency"
  | "market_cap"
  | "total_volume";

type SortDir = "asc" | "desc";

/* ──────────────────────────── Helpers ─────────────────────────── */

function formatCompact(n: number): string {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  return `$${n.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
}

function formatPrice(n: number): string {
  if (n >= 1) return `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 4, maximumFractionDigits: 6 })}`;
}

function formatPct(n: number | null): string {
  if (n === null || n === undefined) return "--";
  return `${n >= 0 ? "+" : ""}${n.toFixed(2)}%`;
}

function pctColor(n: number | null): string {
  if (n === null || n === undefined) return "text-zinc-500";
  return n >= 0 ? "text-emerald-400" : "text-red-400";
}

/* ────────────────────── Market Correlations ───────────────────── */

export function MarketCorrelations({ data }: { data: GlobalMarketData | null }) {
  if (!data) return null;

  const stats = [
    {
      label: "TOTAL MARKET CAP",
      value: data.total_market_cap.usd / 1e12,
      prefix: "$",
      suffix: "T",
      decimals: 2,
    },
    {
      label: "24H VOLUME",
      value: data.total_volume.usd / 1e9,
      prefix: "$",
      suffix: "B",
      decimals: 1,
    },
    {
      label: "BTC DOMINANCE",
      value: data.market_cap_percentage.btc,
      prefix: "",
      suffix: "%",
      decimals: 1,
    },
    {
      label: "ETH DOMINANCE",
      value: data.market_cap_percentage.eth,
      prefix: "",
      suffix: "%",
      decimals: 1,
    },
    {
      label: "ACTIVE CRYPTOS",
      value: data.active_cryptocurrencies,
      prefix: "",
      suffix: "",
      decimals: 0,
    },
  ];

  return (
    <div className="grid grid-cols-5 divide-x divide-white/[0.04]">
      {stats.map((s) => (
        <div key={s.label} className="px-3 py-2.5 flex flex-col gap-1">
          <span className="text-[8px] font-mono uppercase tracking-widest text-zinc-600">{s.label}</span>
          <span className="text-sm font-mono font-semibold text-zinc-100 tabular-nums">
            {s.prefix}
            {s.value.toLocaleString("en-US", {
              minimumFractionDigits: s.decimals,
              maximumFractionDigits: s.decimals,
            })}
            {s.suffix}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ────────────────────── Top Coins Table ───────────────────────── */

export function TopCoinsTable({ coins }: { coins: CoinData[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("market_cap_rank");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const handleSort = useCallback(
    (key: SortKey) => {
      if (sortKey === key) {
        setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      } else {
        setSortKey(key);
        setSortDir(key === "market_cap_rank" ? "asc" : "desc");
      }
    },
    [sortKey]
  );

  const sorted = [...coins].sort((a, b) => {
    const aVal = a[sortKey] ?? 0;
    const bVal = b[sortKey] ?? 0;
    return sortDir === "asc"
      ? (aVal as number) - (bVal as number)
      : (bVal as number) - (aVal as number);
  });

  const headerClass =
    "px-3 py-2 text-[10px] font-mono uppercase tracking-widest text-zinc-500 cursor-pointer hover:text-zinc-300 transition-colors select-none whitespace-nowrap";

  const sortIndicator = (key: SortKey) => {
    if (sortKey !== key) return "";
    return sortDir === "asc" ? " ^" : " v";
  };

  return (
    <div className="overflow-x-auto h-full">
      <table className="w-full min-w-[700px]">
        <thead className="sticky top-0 bg-zinc-950">
          <tr className="border-b border-white/[0.06]">
            <th
              className={`${headerClass} text-left`}
              onClick={() => handleSort("market_cap_rank")}
            >
              #{sortIndicator("market_cap_rank")}
            </th>
            <th className={`${headerClass} text-left`}>Name</th>
            <th
              className={`${headerClass} text-right`}
              onClick={() => handleSort("current_price")}
            >
              Price{sortIndicator("current_price")}
            </th>
            <th
              className={`${headerClass} text-right`}
              onClick={() => handleSort("price_change_percentage_24h")}
            >
              24h %{sortIndicator("price_change_percentage_24h")}
            </th>
            <th
              className={`${headerClass} text-right`}
              onClick={() =>
                handleSort("price_change_percentage_7d_in_currency")
              }
            >
              7d %{sortIndicator("price_change_percentage_7d_in_currency")}
            </th>
            <th
              className={`${headerClass} text-right`}
              onClick={() => handleSort("market_cap")}
            >
              Market Cap{sortIndicator("market_cap")}
            </th>
            <th
              className={`${headerClass} text-right`}
              onClick={() => handleSort("total_volume")}
            >
              Volume{sortIndicator("total_volume")}
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((coin) => (
            <tr
              key={coin.id}
              className="border-b border-white/[0.03] hover:bg-white/[0.03] transition-colors"
            >
              <td className="px-3 py-1.5 font-mono text-[11px] text-zinc-500">
                {coin.market_cap_rank}
              </td>
              <td className="px-3 py-1.5">
                <div className="flex items-center gap-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={coin.image}
                    alt={coin.name}
                    width={20}
                    height={20}
                    className="rounded-full shrink-0"
                  />
                  <div className="flex flex-col">
                    <span className="text-[11px] font-medium text-zinc-200">
                      {coin.name}
                    </span>
                    <span className="text-[9px] font-mono text-zinc-500 uppercase">
                      {coin.symbol}
                    </span>
                  </div>
                </div>
              </td>
              <td className="px-3 py-1.5 text-right font-mono text-[11px] text-zinc-200">
                {formatPrice(coin.current_price)}
              </td>
              <td
                className={`px-3 py-1.5 text-right font-mono text-[11px] ${pctColor(
                  coin.price_change_percentage_24h
                )}`}
              >
                {formatPct(coin.price_change_percentage_24h)}
              </td>
              <td
                className={`px-3 py-1.5 text-right font-mono text-[11px] ${pctColor(
                  coin.price_change_percentage_7d_in_currency
                )}`}
              >
                {formatPct(coin.price_change_percentage_7d_in_currency)}
              </td>
              <td className="px-3 py-1.5 text-right font-mono text-[11px] text-zinc-300">
                {formatCompact(coin.market_cap)}
              </td>
              <td className="px-3 py-1.5 text-right font-mono text-[11px] text-zinc-400">
                {formatCompact(coin.total_volume)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
