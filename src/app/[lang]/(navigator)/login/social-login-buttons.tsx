"use client";

import { useEffect, useState, useCallback } from "react";
import { signIn } from "next-auth/react";

export function SocialLoginButtons({ lang }: { lang?: string }) {
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [authInProgress, setAuthInProgress] = useState(false);
  const ko = lang === "ko";

  // Set up the auth callback
  useEffect(() => {
    (window as any).onTelegramAuth = async (user: any) => {
      setAuthInProgress(true);
      await signIn("telegram", {
        id: String(user.id),
        first_name: user.first_name || "",
        username: user.username || "",
        hash: user.hash || "",
        auth_date: String(user.auth_date || ""),
        callbackUrl: `/${lang || "ko"}/dashboard`,
        redirect: true,
      });
    };

    // Load Telegram widget script in background (hidden, never rendered visually)
    const script = document.createElement("script");
    script.src = "https://telegram.org/js/telegram-widget.js?22";
    script.async = true;
    script.onload = () => setScriptLoaded(true);
    document.head.appendChild(script);

    return () => {
      delete (window as any).onTelegramAuth;
    };
  }, [lang]);

  // Trigger Telegram auth popup programmatically
  const handleTelegramLogin = useCallback(() => {
    const TG = (window as any).Telegram;
    if (TG?.Login?.auth) {
      TG.Login.auth(
        { bot_id: "8656225831", request_access: "write" },
        (user: any) => {
          if (user) {
            (window as any).onTelegramAuth?.(user);
          }
        }
      );
    } else {
      // Fallback: open bot with start param
      window.open("https://t.me/FuturesAIAdminbot?start=login", "_blank");
    }
  }, []);

  return (
    <div className="mb-6">
      <button
        onClick={handleTelegramLogin}
        disabled={authInProgress}
        className="group flex items-center gap-3 w-full justify-center px-6 py-3.5 rounded-xl bg-[#2AABEE] hover:bg-[#229ED9] text-white font-semibold transition-all duration-200 hover:shadow-[0_0_24px_rgba(42,171,238,0.35)] disabled:opacity-60"
      >
        {authInProgress ? (
          <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" className="opacity-25" />
            <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        ) : (
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
          </svg>
        )}
        {authInProgress
          ? (ko ? "로그인 중..." : "Logging in...")
          : (ko ? "Telegram으로 로그인" : "Login with Telegram")}
      </button>

      <p className="text-center text-[11px] text-zinc-500 mt-3">
        {ko ? "Telegram으로 간편 로그인" : "Quick login with Telegram"}
      </p>
    </div>
  );
}
