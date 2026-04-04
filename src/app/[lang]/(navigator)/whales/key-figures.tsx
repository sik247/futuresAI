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

type Tab = "all" | "tracked" | "founder" | "trader" | "investor" | "analyst";

const TAB_CONFIG: { key: Tab; label: string; labelKo: string }[] = [
  { key: "all", label: "All", labelKo: "전체" },
  { key: "tracked", label: "Tracked", labelKo: "추적" },
  { key: "founder", label: "Founders", labelKo: "창업자" },
  { key: "trader", label: "Traders", labelKo: "트레이더" },
  { key: "investor", label: "Investors", labelKo: "투자자" },
  { key: "analyst", label: "Analysts", labelKo: "애널리스트" },
];

function truncAddr(addr: string) {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

/* ─── Flip Card ──────────────────────────────────────────── */

function FigureCard({ figure, isKo }: { figure: KeyFigure; isKo: boolean }) {
  const [flipped, setFlipped] = useState(false);
  const hasWallet = !!(figure.walletAddress || figure.arkhamUrl);

  return (
    <div
      className="perspective-[800px] cursor-pointer"
      onClick={() => setFlipped((f) => !f)}
    >
      <div
        className={`relative w-full transition-transform duration-500 [transform-style:preserve-3d] ${
          flipped ? "[transform:rotateY(180deg)]" : ""
        }`}
      >
        {/* ── FRONT ────────────────────────────────── */}
        <div className={`[backface-visibility:hidden] flex flex-col items-center rounded-xl border bg-white/[0.02] p-4 ${
          hasWallet
            ? "border-purple-500/15 hover:border-purple-500/30"
            : "border-white/[0.06] hover:border-white/[0.12]"
        } hover:bg-white/[0.05] transition-all duration-200`}>
          <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden mb-3 border-2 border-white/[0.08]">
            <img
              src={figure.image}
              alt={figure.name}
              className="w-full h-full object-cover"
            />
            {hasWallet && (
              <div className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-purple-500 border-2 border-[#0d0e14] flex items-center justify-center">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                  <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            )}
          </div>
          <h3 className="text-[13px] font-semibold text-white text-center leading-tight">
            {figure.name}
          </h3>
          <p className="text-[10px] text-zinc-500 text-center mt-0.5 font-mono">
            {figure.role}
          </p>
          {figure.stance && (
            <span className={`mt-2 px-2 py-0.5 text-[9px] font-mono font-bold rounded-full border ${
              figure.stance === "Bullish"
                ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/20"
                : figure.stance === "Bearish"
                ? "bg-red-500/15 text-red-400 border-red-500/20"
                : "bg-zinc-500/15 text-zinc-400 border-zinc-500/20"
            }`}>
              {figure.stance}
            </span>
          )}
          {figure.knownHoldings.length > 0 && (
            <div className="flex flex-wrap justify-center gap-1 mt-2">
              {figure.knownHoldings.map((h) => (
                <span key={h} className="text-[9px] font-mono text-zinc-500 bg-white/[0.04] px-1.5 py-0.5 rounded">
                  {h}
                </span>
              ))}
            </div>
          )}
          {hasWallet && (
            <p className="text-[8px] text-zinc-600 font-mono mt-2">
              {isKo ? "탭하여 지갑 보기" : "Tap to view wallet"}
            </p>
          )}
        </div>

        {/* ── BACK ─────────────────────────────────── */}
        <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)] rounded-xl border border-purple-500/20 bg-[#12131a] p-4 flex flex-col">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-full overflow-hidden border border-white/[0.1] shrink-0">
              <img src={figure.image} alt="" className="w-full h-full object-cover" />
            </div>
            <div className="min-w-0">
              <p className="text-[12px] font-semibold text-white truncate">{figure.name}</p>
              <p className="text-[9px] text-zinc-500 font-mono">{isKo ? "지갑 정보" : "Wallet Info"}</p>
            </div>
          </div>

          {figure.walletAddress ? (
            <div className="space-y-2 flex-1">
              <div className="rounded-lg bg-white/[0.04] border border-white/[0.06] p-2.5">
                <p className="text-[8px] text-zinc-600 font-mono uppercase mb-1">ETH Address</p>
                <p className="text-[10px] font-mono text-blue-400 break-all leading-relaxed">
                  {figure.walletAddress}
                </p>
              </div>
              <div className="rounded-lg bg-white/[0.04] border border-white/[0.06] p-2.5">
                <p className="text-[8px] text-zinc-600 font-mono uppercase mb-1">{isKo ? "알려진 보유" : "Known Holdings"}</p>
                <div className="flex flex-wrap gap-1">
                  {figure.knownHoldings.map((h) => (
                    <span key={h} className="text-[9px] font-mono font-bold text-white bg-white/[0.08] px-2 py-0.5 rounded">
                      {h}
                    </span>
                  ))}
                </div>
              </div>
              {figure.arkhamUrl && (
                <a
                  href={figure.arkhamUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center justify-center gap-1.5 text-[10px] font-mono text-purple-400 bg-purple-500/10 border border-purple-500/20 rounded-lg py-2 hover:bg-purple-500/20 transition-colors"
                >
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  {isKo ? "Arkham에서 추적" : "Track on Arkham"}
                </a>
              )}
            </div>
          ) : figure.arkhamUrl ? (
            <div className="space-y-2 flex-1">
              <div className="rounded-lg bg-white/[0.04] border border-white/[0.06] p-2.5">
                <p className="text-[8px] text-zinc-600 font-mono uppercase mb-1">{isKo ? "추적 상태" : "Tracking"}</p>
                <p className="text-[10px] text-zinc-400">
                  {isKo ? "Arkham Intelligence에서 추적 가능" : "Tracked via Arkham Intelligence"}
                </p>
              </div>
              <div className="rounded-lg bg-white/[0.04] border border-white/[0.06] p-2.5">
                <p className="text-[8px] text-zinc-600 font-mono uppercase mb-1">{isKo ? "알려진 보유" : "Known Holdings"}</p>
                <div className="flex flex-wrap gap-1">
                  {figure.knownHoldings.map((h) => (
                    <span key={h} className="text-[9px] font-mono font-bold text-white bg-white/[0.08] px-2 py-0.5 rounded">
                      {h}
                    </span>
                  ))}
                </div>
              </div>
              <a
                href={figure.arkhamUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex items-center justify-center gap-1.5 text-[10px] font-mono text-purple-400 bg-purple-500/10 border border-purple-500/20 rounded-lg py-2 hover:bg-purple-500/20 transition-colors"
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                {isKo ? "Arkham에서 보기" : "View on Arkham"}
              </a>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center">
              <p className="text-[10px] text-zinc-600 text-center">
                {isKo ? "공개된 지갑 주소가 없습니다" : "No public wallet address available"}
              </p>
              <div className="flex flex-wrap justify-center gap-1 mt-3">
                {figure.knownHoldings.map((h) => (
                  <span key={h} className="text-[9px] font-mono font-bold text-white bg-white/[0.08] px-2 py-0.5 rounded">
                    {h}
                  </span>
                ))}
              </div>
            </div>
          )}

          <p className="text-[8px] text-zinc-600 font-mono text-center mt-2">
            {isKo ? "탭하여 돌아가기" : "Tap to flip back"}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ─── Grid ───────────────────────────────────────────────── */

export default function KeyFiguresGrid({
  figures,
  lang,
}: {
  figures: KeyFigure[];
  lang: string;
}) {
  const isKo = lang === "ko";
  const [tab, setTab] = useState<Tab>("all");

  const filtered = useMemo(() => {
    if (tab === "all") return figures;
    if (tab === "tracked") return figures.filter((f) => f.arkhamUrl || f.walletAddress);
    return figures.filter((f) => f.category === tab);
  }, [figures, tab]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: figures.length };
    c.tracked = figures.filter((f) => f.arkhamUrl || f.walletAddress).length;
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
                    ? "bg-purple-600/20 text-purple-400 border border-purple-500/30"
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
          <FigureCard key={figure.name} figure={figure} isKo={isKo} />
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
