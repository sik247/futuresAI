"use client";

import Link from "next/link";

interface Props {
  lang: "ko" | "en";
  retryAfterMinutes: number;
  shouldUpgrade: boolean;
  onBuyTrx: () => void;
  onDismiss?: () => void;
}

export default function ChatLimitPaywallCard({
  lang,
  retryAfterMinutes,
  shouldUpgrade,
  onBuyTrx,
  onDismiss,
}: Props) {
  const ko = lang === "ko";
  const mins = Math.max(1, retryAfterMinutes);

  return (
    <div className="w-full max-w-md mx-auto rounded-2xl border border-amber-500/20 bg-gradient-to-b from-amber-950/20 to-zinc-900/90 backdrop-blur-xl p-3.5 sm:p-4 shadow-lg">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-base shrink-0">⏳</span>
          <p className="text-[13px] sm:text-sm font-semibold text-amber-200 truncate">
            {ko ? "무료 채팅 2회를 모두 사용했어요" : "You've used your 2 free chats"}
          </p>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            aria-label={ko ? "닫기" : "Dismiss"}
            className="shrink-0 text-zinc-500 hover:text-zinc-300 transition-colors -mr-1 -mt-1 p-1"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={onBuyTrx}
          className="group flex flex-col items-center justify-center gap-0.5 h-14 rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 active:scale-[0.98] transition-all cursor-pointer"
        >
          <span className="text-[12px] font-bold text-emerald-300 leading-tight">
            {ko ? "10회 구매" : "Buy 10 msgs"}
          </span>
          <span className="text-[10px] font-mono text-emerald-400/80 leading-tight">5 TRX</span>
        </button>

        <Link
          href={`/${lang}/pricing`}
          className="group flex flex-col items-center justify-center gap-0.5 h-14 rounded-xl border border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20 active:scale-[0.98] transition-all"
        >
          <span className="text-[12px] font-bold text-blue-300 leading-tight">
            {ko ? "구독하기" : "Subscribe"}
          </span>
          <span className="text-[10px] font-mono text-blue-400/80 leading-tight">
            {ko ? "월 $25부터" : "from $25/mo"}
          </span>
        </Link>
      </div>

      <div className="flex items-center justify-between mt-2.5 pt-2.5 border-t border-white/[0.06]">
        <p className="text-[10px] text-zinc-500">
          {ko ? `${mins}분 후 초기화` : `Resets in ${mins} min`}
        </p>
        <Link
          href={`/${lang}/pricing`}
          className="text-[10px] font-medium text-blue-400 hover:text-blue-300 transition-colors"
        >
          {ko ? "요금제 비교 →" : "Compare plans →"}
        </Link>
      </div>

      {shouldUpgrade && (
        <p className="sr-only">
          {ko
            ? "프리미엄으로 업그레이드하면 더 많은 분석을 이용할 수 있습니다."
            : "Upgrade to Premium for more analysis."}
        </p>
      )}
    </div>
  );
}
