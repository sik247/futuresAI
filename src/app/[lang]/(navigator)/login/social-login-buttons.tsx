"use client";

import { useEffect, useRef, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export function SocialLoginButtons({ lang }: { lang?: string }) {
  const widgetRef = useRef<HTMLDivElement>(null);
  const [authInProgress, setAuthInProgress] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const ko = lang === "ko";

  useEffect(() => {
    // Set up auth callback — called by Telegram widget after user confirms
    (window as any).onTelegramAuth = async (user: any) => {
      console.log("[Telegram Auth] User data received:", user);
      setAuthInProgress(true);
      setError(null);

      try {
        const result = await signIn("telegram", {
          id: String(user.id),
          first_name: user.first_name || "",
          username: user.username || "",
          hash: user.hash || "",
          auth_date: String(user.auth_date || ""),
          redirect: false,
        });

        console.log("[Telegram Auth] signIn result:", result);

        if (result?.error) {
          setError(ko ? "로그인 실패. 다시 시도해주세요." : "Login failed. Please try again.");
          setAuthInProgress(false);
        } else {
          // Success — redirect to welcome page
          router.push(`/${lang || "ko"}/welcome`);
        }
      } catch (err) {
        console.error("[Telegram Auth] Error:", err);
        setError(ko ? "로그인 중 오류가 발생했습니다." : "An error occurred during login.");
        setAuthInProgress(false);
      }
    };

    // Load Telegram widget
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
      widgetRef.current.appendChild(script);
    }

    return () => {
      delete (window as any).onTelegramAuth;
    };
  }, [lang, ko, router]);

  return (
    <div className="mb-6">
      {authInProgress ? (
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
      ) : (
        <div ref={widgetRef} className="flex justify-center min-h-[44px] items-center" />
      )}

      {error && (
        <div className="mt-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-center">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      <p className="text-center text-[11px] text-zinc-500 mt-3">
        {ko ? "Telegram 계정으로 간편 로그인" : "Quick login with Telegram"}
      </p>
    </div>
  );
}
