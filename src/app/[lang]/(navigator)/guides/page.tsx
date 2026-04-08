import Container from "@/components/ui/container";
import Link from "next/link";
import { EXCHANGE_GUIDES } from "./exchange-data";

export default function GuidesPage({
  params: { lang },
}: {
  params: { lang: string };
}) {
  const isKo = lang === "ko";

  return (
    <div className="min-h-screen bg-zinc-950 pt-24 sm:pt-28 pb-24">
      <Container>
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-6">
            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
            <span className="text-xs font-medium text-indigo-400 tracking-wide uppercase">
              {isKo ? "거래소 가이드" : "Exchange Guides"}
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            {isKo
              ? "거래소별 KYC 변경 & 페이백 가이드"
              : "Exchange KYC & Payback Guide"}
          </h1>
          <p className="text-zinc-400 max-w-2xl mx-auto text-base leading-relaxed">
            {isKo
              ? "FuturesAI 전용 코드로 가입하면 업계 최고 수준의 페이백 혜택을 받을 수 있습니다. 아래 거래소별 가이드를 참고하세요."
              : "Sign up with FuturesAI exclusive codes to receive the best payback rates in the industry. Check the guides below for each exchange."}
          </p>
        </div>

        {/* Exchange Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {EXCHANGE_GUIDES.map((exchange) => (
            <Link
              key={exchange.slug}
              href={`/${lang}/guides/${exchange.slug}`}
              className="group relative rounded-2xl bg-zinc-900/60 border border-white/[0.06] hover:border-white/[0.12] transition-all duration-300 overflow-hidden"
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

              {/* Card Content */}
              <div className="p-6 pt-5">
                {/* Exchange Logo */}
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold"
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
                      <p className="text-xs text-zinc-500">{exchange.nameKo}</p>
                    )}
                  </div>
                </div>

                {/* Info Grid */}
                <div className="space-y-3 mb-5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-zinc-500">
                      {isKo ? "레퍼럴 코드" : "Referral Code"}
                    </span>
                    <code className="text-xs font-mono px-2 py-0.5 rounded bg-white/[0.05] text-zinc-300 border border-white/[0.06]">
                      {exchange.referralCode}
                    </code>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-zinc-500">
                      {isKo ? "최대 계정" : "Max Accounts"}
                    </span>
                    <span className="text-xs text-zinc-300">
                      {exchange.maxAccounts}
                      {isKo ? "개" : ""}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-zinc-500">
                      {isKo ? "코드 변경" : "Code Change"}
                    </span>
                    <span
                      className={`text-xs ${exchange.canChangeReferral ? "text-emerald-400" : "text-amber-400"}`}
                    >
                      {exchange.canChangeReferral
                        ? isKo
                          ? "조건부 가능"
                          : "Conditional"
                        : isKo
                          ? "신규 가입 필요"
                          : "New Signup Required"}
                    </span>
                  </div>
                </div>

                {/* CTA */}
                <div className="flex items-center gap-2 text-sm font-medium text-indigo-400 group-hover:text-indigo-300 transition-colors">
                  <span>{isKo ? "가이드 보기" : "View Guide"}</span>
                  <svg
                    className="w-4 h-4 transform group-hover:translate-x-1 transition-transform"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M13 7l5 5m0 0l-5 5m5-5H6"
                    />
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

        {/* Bottom CTA */}
        <div className="mt-16 text-center">
          <div className="inline-flex flex-col items-center p-8 rounded-2xl bg-zinc-900/40 border border-white/[0.06]">
            <h3 className="text-lg font-semibold text-white mb-2">
              {isKo ? "도움이 필요하신가요?" : "Need Help?"}
            </h3>
            <p className="text-sm text-zinc-400 mb-4 max-w-md">
              {isKo
                ? "진행 과정 중 어려운 부분이 있으시다면 FuturesAI 커뮤니티에서 도움을 받아보세요."
                : "If you need assistance during the process, get help from the FuturesAI community."}
            </p>
            <a
              href="https://t.me/futuresai"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-2.5 rounded-xl text-sm font-medium bg-indigo-500 hover:bg-indigo-400 text-white transition-colors"
            >
              {isKo ? "고객센터 문의하기" : "Contact Support"}
            </a>
          </div>
        </div>
      </Container>
    </div>
  );
}
