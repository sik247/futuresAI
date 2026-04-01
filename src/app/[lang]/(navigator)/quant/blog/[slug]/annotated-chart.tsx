"use client";

import React, { useRef, useEffect, useCallback, useState } from "react";

interface Props {
  src: string;
  alt: string;
  entry: number;
  stopLoss: number;
  takeProfit: number;
  direction: "LONG" | "SHORT" | "NEUTRAL";
  supportLevels: number[];
  resistanceLevels: number[];
}

function fmt(n: number): string {
  if (n >= 1000) return `$${n.toLocaleString()}`;
  if (n >= 10) return `$${n.toFixed(2)}`;
  if (n >= 0.01) return `$${n.toFixed(4)}`;
  return `$${n.toFixed(5)}`;
}

function drawLine(
  ctx: CanvasRenderingContext2D,
  w: number,
  y: number,
  color: string,
  dash: number[],
  label: string,
  lineWidth: number
) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.setLineDash(dash);
  ctx.globalAlpha = 0.85;
  ctx.beginPath();
  ctx.moveTo(0, y);
  ctx.lineTo(w, y);
  ctx.stroke();
  ctx.setLineDash([]);

  // Right-side price tag
  const fontSize = Math.max(11, Math.min(14, w / 60));
  ctx.font = `bold ${fontSize}px monospace`;
  const textW = ctx.measureText(label).width;
  const pad = 6;
  const tagW = textW + pad * 2;
  const tagH = fontSize + 8;
  const tagX = w - tagW - 4;
  const tagY = y - tagH / 2;

  ctx.globalAlpha = 0.92;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(tagX, tagY, tagW, tagH, 3);
  ctx.fill();

  // Arrow
  ctx.beginPath();
  ctx.moveTo(tagX - 4, y);
  ctx.lineTo(tagX, y - 4);
  ctx.lineTo(tagX, y + 4);
  ctx.closePath();
  ctx.fill();

  // Text
  ctx.globalAlpha = 1;
  ctx.fillStyle = "#FFFFFF";
  ctx.fillText(label, tagX + pad, tagY + fontSize + 1);
  ctx.restore();
}

export default function AnnotatedChart({
  src,
  alt,
  entry,
  stopLoss,
  takeProfit,
  direction,
  supportLevels,
  resistanceLevels,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const w = container.clientWidth;
      const h = (w / img.naturalWidth) * img.naturalHeight;
      canvas.width = w;
      canvas.height = h;
      ctx.drawImage(img, 0, 0, w, h);

      if (entry === 0) {
        setLoaded(true);
        return;
      }

      // Position lines at proportional chart heights
      const entryY = direction === "SHORT" ? h * 0.32 : h * 0.42;
      const slY = direction === "SHORT" ? h * 0.15 : h * 0.65;
      const tpY = direction === "SHORT" ? h * 0.68 : h * 0.15;

      // Draw risk zone (entry to SL — red tint)
      ctx.fillStyle = "rgba(239, 68, 68, 0.08)";
      ctx.fillRect(0, Math.min(entryY, slY), w, Math.abs(slY - entryY));

      // Draw reward zone (entry to TP — green tint)
      ctx.fillStyle = "rgba(34, 197, 94, 0.08)";
      ctx.fillRect(0, Math.min(entryY, tpY), w, Math.abs(tpY - entryY));

      // Draw support levels (thin dotted green lines)
      const supportPositions = [h * 0.72, h * 0.82, h * 0.90];
      supportLevels.slice(0, 3).forEach((level, i) => {
        if (supportPositions[i]) {
          drawLine(ctx, w, supportPositions[i], "#16A34A", [3, 5], `S${i + 1} ${fmt(level)}`, 1);
        }
      });

      // Draw resistance levels (thin dotted red lines)
      const resistPositions = [h * 0.25, h * 0.12, h * 0.05];
      resistanceLevels.slice(0, 3).forEach((level, i) => {
        if (resistPositions[i]) {
          drawLine(ctx, w, resistPositions[i], "#DC2626", [3, 5], `R${i + 1} ${fmt(level)}`, 1);
        }
      });

      // Draw main trading lines (thicker)
      drawLine(ctx, w, entryY, "#3B82F6", [10, 5], `Entry ${fmt(entry)}`, 2.5);
      drawLine(ctx, w, slY, "#EF4444", [8, 4], `Stop Loss ${fmt(stopLoss)}`, 2);
      drawLine(ctx, w, tpY, "#22C55E", [8, 4], `Take Profit ${fmt(takeProfit)}`, 2);

      setLoaded(true);
    };
    img.src = src;
  }, [src, entry, stopLoss, takeProfit, direction, supportLevels, resistanceLevels]);

  useEffect(() => {
    draw();
    const handleResize = () => draw();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [draw]);

  return (
    <div ref={containerRef} className="w-full">
      <canvas
        ref={canvasRef}
        className="w-full block rounded-2xl"
        style={{ display: loaded ? "block" : "none" }}
      />
      {!loaded && (
        <div className="w-full aspect-video bg-white/[0.03] rounded-2xl animate-pulse flex items-center justify-center">
          <span className="text-zinc-600 text-sm font-mono">Loading chart...</span>
        </div>
      )}
    </div>
  );
}
