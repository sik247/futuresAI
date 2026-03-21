"use client";

import { useState, useEffect, useCallback } from "react";

interface ExchangeData {
  exchange: string;
  account: string;
  status: "ok" | "error" | "no_permission";
  totalPayback: number;
  entries: number;
  error?: string;
}

interface PaybackSummary {
  timestamp: string;
  summary: {
    grandTotal: number;
    healthyExchanges: number;
    totalExchanges: number;
  };
  exchanges: ExchangeData[];
}

function StatusBadge({ status }: { status: string }) {
  const config = {
    ok: { label: "Connected", bg: "bg-emerald-500/10", text: "text-emerald-400", dot: "bg-emerald-400" },
    error: { label: "Error", bg: "bg-red-500/10", text: "text-red-400", dot: "bg-red-400" },
    no_permission: { label: "No Permission", bg: "bg-amber-500/10", text: "text-amber-400", dot: "bg-amber-400" },
  }[status] || { label: status, bg: "bg-zinc-500/10", text: "text-zinc-400", dot: "bg-zinc-400" };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}

export default function AdminDashboard() {
  const [data, setData] = useState<PaybackSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/payback-summary");
      const json = await res.json();
      setData(json);
      setLastRefresh(new Date());
    } catch {
      // keep previous data on error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const needsPayback = data?.summary.grandTotal && data.summary.grandTotal > 0;

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-10">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Payback Admin</h1>
            <p className="text-zinc-500 text-sm mt-1">
              Monitor affiliate commissions across all exchanges
            </p>
          </div>
          <button
            onClick={fetchData}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-zinc-700 bg-zinc-900 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-white disabled:opacity-50"
          >
            {loading ? (
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" className="opacity-25" />
                <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            )}
            Refresh
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {/* Grand Total */}
          <div className={`rounded-xl border p-6 ${needsPayback ? "border-emerald-500/30 bg-emerald-500/5" : "border-zinc-800 bg-zinc-900/50"}`}>
            <p className="text-xs text-zinc-500 uppercase tracking-wider font-medium mb-2">
              Total Payback Owed
            </p>
            <p className={`text-3xl font-bold font-mono tabular-nums ${needsPayback ? "text-emerald-400" : "text-zinc-300"}`}>
              ${data?.summary.grandTotal.toFixed(2) || "0.00"}
            </p>
            {needsPayback && (
              <p className="text-xs text-emerald-400/80 mt-2 font-medium">
                Payback needed
              </p>
            )}
            {data && !needsPayback && (
              <p className="text-xs text-zinc-600 mt-2">No payback due</p>
            )}
          </div>

          {/* Health */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
            <p className="text-xs text-zinc-500 uppercase tracking-wider font-medium mb-2">
              Exchange Health
            </p>
            <p className="text-3xl font-bold font-mono tabular-nums text-white">
              {data?.summary.healthyExchanges || 0}
              <span className="text-zinc-600">/{data?.summary.totalExchanges || 0}</span>
            </p>
            <p className="text-xs text-zinc-600 mt-2">Connected exchanges</p>
          </div>

          {/* Last Updated */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
            <p className="text-xs text-zinc-500 uppercase tracking-wider font-medium mb-2">
              Last Refreshed
            </p>
            <p className="text-lg font-mono text-zinc-300">
              {lastRefresh
                ? lastRefresh.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
                : "--:--:--"}
            </p>
            <p className="text-xs text-zinc-600 mt-2">
              {lastRefresh ? lastRefresh.toLocaleDateString() : "Not yet loaded"}
            </p>
          </div>
        </div>

        {/* Exchange Table */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
          <div className="px-6 py-4 border-b border-zinc-800">
            <h2 className="text-sm font-semibold text-zinc-300">Exchange Breakdown</h2>
          </div>

          {loading && !data ? (
            <div className="flex items-center justify-center py-20">
              <svg className="w-6 h-6 animate-spin text-zinc-600" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" className="opacity-25" />
                <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-800">
                    <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Exchange</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Account</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-zinc-500 uppercase tracking-wider">Entries</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-zinc-500 uppercase tracking-wider">Payback</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.exchanges.map((ex) => (
                    <tr key={ex.exchange} className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors">
                      <td className="px-6 py-4">
                        <span className="font-semibold text-white">{ex.exchange}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-mono text-xs text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded">
                          {ex.account}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={ex.status} />
                      </td>
                      <td className="px-6 py-4 text-right font-mono tabular-nums text-zinc-400">
                        {ex.entries}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className={`font-mono tabular-nums font-semibold ${ex.totalPayback > 0 ? "text-emerald-400" : "text-zinc-500"}`}>
                          ${ex.totalPayback.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {ex.totalPayback > 0 ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-400">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Pay
                          </span>
                        ) : ex.status === "error" || ex.status === "no_permission" ? (
                          <span className="text-xs text-zinc-600 max-w-[200px] truncate block" title={ex.error}>
                            {ex.error}
                          </span>
                        ) : (
                          <span className="text-xs text-zinc-600">No action</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer note */}
        <p className="text-xs text-zinc-600 mt-4 text-center">
          Data fetched from live exchange APIs. Payback amounts are for the last 24 hours.
        </p>
      </div>
    </div>
  );
}
