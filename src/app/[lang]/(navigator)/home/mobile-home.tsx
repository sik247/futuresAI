"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { CryptoNewsItem } from "@/lib/services/news/crypto-news.service";

/* ------------------------------------------------------------------ */
/*  Types (shared with home-dashboard)                                 */
/* ------------------------------------------------------------------ */

type BinanceTicker = { symbol: string; lastPrice: string; priceChangePercent: string };
type FearGreedData = { data: { value: string; value_classification: string }[] };
type GlobalMarket = { data: { total_market_cap: { usd: number }; total_volume: { usd: number }; market_cap_percentage: { btc: number } } };
type SignalItem = { symbol: string; name: string; price: number; change24h: number; signal: string; direction: string; confidence: number };
type SignalsData = { signals: SignalItem[]; fearGreed: { value: number; classification: string }; btcTrend: string; marketSummary: string };

export type MobileHomeProps = {
  lang: string;
  btcData: BinanceTicker | null;
  ethData: BinanceTicker | null;
  fearGreed: FearGreedData | null;
  globalData: GlobalMarket | null;
  news: CryptoNewsItem[];
  signals: SignalsData;
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function fmtPrice(v: number) {
  if (isNaN(v) || !isFinite(v)) return "--";
  if (v >= 10000) return v.toLocaleString(undefined, { maximumFractionDigits: 0 });
  if (v >= 1) return v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return v.toFixed(4);
}

function pct(v: number | null) {
  if (v === null || isNaN(v)) return "--";
  return `${v >= 0 ? "+" : ""}${v.toFixed(2)}%`;
}

function timeAgo(date: Date | string) {
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}

function decodeHTML(s: string) {
  return s.replace(/&#8217;/g, "'").replace(/&#8216;/g, "'").replace(/&#8220;/g, "\u201C").replace(/&#8221;/g, "\u201D").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#039;/g, "'");
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function MobileHome({ lang, btcData, ethData, fearGreed, globalData, news, signals }: MobileHomeProps) {
  const ko = lang === "ko";

  // Client-side fallback for missing data
  const [btc, setBtc] = useState(btcData);
  const [eth, setEth] = useState(ethData);
  const [fg, setFg] = useState(fearGreed);
  const [gd, setGd] = useState(globalData);

  useEffect(() => {
    if (!btcData?.lastPrice)
      fetch("https://api.binance.com/api/v3/ticker/24hr?symbol=BTCUSDT").then(r => r.json()).then(setBtc).catch(() => {});
    if (!ethData?.lastPrice)
      fetch("https://api.binance.com/api/v3/ticker/24hr?symbol=ETHUSDT").then(r => r.json()).then(setEth).catch(() => {});
    if (!fearGreed?.data?.[0])
      fetch("https://api.alternative.me/fng/?limit=1").then(r => r.json()).then(setFg).catch(() => {});
    if (!globalData?.data)
      fetch("https://api.coingecko.com/api/v3/global").then(r => r.json()).then(setGd).catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const btcPrice = btc?.lastPrice ? parseFloat(btc.lastPrice) : null;
  const btcPct = btc?.priceChangePercent ? parseFloat(btc.priceChangePercent) : null;
  const ethPrice = eth?.lastPrice ? parseFloat(eth.lastPrice) : null;
  const ethPct = eth?.priceChangePercent ? parseFloat(eth.priceChangePercent) : null;
  const fgVal = fg?.data?.[0] ? parseInt(fg.data[0].value) : null;
  const fgClass = fg?.data?.[0]?.value_classification ?? "";

  const isLong = signals.marketSummary?.startsWith("[LONG]");
  const isShort = signals.marketSummary?.startsWith("[SHORT]");
  const topSignals = signals.signals.slice(0, 5);

  return (
    <div className="bg-zinc-950 text-white pb-20 font-mono">

      {/* ── Price Cards ── */}
      <div className="grid grid-cols-2 gap-2.5 p-4">
        {/* BTC */}
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-white font-bold text-sm">₿</div>
            <span className="text-sm font-semibold">BTC</span>
          </div>
          <p className="text-lg font-bold tabular-nums">{btcPrice !== null ? `$${fmtPrice(btcPrice)}` : "--"}</p>
          <p className={`text-xs font-semibold tabular-nums ${btcPct !== null && btcPct >= 0 ? "text-emerald-400" : "text-red-400"}`}>
            {pct(btcPct)}
          </p>
        </div>
        {/* ETH */}
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold text-sm">Ξ</div>
            <span className="text-sm font-semibold">ETH</span>
          </div>
          <p className="text-lg font-bold tabular-nums">{ethPrice !== null ? `$${fmtPrice(ethPrice)}` : "--"}</p>
          <p className={`text-xs font-semibold tabular-nums ${ethPct !== null && ethPct >= 0 ? "text-emerald-400" : "text-red-400"}`}>
            {pct(ethPct)}
          </p>
        </div>
      </div>

      {/* ── Market Bar ── */}
      <div className="mx-4 mb-4 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4">
        <div className="flex items-center justify-between">
          {/* Fear & Greed */}
          <div className="flex items-center gap-3">
            <div className={`text-2xl font-black tabular-nums ${fgVal !== null ? (fgVal <= 25 ? "text-red-400" : fgVal <= 50 ? "text-orange-400" : fgVal <= 75 ? "text-lime-400" : "text-emerald-400") : "text-zinc-500"}`}>
              {fgVal ?? "--"}
            </div>
            <div>
              <p className="text-[11px] text-zinc-500 uppercase tracking-wider">F&G</p>
              <p className="text-xs text-zinc-400">{fgClass}</p>
            </div>
          </div>
          {/* Market Summary */}
          <div className={`px-3 py-1.5 rounded-full text-xs font-bold ${
            isLong ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25"
            : isShort ? "bg-red-500/15 text-red-400 border border-red-500/25"
            : "bg-zinc-500/15 text-zinc-400 border border-zinc-500/25"
          }`}>
            {isLong ? (ko ? "롱 우세" : "Long") : isShort ? (ko ? "숏 우세" : "Short") : (ko ? "횡보" : "Neutral")}
          </div>
        </div>
        {/* Global stats */}
        {gd?.data && (
          <div className="flex gap-4 mt-3 pt-3 border-t border-white/[0.04]">
            <div className="flex-1">
              <p className="text-[10px] text-zinc-600">Mkt Cap</p>
              <p className="text-xs text-white font-semibold tabular-nums">${(gd.data.total_market_cap.usd / 1e12).toFixed(2)}T</p>
            </div>
            <div className="flex-1">
              <p className="text-[10px] text-zinc-600">BTC Dom</p>
              <p className="text-xs text-white font-semibold tabular-nums">{gd.data.market_cap_percentage.btc.toFixed(1)}%</p>
            </div>
            <div className="flex-1">
              <p className="text-[10px] text-zinc-600">24h Vol</p>
              <p className="text-xs text-white font-semibold tabular-nums">${(gd.data.total_volume.usd / 1e9).toFixed(1)}B</p>
            </div>
          </div>
        )}
      </div>

      {/* ── Quick Actions ── */}
      <div className="flex gap-2 px-4 mb-4 overflow-x-auto no-scrollbar">
        {[
          { href: `/${lang}/quant`, icon: "📊", label: ko ? "AI 시그널" : "AI Signals", color: "from-blue-600 to-cyan-600" },
          { href: `/${lang}/chat`, icon: "✨", label: ko ? "AI 채팅" : "AI Chat", color: "from-purple-600 to-pink-600" },
          { href: `/${lang}/whales`, icon: "🐋", label: ko ? "고래 추적" : "Whales", color: "from-emerald-600 to-teal-600" },
          { href: `/${lang}/payback`, icon: "💰", label: ko ? "페이백" : "Payback", color: "from-amber-600 to-orange-600" },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="shrink-0 flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-gradient-to-r text-white text-sm font-semibold active:scale-[0.97] transition-transform"
            style={{ backgroundImage: `linear-gradient(to right, var(--tw-gradient-stops))` }}
          >
            <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center text-base`}>{item.icon}</div>
            <span className="text-xs font-semibold text-white">{item.label}</span>
          </Link>
        ))}
      </div>

      {/* ── Top Signals ── */}
      <div className="px-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold">{ko ? "AI 시그널" : "Top Signals"}</h2>
          <Link href={`/${lang}/quant`} className="text-xs text-blue-400">{ko ? "전체 보기 →" : "View all →"}</Link>
        </div>
        <div className="space-y-2">
          {topSignals.map((s) => (
            <div key={s.symbol} className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-zinc-700 to-zinc-600 flex items-center justify-center text-white font-bold text-xs shrink-0">
                {s.symbol.slice(0, 3)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">{s.symbol}</span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                    s.direction === "LONG" ? "bg-emerald-500/15 text-emerald-400"
                    : s.direction === "SHORT" ? "bg-red-500/15 text-red-400"
                    : "bg-zinc-500/15 text-zinc-400"
                  }`}>
                    {s.direction === "LONG" ? "▲ LONG" : s.direction === "SHORT" ? "▼ SHORT" : "WAIT"}
                  </span>
                </div>
                <p className="text-xs text-zinc-500">${fmtPrice(s.price)}</p>
              </div>
              <div className="text-right shrink-0">
                <p className={`text-sm font-bold tabular-nums ${s.change24h >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {pct(s.change24h)}
                </p>
                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md border ${
                  s.signal.includes("Buy") ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/10"
                  : s.signal.includes("Sell") ? "text-red-400 border-red-500/30 bg-red-500/10"
                  : "text-zinc-400 border-zinc-500/30 bg-zinc-500/10"
                }`}>
                  {s.signal}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── BTC Chart ── */}
      <div className="px-4 mb-4">
        <div className="rounded-2xl border border-white/[0.06] bg-zinc-950 overflow-hidden">
          <div className="px-4 py-2.5 border-b border-white/[0.06] flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">BTC/USDT</span>
            <span className="flex items-center gap-1.5">
              <span className="relative flex h-1.5 w-1.5"><span className="animate-ping absolute h-full w-full rounded-full bg-emerald-400 opacity-75" /><span className="relative rounded-full h-1.5 w-1.5 bg-emerald-500" /></span>
              <span className="text-[10px] text-emerald-400 uppercase">LIVE</span>
            </span>
          </div>
          <div style={{ height: 300 }}>
            <iframe
              src="https://s.tradingview.com/widgetembed/?frameElementId=tv_m&symbol=BINANCE:BTCUSDT&interval=D&hidesidetoolbar=1&symboledit=1&saveimage=0&toolbarbg=0a0a0f&studies=[]&theme=dark&style=1&timezone=exchange&withdateranges=1&showpopupbutton=0&locale=en&width=100%25&height=100%25"
              className="w-full h-full border-0"
              title="BTC/USDT"
            />
          </div>
        </div>
      </div>

      {/* ── News ── */}
      <div className="px-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold">{ko ? "뉴스" : "Latest News"}</h2>
          <Link href={`/${lang}/posts`} className="text-xs text-blue-400">{ko ? "전체 →" : "All →"}</Link>
        </div>
        <div className="space-y-2">
          {news.slice(0, 6).map((item, i) => (
            <a
              key={i}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start gap-3 rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3 active:bg-white/[0.06] transition-colors"
            >
              <div className="flex-1 min-w-0">
                <p className="text-xs text-zinc-200 leading-relaxed line-clamp-2">{decodeHTML(item.title)}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-[10px] text-zinc-600">{item.source ?? "News"}</span>
                  <span className="text-[10px] text-zinc-700">{timeAgo(item.publishedAt.toString())}</span>
                </div>
              </div>
              <svg className="w-4 h-4 text-zinc-700 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
              </svg>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
