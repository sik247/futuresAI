"use client";

import { useState } from "react";
import WhaleActivityFeed from "./whale-activity-feed";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type TokenEntry = {
  symbol: string;
  balance: number;
  usdValue: number;
};

type FigureWalletData = {
  ethBalance: number;
  ethUsd: number;
  tokens: TokenEntry[];
};

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

export type WhaleDashboardProps = {
  ethPrice: number;
  figures: Figure[];
  hlWhales: HLWhale[];
  hlTrades: HLTrade[];
  lang: string;
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function fmtUsd(v: number) {
  if (v >= 1_000_000_000) return `$${(v / 1_000_000_000).toFixed(2)}B`;
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
  return `$${v.toFixed(0)}`;
}

function fmtNum(v: number) {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(2)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}K`;
  if (v >= 1) return v.toFixed(2);
  return v.toFixed(4);
}

function tradeTimeAgo(ms: number) {
  const seconds = Math.floor((Date.now() - ms) / 1000);
  if (seconds < 0) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function Initials({ name, size = 32 }: { name: string; size?: number }) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <div
      className="rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-white font-bold shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.35 }}
    >
      {initials}
    </div>
  );
}

function Avatar({ image, name, size = 32 }: { image: string; name: string; size?: number }) {
  if (!image) return <Initials name={name} size={size} />;
  return (
    <div
      className="rounded-full overflow-hidden border border-white/[0.08] shrink-0"
      style={{ width: size, height: size }}
    >
      <img src={image} alt={name} className="w-full h-full object-cover" />
    </div>
  );
}

function StanceBadge({ stance }: { stance: string }) {
  if (!stance) return null;
  const cls =
    stance === "Bullish"
      ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
      : stance === "Bearish"
      ? "bg-red-500/15 text-red-400 border-red-500/30"
      : "bg-zinc-500/15 text-zinc-400 border-zinc-500/30";
  return (
    <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full border ${cls}`}>
      {stance}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Sidebar Figure Row                                                 */
/* ------------------------------------------------------------------ */

