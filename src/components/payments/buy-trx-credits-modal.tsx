"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export type TrxProductKey = "CHART_SINGLE" | "CHAT_PACK_10";

const PRICE_TABLE: Record<TrxProductKey, { trx: number; labelEn: string; labelKo: string; deliveryEn: string; deliveryKo: string }> = {
  CHART_SINGLE: {
    trx: 3,
    labelEn: "1 chart reading",
    labelKo: "차트 분석 1회",
    deliveryEn: "Unlocks a single chart analysis — bypasses the 3-hour cooldown.",
    deliveryKo: "차트 분석 1회를 즉시 이용할 수 있습니다. 3시간 제한을 우회합니다.",
  },
  CHAT_PACK_10: {
    trx: 5,
    labelEn: "10 chat messages",
    labelKo: "AI 채팅 10회",
    deliveryEn: "Adds 10 AI chat messages — consumed before the free cooldown kicks in.",
    deliveryKo: "AI 채팅 10회가 추가됩니다. 무료 제한보다 우선 사용됩니다.",
  },
};

const TRX_USD_ESTIMATE = 0.25;

interface Props {
  open: boolean;
  onClose: () => void;
  product: TrxProductKey;
  walletAddress: string;
  lang: "ko" | "en";
  onSuccess?: (balances: { chart: number; chat: number; trxBalance: number }) => void;
}

export default function BuyTrxCreditsModal({ open, onClose, product, walletAddress, lang, onSuccess }: Props) {
  const ko = lang === "ko";
  const cfg = PRICE_TABLE[product];
  const usdEstimate = (cfg.trx * TRX_USD_ESTIMATE).toFixed(2);

  const [txid, setTxid] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open) {
      setTxid("");
      setMessage(null);
      setSubmitting(false);
    }
  }, [open]);

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
      const res = await fetch("/api/payment/trx-credits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product, txid: txid.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: "error", text: data.error ?? (ko ? "제출 실패" : "Submission failed") });
      } else if (data.status === "VERIFIED") {
        setMessage({ type: "success", text: data.message });
        if (onSuccess && data.balances) {
          onSuccess({
            chart: data.balances.chartCreditsRemaining ?? 0,
            chat: data.balances.chatCreditsRemaining ?? 0,
            trxBalance: data.balances.trxBalance ?? 0,
          });
        }
        setTimeout(() => onClose(), 1800);
      } else {
        setMessage({ type: "info", text: data.message ?? (ko ? "관리자 검토 중" : "Pending admin review") });
      }
    } catch {
      setMessage({ type: "error", text: ko ? "네트워크 오류. 다시 시도해 주세요." : "Network error. Please try again." });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="sm:max-w-md bg-zinc-950 border-white/[0.08] text-white">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">
            {ko ? `${cfg.labelKo} 구매` : `Buy ${cfg.labelEn}`}
          </DialogTitle>
        </DialogHeader>

        {/* Price card */}
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/[0.04] p-4">
          <p className="text-xs font-mono uppercase tracking-wider text-emerald-400/70 mb-1">
            {ko ? "결제 금액" : "Amount due"}
          </p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white">{cfg.trx}</span>
            <span className="text-lg text-emerald-300 font-mono">TRX</span>
            <span className="text-xs text-zinc-500 ml-1">≈ ${usdEstimate}</span>
          </div>
          <p className="text-[11px] text-zinc-400 mt-2 leading-snug">
            {ko ? cfg.deliveryKo : cfg.deliveryEn}
          </p>
        </div>

        {/* Wallet address */}
        {walletAddress ? (
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 space-y-2">
            <p className="text-[11px] font-mono uppercase tracking-wider text-zinc-500">
              {ko ? `정확히 ${cfg.trx} TRX를 TRON 네트워크로 전송` : `Send exactly ${cfg.trx} TRX via TRON network`}
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-[11px] font-mono text-blue-300 bg-blue-500/[0.06] border border-blue-500/20 rounded-lg px-2.5 py-1.5 break-all">
                {walletAddress}
              </code>
              <button
                type="button"
                onClick={copyAddr}
                className="shrink-0 px-2.5 py-1.5 rounded-lg bg-white/[0.05] border border-white/[0.08] text-zinc-300 hover:text-white text-[11px] font-mono transition-colors"
              >
                {copied ? (ko ? "복사됨" : "Copied") : (ko ? "복사" : "Copy")}
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-red-500/20 bg-red-500/[0.04] p-3 text-xs text-red-300">
            {ko ? "결제 주소가 설정되지 않았습니다. 관리자에게 문의하세요." : "Payment wallet not configured. Please contact support."}
          </div>
        )}

        {/* TXID form */}
        <form onSubmit={handleSubmit} className="space-y-2.5">
          <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-500">
            {ko ? "트랜잭션 해시 (TXID)" : "Transaction hash (TXID)"}
          </label>
          <input
            type="text"
            value={txid}
            onChange={(e) => setTxid(e.target.value)}
            placeholder={ko ? "64자리 hex 트랜잭션 해시" : "64-char hex transaction hash"}
            className="w-full bg-zinc-900 border border-white/[0.08] rounded-lg px-3 py-2 text-xs font-mono text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all"
          />
          {message && (
            <div
              className={`rounded-lg px-3 py-2 text-xs font-mono ${
                message.type === "success"
                  ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
                  : message.type === "error"
                    ? "bg-red-500/10 text-red-300 border border-red-500/20"
                    : "bg-blue-500/10 text-blue-300 border border-blue-500/20"
              }`}
            >
              {message.text}
            </div>
          )}
          <button
            type="submit"
            disabled={submitting || !txid.trim() || !walletAddress}
            className="w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-mono uppercase tracking-[0.15em] transition-colors"
          >
            {submitting
              ? ko
                ? "확인 중..."
                : "Verifying..."
              : ko
                ? `${cfg.trx} TRX 결제 확인`
                : `Verify ${cfg.trx} TRX payment`}
          </button>
          <p className="text-[10px] text-zinc-500 text-center leading-snug">
            {ko
              ? "전송 후 1-2분 내 자동으로 확인됩니다. 금액이 정확하지 않으면 수동 검토됩니다."
              : "Auto-verified within 1–2 minutes of transfer. Mismatched amounts go to manual review."}
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
}
