"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

/* ── Types ── */

interface UserRow {
  uid: string;
  exchange: string;
  commission: number;
  paybackRate: number;
  paybackOwed: number;
  fees: number;
  volume: number;
  trades: number;
  joinDate: string | null;
  email: string | null;
  dbStatus: string | null;
}

interface ExchangeSummary {
  commission: number;
  payback: number;
  fees: number;
  users: number;
}

interface Summary {
  totalUsers: number;
  totalCommission: number;
  totalPaybackOwed: number;
  totalFees: number;
  totalVolume: number;
  byExchange: Record<string, ExchangeSummary>;
}

type Period = "this-month" | "last-month" | "last-7d" | "last-30d" | "all-time";

const PERIOD_LABELS: Record<Period, string> = {
  "this-month": "이번 달",
  "last-month": "지난 달",
  "last-7d": "7일",
  "last-30d": "30일",
  "all-time": "전체",
};

function getPeriodRange(p: Period) {
  const now = new Date();
  const to = Math.floor(now.getTime() / 1000);
  switch (p) {
    case "this-month": return { from: Math.floor(new Date(now.getFullYear(), now.getMonth(), 1).getTime() / 1000), to };
    case "last-month": {
      const s = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const e = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
      return { from: Math.floor(s.getTime() / 1000), to: Math.floor(e.getTime() / 1000) };
    }
    case "last-7d": return { from: to - 7 * 86400, to };
    case "last-30d": return { from: to - 30 * 86400, to };
    case "all-time": return { from: to - 365 * 86400, to };
  }
}

const EXCHANGE_COLORS: Record<string, string> = {
  "Gate.io": "text-blue-400",
  "Bitget": "text-emerald-400",
  "BingX": "text-cyan-400",
  "Bybit": "text-amber-400",
  "OKX": "text-white",
  "HTX": "text-indigo-400",
};

/* ── Component ── */

