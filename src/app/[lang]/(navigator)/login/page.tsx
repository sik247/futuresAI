import React from "react";
import { Metadata } from "next";
import { LoginForm } from "./login-form";
import { SocialLoginButtons } from "./social-login-buttons";
import Link from "next/link";
import { getDictionary } from "@/i18n";

export const metadata: Metadata = {
  title: "Log In",
  description:
    "Log in to Futures AI to access AI-powered trading signals, whale tracking, portfolio analytics, and trading rebates.",
  robots: { index: false, follow: true },
};

type TLoginPage = {
  params: { lang: string };
};

const LoginPage: React.FC<TLoginPage> = async ({ params: { lang } }) => {
  const t = await getDictionary(lang);

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4 py-24">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/[0.04] rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-cyan-500/[0.03] rounded-full blur-3xl" />
        <div className="absolute inset-0 bg-dot-pattern opacity-20" />
      </div>

      <div className="relative w-full max-w-md animate-fade-in-up">
        {/* Header text */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white tracking-tight mb-2">
            {t.login_title}
          </h1>
          <p className="text-sm text-zinc-400 leading-relaxed max-w-sm mx-auto">
            {t.login_subtitle}
          </p>
        </div>

        {/* Value props */}
        <div className="grid grid-cols-2 gap-2.5 mb-8">
          {[
            { icon: "M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5", label: lang === "ko" ? "AI 포트폴리오 관리" : "AI Portfolio Management" },
            { icon: "M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z", label: lang === "ko" ? "AI 트레이딩 어드바이스" : "AI Trading Advice" },
            { icon: "M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 01-2.25 2.25M16.5 7.5V18a2.25 2.25 0 002.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 002.25 2.25h13.5", label: lang === "ko" ? "코인 뉴스 추적" : "Track Coin News" },
            { icon: "M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z", label: lang === "ko" ? "페이백 관리" : "Manage Paybacks" },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              <svg className="w-4 h-4 text-blue-400 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
              </svg>
              <span className="text-[11px] text-zinc-400 leading-tight">{item.label}</span>
            </div>
          ))}
        </div>

        {/* Glassmorphism card */}
        <div className="relative rounded-2xl bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] p-6 sm:p-8 shadow-2xl shadow-black/40">
          {/* Subtle top glow on the card */}
          <div className="absolute -top-px inset-x-6 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />

          {/* Social login buttons */}
          <SocialLoginButtons lang={lang} />

          {/* Divider */}
          <div className="relative flex items-center mb-6">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-white/[0.08]" />
            <span className="px-3 text-xs font-mono text-zinc-500 uppercase tracking-wider shrink-0">
              {t.login_or_continue}
            </span>
            <div className="flex-1 h-px bg-gradient-to-l from-transparent via-white/[0.06] to-white/[0.08]" />
          </div>

          {/* Login form */}
          <LoginForm translations={t} lang={lang} />

          {/* Forgot password */}
          <div className="mt-4 text-center">
            <button
              type="button"
              className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 rounded px-1 py-0.5"
            >
              {t.login_forgot_password}
            </button>
          </div>
        </div>

        {/* Sign up link */}
        <div className="mt-8 text-center">
          <p className="text-sm text-zinc-500">
            {t.login_no_account}{" "}
            <Link
              href={`/${lang}/signup`}
              className="text-blue-400 hover:text-blue-300 font-medium transition-colors duration-200 hover:underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 rounded"
            >
              {t.signup}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
