"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";

export default function PaybackAlertBanner({ lang }: { lang: string }) {
  const [dismissed, setDismissed] = useState(false);
  const pathname = usePathname();
  const isKo = lang === "ko";

  if (pathname.includes("/payback") || pathname.includes("/guides/")) return null;
  if (dismissed) return null;

  return (
    <div className="relative border-b border-white/10 bg-zinc-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2 flex items-center justify-center gap-2 sm:gap-4 text-sm flex-wrap">
        {/* Telegram */}
        <a
          href="https://t.me/FuturesAIOfficial"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#2AABEE]/15 hover:bg-[#2AABEE]/25 border border-[#2AABEE]/25 transition-colors"
        >
          <svg className="w-3.5 h-3.5 text-[#2AABEE] shrink-0" viewBox="0 0 24 24" fill="currentColor">
            <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
          </svg>
          <span className="text-xs font-medium text-[#2AABEE]">
            {isKo ? "텔레그램 참여" : "Join Telegram"}
          </span>
        </a>

        {/* Divider */}
        <span className="text-zinc-700 hidden sm:inline">|</span>

        {/* Payback */}
        <Link
          href={`/${lang}/payback`}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-indigo-600/20 to-cyan-600/20 hover:from-indigo-600/30 hover:to-cyan-600/30 border border-indigo-500/25 transition-colors"
        >
          <svg className="w-3.5 h-3.5 text-yellow-400 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          <span className="text-xs font-medium text-white">
            {isKo ? "최대 75% 페이백 혜택" : "Up to 75% payback"}
          </span>
          <span className="text-xs text-indigo-400 font-bold">&rarr;</span>
        </Link>

        {/* Dismiss */}
        <button
          onClick={() => setDismissed(true)}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full text-zinc-600 hover:text-zinc-400 hover:bg-white/5 transition-colors"
          aria-label="Dismiss"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
