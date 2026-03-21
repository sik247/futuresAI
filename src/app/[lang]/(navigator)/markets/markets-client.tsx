"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import gsap from "gsap";

type Market = {
  question: string;
  outcomePrices: number[];
  outcomes: string[];
  volume: number | string;
};

type Event = {
  id: string;
  title: string;
  image: string;
  volume: number | string;
  liquidity: number | string;
  endDate: string;
  markets: Market[];
};

type SortKey = "volume" | "liquidity" | "endDate";

function formatVolume(vol: number | string) {
  const n = typeof vol === "string" ? parseFloat(vol) : vol;
  if (isNaN(n)) return "$0";
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
}

function formatDate(dateStr: string) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function MarketCard({ event }: { event: Event }) {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseEnter = useCallback(() => {
    if (!cardRef.current) return;
    gsap.to(cardRef.current, {
      y: -4,
      duration: 0.25,
      ease: "power2.out",
    });
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (!cardRef.current) return;
    gsap.to(cardRef.current, {
      y: 0,
      duration: 0.25,
      ease: "power2.out",
    });
  }, []);

  return (
    <div
      ref={cardRef}
      className="market-card rounded-xl backdrop-blur-md bg-white/[0.03] border border-white/[0.08] p-5 flex flex-col transition-colors duration-300 hover:border-white/[0.18] hover:shadow-[0_0_30px_rgba(255,255,255,0.03)]"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Header */}
      <div className="flex items-start gap-3.5 mb-4">
        {event.image && (
          <img
            src={event.image}
            alt=""
            className="w-12 h-12 rounded-lg object-cover flex-shrink-0 border border-white/[0.06]"
          />
        )}
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-zinc-100 leading-snug line-clamp-2">
            {event.title}
          </h3>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {event.volume && (
              <span className="inline-flex items-center px-2 py-0.5 rounded bg-white/[0.06] text-[11px] font-mono text-zinc-400">
                VOL {formatVolume(event.volume)}
              </span>
            )}
            {event.liquidity && (
              <span className="inline-flex items-center px-2 py-0.5 rounded bg-white/[0.06] text-[11px] font-mono text-zinc-400">
                LIQ {formatVolume(event.liquidity)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Markets */}
      <div className="space-y-3.5 flex-1">
        {event.markets.slice(0, 3).map((market, mi) => {
          const yesRaw = market.outcomePrices?.[0]
            ? parseFloat(String(market.outcomePrices[0]))
            : 0.5;
          const noRaw = market.outcomePrices?.[1]
            ? parseFloat(String(market.outcomePrices[1]))
            : 0.5;
          const yesPct = (yesRaw * 100).toFixed(0);
          const noPct = (noRaw * 100).toFixed(0);
          const yesWidth = yesRaw * 100;
          const yesDominant = yesRaw >= noRaw;

          return (
            <div key={mi} className="space-y-1.5">
              {event.markets.length > 1 && (
                <p className="text-xs text-zinc-500 line-clamp-1">
                  {market.question}
                </p>
              )}
              {/* Probability gauge */}
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs font-mono font-bold w-11 text-right ${
                    yesDominant ? "text-emerald-400" : "text-emerald-400/60"
                  }`}
                >
                  {yesPct}%
                </span>
                <div className="flex-1 h-2.5 rounded-full bg-zinc-800/80 overflow-hidden flex">
                  <div
                    className="h-full rounded-l-full transition-all duration-500"
                    style={{
                      width: `${yesWidth}%`,
                      background: yesDominant
                        ? "linear-gradient(90deg, #059669, #34d399)"
                        : "rgba(52, 211, 153, 0.3)",
                    }}
                  />
                  <div
                    className="h-full rounded-r-full transition-all duration-500"
                    style={{
                      width: `${100 - yesWidth}%`,
                      background: !yesDominant
                        ? "linear-gradient(90deg, #f43f5e, #fb7185)"
                        : "rgba(244, 63, 94, 0.3)",
                    }}
                  />
                </div>
                <span
                  className={`text-xs font-mono font-bold w-11 ${
                    !yesDominant ? "text-rose-400" : "text-rose-400/60"
                  }`}
                >
                  {noPct}%
                </span>
              </div>
              {/* Outcome labels */}
              <div className="flex justify-between px-[calc(2.75rem+0.5rem)]">
                <span
                  className={`text-[10px] ${
                    yesDominant
                      ? "text-emerald-400/80 font-medium"
                      : "text-zinc-600"
                  }`}
                >
                  {market.outcomes?.[0] || "Yes"}
                </span>
                <span
                  className={`text-[10px] ${
                    !yesDominant
                      ? "text-rose-400/80 font-medium"
                      : "text-zinc-600"
                  }`}
                >
                  {market.outcomes?.[1] || "No"}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      {event.endDate && (
        <div className="mt-4 pt-3 border-t border-white/[0.06]">
          <span className="text-[11px] font-mono text-zinc-600">
            Closes: {formatDate(event.endDate)}
          </span>
        </div>
      )}
    </div>
  );
}

export default function MarketsClient({ events }: { events: Event[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("volume");
  const gridRef = useRef<HTMLDivElement>(null);

  const sorted = [...events].sort((a, b) => {
    if (sortKey === "volume") {
      return (
        parseFloat(String(b.volume || 0)) - parseFloat(String(a.volume || 0))
      );
    }
    if (sortKey === "liquidity") {
      return (
        parseFloat(String(b.liquidity || 0)) -
        parseFloat(String(a.liquidity || 0))
      );
    }
    if (sortKey === "endDate") {
      return (
        new Date(a.endDate || 0).getTime() -
        new Date(b.endDate || 0).getTime()
      );
    }
    return 0;
  });

  useEffect(() => {
    if (!gridRef.current) return;
    const cards = gridRef.current.querySelectorAll(".market-card");
    gsap.fromTo(
      cards,
      { opacity: 0, y: 24 },
      {
        opacity: 1,
        y: 0,
        duration: 0.45,
        stagger: 0.06,
        ease: "power2.out",
      }
    );
  }, [sortKey]);

  const sortOptions: { key: SortKey; label: string }[] = [
    { key: "volume", label: "By Volume" },
    { key: "liquidity", label: "By Liquidity" },
    { key: "endDate", label: "By End Date" },
  ];

  return (
    <div>
      {/* Sort controls */}
      <div className="flex items-center gap-2 mb-6">
        <span className="text-xs font-mono text-zinc-600 uppercase tracking-wider mr-2">
          Sort
        </span>
        {sortOptions.map((opt) => (
          <button
            key={opt.key}
            onClick={() => setSortKey(opt.key)}
            className={`px-3 py-1.5 rounded-md text-xs font-mono transition-all duration-200 ${
              sortKey === opt.key
                ? "bg-white/[0.08] text-zinc-200 border border-white/[0.12]"
                : "text-zinc-500 hover:text-zinc-300 border border-transparent"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div
        ref={gridRef}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
      >
        {sorted.map((event) => (
          <MarketCard key={event.id} event={event} />
        ))}
      </div>
    </div>
  );
}
