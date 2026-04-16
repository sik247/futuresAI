import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import Container from "@/components/ui/container";
import PaybackAnimations from "./payback-animations";
import { auth } from "@/auth";
import PaybackRequest from "./payback-request";
import { EXCHANGE_GUIDES } from "../guides/exchange-data";

export const metadata: Metadata = {
  title: "Trading Rebates and Payback",
  description:
    "Earn trading fee rebates on partner exchanges including Bitget, Bybit, OKX, Gate.io, and HTX. Track your payback earnings with Futures AI.",
  keywords: ["trading rebates", "crypto payback", "exchange referral", "fee rebates", "Bitget rebate", "Bybit rebate"],
};

const EXCHANGES = [
  // Fees shown are EFFECTIVE rates after payback/discount applied (실질 수수료)
  { name: "Gate.io", paybackRate: 75, makerFee: 0.005, takerFee: 0.0125, link: "https://www.gate.com/share/FuturesAI", logo: "/icons/exchange/gate.png" },
  { name: "Bitget", paybackRate: 55, makerFee: 0.009, takerFee: 0.018, link: "https://partner.bitget.com/bg/FuturesAI", logo: "/icons/exchange/bitget.png" },
  { name: "HTX", paybackRate: 54, makerFee: 0.0092, takerFee: 0.023, link: "https://www.htx.com.gt/invite/en-us/1h?invite_code=miqkc223", logo: "/icons/exchange/htx.png" },
  { name: "BingX", paybackRate: 50, makerFee: 0.01, takerFee: 0.025, link: "https://bingx.com/en/invite/FCC9QDJK", logo: "/icons/exchange/bingx.png" },
  { name: "EdgeX", paybackRate: 0, makerFee: 0.0081, takerFee: 0.0225, link: "https://pro.edgex.exchange/en-US/referral/FUTURESAI", logo: "/icons/exchange/edgex.png", feeDiscount: 10 },
  { name: "OKX", paybackRate: 20, makerFee: 0.016, takerFee: 0.04, link: "https://www.okx.com/join/futuresai", logo: "/icons/exchange/okx.png" },
  { name: "Bybit", paybackRate: 20, makerFee: 0.016, takerFee: 0.044, link: "https://partner.bybit.com/b/FUTURESAI", logo: "/icons/exchange/bybit.png" },
];

