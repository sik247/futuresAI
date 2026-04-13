import { Metadata } from "next";
import PaymentSection from "./payment-section";
import PricingCards from "./pricing-cards";

export const metadata: Metadata = {
  title: "Pricing - FuturesAI",
  description:
    "All core trading tools are free forever. Upgrade to Basic or Premium for advanced AI agents, 10+ data sources, and exclusive market research. Save up to 33% with 6-month or annual plans.",
};

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
          <p className="text-sm text-emerald-400/80 mt-2">
            {ko ? "장기 구독 시 최대 33% 할인" : "Save up to 33% with longer plans"}
          </p>
        </div>

        {/* Interactive Pricing Cards with Billing Toggle */}
        <PricingCards lang={lang} ko={ko} />

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
                    <th className="px-4 py-4 text-center text-sm text-emerald-400 font-medium">Basic</th>
                    <th className="px-4 py-4 text-center text-sm text-blue-400 font-medium">Premium</th>
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
                q: ko ? "6개월, 연간 플랜은 어떤가요?" : "How do 6-month and annual plans work?",
                a: ko
                  ? "6개월 또는 연간 플랜을 선택하면 월간 대비 최대 33% 할인된 가격으로 이용할 수 있습니다. 선택한 기간 동안 한 번만 결제하면 됩니다."
                  : "6-month and annual plans offer up to 33% savings compared to monthly billing. Pay once for the full period and enjoy uninterrupted access.",
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
