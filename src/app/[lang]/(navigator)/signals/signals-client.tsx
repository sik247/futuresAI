"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import gsap from "gsap";
import type { MarketSignals } from "@/lib/services/signals/signals.service";
import type { Strategy } from "./strategies";

/* ------------------------------------------------------------------ */
/*  Signal badge colors                                                */
/* ------------------------------------------------------------------ */
const COIN_ICONS: Record<string, { emoji: string; gradient: string }> = {
  BTC: { emoji: "\u20BF", gradient: "from-orange-500 to-amber-500" },
  ETH: { emoji: "\u039E", gradient: "from-blue-400 to-indigo-500" },
  SOL: { emoji: "\u25CE", gradient: "from-purple-500 to-fuchsia-500" },
  XRP: { emoji: "\u2715", gradient: "from-zinc-300 to-zinc-500" },
};

const SIGNAL_COLORS: Record<string, string> = {
  "Strong Buy": "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  Buy: "bg-green-500/20 text-green-400 border-green-500/30",
  Neutral: "bg-zinc-500/20 text-zinc-300 border-zinc-500/30",
  Sell: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  "Strong Sell": "bg-red-500/20 text-red-400 border-red-500/30",
};

const DIFFICULTY_COLORS: Record<string, string> = {
  Beginner: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  Intermediate: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  Advanced: "bg-rose-500/20 text-rose-400 border-rose-500/30",
};

const RISK_COLORS: Record<string, string> = {
  Low: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  Medium: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  High: "bg-rose-500/20 text-rose-400 border-rose-500/30",
};

/* ------------------------------------------------------------------ */
/*  Confidence bar color                                               */
/* ------------------------------------------------------------------ */
function confidenceBarColor(v: number) {
  if (v >= 75) return "bg-emerald-500";
  if (v >= 50) return "bg-green-500";
  if (v >= 35) return "bg-amber-500";
  return "bg-red-500";
}

