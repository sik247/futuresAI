"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileUploadModule } from "@/lib/modules/file-upload";
import { SUPABASE_STORAGE_URL } from "@/lib/utils/get-image-url";
import { CloudArrowUpIcon, LockClosedIcon, ArrowDownTrayIcon } from "@heroicons/react/24/outline";
import { toast } from "@/components/ui/use-toast";
import { Dictionary } from "@/i18n";
import { ClipboardDocumentIcon, ShareIcon } from "@heroicons/react/24/outline";
import type { ChartAnalysisResult, ChartLine } from "@/lib/services/chart-analysis/chart-analysis.service";

/* ------------------------------------------------------------------ */
/*  Post generator + Grok-style AI commentary                          */
/* ------------------------------------------------------------------ */
function generateSharePost(pair: string, a: ChartAnalysisResult): string {
  const trendEmoji =
    a.trend === "BULLISH" ? "\u{1F7E2}" :
    a.trend === "BEARISH" ? "\u{1F534}" :
    a.trend === "CONSOLIDATING" ? "\u{1F7E1}" : "\u26AA";
  const dir = a.tradeSetup.direction === "LONG" ? "\u{1F4C8}" : a.tradeSetup.direction === "SHORT" ? "\u{1F4C9}" : "\u2194\uFE0F";
  const pairFmt = pair.replace("USDT", "/USDT");

  const lines = [
    `${trendEmoji} $${pair.replace("USDT", "")} AI Analysis \u2014 ${a.trend}`,
    ``,
    `${dir} Direction: ${a.tradeSetup.direction}`,
    `\u{1F3AF} Entry: $${a.tradeSetup.entry?.toLocaleString()}`,
    `\u{1F6D1} Stop Loss: $${a.tradeSetup.stopLoss?.toLocaleString()}`,
    `\u2705 Take Profit: $${a.tradeSetup.takeProfit?.toLocaleString()}`,
    `\u{1F4CA} R:R ${a.tradeSetup.riskReward} | Confidence: ${a.confidence}%`,
    ``,
    `Key Levels:`,
    `\u{1F7E2} Support: ${a.supportLevels.slice(0, 2).map(l => `$${l?.toLocaleString()}`).join(" / ")}`,
    `\u{1F534} Resistance: ${a.resistanceLevels.slice(0, 2).map(l => `$${l?.toLocaleString()}`).join(" / ")}`,
  ];

  if (a.patterns.length > 0) {
    lines.push(`\u{1F50D} Patterns: ${a.patterns.slice(0, 3).join(", ")}`);
  }

  lines.push(``);
  lines.push(`Analyzed by CryptoX AI \u2014 Free at cryptox.co`);
  lines.push(`#${pair.replace("USDT", "")} #Crypto #Trading`);

  return lines.join("\n");
}

function generateAICommentary(pair: string, a: ChartAnalysisResult): {
  verdict: string;
  details: string[];
  sentiment: "bullish" | "bearish" | "neutral";
  conviction: "high" | "medium" | "low";
} {
  const coin = pair.replace("USDT", "");
  const rr = parseFloat(a.tradeSetup.riskReward?.replace("1:", "") || "0");
  const buySignals = a.indicators.filter(i => i.signal === "BUY").length;
  const sellSignals = a.indicators.filter(i => i.signal === "SELL").length;

  // Determine conviction
  const conviction =
    a.confidence >= 70 && rr >= 2 ? "high" :
    a.confidence >= 50 ? "medium" : "low";

  // Determine sentiment
  const sentiment =
    a.trend === "BULLISH" || a.trend === "CONSOLIDATING" && buySignals > sellSignals ? "bullish" :
    a.trend === "BEARISH" ? "bearish" : "neutral";

  // Generate verdict
  let verdict = "";
  if (sentiment === "bullish" && conviction === "high") {
    verdict = `Strong setup on ${coin}. ${buySignals} of ${a.indicators.length} indicators flashing buy with ${a.confidence}% AI confidence. The R:R at ${a.tradeSetup.riskReward} makes this worth watching.`;
  } else if (sentiment === "bullish") {
    verdict = `${coin} is showing bullish structure but conviction isn't overwhelming at ${a.confidence}%. ${buySignals} buy signals out of ${a.indicators.length} indicators. Proceed with caution.`;
  } else if (sentiment === "bearish" && conviction === "high") {
    verdict = `${coin} looks weak. ${sellSignals} sell signals firing with ${a.confidence}% confidence. If you're long, the $${a.tradeSetup.stopLoss?.toLocaleString()} stop loss level is critical.`;
  } else if (sentiment === "bearish") {
    verdict = `Bearish pressure building on ${coin} but it's not decisive yet. ${a.confidence}% confidence with mixed signals across indicators.`;
  } else {
    verdict = `${coin} is in no-man's land. ${a.confidence}% confidence with indicators split ${buySignals}/${sellSignals} buy/sell. Wait for a clearer setup or trade the range.`;
  }

  // Generate detail bullets
  const details: string[] = [];

  if (a.quantAnalysis?.rsiValue) {
    const rsi = a.quantAnalysis.rsiValue;
    if (rsi > 70) details.push(`RSI at ${rsi} \u2014 overbought territory. Pullback risk is elevated.`);
    else if (rsi < 30) details.push(`RSI at ${rsi} \u2014 oversold. Watch for a bounce off support.`);
    else if (rsi > 55) details.push(`RSI at ${rsi} \u2014 healthy bullish momentum, room to run.`);
    else if (rsi < 45) details.push(`RSI at ${rsi} \u2014 momentum favors bears, not oversold yet.`);
    else details.push(`RSI at ${rsi} \u2014 right in the middle. Waiting for direction.`);
  }

  if (rr >= 3) details.push(`${a.tradeSetup.riskReward} risk-reward is excellent. High-quality setup if entry hits.`);
  else if (rr >= 2) details.push(`${a.tradeSetup.riskReward} risk-reward is solid. Favorable for the trade.`);
  else if (rr > 0) details.push(`${a.tradeSetup.riskReward} risk-reward is tight. Size your position accordingly.`);

  if (a.liveContext?.sentiment === "BULLISH") details.push(`News sentiment is bullish \u2014 market narrative supports the trade.`);
  else if (a.liveContext?.sentiment === "BEARISH") details.push(`News sentiment is bearish \u2014 headwinds from market narrative.`);

  if (a.liveContext?.orderBookBias === "BUY_PRESSURE") details.push(`Order book shows buy pressure \u2014 bids stacking up.`);
  else if (a.liveContext?.orderBookBias === "SELL_PRESSURE") details.push(`Order book shows sell pressure \u2014 walls above.`);

  if (a.patterns.length > 0) {
    details.push(`${a.patterns[0]} pattern detected \u2014 ${
      a.trend === "BULLISH" ? "historically a continuation signal" :
      a.trend === "BEARISH" ? "watch for breakdown confirmation" :
      "could break either way"
    }.`);
  }

  if (a.riskScore >= 7) details.push(`Risk score ${a.riskScore}/10 \u2014 high risk. Don't oversize.`);
  else if (a.riskScore <= 3) details.push(`Risk score ${a.riskScore}/10 \u2014 relatively low risk setup.`);

  return { verdict, details: details.slice(0, 4), sentiment, conviction };
}

