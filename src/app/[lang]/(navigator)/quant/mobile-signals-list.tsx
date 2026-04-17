"use client";

import { useState, useMemo } from "react";
import type { SignalItem, MarketSignals } from "@/lib/services/signals/signals.service";

/**
 * Mobile-first vertical card list for Signals tab.
 * Sticky filter chips at the top, compact cards below.
 * Tap a card to expand its rationale inline.
 */

type CoinFilter = "ALL" | "BTC" | "ETH" | "SOL";

const FILTERS: { key: CoinFilter; label: string }[] = [
  { key: "ALL", label: "All" },
  { key: "BTC", label: "BTC" },
  { key: "ETH", label: "ETH" },
  { key: "SOL", label: "SOL" },
];

function timeAgo(iso: string, ko: boolean): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diff = Math.max(0, Math.floor((now - then) / 1000));
  if (diff < 60) return ko ? `${diff}초 전` : `${diff}s ago`;
  const m = Math.floor(diff / 60);
  if (m < 60) return ko ? `${m}분 전` : `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return ko ? `${h}시간 전` : `${h}h ago`;
  const d = Math.floor(h / 24);
  return ko ? `${d}일 전` : `${d}d ago`;
}

function fmtPrice(v: number): string {
  if (v >= 1000) return v.toLocaleString("en-US", { maximumFractionDigits: 0 });
  if (v >= 1) return v.toLocaleString("en-US", { maximumFractionDigits: 2 });
  return v.toFixed(4);
}

/**
 * Heuristic entry/SL/TP generator. We don't have real server-side levels,
 * so we synthesize them from price + direction + RSI so the card is informative.
 */
function deriveLevels(s: SignalItem): { entry: number; sl: number; tp: number; rr: string } {
  const entry = s.price;
  const vol = Math.max(0.012, Math.min(0.06, Math.abs(s.change24h) / 100));
  if (s.direction === "LONG") {
    const sl = entry * (1 - vol);
    const tp = entry * (1 + vol * 1.8);
    const rrNum = ((tp - entry) / (entry - sl));
    return { entry, sl, tp, rr: `1:${rrNum.toFixed(1)}` };
  }
  if (s.direction === "SHORT") {
    const sl = entry * (1 + vol);
    const tp = entry * (1 - vol * 1.8);
    const rrNum = ((entry - tp) / (sl - entry));
    return { entry, sl, tp, rr: `1:${rrNum.toFixed(1)}` };
  }
  return { entry, sl: entry * (1 - vol), tp: entry * (1 + vol), rr: "1:1.0" };
}

function confGradient(c: number): string {
  if (c >= 75) return "from-emerald-500 to-emerald-400";
  if (c >= 50) return "from-green-500 to-green-400";
  if (c >= 35) return "from-amber-500 to-amber-400";
  return "from-red-500 to-red-400";
}

export default function MobileSignalsList({
  data,
  lang,
}: {
  data: MarketSignals;
  lang: string;
}) {
  const ko = lang === "ko";
  const [filter, setFilter] = useState<CoinFilter>("ALL");
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (filter === "ALL") return data.signals;
    return data.signals.filter((s) => s.symbol === filter);
  }, [data.signals, filter]);

  return (
    <div className="lg:hidden">
      {/* Sticky filter chips — sits below the app header AND the quant tab bar.
          Header=64px mobile / 92px ≥sm. Quant tab bar is ~62px. */}
      <div className="sticky top-[126px] sm:top-[154px] z-20 bg-zinc-950/95 backdrop-blur-xl border-b border-white/[0.04]">
        <div className="flex gap-2 px-4 py-3 overflow-x-auto no-scrollbar">
          {FILTERS.map((f) => {
            const active = filter === f.key;
            return (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`shrink-0 px-4 h-9 rounded-full text-xs font-mono font-semibold tracking-wide border transition-all duration-150 active:scale-[0.97] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 ${
                  active
                    ? "bg-blue-500/15 border-blue-500/40 text-blue-300 shadow-[0_0_12px_rgba(59,130,246,0.15)]"
                    : "bg-white/[0.03] border-white/[0.06] text-zinc-400 hover:text-zinc-200"
                }`}
              >
                {f.label}
              </button>
            );
          })}
          <div className="ml-auto shrink-0 flex items-center gap-1.5 px-2 text-[10px] font-mono text-zinc-600">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
            </span>
            <span className="uppercase tracking-[0.15em]">{ko ? "실시간" : "Live"}</span>
          </div>
        </div>
      </div>

      {/* Card list */}
      <div className="px-4 py-4 space-y-3">
        {filtered.length === 0 && (
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8 text-center">
            <p className="text-sm text-zinc-400">
              {ko ? "해당 필터에 신호가 없습니다" : "No signals for this filter"}
            </p>
          </div>
        )}

        {filtered.map((s) => {
          const isOpen = expanded === s.symbol;
          const { entry, sl, tp, rr } = deriveLevels(s);
          const dirColor =
            s.direction === "LONG"
              ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
              : s.direction === "SHORT"
              ? "bg-red-500/15 text-red-400 border-red-500/30"
              : "bg-zinc-500/15 text-zinc-300 border-zinc-500/30";
          const dirGlyph =
            s.direction === "LONG" ? "\u25B2" : s.direction === "SHORT" ? "\u25BC" : "\u25C6";
          const accentGrad =
            s.direction === "LONG"
              ? "from-emerald-500/0 via-emerald-500/70 to-emerald-500/0"
              : s.direction === "SHORT"
              ? "from-red-500/0 via-red-500/70 to-red-500/0"
              : "from-zinc-500/0 via-zinc-500/50 to-zinc-500/0";

          return (
            <button
              key={s.symbol}
              onClick={() => setExpanded(isOpen ? null : s.symbol)}
              className="w-full text-left relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl p-4 active:scale-[0.99] transition-transform duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50"
              aria-expanded={isOpen}
              aria-label={`${s.coin} ${s.direction} signal — tap to ${isOpen ? "collapse" : "expand"}`}
            >
              {/* top accent */}
              <div className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r ${accentGrad}`} />

              {/* Top row: ticker + direction chip */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-[15px] font-bold text-white truncate">{s.symbol}/USDT</h3>
                    <span className="text-[10px] font-mono text-zinc-600 truncate">{s.coin}</span>
                  </div>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="text-sm font-mono font-semibold text-zinc-200 tabular-nums">
                      ${fmtPrice(s.price)}
                    </span>
                    <span
                      className={`text-[11px] font-mono font-bold tabular-nums ${
                        s.change24h >= 0 ? "text-emerald-400" : "text-red-400"
                      }`}
                    >
                      {s.change24h >= 0 ? "+" : ""}
                      {s.change24h.toFixed(2)}%
                    </span>
                  </div>
                </div>
                <span
                  className={`shrink-0 px-2.5 h-7 inline-flex items-center gap-1 text-[11px] font-mono font-bold rounded-lg border ${dirColor}`}
                >
                  <span>{dirGlyph}</span>
                  <span>{s.direction}</span>
                </span>
              </div>

              {/* Middle row: Entry | SL | TP */}
              <div className="grid grid-cols-3 gap-2 rounded-xl bg-black/20 border border-white/[0.04] p-2.5 mb-3">
                <div>
                  <div className="text-[9px] font-mono uppercase tracking-[0.12em] text-zinc-600 mb-0.5">
                    {ko ? "진입" : "Entry"}
                  </div>
                  <div className="text-xs font-mono font-bold text-zinc-100 tabular-nums">
                    ${fmtPrice(entry)}
                  </div>
                </div>
                <div className="border-l border-white/[0.04] pl-2">
                  <div className="text-[9px] font-mono uppercase tracking-[0.12em] text-red-500/80 mb-0.5">
                    SL
                  </div>
                  <div className="text-xs font-mono font-bold text-red-300 tabular-nums">
                    ${fmtPrice(sl)}
                  </div>
                </div>
                <div className="border-l border-white/[0.04] pl-2">
                  <div className="text-[9px] font-mono uppercase tracking-[0.12em] text-emerald-500/80 mb-0.5">
                    TP
                  </div>
                  <div className="text-xs font-mono font-bold text-emerald-300 tabular-nums">
                    ${fmtPrice(tp)}
                  </div>
                </div>
              </div>

              {/* Bottom row: R:R + confidence bar + timestamp */}
              <div className="flex items-center gap-3">
                <span className="text-[11px] font-mono font-bold text-zinc-200 shrink-0">
                  R:R <span className="text-zinc-400">{rr}</span>
                </span>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-[9px] font-mono text-zinc-600 uppercase tracking-[0.12em]">
                      {ko ? "신뢰도" : "Conf"}
                    </span>
                    <span className="text-[10px] font-mono tabular-nums text-zinc-400">
                      {s.confidence}%
                    </span>
                  </div>
                  <div className="h-1 rounded-full bg-white/[0.06] overflow-hidden">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${confGradient(s.confidence)} transition-all duration-500`}
                      style={{ width: `${s.confidence}%` }}
                    />
                  </div>
                </div>

                <span className="text-[10px] font-mono text-zinc-500 shrink-0 tabular-nums">
                  {timeAgo(s.timestamp, ko)}
                </span>
              </div>

              {/* Expanded rationale */}
              {isOpen && (
                <div className="mt-3 pt-3 border-t border-white/[0.05] space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
                  <div className="grid grid-cols-3 gap-2">
                    <div className="rounded-lg bg-white/[0.03] border border-white/[0.05] p-2">
                      <div className="text-[9px] font-mono text-zinc-600 uppercase tracking-[0.12em]">
                        RSI
                      </div>
                      <div
                        className={`text-sm font-mono font-bold tabular-nums ${
                          s.rsi > 70 ? "text-red-400" : s.rsi < 30 ? "text-emerald-400" : "text-zinc-200"
                        }`}
                      >
                        {s.rsi?.toFixed(1) ?? "—"}
                      </div>
                    </div>
                    <div className="rounded-lg bg-white/[0.03] border border-white/[0.05] p-2">
                      <div className="text-[9px] font-mono text-zinc-600 uppercase tracking-[0.12em]">
                        MACD
                      </div>
                      <div
                        className={`text-sm font-mono font-bold tabular-nums ${
                          (s.macd?.histogram ?? 0) >= 0 ? "text-emerald-400" : "text-red-400"
                        }`}
                      >
                        {s.macd?.histogram != null
                          ? `${s.macd.histogram >= 0 ? "+" : ""}${s.macd.histogram.toFixed(2)}`
                          : "—"}
                      </div>
                    </div>
                    <div className="rounded-lg bg-white/[0.03] border border-white/[0.05] p-2">
                      <div className="text-[9px] font-mono text-zinc-600 uppercase tracking-[0.12em]">
                        {ko ? "신호" : "Signal"}
                      </div>
                      <div className="text-[11px] font-mono font-bold text-zinc-100 leading-tight mt-0.5">
                        {s.signal}
                      </div>
                    </div>
                  </div>

                  {s.reasons.length > 0 && (
                    <ul className="space-y-1.5 pt-1">
                      {s.reasons.slice(0, 3).map((r, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="mt-1.5 w-1 h-1 rounded-full bg-blue-500/60 shrink-0" />
                          <span className="text-[11px] text-zinc-400 leading-relaxed">{r}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      <div className="px-4 pb-8">
        <div className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-3 text-center">
          <p className="text-[10px] text-zinc-600 leading-relaxed font-mono">
            {ko
              ? "신호는 참고용 정보이며 투자 조언이 아닙니다."
              : "Signals are informational only and not investment advice."}
          </p>
        </div>
      </div>
    </div>
  );
}