/* ------------------------------------------------------------------ */
/*  Volume formatter                                                   */
/* ------------------------------------------------------------------ */
function formatVolume(v: number): string {
  if (v >= 1_000_000_000) return `$${(v / 1_000_000_000).toFixed(2)}B`;
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(2)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(1)}K`;
  return `$${v.toFixed(0)}`;
}

/* ------------------------------------------------------------------ */
/*  Fear & Greed gauge color                                           */
/* ------------------------------------------------------------------ */
function fearGreedColor(v: number): string {
  if (v <= 25) return "bg-red-500";
  if (v <= 45) return "bg-orange-500";
  if (v <= 55) return "bg-yellow-500";
  if (v <= 75) return "bg-lime-500";
  return "bg-emerald-500";
}

/* ------------------------------------------------------------------ */
/*  Auto-refresh countdown hook                                        */
/* ------------------------------------------------------------------ */
const AUTO_REFRESH_INTERVAL = 300; // 5 minutes in seconds

function useCountdown(onZero: () => void) {
  const [seconds, setSeconds] = useState(AUTO_REFRESH_INTERVAL);

  useEffect(() => {
    const id = setInterval(() => {
      setSeconds((prev) => {
        if (prev <= 1) {
          onZero();
          return AUTO_REFRESH_INTERVAL;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [onZero]);

  // Reset when external refresh happens
  const reset = useCallback(() => setSeconds(AUTO_REFRESH_INTERVAL), []);

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const display = `${mins}:${String(secs).padStart(2, "0")}`;

  return { display, reset };
}

/* ------------------------------------------------------------------ */
/*  Counter hook                                                       */
/* ------------------------------------------------------------------ */
function AnimatedCounter({
  value,
  prefix = "",
  suffix = "",
  decimals = 2,
  className = "",
}: {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const obj = { val: 0 };
    gsap.to(obj, {
      val: value,
      duration: 1.2,
      ease: "power2.out",
      onUpdate: () => {
        if (ref.current) {
          ref.current.textContent = `${prefix}${obj.val.toLocaleString(undefined, {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
          })}${suffix}`;
        }
      },
    });
  }, [value, prefix, suffix, decimals]);

  return <span ref={ref} className={className} />;
}

/* ------------------------------------------------------------------ */
/*  Loading skeleton                                                   */
/* ------------------------------------------------------------------ */
export function SignalsSkeleton() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white animate-pulse">
      <section className="pt-24 pb-12 px-6 max-w-7xl mx-auto">
        <div className="h-3 w-24 rounded bg-zinc-800 mb-4" />
        <div className="h-10 w-72 rounded bg-zinc-800 mb-4" />
        <div className="h-5 w-96 rounded bg-zinc-800" />
      </section>
      <section className="px-6 max-w-7xl mx-auto mb-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="rounded-2xl border border-white/[0.08] bg-white/5 p-6 space-y-3">
              <div className="h-3 w-28 rounded bg-zinc-800" />
              <div className="h-8 w-20 rounded bg-zinc-800" />
              <div className="h-2 w-full rounded-full bg-zinc-800" />
            </div>
          ))}
        </div>
      </section>
      <section className="px-6 max-w-7xl mx-auto mb-6 flex items-center justify-between">
        <div className="h-7 w-36 rounded bg-zinc-800" />
        <div className="h-9 w-24 rounded-xl bg-zinc-800" />
      </section>
      <section className="px-6 max-w-7xl mx-auto mb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="rounded-2xl border border-white/[0.08] bg-white/5 p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-zinc-800" />
                <div className="space-y-2">
                  <div className="h-4 w-24 rounded bg-zinc-800" />
                  <div className="h-3 w-12 rounded bg-zinc-800" />
                </div>
              </div>
              <div className="h-8 w-32 rounded bg-zinc-800" />
              <div className="h-2 w-full rounded-full bg-zinc-800" />
              <div className="space-y-1.5">
                <div className="h-3 w-full rounded bg-zinc-800" />
                <div className="h-3 w-3/4 rounded bg-zinc-800" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main client component                                              */
/* ------------------------------------------------------------------ */
export default function SignalsClient({
  initialData,
  strategies,
}: {
  initialData: MarketSignals;
  strategies: Strategy[];
}) {
  const [data, setData] = useState<MarketSignals>(initialData);
  const [loading, setLoading] = useState(false);
  const [expandedStrategy, setExpandedStrategy] = useState<string | null>(null);

  const cardsRef = useRef<HTMLDivElement>(null);
  const overviewRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const stratCardsRef = useRef<HTMLDivElement>(null);

  /* -- GSAP entrance animations ------------------------------------ */
  useEffect(() => {
    const ctx = gsap.context(() => {
      // Hero
      gsap.from(heroRef.current, {
        opacity: 0,
        y: 30,
        duration: 0.8,
        ease: "power3.out",
      });

      // Overview bar
      if (overviewRef.current) {
        gsap.from(overviewRef.current.children, {
          opacity: 0,
          y: 20,
          stagger: 0.12,
          duration: 0.6,
          delay: 0.3,
          ease: "power2.out",
        });
      }

      // Signal cards stagger
      if (cardsRef.current) {
        gsap.from(cardsRef.current.children, {
          opacity: 0,
          y: 40,
          stagger: 0.15,
          duration: 0.7,
          delay: 0.5,
          ease: "power2.out",
        });
      }

      // Strategy cards
      if (stratCardsRef.current) {
        gsap.from(stratCardsRef.current.children, {
          opacity: 0,
          y: 30,
          stagger: 0.1,
          duration: 0.6,
          delay: 0.8,
          ease: "power2.out",
        });
      }
    });
    return () => ctx.revert();
  }, []);

  /* -- Signal badge pulse removed (distracting) -------------------- */

  /* -- Refresh handler --------------------------------------------- */
  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/signals", { cache: "no-store" });
      if (res.ok) {
        const json: MarketSignals = await res.json();
        setData(json);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  /* -- Auto-refresh countdown --------------------------------------- */
  const { display: countdownDisplay, reset: resetCountdown } = useCountdown(refresh);

  // Reset countdown on manual refresh
  const handleRefresh = useCallback(async () => {
    resetCountdown();
    await refresh();
  }, [refresh, resetCountdown]);

  const { signals, fearGreed, btcTrend, marketSummary } = data;

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* ============================================================ */}
      {/*  HERO                                                        */}
      {/* ============================================================ */}
      <section ref={heroRef} className="pt-24 pb-12 px-6 max-w-7xl mx-auto">
        <p className="font-mono text-xs tracking-[0.3em] text-zinc-500 uppercase mb-3 flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          AI Signals
        </p>
        <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
          Trading Signals
        </h1>
        <p className="text-zinc-400 max-w-xl text-base md:text-lg">
          AI-powered market analysis combining real-time price data, sentiment
          indicators, and technical signals to help you stay ahead of the
          market.
        </p>
      </section>

      {/* ============================================================ */}
      {/*  MARKET OVERVIEW BAR                                         */}
      {/* ============================================================ */}
      <section className="px-6 max-w-7xl mx-auto mb-12">
        <div
          ref={overviewRef}
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          {/* Fear & Greed */}
          <div className="rounded-2xl border border-white/[0.08] bg-white/5 backdrop-blur-xl p-6 transition-colors duration-200 hover:border-zinc-700/80">
            <p className="text-xs text-zinc-500 font-mono uppercase tracking-wider mb-2">
              Fear &amp; Greed Index
            </p>
            <div className="flex items-end gap-3">
              <AnimatedCounter
                value={fearGreed.value}
                decimals={0}
                className="text-3xl font-mono font-bold"
              />
              <span className="text-sm text-zinc-400 mb-1">
                / 100 &middot; {fearGreed.classification}
              </span>
            </div>
            {/* Gauge bar */}
            <div className="mt-3 h-2 rounded-full bg-white/10 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${fearGreedColor(fearGreed.value)}`}
                style={{ width: `${fearGreed.value}%` }}
              />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-[10px] text-zinc-600 font-mono">Fear</span>
              <span className="text-[10px] text-zinc-600 font-mono">Greed</span>
            </div>
          </div>

          {/* BTC Trend */}
          <div className="rounded-2xl border border-white/[0.08] bg-white/5 backdrop-blur-xl p-6 transition-colors duration-200 hover:border-zinc-700/80">
            <p className="text-xs text-zinc-500 font-mono uppercase tracking-wider mb-2">
              BTC 7-Day SMA Trend
            </p>
            <p className="text-2xl font-mono font-bold">
              {btcTrend === "above_sma" ? (
                <span className="text-emerald-400">Above SMA</span>
              ) : (
                <span className="text-red-400">Below SMA</span>
              )}
            </p>
          </div>

          {/* Summary */}
          <div className="rounded-2xl border border-white/[0.08] bg-white/5 backdrop-blur-xl p-6 transition-colors duration-200 hover:border-zinc-700/80">
            <p className="text-xs text-zinc-500 font-mono uppercase tracking-wider mb-2">
              Market Summary
            </p>
            <p className="text-sm text-zinc-300 leading-relaxed">
              {marketSummary}
            </p>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  REFRESH BUTTON                                              */}
      {/* ============================================================ */}
      <section className="px-6 max-w-7xl mx-auto mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Asset Signals</h2>
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-zinc-600">
            {countdownDisplay}
          </span>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="px-4 py-2 text-sm font-mono rounded-xl border border-white/10 bg-white/5 backdrop-blur-xl hover:bg-white/10 transition-all disabled:opacity-40"
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  SIGNAL CARDS GRID                                           */}
      {/* ============================================================ */}
      <section className="px-6 max-w-7xl mx-auto mb-20">
        <div
          ref={cardsRef}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          {signals.map((s) => (
            <div
              key={s.symbol}
              className="rounded-2xl border border-white/[0.08] bg-white/5 backdrop-blur-xl p-6 flex flex-col gap-4 transition-colors duration-200 hover:border-zinc-700/80"
            >
              {/* Header row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {/* Coin icon */}
                  {(() => {
                    const icon = COIN_ICONS[s.symbol];
                    const gradient = icon?.gradient ?? "from-zinc-500 to-zinc-700";
                    const label = icon?.emoji ?? s.symbol.charAt(0);
                    return (
                      <div
                        className={`h-10 w-10 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}
                      >
                        {label}
                      </div>
                    );
                  })()}
                  <div>
                    <h3 className="text-lg font-semibold">{s.coin}</h3>
                    <p className="text-xs text-zinc-500 font-mono">{s.symbol}</p>
                  </div>
                </div>
                <span
                  className={`px-3 py-1 text-xs font-mono font-semibold rounded-full border ${
                    SIGNAL_COLORS[s.signal] ?? ""
                  }`}
                >
                  {s.signal}
                </span>
              </div>

              {/* Price + change + volume */}
              <div className="flex items-end justify-between">
                <div className="flex items-end gap-4">
                  <AnimatedCounter
                    value={s.price}
                    prefix="$"
                    decimals={s.price > 100 ? 2 : 4}
                    className="text-3xl font-mono font-bold"
                  />
                  <span
                    className={`text-sm font-mono mb-1 ${
                      s.change24h >= 0 ? "text-emerald-400" : "text-red-400"
                    }`}
                  >
                    {s.change24h >= 0 ? "+" : ""}
                    {s.change24h.toFixed(2)}%
                  </span>
                </div>
                {s.volume24h > 0 && (
                  <div className="text-right">
                    <p className="text-[10px] text-zinc-600 font-mono uppercase">
                      24h Vol
                    </p>
                    <p className="text-xs text-zinc-400 font-mono">
                      {formatVolume(s.volume24h)}
                    </p>
                  </div>
                )}
              </div>

              {/* Confidence bar */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-zinc-500 font-mono">
                    Confidence
                  </span>
                  <AnimatedCounter
                    value={s.confidence}
                    suffix="%"
                    decimals={0}
                    className="text-xs font-mono text-zinc-400"
                  />
                </div>
                <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${confidenceBarColor(
                      s.confidence
                    )}`}
                    style={{ width: `${s.confidence}%` }}
                  />
                </div>
              </div>

              {/* Reasons */}
              <ul className="space-y-1">
                {s.reasons.map((r, i) => (
                  <li
                    key={i}
                    className="text-xs text-zinc-400 flex items-start gap-2"
                  >
                    <span className="mt-1.5 h-1 w-1 rounded-full bg-zinc-600 flex-shrink-0" />
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* ============================================================ */}
      {/*  STRATEGY GUIDES                                             */}
      {/* ============================================================ */}
      <section className="px-6 max-w-7xl mx-auto mb-12">
        <h2 className="text-2xl font-bold tracking-tight mb-2">
          Strategy Guides
        </h2>
        <p className="text-zinc-400 mb-8 max-w-xl">
          Learn proven trading strategies ranging from beginner-friendly
          approaches to advanced quantitative techniques.
        </p>

        <div ref={stratCardsRef} className="flex flex-col gap-4">
          {strategies.map((st) => {
            const isOpen = expandedStrategy === st.id;
            return (
              <div
                key={st.id}
                className="rounded-2xl border border-white/[0.08] bg-white/5 backdrop-blur-xl overflow-hidden transition-colors duration-200 hover:border-zinc-700/80"
              >
                {/* Accordion header */}
                <button
                  onClick={() =>
                    setExpandedStrategy(isOpen ? null : st.id)
                  }
                  className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-lg font-semibold">{st.title}</span>
                    <span
                      className={`px-2.5 py-0.5 text-[10px] font-mono font-semibold rounded-full border ${
                        DIFFICULTY_COLORS[st.difficulty] ?? ""
                      }`}
                    >
                      {st.difficulty}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 text-[10px] font-mono font-semibold rounded-full border ${
                        RISK_COLORS[st.riskLevel] ?? ""
                      }`}
                    >
                      {st.riskLevel} Risk
                    </span>
                    <span className="text-xs text-zinc-500 font-mono">
                      {st.timeframe}
                    </span>
                  </div>
                  <svg
                    className={`w-5 h-5 text-zinc-500 transition-transform duration-300 flex-shrink-0 ${
                      isOpen ? "rotate-180" : ""
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {/* Accordion body */}
                {isOpen && (
                  <div className="px-6 pb-6 pt-0 border-t border-white/5">
                    <p className="text-sm text-zinc-400 leading-relaxed mb-4 mt-4">
                      {st.description}
                    </p>
                    <ol className="space-y-2 mb-4">
                      {st.steps.map((step, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-3 text-sm text-zinc-300"
                        >
                          <span className="font-mono text-xs text-zinc-600 mt-0.5 flex-shrink-0">
                            {String(i + 1).padStart(2, "0")}
                          </span>
                          {step}
                        </li>
                      ))}
                    </ol>
                    <p className="text-xs text-zinc-500 italic">
                      Best for: {st.bestFor}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ============================================================ */}
      {/*  DISCLAIMER                                                  */}
      {/* ============================================================ */}
      <section className="px-6 max-w-7xl mx-auto pb-20">
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6 text-center">
          <p className="text-xs text-zinc-600 leading-relaxed max-w-2xl mx-auto">
            Signals are generated from publicly available market data and
            simple technical indicators. This is not financial advice. Always
            do your own research before making investment decisions.
          </p>
        </div>
      </section>
    </div>
  );
}
