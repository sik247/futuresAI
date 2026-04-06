"use client";

import React, { useRef, useEffect, useCallback } from "react";
import {
  createChart,
  CandlestickSeries,
  ColorType,
  LineStyle,
  type IChartApi,
  type ISeriesApi,
  type CandlestickData,
  type Time,
} from "lightweight-charts";
import { RectangleZone, type ZoneConfig } from "./chart-zone-primitive";

export type ChartLevel = {
  price: number;
  label: string;
  color: string;
  lineStyle?: "solid" | "dashed" | "dotted";
  lineWidth?: number;
};

export type ChartZone = ZoneConfig;

type Props = {
  pair: string;
  interval?: string;
  levels?: ChartLevel[];
  zones?: ChartZone[];
  height?: number;
};

async function fetchKlines(
  pair: string,
  interval: string
): Promise<CandlestickData<Time>[]> {
  const res = await fetch(
    `https://api.binance.com/api/v3/klines?symbol=${pair}&interval=${interval}&limit=200`
  );
  if (!res.ok) throw new Error("Failed to fetch klines");
  const raw = await res.json();
  return (raw as unknown[][]).map((k: unknown[]) => ({
    time: (Math.floor((k[0] as number) / 1000)) as Time,
    open: parseFloat(k[1] as string),
    high: parseFloat(k[2] as string),
    low: parseFloat(k[3] as string),
    close: parseFloat(k[4] as string),
  }));
}

const LINE_STYLE_MAP = {
  solid: LineStyle.Solid,
  dashed: LineStyle.Dashed,
  dotted: LineStyle.Dotted,
};

export default function TradingChart({
  pair,
  interval = "4h",
  levels = [],
  zones = [],
  height = 600,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);

  const initChart = useCallback(async () => {
    if (!containerRef.current) return;

    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
    }

    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height,
      layout: {
        background: { type: ColorType.Solid, color: "#0a0a0f" },
        textColor: "#9ca3af",
        fontSize: 11,
        fontFamily: "'SF Mono', Consolas, 'Courier New', monospace",
      },
      grid: {
        vertLines: { color: "rgba(255,255,255,0.03)" },
        horzLines: { color: "rgba(255,255,255,0.03)" },
      },
      crosshair: {
        vertLine: { color: "rgba(255,255,255,0.15)", width: 1, style: LineStyle.Dashed, labelBackgroundColor: "#1a1a2e" },
        horzLine: { color: "rgba(255,255,255,0.15)", width: 1, style: LineStyle.Dashed, labelBackgroundColor: "#1a1a2e" },
      },
      rightPriceScale: {
        borderColor: "rgba(255,255,255,0.06)",
        scaleMargins: { top: 0.08, bottom: 0.08 },
        entireTextOnly: true,
      },
      timeScale: {
        borderColor: "rgba(255,255,255,0.06)",
        timeVisible: true,
        secondsVisible: false,
      },
    });

    chartRef.current = chart;

    const series = chart.addSeries(CandlestickSeries, {
      upColor: "#26a69a",
      downColor: "#ef5350",
      borderUpColor: "#26a69a",
      borderDownColor: "#ef5350",
      wickUpColor: "#26a69a",
      wickDownColor: "#ef5350",
    });
    seriesRef.current = series;

    try {
      const data = await fetchKlines(pair, interval);
      series.setData(data);

      // Draw colored zones (behind candlesticks)
      zones.forEach((zone) => {
        const primitive = new RectangleZone(zone);
        series.attachPrimitive(primitive);
      });

      // Sort levels by price (desc) to minimize Y-axis label overlap
      const sortedLevels = [...levels].sort((a, b) => b.price - a.price);

      // Only show axis labels for strategy lines (ENTRY/SL/TP) to avoid crowding
      const strategyLabels = new Set(["ENTRY", "STOP LOSS", "TAKE PROFIT"]);

      sortedLevels.forEach((level) => {
        series.createPriceLine({
          price: level.price,
          color: level.color,
          lineWidth: (level.lineWidth || 2) as 1 | 2 | 3 | 4,
          lineStyle: LINE_STYLE_MAP[level.lineStyle || "solid"],
          axisLabelVisible: strategyLabels.has(level.label),
          title: level.label,
          lineVisible: true,
        });
      });

      chart.timeScale().fitContent();
    } catch (err) {
      console.error("Chart data error:", err);
    }

    const handleResize = () => {
      if (containerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: containerRef.current.clientWidth,
        });
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [pair, interval, levels, zones, height]);

  useEffect(() => {
    const cleanup = initChart();
    return () => {
      cleanup?.then((fn) => fn?.());
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, [initChart]);

  return (
    <div
      ref={containerRef}
      className="w-full rounded-lg overflow-hidden border border-white/[0.06]"
      style={{ height }}
    />
  );
}
