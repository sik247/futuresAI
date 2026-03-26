"use client";

import { useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";

/* ───────────────────────── TradingView Advanced Chart ───────────────────────── */

export function TradingViewChart({
  symbol = "BINANCE:BTCUSDT",
}: {
  symbol?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { resolvedTheme } = useTheme();
  const tvTheme = resolvedTheme === "dark" ? "dark" : "light";

  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.innerHTML = "";

    const script = document.createElement("script");
    script.src =
      "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol,
      interval: "D",
      timezone: "Etc/UTC",
      theme: tvTheme,
      style: "1",
      locale: "en",
      allow_symbol_change: true,
      calendar: false,
      support_host: "https://www.tradingview.com",
    });
    containerRef.current.appendChild(script);
  }, [symbol, tvTheme]);

  return (
    <div
      ref={containerRef}
      className="tradingview-widget-container rounded-xl overflow-hidden border border-border"
      style={{ height: "min(900px, 85vh)", width: "100%" }}
    />
  );
}

/* ───────────────────────── TradingView Crypto Screener ──────────────────────── */

export function TradingViewScreener() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { resolvedTheme } = useTheme();
  const tvTheme = resolvedTheme === "dark" ? "dark" : "light";

  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.innerHTML = "";

    const script = document.createElement("script");
    script.src =
      "https://s3.tradingview.com/external-embedding/embed-widget-screener.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = JSON.stringify({
      width: "100%",
      height: "600",
      defaultColumn: "overview",
      screener_type: "crypto_mkt",
      displayCurrency: "USD",
      colorTheme: tvTheme,
      locale: "en",
    });
    containerRef.current.appendChild(script);
  }, [tvTheme]);

  return (
    <div
      ref={containerRef}
      className="tradingview-widget-container rounded-xl overflow-hidden border border-border"
      style={{ height: "600px", width: "100%" }}
    />
  );
}

/* ───────────────────────── Fear & Greed Index ───────────────────────────────── */

type FearGreedEntry = {
  value: string;
  value_classification: string;
  timestamp: string;
};

function getClassification(value: number) {
  if (value <= 24)
    return { label: "Extreme Fear", color: "bg-red-500", text: "text-red-500" };
  if (value <= 49)
    return { label: "Fear", color: "bg-orange-500", text: "text-orange-500" };
  if (value === 50)
    return { label: "Neutral", color: "bg-yellow-500", text: "text-yellow-500" };
  if (value <= 74)
    return { label: "Greed", color: "bg-lime-500", text: "text-lime-500" };
  return {
    label: "Extreme Greed",
    color: "bg-green-500",
    text: "text-green-500",
  };
}

function getBarColor(value: number) {
  if (value <= 24) return "bg-red-500";
  if (value <= 49) return "bg-orange-500";
  if (value === 50) return "bg-yellow-500";
  if (value <= 74) return "bg-lime-500";
  return "bg-green-500";
}

export function FearGreedSection({ data }: { data: FearGreedEntry[] }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!data || data.length === 0) return null;

  const current = Number(data[0].value);
  const cls = getClassification(current);

  // Gauge rotation: 0 = -90deg (left), 100 = 90deg (right)
  const gaugeRotation = -90 + (current / 100) * 180;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Current Value Gauge */}
      <div className="lg:col-span-1 flex flex-col items-center justify-center rounded-xl bg-card border border-border p-8">
        <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">
          Fear &amp; Greed Index
        </p>

        {/* Semi-circle gauge */}
        <div className="relative w-48 h-24 mb-4">
          {/* Gauge background */}
          <div className="absolute inset-0 overflow-hidden">
            <div
              className="w-48 h-48 rounded-full"
              style={{
                background:
                  "conic-gradient(from 180deg, #ef4444 0deg, #f97316 45deg, #eab308 90deg, #84cc16 135deg, #22c55e 180deg, transparent 180deg)",
              }}
            />
          </div>
          {/* Inner mask */}
          <div className="absolute left-1/2 top-full -translate-x-1/2 -translate-y-1/2 w-36 h-36 rounded-full bg-card" />
          {/* Needle */}
          {mounted && (
            <div
              className="absolute bottom-0 left-1/2 origin-bottom transition-transform duration-700"
              style={{
                transform: `translateX(-50%) rotate(${gaugeRotation}deg)`,
                width: "2px",
                height: "80px",
              }}
            >
              <div className="w-full h-full bg-foreground rounded-full" />
            </div>
          )}
        </div>

        <span className={`text-5xl font-bold font-serif ${cls.text}`}>
          {current}
        </span>
        <span className={`text-lg font-semibold mt-1 ${cls.text}`}>
          {cls.label}
        </span>
        <p className="text-xs text-muted-foreground mt-2">
          Updated{" "}
          {new Date(Number(data[0].timestamp) * 1000).toLocaleDateString()}
        </p>
      </div>

      {/* 30-day History Bar Chart */}
      <div className="lg:col-span-2 rounded-xl bg-card border border-border p-6">
        <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">
          30-Day History
        </p>
        <div className="flex items-end gap-[3px] h-48">
          {[...data].reverse().map((entry, i) => {
            const val = Number(entry.value);
            return (
              <div
                key={i}
                className="group relative flex-1 flex flex-col items-center justify-end h-full"
              >
                <div
                  className={`w-full rounded-t-sm ${getBarColor(val)} transition-all group-hover:opacity-80`}
                  style={{ height: `${val}%` }}
                />
                {/* Tooltip */}
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 hidden group-hover:flex flex-col items-center z-10">
                  <div className="bg-popover text-popover-foreground text-[10px] px-2 py-1 rounded shadow whitespace-nowrap">
                    {val} &middot;{" "}
                    {new Date(
                      Number(entry.timestamp) * 1000
                    ).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        {/* Legend */}
        <div className="flex flex-wrap gap-4 mt-4 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-500" /> Extreme Fear
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-orange-500" /> Fear
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-yellow-500" /> Neutral
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-lime-500" /> Greed
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-500" /> Extreme
            Greed
          </span>
        </div>
      </div>
    </div>
  );
}
