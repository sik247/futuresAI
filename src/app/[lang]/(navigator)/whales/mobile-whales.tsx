"use client";

import { useState } from "react";

type TokenEntry = { symbol: string; balance: number; usdValue: number };
type FigureWalletData = { ethBalance: number; ethUsd: number; tokens: TokenEntry[] };
type Figure = {
  name: string;
  role: string;
  image: string;
  walletAddress: string;
  stance: string;
  knownHoldings: string[];
  category: string;
  walletData?: FigureWalletData;
};

type HLPosition = {
  coin: string;
  direction: string;
  size: number;
  entryPrice: number;
  unrealizedPnl: number;
  roe: number;
  leverage: number;
};

type HLWhale = {
  name: string;
  address: string;
  accountValue: number;
  totalNotional: number;
  positions: HLPosition[];
};

type HLTrade = {
  whale: string;
  coin: string;
  side: string;
  price: number;
  size: number;
  notional: number;
  closedPnl: number;
  time: number;
};

/* ──────────────── helpers ──────────────── */
function fmtUsd(v: number) {
  if (v >= 1_000_000_000) return `$${(v / 1_000_000_000).toFixed(2)}B`;
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(1)}K`;
  return `$${v.toFixed(0)}`;
}

function truncAddr(addr: string) {
  if (!addr) return "";
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function timeAgo(ms: number, ko: boolean) {
  const s = Math.max(0, Math.floor((Date.now() - ms) / 1000));
  if (s < 60) return ko ? `${s}초 전` : `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return ko ? `${m}분 전` : `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return ko ? `${h}시간 전` : `${h}h ago`;
  const d = Math.floor(h / 24);
  return ko ? `${d}일 전` : `${d}d ago`;
}

/* ──────────────── Entity chip ──────────────── */
function EntityChip({ figure, ko }: { figure: Figure; ko: boolean }) {
  const d = figure.walletData;
  const delta = d?.ethUsd ?? 0;
  const hasDelta = delta > 0;
  return (
    <a
      href={`https://etherscan.io/address/${figure.walletAddress}`}
      target="_blank"
      rel="noopener noreferrer"
      className="shrink-0 w-[140px] rounded-2xl border border-white/[0.06] bg-white/[0.03] hover:bg-white/[0.06] transition-colors p-3 cursor-pointer active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50"
    >
      <div className="flex items-center gap-2 mb-1.5">
        {figure.image ? (
          <img src={figure.image} alt={figure.name} className="w-7 h-7 rounded-full object-cover border border-white/[0.08]" />
        ) : (
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white flex items-center justify-center text-[10px] font-bold">
            {figure.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}
          </div>
        )}
        <span className="text-[11px] font-semibold text-white truncate">{figure.name}</span>
      </div>
      <div className="text-[10px] font-mono text-zinc-500 truncate mb-1">
        {figure.role}
      </div>
      {hasDelta ? (
        <div className="text-[12px] font-mono font-bold text-emerald-400 tabular-nums">
          {fmtUsd(delta)}
        </div>
      ) : (
        <div className="text-[10px] font-mono text-zinc-600">{ko ? "추적 중" : "tracked"}</div>
      )}
    </a>
  );
}

