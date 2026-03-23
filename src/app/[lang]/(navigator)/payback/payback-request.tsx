"use client";

import { useState, useEffect } from "react";
import { getUserPaybackSummary, submitPaybackRequest, getUserRequestHistory } from "./actions";

interface AccountSummary {
  id: string;
  uid: string;
  exchangeName: string;
  exchangeImage: string;
  totalCommission: number;
  unpaidPayback: number;
}

interface WithdrawalRecord {
  id: string;
  amount: number;
  status: "PENDING" | "SUCCESS" | "FAILED";
  network: string;
  address: string;
  createdAt: string;
  paidAt?: string | null;
  adminNote?: string | null;
  exchangeAccounts: { exchange: { name: string } }[];
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; bg: string; text: string; dot: string }> = {
    PENDING: { label: "Pending", bg: "bg-amber-500/10", text: "text-amber-400", dot: "bg-amber-400" },
    SUCCESS: { label: "Paid", bg: "bg-emerald-500/10", text: "text-emerald-400", dot: "bg-emerald-400" },
    FAILED: { label: "Rejected", bg: "bg-red-500/10", text: "text-red-400", dot: "bg-red-400" },
  };
  const c = config[status] || config.PENDING;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${c.bg} ${c.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
}

export default function PaybackRequest() {
  const [accounts, setAccounts] = useState<AccountSummary[]>([]);
  const [totalUnpaid, setTotalUnpaid] = useState(0);
  const [history, setHistory] = useState<WithdrawalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
  const [address, setAddress] = useState("");
  const [network, setNetwork] = useState("TRC20");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    const [summary, hist] = await Promise.all([
      getUserPaybackSummary(),
      getUserRequestHistory(),
    ]);
    setAccounts(summary.accounts);
    setTotalUnpaid(summary.totalUnpaid);
    setHistory(hist as unknown as WithdrawalRecord[]);
    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (selectedAccounts.length === 0 || !address) return;

    setSubmitting(true);
    setMessage(null);

    const amount = accounts
      .filter((a) => selectedAccounts.includes(a.id))
      .reduce((sum, a) => sum + a.unpaidPayback, 0);

    const result = await submitPaybackRequest({
      exchangeAccountIds: selectedAccounts,
      address,
      network,
      amount,
    });

    if (result.success) {
      setMessage({ type: "success", text: "Payback request submitted successfully!" });
      setShowForm(false);
      setSelectedAccounts([]);
      setAddress("");
      await loadData();
    } else {
      setMessage({ type: "error", text: result.error || "Failed to submit request" });
    }
    setSubmitting(false);
  }

  function toggleAccount(id: string) {
    setSelectedAccounts((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <svg className="w-6 h-6 animate-spin text-zinc-600" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" className="opacity-25" />
          <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Summary */}
      <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-white">Your Payback</h3>
            <p className="text-sm text-zinc-500 mt-1">Unpaid payback across your exchange accounts</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold font-mono tabular-nums text-emerald-400">
              ${totalUnpaid.toFixed(2)}
            </p>
            <p className="text-xs text-zinc-500 mt-1">Available to withdraw</p>
          </div>
        </div>

        {/* Account cards */}
        {accounts.length === 0 ? (
          <p className="text-zinc-500 text-sm py-4">
            No exchange accounts linked. Link your exchange account to start earning payback.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {accounts.map((acc) => (
              <div
                key={acc.id}
                className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] p-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-white/[0.06] border border-white/[0.08] flex items-center justify-center text-sm font-bold text-blue-400">
                    {acc.exchangeName[0]}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{acc.exchangeName}</p>
                    <p className="text-xs text-zinc-500 font-mono">{acc.uid}</p>
                  </div>
                </div>
                <p className={`font-mono tabular-nums text-sm font-semibold ${acc.unpaidPayback > 0 ? "text-emerald-400" : "text-zinc-500"}`}>
                  ${acc.unpaidPayback.toFixed(2)}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Request button */}
        {totalUnpaid > 0 && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="mt-6 w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition-all duration-300 hover:bg-blue-500 hover:shadow-[0_0_30px_-8px_rgba(37,99,235,0.4)]"
          >
            {showForm ? "Cancel" : "Request Payback"}
          </button>
        )}
      </div>

      {/* Message */}
      {message && (
        <div className={`rounded-xl border px-4 py-3 text-sm ${
          message.type === "success"
            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
            : "border-red-500/30 bg-red-500/10 text-red-400"
        }`}>
          {message.text}
        </div>
      )}

      {/* Request Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-6 space-y-5">
          <h4 className="text-lg font-semibold text-white">Request Payback</h4>

          {/* Select accounts */}
          <div>
            <label className="block text-sm text-zinc-400 mb-2">Select Exchange Accounts</label>
            <div className="space-y-2">
              {accounts.filter((a) => a.unpaidPayback > 0).map((acc) => (
                <label
                  key={acc.id}
                  className={`flex items-center justify-between rounded-lg border p-3 cursor-pointer transition-all ${
                    selectedAccounts.includes(acc.id)
                      ? "border-blue-500/40 bg-blue-500/10"
                      : "border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selectedAccounts.includes(acc.id)}
                      onChange={() => toggleAccount(acc.id)}
                      className="rounded border-zinc-600 bg-zinc-800 text-blue-600 focus:ring-blue-500/50"
                    />
                    <span className="text-sm text-white">{acc.exchangeName}</span>
                    <span className="text-xs text-zinc-500 font-mono">{acc.uid}</span>
                  </div>
                  <span className="text-sm font-mono tabular-nums text-emerald-400">
                    ${acc.unpaidPayback.toFixed(2)}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Network */}
          <div>
            <label className="block text-sm text-zinc-400 mb-2">Network</label>
            <select
              value={network}
              onChange={(e) => setNetwork(e.target.value)}
              className="w-full rounded-lg border border-white/[0.08] bg-zinc-900 px-4 py-2.5 text-sm text-white focus:border-blue-500/50 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
            >
              <option value="TRC20">TRC20 (USDT)</option>
              <option value="ERC20">ERC20 (USDT)</option>
              <option value="BEP20">BEP20 (USDT)</option>
            </select>
          </div>

          {/* Wallet Address */}
          <div>
            <label className="block text-sm text-zinc-400 mb-2">Wallet Address</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Enter your wallet address..."
              className="w-full rounded-lg border border-white/[0.08] bg-zinc-900 px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:border-blue-500/50 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
              required
              minLength={10}
            />
          </div>

          {/* Amount preview */}
          {selectedAccounts.length > 0 && (
            <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-zinc-400">Total Request Amount</span>
                <span className="text-xl font-bold font-mono tabular-nums text-emerald-400">
                  ${accounts
                    .filter((a) => selectedAccounts.includes(a.id))
                    .reduce((sum, a) => sum + a.unpaidPayback, 0)
                    .toFixed(2)}
                </span>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || selectedAccounts.length === 0 || !address}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition-all duration-300 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" className="opacity-25" />
                  <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                Submitting...
              </>
            ) : (
              "Submit Request"
            )}
          </button>
        </form>
      )}

      {/* Request History */}
      {history.length > 0 && (
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] overflow-hidden">
          <div className="px-6 py-4 border-b border-white/[0.06]">
            <h3 className="text-sm font-semibold text-zinc-300">Request History</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Exchange</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-zinc-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Network</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody>
                {history.map((req) => (
                  <tr key={req.id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4 text-zinc-400">
                      {new Date(req.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-white">
                      {req.exchangeAccounts.map((ea) => ea.exchange.name).join(", ")}
                    </td>
                    <td className="px-6 py-4 text-right font-mono tabular-nums text-emerald-400 font-semibold">
                      ${req.amount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-mono text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded">
                        {req.network}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={req.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
