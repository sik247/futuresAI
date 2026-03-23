import React from "react";
import { Metadata } from "next";
import { SignUpForm } from "./sign-up-form";
import Link from "next/link";
import { getDictionary } from "@/i18n";

export const metadata: Metadata = {
  title: "Sign Up",
  description:
    "Create your free Futures AI account to unlock AI trading signals, whale tracking, real-time charts, and up to 50% trading fee rebates.",
  keywords: ["sign up", "create account", "crypto trading platform", "trading rebates"],
};

type TSignUpPage = {
  params: { lang: string };
};

const SignUpPage: React.FC<TSignUpPage> = async ({ params: { lang } }) => {
  const t = await getDictionary(lang);

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4 py-24">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/[0.04] rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 right-1/3 w-[400px] h-[400px] bg-cyan-500/[0.03] rounded-full blur-3xl" />
        <div className="absolute inset-0 bg-dot-pattern opacity-20" />
      </div>

      <div className="relative w-full max-w-md animate-fade-in-up">
        {/* Header text */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white tracking-tight mb-2">
            {t.signup_title}
          </h1>
          <p className="text-sm text-zinc-400 leading-relaxed max-w-sm mx-auto">
            {t.signup_subtitle}
          </p>
        </div>

        {/* Glassmorphism card */}
        <div className="relative rounded-2xl bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] p-6 sm:p-8 shadow-2xl shadow-black/40">
          {/* Subtle top glow on the card */}
          <div className="absolute -top-px inset-x-6 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
          <SignUpForm translations={t} lang={lang} />
        </div>

        {/* Login link */}
        <div className="mt-8 text-center">
          <p className="text-sm text-zinc-500">
            {t.signup_already_have_account}{" "}
            <Link
              href={`/${lang}/login`}
              className="text-blue-400 hover:text-blue-300 font-medium transition-colors duration-200 hover:underline underline-offset-4"
            >
              {t.login}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignUpPage;
