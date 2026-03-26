"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { CloudArrowUpIcon, DocumentTextIcon, CameraIcon } from "@heroicons/react/24/outline";
import { FileUploadModule } from "@/lib/modules/file-upload";
import { analyzeOrderScreenshot, analyzeOrderCSV } from "./actions";
import type { OCROrder } from "@/lib/services/portfolio/order-ocr.service";
import { SUPABASE_STORAGE_URL } from "@/lib/utils/get-image-url";
import Link from "next/link";

type Tab = "screenshot" | "csv";

export default function OrderImport({ lang }: { lang: string }) {
  const ko = lang === "ko";
  const [tab, setTab] = useState<Tab>("screenshot");
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [orders, setOrders] = useState<OCROrder[]>([]);
  const [csvText, setCsvText] = useState("");

  const handleScreenshot = async (file: File) => {
    if (!file.type.startsWith("image/")) return;
    setUploading(true);
    setOrders([]);
    try {
      const uploader = new FileUploadModule();
      const data = await uploader.upload(file);
      const url = SUPABASE_STORAGE_URL + data.path;
      setUploading(false);
      setAnalyzing(true);
      toast({ title: ko ? "AI가 주문 내역을 분석 중..." : "AI analyzing orders..." });
      const result = await analyzeOrderScreenshot(url);
      setOrders(result);
      if (result.length === 0) {
        toast({ variant: "destructive", title: ko ? "주문을 감지하지 못했습니다" : "No orders detected" });
      } else {
        toast({ title: `${result.length}${ko ? "개 주문 감지됨" : " orders detected"}` });
      }
    } catch {
      toast({ variant: "destructive", title: ko ? "분석 실패" : "Analysis failed" });
    } finally { setUploading(false); setAnalyzing(false); }
  };

  const handleCSVParse = async () => {
    if (!csvText.trim()) return;
    setAnalyzing(true); setOrders([]);
    try {
      const result = await analyzeOrderCSV(csvText);
      setOrders(result);
      if (result.length === 0) toast({ variant: "destructive", title: ko ? "주문을 파싱하지 못했습니다" : "No orders parsed" });
      else toast({ title: `${result.length}${ko ? "개 주문 파싱됨" : " orders parsed"}` });
    } catch { toast({ variant: "destructive", title: ko ? "파싱 실패" : "Parse failed" }); }
    finally { setAnalyzing(false); }
  };

  const totalPnL = orders.filter((o) => o.pnl != null).reduce((sum, o) => sum + (o.pnl || 0), 0);
  const totalVolume = orders.reduce((sum, o) => sum + o.total, 0);
  const buyCount = orders.filter((o) => o.side === "BUY").length;
  const sellCount = orders.filter((o) => o.side === "SELL").length;

  return (
    <div className="max-w-5xl mx-auto px-6 pt-28 pb-16">
      <div className="mb-8">
        <Link href={`/${lang}/portfolio`} className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors mb-3 block">
          ← {ko ? "포트폴리오" : "Portfolio"}
        </Link>
        <h1 className="text-3xl font-bold text-white tracking-tight">{ko ? "주문 내역 가져오기" : "Import Orders"}</h1>
        <p className="text-zinc-500 text-sm mt-1">{ko ? "거래소 스크린샷 또는 CSV/엑셀로 주문 내역을 자동 인식합니다" : "Auto-detect orders from exchange screenshots or CSV/Excel"}</p>
      </div>

      <div className="flex gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/[0.06] mb-8 w-fit">
        <button onClick={() => setTab("screenshot")} className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${tab === "screenshot" ? "bg-blue-600/20 text-blue-400 border border-blue-500/30" : "text-zinc-400 hover:text-zinc-200"}`}>
          <CameraIcon className="w-4 h-4" />{ko ? "스크린샷" : "Screenshot"}
        </button>
        <button onClick={() => setTab("csv")} className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${tab === "csv" ? "bg-blue-600/20 text-blue-400 border border-blue-500/30" : "text-zinc-400 hover:text-zinc-200"}`}>
          <DocumentTextIcon className="w-4 h-4" />CSV / Excel
        </button>
      </div>

      {tab === "screenshot" && (
        <Card className="p-0 bg-white/[0.03] border-white/[0.06] overflow-hidden mb-8">
          <label htmlFor="order-screenshot" className="flex flex-col items-center justify-center gap-4 p-16 cursor-pointer hover:bg-white/[0.02] transition-colors">
            <input type="file" id="order-screenshot" className="hidden" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleScreenshot(f); }} />
            <div className="w-16 h-16 rounded-2xl bg-zinc-800/50 border border-white/[0.08] flex items-center justify-center"><CloudArrowUpIcon className="w-8 h-8 text-zinc-500" /></div>
            <span className="text-zinc-300 text-base font-medium">
              {uploading ? (ko ? "업로드 중..." : "Uploading...") : analyzing ? (ko ? "AI 분석 중..." : "AI analyzing...") : (ko ? "거래소 주문 내역 스크린샷을 업로드하세요" : "Upload exchange order history screenshot")}
            </span>
            <span className="text-zinc-600 text-xs">{ko ? "바이낸스, 바이빗, OKX, 비트겟 등 지원" : "Supports Binance, Bybit, OKX, Bitget"}</span>
          </label>
          {analyzing && (
            <div className="flex items-center justify-center gap-3 pb-8">
              <div className="h-5 w-5 rounded-full border-2 border-blue-500/30 border-t-blue-500 animate-spin" />
              <span className="text-sm text-zinc-400">{ko ? "주문 데이터 추출 중..." : "Extracting order data..."}</span>
            </div>
          )}
        </Card>
      )}

      {tab === "csv" && (
        <Card className="p-6 bg-white/[0.03] border-white/[0.06] mb-8">
          <label className="text-xs text-zinc-500 font-mono uppercase tracking-wider mb-2 block">{ko ? "CSV 또는 엑셀 데이터 붙여넣기" : "Paste CSV or Excel data"}</label>
          <textarea value={csvText} onChange={(e) => setCsvText(e.target.value)}
            placeholder="Date,Pair,Side,Quantity,Price,Total,Fee&#10;2026-03-25,BTCUSDT,BUY,0.1,71000,7100,3.55"
            rows={8} className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.08] text-white font-mono text-sm placeholder:text-zinc-700 focus:outline-none focus:border-blue-500/50 resize-none mb-4" />
          <Button onClick={handleCSVParse} disabled={!csvText.trim() || analyzing} className="bg-blue-600 hover:bg-blue-500 text-white">
            {analyzing ? (ko ? "분석 중..." : "Analyzing...") : (ko ? "AI로 파싱하기" : "Parse with AI")}
          </Button>
        </Card>
      )}

      {orders.length > 0 && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <Card className="p-4 bg-white/[0.03] border-white/[0.06]">
              <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-[0.2em] mb-1">{ko ? "총 주문" : "Orders"}</p>
              <p className="text-xl font-mono font-bold text-white">{orders.length}</p>
            </Card>
            <Card className="p-4 bg-white/[0.03] border-white/[0.06]">
              <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-[0.2em] mb-1">{ko ? "매수/매도" : "Buy/Sell"}</p>
              <p className="text-xl font-mono font-bold"><span className="text-emerald-400">{buyCount}</span><span className="text-zinc-600"> / </span><span className="text-red-400">{sellCount}</span></p>
            </Card>
            <Card className="p-4 bg-white/[0.03] border-white/[0.06]">
              <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-[0.2em] mb-1">{ko ? "총 거래량" : "Volume"}</p>
              <p className="text-xl font-mono font-bold text-white">${totalVolume.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
            </Card>
            {totalPnL !== 0 && (
              <Card className="p-4 bg-white/[0.03] border-white/[0.06]">
                <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-[0.2em] mb-1">P&L</p>
                <p className={`text-xl font-mono font-bold ${totalPnL >= 0 ? "text-emerald-400" : "text-red-400"}`}>{totalPnL >= 0 ? "+" : ""}${totalPnL.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
              </Card>
            )}
          </div>

          <Card className="p-0 bg-white/[0.03] border-white/[0.06] overflow-hidden">
            <div className="px-6 py-4 border-b border-white/[0.06]">
              <h3 className="text-[10px] text-zinc-500 font-mono uppercase tracking-[0.2em]">{ko ? "감지된 주문" : "Detected Orders"}</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-white/[0.06]">
                  {[ko ? "페어" : "Pair", ko ? "방향" : "Side", ko ? "수량" : "Qty", ko ? "가격" : "Price", ko ? "금액" : "Total", "P&L", ko ? "날짜" : "Date"].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-[10px] font-mono text-zinc-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {orders.map((o, i) => (
                    <tr key={i} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                      <td className="px-5 py-3 font-mono font-semibold text-white">{o.pair}</td>
                      <td className="px-5 py-3"><span className={`px-2 py-0.5 rounded text-xs font-bold ${o.side === "BUY" ? "text-emerald-400 bg-emerald-500/10" : "text-red-400 bg-red-500/10"}`}>{o.side === "BUY" ? (ko ? "매수" : "BUY") : (ko ? "매도" : "SELL")}</span></td>
                      <td className="px-5 py-3 font-mono text-zinc-300">{o.quantity}</td>
                      <td className="px-5 py-3 font-mono text-zinc-300">${o.price.toLocaleString()}</td>
                      <td className="px-5 py-3 font-mono text-white">${o.total.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                      <td className="px-5 py-3">{o.pnl != null ? <span className={`font-mono font-semibold ${o.pnl >= 0 ? "text-emerald-400" : "text-red-400"}`}>{o.pnl >= 0 ? "+" : ""}${o.pnl.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span> : <span className="text-zinc-600">—</span>}</td>
                      <td className="px-5 py-3 text-zinc-500 text-xs">{o.date || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
