import { Metadata } from "next";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import Container from "@/components/ui/container";

export const metadata: Metadata = {
  title: "Welcome to Futures AI",
  robots: { index: false, follow: false },
};

export default async function WelcomePage({
  params: { lang },
}: {
  params: { lang: string };
}) {
  const session = await auth();
  if (!session?.user) {
    redirect(`/${lang}/login`);
  }

  const ko = lang === "ko";
  const userName = session.user.name || "User";

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4 py-24">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-blue-500/[0.06] rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-emerald-500/[0.04] rounded-full blur-[100px]" />
      </div>

      <Container className="relative z-10 max-w-2xl">
        <div className="text-center mb-10">
          {/* Checkmark animation */}
          <div className="relative mx-auto w-20 h-20 mb-6">
            <div className="absolute inset-0 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 animate-pulse" />
            <div className="relative w-full h-full rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-center">
              <svg className="w-10 h-10 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight mb-3">
            {ko ? `환영합니다, ${userName}님!` : `Welcome, ${userName}!`}
          </h1>
          <p className="text-zinc-400 text-lg leading-relaxed">
            {ko
              ? "Futures AI에 성공적으로 가입하셨습니다. 아래 단계를 따라 시작하세요."
              : "You've successfully joined Futures AI. Follow the steps below to get started."}
          </p>
        </div>

        {/* Onboarding steps */}
        <div className="space-y-4 mb-10">
          {/* Step 1: Join Telegram Channel */}
          <a
            href={lang === "ko" ? "https://t.me/FuturesAIOfficial" : "https://t.me/FuturesAI_Global"}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-4 p-5 rounded-2xl border border-[#2AABEE]/20 bg-[#2AABEE]/[0.06] hover:bg-[#2AABEE]/[0.12] hover:border-[#2AABEE]/40 transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2AABEE]/50"
          >
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-[#2AABEE]/20 shrink-0">
              <svg className="w-6 h-6 text-[#2AABEE]" viewBox="0 0 24 24" fill="currentColor">
                <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-[#2AABEE] uppercase tracking-wider">Step 1</span>
              </div>
              <p className="text-sm font-semibold text-white group-hover:text-[#2AABEE] transition-colors">
                {ko ? "Futures AI 텔레그램 채널 참여하기" : "Join Futures AI Telegram Channel"}
              </p>
              <p className="text-xs text-zinc-500 mt-0.5">
                {ko ? "실시간 퀀트 알림과 시장 분석을 받으세요" : "Get live quant alerts and market analysis"}
              </p>
            </div>
            <svg className="w-5 h-5 text-zinc-600 group-hover:text-[#2AABEE] group-hover:translate-x-1 transition-all shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
            </svg>
          </a>

          {/* Step 2: Link Exchange Account */}
          <Link
            href={`/${lang}/dashboard`}
            className="group flex items-center gap-4 p-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.06] hover:bg-emerald-500/[0.12] hover:border-emerald-500/40 transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50"
          >
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-emerald-500/20 shrink-0">
              <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.07-9.07a4.5 4.5 0 016.364 6.364l-4.5 4.5a4.5 4.5 0 01-7.244-1.242" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider">Step 2</span>
              </div>
              <p className="text-sm font-semibold text-white group-hover:text-emerald-400 transition-colors">
                {ko ? "거래소 계정 연결하기" : "Link Your Exchange Account"}
              </p>
              <p className="text-xs text-zinc-500 mt-0.5">
                {ko ? "거래소 UID를 등록하고 페이백을 받으세요" : "Register your exchange UID to earn payback"}
              </p>
            </div>
            <svg className="w-5 h-5 text-zinc-600 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </Link>

          {/* Step 3: Explore Features */}
          <Link
            href={`/${lang}/quant`}
            className="group flex items-center gap-4 p-5 rounded-2xl border border-blue-500/20 bg-blue-500/[0.06] hover:bg-blue-500/[0.12] hover:border-blue-500/40 transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50"
          >
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-500/20 shrink-0">
              <svg className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-blue-400 uppercase tracking-wider">Step 3</span>
              </div>
              <p className="text-sm font-semibold text-white group-hover:text-blue-400 transition-colors">
                {ko ? "AI 퀀트 시그널 확인하기" : "Check AI Quant Signals"}
              </p>
              <p className="text-xs text-zinc-500 mt-0.5">
                {ko ? "실시간 시장 분석과 트레이딩 시그널" : "Real-time market analysis and trading signals"}
              </p>
            </div>
            <svg className="w-5 h-5 text-zinc-600 group-hover:text-blue-400 group-hover:translate-x-1 transition-all shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </Link>
        </div>

        {/* Skip / Go to dashboard */}
        <div className="text-center">
          <Link
            href={`/${lang}/dashboard`}
            className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-white transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20 rounded px-2 py-1"
          >
            {ko ? "대시보드로 바로 이동" : "Go straight to dashboard"}
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </Link>
        </div>
      </Container>
    </div>
  );
}
