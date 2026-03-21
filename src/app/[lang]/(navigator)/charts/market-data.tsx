"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import gsap from "gsap";

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
  const containerRef = useRef<HTMLDivElement>(null);
  const countersAnimated = useRef(false);

  useEffect(() => {
    if (!data || countersAnimated.current || !containerRef.current) return;
    countersAnimated.current = true;

    const ctx = gsap.context(() => {
      // Stagger card entrance
      gsap.from(containerRef.current!.children, {
        opacity: 0,
        y: 20,
        stagger: 0.1,
        duration: 0.5,
        ease: "power3.out",
      });

      // Animate counter values
      const counters = containerRef.current!.querySelectorAll("[data-counter]");
      counters.forEach((el) => {
        const target = parseFloat(el.getAttribute("data-counter") || "0");
        const suffix = el.getAttribute("data-suffix") || "";
        const prefix = el.getAttribute("data-prefix") || "";
        const decimals = parseInt(el.getAttribute("data-decimals") || "2", 10);
        const obj = { val: 0 };

        gsap.to(obj, {
          val: target,
          duration: 1.5,
          ease: "power2.out",
          onUpdate: () => {
            el.textContent = `${prefix}${obj.val.toLocaleString("en-US", {
              minimumFractionDigits: decimals,
              maximumFractionDigits: decimals,
            })}${suffix}`;
          },
        });
      });
    });

    return () => ctx.revert();
  }, [data]);

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
    <div
      ref={containerRef}
      className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3"
    >
      {stats.map((s) => (
        <div
          key={s.label}
          className="rounded-xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-md p-4 flex flex-col gap-2"
        >
          <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">
            {s.label}
          </span>
          <span
            className="text-xl font-mono font-semibold text-zinc-100"
            data-counter={s.value}
            data-prefix={s.prefix}
            data-suffix={s.suffix}
            data-decimals={s.decimals}
          >
            {s.prefix}0{s.suffix}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ────────────────────── Top Coins Table ───────────────────────── */

export function TopCoinsTable({ coins }: { coins: CoinData[] }) {
  const tableRef = useRef<HTMLTableSectionElement>(null);
  const hasAnimated = useRef(false);
  const [sortKey, setSortKey] = useState<SortKey>("market_cap_rank");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  useEffect(() => {
    if (hasAnimated.current || !tableRef.current) return;
    hasAnimated.current = true;

    const ctx = gsap.context(() => {
      gsap.from(tableRef.current!.children, {
        opacity: 0,
        x: -16,
        stagger: 0.06,
        duration: 0.4,
        ease: "power3.out",
      });
    });

    return () => ctx.revert();
  }, []);

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
    "px-4 py-3 text-[10px] font-mono uppercase tracking-widest text-zinc-500 cursor-pointer hover:text-zinc-300 transition-colors select-none whitespace-nowrap";

  const sortIndicator = (key: SortKey) => {
    if (sortKey !== key) return "";
    return sortDir === "asc" ? " ^" : " v";
  };

  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-md overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[800px]">
          <thead>
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
          <tbody ref={tableRef}>
            {sorted.map((coin) => (
              <tr
                key={coin.id}
                className="border-b border-white/[0.03] hover:bg-white/[0.03] transition-colors"
              >
                <td className="px-4 py-3 font-mono text-sm text-zinc-500">
                  {coin.market_cap_rank}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={coin.image}
                      alt={coin.name}
                      width={24}
                      height={24}
                      className="rounded-full"
                    />
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-zinc-200">
                        {coin.name}
                      </span>
                      <span className="text-xs font-mono text-zinc-500 uppercase">
                        {coin.symbol}
                      </span>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-right font-mono text-sm text-zinc-200">
                  {formatPrice(coin.current_price)}
                </td>
                <td
                  className={`px-4 py-3 text-right font-mono text-sm ${pctColor(
                    coin.price_change_percentage_24h
                  )}`}
                >
                  {formatPct(coin.price_change_percentage_24h)}
                </td>
                <td
                  className={`px-4 py-3 text-right font-mono text-sm ${pctColor(
                    coin.price_change_percentage_7d_in_currency
                  )}`}
                >
                  {formatPct(coin.price_change_percentage_7d_in_currency)}
                </td>
                <td className="px-4 py-3 text-right font-mono text-sm text-zinc-300">
                  {formatCompact(coin.market_cap)}
                </td>
                <td className="px-4 py-3 text-right font-mono text-sm text-zinc-400">
                  {formatCompact(coin.total_volume)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
