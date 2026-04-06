import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import Container from "@/components/ui/container";
import PaybackAnimations from "./payback-animations";
import { auth } from "@/auth";
import PaybackRequest from "./payback-request";

export const metadata: Metadata = {
  title: "Trading Rebates and Payback",
  description:
    "Earn up to 75% trading fee rebates on partner exchanges including Bitget, Bybit, OKX, Gate.io, and HTX. Track your payback earnings with Futures AI.",
  keywords: ["trading rebates", "crypto payback", "exchange referral", "fee rebates", "Bitget rebate", "Bybit rebate"],
};

const EXCHANGES = [
  { name: "Bitget", paybackRate: 55, makerFee: 0.02, takerFee: 0.06, link: "https://partner.bitget.com/bg/FuturesAI", logo: "/icons/exchange/bitget.png" },
  { name: "Bybit", paybackRate: 20, makerFee: 0.02, takerFee: 0.055, link: "https://partner.bybit.com/b/FUTURESAI", logo: "/icons/exchange/bybit.png" },
  { name: "BingX", paybackRate: 50, makerFee: 0.02, takerFee: 0.05, link: "https://bingx.com/en/invite/FCC9QDJK", logo: "/icons/exchange/bingx.png" },
  { name: "Gate.io", paybackRate: 75, makerFee: 0.02, takerFee: 0.05, link: "https://www.gate.com/share/FuturesAI", logo: "/icons/exchange/gate.png" },
  { name: "HTX", paybackRate: 54, makerFee: 0.02, takerFee: 0.05, link: "https://www.htx.com.gt/invite/en-us/1h?invite_code=miqkc223", logo: "/icons/exchange/htx.png" },
  { name: "OKX", paybackRate: 20, makerFee: 0.02, takerFee: 0.05, link: "https://www.okx.com/join/futuresai", logo: "/icons/exchange/okx.png" },
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
            <p className="text-zinc-500 mb-12 max-w-xl">
              {ko ? "제휴 거래소와 현재 페이백 요율입니다." : "Our affiliated exchanges and their current payback rates."}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {EXCHANGES.map((exchange) => (
              <div
                key={exchange.name}
                data-anim="exchange-card"
                className="group relative rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6 transition-all duration-300 hover:border-blue-500/30 hover:bg-white/[0.06] hover:-translate-y-1"
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
                    {ko ? "페이백 비율" : "Payback Rate"}
                  </p>
                  <p className="text-4xl font-bold font-mono tabular-nums bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                    {exchange.paybackRate}%
                  </p>
                </div>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-500">{ko ? "메이커 수수료" : "Maker Fee"}</span>
                    <span className="font-medium text-zinc-300 font-mono tabular-nums">
                      {exchange.makerFee}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-500">{ko ? "테이커 수수료" : "Taker Fee"}</span>
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
