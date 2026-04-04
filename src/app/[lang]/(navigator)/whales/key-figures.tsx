"use client";

import { useState, useMemo } from "react";

type KeyFigure = {
  name: string;
  role: string;
  image: string;
  link: string;
  arkhamUrl: string;
  walletAddress: string;
  stance: "Bullish" | "Bearish" | "Neutral" | "";
  knownHoldings: string[];
  category: "founder" | "trader" | "analyst" | "investor";
};

type WalletData = {
  ethBalance: number;
  ethUsd: number;
  tokens: { symbol: string; name: string; balance: number; usdValue: number }[];
};

type Tab = "all" | "tracked" | "founder" | "trader" | "investor" | "analyst";

const TAB_CONFIG: { key: Tab; label: string; labelKo: string }[] = [
  { key: "all", label: "All", labelKo: "전체" },
  { key: "tracked", label: "Tracked", labelKo: "추적" },
  { key: "founder", label: "Founders", labelKo: "창업자" },
  { key: "trader", label: "Traders", labelKo: "트레이더" },
  { key: "investor", label: "Investors", labelKo: "투자자" },
  { key: "analyst", label: "Analysts", labelKo: "애널리스트" },
];

function fmtUsd(v: number) {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
  return `$${v.toFixed(0)}`;
}

