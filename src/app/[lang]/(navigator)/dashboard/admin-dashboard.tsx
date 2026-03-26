"use client";

import { useState, useEffect, useCallback } from "react";
import { getPendingRequests, getAllRequests, approveRequest, rejectRequest } from "./actions";

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

interface WithdrawalRequest {
  id: string;
  amount: number;
  status: "PENDING" | "SUCCESS" | "FAILED";
  network: string;
  address: string;
  adminNote?: string | null;
  createdAt: string;
  paidAt?: string | null;
  user?: { name: string; email: string; nickname: string } | null;
  exchangeAccounts: { exchange: { name: string } }[];
}

interface ChartAnalysisRequest {
  id: string;
  imageUrl: string;
  pair: string | null;
  cost: number;
  status: string;
  summary: string;
  trend: string;
  confidence: number;
  riskScore: number;
  createdAt: string;
  chargedAt: string | null;
  user: { name: string; email: string; nickname: string };
}

/* ------------------------------------------------------------------ */
/*  Status Badge                                                        */
/* ------------------------------------------------------------------ */
function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; bg: string; text: string; dot: string }> = {
    ok: { label: "Connected", bg: "bg-emerald-500/10", text: "text-emerald-400", dot: "bg-emerald-400" },
    error: { label: "Error", bg: "bg-red-500/10", text: "text-red-400", dot: "bg-red-400" },
    no_permission: { label: "No Permission", bg: "bg-amber-500/10", text: "text-amber-400", dot: "bg-amber-400" },
    PENDING: { label: "Pending", bg: "bg-amber-500/10", text: "text-amber-400", dot: "bg-amber-400" },
    SUCCESS: { label: "Paid", bg: "bg-emerald-500/10", text: "text-emerald-400", dot: "bg-emerald-400" },
    FAILED: { label: "Rejected", bg: "bg-red-500/10", text: "text-red-400", dot: "bg-red-400" },
    CHARGED: { label: "Charged", bg: "bg-emerald-500/10", text: "text-emerald-400", dot: "bg-emerald-400" },
    REFUNDED: { label: "Refunded", bg: "bg-blue-500/10", text: "text-blue-400", dot: "bg-blue-400" },
  };
  const c = config[status] || { label: status, bg: "bg-zinc-500/10", text: "text-zinc-400", dot: "bg-zinc-400" };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${c.bg} ${c.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Stat Card                                                           */
/* ------------------------------------------------------------------ */
function StatCard({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: boolean }) {
  return (
    <div className={`rounded-xl border p-5 transition-all hover:border-white/[0.12] ${accent ? "border-emerald-500/30 bg-emerald-500/5" : "border-white/[0.06] bg-white/[0.03]"}`}>
      <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-[0.2em] mb-2">{label}</p>
      <p className={`text-2xl font-bold font-mono ${accent ? "text-emerald-400" : "text-white"}`}>{value}</p>
      {sub && <p className="text-[11px] text-zinc-600 mt-1">{sub}</p>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Section Header                                                      */
/* ------------------------------------------------------------------ */
function SectionHeader({ title, subtitle, color = "bg-blue-500/70", badge, children }: {
  title: string; subtitle?: string; color?: string; badge?: string; children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
      <div className="flex items-center gap-3">
        <div className={`w-1.5 h-6 rounded-full ${color}`} />
        <div>
          <h2 className="text-base font-semibold text-zinc-200">{title}</h2>
          {subtitle && <p className="text-xs text-zinc-500 mt-0.5">{subtitle}</p>}
        </div>
        {badge && (
          <span className="px-2 py-0.5 rounded bg-white/[0.05] text-[11px] font-mono text-zinc-500">{badge}</span>
        )}
      </div>
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Admin Dashboard                                                */
/* ------------------------------------------------------------------ */
export default function AdminDashboard() {
  const [data, setData] = useState<PaybackSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<WithdrawalRequest[]>([]);
  const [requestFilter, setRequestFilter] = useState<"ALL" | "PENDING" | "SUCCESS" | "FAILED">("ALL");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [chartAnalyses, setChartAnalyses] = useState<ChartAnalysisRequest[]>([]);
  const [chartFilter, setChartFilter] = useState<"ALL" | "PENDING" | "CHARGED" | "REFUNDED">("ALL");
  const [testLoading, setTestLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/payback-summary");
      const json = await res.json();
      setData(json);
    } catch { /* keep previous */ }
    finally { setLoading(false); }
  }, []);

  const fetchRequests = useCallback(async () => {
    try {
      const filter = requestFilter === "ALL" ? undefined : requestFilter;
      const data = await getAllRequests(filter);
      setRequests(data as unknown as WithdrawalRequest[]);
    } catch { /* keep previous */ }
  }, [requestFilter]);

  const fetchChartAnalyses = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/chart-analyses");
      if (res.ok) {
        const data = await res.json();
        setChartAnalyses(data.analyses || []);
      }
    } catch { /* keep previous */ }
  }, []);

  useEffect(() => {
    fetchData();
    fetchRequests();
    fetchChartAnalyses();
  }, [fetchData, fetchRequests, fetchChartAnalyses]);

  async function handleApprove(id: string) {
    setActionLoading(id);
    const result = await approveRequest(id);
    if (result.success) await fetchRequests();
    setActionLoading(null);
  }

  async function handleReject(id: string) {
    const note = prompt("Rejection reason:");
    if (!note) return;
    setActionLoading(id);
    const result = await rejectRequest(id, note);
    if (result.success) await fetchRequests();
    setActionLoading(null);
  }

  async function handleChargeAnalysis(id: string) {
    setActionLoading(id);
    try {
      const res = await fetch("/api/chart-analysis", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ analysisId: id, action: "approve" }),
      });
      if (res.ok) await fetchChartAnalyses();
    } catch { /* ignore */ }
    setActionLoading(null);
  }

  async function handleRefundAnalysis(id: string) {
    setActionLoading(id);
    try {
      const res = await fetch("/api/chart-analysis", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ analysisId: id, action: "refund" }),
      });
      if (res.ok) await fetchChartAnalyses();
    } catch { /* ignore */ }
    setActionLoading(null);
  }

  async function handleTestPayback() {
    setTestLoading(true);
    try {
      const res = await fetch("/api/admin/test-payback", { method: "POST" });
      const result = await res.json();
      if (result.success) {
        alert(`Test withdrawal created!\nAmount: $${result.amount}\nAddress: ${result.address}\nRefresh to see it in Pending.`);
        await fetchRequests();
      } else {
        alert(`Failed: ${result.error}`);
      }
    } catch (e) {
      alert("Failed to create test payback");
    } finally {
      setTestLoading(false);
    }
  }

  const filteredChartAnalyses = chartFilter === "ALL"
    ? chartAnalyses
    : chartAnalyses.filter((a) => a.status === chartFilter);

  const pendingCount = requests.filter((r) => r.status === "PENDING").length;
  const pendingAmount = requests.filter((r) => r.status === "PENDING").reduce((s, r) => s + r.amount, 0);
  const paidTotal = requests.filter((r) => r.status === "SUCCESS").reduce((s, r) => s + r.amount, 0);

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-24 pb-16">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-10">
          <div>
            <p className="text-[11px] font-mono uppercase tracking-[0.25em] text-zinc-500 mb-2">Admin Panel</p>
            <h1 className="text-3xl font-bold tracking-tight">FuturesAI Admin</h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleTestPayback}
              disabled={testLoading}
              className="px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm font-medium hover:bg-amber-500/20 transition-colors disabled:opacity-50"
            >
              {testLoading ? "Creating..." : "Test Payback"}
            </button>
            <button
              onClick={() => { fetchData(); fetchRequests(); fetchChartAnalyses(); }}
              disabled={loading}
              className="px-4 py-2 rounded-xl border border-white/[0.06] bg-white/[0.03] text-sm font-medium text-zinc-300 hover:border-white/[0.12] hover:bg-white/[0.05] transition-all disabled:opacity-50"
            >
              {loading ? "..." : "Refresh All"}
            </button>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
          <StatCard
            label="Total Payback Owed"
            value={`$${data?.summary.grandTotal.toFixed(2) || "0.00"}`}
            sub={`${data?.summary.healthyExchanges || 0}/${data?.summary.totalExchanges || 0} exchanges connected`}
            accent={!!data?.summary.grandTotal && data.summary.grandTotal > 0}
          />
          <StatCard
            label="Pending Withdrawals"
            value={String(pendingCount)}
            sub={pendingCount > 0 ? `$${pendingAmount.toFixed(2)} total` : "All clear"}
            accent={pendingCount > 0}
          />
          <StatCard
            label="Total Paid Out"
            value={`$${paidTotal.toFixed(2)}`}
            sub={`${requests.filter(r => r.status === "SUCCESS").length} withdrawals`}
          />
          <StatCard
            label="Chart Analyses"
            value={String(chartAnalyses.length)}
            sub={`${chartAnalyses.filter(a => a.status === "PENDING").length} pending review`}
          />
        </div>

        {/* ============================================================ */}
        {/*  EXCHANGE BREAKDOWN                                          */}
        {/* ============================================================ */}
        <div className="mb-10">
          <SectionHeader title="Exchange Breakdown" subtitle="Live affiliate commission data" color="bg-emerald-500/70" badge={`${data?.exchanges?.length || 0} exchanges`} />

          <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] overflow-hidden">
            {loading && !data ? (
              <div className="animate-pulse p-6 space-y-4">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-12 rounded-lg bg-zinc-800/30" />
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/[0.06]">
                      {["Exchange", "Account", "Status", "Entries", "Payback", "Details"].map((h) => (
                        <th key={h} className="px-5 py-3 text-left text-[10px] font-mono text-zinc-500 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data?.exchanges.map((ex) => (
                      <tr key={ex.exchange} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                        <td className="px-5 py-4 font-semibold text-white">{ex.exchange}</td>
                        <td className="px-5 py-4">
                          <span className="font-mono text-xs text-zinc-400 bg-zinc-800/50 px-2 py-0.5 rounded">{ex.account}</span>
                        </td>
                        <td className="px-5 py-4"><StatusBadge status={ex.status} /></td>
                        <td className="px-5 py-4 font-mono text-zinc-400">{ex.entries}</td>
                        <td className="px-5 py-4">
                          <span className={`font-mono font-semibold ${ex.totalPayback > 0 ? "text-emerald-400" : "text-zinc-600"}`}>
                            ${ex.totalPayback.toFixed(2)}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          {ex.error ? (
                            <span className="text-xs text-red-400/80 max-w-[250px] block truncate" title={ex.error}>{ex.error}</span>
                          ) : (
                            <span className="text-xs text-zinc-600">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* ============================================================ */}
        {/*  WITHDRAWAL REQUESTS                                         */}
        {/* ============================================================ */}
        <div className="mb-10">
          <SectionHeader
            title="Payback Requests"
            subtitle="User withdrawal requests"
            color={pendingCount > 0 ? "bg-amber-500/70" : "bg-blue-500/70"}
            badge={pendingCount > 0 ? `${pendingCount} pending` : "up to date"}
          >
            <div className="flex gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              {(["ALL", "PENDING", "SUCCESS", "FAILED"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setRequestFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    requestFilter === f
                      ? "bg-blue-600/20 text-blue-400 border border-blue-500/30"
                      : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  {f === "ALL" ? "All" : f === "PENDING" ? "Pending" : f === "SUCCESS" ? "Paid" : "Rejected"}
                </button>
              ))}
            </div>
          </SectionHeader>

          <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] overflow-hidden">
            {requests.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <p className="text-zinc-600 text-sm">No payback requests found</p>
                <button onClick={handleTestPayback} disabled={testLoading} className="mt-3 text-xs text-amber-400 hover:text-amber-300 transition-colors">
                  {testLoading ? "Creating..." : "Create a test request"}
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/[0.06]">
                      {["User", "Exchange", "Amount", "Network", "Address", "Status", "Date", "Actions"].map((h) => (
                        <th key={h} className="px-5 py-3 text-left text-[10px] font-mono text-zinc-500 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {requests.map((req) => (
                      <tr key={req.id} className={`border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors ${req.status === "PENDING" ? "bg-amber-500/[0.02]" : ""}`}>
                        <td className="px-5 py-4">
                          <p className="font-medium text-white text-sm">{req.user?.name || req.user?.nickname || "Unknown"}</p>
                          <p className="text-[11px] text-zinc-500">{req.user?.email}</p>
                        </td>
                        <td className="px-5 py-4 text-zinc-300 text-xs">
                          {req.exchangeAccounts.map((ea) => ea.exchange.name).join(", ") || "—"}
                        </td>
                        <td className="px-5 py-4">
                          <span className="font-mono font-semibold text-emerald-400">${req.amount.toFixed(2)}</span>
                        </td>
                        <td className="px-5 py-4">
                          <span className="text-xs font-mono text-zinc-400 bg-zinc-800/50 px-2 py-0.5 rounded">{req.network}</span>
                        </td>
                        <td className="px-5 py-4">
                          <span className="text-xs font-mono text-zinc-400 max-w-[120px] truncate block" title={req.address}>{req.address}</span>
                        </td>
                        <td className="px-5 py-4"><StatusBadge status={req.status} /></td>
                        <td className="px-5 py-4 text-zinc-500 text-xs">{new Date(req.createdAt).toLocaleDateString()}</td>
                        <td className="px-5 py-4">
                          {req.status === "PENDING" ? (
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleApprove(req.id)}
                                disabled={actionLoading === req.id}
                                className="px-3 py-1.5 rounded-lg bg-emerald-600/20 text-emerald-400 text-xs font-medium hover:bg-emerald-600/30 transition-colors disabled:opacity-50"
                              >
                                {actionLoading === req.id ? "..." : "Approve"}
                              </button>
                              <button
                                onClick={() => handleReject(req.id)}
                                disabled={actionLoading === req.id}
                                className="px-3 py-1.5 rounded-lg bg-red-600/20 text-red-400 text-xs font-medium hover:bg-red-600/30 transition-colors disabled:opacity-50"
                              >
                                Reject
                              </button>
                            </div>
                          ) : req.paidAt ? (
                            <span className="text-xs text-emerald-500">Paid {new Date(req.paidAt).toLocaleDateString()}</span>
                          ) : req.adminNote ? (
                            <span className="text-xs text-zinc-500" title={req.adminNote}>{req.adminNote.substring(0, 30)}</span>
                          ) : (
                            <span className="text-xs text-zinc-600">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* ============================================================ */}
        {/*  CHART ANALYSIS                                              */}
        {/* ============================================================ */}
        <div className="mb-10">
          <SectionHeader
            title="Chart Analysis Log"
            subtitle="AI chart analyses from users"
            color="bg-purple-500/70"
            badge={`${chartAnalyses.length} total`}
          >
            <div className="flex gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              {(["ALL", "PENDING", "CHARGED", "REFUNDED"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setChartFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    chartFilter === f
                      ? "bg-blue-600/20 text-blue-400 border border-blue-500/30"
                      : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  {f === "ALL" ? "All" : f === "PENDING" ? "Pending" : f === "CHARGED" ? "Charged" : "Refunded"}
                </button>
              ))}
            </div>
          </SectionHeader>

          <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] overflow-hidden">
            {filteredChartAnalyses.length === 0 ? (
              <div className="flex items-center justify-center py-16 text-zinc-600 text-sm">
                No chart analyses found
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/[0.06]">
                      {["User", "Pair", "Trend", "Confidence", "Status", "Date", "Actions"].map((h) => (
                        <th key={h} className="px-5 py-3 text-left text-[10px] font-mono text-zinc-500 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredChartAnalyses.map((a) => (
                      <tr key={a.id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                        <td className="px-5 py-4">
                          <p className="font-medium text-white text-sm">{a.user?.name || "Unknown"}</p>
                          <p className="text-[11px] text-zinc-500">{a.user?.email}</p>
                        </td>
                        <td className="px-5 py-4 font-mono text-zinc-300">{a.pair || "—"}</td>
                        <td className="px-5 py-4">
                          <span className={`text-xs font-bold ${a.trend === "BULLISH" ? "text-green-400" : a.trend === "BEARISH" ? "text-red-400" : "text-yellow-400"}`}>
                            {a.trend}
                          </span>
                        </td>
                        <td className="px-5 py-4 font-mono text-zinc-300">{a.confidence}%</td>
                        <td className="px-5 py-4"><StatusBadge status={a.status} /></td>
                        <td className="px-5 py-4 text-zinc-500 text-xs">{new Date(a.createdAt).toLocaleDateString()}</td>
                        <td className="px-5 py-4">
                          {a.status === "PENDING" ? (
                            <div className="flex gap-2">
                              <button onClick={() => handleChargeAnalysis(a.id)} disabled={actionLoading === a.id}
                                className="px-3 py-1.5 rounded-lg bg-emerald-600/20 text-emerald-400 text-xs font-medium hover:bg-emerald-600/30 transition-colors disabled:opacity-50">
                                {actionLoading === a.id ? "..." : "Charge"}
                              </button>
                              <button onClick={() => handleRefundAnalysis(a.id)} disabled={actionLoading === a.id}
                                className="px-3 py-1.5 rounded-lg bg-red-600/20 text-red-400 text-xs font-medium hover:bg-red-600/30 transition-colors disabled:opacity-50">
                                Refund
                              </button>
                            </div>
                          ) : a.chargedAt ? (
                            <span className="text-xs text-emerald-500">Charged {new Date(a.chargedAt).toLocaleDateString()}</span>
                          ) : (
                            <span className="text-xs text-zinc-600">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
