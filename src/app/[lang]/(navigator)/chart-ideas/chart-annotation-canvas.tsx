"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";

type LineType = "entry" | "stopLoss" | "takeProfit";

type AnnotationLine = {
  type: LineType;
  y: number; // percentage from top (0-100)
};

type TChartAnnotationCanvas = {
  imageUrl: string;
  lines: AnnotationLine[];
  activeTool: LineType | null;
  onLinePlace: (type: LineType, yPercent: number) => void;
  entryLabel?: string;
  stopLossLabel?: string;
  takeProfitLabel?: string;
};

const LINE_COLORS: Record<LineType, string> = {
  entry: "#3b82f6",
  stopLoss: "#ef4444",
  takeProfit: "#22c55e",
};

const LINE_LABELS: Record<LineType, string> = {
  entry: "Entry",
  stopLoss: "Stop Loss",
  takeProfit: "Take Profit",
};

const ChartAnnotationCanvas: React.FC<TChartAnnotationCanvas> = ({
  imageUrl,
  lines,
  activeTool,
  onLinePlace,
  entryLabel = "Entry",
  stopLossLabel = "Stop Loss",
  takeProfitLabel = "Take Profit",
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [imageLoaded, setImageLoaded] = useState(false);
  const [hoverY, setHoverY] = useState<number | null>(null);

  const labels: Record<LineType, string> = {
    entry: entryLabel,
    stopLoss: stopLossLabel,
    takeProfit: takeProfitLabel,
  };

  // Load image
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      imgRef.current = img;
      setImageLoaded(true);
    };
    img.src = imageUrl;
  }, [imageUrl]);

  // Handle resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current && imgRef.current) {
        const containerWidth = containerRef.current.clientWidth;
        const aspectRatio = imgRef.current.naturalHeight / imgRef.current.naturalWidth;
        const height = containerWidth * aspectRatio;
        setDimensions({ width: containerWidth, height });
      }
    };

    if (imageLoaded) {
      updateDimensions();
      window.addEventListener("resize", updateDimensions);
      return () => window.removeEventListener("resize", updateDimensions);
    }
  }, [imageLoaded]);

  // Draw canvas
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    const img = imgRef.current;

    if (!canvas || !ctx || !img || dimensions.width === 0) return;

    canvas.width = dimensions.width;
    canvas.height = dimensions.height;

    // Draw image
    ctx.drawImage(img, 0, 0, dimensions.width, dimensions.height);

    // Draw existing lines
    lines.forEach((line) => {
      const y = (line.y / 100) * dimensions.height;
      drawLine(ctx, y, line.type, labels[line.type], dimensions.width);
    });

    // Draw hover preview
    if (hoverY !== null && activeTool) {
      const color = LINE_COLORS[activeTool];
      ctx.setLineDash([8, 4]);
      ctx.strokeStyle = color;
      ctx.globalAlpha = 0.5;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, hoverY);
      ctx.lineTo(dimensions.width, hoverY);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;
    }
  }, [dimensions, lines, hoverY, activeTool, labels]);

  useEffect(() => {
    draw();
  }, [draw]);

  const drawLine = (
    ctx: CanvasRenderingContext2D,
    y: number,
    type: LineType,
    label: string,
    width: number
  ) => {
    const color = LINE_COLORS[type];

    // Draw line
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.setLineDash(type === "entry" ? [] : [6, 3]);
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw label background
    const labelText = label;
    ctx.font = "bold 12px Inter, system-ui, sans-serif";
    const textWidth = ctx.measureText(labelText).width;
    const padding = 8;
    const labelHeight = 22;
    const labelX = width - textWidth - padding * 2 - 8;
    const labelY = y - labelHeight - 4;

    ctx.fillStyle = color;
    ctx.globalAlpha = 0.9;
    ctx.beginPath();
    ctx.roundRect(labelX, labelY, textWidth + padding * 2, labelHeight, 4);
    ctx.fill();
    ctx.globalAlpha = 1;

    // Draw label text
    ctx.fillStyle = "#ffffff";
    ctx.fillText(labelText, labelX + padding, labelY + 15);
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!activeTool || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const yPercent = (y / dimensions.height) * 100;

    onLinePlace(activeTool, yPercent);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!activeTool || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const y = e.clientY - rect.top;
    setHoverY(y);
  };

  const handleMouseLeave = () => {
    setHoverY(null);
  };

  if (!imageLoaded) {
    return (
      <div className="w-full aspect-video rounded-lg bg-zinc-900/50 border border-white/10 flex items-center justify-center">
        <div className="animate-pulse text-zinc-500">Loading chart...</div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="w-full relative rounded-lg overflow-hidden border border-white/10">
      <canvas
        ref={canvasRef}
        width={dimensions.width}
        height={dimensions.height}
        onClick={handleCanvasClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className={`w-full block ${activeTool ? "cursor-crosshair" : "cursor-default"}`}
        style={{ height: dimensions.height > 0 ? dimensions.height : "auto" }}
      />
    </div>
  );
};

export default ChartAnnotationCanvas;
export type { LineType, AnnotationLine };
