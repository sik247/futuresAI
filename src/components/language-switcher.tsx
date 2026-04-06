"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function LanguageSwitcher() {
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isKorean = pathname.startsWith("/ko");

  const switchLanguage = () => {
    const currentLang = pathname.split("/")[1];
    const newLang = currentLang === "en" ? "ko" : "en";
    const newPathname = pathname.replace(`/${currentLang}`, `/${newLang}`);
    router.push(newPathname);
  };

  if (!mounted) {
    return (
      <button className="flex items-center justify-center w-9 h-9 rounded-lg bg-transparent">
        <div className="w-5 h-5 rounded-full bg-zinc-700 animate-pulse" />
      </button>
    );
  }

  return (
    <button
      onClick={switchLanguage}
      className="group relative flex items-center justify-center gap-1.5 h-9 px-2.5 rounded-lg cursor-pointer transition-all duration-200 hover:bg-white/[0.06] border border-transparent hover:border-white/[0.08]"
      aria-label={isKorean ? "Switch to English" : "한국어로 전환"}
      title={isKorean ? "Switch to English" : "한국어로 전환"}
    >
      {/* Current language flag */}
      <span className="text-base leading-none">{isKorean ? "🇰🇷" : "🇺🇸"}</span>
      {/* Arrow */}
      <svg className="w-3 h-3 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 15L12 18.75 15.75 15m-7.5-6L12 5.25 15.75 9" />
      </svg>
      {/* Target language flag */}
      <span className="text-base leading-none opacity-50 group-hover:opacity-100 transition-opacity">{isKorean ? "🇺🇸" : "🇰🇷"}</span>
    </button>
  );
}

export default LanguageSwitcher;