type Props = {
  lang: string;
  translations: Dictionary;
};

const POPULAR_PAIRS = [
  "BTCUSDT", "ETHUSDT", "SOLUSDT", "XRPUSDT", "BNBUSDT",
  "DOGEUSDT", "ADAUSDT", "AVAXUSDT", "DOTUSDT", "LINKUSDT",
];

const COIN_LOGOS: Record<string, string> = {
  BTC: "https://assets.coingecko.com/coins/images/1/small/bitcoin.png",
  ETH: "https://assets.coingecko.com/coins/images/279/small/ethereum.png",
  SOL: "https://assets.coingecko.com/coins/images/4128/small/solana.png",
  XRP: "https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png",
  BNB: "https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png",
  DOGE: "https://assets.coingecko.com/coins/images/5/small/dogecoin.png",
  ADA: "https://assets.coingecko.com/coins/images/975/small/cardano.png",
  AVAX: "https://assets.coingecko.com/coins/images/12559/small/Avalanche_Circle_RedWhite_Trans.png",
  DOT: "https://assets.coingecko.com/coins/images/12171/small/polkadot.png",
  LINK: "https://assets.coingecko.com/coins/images/877/small/chainlink-new-logo.png",
  MATIC: "https://assets.coingecko.com/coins/images/4713/small/polygon.png",
  UNI: "https://assets.coingecko.com/coins/images/12504/small/uni.jpg",
  PEPE: "https://assets.coingecko.com/coins/images/29850/small/pepe-token.jpeg",
  SUI: "https://assets.coingecko.com/coins/images/26375/small/sui-ocean-square.png",
  WIF: "https://assets.coingecko.com/coins/images/33566/small/dogwifhat.jpg",
};

const ANALYSIS_STAGES = [
  "Searching market news...",
  "Fetching live prices...",
  "Analyzing order book...",
  "Running AI chart analysis...",
  "Drawing key levels...",
];

