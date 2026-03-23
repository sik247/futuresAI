"use client";

import { useEffect, useRef, useState } from "react";
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
  const hasAnimated = useRef(false);

  // Entrance animation
  useEffect(() => {
    if (hasAnimated.current) return;
    hasAnimated.current = true;

    const ctx = gsap.context(() => {
      if (tabsRef.current) {
        gsap.from(tabsRef.current.children, {
          opacity: 0,
          y: 16,
          stagger: 0.08,
          duration: 0.5,
          ease: "power3.out",
        });
      }
      if (chartWrapRef.current) {
        gsap.from(chartWrapRef.current, {
          opacity: 0,
          y: 24,
          duration: 0.6,
          delay: 0.3,
          ease: "power3.out",
        });
      }
    });

    return () => ctx.revert();
  }, []);

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
    <div>
      {/* Tab Selector */}
      <div
        ref={tabsRef}
        className="flex flex-wrap gap-1.5 mb-5"
      >
        {SYMBOLS.map((s, i) => (
          <button
            key={s.value}
            onClick={() => handleTabSwitch(i)}
            className={`
              relative px-4 py-2 rounded-lg font-mono text-sm font-medium
              transition-all duration-200 border
              ${
                i === activeIndex
                  ? "bg-blue-500/12 border-blue-500/30 text-blue-400"
                  : "bg-white/[0.02] border-white/[0.06] text-zinc-400 hover:bg-white/[0.05] hover:border-white/[0.1] hover:text-zinc-300"
              }
            `}
          >
            <span className="relative">{s.label}</span>
          </button>
        ))}
      </div>

      {/* Chart Container */}
      <div
        ref={chartWrapRef}
        className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden"
      >
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-mono text-sm text-zinc-300 tabular-nums">
              {SYMBOLS[activeIndex].label}
            </span>
            <span className="font-mono text-[10px] text-zinc-600 uppercase tracking-wider">Live</span>
          </div>
          <span className="font-mono text-[10px] text-zinc-600 uppercase tracking-wider">TradingView</span>
        </div>
        <TradingViewChart symbol={SYMBOLS[activeIndex].value} />
      </div>
    </div>
  );
}