function fmtBal(v: number) {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(2)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}K`;
  if (v >= 1) return v.toFixed(2);
  return v.toFixed(4);
}

function Initials({ name }: { name: string }) {
  return (
    <div className="w-full h-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-white font-bold text-lg">
      {name.split(" ").map((w) => w[0]).join("").slice(0, 2)}
    </div>
  );
}

function Avatar({ image, name, size = "lg" }: { image: string; name: string; size?: "lg" | "sm" }) {
  const cls = size === "lg" ? "w-20 h-20 sm:w-24 sm:h-24" : "w-8 h-8";
  return (
    <div className={`${cls} rounded-full overflow-hidden border-2 border-white/[0.08] shrink-0`}>
      {image ? (
        <img src={image} alt={name} className="w-full h-full object-cover" />
      ) : (
        <Initials name={name} />
      )}
    </div>
  );
}

/* ─── Figure Card ────────────────────────────────────────── */

function FigureCard({ figure, isKo, walletInfo }: { figure: KeyFigure; isKo: boolean; walletInfo?: WalletData }) {
  const [flipped, setFlipped] = useState(false);
  const hasWallet = !!figure.walletAddress;
  const hasData = !!(walletInfo && (walletInfo.ethBalance > 0 || walletInfo.tokens.length > 0));

  // If no wallet, don't flip - just show front
  if (!hasWallet) {
    return (
      <div className="flex flex-col items-center rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
        <Avatar image={figure.image} name={figure.name} />
        <h3 className="text-[13px] font-semibold text-white text-center leading-tight mt-3">{figure.name}</h3>
        <p className="text-[10px] text-zinc-500 text-center mt-0.5 font-mono">{figure.role}</p>
        {figure.stance && (
          <span className={`mt-2 px-2 py-0.5 text-[9px] font-mono font-bold rounded-full border ${
            figure.stance === "Bullish" ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/20"
            : figure.stance === "Bearish" ? "bg-red-500/15 text-red-400 border-red-500/20"
            : "bg-zinc-500/15 text-zinc-400 border-zinc-500/20"
          }`}>{figure.stance}</span>
        )}
        <div className="flex flex-wrap justify-center gap-1 mt-2">
          {figure.knownHoldings.map((h) => (
            <span key={h} className="text-[9px] font-mono text-zinc-500 bg-white/[0.04] px-1.5 py-0.5 rounded">{h}</span>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      className="cursor-pointer"
      onClick={() => setFlipped((f) => !f)}
      style={{ perspective: "800px" }}
    >
      <div
        style={{
          transformStyle: "preserve-3d",
          transition: "transform 0.5s",
          transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
        }}
        className="relative"
      >
        {/* ── FRONT ────────────────────────────────── */}
        <div
          style={{ backfaceVisibility: "hidden" }}
          className={`flex flex-col items-center rounded-xl border p-4 ${
            hasData
              ? "border-emerald-500/20 bg-white/[0.03]"
              : "border-purple-500/15 bg-white/[0.02]"
          }`}
        >
          <div className="relative">
            <Avatar image={figure.image} name={figure.name} />
            {hasData && (
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-[#0d0e14] flex items-center justify-center">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                  <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            )}
          </div>
          <h3 className="text-[13px] font-semibold text-white text-center leading-tight mt-3">{figure.name}</h3>
          <p className="text-[10px] text-zinc-500 text-center mt-0.5 font-mono">{figure.role}</p>
          {figure.stance && (
            <span className={`mt-2 px-2 py-0.5 text-[9px] font-mono font-bold rounded-full border ${
              figure.stance === "Bullish" ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/20"
              : figure.stance === "Bearish" ? "bg-red-500/15 text-red-400 border-red-500/20"
              : "bg-zinc-500/15 text-zinc-400 border-zinc-500/20"
            }`}>{figure.stance}</span>
          )}
          <div className="flex flex-wrap justify-center gap-1 mt-2">
            {figure.knownHoldings.map((h) => (
              <span key={h} className="text-[9px] font-mono text-zinc-500 bg-white/[0.04] px-1.5 py-0.5 rounded">{h}</span>
            ))}
          </div>
          <p className="text-[8px] text-purple-400/60 font-mono mt-2">
            {isKo ? "탭하여 지갑 보기" : "Tap to view wallet"}
          </p>
        </div>

        {/* ── BACK ─────────────────────────────────── */}
        <div
          style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
          className="absolute inset-0 rounded-xl border border-purple-500/20 bg-[#12131a] p-3 flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center gap-2 mb-2 shrink-0">
            <Avatar image={figure.image} name={figure.name} size="sm" />
            <div className="min-w-0">
              <p className="text-[11px] font-semibold text-white truncate">{figure.name}</p>
              <p className="text-[8px] text-zinc-500 font-mono truncate">{figure.walletAddress.slice(0, 10)}...{figure.walletAddress.slice(-6)}</p>
            </div>
          </div>

          {/* Wallet contents */}
          <div className="flex-1 overflow-y-auto space-y-1.5 min-h-0">
            {/* ETH */}
            {walletInfo && walletInfo.ethBalance > 0 && (
              <div className="flex items-center justify-between rounded-lg bg-white/[0.04] px-2.5 py-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center text-[8px] font-bold text-blue-400">E</span>
                  <span className="text-[10px] font-mono text-white font-semibold">ETH</span>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-mono text-white">{fmtBal(walletInfo.ethBalance)}</p>
                  <p className="text-[8px] font-mono text-emerald-400">{fmtUsd(walletInfo.ethUsd)}</p>
                </div>
              </div>
            )}

            {/* Tokens */}
            {walletInfo && walletInfo.tokens.map((t) => (
              <div key={t.symbol} className="flex items-center justify-between rounded-lg bg-white/[0.04] px-2.5 py-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-purple-500/20 flex items-center justify-center text-[8px] font-bold text-purple-400">{t.symbol[0]}</span>
                  <span className="text-[10px] font-mono text-white font-semibold">{t.symbol}</span>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-mono text-white">{fmtBal(t.balance)}</p>
                  {t.usdValue > 0 && <p className="text-[8px] font-mono text-emerald-400">{fmtUsd(t.usdValue)}</p>}
                </div>
              </div>
            ))}

            {/* No data fallback */}
            {(!walletInfo || (walletInfo.ethBalance === 0 && walletInfo.tokens.length === 0)) && (
              <div className="flex flex-col items-center justify-center py-4">
                <p className="text-[10px] text-zinc-500 font-mono text-center">
                  {isKo ? "데이터 로딩 중..." : "Loading wallet data..."}
                </p>
                <div className="flex flex-wrap justify-center gap-1 mt-2">
                  {figure.knownHoldings.map((h) => (
                    <span key={h} className="text-[9px] font-mono font-bold text-white bg-white/[0.08] px-2 py-0.5 rounded">{h}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="shrink-0 pt-2 mt-auto">
            {hasData && (
              <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 py-1 text-center mb-1">
                <span className="text-[8px] font-mono text-emerald-400 font-bold">{isKo ? "실시간 온체인 데이터" : "Live On-Chain Data"}</span>
              </div>
            )}
            <p className="text-[8px] text-zinc-600 font-mono text-center">
              {isKo ? "탭하여 돌아가기" : "Tap to flip back"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Grid ───────────────────────────────────────────────── */

export default function KeyFiguresGrid({
  figures,
  walletData,
  lang,
}: {
  figures: KeyFigure[];
  walletData?: Record<string, WalletData>;
  lang: string;
}) {
  const isKo = lang === "ko";
  const [tab, setTab] = useState<Tab>("all");

  const filtered = useMemo(() => {
    if (tab === "all") return figures;
    if (tab === "tracked") return figures.filter((f) => f.walletAddress);
    return figures.filter((f) => f.category === tab);
  }, [figures, tab]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: figures.length };
    c.tracked = figures.filter((f) => f.walletAddress).length;
    for (const f of figures) c[f.category] = (c[f.category] || 0) + 1;
    return c;
  }, [figures]);

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-6">
        {TAB_CONFIG.map((t) => {
          const count = counts[t.key] || 0;
          if (count === 0 && t.key !== "all") return null;
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors ${
                active
                  ? t.key === "tracked"
                    ? "bg-emerald-600/20 text-emerald-400 border border-emerald-500/30"
                    : "bg-blue-600/20 text-blue-400 border border-blue-500/30"
                  : "bg-white/[0.04] text-zinc-500 border border-transparent hover:text-zinc-300 hover:bg-white/[0.06]"
              }`}
            >
              {isKo ? t.labelKo : t.label}
              <span className="text-[10px] ml-1 opacity-60">{count}</span>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {filtered.map((figure) => (
          <FigureCard
            key={figure.name}
            figure={figure}
            isKo={isKo}
            walletInfo={figure.walletAddress ? walletData?.[figure.walletAddress] : undefined}
          />
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="text-center text-sm text-zinc-600 py-12">
          {isKo ? "해당 카테고리에 인물이 없습니다" : "No figures in this category"}
        </p>
      )}
    </div>
  );
}
