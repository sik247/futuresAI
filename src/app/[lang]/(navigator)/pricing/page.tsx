import { Metadata } from "next";
import PaymentSection from "./payment-section";

export const metadata: Metadata = {
  title: "Pricing - FuturesAI",
  description:
    "Professional crypto intelligence plans. Free and Premium tiers with AI chat, chart analysis, whale tracking, and real-time market data.",
  openGraph: {
    title: "Pricing - FuturesAI",
    description:
      "Professional crypto intelligence plans. AI chat, chart analysis, whale tracking, and real-time market data.",
    type: "website",
  },
};

/* ── Helpers ── */

function CheckIcon() {
  return (
    <svg className="w-4 h-4 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg className="w-4 h-4 text-zinc-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

/* ── Feature Row ── */

function Feature({ included, children }: { included: boolean; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 py-2">
      {included ? <CheckIcon /> : <XIcon />}
      <span className={`text-[12px] font-mono ${included ? "text-zinc-300" : "text-zinc-600"}`}>
        {children}
      </span>
    </div>
  );
}

/* ── Page ── */

export default function PricingPage({
  params: { lang },
}: {
  params: { lang: string };
}) {
  const ko = lang === "ko";
  const walletAddress = process.env.PAYMENT_WALLET_ADDRESS ?? "";

  return (
    <div className="bg-zinc-950 font-mono min-h-screen">
      {/* Stat Bar */}
      <div className="flex items-center gap-3 px-4 py-3 bg-zinc-900/80 border-b border-white/[0.06] text-xs font-mono overflow-x-auto shrink-0">
        <span className="text-zinc-500 shrink-0">{ko ? "요금제" : "Plans"}</span>
        <span className="text-zinc-700 shrink-0">|</span>
        <span className="text-zinc-500 shrink-0">{ko ? "결제" : "Payment"}</span>
        <span className="text-white shrink-0">USDT</span>
        <span className="text-zinc-700 shrink-0">|</span>
        <span className="text-zinc-500 shrink-0">{ko ? "갱신" : "Billing"}</span>
        <span className="text-white shrink-0">{ko ? "월간" : "Monthly"}</span>
        <span className="text-zinc-700 shrink-0">|</span>
        <span className="relative flex items-center gap-1.5 shrink-0">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
          </span>
          <span className="text-emerald-400 text-[10px] uppercase tracking-[0.15em]">
            {ko ? "가입 가능" : "OPEN"}
          </span>
        </span>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-12 lg:py-20">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-2xl lg:text-3xl font-bold text-white tracking-tight">
            {ko ? "요금제 선택" : "Choose Your Plan"}
          </h1>
          <p className="text-sm text-zinc-500 mt-3 max-w-md mx-auto">
            {ko
              ? "프로페셔널 크립토 인텔리전스. 모든 플랜은 즉시 활성화됩니다."
              : "Professional crypto intelligence. All plans activate instantly."}
          </p>
        </div>

        {/* Pricing Card */}
        <div className="max-w-lg mx-auto">
          {/* Premium Tier */}
          <div className="rounded-xl border border-blue-500/30 bg-blue-500/[0.03] p-6 lg:p-8 flex flex-col relative overflow-hidden">
            {/* Glow effect */}
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="mb-6 relative">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                  Premium
                </span>
                <span className="text-[9px] font-mono uppercase tracking-[0.15em] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                  {ko ? "추천" : "Recommended"}
                </span>
              </div>
              <div className="flex items-baseline gap-1 mt-3">
                <span className="text-3xl font-bold text-white">$99</span>
                <span className="text-sm text-zinc-500">USDT / {ko ? "월" : "month"}</span>
              </div>
              <p className="text-[11px] text-zinc-500 mt-2">
                {ko ? "프로 트레이더를 위한 풀 액세스" : "Full access for professional traders"}
              </p>
            </div>

            <div className="flex-1 border-t border-blue-500/10 pt-5 space-y-0.5 relative">
              <Feature included>{ko ? "AI 채팅 30회/일" : "30 AI chat messages/day"}</Feature>
              <Feature included>{ko ? "차트 분석 10회/일" : "10 chart analyses/day"}</Feature>
              <Feature included>{ko ? "고래 트래커 (전체)" : "Whale tracker (full access)"}</Feature>
              <Feature included>{ko ? "차트 & 시장 데이터" : "Charts & market data"}</Feature>
              <Feature included>{ko ? "뉴스 피드" : "News feed"}</Feature>
              <Feature included>{ko ? "커뮤니티 포스트" : "Community posts"}</Feature>
              <Feature included>{ko ? "실시간 고래 알림" : "Real-time whale alerts"}</Feature>
              <Feature included>{ko ? "업비트 + 김치 프리미엄" : "Upbit + Kimchi Premium data"}</Feature>
              <Feature included>{ko ? "고급 기술 지표 (RSI, MA)" : "Advanced indicators (RSI, MA)"}</Feature>
              <Feature included>{ko ? "텔레그램 프리미엄 알림" : "Telegram premium alerts"}</Feature>
            </div>

            <div className="mt-6 pt-5 border-t border-blue-500/10 relative">
              {/* Payment section (client component handles auth state) */}
              <PaymentSection walletAddress={walletAddress} ko={ko} />
              <p className="text-center text-[9px] text-zinc-600 mt-3">
                {ko ? "USDT 결제 · 즉시 활성화 · 언제든 취소" : "USDT payment · Instant activation · Cancel anytime"}
              </p>
            </div>
          </div>
        </div>

        {/* FAQ / Notes */}
        <div className="mt-12 border-t border-white/[0.06] pt-8">
          <h2 className="text-sm font-semibold text-zinc-400 mb-4">
            {ko ? "자주 묻는 질문" : "FAQ"}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-4">
              <p className="text-[11px] font-semibold text-zinc-300 mb-1">
                {ko ? "어떻게 결제하나요?" : "How do I pay?"}
              </p>
              <p className="text-[11px] text-zinc-500 leading-relaxed">
                {ko
                  ? "위 주소로 99 USDT (TRC20)를 전송한 후 거래 ID를 제출해 주세요. 자동으로 확인됩니다."
                  : "Send 99 USDT (TRC20) to the address above, then submit your transaction ID. It auto-verifies instantly."}
              </p>
            </div>
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-4">
              <p className="text-[11px] font-semibold text-zinc-300 mb-1">
                {ko ? "취소 정책은 어떻게 되나요?" : "What's the cancellation policy?"}
              </p>
              <p className="text-[11px] text-zinc-500 leading-relaxed">
                {ko
                  ? "언제든지 취소할 수 있습니다. 현재 결제 기간이 끝날 때까지 프리미엄 기능을 이용할 수 있습니다."
                  : "Cancel anytime. You keep premium access until the end of your current billing period."}
              </p>
            </div>
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-4">
              <p className="text-[11px] font-semibold text-zinc-300 mb-1">
                {ko ? "AI 채팅은 어떤 모델을 사용하나요?" : "What AI model powers the chat?"}
              </p>
              <p className="text-[11px] text-zinc-500 leading-relaxed">
                {ko
                  ? "Google Gemini 2.5 Pro를 사용하며, 바이낸스와 업비트의 실시간 데이터가 연동됩니다."
                  : "Powered by Google Gemini 2.5 Pro with real-time data from Binance and Upbit exchanges."}
              </p>
            </div>
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-4">
              <p className="text-[11px] font-semibold text-zinc-300 mb-1">
                {ko ? "무료 플랜의 제한은 무엇인가요?" : "What are Free plan limits?"}
              </p>
              <p className="text-[11px] text-zinc-500 leading-relaxed">
                {ko
                  ? "하루 AI 채팅 10회, 차트 분석 3회까지 무료입니다. 매일 자정(UTC)에 초기화됩니다."
                  : "10 AI chats and 3 chart analyses per day. Limits reset daily at midnight UTC."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