function FigureRow({ figure }: { figure: Figure }) {
  const [expanded, setExpanded] = useState(false);
  const tracked = !!figure.walletAddress;
  const hasData = tracked && figure.walletData &&
    (figure.walletData.ethBalance > 0 || figure.walletData.tokens.length > 0);

  return (
    <div className={`border-b border-white/[0.04] ${tracked ? "" : "opacity-50"}`}>
      <button
        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-white/[0.03] transition-colors text-left"
        onClick={() => tracked && setExpanded((e) => !e)}
        disabled={!tracked}
      >
        <div className="relative shrink-0">
          <Avatar image={figure.image} name={figure.name} size={28} />
          {tracked && (
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-[#0d0e14]" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-[11px] font-semibold text-white truncate leading-tight">
              {figure.name}
            </span>
            <StanceBadge stance={figure.stance} />
          </div>
          <div className="flex items-center gap-1 mt-0.5">
            <span className="text-[9px] font-mono text-zinc-500 truncate">{figure.role}</span>
          </div>
        </div>
        {hasData && figure.walletData && (
          <div className="text-right shrink-0">
            <div className="text-[10px] font-mono text-white">
              {fmtNum(figure.walletData.ethBalance)} ETH
            </div>
            <div className="text-[9px] font-mono text-emerald-400">
              {fmtUsd(figure.walletData.ethUsd)}
            </div>
          </div>
        )}
        {tracked && !hasData && (
          <div className="text-[9px] font-mono text-zinc-600 shrink-0">tracked</div>
        )}
        {!tracked && (
          <div className="flex flex-wrap gap-1 shrink-0 max-w-[80px] justify-end">
            {figure.knownHoldings.slice(0, 2).map((h) => (
              <span key={h} className="text-[8px] font-mono text-zinc-600 bg-white/[0.04] px-1 py-0.5 rounded">
                {h}
              </span>
            ))}
          </div>
        )}
        {tracked && (
          <svg
            className={`w-3 h-3 text-zinc-600 shrink-0 transition-transform ${expanded ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        )}
      </button>

      {/* Expanded wallet data */}
      {expanded && tracked && (
        <div className="px-3 pb-2 space-y-1">
          {figure.walletData && figure.walletData.ethBalance > 0 && (
            <div className="flex items-center justify-between rounded bg-white/[0.04] px-2.5 py-1.5">
              <div className="flex items-center gap-1.5">
                <span className="w-4 h-4 rounded-full bg-blue-500/20 flex items-center justify-center text-[7px] font-bold text-blue-400">E</span>
                <span className="text-[10px] font-mono text-white">ETH</span>
              </div>
              <div className="text-right">
                <div className="text-[10px] font-mono text-white">{fmtNum(figure.walletData.ethBalance)}</div>
                <div className="text-[8px] font-mono text-emerald-400">{fmtUsd(figure.walletData.ethUsd)}</div>
              </div>
            </div>
          )}
          {figure.walletData &&
            figure.walletData.tokens.map((t) => (
              <div key={t.symbol} className="flex items-center justify-between rounded bg-white/[0.04] px-2.5 py-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-purple-500/20 flex items-center justify-center text-[7px] font-bold text-purple-400">
                    {t.symbol[0]}
                  </span>
                  <span className="text-[10px] font-mono text-white">{t.symbol}</span>
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-mono text-white">{fmtNum(t.balance)}</div>
                  {t.usdValue > 0 && (
                    <div className="text-[8px] font-mono text-emerald-400">{fmtUsd(t.usdValue)}</div>
                  )}
                </div>
              </div>
            ))}
          {(!figure.walletData ||
            (figure.walletData.ethBalance === 0 && figure.walletData.tokens.length === 0)) && (
            <div className="text-[9px] font-mono text-zinc-600 text-center py-1">No on-chain data</div>
          )}
          <a
            href={`https://etherscan.io/address/${figure.walletAddress}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block text-[8px] font-mono text-zinc-600 hover:text-zinc-400 transition-colors mt-1"
          >
            {figure.walletAddress.slice(0, 10)}...{figure.walletAddress.slice(-6)} ↗
          </a>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  HL Whale Card                                                      */
/* ------------------------------------------------------------------ */

function HLWhaleCard({ whale }: { whale: HLWhale }) {
  const topPositions = whale.positions.slice(0, 5);
  return (
    <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-3 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div>
          <div className="text-[11px] font-semibold text-white">{whale.name}</div>
          <div className="text-[9px] font-mono text-zinc-500 mt-0.5">
            {whale.address.slice(0, 8)}...{whale.address.slice(-6)}
          </div>
        </div>
        <div className="text-right">
          <div className="text-[11px] font-mono font-bold text-white">{fmtUsd(whale.accountValue)}</div>
          <div className="text-[9px] font-mono text-zinc-500">acct val</div>
        </div>
      </div>

      {/* Notional */}
      <div className="flex items-center gap-2 mb-2 pb-2 border-b border-white/[0.04]">
        <span className="text-[9px] font-mono text-zinc-600">NOTIONAL</span>
        <span className="text-[10px] font-mono text-blue-400 font-bold">{fmtUsd(whale.totalNotional)}</span>
        <span className="text-[9px] font-mono text-zinc-600 ml-auto">
          {whale.positions.length} pos
        </span>
      </div>

      {/* Positions */}
      <div className="space-y-1 flex-1 overflow-y-auto">
        {topPositions.length === 0 ? (
          <div className="text-[9px] font-mono text-zinc-700 text-center py-2">No open positions</div>
        ) : (
          topPositions.map((pos, i) => (
            <div key={i} className="flex items-center gap-1.5 text-[10px] font-mono">
              <span className="text-white font-semibold w-14 truncate">{pos.coin}</span>
              <span
                className={`text-[8px] font-bold px-1 py-0.5 rounded ${
                  pos.direction === "LONG"
                    ? "bg-emerald-500/15 text-emerald-400"
                    : "bg-red-500/15 text-red-400"
                }`}
              >
                {pos.direction === "LONG" ? "L" : "S"}
              </span>
              <span className="text-zinc-500 text-[9px]">{pos.leverage}x</span>
              <span className="text-zinc-400 flex-1 text-right">{fmtNum(pos.size)}</span>
              <span
                className={`w-14 text-right ${
                  pos.unrealizedPnl >= 0 ? "text-emerald-400" : "text-red-400"
                }`}
              >
                {pos.unrealizedPnl >= 0 ? "+" : ""}{fmtUsd(pos.unrealizedPnl)}
              </span>
              <span
                className={`w-12 text-right text-[9px] ${
                  pos.roe >= 0 ? "text-emerald-400/70" : "text-red-400/70"
                }`}
              >
                {pos.roe >= 0 ? "+" : ""}{pos.roe.toFixed(1)}%
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Recent Trades Table                                                */
/* ------------------------------------------------------------------ */

function RecentTradesTable({ trades }: { trades: HLTrade[] }) {
  const displayTrades = trades.slice(0, 20);
  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/[0.06] shrink-0">
        <span className="text-[10px] font-mono uppercase tracking-[0.15em] text-zinc-500">HL Trades</span>
        <span className="text-[9px] font-mono text-zinc-700">{displayTrades.length} fills</span>
      </div>
      {/* Column headers */}
      <div className="grid grid-cols-[70px_60px_50px_70px_70px_60px_55px] gap-1 px-3 py-1.5 border-b border-white/[0.04] shrink-0">
        {["Whale", "Coin", "Side", "Price", "Notional", "PnL", "Time"].map((h) => (
          <span key={h} className="text-[8px] font-mono uppercase tracking-[0.1em] text-zinc-700">{h}</span>
        ))}
      </div>
      {/* Rows */}
      <div className="flex-1 overflow-y-auto">
        {displayTrades.length === 0 ? (
          <div className="flex items-center justify-center h-full text-[10px] font-mono text-zinc-700">
            No recent trades
          </div>
        ) : (
          displayTrades.map((t, i) => (
            <div
              key={i}
              className="grid grid-cols-[70px_60px_50px_70px_70px_60px_55px] gap-1 px-3 py-1.5 border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors"
            >
              <span className="text-[9px] font-mono text-zinc-400 truncate">{t.whale}</span>
              <span className="text-[9px] font-mono text-white font-semibold truncate">{t.coin}</span>
              <span
                className={`text-[8px] font-mono font-bold ${
                  t.side === "BUY" ? "text-emerald-400" : "text-red-400"
                }`}
              >
                {t.side}
              </span>
              <span className="text-[9px] font-mono text-zinc-400 tabular-nums">
                ${t.price >= 1000 ? t.price.toLocaleString(undefined, { maximumFractionDigits: 0 }) : t.price.toFixed(2)}
              </span>
              <span className="text-[9px] font-mono text-zinc-300 tabular-nums">{fmtUsd(t.notional)}</span>
              <span
                className={`text-[9px] font-mono tabular-nums ${
                  t.closedPnl > 0 ? "text-emerald-400" : t.closedPnl < 0 ? "text-red-400" : "text-zinc-600"
                }`}
              >
                {t.closedPnl !== 0
                  ? `${t.closedPnl > 0 ? "+" : ""}${fmtUsd(t.closedPnl)}`
                  : "-"}
              </span>
              <span className="text-[9px] font-mono text-zinc-600 tabular-nums">{tradeTimeAgo(t.time)}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Dashboard                                                     */
/* ------------------------------------------------------------------ */

export default function WhaleDashboard({
  ethPrice,
  figures,
  hlWhales,
  hlTrades,
}: WhaleDashboardProps) {
  const [mobileTab, setMobileTab] = useState<"figures" | "positions" | "trades">("positions");

  const trackedFigures = figures.filter((f) => f.walletAddress);
  const untrackedFigures = figures.filter((f) => !f.walletAddress);
  const sortedFigures = [...trackedFigures, ...untrackedFigures];

  const totalPortfolio = trackedFigures.reduce(
    (sum, f) => sum + (f.walletData?.ethUsd ?? 0),
    0
  );

  /* ── Desktop Layout ─────────────────────────────── */
  return (
    <div className="bg-zinc-950 font-mono">
      {/* Stat Bar */}
      <div className="flex items-center gap-4 px-4 py-2.5 bg-zinc-900/80 border-b border-white/[0.06] text-[11px] font-mono overflow-x-auto shrink-0">
        <span className="text-zinc-500 shrink-0">ETH</span>
        <span className="text-white font-bold tabular-nums shrink-0">
          ${ethPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
        <span className="text-zinc-700 shrink-0">|</span>
        <span className="text-zinc-500 shrink-0">Portfolio</span>
        <span className="text-white tabular-nums shrink-0">{fmtUsd(totalPortfolio)}</span>
        <span className="text-zinc-700 shrink-0">|</span>
        <span className="text-zinc-500 shrink-0">Tracked</span>
        <span className="text-white shrink-0">{trackedFigures.length} wallets</span>
        <span className="text-zinc-700 shrink-0">|</span>
        <span className="text-zinc-500 shrink-0">HL Whales</span>
        <span className="text-white shrink-0">{hlWhales.length}</span>
        <span className="text-zinc-700 shrink-0">|</span>
        <span className="relative flex items-center gap-1.5 shrink-0">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
          </span>
          <span className="text-emerald-400 text-[10px] uppercase tracking-[0.15em]">LIVE</span>
        </span>
      </div>

      {/* Mobile tab bar */}
      <div className="flex lg:hidden border-b border-white/[0.06] bg-zinc-900/60">
        {(["figures", "positions", "trades"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setMobileTab(tab)}
            className={`flex-1 py-2 text-[10px] font-mono uppercase tracking-[0.1em] transition-colors ${
              mobileTab === tab
                ? "text-white border-b-2 border-emerald-500"
                : "text-zinc-600 hover:text-zinc-400"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Main grid — desktop */}
      <div className="hidden lg:grid h-[calc(100vh-108px)]" style={{ gridTemplateColumns: "280px 1fr" }}>
        {/* Left sidebar */}
        <div className="border-r border-white/[0.06] flex flex-col overflow-hidden">
          <div className="px-3 py-2 border-b border-white/[0.06] shrink-0">
            <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-zinc-600">Key Figures</span>
          </div>
          <div className="flex-1 overflow-y-auto">
            {sortedFigures.map((fig) => (
              <FigureRow key={fig.name} figure={fig} />
            ))}
          </div>
        </div>

        {/* Right panel */}
        <div className="flex flex-col overflow-hidden">
          {/* Top: HL Positions (2x2 grid, ~55vh) */}
          <div
            className="border-b border-white/[0.06] overflow-hidden"
            style={{ height: "55%" }}
          >
            <div className="flex items-center justify-between px-3 py-2 border-b border-white/[0.06] shrink-0">
              <span className="text-[10px] font-mono uppercase tracking-[0.15em] text-zinc-500">
                Hyperliquid Positions
              </span>
              <span className="text-[9px] font-mono text-zinc-700">
                {hlWhales.reduce((s, w) => s + w.positions.length, 0)} open
              </span>
            </div>
            {hlWhales.length === 0 ? (
              <div className="flex items-center justify-center h-full text-[10px] font-mono text-zinc-700">
                No active positions
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 p-3 h-[calc(100%-36px)] overflow-y-auto">
                {hlWhales.map((whale) => (
                  <HLWhaleCard key={whale.address} whale={whale} />
                ))}
              </div>
            )}
          </div>

          {/* Bottom: Trades + Activity */}
          <div className="flex flex-1 overflow-hidden min-h-0">
            {/* Left 60%: Recent Trades */}
            <div className="border-r border-white/[0.06] overflow-hidden flex flex-col" style={{ width: "60%" }}>
              <RecentTradesTable trades={hlTrades} />
            </div>

            {/* Right 40%: Activity Feed */}
            <div className="overflow-y-auto flex-1">
              <div className="p-3 h-full">
                <WhaleActivityFeed />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile views */}
      <div className="lg:hidden" style={{ height: "calc(100vh - 108px)", overflow: "hidden" }}>
        {mobileTab === "figures" && (
          <div className="h-full overflow-y-auto">
            {/* Horizontal strip of tracked figures */}
            <div className="flex gap-3 p-3 overflow-x-auto border-b border-white/[0.06]">
              {trackedFigures.map((fig) => (
                <div key={fig.name} className="flex flex-col items-center gap-1 shrink-0">
                  <Avatar image={fig.image} name={fig.name} size={36} />
                  <span className="text-[8px] font-mono text-zinc-400 text-center max-w-[48px] truncate">
                    {fig.name.split(" ")[0]}
                  </span>
                </div>
              ))}
            </div>
            {/* Full list */}
            <div>
              {sortedFigures.map((fig) => (
                <FigureRow key={fig.name} figure={fig} />
              ))}
            </div>
          </div>
        )}

        {mobileTab === "positions" && (
          <div className="h-full overflow-y-auto p-3 space-y-3">
            {hlWhales.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-[10px] font-mono text-zinc-700">
                No active positions
              </div>
            ) : (
              hlWhales.map((whale) => (
                <HLWhaleCard key={whale.address} whale={whale} />
              ))
            )}
          </div>
        )}

        {mobileTab === "trades" && (
          <div className="h-full flex flex-col overflow-hidden">
            {/* Tabbed: trades vs activity */}
            <MobileTradesActivity trades={hlTrades} />
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Mobile Trades / Activity Toggle                                    */
/* ------------------------------------------------------------------ */

function MobileTradesActivity({ trades }: { trades: HLTrade[] }) {
  const [tab, setTab] = useState<"trades" | "activity">("trades");
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex border-b border-white/[0.06] shrink-0">
        {(["trades", "activity"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 text-[10px] font-mono uppercase tracking-[0.1em] transition-colors ${
              tab === t ? "text-white border-b-2 border-blue-500" : "text-zinc-600"
            }`}
          >
            {t}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-hidden">
        {tab === "trades" ? (
          <RecentTradesTable trades={trades} />
        ) : (
          <div className="p-3 h-full overflow-y-auto">
            <WhaleActivityFeed />
          </div>
        )}
      </div>
    </div>
  );
}
