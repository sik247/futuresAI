"use client";

import { useMemo, useState } from "react";

/* ─────────────── Types ─────────────── */
type Market = {
  question: string;
  outcomePrices: number[];
  outcomes: string[];
  volume: number | string;
  groupItemTitle?: string;
  groupItemThreshold?: string;
};

type Event = {
  id: string;
  title: string;
  slug: string;
  image: string;
  volume: number | string;
  liquidity: number | string;
  endDate: string;
  startDate: string;
  volume24hr: number;
  category: string;
  markets: Market[];
};

type Category = "all" | "crypto" | "politics" | "business" | "korea";

/* ─────────────── Helpers ─────────────── */
function formatVolume(v: number | string): string {
  const n = typeof v === "string" ? parseFloat(v) : v;
  if (isNaN(n) || n === 0) return "";
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

function formatEndDate(iso: string, ko: boolean): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const now = Date.now();
  const diff = d.getTime() - now;
  if (diff < 0) return ko ? "종료됨" : "Closed";
  const hrs = diff / (1000 * 60 * 60);
  if (hrs < 24) return ko ? `${Math.round(hrs)}시간 후` : `in ${Math.round(hrs)}h`;
  const days = hrs / 24;
  if (days < 30) return ko ? `${Math.round(days)}일 후` : `in ${Math.round(days)}d`;
  return d.toLocaleDateString(ko ? "ko-KR" : "en-US", { month: "short", day: "numeric" });
}

const KOREA_KEYWORDS = [
  "korea", "korean", "south korea", "north korea", "dprk",
  "samsung", "hyundai", "kpop", "k-pop", "kospi",
];

function isKorea(e: Event): boolean {
  const t = `${e.title} ${e.markets.map((m) => m.question).join(" ")}`.toLowerCase();
  return KOREA_KEYWORDS.some((kw) => t.includes(kw));
}

/* ─────────────── Category Chip ─────────────── */
const CATEGORIES: { key: Category; en: string; ko: string }[] = [
  { key: "all", en: "All", ko: "전체" },
  { key: "crypto", en: "Crypto", ko: "크립토" },
  { key: "politics", en: "Politics", ko: "정치" },
  { key: "business", en: "Business", ko: "경제" },
  { key: "korea", en: "Korea/Asia", ko: "한국/아시아" },
];

