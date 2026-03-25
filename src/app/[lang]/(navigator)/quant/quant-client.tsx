"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import gsap from "gsap";
import dynamic from "next/dynamic";
import type { MarketSignals } from "@/lib/services/signals/signals.service";
import type { Dictionary } from "@/i18n";

/* ------------------------------------------------------------------ */
/*  Lazy-load Chart Analyzer (only loaded when tab is active)          */
/* ------------------------------------------------------------------ */
const ChartAnalyzer = dynamic(
  () => import("../chart-ideas/analyze/chart-analyzer"),
  {
    loading: () => (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="h-12 w-12 rounded-full border-2 border-blue-500/30 border-t-blue-500 animate-spin" />
        <p className="text-sm text-zinc-500 font-mono">Loading Chart Analysis...</p>
      </div>
    ),
    ssr: false,
  }
);

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */
const COIN_ICONS: Record<string, { emoji: string; gradient: string }> = {
  BTC: { emoji: "\u20BF", gradient: "from-orange-500 to-amber-500" },
  ETH: { emoji: "\u039E", gradient: "from-blue-400 to-indigo-500" },
  SOL: { emoji: "\u25CE", gradient: "from-purple-500 to-fuchsia-500" },
  XRP: { emoji: "\u2715", gradient: "from-zinc-300 to-zinc-500" },
};

const SIGNAL_COLORS: Record<string, { bg: string; glow: string }> = {
  "Strong Buy": {
    bg: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    glow: "shadow-[0_0_12px_rgba(16,185,129,0.3)]",
  },
  Buy: {
    bg: "bg-green-500/20 text-green-400 border-green-500/30",
    glow: "shadow-[0_0_10px_rgba(34,197,94,0.2)]",
  },
  Neutral: {
    bg: "bg-zinc-500/20 text-zinc-300 border-zinc-500/30",
    glow: "",
  },
  Sell: {
    bg: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    glow: "shadow-[0_0_10px_rgba(245,158,11,0.2)]",
  },
  "Strong Sell": {
    bg: "bg-red-500/20 text-red-400 border-red-500/30",
    glow: "shadow-[0_0_12px_rgba(239,68,68,0.3)]",
  },
};

const AUTO_REFRESH_INTERVAL = 300;

const TABS = [
  { key: "signals", labelKey: "quant_signals" as const },
  { key: "chart", labelKey: "quant_chartAnalysis" as const },
] as const;

type TabKey = (typeof TABS)[number]["key"];

/* ------------------------------------------------------------------ */
/*  Utility helpers                                                    */
/* ------------------------------------------------------------------ */
function confidenceBarColor(v: number) {
  if (v >= 75) return "from-emerald-500 to-emerald-400";
  if (v >= 50) return "from-green-500 to-green-400";
  if (v >= 35) return "from-amber-500 to-amber-400";
  return "from-red-500 to-red-400";
}

function fearGreedColor(v: number): string {
  if (v <= 25) return "from-red-500 to-red-400";
  if (v <= 45) return "from-orange-500 to-orange-400";
  if (v <= 55) return "from-yellow-500 to-yellow-400";
  if (v <= 75) return "from-lime-500 to-lime-400";
  return "from-emerald-500 to-emerald-400";
}

