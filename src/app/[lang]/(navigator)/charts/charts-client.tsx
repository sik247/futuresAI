"use client";

import { useRef, useState } from "react";
import gsap from "gsap";
import { TradingViewChart } from "../live/live-client";

const SYMBOLS = [
  { label: "BTC/USDT", value: "BINANCE:BTCUSDT" },
  { label: "ETH/USDT", value: "BINANCE:ETHUSDT" },
  { label: "SOL/USDT", value: "BINANCE:SOLUSDT" },
  { label: "XRP/USDT", value: "BINANCE:XRPUSDT" },
] as const;

export function MultiChartTerminal() {
  const [activeIndex, setActiveIndex] = useState(0);
  const chartWrapRef = useRef<HTMLDivElement>(null);
  const tabsRef = useRef<HTMLDivElement>(null);

  // Tab switch animation
  const handleTabSwitch = (index: number) => {
    if (index === activeIndex) return;

    if (chartWrapRef.current) {
      gsap.to(chartWrapRef.current, {
        opacity: 0,
        y: 12,
        duration: 0.2,
        ease: "power2.in",
        onComplete: () => {
          setActiveIndex(index);
          gsap.to(chartWrapRef.current, {
            opacity: 1,
            y: 0,
            duration: 0.35,
            ease: "power2.out",
          });
        },
      });
    } else {
      setActiveIndex(index);
    }
  };

  return (
    <>
      {/* Header with tabs */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-white/[0.06] shrink-0 overflow-x-auto">
        <span className="text-[10px] font-mono uppercase tracking-[0.15em] text-zinc-500 shrink-0">Charts</span>
        <div ref={tabsRef} className="flex gap-1 ml-2">
          {SYMBOLS.map((s, i) => (
            <button
              key={s.value}
              onClick={() => handleTabSwitch(i)}
              className={`px-2.5 py-1 rounded text-[10px] font-mono font-medium transition-all duration-200 border cursor-pointer ${
                i === activeIndex
                  ? "bg-blue-500/12 border-blue-500/30 text-blue-400"
                  : "bg-white/[0.02] border-white/[0.06] text-zinc-500 hover:bg-white/[0.05] hover:text-zinc-300"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-2 shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-mono text-zinc-600 uppercase tracking-wider">Live</span>
        </div>
      </div>
      {/* Chart fills remaining space */}
      <div
        ref={chartWrapRef}
        className="flex-1 overflow-hidden [&_.tradingview-widget-container]:!h-full [&_.tradingview-widget-container]:!rounded-none [&_.tradingview-widget-container]:!border-0"
      >
        <TradingViewChart symbol={SYMBOLS[activeIndex].value} />
      </div>
    </>
  );
}
