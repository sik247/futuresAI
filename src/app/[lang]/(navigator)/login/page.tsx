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
        {/* Dot pattern */}
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

        {/* Glassmorphism card */}
        <div className="relative rounded-2xl bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] p-6 sm:p-8 shadow-2xl shadow-black/40">
          {/* Subtle top glow on the card */}
          <div className="absolute -top-px inset-x-6 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />

          {/* Social login buttons */}
          <SocialLoginButtons />

          {/* Divider */}
          <div className="relative flex items-center mb-6">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent to-white/[0.08]" />
            <span className="px-3 text-xs font-mono text-zinc-500 uppercase tracking-wider">
              {t.login_or_continue}
            </span>
            <div className="flex-1 h-px bg-gradient-to-l from-transparent to-white/[0.08]" />
          </div>

          {/* Login form */}
          <LoginForm translations={t} />

          {/* Forgot password */}
          <div className="mt-4 text-center">
            <button
              type="button"
              className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors duration-200"
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
              className="text-blue-400 hover:text-blue-300 font-medium transition-colors duration-200 hover:underline underline-offset-4"
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
