"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileUploadModule } from "@/lib/modules/file-upload";
import { CloudArrowUpIcon } from "@heroicons/react/24/outline";
import { toast } from "@/components/ui/use-toast";
import { Dictionary } from "@/i18n";
import type { ChartAnalysisResult, ChartLine } from "@/lib/services/chart-analysis/chart-analysis.service";

type Props = {
  lang: string;
  translations: Dictionary;
};

const ANALYSIS_COST = 5;

const ChartAnalyzer: React.FC<Props> = ({ lang, translations }) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<ChartAnalysisResult | null>(null);
  const [analysisId, setAnalysisId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  // Canvas refs for drawing lines
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [imageLoaded, setImageLoaded] = useState(false);

  // Upload file (shared logic)
  const uploadFile = async (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      toast({ variant: "destructive", title: "Error", description: "File must be less than 10MB" });
      return;
    }
    if (!file.type.startsWith("image/")) {
      toast({ variant: "destructive", title: "Error", description: "Please upload an image file" });
      return;
    }

    setUploading(true);
    setAnalysis(null);
    setAnalysisId(null);
    try {
      const fileUploader = new FileUploadModule();
      const data = await fileUploader.upload(file);
      const url =
        "https://nkkuehjtdudabogzwibw.supabase.co/storage/v1/object/public/CryptoX/" + data.path;
      setImageUrl(url);
    } catch {
      toast({ variant: "destructive", title: "Upload failed", description: "Please try again." });
    } finally {
      setUploading(false);
    }
  };

  // Drag and drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) uploadFile(file);
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
  };

  // Load image for canvas
  useEffect(() => {
    if (!imageUrl) return;
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

  // Draw canvas with image + analysis lines
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    const img = imgRef.current;
    if (!canvas || !ctx || !img || dimensions.width === 0) return;

    canvas.width = dimensions.width;
    canvas.height = dimensions.height;

    // Draw chart image
    ctx.drawImage(img, 0, 0, dimensions.width, dimensions.height);

    // Draw analysis lines if available
    if (analysis?.lines) {
      analysis.lines.forEach((line) => {
        const y = (line.yPercent / 100) * dimensions.height;
        drawAnalysisLine(ctx, y, line, dimensions.width);
      });
    }
  }, [dimensions, analysis]);

  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  const drawAnalysisLine = (
    ctx: CanvasRenderingContext2D,
    y: number,
    line: ChartLine,
    width: number
  ) => {
    // Line
    ctx.strokeStyle = line.color;
    ctx.lineWidth = 2;
    ctx.setLineDash(line.dashed ? [8, 4] : []);
    ctx.globalAlpha = 0.85;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
    ctx.setLineDash([]);

    // Label
    ctx.font = "bold 11px Inter, system-ui, sans-serif";
    const textWidth = ctx.measureText(line.label).width;
    const padding = 6;
    const labelHeight = 20;
    const labelX = 8;
    const labelY = y - labelHeight - 3;

    ctx.fillStyle = line.color;
    ctx.globalAlpha = 0.9;
    ctx.beginPath();
    ctx.roundRect(labelX, labelY, textWidth + padding * 2, labelHeight, 3);
    ctx.fill();
    ctx.globalAlpha = 1;

    ctx.fillStyle = "#ffffff";
    ctx.fillText(line.label, labelX + padding, labelY + 14);
  };

  // Run AI analysis
  const runAnalysis = async () => {
    if (!imageUrl) return;
    setAnalyzing(true);
    try {
      const res = await fetch("/api/chart-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Analysis failed");
      }

      const data = await res.json();
      setAnalysis(data.analysis);
      setAnalysisId(data.id);

      toast({
        title: translations.chartAnalysis_complete || "Analysis Complete",
        description: `$${ANALYSIS_COST} ${translations.chartAnalysis_pendingCharge || "will be charged upon approval"}`,
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Analysis Failed",
        description: err instanceof Error ? err.message : "Please try again.",
      });
    } finally {
      setAnalyzing(false);
    }
  };

  const trendColors: Record<string, string> = {
    BULLISH: "text-green-400",
    BEARISH: "text-red-400",
    NEUTRAL: "text-yellow-400",
    CONSOLIDATING: "text-blue-400",
  };

  const signalColors: Record<string, string> = {
    BUY: "text-green-400 bg-green-500/10 border-green-500/30",
    SELL: "text-red-400 bg-red-500/10 border-red-500/30",
    NEUTRAL: "text-zinc-400 bg-zinc-500/10 border-zinc-500/30",
  };

  return (
    <div className="flex flex-col gap-8 py-12 w-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="font-bold text-4xl max-md:text-2xl text-foreground">
            {translations.chartAnalysis_title || "AI Chart Analysis"}
          </h1>
          <p className="text-lg max-md:text-sm text-muted-foreground">
            {translations.chartAnalysis_subtitle || "Drop your chart and get instant quant analysis with key levels"}
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500/10 border border-amber-500/30">
          <span className="text-amber-400 text-sm font-semibold">
            ${ANALYSIS_COST}
          </span>
          <span className="text-amber-400/70 text-xs">
            / {translations.chartAnalysis_perAnalysis || "per analysis"}
          </span>
        </div>
      </div>

      {/* Upload Area / Chart Canvas */}
      <Card className="p-0 bg-zinc-950/50 backdrop-blur-sm border-white/10 overflow-hidden">
        {!imageUrl ? (
          <label
            htmlFor="chart-analysis-upload"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`flex flex-col items-center justify-center gap-4 p-20 cursor-pointer transition-all ${
              dragOver
                ? "bg-blue-500/10 border-blue-500/40"
                : "hover:bg-white/[0.02]"
            }`}
          >
            <input
              type="file"
              id="chart-analysis-upload"
              className="hidden"
              accept="image/*"
              onChange={handleFileInput}
            />
            <div className="w-20 h-20 rounded-2xl bg-zinc-800/50 border border-white/10 flex items-center justify-center">
              <CloudArrowUpIcon className="w-10 h-10 text-zinc-500" />
            </div>
            <span className="text-zinc-300 text-lg font-medium">
              {uploading
                ? "Uploading..."
                : translations.chartAnalysis_dropChart || "Drop your chart here or click to upload"}
            </span>
            <span className="text-zinc-600 text-sm">
              PNG, JPG up to 10MB
            </span>
          </label>
        ) : (
          <div className="relative">
            <div ref={containerRef} className="w-full">
              {imageLoaded ? (
                <canvas
                  ref={canvasRef}
                  width={dimensions.width}
                  height={dimensions.height}
                  className="w-full block"
                  style={{ height: dimensions.height > 0 ? dimensions.height : "auto" }}
                />
              ) : (
                <div className="w-full aspect-video flex items-center justify-center bg-zinc-900/50">
                  <div className="animate-pulse text-zinc-500">Loading chart...</div>
                </div>
              )}
            </div>

            {/* Overlay buttons */}
            <div className="absolute top-4 right-4 flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setImageUrl(null);
                  setAnalysis(null);
                  setImageLoaded(false);
                  setAnalysisId(null);
                }}
                className="bg-zinc-950/80 border-white/20 text-zinc-300 hover:bg-zinc-900"
              >
                {translations.chartAnalysis_replace || "Replace"}
              </Button>
              {!analysis && (
                <Button
                  size="sm"
                  onClick={runAnalysis}
                  disabled={analyzing}
                  className="bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20"
                >
                  {analyzing ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      {translations.chartAnalysis_analyzing || "Analyzing..."}
                    </span>
                  ) : (
                    `${translations.chartAnalysis_analyze || "Analyze"} — $${ANALYSIS_COST}`
                  )}
                </Button>
              )}
            </div>

            {/* Analyzing overlay */}
            {analyzing && (
              <div className="absolute inset-0 bg-zinc-950/60 backdrop-blur-sm flex flex-col items-center justify-center gap-4">
                <div className="relative w-16 h-16">
                  <div className="absolute inset-0 rounded-full border-2 border-blue-500/30 animate-ping" />
                  <div className="absolute inset-2 rounded-full border-2 border-t-blue-500 border-r-transparent border-b-transparent border-l-transparent animate-spin" />
                  <div className="absolute inset-4 rounded-full bg-blue-500/20 flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                </div>
                <p className="text-zinc-300 font-medium">
                  {translations.chartAnalysis_aiProcessing || "AI is analyzing your chart..."}
                </p>
                <p className="text-zinc-500 text-sm">
                  {translations.chartAnalysis_takeMoment || "This may take a moment"}
                </p>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Analysis Results */}
      {analysis && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Summary + Trend */}
          <Card className="lg:col-span-2 p-6 bg-zinc-950/50 backdrop-blur-sm border-white/10">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-foreground">
                  {translations.chartAnalysis_summary || "Analysis Summary"}
                </h2>
                <div className="flex items-center gap-3">
                  <span className={`text-sm font-bold ${trendColors[analysis.trend] || "text-zinc-400"}`}>
                    {analysis.trend}
                  </span>
                  <span className="text-xs text-zinc-500">|</span>
                  <span className="text-sm text-zinc-400">
                    {translations.chartAnalysis_confidence || "Confidence"}: <span className="text-foreground font-mono">{analysis.confidence}%</span>
                  </span>
                </div>
              </div>
              <p className="text-zinc-300 leading-relaxed">{analysis.summary}</p>

              {/* Patterns */}
              {analysis.patterns.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {analysis.patterns.map((p, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 rounded-full text-xs font-medium bg-purple-500/10 border border-purple-500/30 text-purple-300"
                    >
                      {p}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </Card>

          {/* Risk Score */}
          <Card className="p-6 bg-zinc-950/50 backdrop-blur-sm border-white/10">
            <div className="flex flex-col items-center gap-4">
              <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">
                {translations.chartAnalysis_riskScore || "Risk Score"}
              </h3>
              <div className="relative w-24 h-24">
                <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="42" fill="none" stroke="#27272a" strokeWidth="8" />
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    fill="none"
                    stroke={analysis.riskScore <= 3 ? "#22c55e" : analysis.riskScore <= 6 ? "#f59e0b" : "#ef4444"}
                    strokeWidth="8"
                    strokeDasharray={`${(analysis.riskScore / 10) * 264} 264`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-bold text-foreground">{analysis.riskScore}</span>
                  <span className="text-xs text-zinc-500">/10</span>
                </div>
              </div>
              <span className="text-xs text-zinc-500">
                {analysis.riskScore <= 3 ? "Low Risk" : analysis.riskScore <= 6 ? "Medium Risk" : "High Risk"}
              </span>
            </div>
          </Card>

          {/* Trade Setup */}
          <Card className="p-6 bg-zinc-950/50 backdrop-blur-sm border-white/10">
            <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">
              {translations.chartAnalysis_tradeSetup || "Trade Setup"}
            </h3>
            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <span className="text-zinc-500 text-sm">Direction</span>
                <span className={`font-bold text-sm ${
                  analysis.tradeSetup.direction === "LONG" ? "text-green-400" :
                  analysis.tradeSetup.direction === "SHORT" ? "text-red-400" : "text-zinc-400"
                }`}>
                  {analysis.tradeSetup.direction}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-blue-400 text-sm">Entry</span>
                <span className="text-foreground font-mono text-sm">${analysis.tradeSetup.entry.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-red-400 text-sm">Stop Loss</span>
                <span className="text-foreground font-mono text-sm">${analysis.tradeSetup.stopLoss.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-green-400 text-sm">Take Profit</span>
                <span className="text-foreground font-mono text-sm">${analysis.tradeSetup.takeProfit.toLocaleString()}</span>
              </div>
              <div className="h-px bg-white/10 my-1" />
              <div className="flex justify-between items-center">
                <span className="text-zinc-500 text-sm">R:R</span>
                <span className="text-foreground font-mono font-bold text-sm">{analysis.tradeSetup.riskReward}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-500 text-sm">Confidence</span>
                <span className="text-foreground font-mono text-sm">{analysis.tradeSetup.confidence}%</span>
              </div>
            </div>
          </Card>

          {/* Indicators */}
          <Card className="p-6 bg-zinc-950/50 backdrop-blur-sm border-white/10">
            <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">
              {translations.chartAnalysis_indicators || "Technical Indicators"}
            </h3>
            <div className="flex flex-col gap-3">
              {analysis.indicators.map((ind, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-foreground text-sm font-medium">{ind.name}</span>
                    <span className="text-zinc-500 text-xs">{ind.value}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-xs font-semibold border ${signalColors[ind.signal]}`}>
                    {ind.signal}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          {/* Key Levels */}
          <Card className="p-6 bg-zinc-950/50 backdrop-blur-sm border-white/10">
            <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">
              {translations.chartAnalysis_keyLevels || "Key Price Levels"}
            </h3>
            <div className="flex flex-col gap-4">
              <div>
                <span className="text-green-400 text-xs font-semibold uppercase tracking-wider">Support</span>
                <div className="flex flex-wrap gap-2 mt-2">
                  {analysis.supportLevels.map((level, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 rounded bg-green-500/10 border border-green-500/30 text-green-300 font-mono text-sm"
                    >
                      ${level.toLocaleString()}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <span className="text-red-400 text-xs font-semibold uppercase tracking-wider">Resistance</span>
                <div className="flex flex-wrap gap-2 mt-2">
                  {analysis.resistanceLevels.map((level, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 rounded bg-red-500/10 border border-red-500/30 text-red-300 font-mono text-sm"
                    >
                      ${level.toLocaleString()}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {/* Billing Notice */}
          <Card className="lg:col-span-3 p-4 bg-amber-500/5 border-amber-500/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center">
                  <span className="text-amber-400 text-sm">$</span>
                </div>
                <div>
                  <p className="text-amber-300 text-sm font-medium">
                    {translations.chartAnalysis_chargeNotice || `$${ANALYSIS_COST}.00 will be charged to your account once approved`}
                  </p>
                  <p className="text-amber-400/50 text-xs">
                    {translations.chartAnalysis_paymentMethod || "Payment: USD or USDT"}
                  </p>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-amber-500/10 border border-amber-500/30 text-amber-400">
                {translations.chartAnalysis_pending || "PENDING"}
              </span>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ChartAnalyzer;