function formatVolume(v: number): string {
  if (v >= 1_000_000_000) return `$${(v / 1_000_000_000).toFixed(2)}B`;
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(2)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(1)}K`;
  return `$${v.toFixed(0)}`;
}

/* ------------------------------------------------------------------ */
/*  AnimatedCounter                                                    */
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
/*  Auto-refresh countdown hook                                        */
/* ------------------------------------------------------------------ */
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

  const reset = useCallback(() => setSeconds(AUTO_REFRESH_INTERVAL), []);
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const display = `${mins}:${String(secs).padStart(2, "0")}`;

  return { display, reset };
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */
export default function QuantClient({
  initialData,
  lang,
  translations: t,
}: {
  initialData: MarketSignals;
  lang: string;
  translations: Dictionary;
}) {
  const [data, setData] = useState<MarketSignals>(initialData);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>("signals");
  const [chartLoaded, setChartLoaded] = useState(false);

  const heroRef = useRef<HTMLDivElement>(null);
  const overviewRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);
  const tabsRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLDivElement>(null);

  /* -- GSAP entrance ------------------------------------------------ */
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(heroRef.current, {
        opacity: 0,
        y: 30,
        duration: 0.8,
        ease: "power3.out",
      });

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
    });
    return () => ctx.revert();
  }, []);

  /* -- GSAP tab indicator ------------------------------------------- */
  const moveIndicator = useCallback((tabKey: string) => {
    if (!tabsRef.current || !indicatorRef.current) return;
    const tab = tabsRef.current.querySelector(
      `[data-tab="${tabKey}"]`
    ) as HTMLElement;
    if (!tab) return;
    gsap.to(indicatorRef.current, {
      x: tab.offsetLeft,
      width: tab.offsetWidth,
      duration: 0.35,
      ease: "power2.out",
    });
  }, []);

  useEffect(() => {
    moveIndicator(activeTab);
  }, [activeTab, moveIndicator]);

  useEffect(() => {
    const timeout = setTimeout(() => moveIndicator("signals"), 100);
    return () => clearTimeout(timeout);
  }, [moveIndicator]);

  /* -- Refresh handler ---------------------------------------------- */
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

  const { display: countdownDisplay, reset: resetCountdown } =
    useCountdown(refresh);

  const handleRefresh = useCallback(async () => {
    resetCountdown();
    await refresh();
  }, [refresh, resetCountdown]);

  const handleTabChange = (tab: TabKey) => {
    if (tab === activeTab) return;
    setActiveTab(tab);
    if (tab === "chart" && !chartLoaded) {
      setChartLoaded(true);
    }
  };

  const { signals, fearGreed, btcTrend, marketSummary } = data;

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* ============================================================ */}
      {/*  HERO                                                        */}
      {/* ============================================================ */}
      <section ref={heroRef} className="relative pt-28 pb-16 overflow-hidden">
        {/* Background gradient orbs */}
        <div className="absolute inset-0 bg-gradient-to-b from-blue-950/20 via-zinc-950 to-zinc-950" />
        <div className="absolute top-[-80px] left-1/4 w-[500px] h-[500px] bg-blue-600/[0.07] rounded-full blur-[120px] animate-pulse" />
        <div className="absolute top-[-40px] right-1/4 w-[400px] h-[400px] bg-cyan-600/[0.05] rounded-full blur-[100px] animate-pulse [animation-delay:2s]" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[200px] bg-indigo-600/[0.04] rounded-full blur-[80px]" />

        <div className="relative z-10 max-w-7xl mx-auto px-6">
          <p className="font-mono text-[11px] tracking-[0.3em] text-zinc-500 uppercase mb-3 flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500" />
            </span>
            {t.quant_subtitle}
          </p>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tighter leading-[0.9] mb-5">
            <span className="text-white">AI </span>
            <span className="bg-gradient-to-r from-white via-blue-400 to-cyan-400 bg-clip-text text-transparent">
              Quant Terminal
            </span>
          </h1>
          <p className="text-base md:text-lg text-zinc-400 max-w-2xl leading-relaxed mb-8">
            {t.quant_description}
          </p>

          {/* Stats bar */}
          <div className="flex flex-wrap items-center gap-4 sm:gap-6">
            {/* Fear & Greed mini */}
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span
                  className={`relative inline-flex rounded-full h-2 w-2 ${
                    fearGreed.value <= 45
                      ? "bg-red-500"
                      : fearGreed.value <= 55
                      ? "bg-yellow-500"
                      : "bg-emerald-500"
                  }`}
                />
              </span>
              <span className="text-xs text-zinc-400 font-mono tracking-wide">
                {t.quant_fearGreed}: {fearGreed.value} ({fearGreed.classification})
              </span>
              <div className="h-4 w-px bg-zinc-800 ml-2 hidden sm:block" />
            </div>

            {/* BTC Trend mini */}
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span
                  className={`relative inline-flex rounded-full h-2 w-2 ${
                    btcTrend === "above_sma" ? "bg-emerald-500" : "bg-red-500"
                  }`}
                />
              </span>
              <span className="text-xs text-zinc-400 font-mono tracking-wide">
                BTC:{" "}
                {btcTrend === "above_sma" ? t.quant_aboveSma : t.quant_belowSma}
              </span>
              <div className="h-4 w-px bg-zinc-800 ml-2 hidden sm:block" />
            </div>

            {/* Signal count */}
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
              </span>
              <span className="text-xs text-zinc-400 font-mono tracking-wide">
                {signals.length} signals
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  TAB BAR                                                     */}
      {/* ============================================================ */}
      <div className="sticky top-[64px] z-30 bg-zinc-950/90 backdrop-blur-xl border-b border-white/[0.04]">
        <div className="max-w-7xl mx-auto px-6 py-3">
          <div className="relative">
            <div
              ref={tabsRef}
              className="flex gap-1 p-1 rounded-2xl bg-white/[0.03] border border-white/[0.06] backdrop-blur-sm w-fit"
            >
              <div
                ref={indicatorRef}
                className="absolute top-1 left-0 h-[calc(100%-8px)] rounded-xl bg-gradient-to-r from-blue-600/25 to-cyan-600/20 border border-blue-500/35 shadow-[0_0_16px_rgba(59,130,246,0.15)] pointer-events-none"
                style={{ width: 0 }}
              />
              {TABS.map((tab) => (
                <button
                  key={tab.key}
                  data-tab={tab.key}
                  onClick={() => handleTabChange(tab.key)}
                  className={`relative z-10 px-6 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-colors duration-200 ${
                    activeTab === tab.key
                      ? "text-white"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  {t[tab.labelKey]}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/*  TAB CONTENT                                                 */}
      {/* ============================================================ */}
      <div className="max-w-7xl mx-auto px-6 py-10">
        {activeTab === "signals" && (
          <div>
            {/* -- Market Overview ---------------------------------------- */}
            <div
              ref={overviewRef}
              className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10"
            >
              {/* Fear & Greed */}
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl p-6 transition-all duration-200 hover:border-white/[0.12] hover:bg-white/[0.05]">
                <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-[0.2em] mb-3">
                  {t.quant_fearGreed} Index
                </p>
                <div className="flex items-end gap-3 mb-4">
                  <AnimatedCounter
                    value={fearGreed.value}
                    decimals={0}
                    className="text-4xl font-mono font-bold"
                  />
                  <span className="text-sm text-zinc-400 mb-1 font-mono">
                    / 100 &middot; {fearGreed.classification}
                  </span>
                </div>
                {/* Gauge bar */}
                <div className="h-2.5 rounded-full bg-white/[0.06] overflow-hidden">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${fearGreedColor(
                      fearGreed.value
                    )} transition-all duration-700`}
                    style={{ width: `${fearGreed.value}%` }}
                  />
                </div>
                <div className="flex justify-between mt-1.5">
                  <span className="text-[9px] text-zinc-600 font-mono uppercase tracking-wider">
                    Extreme Fear
                  </span>
                  <span className="text-[9px] text-zinc-600 font-mono uppercase tracking-wider">
                    Extreme Greed
                  </span>
                </div>
              </div>

              {/* BTC Trend */}
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl p-6 transition-all duration-200 hover:border-white/[0.12] hover:bg-white/[0.05]">
                <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-[0.2em] mb-3">
                  {t.quant_btcTrend} &middot; 7-Day SMA
                </p>
                <p className="text-2xl font-mono font-bold mb-2">
                  {btcTrend === "above_sma" ? (
                    <span className="text-emerald-400">{t.quant_aboveSma}</span>
                  ) : (
                    <span className="text-red-400">{t.quant_belowSma}</span>
                  )}
                </p>
                <div className="flex items-center gap-2">
                  <div
                    className={`h-1.5 w-1.5 rounded-full ${
                      btcTrend === "above_sma"
                        ? "bg-emerald-500"
                        : "bg-red-500"
                    }`}
                  />
                  <span className="text-xs text-zinc-500 font-mono">
                    {btcTrend === "above_sma" ? "Bullish" : "Bearish"} bias
                  </span>
                </div>
              </div>

              {/* Market Summary */}
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl p-6 transition-all duration-200 hover:border-white/[0.12] hover:bg-white/[0.05]">
                <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-[0.2em] mb-3">
                  {t.quant_marketSummary}
                </p>
                <p className="text-sm text-zinc-300 leading-relaxed">
                  {marketSummary}
                </p>
              </div>
            </div>

            {/* -- Refresh bar ------------------------------------------- */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold tracking-tight">
                {t.quant_assetSignals}
              </h2>
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-mono text-zinc-600 hidden sm:inline">
                  Last updated: {new Date(data.updatedAt).toLocaleTimeString()}
                </span>
                <span className="text-[10px] font-mono text-zinc-600">
                  {t.quant_autoRefresh} {countdownDisplay}
                </span>
                <button
                  onClick={handleRefresh}
                  disabled={loading}
                  className="px-4 py-2 text-xs font-mono font-medium rounded-xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl hover:bg-white/[0.08] hover:border-white/[0.12] transition-all duration-200 disabled:opacity-40"
                >
                  {loading ? "..." : t.quant_refreshNow}
                </button>
              </div>
            </div>

            {/* -- Signal Cards Grid -------------------------------------- */}
            <div
              ref={cardsRef}
              className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-12"
            >
              {signals.map((s) => {
                const icon = COIN_ICONS[s.symbol];
                const gradient = icon?.gradient ?? "from-zinc-500 to-zinc-700";
                const label = icon?.emoji ?? s.symbol.charAt(0);
                const signalStyle = SIGNAL_COLORS[s.signal] ?? {
                  bg: "",
                  glow: "",
                };

                return (
                  <div
                    key={s.symbol}
                    className="group rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl p-6 flex flex-col gap-5 transition-all duration-300 hover:border-white/[0.12] hover:bg-white/[0.05] hover:shadow-[0_8px_32px_rgba(0,0,0,0.3)]"
                  >
                    {/* Header row */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`h-11 w-11 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-lg`}
                        >
                          {label}
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold leading-tight">
                            {s.coin}
                          </h3>
                          <p className="text-[11px] text-zinc-500 font-mono">
                            {s.symbol}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`px-3.5 py-1.5 text-[11px] font-mono font-bold rounded-full border ${signalStyle.bg} ${signalStyle.glow}`}
                      >
                        {s.signal}
                      </span>
                    </div>

                    {/* Price + change + volume */}
                    <div className="flex items-end justify-between">
                      <div className="flex items-end gap-3">
                        <AnimatedCounter
                          value={s.price}
                          prefix="$"
                          decimals={s.price > 100 ? 2 : 4}
                          className="text-3xl font-mono font-bold tracking-tight"
                        />
                        <span
                          className={`text-sm font-mono font-semibold mb-0.5 px-2 py-0.5 rounded-md ${
                            s.change24h >= 0
                              ? "text-emerald-400 bg-emerald-500/10"
                              : "text-red-400 bg-red-500/10"
                          }`}
                        >
                          {s.change24h >= 0 ? "+" : ""}
                          {s.change24h.toFixed(2)}%
                        </span>
                      </div>
                      {s.volume24h > 0 && (
                        <div className="text-right">
                          <p className="text-[9px] text-zinc-600 font-mono uppercase tracking-wider">
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
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider">
                          {t.quant_confidence}
                        </span>
                        <AnimatedCounter
                          value={s.confidence}
                          suffix="%"
                          decimals={0}
                          className="text-[11px] font-mono font-semibold text-zinc-400"
                        />
                      </div>
                      <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
                        <div
                          className={`h-full rounded-full bg-gradient-to-r ${confidenceBarColor(
                            s.confidence
                          )} transition-all duration-700`}
                          style={{ width: `${s.confidence}%` }}
                        />
                      </div>
                    </div>

                    {/* Reasons as tags */}
                    <div className="flex flex-wrap gap-1.5">
                      {s.reasons.slice(0, 3).map((r, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center gap-1.5 text-[11px] text-zinc-400 px-2.5 py-1 rounded-lg bg-white/[0.03] border border-white/[0.06]"
                        >
                          <span className="h-1 w-1 rounded-full bg-zinc-600 flex-shrink-0" />
                          {r}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* -- Disclaimer -------------------------------------------- */}
            <div className="rounded-2xl border border-white/[0.04] bg-white/[0.015] p-6 text-center">
              <p className="text-[11px] text-zinc-600 leading-relaxed max-w-2xl mx-auto font-mono">
                {t.quant_disclaimer}
              </p>
            </div>
          </div>
        )}

        {activeTab === "chart" && (
          <div>
            <ChartAnalyzer lang={lang} translations={t} />
          </div>
        )}
      </div>
    </div>
  );
}
