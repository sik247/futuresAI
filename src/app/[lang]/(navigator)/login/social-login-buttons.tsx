"use client";

import { useEffect, useRef, useState } from "react";
import { signIn } from "next-auth/react";

export function SocialLoginButtons({ lang }: { lang?: string }) {
  const widgetRef = useRef<HTMLDivElement>(null);
  const [widgetLoaded, setWidgetLoaded] = useState(false);
  const [authInProgress, setAuthInProgress] = useState(false);
  const ko = lang === "ko";

  useEffect(() => {
    // Set up auth callback
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

    // Create and load the Telegram widget
    if (widgetRef.current) {
      widgetRef.current.innerHTML = "";
      const script = document.createElement("script");
      script.src = "https://telegram.org/js/telegram-widget.js?22";
      script.setAttribute("data-telegram-login", "FuturesAIAdminbot");
      script.setAttribute("data-size", "large");
      script.setAttribute("data-radius", "12");
      script.setAttribute("data-request-access", "write");
      script.setAttribute("data-userpic", "true");
      script.setAttribute("data-onauth", "onTelegramAuth(user)");
      script.async = true;
      script.onload = () => {
        // Check after a short delay if widget rendered properly
        setTimeout(() => {
          const container = widgetRef.current;
          if (container) {
            const text = container.textContent || "";
            if (!text.includes("invalid") && !text.includes("error")) {
              setWidgetLoaded(true);
            }
          }
        }, 1500);
      };
      widgetRef.current.appendChild(script);
    }

    return () => {
      delete (window as any).onTelegramAuth;
    };
  }, [lang]);

  return (
    <div className="mb-6">
      {authInProgress && (
        <div className="flex justify-center py-3">
          <div className="flex items-center gap-3 px-6 py-3 rounded-xl bg-[#2AABEE]/10 border border-[#2AABEE]/20">
            <svg className="w-5 h-5 text-[#2AABEE] animate-spin" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" className="opacity-25" />
              <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <span className="text-sm font-medium text-[#2AABEE]">
              {ko ? "로그인 중..." : "Logging in..."}
            </span>
          </div>
        </div>
      )}

      {/* Telegram widget — rendered directly. Shows the official "Log in with Telegram" button */}
      <div
        ref={widgetRef}
        className={`flex justify-center min-h-[44px] items-center ${authInProgress ? "hidden" : ""}`}
      />

      {/* If widget fails to load after 1.5s, show our fallback button */}
      {!widgetLoaded && !authInProgress && (
        <div className="flex justify-center mt-2">
          <a
            href={`https://oauth.telegram.org/auth?bot_id=8656225831&origin=${encodeURIComponent("https://www.futuresai.io")}&embed=1&request_access=write`}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-3 w-full justify-center px-6 py-3.5 rounded-xl bg-[#2AABEE] hover:bg-[#229ED9] text-white font-semibold transition-all duration-200 hover:shadow-[0_0_24px_rgba(42,171,238,0.35)]"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
            </svg>
            {ko ? "Telegram으로 로그인" : "Login with Telegram"}
          </a>
        </div>
      )}

      <p className="text-center text-[11px] text-zinc-500 mt-3">
        {ko ? "Telegram 계정으로 간편 로그인 · FuturesAI 채널 자동 참여" : "Quick login with Telegram · Auto-join FuturesAI channel"}
      </p>
    </div>
  );
}