/* ──────────────── Move row ──────────────── */
function MoveRow({
  whale,
  coin,
  side,
  notional,
  time,
  onClick,
  ko,
}: {
  whale: string;
  coin: string;
  side: string;
  notional: number;
  time: number;
  onClick: () => void;
  ko: boolean;
}) {
  const up = side === "BUY";
  const sideLabel = up ? (ko ? "매수" : "BUY") : (ko ? "매도" : "SELL");
  const sideClr = up
    ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
    : "bg-red-500/15 text-red-400 border-red-500/30";

  return (
    <button
      onClick={onClick}
      className="w-full text-left flex items-center gap-3 px-4 py-3 border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors cursor-pointer active:scale-[0.995] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40"
    >
      {/* Side indicator dot */}
      <span className={`shrink-0 w-2 h-2 rounded-full ${up ? "bg-emerald-500" : "bg-red-500"}`} />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-[12px] font-mono text-zinc-300 truncate">{whale}</span>
          <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${sideClr}`}>
            {sideLabel}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[11px] font-mono text-zinc-500">{coin}</span>
          <span className="text-zinc-800">·</span>
          <span className="text-[10px] font-mono text-zinc-600 tabular-nums">{timeAgo(time, ko)}</span>
        </div>
      </div>

      <div className="shrink-0 text-right">
        <div className={`text-[13px] font-mono font-bold tabular-nums ${up ? "text-emerald-400" : "text-red-400"}`}>
          {fmtUsd(notional)}
        </div>
      </div>
    </button>
  );
}

/* ──────────────── Bottom sheet ──────────────── */
function MoveDetailSheet({
  trade,
  whaleMatch,
  onClose,
  ko,
}: {
  trade: HLTrade;
  whaleMatch: HLWhale | undefined;
  onClose: () => void;
  ko: boolean;
}) {
  const up = trade.side === "BUY";
  return (
    <div className="fixed inset-0 z-50 flex items-end lg:hidden" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" />

      {/* Sheet */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full rounded-t-3xl bg-zinc-950 border-t border-white/[0.08] shadow-2xl animate-in slide-in-from-bottom duration-300 pb-[env(safe-area-inset-bottom)]"
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-2.5 pb-1">
          <span className="w-10 h-1 rounded-full bg-white/[0.15]" />
        </div>

        <div className="p-5 space-y-4 max-h-[70dvh] overflow-y-auto">
          {/* Header */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span
                className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                  up
                    ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                    : "bg-red-500/15 text-red-400 border-red-500/30"
                }`}
              >
                {up ? (ko ? "매수" : "BUY") : (ko ? "매도" : "SELL")}
              </span>
              <span className="text-[11px] font-mono text-zinc-500">
                {timeAgo(trade.time, ko)}
              </span>
            </div>
            <h3 className="text-lg font-bold text-white">
              {trade.whale} <span className="text-zinc-500 text-sm font-normal">·</span>{" "}
              <span className="font-mono">{trade.coin}</span>
            </h3>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl bg-white/[0.03] border border-white/[0.05] p-3">
              <div className="text-[10px] font-mono uppercase tracking-[0.12em] text-zinc-600 mb-1">
                {ko ? "명목 가치" : "Notional"}
              </div>
              <div className={`text-base font-mono font-bold tabular-nums ${up ? "text-emerald-400" : "text-red-400"}`}>
                {fmtUsd(trade.notional)}
              </div>
            </div>
            <div className="rounded-xl bg-white/[0.03] border border-white/[0.05] p-3">
              <div className="text-[10px] font-mono uppercase tracking-[0.12em] text-zinc-600 mb-1">
                {ko ? "가격" : "Price"}
              </div>
              <div className="text-base font-mono font-bold tabular-nums text-zinc-100">
                ${trade.price >= 1 ? trade.price.toLocaleString(undefined, { maximumFractionDigits: 2 }) : trade.price.toFixed(4)}
              </div>
            </div>
            <div className="rounded-xl bg-white/[0.03] border border-white/[0.05] p-3">
              <div className="text-[10px] font-mono uppercase tracking-[0.12em] text-zinc-600 mb-1">
                {ko ? "수량" : "Size"}
              </div>
              <div className="text-base font-mono font-bold tabular-nums text-zinc-100">
                {trade.size.toFixed(4)}
              </div>
            </div>
            <div className="rounded-xl bg-white/[0.03] border border-white/[0.05] p-3">
              <div className="text-[10px] font-mono uppercase tracking-[0.12em] text-zinc-600 mb-1">
                {ko ? "실현 PnL" : "Closed PnL"}
              </div>
              <div
                className={`text-base font-mono font-bold tabular-nums ${
                  trade.closedPnl > 0
                    ? "text-emerald-400"
                    : trade.closedPnl < 0
                    ? "text-red-400"
                    : "text-zinc-500"
                }`}
              >
                {trade.closedPnl !== 0
                  ? `${trade.closedPnl > 0 ? "+" : ""}${fmtUsd(trade.closedPnl)}`
                  : "—"}
              </div>
            </div>
          </div>

          {/* Whale panel */}
          {whaleMatch && (
            <div className="rounded-xl bg-white/[0.03] border border-white/[0.05] p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono uppercase tracking-[0.12em] text-zinc-500">
                  {ko ? "지갑" : "Wallet"}
                </span>
                <a
                  href={`https://hyperdash.info/trader/${whaleMatch.address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] font-mono text-blue-400 hover:text-blue-300 transition-colors"
                >
                  {truncAddr(whaleMatch.address)} ↗
                </a>
              </div>
              <div className="flex items-center justify-between text-[12px] font-mono">
                <span className="text-zinc-500">{ko ? "계좌 가치" : "Account Value"}</span>
                <span className="text-white tabular-nums">{fmtUsd(whaleMatch.accountValue)}</span>
              </div>
              <div className="flex items-center justify-between text-[12px] font-mono">
                <span className="text-zinc-500">{ko ? "명목 총액" : "Notional"}</span>
                <span className="text-blue-400 tabular-nums">{fmtUsd(whaleMatch.totalNotional)}</span>
              </div>
              <div className="flex items-center justify-between text-[12px] font-mono">
                <span className="text-zinc-500">{ko ? "오픈 포지션" : "Open Positions"}</span>
                <span className="text-white tabular-nums">{whaleMatch.positions.length}</span>
              </div>
            </div>
          )}

          <button
            onClick={onClose}
            className="w-full h-11 rounded-xl bg-white/[0.05] border border-white/[0.08] text-sm font-medium text-zinc-300 hover:bg-white/[0.08] transition-colors cursor-pointer"
          >
            {ko ? "닫기" : "Close"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ──────────────── Main ──────────────── */
export default function MobileWhales({
  figures,
  hlWhales,
  hlTrades,
  lang,
}: {
  figures: Figure[];
  hlWhales: HLWhale[];
  hlTrades: HLTrade[];
  lang: string;
}) {
  const ko = lang === "ko";
  const [selected, setSelected] = useState<HLTrade | null>(null);

  const trackedFigures = figures
    .filter((f) => f.walletAddress)
    .sort((a, b) => (b.walletData?.ethUsd ?? 0) - (a.walletData?.ethUsd ?? 0));

  const top10 = hlTrades.slice(0, 10);

  const whaleMatch = selected
    ? hlWhales.find((w) => w.name === selected.whale || w.address.toLowerCase().includes(selected.whale.toLowerCase()))
    : undefined;

  return (
    <div className="lg:hidden">
      {/* Entity chips strip */}
      <div className="border-b border-white/[0.04]">
        <div className="px-4 py-3 flex items-center justify-between">
          <span className="text-[10px] font-mono uppercase tracking-[0.15em] text-zinc-500">
            {ko ? "주요 인물" : "Entities"}
          </span>
          <span className="text-[9px] font-mono text-zinc-700 tabular-nums">
            {trackedFigures.length} {ko ? "추적 중" : "tracked"}
          </span>
        </div>
        <div className="flex gap-2.5 px-4 pb-3 overflow-x-auto no-scrollbar">
          {trackedFigures.slice(0, 12).map((f) => (
            <EntityChip key={f.name} figure={f} ko={ko} />
          ))}
          {trackedFigures.length === 0 && (
            <div className="text-[11px] font-mono text-zinc-600 py-4">
              {ko ? "추적 중인 지갑 없음" : "No tracked wallets yet"}
            </div>
          )}
        </div>
      </div>

      {/* Top 10 moves feed */}
      <div>
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-1 h-4 rounded-full bg-blue-500/70" />
            <span className="text-[12px] font-semibold tracking-tight text-zinc-200">
              {ko ? "최근 고래 거래 TOP 10" : "Top 10 Whale Moves"}
            </span>
          </div>
          <span className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-400">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
            </span>
            <span className="uppercase tracking-[0.15em]">{ko ? "실시간" : "Live"}</span>
          </span>
        </div>

        {top10.length === 0 ? (
          <div className="px-4 py-8 text-center text-[11px] font-mono text-zinc-600">
            {ko ? "최근 거래 없음" : "No recent trades"}
          </div>
        ) : (
          <div>
            {top10.map((t, i) => (
              <MoveRow
                key={`${t.whale}-${t.time}-${i}`}
                whale={t.whale}
                coin={t.coin}
                side={t.side}
                notional={t.notional}
                time={t.time}
                ko={ko}
                onClick={() => setSelected(t)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer note */}
      <div className="px-4 py-6 text-center">
        <p className="text-[10px] font-mono text-zinc-700">
          {ko
            ? "데이터 출처: Hyperliquid · Etherscan"
            : "Data: Hyperliquid · Etherscan"}
        </p>
      </div>

      {/* Detail sheet */}
      {selected && (
        <MoveDetailSheet
          trade={selected}
          whaleMatch={whaleMatch}
          onClose={() => setSelected(null)}
          ko={ko}
        />
      )}
    </div>
  );
}
