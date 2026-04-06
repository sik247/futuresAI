"use client";

type SignalItem = {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  signal: string;
  direction: string;
  rsi: number;
  macdHistogram: number;
  confidence: number;
};

type SignalsData = {
  signals: SignalItem[];
  fearGreed: { value: number; classification: string };
  btcTrend: string;
  marketSummary: string;
  updatedAt: string;
};

export default function ChartsDashboard({ signals, lang }: { signals: SignalsData; lang: string }) {
  const topSignals = (signals.signals || []).slice(0, 8);
  const ko = lang === "ko";

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Market Summary */}
      {signals.marketSummary && (
        <div className="px-3 py-2 border-b border-white/[0.06] bg-white/[0.01]">
          <p className="text-[11px] text-zinc-500 leading-relaxed line-clamp-2">{signals.marketSummary}</p>
        </div>
      )}

      {/* Signal Cards */}
      {topSignals.length === 0 ? (
        <div className="flex items-center justify-center h-32 text-[12px] font-mono text-zinc-700">
          {ko ? "시그널 없음" : "No signals"}
        </div>
      ) : (
        <div className="divide-y divide-white/[0.04]">
          {topSignals.map((s) => {
            const signalColor =
              s.signal === "Strong Buy" ? "text-emerald-400 bg-emerald-500/15 border-emerald-500/25" :
              s.signal === "Buy" ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" :
              s.signal === "Sell" ? "text-red-400 bg-red-500/10 border-red-500/20" :
              s.signal === "Strong Sell" ? "text-red-400 bg-red-500/15 border-red-500/25" :
              "text-zinc-400 bg-zinc-500/10 border-zinc-500/20";
            const dirColor =
              s.direction === "LONG" ? "text-emerald-400 bg-emerald-500/10" :
              s.direction === "SHORT" ? "text-red-400 bg-red-500/10" :
              "text-zinc-500 bg-zinc-500/10";

            return (
              <div key={s.symbol} className="flex items-center gap-2.5 px-3 py-2.5 hover:bg-white/[0.02] transition-colors">
                {/* Coin circle */}
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-white/[0.08] flex items-center justify-center shrink-0">
                  <span className="text-[11px] font-bold text-white">{s.symbol[0]}</span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[12px] font-semibold text-white">{s.symbol}</span>
                    <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${signalColor}`}>
                      {s.signal}
                    </span>
                    <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${dirColor}`}>
                      {s.direction}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[11px] text-zinc-500">${s.price?.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                    <span className={`text-[10px] tabular-nums ${s.change24h >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                      {s.change24h >= 0 ? "+" : ""}{s.change24h?.toFixed(2)}%
                    </span>
                  </div>
                </div>

                {/* RSI */}
                <div className="shrink-0 text-right">
                  <div className="flex items-center gap-1">
                    <span className="text-[9px] text-zinc-600">RSI</span>
                    <div className="w-12 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${s.rsi > 70 ? "bg-red-500" : s.rsi < 30 ? "bg-emerald-500" : "bg-blue-500"}`}
                        style={{ width: `${Math.min(s.rsi || 0, 100)}%` }}
                      />
                    </div>
                    <span className={`text-[10px] font-mono tabular-nums ${s.rsi > 70 ? "text-red-400" : s.rsi < 30 ? "text-emerald-400" : "text-zinc-400"}`}>
                      {s.rsi?.toFixed(0)}
                    </span>
                  </div>
                  <span className="text-[9px] text-zinc-600 tabular-nums">{s.confidence}%</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
