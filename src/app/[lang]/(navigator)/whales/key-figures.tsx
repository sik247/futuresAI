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
  { key: "tracked", label: "Tracked Wallets", labelKo: "추적 지갑" },
  { key: "founder", label: "Founders", labelKo: "창업자" },
  { key: "trader", label: "Traders", labelKo: "트레이더" },
  { key: "investor", label: "Investors", labelKo: "투자자" },
  { key: "analyst", label: "Analysts", labelKo: "애널리스트" },
];

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
      {/* Tabs */}
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

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {filtered.map((figure) => (
          <div
            key={figure.name}
            className={`group flex flex-col items-center rounded-xl border bg-white/[0.02] hover:bg-white/[0.05] transition-all duration-200 p-4 ${
              figure.arkhamUrl || figure.walletAddress
                ? "border-purple-500/15 hover:border-purple-500/30"
                : "border-white/[0.06] hover:border-white/[0.12]"
            }`}
          >
            <a
              href={figure.link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center"
            >
              <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden mb-3 border-2 border-white/[0.08] group-hover:border-white/[0.20] transition-colors">
                <img
                  src={figure.image}
                  alt={figure.name}
                  className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-300"
                />
                {/* Tracked indicator dot */}
                {(figure.arkhamUrl || figure.walletAddress) && (
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
            </a>

            {figure.stance && (
              <span
                className={`mt-2 px-2 py-0.5 text-[9px] font-mono font-bold rounded-full border ${
                  figure.stance === "Bullish"
                    ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/20"
                    : figure.stance === "Bearish"
                    ? "bg-red-500/15 text-red-400 border-red-500/20"
                    : "bg-zinc-500/15 text-zinc-400 border-zinc-500/20"
                }`}
              >
                {figure.stance}
              </span>
            )}

            {figure.knownHoldings.length > 0 && (
              <div className="flex flex-wrap justify-center gap-1 mt-2">
                {figure.knownHoldings.map((h) => (
                  <span
                    key={h}
                    className="text-[9px] font-mono text-zinc-500 bg-white/[0.04] px-1.5 py-0.5 rounded"
                  >
                    {h}
                  </span>
                ))}
              </div>
            )}

            {/* Wallet + Arkham links */}
            {(figure.walletAddress || figure.arkhamUrl) && (
              <div className="flex flex-wrap justify-center gap-1.5 mt-2">
                {figure.walletAddress && (
                  <a
                    href={`https://etherscan.io/address/${figure.walletAddress}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[8px] font-mono text-blue-400/70 hover:text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded transition-colors"
                    title={figure.walletAddress}
                  >
                    {figure.walletAddress.slice(0, 6)}...
                    {figure.walletAddress.slice(-4)}
                  </a>
                )}
                {figure.arkhamUrl && (
                  <a
                    href={figure.arkhamUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[8px] font-mono text-purple-400/70 hover:text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded transition-colors"
                  >
                    Arkham
                  </a>
                )}
              </div>
            )}
          </div>
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
