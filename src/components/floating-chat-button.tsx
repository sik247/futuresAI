"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function FloatingChatButton({ lang }: { lang: string }) {
  const pathname = usePathname();

  // Hide on chat page and home page (home has its own chat widget)
  if (pathname.includes("/chat") || pathname.endsWith("/home")) return null;

  return (
    <Link
      href={`/${lang}/chat`}
      className="fixed bottom-20 right-4 lg:bottom-6 lg:right-6 z-40 group"
      aria-label="AI Chat"
    >
      <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 shadow-lg shadow-purple-900/40 flex items-center justify-center transition-all duration-200 hover:scale-110 hover:shadow-xl hover:shadow-purple-900/50 active:scale-95">
        <svg
          className="w-6 h-6 text-white"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z"
          />
        </svg>
        {/* Pulse ring */}
        <span className="absolute inset-0 rounded-2xl animate-ping bg-purple-500/20 pointer-events-none" style={{ animationDuration: "3s" }} />
      </div>
      {/* Tooltip */}
      <span className="absolute right-16 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg bg-zinc-800 border border-white/10 text-xs text-white font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        AI Chat
      </span>
    </Link>
  );
}
