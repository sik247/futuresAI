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
      className="group relative flex items-center justify-center w-9 h-9 rounded-lg cursor-pointer transition-all duration-200 hover:bg-white/[0.06] border border-transparent hover:border-white/[0.08]"
      aria-label={isKorean ? "Switch to English" : "한국어로 전환"}
      title={isKorean ? "Switch to English" : "한국어로 전환"}
    >
      {/* Globe icon */}
      <svg
        className="w-[18px] h-[18px] text-zinc-400 group-hover:text-blue-400 transition-colors duration-200"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.8}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5a17.92 17.92 0 01-8.716-2.247m0 0A8.966 8.966 0 013 12c0-1.264.26-2.466.732-3.558"
        />
      </svg>

      {/* Language label tooltip */}
      <span className="absolute -bottom-7 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded text-[9px] font-medium bg-zinc-800 text-zinc-300 border border-zinc-700/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
        {isKorean ? "EN" : "KO"}
      </span>
    </button>
  );
}

export default LanguageSwitcher;
