"use client";

import { useState } from "react";

type BillingPeriod = "monthly" | "6month" | "annual";

const PRICING = {
  basic: { monthly: 25, "6month": 129, annual: 199 },
  premium: { monthly: 99, "6month": 499, annual: 799 },
} as const;

function CheckIcon() {
  return (
    <svg className="w-4 h-4 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg className="w-4 h-4 text-zinc-700 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function Feature({ included, children, highlight }: { included: boolean; children: React.ReactNode; highlight?: boolean }) {
  return (
    <div className="flex items-center gap-3 py-2">
      {included ? <CheckIcon /> : <XIcon />}
      <span className={`text-sm ${included ? (highlight ? "text-white font-semibold" : "text-zinc-300") : "text-zinc-600"}`}>
        {children}
      </span>
    </div>
  );
}

function perMonth(total: number, period: BillingPeriod) {
  if (period === "monthly") return total;
  if (period === "6month") return Math.round((total / 6) * 100) / 100;
  return Math.round((total / 12) * 100) / 100;
}

function periodSuffix(period: BillingPeriod, ko: boolean) {
  if (period === "monthly") return ko ? "/월" : "/mo";
  if (period === "6month") return ko ? "/6개월" : "/6mo";
  return ko ? "/년" : "/yr";
}

function saveBadge(period: BillingPeriod, tier: "basic" | "premium") {
  if (period === "monthly") return null;
  const monthly = PRICING[tier].monthly;
  const months = period === "6month" ? 6 : 12;
  const total = PRICING[tier][period];
  const pct = Math.round((1 - total / (monthly * months)) * 100);
  return pct;
}

export default function PricingCards({ lang, ko }: { lang: string; ko: boolean }) {
  const [period, setPeriod] = useState<BillingPeriod>("monthly");

  const PAY_PER_USE = [
    {
      key: "CHART_SINGLE",
      trx: 3,
      titleEn: "Single chart reading",
      titleKo: "차트 분석 1회",
      subEn: "One-shot AI analysis — bypasses the free 3-hour cooldown.",
      subKo: "즉시 AI 분석 1회. 3시간 무료 제한을 우회합니다.",
    },
    {
      key: "CHAT_PACK_10",
      trx: 5,
      titleEn: "10 chat messages",
      titleKo: "AI 채팅 10회",
      subEn: "Stacks on top of free tier, consumed before cooldown kicks in.",
      subKo: "무료 한도보다 먼저 사용되는 10회 추가 메시지.",
    },
    {
      key: "TRX_REFILL",
      trx: 20,
      titleEn: "Refill TRX wallet",
      titleKo: "TRX 지갑 충전",
      subEn: "Deposit ≥20 TRX once. Every feature deducts automatically — no per-purchase friction.",
      subKo: "20 TRX 이상 한 번 충전. 모든 기능 사용 시 자동 차감됩니다.",
    },
  ] as const;

  const basicPrice = PRICING.basic[period];
  const premiumPrice = PRICING.premium[period];
  const basicPerMo = perMonth(basicPrice, period);
  const premiumPerMo = perMonth(premiumPrice, period);
  const basicSave = saveBadge(period, "basic");
  const premiumSave = saveBadge(period, "premium");

  return (
    <>
      {/* Pay-per-use card — TRX micro-purchases, shown above subscriptions to catch try-before-commit users */}
      <div className="max-w-6xl mx-auto mb-10 rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/[0.04] via-zinc-900/40 to-zinc-950 p-5 lg:p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                {ko ? "신규" : "New"}
              </span>
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-300">
                {ko ? "건별 결제 (TRX)" : "Pay-per-use (TRX)"}
              </span>
            </div>
            <p className="text-sm text-zinc-400">
              {ko
                ? "구독 없이 TRX로 필요한 만큼만 결제하세요. 1–2분 내 자동 반영됩니다."
                : "Pay in TRX for exactly what you use. Auto-verified within 1–2 minutes. No subscription required."}
            </p>
          </div>
          <a
            href={`/${lang}/pricing#payment`}
            className="shrink-0 text-[11px] font-mono uppercase tracking-wider text-amber-300 hover:text-amber-200 transition-colors"
          >
            {ko ? "결제 방법 →" : "How to pay →"}
          </a>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {PAY_PER_USE.map((p) => (
            <div
              key={p.key}
              className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 flex flex-col"
            >
              <div className="flex items-baseline gap-1.5 mb-1">
                <span className="text-2xl font-bold text-white">
                  {p.key === "TRX_REFILL" ? `${p.trx}+` : p.trx}
                </span>
                <span className="text-sm text-emerald-300 font-mono">TRX</span>
              </div>
              <p className="text-sm font-semibold text-zinc-200 mt-1">
                {ko ? p.titleKo : p.titleEn}
              </p>
              <p className="text-[11px] text-zinc-500 mt-1 leading-snug flex-1">
                {ko ? p.subKo : p.subEn}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Billing Period Toggle */}
      <div className="flex justify-center mb-10">
        <div className="flex items-center gap-1 p-1 bg-white/[0.03] border border-white/[0.08] rounded-xl">
          {([
            { value: "monthly" as const, label: ko ? "월간" : "Monthly", save: null },
            { value: "6month" as const, label: ko ? "6개월" : "6 Months", save: ko ? "16% 할인" : "Save 16%" },
            { value: "annual" as const, label: ko ? "연간" : "Annual", save: ko ? "33% 할인" : "Save 33%" },
          ]).map((opt) => (
            <button
              key={opt.value}
              onClick={() => setPeriod(opt.value)}
              className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                period === opt.value
                  ? "bg-white/[0.1] text-white shadow-sm"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {opt.label}
              {opt.save && (
                <span className={`ml-1.5 text-[10px] font-bold ${period === opt.value ? "text-emerald-400" : "text-emerald-500/60"}`}>
                  {opt.save}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* 3-Tier Pricing Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">

        {/* ── FREE ── */}
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 lg:p-8 flex flex-col">
          <div className="mb-6">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 bg-white/[0.04] px-3 py-1 rounded-full border border-white/[0.08]">
              Free
            </span>
            <div className="flex items-baseline gap-1 mt-4">
              <span className="text-4xl font-bold text-white">$0</span>
              <span className="text-base text-zinc-500">/{ko ? "월" : "mo"}</span>
            </div>
            <p className="text-sm text-zinc-400 mt-2">
              {ko ? "핵심 트레이딩 도구 전체 무료" : "All core trading tools, free forever"}
            </p>
          </div>
          <div className="flex-1 border-t border-white/[0.06] pt-5 space-y-0.5">
            <Feature included>{ko ? "AI 퀀트 채팅 (기본)" : "AI Quant Chat (basic)"}</Feature>
            <Feature included>{ko ? "차트 분석" : "Chart analysis"}</Feature>
            <Feature included>{ko ? "실시간 시장 데이터" : "Real-time market data"}</Feature>
            <Feature included>{ko ? "뉴스 피드" : "News feed"}</Feature>
            <Feature included>{ko ? "고래 트래커" : "Whale tracker"}</Feature>
            <Feature included>{ko ? "퀀트 시그널" : "Quant signals"}</Feature>
            <Feature included>{ko ? "업비트 + 김치 프리미엄" : "Upbit + Kimchi Premium"}</Feature>
            <Feature included={false}>{ko ? "고급 LLM + 에이전틱 프레임워크" : "Advanced LLM + agentic framework"}</Feature>
            <Feature included={false}>{ko ? "프리미엄 리서치 & 포스트" : "Premium research & posts"}</Feature>
          </div>
          <div className="mt-6 pt-5 border-t border-white/[0.06]">
            <a
              href={`/${lang}/chat`}
              className="block w-full text-center py-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-white text-sm font-semibold transition-colors"
            >
              {ko ? "무료로 시작" : "Start Free"}
            </a>
          </div>
        </div>

        {/* ── BASIC ── */}
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/[0.03] p-6 lg:p-8 flex flex-col">
          <div className="mb-6">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                Basic
              </span>
              {basicSave && (
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  {basicSave}% OFF
                </span>
              )}
            </div>
            <div className="flex items-baseline gap-1 mt-4">
              <span className="text-4xl font-bold text-white">${basicPrice}</span>
              <span className="text-base text-zinc-500">{periodSuffix(period, ko)}</span>
            </div>
            {period !== "monthly" && (
              <p className="text-xs text-emerald-400/70 mt-1">
                {ko ? `월 $${basicPerMo} 상당` : `$${basicPerMo}/mo equivalent`}
              </p>
            )}
            <p className="text-sm text-zinc-400 mt-2">
              {ko ? "더 많은 에이전트 + 확장된 데이터 소스" : "More agents + expanded data sources"}
            </p>
          </div>
          <div className="flex-1 border-t border-emerald-500/10 pt-5 space-y-0.5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-400/70 mb-2">
              {ko ? "Free 전체 포함 +" : "Everything in Free, plus"}
            </p>
            <Feature included highlight>{ko ? "향상된 LLM 모델" : "Enhanced LLM model"}</Feature>
            <Feature included highlight>{ko ? "4인 AI 에이전트 팀" : "4-agent AI team"}</Feature>
            <Feature included highlight>{ko ? "10+ 실시간 데이터 소스" : "10+ real-time data sources"}</Feature>
            <Feature included>{ko ? "확장된 컨텍스트 (대화 기억)" : "Extended context (conversation memory)"}</Feature>
            <Feature included>{ko ? "심층 차트 분석" : "In-depth chart analysis"}</Feature>
            <Feature included>{ko ? "우선 응답 속도" : "Priority response speed"}</Feature>
            <Feature included={false}>{ko ? "최상위 LLM 모델" : "Top-tier LLM model"}</Feature>
            <Feature included={false}>{ko ? "8인 매크로 리서치 에이전트" : "8 macro research agents"}</Feature>
          </div>
          <div className="mt-6 pt-5 border-t border-emerald-500/10">
            <a
              href={`/${lang}/pricing#payment`}
              className="block w-full text-center py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition-colors"
            >
              {ko ? `Basic 시작 — $${basicPrice}${periodSuffix(period, ko)}` : `Get Basic — $${basicPrice}${periodSuffix(period, ko)}`}
            </a>
          </div>
        </div>

        {/* ── PREMIUM ── */}
        <div className="rounded-2xl border border-blue-500/30 bg-blue-500/[0.03] p-6 lg:p-8 flex flex-col relative overflow-hidden">
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="mb-6 relative">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
                Premium
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                {ko ? "추천" : "Best"}
              </span>
              {premiumSave && (
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">
                  {premiumSave}% OFF
                </span>
              )}
            </div>
            <div className="flex items-baseline gap-1 mt-4">
              <span className="text-4xl font-bold text-white">${premiumPrice}</span>
              <span className="text-base text-zinc-500">{periodSuffix(period, ko)}</span>
            </div>
            {period !== "monthly" && (
              <p className="text-xs text-blue-400/70 mt-1">
                {ko ? `월 $${premiumPerMo} 상당` : `$${premiumPerMo}/mo equivalent`}
              </p>
            )}
            <p className="text-sm text-zinc-400 mt-2">
              {ko ? "최상위 LLM + 에이전틱 프레임워크 + 장기 메모리" : "Top-tier LLM + agentic framework + long-term memory"}
            </p>
          </div>
          <div className="flex-1 border-t border-blue-500/10 pt-5 space-y-0.5 relative">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-blue-400/70 mb-2">
              {ko ? "Basic 전체 포함 +" : "Everything in Basic, plus"}
            </p>
            <Feature included highlight>{ko ? "최상위 LLM 모델 접근" : "Top-tier LLM model access"}</Feature>
            <Feature included highlight>{ko ? "확장된 컨텍스트 윈도우" : "Extended context window"}</Feature>
            <Feature included highlight>{ko ? "대화 장기 메모리" : "Long-term conversation memory"}</Feature>
            <Feature included highlight>{ko ? "8인 매크로 리서치 에이전트 팀" : "Team of 8 macro research agents"}</Feature>
            <Feature included highlight>{ko ? "에이전틱 프레임워크 (다단계 추론)" : "Agentic framework (multi-step reasoning)"}</Feature>
            <Feature included highlight>{ko ? "프리미엄 마켓 리서치 포스트" : "Premium market research posts"}</Feature>
            <Feature included highlight>{ko ? "기관급 온체인 분석" : "Institutional on-chain analytics"}</Feature>
          </div>
          <div className="mt-6 pt-5 border-t border-blue-500/10 relative">
            <a
              href={`/${lang}/pricing#payment`}
              className="block w-full text-center py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors"
            >
              {ko ? `Premium 시작 — $${premiumPrice}${periodSuffix(period, ko)}` : `Get Premium — $${premiumPrice}${periodSuffix(period, ko)}`}
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
