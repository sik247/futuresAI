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

export default function PaymentSection({
  walletAddress,
  ko,
}: {
  walletAddress: string;
  ko: boolean;
}) {
  const { data: session, status } = useSession();
  const user = session?.user as { isPremium?: boolean } | undefined;

  const [txid, setTxid] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [copied, setCopied] = useState(false);

  const isLoggedIn = status === "authenticated";
  const isPremium = (user as any)?.isPremium === true;

  async function loadPayments() {
    if (!isLoggedIn) return;
    setLoadingPayments(true);
    try {
      const res = await fetch("/api/payment");
      if (res.ok) {
        const data = await res.json();
        setPayments(data.payments ?? []);
      }
    } catch {
      /* ignore */
    } finally {
      setLoadingPayments(false);
    }
  }

  useEffect(() => {
    if (isLoggedIn) loadPayments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn]);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(walletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
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
        body: JSON.stringify({ txid: txid.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: "error", text: data.error ?? "Submission failed" });
      } else if (data.status === "VERIFIED") {
        setMessage({ type: "success", text: data.message });
        setTxid("");
        // Reload page to refresh premium state
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
    return (
      <div className="mt-8 rounded-xl border border-white/[0.06] bg-white/[0.02] p-6 animate-pulse h-40" />
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="mt-8 rounded-xl border border-white/[0.06] bg-white/[0.02] p-6 text-center">
        <p className="text-sm text-zinc-400 mb-3">
          {ko ? "결제하려면 로그인이 필요합니다." : "Sign in to make a payment."}
        </p>
        <a
          href="/ko/auth/login"
          className="inline-block px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-mono uppercase tracking-[0.15em] transition-colors"
        >
          {ko ? "로그인" : "Sign In"}
        </a>
      </div>
    );
  }

  if (isPremium) {
    return (
      <div className="mt-8 rounded-xl border border-emerald-500/30 bg-emerald-500/[0.04] p-6 text-center">
        <div className="flex items-center justify-center gap-2 mb-1">
          <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-emerald-400 font-semibold text-sm">
            {ko ? "프리미엄 활성화됨" : "You're Premium"}
          </span>
        </div>
        <p className="text-[11px] text-zinc-500">
          {ko ? "모든 프리미엄 기능을 이용하실 수 있습니다." : "All premium features are unlocked for your account."}
        </p>
      </div>
    );
  }

  return (
    <div className="mt-8 space-y-6">
      {/* Wallet Address */}
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
        <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-zinc-500 mb-3">
          {ko ? "결제 주소 (USDT TRC20)" : "Payment Address (USDT TRC20)"}
        </p>
        <div className="flex items-center gap-2">
          <code className="flex-1 text-xs font-mono text-blue-300 bg-blue-500/[0.06] border border-blue-500/20 rounded-lg px-3 py-2 break-all">
            {walletAddress}
          </code>
          <button
            onClick={handleCopy}
            className="shrink-0 px-3 py-2 rounded-lg bg-white/[0.05] border border-white/[0.08] text-zinc-400 hover:text-white hover:border-white/[0.15] text-xs font-mono transition-all"
          >
            {copied ? (ko ? "복사됨" : "Copied!") : (ko ? "복사" : "Copy")}
          </button>
        </div>
        <p className="text-[10px] text-zinc-600 mt-2">
          {ko
            ? "정확히 99 USDT를 위 주소로 TRC20 네트워크를 통해 전송해 주세요."
            : "Send exactly 99 USDT to the address above via the TRC20 network."}
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
            placeholder={ko ? "64자리 트랜잭션 해시 입력" : "Enter 64-character transaction hash"}
            className="w-full bg-zinc-900 border border-white/[0.08] rounded-lg px-4 py-2.5 text-xs font-mono text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all"
          />
          {message && (
            <div
              className={`rounded-lg px-4 py-2.5 text-[11px] font-mono ${
                message.type === "success"
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  : message.type === "error"
                  ? "bg-red-500/10 text-red-400 border border-red-500/20"
                  : "bg-blue-500/10 text-blue-300 border border-blue-500/20"
              }`}
            >
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
              : (ko ? "결제 제출" : "Submit Payment")}
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
              {[0, 1].map((i) => (
                <div key={i} className="h-8 rounded bg-zinc-800/30" />
              ))}
            </div>
          ) : (
            <div className="divide-y divide-white/[0.04]">
              {payments.map((p) => (
                <div key={p.id} className="px-5 py-3 flex flex-wrap items-center gap-3">
                  <a
                    href={`https://tronscan.org/#/transaction/${p.txid}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-[11px] text-blue-400 hover:text-blue-300 transition-colors truncate max-w-[200px]"
                    title={p.txid}
                  >
                    {p.txid.slice(0, 16)}...{p.txid.slice(-8)}
                  </a>
                  <span className="font-mono text-[11px] text-zinc-400">${p.amount} USDT</span>
                  <StatusBadge status={p.status} />
                  <span className="text-[10px] text-zinc-600 ml-auto">
                    {new Date(p.createdAt).toLocaleDateString()}
                  </span>
                  {p.adminNote && (
                    <span className="w-full text-[10px] text-zinc-500 pl-0">{p.adminNote}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