export default async function PaybackPage({
  params,
}: {
  params: { lang: string };
}) {
  const { lang } = params;
  const ko = lang === "ko";
  const session = await auth();

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <PaybackAnimations />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-white/5">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-blue-600/8 blur-[120px]" />
        </div>

        <Container className="relative z-10 pt-24 sm:pt-28 pb-28 md:pb-36">
          <div
            data-anim="hero-badge"
            className="inline-flex items-center gap-2 px-4 py-1.5 mb-8 rounded-full border border-blue-500/20 bg-blue-500/10 text-blue-300 text-xs font-medium tracking-wider uppercase"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
            {ko ? "실시간 페이백 추적" : "Live Payback Tracking"}
          </div>

          <h1
            data-anim="hero-title"
            className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[0.95]"
          >
            <span className="block text-white">{ko ? "페이백" : "Your Payback"}</span>
            <span className="block mt-2 bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-300 bg-clip-text text-transparent">
              {ko ? "대시보드" : "Dashboard"}
            </span>
          </h1>

          <p
            data-anim="hero-subtitle"
            className="mt-6 text-lg md:text-xl text-zinc-400 max-w-2xl leading-relaxed"
          >
            {ko
              ? "파트너 거래소의 페이백 수익을 추적하세요. 수수료 절감 효과를 확인하고 수익을 극대화하세요."
              : "Track your payback earnings across partner exchanges. See how much you save on trading fees and maximize your returns."}
          </p>

          <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 max-w-3xl">
            {[
              { value: "5+", label: ko ? "거래소" : "Exchanges" },
              { value: "75%", label: ko ? "최대 페이백" : "Max Payback" },
              { value: "24/7", label: ko ? "지원" : "Support" },
              { value: "$2M+", label: ko ? "지급 완료" : "Paid Out" },
            ].map((stat, i) => (
              <div
                key={i}
                data-anim="stat-card"
                className="rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-center"
              >
                <p className="text-xl md:text-2xl font-bold font-mono tabular-nums text-white">
                  {stat.value}
                </p>
                <p className="text-[11px] text-zinc-500 uppercase tracking-wider font-medium mt-0.5">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-10 h-px w-48 bg-gradient-to-r from-blue-600 via-cyan-500 to-transparent" />
        </Container>
      </section>

      {/* Partner Exchanges */}
      <section className="relative border-b border-white/5">
        <Container className="py-20 md:py-24">
          <div data-anim="section-heading">
            <p className="text-blue-400 text-sm font-medium tracking-wider uppercase mb-3">
              {ko ? "파트너 네트워크" : "Partner Network"}
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
              {ko ? "파트너 거래소" : "Partner Exchanges"}
            </h2>
            <p className="text-zinc-500 mb-4 max-w-xl">
              {ko ? "제휴 거래소와 현재 페이백 요율입니다." : "Our affiliated exchanges and their current payback rates."}
            </p>
            <p className="text-xs text-amber-400/80 mb-12 max-w-xl font-medium">
              {ko
                ? "※ 표시된 수수료는 Fee Payback 적용 후 실질 수수료 기준입니다."
                : "※ Fees shown are effective rates after payback is applied."}
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-5">
            {EXCHANGES.map((exchange) => (
              <div
                key={exchange.name}
                data-anim="exchange-card"
                className="group relative rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6 transition-all duration-300 hover:border-blue-500/30 hover:bg-white/[0.06] hover:-translate-y-1 w-full sm:w-[calc(50%-10px)] lg:w-[calc(25%-15px)]"
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 rounded-xl bg-white/[0.06] border border-white/[0.08] flex items-center justify-center overflow-hidden">
                    <Image src={exchange.logo} alt={exchange.name} width={32} height={32} className="object-contain" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">{exchange.name}</h3>
                  </div>
                </div>

                <div className="mb-6 p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1 font-medium">
                    {(exchange as any).feeDiscount
                      ? (ko ? "수수료 할인" : "Fee Discount")
                      : (ko ? "페이백 비율" : "Payback Rate")}
                  </p>
                  <p className="text-4xl font-bold font-mono tabular-nums bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                    {(exchange as any).feeDiscount ? `${(exchange as any).feeDiscount}%` : `${exchange.paybackRate}%`}
                  </p>
                </div>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-500">{ko ? "실질 지정가" : "Eff. Maker"}</span>
                    <span className="font-medium text-zinc-300 font-mono tabular-nums">
                      {exchange.makerFee}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-500">{ko ? "실질 시장가" : "Eff. Taker"}</span>
                    <span className="font-medium text-zinc-300 font-mono tabular-nums">
                      {exchange.takerFee}%
                    </span>
                  </div>
                </div>

                <a
                  href={exchange.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-6 flex items-center justify-center w-full gap-2 rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-sm text-zinc-400 font-medium transition-all duration-300 hover:bg-blue-600/10 hover:border-blue-500/30 hover:text-blue-300"
                >
                  {ko ? "수수료 절약하기" : "Save on Trades"}
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 14 14" stroke="currentColor" strokeWidth="2">
                    <path d="M1 7h12M8 2l5 5-5 5" />
                  </svg>
                </a>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Existing Account KYC Guide */}
      <section className="relative border-b border-white/5">
        <Container className="py-16 md:py-20">
          <div data-anim="section-heading">
            <p className="text-amber-400 text-sm font-medium tracking-wider uppercase mb-3">
              {ko ? "기존 계정 안내" : "Existing Account?"}
            </p>
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
              {ko ? "기존 계정이 있는 경우" : "Already Have an Exchange Account?"}
            </h2>
            <p className="text-zinc-500 mb-8 max-w-xl">
              {ko
                ? "이미 거래소 계정이 있으시다면, KYC 변경을 통해 페이백 프로그램에 참여할 수 있습니다."
                : "If you already have an exchange account, you can join our payback program through a KYC change process."}
            </p>
          </div>

          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.03] p-6 md:p-8 max-w-2xl">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  {ko ? "KYC 변경 가이드" : "KYC Change Guide"}
                </h3>
                <ol className="space-y-2 text-sm text-zinc-400">
                  <li className="flex items-start gap-2">
                    <span className="text-amber-400 font-mono font-bold shrink-0">1.</span>
                    {ko
                      ? "아래 거래소의 '가입하기' 버튼을 통해 새 계정을 생성합니다."
                      : "Create a new account through the 'Join Now' button below."}
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-400 font-mono font-bold shrink-0">2.</span>
                    {ko
                      ? "거래소 고객센터에 KYC 변경 요청을 합니다."
                      : "Contact the exchange support to request a KYC transfer."}
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-400 font-mono font-bold shrink-0">3.</span>
                    {ko
                      ? "KYC 승인 후 기존 자산과 거래 기록이 이전됩니다."
                      : "After KYC approval, your assets and trading history will be transferred."}
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-400 font-mono font-bold shrink-0">4.</span>
                    {ko
                      ? "Futures AI에 계정을 등록하면 페이백을 받을 수 있습니다."
                      : "Register your account with Futures AI to start receiving payback."}
                  </li>
                </ol>
                <a
                  href="https://t.me/futuresai_official"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 mt-4 text-sm text-amber-400 hover:text-amber-300 transition-colors"
                >
                  {ko ? "텔레그램으로 문의하기" : "Contact us on Telegram"}
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 14 14" stroke="currentColor" strokeWidth="2">
                    <path d="M1 7h12M8 2l5 5-5 5" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Exchange KYC & Payback Guides */}
      <section className="relative border-b border-white/5">
        <Container className="py-20 md:py-24">
          <div data-anim="section-heading">
            <p className="text-indigo-400 text-sm font-medium tracking-wider uppercase mb-3">
              {ko ? "거래소별 상세 가이드" : "Detailed Exchange Guides"}
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
              {ko ? "거래소별 KYC 변경 & 페이백 가이드" : "Exchange KYC & Payback Guides"}
            </h2>
            <p className="text-zinc-500 mb-12 max-w-xl text-base">
              {ko
                ? "각 거래소별 KYC 변경 방법과 페이백 혜택을 받는 방법을 자세히 안내해 드립니다."
                : "Step-by-step instructions for changing KYC and receiving payback benefits on each exchange."}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {EXCHANGE_GUIDES.map((exchange) => (
              <Link
                key={exchange.slug}
                href={`/${lang}/guides/${exchange.slug}`}
                data-anim="exchange-card"
                className="group relative rounded-2xl border border-white/[0.08] bg-white/[0.03] transition-all duration-300 hover:border-indigo-500/30 hover:bg-white/[0.06] hover:-translate-y-1 overflow-hidden"
              >
                {/* Payback Badge */}
                <div className="absolute top-4 right-4 z-10">
                  <div
                    className="px-3 py-1 rounded-full text-xs font-bold"
                    style={{
                      backgroundColor: `${exchange.color}20`,
                      color: exchange.color,
                      border: `1px solid ${exchange.color}40`,
                    }}
                  >
                    {exchange.paybackPercent}% Payback
                  </div>
                </div>

                <div className="p-6">
                  {/* Exchange Header */}
                  <div className="flex items-center gap-3 mb-5">
                    <div
                      className="w-14 h-14 rounded-xl flex items-center justify-center text-xl font-bold"
                      style={{
                        backgroundColor: `${exchange.color}15`,
                        color: exchange.color,
                        border: `1px solid ${exchange.color}25`,
                      }}
                    >
                      {exchange.logoText.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white group-hover:text-indigo-400 transition-colors">
                        {exchange.name}
                      </h3>
                      {exchange.nameKo !== exchange.name && (
                        <p className="text-sm text-zinc-500">{exchange.nameKo}</p>
                      )}
                    </div>
                  </div>

                  {/* Info */}
                  <div className="space-y-3 mb-5">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-zinc-500">
                        {ko ? "레퍼럴 코드" : "Referral Code"}
                      </span>
                      <code className="text-sm font-mono px-2.5 py-0.5 rounded bg-white/[0.05] text-zinc-300 border border-white/[0.06]">
                        {exchange.referralCode}
                      </code>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-zinc-500">
                        {ko ? "최대 계정" : "Max Accounts"}
                      </span>
                      <span className="text-sm text-zinc-300">
                        {exchange.maxAccounts}{ko ? "개" : ""}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-zinc-500">
                        {ko ? "코드 변경" : "Code Change"}
                      </span>
                      <span className={`text-sm ${exchange.canChangeReferral ? "text-emerald-400" : "text-amber-400"}`}>
                        {exchange.canChangeReferral
                          ? ko ? "조건부 가능" : "Conditional"
                          : ko ? "신규 가입 필요" : "New Signup Required"}
                      </span>
                    </div>
                  </div>

                  {/* CTA */}
                  <div className="flex items-center gap-2 text-base font-medium text-indigo-400 group-hover:text-indigo-300 transition-colors">
                    <span>{ko ? "상세 가이드 보기" : "View Detailed Guide"}</span>
                    <svg
                      className="w-4 h-4 transform group-hover:translate-x-1 transition-transform"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </div>
                </div>

                {/* Bottom accent bar */}
                <div
                  className="h-0.5 w-full opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{
                    background: `linear-gradient(90deg, transparent, ${exchange.color}, transparent)`,
                  }}
                />
              </Link>
            ))}
          </div>
        </Container>
      </section>

      {/* Exchange Comparison Table (wedombit-style) */}
      <section className="relative border-b border-white/5">
        <Container className="py-16 md:py-20">
          <div data-anim="section-heading">
            <p className="text-cyan-400 text-sm font-medium tracking-wider uppercase mb-3">
              {ko ? "거래소 비교" : "Exchange Comparison"}
            </p>
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-8">
              {ko ? "수수료 & 페이백 비교표" : "Fee & Payback Comparison"}
            </h2>
          </div>

          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px]">
                <thead>
                  <tr className="border-b border-white/[0.08]">
                    <th className="px-5 py-3.5 text-left text-xs font-mono uppercase tracking-wider text-zinc-500">{ko ? "거래소" : "Exchange"}</th>
                    <th className="px-4 py-3.5 text-left text-xs font-mono uppercase tracking-wider text-zinc-500">{ko ? "유형" : "Type"}</th>
                    <th className="px-4 py-3.5 text-center text-xs font-mono uppercase tracking-wider text-zinc-500">{ko ? "페이백" : "Payback"}</th>
                    <th className="px-4 py-3.5 text-right text-xs font-mono uppercase tracking-wider text-zinc-500">{ko ? "실질 지정가" : "Eff. Maker"}</th>
                    <th className="px-4 py-3.5 text-right text-xs font-mono uppercase tracking-wider text-zinc-500">{ko ? "실질 시장가" : "Eff. Taker"}</th>
                    <th className="px-4 py-3.5 text-left text-xs font-mono uppercase tracking-wider text-zinc-500">{ko ? "특징" : "Tags"}</th>
                    <th className="px-5 py-3.5 text-right text-xs font-mono uppercase tracking-wider text-zinc-500"></th>
                  </tr>
                </thead>
                <tbody>
                  {EXCHANGES.map((ex) => (
                    <tr key={ex.name} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <Image src={ex.logo} alt={ex.name} width={28} height={28} className="rounded-lg" />
                          <span className="font-semibold text-white text-sm">{ex.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-mono px-2 py-0.5 rounded ${ex.name === "EdgeX" ? "text-purple-400 bg-purple-500/10" : "text-white bg-white/[0.06]"}`}>{ex.name === "EdgeX" ? "DEX" : "CEX"}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-sm font-bold font-mono ${
                          ex.paybackRate >= 50 ? "text-emerald-400" : ex.paybackRate >= 30 ? "text-blue-400" : "text-white"
                        }`}>
                          {ex.paybackRate}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-sm text-white">{ex.makerFee}%</td>
                      <td className="px-4 py-3 text-right font-mono text-sm text-white">{ex.takerFee}%</td>
                      <td className="px-4 py-3">
                        <span className="text-[10px] font-mono text-white/80 bg-white/[0.06] px-2 py-0.5 rounded">
                          {ex.name === "Bitget" ? (ko ? "카피트레이딩" : "Copy Trading") :
                           ex.name === "Bybit" ? (ko ? "높은 유동성" : "High Liquidity") :
                           ex.name === "BingX" ? (ko ? "카피트레이딩" : "Copy Trading") :
                           ex.name === "Gate.io" ? (ko ? "최고 페이백" : "Highest Payback") :
                           ex.name === "HTX" ? (ko ? "글로벌" : "Global") :
                           ex.name === "EdgeX" ? (ko ? "탈중앙 DEX" : "Decentralized DEX") :
                           ko ? "DEX 통합" : "DEX Aggregator"}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center gap-2 justify-end">
                          <a
                            href={ex.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-500 transition-colors cursor-pointer"
                          >
                            {ko ? "가입" : "Join Now"}
                          </a>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Container>
      </section>

      {/* User Payback Request Section */}
      {session && (
        <section className="relative border-b border-white/5">
          <Container className="py-20 md:py-24">
            <div data-anim="section-heading">
              <p className="text-emerald-400 text-sm font-medium tracking-wider uppercase mb-3">
                {ko ? "내 페이백" : "My Payback"}
              </p>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
                {ko ? "페이백 요청" : "Request Payback"}
              </h2>
              <p className="text-zinc-500 mb-12 max-w-xl">
                {ko ? "적립된 페이백을 확인하고 출금 요청을 하세요." : "View your accumulated payback and submit withdrawal requests."}
              </p>
            </div>
            <PaybackRequest lang={lang} />
          </Container>
        </section>
      )}

      {/* CTA */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-b from-zinc-950 via-blue-950/20 to-zinc-950" />
        </div>

        <Container className="relative z-10 py-24 md:py-32">
          <div data-anim="cta-section" className="text-center max-w-2xl mx-auto">
            <p data-anim="cta-child" className="text-blue-400 text-sm font-medium tracking-wider uppercase mb-4">
              {ko ? "절약 시작" : "Start Saving"}
            </p>
            <h2 data-anim="cta-child" className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 tracking-tight">
              {ko ? "계산하기" : "Calculate Your"}{" "}
              <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                {ko ? "페이백" : "Payback"}
              </span>
            </h2>
            <p data-anim="cta-child" className="text-zinc-400 text-lg mb-10 leading-relaxed">
              {ko
                ? "파트너 거래소를 통해 얼마나 절약할 수 있는지 확인하세요."
                : "See how much you could save on trading fees with our partner exchanges."}
            </p>
            <div data-anim="cta-child" className="flex flex-col items-center gap-6">
              <Link
                href={`/${lang}/calculator`}
                className="group inline-flex items-center justify-center gap-2 rounded-full bg-blue-600 px-10 py-4 text-sm font-semibold text-white transition-all duration-300 hover:bg-blue-500 hover:shadow-[0_0_30px_-8px_rgba(37,99,235,0.4)]"
              >
                {ko ? "지금 가입하기" : "Sign Up Now"}
                <svg className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth="2">
                  <path d="M1 8h14M9 2l6 6-6 6" />
                </svg>
              </Link>
              <div className="flex items-center gap-4">
                {EXCHANGES.map((ex) => (
                  <a
                    key={ex.name}
                    href={ex.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-xl bg-white/[0.06] border border-white/[0.08] flex items-center justify-center overflow-hidden transition-all hover:bg-white/[0.12] hover:border-blue-500/30 hover:scale-110"
                    title={`${ex.name} — ${ex.paybackRate}% payback`}
                  >
                    <Image src={ex.logo} alt={ex.name} width={24} height={24} className="object-contain" />
                  </a>
                ))}
              </div>
              <p className="text-zinc-600 text-xs">{ko ? "거래소를 클릭하여 추천 코드로 가입하세요" : "Click an exchange to sign up with our referral"}</p>
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}