export default function PaybacksDashboard() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [gateReferrals, setGateReferrals] = useState(0);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>("this-month");
  const [search, setSearch] = useState("");
  const [exchangeFilter, setExchangeFilter] = useState<string>("all");
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 25;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { from, to } = getPeriodRange(period);
      const res = await fetch(`/api/admin/payback-users?from=${from}&to=${to}`);
      const data = await res.json();
      setUsers(data.users || []);
      setSummary(data.summary || null);
      setGateReferrals(data.gateReferrals || 0);
    } catch (e) {
      console.error("Failed to fetch:", e);
    }
    setLoading(false);
  }, [period]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { setPage(0); }, [search, period, exchangeFilter]);

  const filtered = users.filter((u) => {
    if (exchangeFilter !== "all" && u.exchange !== exchangeFilter) return false;
    if (search && !u.uid.includes(search) && !(u.email || "").toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pageUsers = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const filteredTotalComm = filtered.reduce((s, u) => s + u.commission, 0);
  const filteredTotalPayback = filtered.reduce((s, u) => s + u.paybackOwed, 0);
  const filteredTotalFees = filtered.reduce((s, u) => s + u.fees, 0);

  const exchanges = summary ? Object.keys(summary.byExchange) : [];

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-24 pb-20 lg:pb-8">

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">페이백 관리</h1>
            </div>
            <div className="flex items-center gap-3">
              <p className="text-sm text-zinc-500">유저별 커미션 · 페이백 · 수수료 현황</p>
              <span className="text-zinc-700">·</span>
              <Link href="/en/dashboard/admin/manage" className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">출금/승인 관리 &rarr;</Link>
            </div>
          </div>
          <button
            onClick={fetchData}
            disabled={loading}
            className="px-4 py-2 rounded-xl border border-white/[0.08] bg-white/[0.03] text-sm font-medium text-zinc-300 hover:bg-white/[0.06] transition-all disabled:opacity-50 self-start sm:self-auto"
          >
            {loading ? "로딩 중..." : "새로고침"}
          </button>
        </div>

        {/* ── Summary Cards ── */}
        {summary && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <SummaryCard label="총 유저" value={String(summary.totalUsers)} sub={gateReferrals > 0 ? `Gate.io ${gateReferrals}명 가입` : undefined} />
            <SummaryCard label="총 커미션" value={`$${summary.totalCommission.toFixed(2)}`} accent="emerald" />
            <SummaryCard label="지급할 페이백" value={`$${summary.totalPaybackOwed.toFixed(2)}`} accent="amber" />
            <SummaryCard label="유저 수수료" value={`$${summary.totalFees.toFixed(2)}`} />
          </div>
        )}

        {/* ── Exchange Breakdown ── */}
        {summary && exchanges.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-2 mb-6">
            {exchanges.map((ex) => {
              const d = summary.byExchange[ex];
              return (
                <button
                  key={ex}
                  onClick={() => setExchangeFilter(exchangeFilter === ex ? "all" : ex)}
                  className={`rounded-xl border px-4 py-3 text-left transition-all ${
                    exchangeFilter === ex
                      ? "border-blue-500/40 bg-blue-500/10"
                      : "border-zinc-800 bg-zinc-900/30 hover:border-zinc-700"
                  }`}
                >
                  <p className={`text-xs font-semibold ${EXCHANGE_COLORS[ex] || "text-white"}`}>{ex}</p>
                  <p className="text-sm font-mono font-bold text-white mt-1">${d.payback.toFixed(2)}</p>
                  <p className="text-[10px] text-zinc-500">{d.users}명 · 커미션 ${d.commission.toFixed(2)}</p>
                </button>
              );
            })}
          </div>
        )}

        {/* ── Filters ── */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="flex gap-1.5 flex-wrap">
            {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  period === p ? "bg-blue-600 text-white" : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                }`}
              >
                {PERIOD_LABELS[p]}
              </button>
            ))}
          </div>
          <div className="flex gap-2 flex-1">
            <input
              type="text"
              placeholder="UID 또는 이메일 검색..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 flex-1 sm:max-w-[240px]"
            />
            {exchangeFilter !== "all" && (
              <button onClick={() => setExchangeFilter("all")} className="px-3 py-1.5 rounded-lg bg-blue-600/20 text-blue-400 text-xs font-medium hover:bg-blue-600/30">
                {exchangeFilter} &times;
              </button>
            )}
          </div>
          <span className="text-xs text-zinc-500 flex items-center ml-auto whitespace-nowrap">{filtered.length}명</span>
        </div>

        {/* ── Table ── */}
        <div className="rounded-xl border border-zinc-800 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-24">
              <svg className="w-6 h-6 animate-spin text-zinc-600" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" className="opacity-25" />
                <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
          ) : (
            <>
              {/* Desktop */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-zinc-900/60 text-zinc-500 text-[11px] uppercase tracking-wider">
                      <th className="text-left px-4 py-3 font-medium w-10">#</th>
                      <th className="text-left px-4 py-3 font-medium">거래소</th>
                      <th className="text-left px-4 py-3 font-medium">UID</th>
                      <th className="text-left px-4 py-3 font-medium">이메일</th>
                      <th className="text-right px-4 py-3 font-medium">커미션</th>
                      <th className="text-right px-4 py-3 font-medium">페이백</th>
                      <th className="text-right px-4 py-3 font-medium">수수료</th>
                      <th className="text-right px-4 py-3 font-medium">거래량</th>
                      <th className="text-right px-4 py-3 font-medium">거래</th>
                      <th className="text-left px-4 py-3 font-medium">가입일</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageUsers.length === 0 ? (
                      <tr><td colSpan={10} className="px-4 py-16 text-center text-zinc-600">데이터 없음</td></tr>
                    ) : pageUsers.map((u, i) => (
                      <tr key={`${u.exchange}:${u.uid}`} className="border-t border-zinc-800/40 hover:bg-white/[0.015] transition-colors">
                        <td className="px-4 py-3 text-zinc-600 font-mono text-xs">{page * PAGE_SIZE + i + 1}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-semibold ${EXCHANGE_COLORS[u.exchange] || "text-white"}`}>{u.exchange}</span>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-zinc-300">{u.uid}</td>
                        <td className="px-4 py-3 text-xs text-zinc-500 truncate max-w-[160px]">{u.email || "—"}</td>
                        <td className="px-4 py-3 text-right font-mono tabular-nums text-emerald-400 text-xs">${u.commission.toFixed(4)}</td>
                        <td className="px-4 py-3 text-right font-mono tabular-nums text-amber-400 font-semibold text-xs">${u.paybackOwed.toFixed(4)}</td>
                        <td className="px-4 py-3 text-right font-mono tabular-nums text-zinc-300 text-xs">{u.fees > 0 ? `$${u.fees.toFixed(4)}` : "—"}</td>
                        <td className="px-4 py-3 text-right font-mono tabular-nums text-zinc-500 text-xs">{u.volume > 0 ? `$${u.volume.toFixed(0)}` : "—"}</td>
                        <td className="px-4 py-3 text-right font-mono tabular-nums text-zinc-500 text-xs">{u.trades || "—"}</td>
                        <td className="px-4 py-3 text-zinc-600 text-xs">{u.joinDate || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile */}
              <div className="md:hidden divide-y divide-zinc-800/40">
                {pageUsers.length === 0 ? (
                  <p className="px-4 py-16 text-center text-zinc-600">데이터 없음</p>
                ) : pageUsers.map((u) => (
                  <div key={`${u.exchange}:${u.uid}`} className="px-4 py-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-semibold ${EXCHANGE_COLORS[u.exchange] || "text-white"}`}>{u.exchange}</span>
                        <span className="font-mono text-zinc-400 text-[11px]">{u.uid}</span>
                      </div>
                      <span className="text-[10px] text-zinc-600">{u.joinDate || ""}</span>
                    </div>
                    {u.email && <p className="text-[11px] text-zinc-500 mb-2">{u.email}</p>}
                    <div className="grid grid-cols-3 gap-3 text-xs">
                      <div>
                        <span className="text-zinc-600">커미션</span>
                        <p className="font-mono text-emerald-400">${u.commission.toFixed(2)}</p>
                      </div>
                      <div>
                        <span className="text-zinc-600">페이백</span>
                        <p className="font-mono text-amber-400 font-semibold">${u.paybackOwed.toFixed(2)}</p>
                      </div>
                      <div>
                        <span className="text-zinc-600">거래</span>
                        <p className="font-mono text-zinc-400">{u.trades}건</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* ── Pagination ── */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-4">
            <button onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0} className="px-3 py-1.5 rounded-lg bg-zinc-800 text-xs text-zinc-400 hover:bg-zinc-700 disabled:opacity-30">이전</button>
            <span className="text-xs text-zinc-500 font-mono">{page + 1} / {totalPages}</span>
            <button onClick={() => setPage(Math.min(totalPages - 1, page + 1))} disabled={page >= totalPages - 1} className="px-3 py-1.5 rounded-lg bg-zinc-800 text-xs text-zinc-400 hover:bg-zinc-700 disabled:opacity-30">다음</button>
          </div>
        )}

        {/* ── Footer Totals ── */}
        {filtered.length > 0 && (
          <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-900/30 p-5">
            <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-medium mb-3">
              {exchangeFilter !== "all" ? `${exchangeFilter} 합계` : "전체 합계"} · {PERIOD_LABELS[period]}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
              <div>
                <p className="text-xs text-zinc-500">총 커미션</p>
                <p className="text-xl font-mono font-bold text-emerald-400">${filteredTotalComm.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-xs text-zinc-500">지급할 페이백</p>
                <p className="text-xl font-mono font-bold text-amber-400">${filteredTotalPayback.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-xs text-zinc-500">유저 수수료 합계</p>
                <p className="text-xl font-mono font-bold text-white">${filteredTotalFees.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-xs text-zinc-500">활성 유저</p>
                <p className="text-xl font-mono font-bold text-white">{filtered.length}명</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Summary Card ── */
function SummaryCard({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: "emerald" | "amber" }) {
  const border = accent === "emerald" ? "border-emerald-500/30 bg-emerald-500/5" : accent === "amber" ? "border-amber-500/30 bg-amber-500/5" : "border-zinc-800 bg-zinc-900/30";
  const color = accent === "emerald" ? "text-emerald-400" : accent === "amber" ? "text-amber-400" : "text-white";
  return (
    <div className={`rounded-xl border p-4 ${border}`}>
      <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-medium">{label}</p>
      <p className={`text-xl sm:text-2xl font-bold font-mono tabular-nums mt-1 ${color}`}>{value}</p>
      {sub && <p className="text-[10px] text-zinc-600 mt-1">{sub}</p>}
    </div>
  );
}
