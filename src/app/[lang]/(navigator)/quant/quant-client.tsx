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

const QuantTools = dynamic(
  () => import("./quant-tools"),
  {
    loading: () => (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="h-12 w-12 rounded-full border-2 border-blue-500/30 border-t-blue-500 animate-spin" />
        <p className="text-sm text-zinc-500 font-mono">Loading Tools...</p>
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
  BNB: { emoji: "B", gradient: "from-yellow-500 to-amber-500" },
  DOGE: { emoji: "D", gradient: "from-amber-400 to-yellow-500" },
  ADA: { emoji: "A", gradient: "from-blue-500 to-cyan-500" },
  AVAX: { emoji: "A", gradient: "from-red-500 to-rose-500" },
  DOT: { emoji: "D", gradient: "from-pink-500 to-rose-500" },
  LINK: { emoji: "L", gradient: "from-blue-400 to-blue-600" },
};

/* -- Sparkline SVG component -- */
function Sparkline({ data, className }: { data?: number[]; className?: string }) {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const w = 56, h = 18;
  const points = data.map((v, i) =>
    `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`
  ).join(" ");
  const color = data[data.length - 1] >= data[0] ? "#22c55e" : "#ef4444";
  return (
    <svg width={w} height={h} className={className}>
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

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
  { key: "tools", labelKey: "quant_tools" as const },
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
  const [toolsLoaded, setToolsLoaded] = useState(false);

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
    if (tab === "tools" && !toolsLoaded) {
      setToolsLoaded(true);
    }
  };

  const { signals, fearGreed, btcTrend, marketSummary } = data;

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* ============================================================ */}
      {/*  HERO                                                        */}
      {/* ============================================================ */}
      <section ref={heroRef} className="relative pt-24 sm:pt-28 pb-20 overflow-hidden">
        {/* Background gradient orbs */}
        <div className="absolute inset-0 bg-gradient-to-b from-blue-950/25 via-zinc-950 to-zinc-950" />
        <div className="absolute top-[-80px] left-1/4 w-[500px] h-[500px] bg-blue-500/[0.12] rounded-full blur-[120px] animate-pulse" />
        <div className="absolute top-[-40px] right-1/4 w-[400px] h-[400px] bg-cyan-500/[0.10] rounded-full blur-[100px] animate-pulse [animation-delay:2s]" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[200px] bg-indigo-500/[0.06] rounded-full blur-[80px]" />

        <div className="relative z-10 max-w-7xl mx-auto px-6">
          <p className="font-mono text-[11px] tracking-[0.3em] text-zinc-500 uppercase mb-3 flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500" />
            </span>
            {t.quant_subtitle}
          </p>
          <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-bold tracking-tighter leading-[0.95] mb-6">
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
      <div className="sticky top-[64px] sm:top-[92px] z-30 bg-zinc-950/90 backdrop-blur-xl border-b border-white/[0.04]">
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
                  className={`relative z-10 px-6 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 focus-visible:ring-offset-1 focus-visible:ring-offset-zinc-950 ${
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
      <div className="max-w-7xl mx-auto px-6 pt-10 pb-24 sm:pb-32">
        {activeTab === "signals" && (
          <div>
            {/* -- Market Regime Bar (Bloomberg-style) ---------------------- */}
            <div
              ref={overviewRef}
              className="rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl shadow-lg shadow-black/40 mb-8 overflow-hidden"
            >
              <div className="grid grid-cols-2 md:grid-cols-5 divide-x divide-white/[0.04]">
                {/* Fear & Greed */}
                <div className="p-5">
                  <p className="text-[11px] text-zinc-500 font-mono uppercase tracking-[0.15em] mb-2">{t.quant_fearGreed}</p>
                  <div className="flex items-baseline gap-2">
                    <AnimatedCounter value={fearGreed.value} decimals={0} className="text-2xl font-mono font-bold" />
                    <span className={`text-[11px] font-mono font-semibold ${fearGreed.value <= 25 ? "text-red-400" : fearGreed.value <= 45 ? "text-orange-400" : fearGreed.value <= 55 ? "text-yellow-400" : fearGreed.value <= 75 ? "text-lime-400" : "text-emerald-400"}`}>
                      {fearGreed.classification}
                    </span>
                  </div>
                  <div className="h-1 rounded-full bg-white/[0.06] mt-2 overflow-hidden">
                    <div className={`h-full rounded-full bg-gradient-to-r ${fearGreedColor(fearGreed.value)} transition-all duration-700`} style={{ width: `${fearGreed.value}%` }} />
                  </div>
                </div>

                {/* BTC Trend */}
                <div className="p-5">
                  <p className="text-[11px] text-zinc-500 font-mono uppercase tracking-[0.15em] mb-2">{t.quant_btcTrend}</p>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${btcTrend === "above_sma" ? "bg-emerald-500" : "bg-red-500"}`} />
                    <span className={`text-lg font-mono font-bold ${btcTrend === "above_sma" ? "text-emerald-400" : "text-red-400"}`}>
                      {btcTrend === "above_sma" ? t.quant_aboveSma : t.quant_belowSma}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-600 font-mono mt-1">7-Day SMA</p>
                </div>

                {/* Bull/Bear Ratio */}
                <div className="p-5">
                  <p className="text-[11px] text-zinc-500 font-mono uppercase tracking-[0.15em] mb-2">{lang === "ko" ? "시그널 비율" : "Signal Ratio"}</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-emerald-400 text-lg font-mono font-bold">{signals.filter(s => s.signal === "Strong Buy" || s.signal === "Buy").length}</span>
                    <span className="text-zinc-600 text-sm font-mono">/</span>
                    <span className="text-zinc-400 text-lg font-mono font-bold">{signals.filter(s => s.signal === "Neutral").length}</span>
                    <span className="text-zinc-600 text-sm font-mono">/</span>
                    <span className="text-red-400 text-lg font-mono font-bold">{signals.filter(s => s.signal === "Strong Sell" || s.signal === "Sell").length}</span>
                  </div>
                  <p className="text-xs text-zinc-600 font-mono mt-1">{lang === "ko" ? "매수 / 중립 / 매도" : "Buy / Neutral / Sell"}</p>
                </div>

                {/* BTC Price */}
                <div className="p-5">
                  <p className="text-[11px] text-zinc-500 font-mono uppercase tracking-[0.15em] mb-2">BTC/USDT</p>
                  <AnimatedCounter value={signals[0]?.price || 0} prefix="$" decimals={0} className="text-lg font-mono font-bold text-white" />
                  <span className={`text-[11px] font-mono font-semibold ml-2 ${(signals[0]?.change24h || 0) >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                    {(signals[0]?.change24h || 0) >= 0 ? "+" : ""}{(signals[0]?.change24h || 0).toFixed(2)}%
                  </span>
                </div>

                {/* Refresh */}
                <div className="p-5 flex flex-col justify-between">
                  <p className="text-[11px] text-zinc-500 font-mono uppercase tracking-[0.15em] mb-2">{t.quant_autoRefresh}</p>
                  <span className="text-lg font-mono font-bold text-zinc-400 tabular-nums">{countdownDisplay}</span>
                  <button onClick={handleRefresh} disabled={loading}
                    className="mt-1 inline-flex items-center gap-1.5 text-xs font-mono text-blue-400 hover:text-blue-300 transition-colors duration-200 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 rounded">
                    {loading ? (
                      <>
                        <span className="h-3 w-3 rounded-full border border-blue-400/40 border-t-blue-400 animate-spin" />
                        <span>{lang === "ko" ? "갱신 중..." : "Refreshing..."}</span>
                      </>
                    ) : t.quant_refreshNow}
                  </button>
                </div>
              </div>
            </div>

            {/* -- Market Summary ----------------------------------------- */}
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-6 py-4 mb-8">
              <p className="text-sm text-zinc-400 leading-relaxed">
                <span className="text-zinc-200 font-semibold">{t.quant_marketSummary}:</span>{" "}
                {marketSummary}
              </p>
            </div>

            {/* -- Asset Signals Header ----------------------------------- */}
            <div className="flex items-center gap-3 mb-5">
              <div className="w-1 h-5 rounded-full bg-blue-500/70" />
              <h2 className="text-base font-semibold tracking-tight text-zinc-200">{t.quant_assetSignals}</h2>
              <span className="text-[10px] font-mono text-zinc-600">{signals.length} {lang === "ko" ? "자산" : "assets"}</span>
              <span className="text-[10px] font-mono text-zinc-700 hidden sm:inline">
                Updated: {new Date(data.updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>

            {/* -- Signal Table (Bloomberg-style) -------------------------- */}
            <div
              ref={cardsRef}
              className="rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl shadow-lg shadow-black/40 overflow-hidden mb-8"
            >
              {/* Table Header */}
              <div className="hidden md:grid gap-0 px-6 py-3 border-b border-white/[0.06] text-[9px] font-mono text-zinc-600 uppercase tracking-[0.15em]" style={{ gridTemplateColumns: "2fr 1.5fr 1fr 1fr 1fr 1fr 1fr 1.5fr 1.5fr" }}>
                <div>{lang === "ko" ? "자산" : "Asset"}</div>
                <div className="text-right">{lang === "ko" ? "가격" : "Price"}</div>
                <div className="text-right">24h %</div>
                <div className="text-center">{lang === "ko" ? "추세" : "Trend"}</div>
                <div className="text-right">RSI</div>
                <div className="text-right">MACD</div>
                <div className="text-center">{lang === "ko" ? "방향" : "Direction"}</div>
                <div className="text-center">{lang === "ko" ? "시그널" : "Signal"}</div>
                <div className="text-right">{t.quant_confidence}</div>
              </div>

              {/* Signal Rows */}
              {signals.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <div className="h-8 w-8 rounded-full border-2 border-blue-500/30 border-t-blue-500 animate-spin" />
                  <p className="text-sm text-zinc-400 font-medium">
                    {lang === "ko" ? "시그널 데이터를 불러오고 있습니다..." : "Loading signal data..."}
                  </p>
                  <p className="text-xs text-zinc-600">
                    {lang === "ko" ? "실시간 시장 분석에 시간이 걸릴 수 있습니다" : "Real-time market analysis may take a moment"}
                  </p>
                </div>
              )}
              {signals.map((s) => {
                const icon = COIN_ICONS[s.symbol];
                const gradient = icon?.gradient ?? "from-zinc-500 to-zinc-700";
                const label = icon?.emoji ?? s.symbol.charAt(0);
                const signalStyle = SIGNAL_COLORS[s.signal] ?? { bg: "", glow: "" };
                const rsiColor = s.rsi > 70 ? "text-red-400" : s.rsi < 30 ? "text-emerald-400" : "text-zinc-400";
                const macdColor = s.macd?.histogram >= 0 ? "text-emerald-400" : "text-red-400";

                return (
                  <div
                    key={s.symbol}
                    className="group hidden md:grid items-center px-6 py-4 border-b border-white/[0.03] hover:bg-white/[0.03] transition-all duration-200"
                    style={{ gridTemplateColumns: "2fr 1.5fr 1fr 1fr 1fr 1fr 1fr 1.5fr 1.5fr" }}
                  >
                    {/* Asset */}
                    <div className="flex items-center gap-3">
                      <div className={`h-8 w-8 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-bold text-xs flex-shrink-0`}>
                        {label}
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-white leading-tight">{s.coin}</h3>
                        <p className="text-[10px] text-zinc-500 font-mono">{s.symbol}/USDT</p>
                      </div>
                    </div>

                    {/* Price */}
                    <div className="text-right">
                      <AnimatedCounter value={s.price} prefix="$" decimals={s.price > 100 ? 0 : 2} className="text-sm font-mono font-bold text-white tabular-nums" />
                    </div>

                    {/* 24h Change */}
                    <div className="text-right">
                      <span className={`text-xs font-mono font-bold tabular-nums ${s.change24h >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                        {s.change24h >= 0 ? "+" : ""}{s.change24h.toFixed(2)}%
                      </span>
                    </div>

                    {/* Sparkline */}
                    <div className="flex justify-center">
                      <Sparkline data={s.sparkline} />
                    </div>

                    {/* RSI */}
                    <div className="text-right">
                      <span className={`text-xs font-mono font-bold tabular-nums ${rsiColor}`}>
                        {s.rsi?.toFixed(1) || "—"}
                      </span>
                    </div>

                    {/* MACD */}
                    <div className="text-right">
                      <span className={`text-xs font-mono font-bold tabular-nums ${macdColor}`}>
                        {s.macd?.histogram ? (s.macd.histogram >= 0 ? "+" : "") + s.macd.histogram.toFixed(1) : "—"}
                      </span>
                    </div>

                    {/* Direction */}
                    <div className="flex justify-center">
                      <span className={`px-2.5 py-1 text-[10px] font-mono font-bold rounded-md border ${
                        s.direction === "LONG"
                          ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                          : s.direction === "SHORT"
                          ? "bg-red-500/20 text-red-400 border-red-500/30"
                          : "bg-zinc-500/20 text-zinc-400 border-zinc-500/30"
                      }`}>
                        {s.direction === "LONG" ? "\u25B2 LONG" : s.direction === "SHORT" ? "\u25BC SHORT" : "\u25C6 WAIT"}
                      </span>
                    </div>

                    {/* Signal */}
                    <div className="flex justify-center">
                      <span className={`px-3 py-1 text-[10px] font-mono font-bold rounded-full border ${signalStyle.bg} ${signalStyle.glow}`}>
                        {s.signal}
                      </span>
                    </div>

                    {/* Confidence */}
                    <div>
                      <div className="flex items-center gap-2 justify-end">
                        <div className="w-16 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                          <div className={`h-full rounded-full bg-gradient-to-r ${confidenceBarColor(s.confidence)} transition-all duration-700`} style={{ width: `${s.confidence}%` }} />
                        </div>
                        <AnimatedCounter value={s.confidence} suffix="%" decimals={0} className="text-[11px] font-mono font-semibold text-zinc-400 tabular-nums w-8 text-right" />
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Expanded Detail Cards (below table on mobile) */}
              <div className="md:hidden divide-y divide-white/[0.04]">
                {signals.map((s) => {
                  const signalStyle = SIGNAL_COLORS[s.signal] ?? { bg: "", glow: "" };
                  return (
                    <div key={`mobile-${s.symbol}`} className="p-5 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-white">{s.symbol}</span>
                          <Sparkline data={s.sparkline} />
                        </div>
                        <span className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded-md border ${
                          s.direction === "LONG"
                            ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                            : s.direction === "SHORT"
                            ? "bg-red-500/20 text-red-400 border-red-500/30"
                            : "bg-zinc-500/20 text-zinc-400 border-zinc-500/30"
                        }`}>
                          {s.direction === "LONG" ? "\u25B2 LONG" : s.direction === "SHORT" ? "\u25BC SHORT" : "\u25C6 WAIT"}
                        </span>
                        <span className={`px-2.5 py-1 text-[10px] font-mono font-bold rounded-full border ${signalStyle.bg}`}>{s.signal}</span>
                      </div>
                      <div className="flex justify-between text-xs font-mono">
                        <span className="text-zinc-400">Price</span>
                        <span className="text-white">${s.price.toLocaleString(undefined, { maximumFractionDigits: s.price > 100 ? 0 : 2 })}</span>
                      </div>
                      <div className="flex justify-between text-xs font-mono">
                        <span className="text-zinc-400">24h</span>
                        <span className={s.change24h >= 0 ? "text-emerald-400" : "text-red-400"}>{s.change24h >= 0 ? "+" : ""}{s.change24h.toFixed(2)}%</span>
                      </div>
                      <div className="flex justify-between text-xs font-mono">
                        <span className="text-zinc-400">RSI</span>
                        <span className={s.rsi > 70 ? "text-red-400" : s.rsi < 30 ? "text-emerald-400" : "text-zinc-300"}>{s.rsi?.toFixed(1) || "—"}</span>
                      </div>
                      <div className="flex justify-between text-xs font-mono">
                        <span className="text-zinc-400">MACD</span>
                        <span className={s.macd?.histogram >= 0 ? "text-emerald-400" : "text-red-400"}>{s.macd?.histogram ? (s.macd.histogram >= 0 ? "+" : "") + s.macd.histogram.toFixed(1) : "—"}</span>
                      </div>
                      <div className="flex justify-between text-xs font-mono">
                        <span className="text-zinc-400">{t.quant_confidence}</span>
                        <span className="text-zinc-300">{s.confidence}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* -- Reasons/Analysis Panel --------------------------------- */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
              {signals.map((s) => {
                const signalStyle = SIGNAL_COLORS[s.signal] ?? { bg: "", glow: "" };
                return (
                  <div key={`reasons-${s.symbol}`} className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-4 hover:bg-white/[0.05] hover:border-white/[0.10] transition-all duration-200">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-zinc-200">{s.symbol}</span>
                        <span className={`text-[10px] font-mono ${s.change24h >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                          {s.change24h >= 0 ? "+" : ""}{s.change24h.toFixed(2)}%
                        </span>
                      </div>
                      <span className={`px-2 py-0.5 text-[9px] font-mono font-bold rounded-full border ${signalStyle.bg}`}>
                        {s.signal}
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      {s.reasons.map((r, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <span className="mt-1.5 w-1 h-1 rounded-full bg-zinc-600 flex-shrink-0" />
                          <span className="text-[12px] text-zinc-400 leading-relaxed">{r}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* -- Disclaimer -------------------------------------------- */}
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-6 text-center">
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

        {activeTab === "tools" && (
          <div>
            {toolsLoaded && <QuantTools lang={lang} />}
          </div>
        )}
      </div>
    </div>
  );
}
