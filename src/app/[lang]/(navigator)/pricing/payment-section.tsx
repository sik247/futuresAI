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
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-mono uppercase tracking-wider ${cls}`}>
      {label}
    </span>
  );
}

type BillingPeriod = "monthly" | "6month" | "annual";

interface PlanOption {
  amount: number;
  tier: "basic" | "premium";
  period: BillingPeriod;
  name: string;
  nameKo: string;
  color: string;
  description: string;
  descriptionKo: string;
  perMonth: number;
  months: number;
}

const PLANS: PlanOption[] = [
  // Basic
  { amount: 25, tier: "basic", period: "monthly", name: "Basic Monthly", nameKo: "베이직 월간", color: "blue", description: "$25/mo", descriptionKo: "$25/월", perMonth: 25, months: 1 },
  { amount: 129, tier: "basic", period: "6month", name: "Basic 6-Month", nameKo: "베이직 6개월", color: "blue", description: "$21.50/mo · Save 14%", descriptionKo: "월 $21.50 · 14% 할인", perMonth: 21.5, months: 6 },
  { amount: 199, tier: "basic", period: "annual", name: "Basic Annual", nameKo: "베이직 연간", color: "blue", description: "$16.58/mo · Save 34%", descriptionKo: "월 $16.58 · 34% 할인", perMonth: 16.58, months: 12 },
  // Premium
  { amount: 99, tier: "premium", period: "monthly", name: "Premium Monthly", nameKo: "프리미엄 월간", color: "purple", description: "$99/mo", descriptionKo: "$99/월", perMonth: 99, months: 1 },
  { amount: 499, tier: "premium", period: "6month", name: "Premium 6-Month", nameKo: "프리미엄 6개월", color: "purple", description: "$83.17/mo · Save 16%", descriptionKo: "월 $83.17 · 16% 할인", perMonth: 83.17, months: 6 },
  { amount: 799, tier: "premium", period: "annual", name: "Premium Annual", nameKo: "프리미엄 연간", color: "purple", description: "$66.58/mo · Save 33%", descriptionKo: "월 $66.58 · 33% 할인", perMonth: 66.58, months: 12 },
];

export default function PaymentSection({
  walletAddress,
  ko,
}: {
  walletAddress: string;
  ko: boolean;
}) {
  const { data: session, status } = useSession();
  const user = session?.user as { isPremium?: boolean; credits?: number } | undefined;

  const [selectedTier, setSelectedTier] = useState<"basic" | "premium">("premium");
  const [selectedPeriod, setSelectedPeriod] = useState<BillingPeriod>("monthly");
  const selectedPlan = PLANS.find((p) => p.tier === selectedTier && p.period === selectedPeriod)!;
  const [txid, setTxid] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [copied, setCopied] = useState(false);

  const isLoggedIn = status === "authenticated";
  const isPremium = (user as any)?.isPremium === true;
  const credits = (user as any)?.credits || 0;
  const currentTier = isPremium && credits >= 99 ? "PREMIUM" : credits >= 25 ? "BASIC" : "NONE";

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

  async function copyAddr() {
    try {
      await navigator.clipboard.writeText(walletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
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
        body: JSON.stringify({ txid: txid.trim(), amount: selectedPlan.amount, period: selectedPlan.period }),
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
        <a href="/ko/login" className="inline-block px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-mono uppercase tracking-[0.15em] transition-colors">
          {ko ? "로그인" : "Sign In"}
        </a>
      </div>
    );
  }

  return (
    <div className="mt-8 space-y-6">
      {/* Current Tier Badge — only shown if user has an active subscription */}
      {currentTier !== "NONE" && (
        <div className={`rounded-xl border p-4 text-center ${
          currentTier === "PREMIUM" ? "border-purple-500/30 bg-purple-500/[0.04]"
          : "border-blue-500/30 bg-blue-500/[0.04]"
        }`}>
          <div className="flex items-center justify-center gap-2 mb-1">
            <svg className={`w-5 h-5 ${currentTier === "PREMIUM" ? "text-purple-400" : "text-blue-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className={`font-semibold text-sm ${currentTier === "PREMIUM" ? "text-purple-400" : "text-blue-400"}`}>
              {ko
                ? currentTier === "PREMIUM" ? "프리미엄 활성화됨" : "베이직 활성화됨"
                : `${currentTier} Plan Active`}
            </span>
          </div>
          {currentTier === "BASIC" && (
            <p className="text-[11px] text-zinc-500">
              {ko ? "프리미엄으로 업그레이드하면 더 많은 기능을 이용하실 수 있습니다." : "Upgrade to Premium for more features."}
            </p>
          )}
        </div>
      )}

      {/* Tier Selection */}
      <div>
        <p className="text-xs font-mono uppercase tracking-wider text-zinc-500 mb-3">
          {ko ? "플랜 선택" : "Select Plan"}
        </p>
        <div className="grid grid-cols-2 gap-3">
          {(["basic", "premium"] as const).map((tier) => {
            const isSelected = selectedTier === tier;
            const color = tier === "premium" ? "purple" : "blue";
            return (
              <button
                key={tier}
                onClick={() => setSelectedTier(tier)}
                className={`rounded-xl border p-4 text-left transition-all cursor-pointer ${
                  isSelected
                    ? color === "purple"
                      ? "border-purple-500/50 bg-purple-500/[0.08] ring-1 ring-purple-500/20"
                      : "border-blue-500/50 bg-blue-500/[0.08] ring-1 ring-blue-500/20"
                    : "border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12]"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-xs font-mono font-bold uppercase ${
                    color === "purple" ? "text-purple-400" : "text-blue-400"
                  }`}>
                    {tier === "basic" ? (ko ? "베이직" : "Basic") : (ko ? "프리미엄" : "Premium")}
                  </span>
                  {isSelected && (
                    <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  )}
                </div>
                <p className="text-2xl font-bold text-white mb-1">
                  {tier === "basic" ? "$25" : "$99"}
                  <span className="text-xs text-zinc-500 font-normal">/{ko ? "월~" : "mo+"}</span>
                </p>
                <p className="text-sm text-zinc-400">
                  {tier === "premium"
                    ? (ko ? "에이전틱 매크로 리서치 프레임워크" : "Agentic macro research framework")
                    : (ko ? "고래 트래커 + 퀀트 시그널" : "Whale tracker + Quant signals")}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Billing Period Selection */}
      <div>
        <p className="text-xs font-mono uppercase tracking-wider text-zinc-500 mb-3">
          {ko ? "결제 주기" : "Billing Period"}
        </p>
        <div className="grid grid-cols-3 gap-2">
          {PLANS.filter((p) => p.tier === selectedTier).map((plan) => {
            const isSelected = selectedPeriod === plan.period;
            return (
              <button
                key={plan.period}
                onClick={() => setSelectedPeriod(plan.period)}
                className={`rounded-xl border p-3 text-center transition-all cursor-pointer ${
                  isSelected
                    ? "border-emerald-500/50 bg-emerald-500/[0.08] ring-1 ring-emerald-500/20"
                    : "border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12]"
                }`}
              >
                <p className="text-xs font-mono font-bold uppercase text-zinc-300 mb-1">
                  {plan.period === "monthly" ? (ko ? "월간" : "Monthly") : plan.period === "6month" ? (ko ? "6개월" : "6 Months") : (ko ? "연간" : "Annual")}
                </p>
                <p className="text-xl font-bold text-white">${plan.amount}</p>
                <p className="text-[11px] text-zinc-500 mt-0.5">
                  {ko ? plan.descriptionKo : plan.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Wallet Address — TRC-20 Only */}
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 space-y-4">
        <p className="text-xs font-mono uppercase tracking-wider text-zinc-500">
          {ko ? "결제 주소" : "Payment Address"} — {ko ? `정확히 ${selectedPlan.amount} USDT 전송` : `Send exactly ${selectedPlan.amount} USDT`}
        </p>

        {walletAddress && (
          <div>
            <p className="text-xs font-mono text-emerald-400 mb-1.5">USDT TRC-20 (TRON)</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-xs font-mono text-blue-300 bg-blue-500/[0.06] border border-blue-500/20 rounded-lg px-3 py-2 break-all">
                {walletAddress}
              </code>
              <button onClick={copyAddr} className="shrink-0 px-3 py-2 rounded-lg bg-white/[0.05] border border-white/[0.08] text-zinc-400 hover:text-white text-xs font-mono transition-all">
                {copied ? (ko ? "복사됨" : "Copied!") : (ko ? "복사" : "Copy")}
              </button>
            </div>
          </div>
        )}

        <p className="text-xs text-zinc-500">
          {ko
            ? `⚠ 정확히 ${selectedPlan.amount} USDT를 TRC-20 네트워크로 전송해 주세요. 금액이 다르면 자동 인증이 실패합니다.`
            : `⚠ Send exactly ${selectedPlan.amount} USDT via TRC-20 network. Incorrect amounts will fail verification.`}
        </p>
      </div>

      {/* TXID Submission */}
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
        <p className="text-xs font-mono uppercase tracking-wider text-zinc-500 mb-3">
          {ko ? "거래 ID (TXID) 제출" : "Submit Transaction ID (TXID)"}
        </p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="text"
            value={txid}
            onChange={(e) => setTxid(e.target.value)}
            placeholder={ko ? "TRC-20 트랜잭션 해시 입력 (64자리 hex)" : "Enter TRC-20 tx hash (64-char hex)"}
            className="w-full bg-zinc-900 border border-white/[0.08] rounded-lg px-4 py-2.5 text-xs font-mono text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all"
          />
          {message && (
            <div className={`rounded-lg px-4 py-2.5 text-sm font-mono ${
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
            className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-mono uppercase tracking-[0.15em] transition-colors"
          >
            {submitting
              ? (ko ? "확인 중..." : "Verifying...")
              : (ko ? `${selectedPlan.amount} USDT 결제 제출` : `Submit $${selectedPlan.amount} Payment`)}
          </button>
        </form>
      </div>

      {/* Payment History */}
      {(loadingPayments || payments.length > 0) && (
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
          <div className="px-5 py-3 border-b border-white/[0.06]">
            <p className="text-xs font-mono uppercase tracking-wider text-zinc-500">
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
                const explorer = `https://tronscan.org/#/transaction/${p.txid}`;
                return (
                  <div key={p.id} className="px-5 py-3 flex flex-wrap items-center gap-3">
                    <a href={explorer} target="_blank" rel="noopener noreferrer" className="font-mono text-[11px] text-blue-400 hover:text-blue-300 transition-colors truncate max-w-[200px]" title={p.txid}>
                      {p.txid.slice(0, 16)}...{p.txid.slice(-8)}
                    </a>
                    <span className="font-mono text-[11px] text-zinc-400">${p.amount} USDT</span>
                    <StatusBadge status={p.status} />
                    <span className="text-xs text-zinc-500 ml-auto">{new Date(p.createdAt).toLocaleDateString()}</span>
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
