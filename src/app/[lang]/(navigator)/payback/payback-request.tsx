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

function StatusBadge({ status, ko }: { status: string; ko: boolean }) {
  const config: Record<string, { label: string; labelKo: string; bg: string; text: string; dot: string }> = {
    PENDING: { label: "Pending", labelKo: "대기 중", bg: "bg-amber-500/10", text: "text-amber-400", dot: "bg-amber-400" },
    SUCCESS: { label: "Paid", labelKo: "지급 완료", bg: "bg-emerald-500/10", text: "text-emerald-400", dot: "bg-emerald-400" },
    FAILED: { label: "Rejected", labelKo: "거절됨", bg: "bg-red-500/10", text: "text-red-400", dot: "bg-red-400" },
  };
  const c = config[status] || config.PENDING;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${c.bg} ${c.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {ko ? c.labelKo : c.label}
    </span>
  );
}

type Props = {
  lang: string;
};

export default function PaybackRequest({ lang }: Props) {
  const ko = lang === "ko";
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
      setMessage({
        type: "success",
        text: ko
          ? "페이백 요청이 성공적으로 제출되었습니다!"
          : "Payback request submitted successfully!",
      });
      setShowForm(false);
      setSelectedAccounts([]);
      setAddress("");
      await loadData();
    } else {
      setMessage({
        type: "error",
        text: result.error || (ko ? "요청 제출에 실패했습니다" : "Failed to submit request"),
      });
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
            <h3 className="text-xl font-bold text-white">
              {ko ? "내 페이백" : "Your Payback"}
            </h3>
            <p className="text-sm text-zinc-500 mt-1">
              {ko
                ? "거래소 계정의 미지급 페이백"
                : "Unpaid payback across your exchange accounts"}
            </p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold font-mono tabular-nums text-emerald-400">
              ${totalUnpaid.toFixed(2)}
            </p>
            <p className="text-xs text-zinc-500 mt-1">
              {ko ? "출금 가능" : "Available to withdraw"}
            </p>
          </div>
        </div>

        {/* Account cards */}
        {accounts.length === 0 ? (
          <p className="text-zinc-500 text-sm py-4">
            {ko
              ? "연결된 거래소 계정이 없습니다. 거래소 계정을 연결하면 페이백을 받을 수 있습니다."
              : "No exchange accounts linked. Link your exchange account to start earning payback."}
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
            {showForm
              ? ko ? "취소" : "Cancel"
              : ko ? "페이백 요청" : "Request Payback"}
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
          <h4 className="text-lg font-semibold text-white">
            {ko ? "페이백 요청" : "Request Payback"}
          </h4>

          {/* Select accounts */}
          <div>
            <label className="block text-sm text-zinc-400 mb-2">
              {ko ? "거래소 계정 선택" : "Select Exchange Accounts"}
            </label>
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
            <label className="block text-sm text-zinc-400 mb-2">
              {ko ? "네트워크" : "Network"}
            </label>
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
            <label className="block text-sm text-zinc-400 mb-2">
              {ko ? "지갑 주소" : "Wallet Address"}
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder={ko ? "지갑 주소를 입력하세요..." : "Enter your wallet address..."}
              className="w-full rounded-lg border border-white/[0.08] bg-zinc-900 px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:border-blue-500/50 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
              required
              minLength={10}
            />
          </div>

          {/* Amount preview */}
          {selectedAccounts.length > 0 && (
            <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-zinc-400">
                  {ko ? "총 요청 금액" : "Total Request Amount"}
                </span>
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
                {ko ? "제출 중..." : "Submitting..."}
              </>
            ) : (
              ko ? "요청 제출" : "Submit Request"
            )}
          </button>
        </form>
      )}

      {/* Request History — Timeline Style */}
      {history.length > 0 && (
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-6">
          <h3 className="text-sm font-semibold text-zinc-300 mb-6">
            {ko ? "출금 내역" : "Withdrawal History"}
          </h3>
          <div className="space-y-4">
            {history.map((req) => {
              const isPending = req.status === "PENDING";
              const isPaid = req.status === "SUCCESS";
              const isRejected = req.status === "FAILED";

              return (
                <div
                  key={req.id}
                  className={`rounded-xl border p-5 transition-all ${
                    isPending
                      ? "border-amber-500/20 bg-amber-500/[0.03]"
                      : isPaid
                      ? "border-emerald-500/20 bg-emerald-500/[0.03]"
                      : "border-red-500/20 bg-red-500/[0.03]"
                  }`}
                >
                  {/* Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <StatusBadge status={req.status} ko={ko} />
                      <span className="text-sm font-semibold text-white font-mono">${req.amount.toFixed(2)}</span>
                    </div>
                    <span className="text-xs text-zinc-500">
                      {new Date(req.createdAt).toLocaleDateString("ko-KR", { year: "numeric", month: "short", day: "numeric" })}
                    </span>
                  </div>

                  {/* Progress Steps */}
                  <div className="flex items-center gap-0 mb-4">
                    {/* Step 1: Submitted */}
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
                        <svg className="w-3 h-3 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                      </div>
                      <span className="text-[11px] text-emerald-400 font-medium">제출됨</span>
                    </div>
                    <div className={`flex-1 h-px mx-2 ${isPaid || isPending ? "bg-emerald-500/30" : "bg-red-500/30"}`} />

                    {/* Step 2: Under Review */}
                    <div className="flex items-center gap-2">
                      <div className={`w-6 h-6 rounded-full border flex items-center justify-center ${
                        isPending
                          ? "bg-amber-500/20 border-amber-500/40"
                          : isPaid
                          ? "bg-emerald-500/20 border-emerald-500/40"
                          : "bg-red-500/20 border-red-500/40"
                      }`}>
                        {isPending ? (
                          <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                        ) : isPaid ? (
                          <svg className="w-3 h-3 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                        ) : (
                          <svg className="w-3 h-3 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                        )}
                      </div>
                      <span className={`text-[11px] font-medium ${isPending ? "text-amber-400" : isPaid ? "text-emerald-400" : "text-red-400"}`}>
                        {isPending ? "검토 중" : isPaid ? "승인됨" : "거절됨"}
                      </span>
                    </div>
                    <div className={`flex-1 h-px mx-2 ${isPaid ? "bg-emerald-500/30" : "bg-zinc-800"}`} />

                    {/* Step 3: Paid */}
                    <div className="flex items-center gap-2">
                      <div className={`w-6 h-6 rounded-full border flex items-center justify-center ${
                        isPaid
                          ? "bg-emerald-500/20 border-emerald-500/40"
                          : "bg-zinc-800/50 border-zinc-700/50"
                      }`}>
                        {isPaid ? (
                          <svg className="w-3 h-3 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                        ) : (
                          <span className="text-[9px] text-zinc-600">3</span>
                        )}
                      </div>
                      <span className={`text-[11px] font-medium ${isPaid ? "text-emerald-400" : "text-zinc-600"}`}>
                        {isPaid ? "지급 완료" : "지급 대기"}
                      </span>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <span className="text-zinc-600 block mb-0.5">거래소</span>
                      <span className="text-zinc-300">{req.exchangeAccounts.map((ea) => ea.exchange.name).join(", ") || "—"}</span>
                    </div>
                    <div>
                      <span className="text-zinc-600 block mb-0.5">네트워크</span>
                      <span className="text-zinc-300 font-mono">{req.network}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-zinc-600 block mb-0.5">지갑 주소</span>
                      <span className="text-zinc-300 font-mono text-[11px] break-all">{req.address}</span>
                    </div>
                  </div>

                  {/* Paid date or rejection note */}
                  {isPaid && req.paidAt && (
                    <div className="mt-3 pt-3 border-t border-emerald-500/10">
                      <span className="text-[11px] text-emerald-400">
                        {new Date(req.paidAt).toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" })}에 지급 완료
                      </span>
                    </div>
                  )}
                  {isRejected && req.adminNote && (
                    <div className="mt-3 pt-3 border-t border-red-500/10">
                      <span className="text-[11px] text-red-400">사유: {req.adminNote}</span>
                    </div>
                  )}
                  {isPending && (
                    <div className="mt-3 pt-3 border-t border-amber-500/10">
                      <span className="text-[11px] text-amber-400">관리자 검토 중입니다. 일반적으로 24시간 이내에 처리됩니다.</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
