"use client";

import { useEffect, useRef } from "react";
import { signIn } from "next-auth/react";

/**
 * Telegram Login Widget — uses the official Telegram Login Widget
 * which calls our credentials provider with verified auth data.
 */
export function SocialLoginButtons() {
  const telegramRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load Telegram Login Widget script
    const botName = "FuturesAIAdminbot"; // Your bot username without @
    const script = document.createElement("script");
    script.src = "https://telegram.org/js/telegram-widget.js?22";
    script.setAttribute("data-telegram-login", botName);
    script.setAttribute("data-size", "large");
    script.setAttribute("data-radius", "12");
    script.setAttribute("data-request-access", "write");
    script.setAttribute("data-userpic", "true");
    script.setAttribute("data-onauth", "onTelegramAuth(user)");
    script.async = true;

    // Global callback for Telegram widget
    (window as any).onTelegramAuth = async (user: any) => {
      await signIn("telegram", {
        id: String(user.id),
        first_name: user.first_name || "",
        username: user.username || "",
        hash: user.hash || "",
        auth_date: String(user.auth_date || ""),
        callbackUrl: "/",
      });
    };

    if (telegramRef.current) {
      telegramRef.current.innerHTML = "";
      telegramRef.current.appendChild(script);
    }

    return () => {
      delete (window as any).onTelegramAuth;
    };
  }, []);

  return (
    <div className="mb-6">
      <div ref={telegramRef} className="flex justify-center min-h-[44px] items-center" />
      <p className="text-center text-[11px] text-zinc-600 mt-3">
        Telegram으로 간편 로그인
      </p>
    </div>
  );
}
