"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

interface Payment {
  id: string;
  txid: string;
  amount: number;
  network: string;
  status: "PENDING" | "VERIFIED" | "REJECTED" | "EXPIRED";
  verifiedAt: string | null;
  adminNote: string | null;
  createdAt: string;
}

function StatusBadge({ status }: { status: Payment["status"] }) {
  const cfg: Record<Payment["status"], { label: string; cls: string }> = {
    VERIFIED: { label: "Verified", cls: "bg-emerald-500/10 text-emerald-400" },
    PENDING: { label: "Pending", cls: "bg-amber-500/10 text-amber-400" },
    REJECTED: { label: "Rejected", cls: "bg-red-500/10 text-red-400" },
    EXPIRED: { label: "Expired", cls: "bg-zinc-500/10 text-zinc-400" },
  };
  const { label, cls } = cfg[status] ?? { label: status, cls: "bg-zinc-500/10 text-zinc-400" };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider ${cls}`}>
      {label}
    </span>
  );
}

const PLANS = [
  { amount: 25, name: "Basic", nameKo: "베이직", color: "blue", chat: 25, chart: 10 },
  { amount: 99, name: "Premium", nameKo: "프리미엄", color: "purple", chat: 100, chart: 30 },
];

export default function PaymentSection({
  walletAddress,
  walletAddressErc20,
  ko,
}: {
  walletAddress: string;
  walletAddressErc20: string;
  ko: boolean;
}) {
  const { data: session, status } = useSession();
  const user = session?.user as { isPremium?: boolean; credits?: number } | undefined;

  const [selectedPlan, setSelectedPlan] = useState<25 | 99>(99);
  const [txid, setTxid] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [copiedErc, setCopiedErc] = useState(false);
  const [copiedTrc, setCopiedTrc] = useState(false);

  const isLoggedIn = status === "authenticated";
  const isPremium = (user as any)?.isPremium === true;
  const credits = (user as any)?.credits || 0;
  const currentTier = isPremium && credits >= 99 ? "PREMIUM" : credits >= 25 ? "BASIC" : "FREE";

  async function loadPayments() {
    if (!isLoggedIn) return;
    setLoadingPayments(true);
    try {
      const res = await fetch("/api/payment");
      if (res.ok) {
        const data = await res.json();
        setPayments(data.payments ?? []);
      }
    } catch {} finally {
      setLoadingPayments(false);
    }
  }

  useEffect(() => {
    if (isLoggedIn) loadPayments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn]);

  async function copyAddr(addr: string, type: "erc" | "trc") {
    try {
      await navigator.clipboard.writeText(addr);
      if (type === "erc") { setCopiedErc(true); setTimeout(() => setCopiedErc(false), 2000); }
      else { setCopiedTrc(true); setTimeout(() => setCopiedTrc(false), 2000); }
    } catch {}
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!txid.trim()) return;
    setSubmitting(true);
    setMessage(null);
    try {
      const res = await fetch("/api/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ txid: txid.trim(), amount: selectedPlan }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: "error", text: data.error ?? "Submission failed" });
      } else if (data.status === "VERIFIED") {
        setMessage({ type: "success", text: data.message });
        setTxid("");
        window.location.reload();
      } else {
        setMessage({ type: "info", text: data.message });
        setTxid("");
        await loadPayments();
      }
    } catch {
      setMessage({ type: "error", text: "Network error. Please try again." });
    } finally {
      setSubmitting(false);
    }
  }

  if (status === "loading") {
    return <div className="mt-8 rounded-xl border border-white/[0.06] bg-white/[0.02] p-6 animate-pulse h-40" />;
  }

  if (!isLoggedIn) {
    return (
      <div className="mt-8 rounded-xl border border-white/[0.06] bg-white/[0.02] p-6 text-center">
        <p className="text-sm text-zinc-400 mb-3">
          {ko ? "결제하려면 로그인이 필요합니다." : "Sign in to make a payment."}
        </p>
        <a href="/ko/login" className="inline-block px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-mono uppercase tracking-[0.15em] transition-colors">
          {ko ? "로그인" : "Sign In"}
        </a>
      </div>
    );
  }

  return (
    <div className="mt-8 space-y-6">
      {/* Current Tier Badge */}
      <div className={`rounded-xl border p-4 text-center ${
        currentTier === "PREMIUM" ? "border-purple-500/30 bg-purple-500/[0.04]"
        : currentTier === "BASIC" ? "border-blue-500/30 bg-blue-500/[0.04]"
        : "border-white/[0.06] bg-white/[0.02]"
      }`}>
        <div className="flex items-center justify-center gap-2 mb-1">
          {currentTier !== "FREE" && (
            <svg className={`w-5 h-5 ${currentTier === "PREMIUM" ? "text-purple-400" : "text-blue-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
          <span className={`font-semibold text-sm ${currentTier === "PREMIUM" ? "text-purple-400" : currentTier === "BASIC" ? "text-blue-400" : "text-zinc-400"}`}>
            {ko
              ? currentTier === "PREMIUM" ? "프리미엄 활성화됨" : currentTier === "BASIC" ? "베이직 활성화됨" : "무료 플랜"
              : `${currentTier} Plan Active`}
          </span>
        </div>
        {currentTier === "BASIC" && (
          <p className="text-[11px] text-zinc-500">
            {ko ? "프리미엄으로 업그레이드하면 더 많은 기능을 이용하실 수 있습니다." : "Upgrade to Premium for more features."}
          </p>
        )}
      </div>

      {/* Plan Selection */}
      <div>
        <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-zinc-500 mb-3">
          {ko ? "플랜 선택" : "Select Plan"}
        </p>
        <div className="grid grid-cols-2 gap-3">
          {PLANS.map((plan) => (
            <button
              key={plan.amount}
              onClick={() => setSelectedPlan(plan.amount as 25 | 99)}
              className={`rounded-xl border p-4 text-left transition-all cursor-pointer ${
                selectedPlan === plan.amount
                  ? plan.color === "purple"
                    ? "border-purple-500/50 bg-purple-500/[0.08] ring-1 ring-purple-500/20"
                    : "border-blue-500/50 bg-blue-500/[0.08] ring-1 ring-blue-500/20"
                  : "border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12]"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`text-xs font-mono font-bold uppercase ${
                  plan.color === "purple" ? "text-purple-400" : "text-blue-400"
                }`}>
                  {ko ? plan.nameKo : plan.name}
                </span>
                {selectedPlan === plan.amount && (
                  <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                )}
              </div>
              <p className="text-2xl font-bold text-white mb-1">${plan.amount}<span className="text-xs text-zinc-500 font-normal">/mo</span></p>
              <div className="text-[10px] text-zinc-500 space-y-0.5">
                <p>{ko ? `AI 채팅 ${plan.chat}회/일` : `${plan.chat} AI chats/day`}</p>
                <p>{ko ? `차트 분석 ${plan.chart}회/일` : `${plan.chart} chart analyses/day`}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Wallet Addresses */}
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 space-y-4">
        <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-zinc-500">
          {ko ? "결제 주소" : "Payment Addresses"} — {ko ? `정확히 ${selectedPlan} USDT 전송` : `Send exactly ${selectedPlan} USDT`}
        </p>

        {/* ERC-20 */}
        {walletAddressErc20 && (
          <div>
            <p className="text-[10px] font-mono text-amber-400 mb-1.5">USDT ERC-20 (Ethereum)</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-xs font-mono text-blue-300 bg-blue-500/[0.06] border border-blue-500/20 rounded-lg px-3 py-2 break-all">
                {walletAddressErc20}
              </code>
              <button onClick={() => copyAddr(walletAddressErc20, "erc")} className="shrink-0 px-3 py-2 rounded-lg bg-white/[0.05] border border-white/[0.08] text-zinc-400 hover:text-white text-xs font-mono transition-all">
                {copiedErc ? (ko ? "복사됨" : "Copied!") : (ko ? "복사" : "Copy")}
              </button>
            </div>
          </div>
        )}

        {/* TRC-20 */}
        {walletAddress && (
          <div>
            <p className="text-[10px] font-mono text-emerald-400 mb-1.5">USDT TRC-20 (TRON)</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-xs font-mono text-blue-300 bg-blue-500/[0.06] border border-blue-500/20 rounded-lg px-3 py-2 break-all">
                {walletAddress}
              </code>
              <button onClick={() => copyAddr(walletAddress, "trc")} className="shrink-0 px-3 py-2 rounded-lg bg-white/[0.05] border border-white/[0.08] text-zinc-400 hover:text-white text-xs font-mono transition-all">
                {copiedTrc ? (ko ? "복사됨" : "Copied!") : (ko ? "복사" : "Copy")}
              </button>
            </div>
          </div>
        )}

        <p className="text-[10px] text-zinc-600">
          {ko
            ? `⚠ 정확히 ${selectedPlan} USDT를 전송해 주세요. 금액이 다르면 자동 인증이 실패할 수 있습니다.`
            : `⚠ Send exactly ${selectedPlan} USDT. Incorrect amounts may fail auto-verification.`}
        </p>
      </div>

      {/* TXID Submission */}
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
        <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-zinc-500 mb-3">
          {ko ? "거래 ID (TXID) 제출" : "Submit Transaction ID (TXID)"}
        </p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="text"
            value={txid}
            onChange={(e) => setTxid(e.target.value)}
            placeholder={ko ? "트랜잭션 해시 입력 (0x... 또는 64자리 hex)" : "Enter tx hash (0x... for ERC-20 or 64-char hex for TRC-20)"}
            className="w-full bg-zinc-900 border border-white/[0.08] rounded-lg px-4 py-2.5 text-xs font-mono text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all"
          />
          {message && (
            <div className={`rounded-lg px-4 py-2.5 text-[11px] font-mono ${
              message.type === "success" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
              : message.type === "error" ? "bg-red-500/10 text-red-400 border border-red-500/20"
              : "bg-blue-500/10 text-blue-300 border border-blue-500/20"
            }`}>
              {message.text}
            </div>
          )}
          <button
            type="submit"
            disabled={submitting || !txid.trim()}
            className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-[11px] font-mono uppercase tracking-[0.15em] transition-colors"
          >
            {submitting
              ? (ko ? "확인 중..." : "Verifying...")
              : (ko ? `${selectedPlan} USDT 결제 제출` : `Submit $${selectedPlan} Payment`)}
          </button>
        </form>
      </div>

      {/* Payment History */}
      {(loadingPayments || payments.length > 0) && (
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
          <div className="px-5 py-3 border-b border-white/[0.06]">
            <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-zinc-500">
              {ko ? "결제 내역" : "Payment History"}
            </p>
          </div>
          {loadingPayments ? (
            <div className="p-5 animate-pulse space-y-2">
              {[0, 1].map((i) => <div key={i} className="h-8 rounded bg-zinc-800/30" />)}
            </div>
          ) : (
            <div className="divide-y divide-white/[0.04]">
              {payments.map((p) => {
                const explorer = p.network === "ERC20"
                  ? `https://etherscan.io/tx/${p.txid}`
                  : `https://tronscan.org/#/transaction/${p.txid}`;
                return (
                  <div key={p.id} className="px-5 py-3 flex flex-wrap items-center gap-3">
                    <a href={explorer} target="_blank" rel="noopener noreferrer" className="font-mono text-[11px] text-blue-400 hover:text-blue-300 transition-colors truncate max-w-[200px]" title={p.txid}>
                      {p.txid.slice(0, 16)}...{p.txid.slice(-8)}
                    </a>
                    <span className="font-mono text-[11px] text-zinc-400">${p.amount} USDT</span>
                    <span className="text-[10px] font-mono text-zinc-600">{p.network}</span>
                    <StatusBadge status={p.status} />
                    <span className="text-[10px] text-zinc-600 ml-auto">{new Date(p.createdAt).toLocaleDateString()}</span>
                    {p.adminNote && <span className="w-full text-[10px] text-zinc-500">{p.adminNote}</span>}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