const ChartAnalyzer: React.FC<Props> = ({ lang, translations }) => {
  const { data: session, status } = useSession();
  const isAdmin = (session?.user as any)?.role === "ADMIN";
  const isLoggedIn = status === "authenticated";

  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<ChartAnalysisResult | null>(null);
  const [analysisId, setAnalysisId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [pair, setPair] = useState("BTCUSDT");
  const [customPair, setCustomPair] = useState("");
  const [copied, setCopied] = useState(false);

  // Analysis stage animation
  const [stageIndex, setStageIndex] = useState(0);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [imageLoaded, setImageLoaded] = useState(false);

  // Cycle analysis stages
  useEffect(() => {
    if (!analyzing) { setStageIndex(0); return; }
    const interval = setInterval(() => {
      setStageIndex((i) => (i + 1) % ANALYSIS_STAGES.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [analyzing]);

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
      const url = SUPABASE_STORAGE_URL + data.path;
      setImageUrl(url);
    } catch (err) {
      console.error("Chart upload error:", err);
      toast({ variant: "destructive", title: "Upload failed", description: err instanceof Error ? err.message : "Please try again." });
    } finally {
      setUploading(false);
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setDragOver(true); }, []);
  const handleDragLeave = useCallback((e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setDragOver(false); }, []);
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) uploadFile(file);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uploading]);
  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0]; if (file) uploadFile(file); };

  useEffect(() => {
    if (!imageUrl) return;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => { imgRef.current = img; setImageLoaded(true); };
    img.src = imageUrl;
  }, [imageUrl]);

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current && imgRef.current) {
        const containerWidth = containerRef.current.clientWidth;
        const aspectRatio = imgRef.current.naturalHeight / imgRef.current.naturalWidth;
        setDimensions({ width: containerWidth, height: containerWidth * aspectRatio });
      }
    };
    if (imageLoaded) {
      updateDimensions();
      window.addEventListener("resize", updateDimensions);
      return () => window.removeEventListener("resize", updateDimensions);
    }
  }, [imageLoaded]);

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    const img = imgRef.current;
    if (!canvas || !ctx || !img || dimensions.width === 0) return;
    canvas.width = dimensions.width;
    canvas.height = dimensions.height;
    ctx.drawImage(img, 0, 0, dimensions.width, dimensions.height);

    if (!analysis?.lines) return;

    // Draw clean lines only — no header overlay, no centered text
    analysis.lines.forEach((line) => {
      const y = (line.yPercent / 100) * dimensions.height;
      drawAnalysisLine(ctx, y, line, dimensions.width);
    });
  }, [dimensions, analysis]);

  useEffect(() => { drawCanvas(); }, [drawCanvas]);

  const drawAnalysisLine = (
    ctx: CanvasRenderingContext2D,
    y: number,
    line: ChartLine,
    width: number
  ) => {
    const isEntry = line.type === "entry";
    const isSL = line.type === "stopLoss";
    const isTP = line.type === "takeProfit";

    // --- Clean single line (no zone fill, no glow) ---
    ctx.strokeStyle = line.color;
    ctx.lineWidth = isEntry ? 2.5 : 2;
    ctx.setLineDash(line.dashed ? [8, 4] : isSL ? [5, 3] : isTP ? [5, 3] : []);
    ctx.globalAlpha = 1;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
    ctx.setLineDash([]);

    // --- Right-side price tag only (TradingView-style, clean) ---
    const priceMatch = line.label.match(/\$[\d,.]+/)?.[0] || "";
    if (priceMatch) {
      ctx.font = "bold 11px monospace";
      const priceWidth = ctx.measureText(priceMatch).width;
      const pad = 6;
      const tagW = priceWidth + pad * 2;
      const tagH = 20;
      const tagX = width - tagW - 4;
      const tagY = y - tagH / 2;

      // Tag background
      ctx.fillStyle = line.color;
      ctx.globalAlpha = 0.95;
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

      // Price text
      ctx.globalAlpha = 1;
      ctx.fillStyle = "#ffffff";
      ctx.fillText(priceMatch, tagX + pad, tagY + 14);
    }
  };

  const selectedPair = customPair || pair;

  const runAnalysis = async () => {
    if (!imageUrl) return;
    setAnalyzing(true);
    try {
      const res = await fetch("/api/chart-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl, pair: selectedPair, lang }),
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
        description: "Your AI chart analysis is ready.",
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

  const saveSnapshot = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `${selectedPair}-analysis.png`;
    a.click();
  };

  const trendColors: Record<string, string> = {
    BULLISH: "text-green-400", BEARISH: "text-red-400",
    NEUTRAL: "text-yellow-400", CONSOLIDATING: "text-blue-400",
  };
  const signalColors: Record<string, string> = {
    BUY: "text-green-400 bg-green-500/10 border-green-500/30",
    SELL: "text-red-400 bg-red-500/10 border-red-500/30",
    NEUTRAL: "text-zinc-400 bg-zinc-500/10 border-zinc-500/30",
  };
  const sentimentColors: Record<string, string> = {
    BULLISH: "text-green-400 bg-green-500/10 border-green-500/30",
    BEARISH: "text-red-400 bg-red-500/10 border-red-500/30",
    MIXED: "text-yellow-400 bg-yellow-500/10 border-yellow-500/30",
    NEUTRAL: "text-zinc-400 bg-zinc-500/10 border-zinc-500/30",
  };

  return (
    <div className="flex flex-col gap-6 py-8 w-full">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="font-bold text-4xl max-md:text-2xl text-foreground">
            {translations.chartAnalysis_title || "AI Chart Analysis"}
          </h1>
          <p className="text-lg max-md:text-sm text-muted-foreground">
            {translations.chartAnalysis_subtitle || "Drop your chart and get instant quant analysis with live market data"}
          </p>
        </div>
        {isAdmin ? (
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-emerald-400 text-sm font-semibold">Admin Access</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500/10 border border-amber-500/30">
            <LockClosedIcon className="w-4 h-4 text-amber-400" />
            <span className="text-amber-400 text-sm font-semibold">
              {lang === "ko" ? "구독자 전용" : "Subscribers Only"}
            </span>
          </div>
        )}
      </div>

      {/* How-To Guide (Collapsible) */}
      {!analysis && (
        <details className="group rounded-2xl bg-white/[0.02] border border-white/[0.06] overflow-hidden">
          <summary className="flex items-center justify-between px-6 py-4 cursor-pointer hover:bg-white/[0.02] transition-colors">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 text-sm font-bold">?</span>
              <span className="text-sm font-semibold text-zinc-200">
                {lang === "ko" ? "차트 분석 사용법" : "How to Use Chart Analysis"}
              </span>
            </div>
            <svg className="w-4 h-4 text-zinc-500 transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
          </summary>
          <div className="px-6 pb-5 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex flex-col gap-2 p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 font-bold text-sm">1</div>
                <p className="text-sm font-semibold text-zinc-200">
                  {lang === "ko" ? "차트 스크린샷 촬영" : "Screenshot Your Chart"}
                </p>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  {lang === "ko"
                    ? "TradingView, 바이낸스 등에서 분석하고 싶은 차트를 캡처하세요. 4시간봉 또는 일봉 추천."
                    : "Capture a chart from TradingView, Binance, etc. 4H or Daily timeframe recommended."}
                </p>
              </div>
              <div className="flex flex-col gap-2 p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 font-bold text-sm">2</div>
                <p className="text-sm font-semibold text-zinc-200">
                  {lang === "ko" ? "이미지 업로드 & 페어 선택" : "Upload & Select Pair"}
                </p>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  {lang === "ko"
                    ? "차트를 드래그 앤 드롭하거나 클릭하여 업로드하세요. 아래에서 거래 페어를 선택합니다."
                    : "Drag & drop or click to upload. Select the trading pair below."}
                </p>
              </div>
              <div className="flex flex-col gap-2 p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400 font-bold text-sm">3</div>
                <p className="text-sm font-semibold text-zinc-200">
                  {lang === "ko" ? "AI 분석 결과 확인" : "Get AI Analysis"}
                </p>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  {lang === "ko"
                    ? "AI가 지지/저항선, RSI, MACD, 피보나치 등을 분석합니다. 트레이드 설정(진입/손절/목표)도 제공됩니다."
                    : "AI analyzes support/resistance, RSI, MACD, Fibonacci. Includes trade setup with entry, SL, and TP."}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400/60" />
              <p className="text-xs text-zinc-500">
                {lang === "ko"
                  ? "팁: 캔들스틱과 지표가 잘 보이는 깨끗한 스크린샷이 더 정확한 분석을 제공합니다."
                  : "Tip: Clean screenshots with visible candlesticks and indicators give more accurate results."}
              </p>
            </div>
          </div>
        </details>
      )}

      {/* Paywall for non-logged-in or non-subscribed users */}
      {!isLoggedIn ? (
        <Card className="p-12 bg-zinc-950/50 backdrop-blur-sm border-white/10 flex flex-col items-center gap-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <LockClosedIcon className="w-8 h-8 text-amber-400" />
          </div>
          <div className="flex flex-col gap-2">
            <h2 className="text-xl font-bold text-zinc-200">
              {lang === "ko" ? "로그인이 필요합니다" : "Login Required"}
            </h2>
            <p className="text-sm text-zinc-500 max-w-md">
              {lang === "ko"
                ? "AI 차트 분석을 이용하려면 먼저 로그인하세요."
                : "Please log in to use AI Chart Analysis."}
            </p>
          </div>
          <a href={`/${lang}/login`}>
            <Button className="bg-blue-600 hover:bg-blue-500 text-white">
              {lang === "ko" ? "로그인" : "Log In"}
            </Button>
          </a>
        </Card>
      ) : !isAdmin ? (
        <Card className="p-12 bg-zinc-950/50 backdrop-blur-sm border-white/10 flex flex-col items-center gap-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <LockClosedIcon className="w-8 h-8 text-amber-400" />
          </div>
          <div className="flex flex-col gap-2">
            <h2 className="text-xl font-bold text-zinc-200">
              {lang === "ko" ? "구독자 전용 기능" : "Subscribers Only"}
            </h2>
            <p className="text-sm text-zinc-500 max-w-md">
              {lang === "ko"
                ? "AI 차트 분석은 유료 구독자만 이용할 수 있습니다. 구독하여 무제한 분석을 시작하세요."
                : "AI Chart Analysis is available to paid subscribers. Subscribe to start analyzing your charts with AI."}
            </p>
          </div>
          <Button disabled className="bg-zinc-700 text-zinc-400 cursor-not-allowed">
            {lang === "ko" ? "구독 준비 중" : "Coming Soon"}
          </Button>
        </Card>
      ) : (
      <>
      {/* Pair Selector */}
      <div className="flex flex-col gap-3">
        <label className="text-sm font-medium text-zinc-400 uppercase tracking-wider">
          {lang === "ko" ? "거래 페어" : "Trading Pair"}
        </label>
        <div className="flex flex-wrap gap-2">
          {POPULAR_PAIRS.map((p) => {
            const coinSymbol = p.replace("USDT", "");
            const logoUrl = COIN_LOGOS[coinSymbol];
            const isActive = selectedPair === p && !customPair;
            return (
              <button
                key={p}
                onClick={() => { setPair(p); setCustomPair(""); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 cursor-pointer min-h-[44px] ${
                  isActive
                    ? "bg-blue-600 text-white"
                    : "bg-zinc-800/50 border border-zinc-700/50 text-zinc-400 hover:bg-zinc-700/50 hover:text-zinc-300"
                }`}
              >
                {logoUrl && (
                  <span className="w-4 h-4 rounded-full bg-white flex-shrink-0 overflow-hidden border border-white/20">
                    <img
                      src={logoUrl}
                      alt={coinSymbol}
                      width={16}
                      height={16}
                      className="w-full h-full object-cover"
                    />
                  </span>
                )}
                {p.replace("USDT", "/USDT")}
              </button>
            );
          })}
          <input
            type="text"
            placeholder="Custom (e.g. PEPEUSDT)"
            value={customPair}
            onChange={(e) => setCustomPair(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
            className="px-3 py-1.5 rounded-lg text-sm bg-zinc-800/50 border border-zinc-700/50 text-zinc-300 placeholder:text-zinc-600 w-48 focus:outline-none focus:border-blue-500/50"
          />
        </div>
      </div>

      {/* Quick TradingView Link */}
      {!imageUrl && !analysis && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-blue-500/[0.05] border border-blue-500/15">
          <svg className="w-4 h-4 text-blue-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
          </svg>
          <p className="text-xs text-zinc-400">
            {lang === "ko" ? "차트가 없으신가요? " : "Need a chart? "}
            <a
              href={`https://www.tradingview.com/chart/?symbol=BINANCE:${selectedPair}&interval=240`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 font-medium underline underline-offset-2"
            >
              {lang === "ko" ? `TradingView에서 ${selectedPair.replace("USDT", "/USDT")} 차트 열기` : `Open ${selectedPair.replace("USDT", "/USDT")} on TradingView`}
            </a>
            {lang === "ko" ? " → 스크린샷 → 여기에 업로드" : " → Screenshot → Upload here"}
          </p>
        </div>
      )}

      {/* Upload Area / Chart Canvas */}
      <Card className="p-0 bg-zinc-950/50 backdrop-blur-sm border-white/10 overflow-hidden">
        {!imageUrl ? (
          <label
            htmlFor="chart-analysis-upload"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`relative flex flex-col items-center justify-center gap-5 p-16 md:p-20 cursor-pointer transition-all duration-300 group ${
              dragOver
                ? "bg-blue-500/10"
                : "hover:bg-white/[0.03]"
            }`}
          >
            {/* Dashed border overlay */}
            <div className={`absolute inset-4 rounded-2xl border-2 border-dashed transition-all duration-300 pointer-events-none ${
              dragOver
                ? "border-blue-500/60 shadow-[inset_0_0_40px_rgba(59,130,246,0.08)]"
                : "border-white/[0.08] group-hover:border-blue-500/30 group-hover:shadow-[inset_0_0_30px_rgba(59,130,246,0.04)]"
            }`} />

            <input type="file" id="chart-analysis-upload" className="hidden" accept="image/*" onChange={handleFileInput} />

            <div className={`w-20 h-20 rounded-2xl flex items-center justify-center transition-all duration-300 ${
              dragOver
                ? "bg-blue-500/15 border border-blue-500/30 scale-110"
                : "bg-zinc-800/50 border border-white/10"
            }`}>
              <CloudArrowUpIcon className={`w-10 h-10 transition-colors duration-300 ${
                dragOver ? "text-blue-400" : "text-zinc-500"
              }`} />
            </div>

            <div className="flex flex-col items-center gap-2 relative z-10">
              <span className={`text-lg font-medium transition-colors duration-300 ${
                dragOver ? "text-blue-300" : "text-zinc-300"
              }`}>
                {uploading ? "Uploading..." : translations.chartAnalysis_dropChart || "Drop your chart here or click to upload"}
              </span>
              <span className="text-zinc-600 text-sm">PNG, JPG up to 10MB</span>
            </div>

            {/* Drag-over pulse ring */}
            {dragOver && (
              <div className="absolute inset-0 rounded-xl bg-blue-500/5 animate-pulse pointer-events-none" />
            )}
          </label>
        ) : (
          <div className="relative">
            {/* Strategy Legend — above the chart */}
            {analysis?.tradeSetup && (
              <div className="bg-zinc-900/95 border border-white/[0.06] rounded-t-xl px-4 py-3">
                {/* Direction + Key Levels */}
                <div className="flex flex-wrap items-center gap-3 mb-2">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold border ${
                    analysis.tradeSetup.direction === "LONG"
                      ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
                      : analysis.tradeSetup.direction === "SHORT"
                      ? "bg-red-500/15 border-red-500/30 text-red-400"
                      : "bg-amber-500/15 border-amber-500/30 text-amber-400"
                  }`}>
                    {analysis.tradeSetup.direction === "LONG" ? "\u25B2" : analysis.tradeSetup.direction === "SHORT" ? "\u25BC" : "\u25C6"}{" "}
                    {analysis.tradeSetup.direction}
                  </span>
                  {analysis.tradeSetup.entry && (
                    <span className="text-xs font-mono text-blue-400 bg-blue-500/10 px-2 py-1 rounded">
                      Entry: ${analysis.tradeSetup.entry.toLocaleString()}
                    </span>
                  )}
                  {analysis.tradeSetup.stopLoss && (
                    <span className="text-xs font-mono text-red-400 bg-red-500/10 px-2 py-1 rounded">
                      SL: ${analysis.tradeSetup.stopLoss.toLocaleString()}
                    </span>
                  )}
                  {analysis.tradeSetup.takeProfit && (
                    <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded">
                      TP: ${analysis.tradeSetup.takeProfit.toLocaleString()}
                    </span>
                  )}
                  {analysis.tradeSetup.riskReward && (
                    <span className="text-xs font-mono text-purple-400 bg-purple-500/10 px-2 py-1 rounded">
                      R:R {analysis.tradeSetup.riskReward}
                    </span>
                  )}
                  <span className="text-xs text-zinc-500">
                    {analysis.confidence}% confidence
                  </span>
                </div>
                {/* Line Legend */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                  {analysis.lines?.map((l, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                      <span className="w-4 h-0.5 rounded-full" style={{ backgroundColor: l.color, borderStyle: l.dashed ? "dashed" : "solid" }} />
                      <span className="text-[10px] font-mono text-zinc-400">{l.label}</span>
                      {l.hitProbability > 0 && (
                        <span className={`text-[9px] font-mono ${l.hitProbability >= 70 ? "text-emerald-500" : l.hitProbability >= 40 ? "text-amber-500" : "text-red-500"}`}>
                          {l.hitProbability}%
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div ref={containerRef} className="w-full">
              {imageLoaded ? (
                <canvas ref={canvasRef} width={dimensions.width} height={dimensions.height}
                  className={`w-full block ${analysis?.tradeSetup ? "rounded-b-xl" : ""}`} style={{ height: dimensions.height > 0 ? dimensions.height : "auto" }} />
              ) : (
                <div className="w-full aspect-video flex items-center justify-center bg-zinc-900/50">
                  <div className="animate-pulse text-zinc-500">Loading chart...</div>
                </div>
              )}
            </div>
            <div className="absolute top-4 right-4 flex gap-2">
              <Button variant="outline" size="sm" onClick={() => { setImageUrl(null); setAnalysis(null); setImageLoaded(false); setAnalysisId(null); }}
                className="bg-zinc-950/80 border-white/20 text-zinc-300 hover:bg-zinc-900 cursor-pointer">
                {translations.chartAnalysis_replace || "Replace"}
              </Button>
              {analysis && (
                <Button variant="outline" size="sm" onClick={saveSnapshot}
                  className="bg-zinc-950/80 border-white/20 text-zinc-300 hover:bg-zinc-900 cursor-pointer flex items-center gap-1.5">
                  <ArrowDownTrayIcon className="w-4 h-4" />
                  Save Snapshot
                </Button>
              )}
              {!analysis && (
                <Button size="sm" onClick={runAnalysis} disabled={analyzing}
                  className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white shadow-lg shadow-blue-600/30 px-5 py-2 text-sm font-semibold cursor-pointer transition-all duration-200">
                  {analyzing ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      {ANALYSIS_STAGES[stageIndex]}
                    </span>
                  ) : (
                    translations.chartAnalysis_analyze || "Analyze"
                  )}
                </Button>
              )}
            </div>
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
                <p className="text-zinc-300 font-medium">{ANALYSIS_STAGES[stageIndex]}</p>
                <p className="text-zinc-500 text-sm">{translations.chartAnalysis_takeMoment || "This may take a moment"}</p>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Analysis Results — side by side on desktop */}
      {analysis && (
        <div className="flex flex-col lg:flex-row gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

          {/* RIGHT PANEL: scrollable analysis */}
          <div className="lg:w-full flex flex-col gap-4 lg:max-h-[85vh] lg:overflow-y-auto lg:pr-2 custom-scrollbar">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Live Context */}
          {analysis.liveContext && (
            <Card className="md:col-span-2 p-6 bg-zinc-950/50 backdrop-blur-sm border-blue-500/20">
              <h3 className="text-sm font-semibold text-blue-400 uppercase tracking-wider mb-4">
                Live Market Data
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-3">
                  <p className="text-xs text-zinc-500 mb-1">Live Price</p>
                  <p className="text-lg font-bold font-mono text-foreground">
                    ${analysis.liveContext.currentPrice?.toLocaleString()}
                  </p>
                </div>
                <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-3">
                  <p className="text-xs text-zinc-500 mb-1">24h Change</p>
                  <p className={`text-lg font-bold font-mono ${analysis.liveContext.change24h >= 0 ? "text-green-400" : "text-red-400"}`}>
                    {analysis.liveContext.change24h >= 0 ? "+" : ""}{analysis.liveContext.change24h?.toFixed(2)}%
                  </p>
                </div>
                <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-3">
                  <p className="text-xs text-zinc-500 mb-1">24h Volume</p>
                  <p className="text-lg font-bold font-mono text-foreground">
                    ${(analysis.liveContext.volume24h / 1e6).toFixed(1)}M
                  </p>
                </div>
                <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-3">
                  <p className="text-xs text-zinc-500 mb-1">Sentiment</p>
                  <span className={`inline-block px-2 py-0.5 rounded text-sm font-semibold border ${sentimentColors[analysis.liveContext.sentiment] || sentimentColors.NEUTRAL}`}>
                    {analysis.liveContext.sentiment}
                  </span>
                </div>
                <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-3">
                  <p className="text-xs text-zinc-500 mb-1">Order Book</p>
                  <span className={`inline-block px-2 py-0.5 rounded text-sm font-semibold border ${
                    analysis.liveContext.orderBookBias === "BUY_PRESSURE"
                      ? "text-green-400 bg-green-500/10 border-green-500/30"
                      : analysis.liveContext.orderBookBias === "SELL_PRESSURE"
                      ? "text-red-400 bg-red-500/10 border-red-500/30"
                      : "text-zinc-400 bg-zinc-500/10 border-zinc-500/30"
                  }`}>
                    {analysis.liveContext.orderBookBias?.replace("_", " ")}
                  </span>
                </div>
              </div>
              {analysis.liveContext.keyNews && analysis.liveContext.keyNews.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Latest News</p>
                  {analysis.liveContext.keyNews.map((news, i) => (
                    <div key={i} className="flex gap-2 text-sm">
                      <span className="text-blue-400 flex-shrink-0">&#8226;</span>
                      <div>
                        <span className="text-zinc-300 font-medium">{news.title}</span>
                        {news.snippet && (
                          <span className="text-zinc-500 ml-1">— {news.snippet.slice(0, 120)}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}

          {/* OCR Data */}
          {analysis.ocrData && (
            <Card className="md:col-span-2 p-6 bg-zinc-950/50 backdrop-blur-sm border-white/10">
              <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">
                {translations.chartAnalysis_ocrData || "Chart Data (OCR)"}
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-3">
                  <p className="text-xs text-zinc-500 mb-1">{translations.chartAnalysis_currentPrice || "Current Price"}</p>
                  <p className="text-lg font-bold font-mono text-foreground">${analysis.ocrData.currentPrice?.toLocaleString()}</p>
                </div>
                <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-3">
                  <p className="text-xs text-zinc-500 mb-1">{translations.chartAnalysis_timeframe || "Timeframe"}</p>
                  <p className="text-lg font-bold font-mono text-foreground">{analysis.ocrData.timeframe}</p>
                </div>
                <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-3">
                  <p className="text-xs text-zinc-500 mb-1">Range High</p>
                  <p className="text-lg font-bold font-mono text-green-400">${analysis.ocrData.priceRange?.high?.toLocaleString()}</p>
                </div>
                <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-3">
                  <p className="text-xs text-zinc-500 mb-1">Range Low</p>
                  <p className="text-lg font-bold font-mono text-red-400">${analysis.ocrData.priceRange?.low?.toLocaleString()}</p>
                </div>
              </div>
              {analysis.ocrData.visibleIndicators?.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {analysis.ocrData.visibleIndicators.map((ind, i) => (
                    <span key={i} className="px-2.5 py-1 rounded-full text-xs font-medium bg-blue-500/10 border border-blue-500/30 text-blue-300">
                      {ind}{analysis.ocrData.readValues?.[ind.split(" ")[0]] ? `: ${analysis.ocrData.readValues[ind.split(" ")[0]]}` : ""}
                    </span>
                  ))}
                </div>
              )}
            </Card>
          )}

          {/* Summary + Trend */}
          <Card className="md:col-span-2 p-6 bg-zinc-950/50 backdrop-blur-sm border-white/10">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-foreground">{translations.chartAnalysis_summary || "Analysis Summary"}</h2>
                <div className="flex items-center gap-3">
                  <span className={`text-sm font-bold ${trendColors[analysis.trend] || "text-zinc-400"}`}>{analysis.trend}</span>
                  <span className="text-xs text-zinc-500">|</span>
                  <span className="text-sm text-zinc-400">
                    {translations.chartAnalysis_confidence || "Confidence"}: <span className="text-foreground font-mono">{analysis.confidence}%</span>
                  </span>
                </div>
              </div>
              <p className="text-zinc-300 leading-relaxed">{analysis.summary}</p>
              {analysis.patterns.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {analysis.patterns.map((p, i) => (
                    <span key={i} className="px-3 py-1 rounded-full text-xs font-medium bg-purple-500/10 border border-purple-500/30 text-purple-300">{p}</span>
                  ))}
                </div>
              )}
            </div>
          </Card>

          {/* Risk Score */}
          <Card className="p-6 bg-zinc-950/50 backdrop-blur-sm border-white/10">
            <div className="flex flex-col items-center gap-4">
              <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">{translations.chartAnalysis_riskScore || "Risk Score"}</h3>
              <div className="relative w-24 h-24">
                <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="42" fill="none" stroke="#27272a" strokeWidth="8" />
                  <circle cx="50" cy="50" r="42" fill="none"
                    stroke={analysis.riskScore <= 3 ? "#22c55e" : analysis.riskScore <= 6 ? "#f59e0b" : "#ef4444"}
                    strokeWidth="8" strokeDasharray={`${(analysis.riskScore / 10) * 264} 264`} strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-bold text-foreground">{analysis.riskScore}</span>
                  <span className="text-xs text-zinc-500">/10</span>
                </div>
              </div>
              <span className="text-xs text-zinc-500">{analysis.riskScore <= 3 ? "Low Risk" : analysis.riskScore <= 6 ? "Medium Risk" : "High Risk"}</span>
            </div>
          </Card>

          {/* Trade Setup */}
          <Card className="p-6 bg-zinc-950/50 backdrop-blur-sm border-white/10">
            <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">{translations.chartAnalysis_tradeSetup || "Trade Setup"}</h3>
            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <span className="text-zinc-500 text-sm">Direction</span>
                <span className={`font-bold text-sm ${analysis.tradeSetup.direction === "LONG" ? "text-green-400" : analysis.tradeSetup.direction === "SHORT" ? "text-red-400" : "text-zinc-400"}`}>
                  {analysis.tradeSetup.direction}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-blue-400 text-sm">Entry</span>
                <span className="text-foreground font-mono text-sm">${analysis.tradeSetup.entry?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-red-400 text-sm">Stop Loss</span>
                <span className="text-foreground font-mono text-sm">${analysis.tradeSetup.stopLoss?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-green-400 text-sm">Take Profit</span>
                <span className="text-foreground font-mono text-sm">${analysis.tradeSetup.takeProfit?.toLocaleString()}</span>
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

          {/* Research Brief */}
          {analysis.professionalSummary && (
            <Card className="p-6 bg-zinc-950/50 backdrop-blur-sm border-blue-500/20 col-span-full">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-1 h-5 rounded-full bg-blue-500" />
                <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">
                  {lang === "ko" ? "리서치 브리프" : "Research Brief"}
                </h3>
                <span className="text-[10px] font-mono text-zinc-600">
                  {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </span>
              </div>

              <div className="space-y-5">
                {/* Executive Summary */}
                <div>
                  <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-[0.15em] mb-1.5">
                    {lang === "ko" ? "요약" : "Executive Summary"}
                  </p>
                  <p className="text-sm text-zinc-300 leading-relaxed">{analysis.professionalSummary.executiveSummary}</p>
                </div>

                {/* Market Structure */}
                <div>
                  <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-[0.15em] mb-1.5">
                    {lang === "ko" ? "시장 구조" : "Market Structure"}
                  </p>
                  <p className="text-sm text-zinc-300 leading-relaxed">{analysis.professionalSummary.marketStructure}</p>
                </div>

                {/* Trading Thesis */}
                <div>
                  <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-[0.15em] mb-1.5">
                    {lang === "ko" ? "트레이딩 논거" : "Trading Thesis"}
                  </p>
                  <p className="text-sm text-zinc-300 leading-relaxed">{analysis.professionalSummary.tradingThesis}</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Key Risks */}
                  <div className="rounded-xl bg-red-500/[0.05] border border-red-500/10 p-4">
                    <p className="text-[10px] font-mono text-red-400 uppercase tracking-[0.15em] mb-2">
                      {lang === "ko" ? "주요 리스크" : "Key Risks"}
                    </p>
                    <ul className="space-y-1.5">
                      {analysis.professionalSummary.keyRisks?.map((risk, i) => (
                        <li key={i} className="text-xs text-zinc-400 flex gap-2">
                          <span className="text-red-400 shrink-0">-</span>
                          {risk}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Key Catalysts */}
                  <div className="rounded-xl bg-emerald-500/[0.05] border border-emerald-500/10 p-4">
                    <p className="text-[10px] font-mono text-emerald-400 uppercase tracking-[0.15em] mb-2">
                      {lang === "ko" ? "주요 촉매" : "Key Catalysts"}
                    </p>
                    <ul className="space-y-1.5">
                      {analysis.professionalSummary.keyCatalysts?.map((cat, i) => (
                        <li key={i} className="text-xs text-zinc-400 flex gap-2">
                          <span className="text-emerald-400 shrink-0">+</span>
                          {cat}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Indicators */}
          <Card className="p-6 bg-zinc-950/50 backdrop-blur-sm border-white/10">
            <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">{translations.chartAnalysis_indicators || "Technical Indicators"}</h3>
            <div className="flex flex-col gap-3">
              {analysis.indicators.map((ind, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-foreground text-sm font-medium">{ind.name}</span>
                    <span className="text-zinc-500 text-xs">{ind.value}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-xs font-semibold border ${signalColors[ind.signal]}`}>{ind.signal}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Quant Analysis */}
          {analysis.quantAnalysis && (
            <Card className="md:col-span-2 p-6 bg-zinc-950/50 backdrop-blur-sm border-white/10">
              <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">
                {translations.chartAnalysis_quantAnalysis || "Quantitative Analysis"}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Fibonacci */}
                <div>
                  <h4 className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-3">
                    {translations.chartAnalysis_fibonacci || "Fibonacci Levels"}
                  </h4>
                  <div className="space-y-2">
                    {analysis.quantAnalysis.fibonacciLevels?.map((fib, i) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-amber-400/70 font-mono text-xs w-12">{fib.level}</span>
                          <span className="text-zinc-400 text-xs">{fib.significance}</span>
                        </div>
                        <span className="text-foreground font-mono">${fib.price?.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Statistical Targets */}
                <div>
                  <h4 className="text-xs font-semibold text-cyan-400 uppercase tracking-wider mb-3">
                    {translations.chartAnalysis_statisticalTargets || "Statistical Targets"}
                  </h4>
                  <div className="space-y-2">
                    {analysis.quantAnalysis.statisticalTargets?.map((target, i) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <span className="text-foreground font-mono">${target.price?.toLocaleString()}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${target.probability}%`,
                                backgroundColor: target.probability >= 70 ? "#22c55e" : target.probability >= 40 ? "#f59e0b" : "#ef4444",
                              }}
                            />
                          </div>
                          <span className="text-zinc-400 font-mono text-xs w-8">{target.probability}%</span>
                          <span className="text-zinc-600 text-xs">{target.timeframe}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bollinger & RSI */}
                <div>
                  <h4 className="text-xs font-semibold text-purple-400 uppercase tracking-wider mb-2">Bollinger Bands</h4>
                  <p className="text-zinc-300 text-sm">{analysis.quantAnalysis.bollingerPosition}</p>
                  {analysis.quantAnalysis.rsiDivergence && (
                    <div className="mt-3">
                      <h4 className="text-xs font-semibold text-orange-400 uppercase tracking-wider mb-2">RSI Divergence</h4>
                      <p className="text-zinc-300 text-sm">{analysis.quantAnalysis.rsiDivergence}</p>
                    </div>
                  )}
                </div>

                {/* Volume Profile */}
                <div>
                  <h4 className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-2">Volume Profile</h4>
                  <p className="text-zinc-300 text-sm">{analysis.quantAnalysis.volumeProfile}</p>
                  <div className="mt-3 flex items-center gap-2">
                    <span className="text-zinc-500 text-xs">RSI:</span>
                    <span className={`font-mono font-bold text-sm ${
                      analysis.quantAnalysis.rsiValue < 30 ? "text-green-400" :
                      analysis.quantAnalysis.rsiValue > 70 ? "text-red-400" : "text-zinc-300"
                    }`}>{analysis.quantAnalysis.rsiValue}</span>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Key Levels */}
          <Card className="p-6 bg-zinc-950/50 backdrop-blur-sm border-white/10">
            <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">{translations.chartAnalysis_keyLevels || "Key Price Levels"}</h3>
            <div className="flex flex-col gap-4">
              <div>
                <span className="text-green-400 text-xs font-semibold uppercase tracking-wider">Support</span>
                <div className="flex flex-wrap gap-2 mt-2">
                  {analysis.supportLevels.map((level, i) => (
                    <span key={i} className="px-3 py-1 rounded bg-green-500/10 border border-green-500/30 text-green-300 font-mono text-sm">
                      ${level?.toLocaleString()}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <span className="text-red-400 text-xs font-semibold uppercase tracking-wider">Resistance</span>
                <div className="flex flex-wrap gap-2 mt-2">
                  {analysis.resistanceLevels.map((level, i) => (
                    <span key={i} className="px-3 py-1 rounded bg-red-500/10 border border-red-500/30 text-red-300 font-mono text-sm">
                      ${level?.toLocaleString()}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {/* Line Probabilities */}
          <Card className="md:col-span-2 p-6 bg-zinc-950/50 backdrop-blur-sm border-white/10">
            <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">
              {translations.chartAnalysis_hitProbability || "Hit Probability"}
            </h3>
            <div className="space-y-3">
              {analysis.lines.filter(l => l.hitProbability > 0).map((line, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: line.color }} />
                  <span className="text-zinc-300 text-sm flex-1">{line.label}</span>
                  <div className="w-32 h-2 rounded-full bg-zinc-800 overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{
                      width: `${line.hitProbability}%`,
                      backgroundColor: line.hitProbability >= 70 ? "#22c55e" : line.hitProbability >= 40 ? "#f59e0b" : "#ef4444",
                    }} />
                  </div>
                  <span className="text-foreground font-mono font-bold text-sm w-10 text-right">{line.hitProbability}%</span>
                </div>
              ))}
            </div>
          </Card>

          {/* ============================================================ */}
          {/*  AI Commentary + Share Post (Grok-style)                      */}
          {/* ============================================================ */}
          {(() => {
            const commentary = generateAICommentary(selectedPair, analysis);
            const postText = generateSharePost(selectedPair, analysis);
            const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(postText)}`;

            const sentimentConfig = {
              bullish: { bg: "from-emerald-500/20 to-emerald-600/5", border: "border-emerald-500/30", dot: "bg-emerald-400", label: "Bullish", labelColor: "text-emerald-400" },
              bearish: { bg: "from-red-500/20 to-red-600/5", border: "border-red-500/30", dot: "bg-red-400", label: "Bearish", labelColor: "text-red-400" },
              neutral: { bg: "from-zinc-500/20 to-zinc-600/5", border: "border-zinc-500/30", dot: "bg-zinc-400", label: "Neutral", labelColor: "text-zinc-400" },
            };
            const convictionConfig = {
              high: { color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30", label: "High Conviction" },
              medium: { color: "text-amber-400 bg-amber-500/10 border-amber-500/30", label: "Medium Conviction" },
              low: { color: "text-zinc-400 bg-zinc-500/10 border-zinc-500/30", label: "Low Conviction" },
            };
            const sc = sentimentConfig[commentary.sentiment];
            const cc = convictionConfig[commentary.conviction];

            return (
              <>
                {/* AI Commentary Card */}
                <Card className={`md:col-span-2 p-0 overflow-hidden bg-gradient-to-br ${sc.bg} backdrop-blur-sm ${sc.border}`}>
                  {/* Header */}
                  <div className="flex items-center justify-between px-6 pt-5 pb-0">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/20">
                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-foreground">CryptoX AI</h3>
                        <p className="text-[10px] text-zinc-500 font-mono">Analysis Commentary</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${cc.color}`}>
                        {cc.label}
                      </span>
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.05] border border-white/[0.08]">
                        <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                        <span className={`text-[10px] font-bold ${sc.labelColor}`}>{sc.label}</span>
                      </div>
                    </div>
                  </div>

                  {/* Verdict */}
                  <div className="px-6 py-4">
                    <p className="text-zinc-200 text-[15px] leading-relaxed font-medium">
                      {commentary.verdict}
                    </p>
                  </div>

                  {/* Detail bullets */}
                  {commentary.details.length > 0 && (
                    <div className="px-6 pb-4 space-y-2.5">
                      {commentary.details.map((detail, i) => (
                        <div key={i} className="flex items-start gap-2.5">
                          <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-400/60 flex-shrink-0" />
                          <p className="text-zinc-400 text-sm leading-relaxed">{detail}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Divider */}
                  <div className="h-px bg-white/[0.06] mx-6" />

                  {/* Share actions */}
                  <div className="px-6 py-4 flex items-center justify-between">
                    <p className="text-[11px] text-zinc-600 font-mono">
                      Share this analysis with your community
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(postText);
                          setCopied(true);
                          setTimeout(() => setCopied(false), 2000);
                          toast({ title: "Copied!", description: "Post copied to clipboard" });
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/[0.05] border border-white/[0.08] text-zinc-300 hover:bg-white/[0.1] hover:border-white/[0.15] transition-all cursor-pointer min-h-[44px]"
                      >
                        <ClipboardDocumentIcon className="w-3.5 h-3.5" />
                        {copied ? "Copied!" : "Copy Post"}
                      </button>
                      <button
                        onClick={saveSnapshot}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/[0.05] border border-white/[0.08] text-zinc-300 hover:bg-white/[0.1] hover:border-white/[0.15] transition-all cursor-pointer min-h-[44px]"
                      >
                        <ArrowDownTrayIcon className="w-3.5 h-3.5" />
                        Download Chart
                      </button>
                      <a
                        href={twitterUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-lg shadow-blue-600/20 cursor-pointer min-h-[44px]"
                      >
                        <ShareIcon className="w-3.5 h-3.5" />
                        Share on X
                      </a>
                    </div>
                  </div>
                </Card>

                {/* Post Preview Card */}
                <Card className="md:col-span-2 p-0 overflow-hidden bg-zinc-950/80 backdrop-blur-sm border-white/[0.08]">
                  <div className="flex items-center justify-between px-6 pt-4 pb-2">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-zinc-500" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                      </svg>
                      <span className="text-[11px] text-zinc-500 font-mono uppercase tracking-wider">Post Preview</span>
                    </div>
                  </div>
                  <div className="px-6 pb-5">
                    <pre className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap font-sans">
                      {postText}
                    </pre>
                  </div>
                </Card>
              </>
            );
          })()}
            </div>
          </div>
        </div>
      )}
      </>
      )}
    </div>
  );
};

export default ChartAnalyzer;