/* ─────────────── Verdict Card ─────────────── */
function VerdictCard({ event, ko }: { event: Event; ko: boolean }) {
  // For binary / up-down markets, pick YES probability
  const firstMarket = event.markets[0];
  const yesRaw = firstMarket?.outcomePrices?.[0]
    ? parseFloat(String(firstMarket.outcomePrices[0]))
    : 0.5;
  const yesPct = Math.round(yesRaw * 100);
  const noPct = 100 - yesPct;

  const isUpDown =
    event.title.toLowerCase().includes("up or down") ||
    event.title.toLowerCase().includes("up/down");

  const isBinary =
    !isUpDown && event.markets.length === 1 && firstMarket?.outcomes?.length === 2;

  // Verdict label: either a clear winner or the market title itself serves as the headline
  const dominant = yesPct > 55 ? "YES" : yesPct < 45 ? "NO" : "TOSS";
  const volLabel = formatVolume(event.volume);
  const endLabel = formatEndDate(event.endDate, ko);

  const yesLabel = isUpDown ? (ko ? "상승" : "Up") : ko ? "예" : "Yes";
  const noLabel = isUpDown ? (ko ? "하락" : "Down") : ko ? "아니오" : "No";

  // Accent for dominant side
  const accent =
    dominant === "YES"
      ? "from-emerald-500/0 via-emerald-500/80 to-emerald-500/0"
      : dominant === "NO"
      ? "from-red-500/0 via-red-500/80 to-red-500/0"
      : "from-zinc-500/0 via-zinc-500/60 to-zinc-500/0";

  return (
    <a
      href={`https://polymarket.com/event/${event.slug || event.id}`}
      target="_blank"
      rel="noopener noreferrer"
      className="relative block overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl p-4 active:scale-[0.99] transition-transform duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50"
    >
      {/* Top accent bar */}
      <div className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r ${accent}`} />

      {/* Header: image + category + end date */}
      <div className="flex items-center gap-2 mb-2.5">
        {event.image ? (
          <img
            src={event.image}
            alt=""
            className="w-8 h-8 rounded-full object-cover shrink-0 border border-white/[0.08]"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-white/[0.05] border border-white/[0.08] shrink-0" />
        )}
        <div className="flex-1 min-w-0 flex items-center gap-1.5 flex-wrap">
          <span className="text-[9px] font-mono uppercase tracking-[0.12em] text-zinc-500">
            {event.category === "crypto"
              ? "Crypto"
              : event.category === "politics"
              ? ko
                ? "정치"
                : "Politics"
              : event.category === "business"
              ? ko
                ? "경제"
                : "Business"
              : ko
              ? "기타"
              : "Other"}
          </span>
          {endLabel && (
            <>
              <span className="text-zinc-800">·</span>
              <span className="text-[9px] font-mono text-zinc-500 tabular-nums">{endLabel}</span>
            </>
          )}
        </div>
      </div>

      {/* Verdict headline — uses market title as the headline since no AI verdict in data model.
          This is prominent and readable. */}
      <h3 className="text-[16px] font-bold text-white leading-tight mb-3 line-clamp-2 tracking-tight">
        {event.title}
      </h3>

      {/* Odds bar YES / NO (binary/up-down) */}
      {(isBinary || isUpDown) && (
        <div className="mb-3">
          <div className="flex items-center justify-between text-[11px] font-mono mb-1">
            <span className="text-emerald-400 font-bold">
              {yesLabel} {yesPct}%
            </span>
            <span className="text-red-400 font-bold">
              {noLabel} {noPct}%
            </span>
          </div>
          <div className="h-2 rounded-full overflow-hidden bg-white/[0.05] flex">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-500"
              style={{ width: `${yesPct}%` }}
            />
            <div
              className="h-full bg-gradient-to-r from-red-500 to-red-400 transition-all duration-500"
              style={{ width: `${noPct}%` }}
            />
          </div>
        </div>
      )}

      {/* Multi-outcome: show top 2 outcomes */}
      {!isBinary && !isUpDown && event.markets.length > 1 && (
        <div className="space-y-1.5 mb-3">
          {event.markets.slice(0, 2).map((m, i) => {
            const raw = m.outcomePrices?.[0]
              ? parseFloat(String(m.outcomePrices[0]))
              : 0.5;
            const pct = Math.round(raw * 100);
            const title = m.groupItemTitle || m.question || m.outcomes?.[0] || "—";
            return (
              <div key={i} className="flex items-center gap-2">
                <span className="flex-1 text-[12px] text-zinc-300 truncate">{title}</span>
                <div className="w-16 h-1.5 rounded-full bg-white/[0.05] overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-[12px] font-mono font-bold text-white tabular-nums w-10 text-right">
                  {pct}%
                </span>
              </div>
            );
          })}
          {event.markets.length > 2 && (
            <div className="text-[10px] font-mono text-zinc-600 pt-0.5">
              +{event.markets.length - 2} {ko ? "더 보기" : "more"}
            </div>
          )}
        </div>
      )}

      {/* Supporting data footer */}
      <div className="flex items-center gap-3 pt-2.5 border-t border-white/[0.04]">
        <span className="flex items-center gap-1.5">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-60" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500" />
          </span>
          <span className="text-[10px] font-mono font-bold tracking-wider text-red-400">LIVE</span>
        </span>
        {volLabel && (
          <>
            <span className="text-zinc-800">·</span>
            <span className="text-[10px] font-mono text-zinc-500 tabular-nums">
              {volLabel} {ko ? "거래량" : "Vol"}
            </span>
          </>
        )}
        {event.volume24hr > 0 && (
          <>
            <span className="text-zinc-800">·</span>
            <span className="text-[10px] font-mono text-emerald-400 tabular-nums">
              {formatVolume(event.volume24hr)} 24h
            </span>
          </>
        )}
        <span className="ml-auto shrink-0 text-[10px] font-mono text-zinc-600">↗</span>
      </div>
    </a>
  );
}

/* ─────────────── Main ─────────────── */
export default function MobileMarkets({
  events,
  lang,
}: {
  events: Event[];
  lang: string;
}) {
  const ko = lang === "ko";
  const [cat, setCat] = useState<Category>("all");

  const filtered = useMemo(() => {
    let arr = events;
    if (cat === "korea") arr = arr.filter(isKorea);
    else if (cat !== "all") arr = arr.filter((e) => e.category === cat);
    return arr
      .slice()
      .sort((a, b) => parseFloat(String(b.volume || 0)) - parseFloat(String(a.volume || 0)));
  }, [events, cat]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: events.length, crypto: 0, politics: 0, business: 0, korea: 0 };
    for (const e of events) {
      c[e.category] = (c[e.category] || 0) + 1;
      if (isKorea(e)) c.korea++;
    }
    return c;
  }, [events]);

  return (
    <div className="lg:hidden">
      {/* Sticky category chips */}
      <div className="sticky top-[64px] sm:top-[92px] z-20 bg-[#0d0e14]/95 backdrop-blur-xl border-b border-white/[0.04]">
        <div className="flex gap-2 px-4 py-3 overflow-x-auto no-scrollbar">
          {CATEGORIES.map((c) => {
            const active = cat === c.key;
            const count = counts[c.key] || 0;
            return (
              <button
                key={c.key}
                onClick={() => setCat(c.key)}
                className={`shrink-0 px-4 h-9 rounded-full text-xs font-semibold tracking-wide border transition-all duration-150 active:scale-[0.97] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 ${
                  active
                    ? "bg-blue-500/20 border-blue-500/40 text-blue-200 shadow-[0_0_12px_rgba(59,130,246,0.15)]"
                    : "bg-white/[0.03] border-white/[0.06] text-zinc-400"
                }`}
              >
                {ko ? c.ko : c.en}
                <span className="ml-1.5 text-[10px] opacity-60 tabular-nums">{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Verdict feed */}
      <div className="px-4 py-4 space-y-3">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <svg className="w-10 h-10 text-zinc-800 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <p className="text-sm text-zinc-500">
              {ko ? "이 카테고리에 예측 시장이 없습니다" : "No prediction markets in this category"}
            </p>
          </div>
        ) : (
          filtered.slice(0, 40).map((e) => <VerdictCard key={e.id} event={e} ko={ko} />)
        )}
      </div>

      <div className="px-4 py-4 text-center">
        <p className="text-[10px] font-mono text-zinc-700">
          {ko
            ? "데이터 출처: Polymarket. 가격은 시장 확률을 반영합니다."
            : "Data: Polymarket. Prices reflect market probability."}
        </p>
      </div>
    </div>
  );
}
