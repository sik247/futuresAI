"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";

export default function PaybackAlertBanner({ lang }: { lang: string }) {
  const [dismissed, setDismissed] = useState(false);
  const pathname = usePathname();
  const isKo = lang === "ko";

  // Don't show on payback or guides pages (already there)
  if (
    pathname.includes("/payback") ||
    pathname.includes("/guides/")
  )
    return null;

  if (dismissed) return null;

  return (
    <div className="relative bg-gradient-to-r from-indigo-600/90 via-blue-600/90 to-cyan-600/90 border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-center gap-3 text-sm">
        <span className="flex items-center gap-2 text-white/90 font-medium">
          <svg
            className="w-4 h-4 text-yellow-300 shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          {isKo
            ? "최대 75% 거래소 페이백 혜택!"
            : "Up to 75% exchange payback!"}
        </span>
        <Link
          href={`/${lang}/payback`}
          className="shrink-0 px-3 py-1 rounded-full text-xs font-bold bg-white/20 hover:bg-white/30 text-white transition-colors border border-white/20"
        >
          {isKo ? "가이드 보기 →" : "View Guide →"}
        </Link>
        <button
          onClick={() => setDismissed(true)}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full text-white/50 hover:text-white/80 hover:bg-white/10 transition-colors"
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
