import { Metadata } from "next";
import PaymentSection from "./payment-section";

export const metadata: Metadata = {
  title: "Pricing - FuturesAI",
  description:
    "All core trading tools are free forever. Upgrade to Basic $25 for advanced agents and 10+ data sources, or Premium $99 for exclusive market research, weekly reports, and the premium Telegram channel.",
};

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

export default function PricingPage({
  params: { lang },
}: {
  params: { lang: string };
}) {
  const ko = lang === "ko";
  const walletAddress = process.env.PAYMENT_WALLET_TRC20 || process.env.PAYMENT_WALLET_ADDRESS || "";

  return (
    <div className="bg-zinc-950 min-h-screen">
      <div className="max-w-6xl mx-auto px-4 py-12 lg:py-20">
        {/* Header */}
        <div className="text-center mb-14">
          <h1 className="text-3xl lg:text-4xl font-bold text-white tracking-tight">
            {ko ? "요금제 선택" : "Choose Your Plan"}
          </h1>
          <p className="text-base text-zinc-400 mt-4 max-w-lg mx-auto">
            {ko
              ? "AI 크립토 퀀트 분석의 힘을 경험하세요. 실시간 데이터, 전문가급 인사이트."
              : "Experience the power of AI crypto quant analysis. Real-time data, expert-level insights."}
          </p>
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

          {/* ── BASIC $25 ── */}
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/[0.03] p-6 lg:p-8 flex flex-col">
            <div className="mb-6">
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                Basic
              </span>
              <div className="flex items-baseline gap-1 mt-4">
                <span className="text-4xl font-bold text-white">$25</span>
                <span className="text-base text-zinc-500">/{ko ? "월" : "mo"}</span>
              </div>
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
                {ko ? "Basic 시작 — $25/월" : "Get Basic — $25/mo"}
              </a>
            </div>
          </div>

          {/* ── PREMIUM $99 ── */}
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
              </div>
              <div className="flex items-baseline gap-1 mt-4">
                <span className="text-4xl font-bold text-white">$99</span>
                <span className="text-base text-zinc-500">/{ko ? "월" : "mo"}</span>
              </div>
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
                {ko ? "Premium 시작 — $99/월" : "Get Premium — $99/mo"}
              </a>
            </div>
          </div>
        </div>

        {/* Feature Comparison Table */}
        <div className="mt-16 max-w-5xl mx-auto">
          <h2 className="text-xl font-bold text-white mb-6 text-center">
            {ko ? "기능 비교" : "Feature Comparison"}
          </h2>
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px]">
                <thead>
                  <tr className="border-b border-white/[0.08]">
                    <th className="px-6 py-4 text-left text-sm text-zinc-400 font-medium">{ko ? "기능" : "Feature"}</th>
                    <th className="px-4 py-4 text-center text-sm text-zinc-400 font-medium">Free</th>
                    <th className="px-4 py-4 text-center text-sm text-emerald-400 font-medium">Basic $25</th>
                    <th className="px-4 py-4 text-center text-sm text-blue-400 font-medium">Premium $99</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {[
                    { feature: ko ? "AI 퀀트 채팅" : "AI Quant Chat", free: "✓", basic: "✓", premium: "✓" },
                    { feature: ko ? "차트 분석" : "Chart Analysis", free: "✓", basic: ko ? "심층" : "In-depth", premium: ko ? "전문가급" : "Expert-level" },
                    { feature: ko ? "데이터 소스 & API" : "Data Sources & APIs", free: "5", basic: "10+", premium: "10+" },
                    { feature: ko ? "AI 에이전트" : "AI Agents", free: "1", basic: ko ? "4인" : "4", premium: ko ? "8인 팀" : "8-team" },
                    { feature: ko ? "업비트 + 김치 프리미엄" : "Upbit + Kimchi Premium", free: "✓", basic: "✓", premium: "✓" },
                    { feature: ko ? "고래 트래커" : "Whale Tracker", free: "✓", basic: "✓", premium: ko ? "전체" : "Full" },
                    { feature: ko ? "퀀트 시그널" : "Quant Signals", free: "✓", basic: "✓", premium: "✓" },
                    { feature: ko ? "프리미엄 마켓 리서치" : "Premium Market Research", free: "—", basic: "—", premium: "✓" },
                    { feature: ko ? "주간 심층 리포트" : "Weekly Deep-Dive Reports", free: "—", basic: "—", premium: "✓" },
                    { feature: ko ? "기관급 온체인 분석" : "Institutional On-chain", free: "—", basic: "—", premium: "✓" },
                    { feature: ko ? "실시간 고래 알림" : "Real-time Whale Alerts", free: "—", basic: "—", premium: ko ? "텔레그램" : "Telegram" },
                    { feature: ko ? "프리미엄 텔레그램 채널" : "Premium Telegram Channel", free: "—", basic: "—", premium: "✓" },
                    { feature: ko ? "지원" : "Support", free: ko ? "커뮤니티" : "Community", basic: ko ? "이메일" : "Email", premium: ko ? "텔레그램 DM" : "Telegram DM" },
                  ].map((row, i) => (
                    <tr key={i} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                      <td className="px-6 py-3 text-zinc-300 font-medium">{row.feature}</td>
                      <td className="px-4 py-3 text-center text-zinc-500">{row.free}</td>
                      <td className="px-4 py-3 text-center text-zinc-300">{row.basic}</td>
                      <td className="px-4 py-3 text-center text-white font-medium">{row.premium}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Payment Section */}
        <div id="payment" className="mt-16 max-w-2xl mx-auto">
          <h2 className="text-xl font-bold text-white mb-2 text-center">
            {ko ? "결제하기" : "Make Payment"}
          </h2>
          <p className="text-sm text-zinc-500 text-center mb-6">
            {ko ? "USDT로 즉시 결제하고 바로 시작하세요" : "Pay with USDT and get started instantly"}
          </p>
          <PaymentSection walletAddress={walletAddress} ko={ko} />
        </div>

        {/* FAQ */}
        <div className="mt-16 max-w-3xl mx-auto border-t border-white/[0.06] pt-10">
          <h2 className="text-lg font-bold text-zinc-300 mb-6 text-center">
            {ko ? "자주 묻는 질문" : "FAQ"}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              {
                q: ko ? "Free, Basic, Premium 차이는?" : "What's the difference between Free, Basic, and Premium?",
                a: ko
                  ? "Free는 AI 퀀트 채팅, 차트 분석, 고래 트래커, 퀀트 시그널, 업비트 김치 프리미엄 등 핵심 트레이딩 도구를 영구 무료로 제공합니다. Basic은 4명의 고급 AI 에이전트와 10개 이상의 확장된 데이터 소스를 제공합니다. Premium은 8인 매크로 리서치 에이전트 팀, 프리미엄 마켓 리서치 포스트, 주간 심층 리포트, 기관급 온체인 분석, 그리고 텔레그램 프리미엄 전용 채널을 포함합니다."
                  : "Free gives you all core trading tools — AI Quant Chat, chart analysis, whale tracker, quant signals, and Upbit Kimchi Premium — forever free. Basic adds 4 advanced AI agents and 10+ expanded data sources. Premium unlocks an 8-agent macro research team, premium market research posts, weekly deep-dive reports, institutional on-chain analytics, and the Telegram premium-only channel.",
              },
              {
                q: ko ? "매크로 리서치 에이전트란?" : "What are macro research agents?",
                a: ko
                  ? "Premium의 에이전틱 프레임워크는 거시경제, 온체인 데이터, 기술적 분석, 뉴스 센티먼트 등 각 전문 분야를 담당하는 8개의 AI 에이전트가 서로 소통하며 종합적인 트레이딩 인사이트를 도출합니다."
                  : "Premium's agentic framework deploys 8 specialized AI agents covering macro economics, on-chain data, technical analysis, news sentiment, and more. They communicate with each other to produce comprehensive trading insights.",
              },
              {
                q: ko ? "어떻게 결제하나요?" : "How do I pay?",
                a: ko
                  ? "TRC-20(트론) 네트워크로 USDT를 정확한 금액만큼 전송한 후 TXID를 제출하면 즉시 활성화됩니다."
                  : "Send exact USDT amount via TRC-20 (TRON) network, submit your TXID, and it activates instantly.",
              },
              {
                q: ko ? "언제든 취소할 수 있나요?" : "Can I cancel anytime?",
                a: ko
                  ? "네, 언제든 취소 가능합니다. 현재 결제 기간이 끝날 때까지 모든 기능을 이용할 수 있습니다."
                  : "Yes, cancel anytime. You keep access until the end of your current billing period.",
              },
            ].map((faq, i) => (
              <div key={i} className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-5">
                <p className="text-sm font-semibold text-zinc-200 mb-2">{faq.q}</p>
                <p className="text-sm text-zinc-500 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
