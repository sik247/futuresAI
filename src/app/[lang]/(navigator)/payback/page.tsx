import Link from "next/link";
import Container from "@/components/ui/container";
import PaybackAnimations from "./payback-animations";

const EXCHANGES = [
  { name: "Bitget", account: "base03", paybackRate: 50, makerFee: 0.02, takerFee: 0.06, link: "https://www.bitget.com" },
  { name: "Bybit", account: "BBLL", paybackRate: 40, makerFee: 0.02, takerFee: 0.055, link: "https://www.bybit.com" },
  { name: "BingX", account: "FCC9QDJK", paybackRate: 45, makerFee: 0.02, takerFee: 0.05, link: "https://www.bingx.com" },
  { name: "OKX", account: "COINBASE", paybackRate: 40, makerFee: 0.02, takerFee: 0.05, link: "https://www.okx.com" },
  { name: "Gate.io", account: "COINBASE", paybackRate: 40, makerFee: 0.02, takerFee: 0.05, link: "https://www.gate.io" },
];

export default function PaybackPage({
  params,
}: {
  params: { lang: string };
}) {
  const { lang } = params;

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <PaybackAnimations />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-white/5">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-blue-600/8 blur-[120px]" />
        </div>

        <Container className="relative z-10 py-28 md:py-36">
          <div
            data-anim="hero-badge"
            className="inline-flex items-center gap-2 px-4 py-1.5 mb-8 rounded-full border border-blue-500/20 bg-blue-500/10 text-blue-300 text-xs font-medium tracking-wider uppercase"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
            Live Payback Tracking
          </div>

          <h1
            data-anim="hero-title"
            className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[0.95]"
          >
            <span className="block text-white">Your Payback</span>
            <span className="block mt-2 bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-300 bg-clip-text text-transparent">
              Dashboard
            </span>
          </h1>

          <p
            data-anim="hero-subtitle"
            className="mt-6 text-lg md:text-xl text-zinc-400 max-w-2xl leading-relaxed"
          >
            Track your payback earnings across partner exchanges. See how much
            you save on trading fees and maximize your returns.
          </p>

          <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 max-w-3xl">
            {[
              { value: "5+", label: "Exchanges" },
              { value: "50%", label: "Max Payback" },
              { value: "24/7", label: "Support" },
              { value: "$2M+", label: "Paid Out" },
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
              Partner Network
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
              Partner Exchanges
            </h2>
            <p className="text-zinc-500 mb-12 max-w-xl">
              Our affiliated exchanges and their current payback rates.
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
                  <div className="w-14 h-14 rounded-xl bg-white/[0.06] border border-white/[0.08] flex items-center justify-center text-xl font-bold text-blue-400">
                    {exchange.name[0]}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">{exchange.name}</h3>
                    <span className="text-xs text-zinc-500 font-mono">{exchange.account}</span>
                  </div>
                </div>

                <div className="mb-6 p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1 font-medium">
                    Payback Rate
                  </p>
                  <p className="text-4xl font-bold font-mono tabular-nums bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                    {exchange.paybackRate}%
                  </p>
                </div>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-500">Maker Fee</span>
                    <span className="font-medium text-zinc-300 font-mono tabular-nums">
                      {exchange.makerFee}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-500">Taker Fee</span>
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
                  Visit Exchange
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 14 14" stroke="currentColor" strokeWidth="2">
                    <path d="M1 7h12M8 2l5 5-5 5" />
                  </svg>
                </a>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-b from-zinc-950 via-blue-950/20 to-zinc-950" />
        </div>

        <Container className="relative z-10 py-24 md:py-32">
          <div data-anim="cta-section" className="text-center max-w-2xl mx-auto">
            <p data-anim="cta-child" className="text-blue-400 text-sm font-medium tracking-wider uppercase mb-4">
              Start Saving
            </p>
            <h2 data-anim="cta-child" className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 tracking-tight">
              Calculate Your{" "}
              <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                Payback
              </span>
            </h2>
            <p data-anim="cta-child" className="text-zinc-400 text-lg mb-10 leading-relaxed">
              See how much you could save on trading fees with our partner exchanges.
            </p>
            <div data-anim="cta-child">
              <Link
                href={`/${lang}/calculator`}
                className="group inline-flex items-center justify-center gap-2 rounded-full bg-blue-600 px-10 py-4 text-sm font-semibold text-white transition-all duration-300 hover:bg-blue-500 hover:shadow-[0_0_30px_-8px_rgba(37,99,235,0.4)]"
              >
                Run New Calculation
                <svg className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth="2">
                  <path d="M1 8h14M9 2l6 6-6 6" />
                </svg>
              </Link>
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}
