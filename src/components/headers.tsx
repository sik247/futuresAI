// components/Headers.tsx
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRightEndOnRectangleIcon, UserIcon, SunIcon, MoonIcon } from "@heroicons/react/24/outline";

import Logo from "@/components/logo";
import HeaderHamburger from "@/components/header-hamburger";
import HeaderMeMenu from "@/components/header-me-menu";
import { useSession } from "next-auth/react";
import dynamic from "next/dynamic";
import { Dictionary } from "@/i18n";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";

const LanguageSwitcher = dynamic(
  () => import("./language-switcher").then((mod) => mod.LanguageSwitcher),
  { ssr: false }
);

type THeaders = { lang: string; translations: Dictionary };

const NAV_ITEMS = [
  { path: "dashboard", key: "dashboard" as const },
  { path: "charts", key: "charts" as const },
  { path: "signals", key: "signals" as const },
  { path: "markets", key: "markets" as const },
  { path: "whales", key: "whales" as const },
  { path: "sns", key: "sns" as const },
  { path: "news", key: "news" as const },
  { path: "calculator", key: "calculator" as const },
  { path: "chart-ideas", key: "chartIdeas" as const },
] as const;

const Headers: React.FC<THeaders> = ({ lang, translations }) => {
  const { data: session } = useSession();
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isActive = (path: string) => pathname?.includes(`/${path}`);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 h-16 transition-all duration-500 ease-out ${
        scrolled
          ? "bg-zinc-950/80 backdrop-blur-2xl border-b border-white/[0.06] shadow-[0_1px_3px_rgba(0,0,0,0.4),0_4px_24px_rgba(0,0,0,0.2)]"
          : "bg-transparent border-b border-transparent"
      }`}
    >
      {/* Subtle top highlight line when scrolled */}
      <div
        className={`absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-blue-500/20 to-transparent transition-opacity duration-500 ${
          scrolled ? "opacity-100" : "opacity-0"
        }`}
      />

      <div className="h-full max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6">
        {/* Logo */}
        <div className="flex-shrink-0">
          <Logo />
        </div>

        {/* Center nav (hidden on mobile) */}
        <nav className="hidden lg:flex items-center gap-0.5">
          {NAV_ITEMS.map(({ path, key }) => (
            <Link key={path} href={`/${lang}/${path}`}>
              <span
                className={`relative px-3 py-2 text-[13px] font-medium tracking-wide transition-all duration-200 rounded-lg ${
                  isActive(path)
                    ? "text-white bg-white/[0.08]"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]"
                }`}
              >
                {translations[key]}
                {/* Active indicator line with glow */}
                <span
                  className={`absolute -bottom-[7px] left-1/2 -translate-x-1/2 h-[2px] rounded-full transition-all duration-300 ${
                    isActive(path)
                      ? "w-5 opacity-100 bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]"
                      : "w-0 opacity-0 bg-blue-500"
                  }`}
                />
                {/* Subtle active glow behind the text */}
                {isActive(path) && (
                  <span className="absolute inset-0 rounded-lg bg-blue-500/[0.06] blur-[2px] pointer-events-none" />
                )}
              </span>
            </Link>
          ))}
        </nav>

        {/* Auth, theme toggle & mobile menu */}
        <div className="flex items-center gap-1.5">
          {/* Theme toggle */}
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="relative p-2 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.06] transition-all duration-200"
            aria-label="Toggle theme"
          >
            <SunIcon className="w-[18px] h-[18px] hidden dark:block" />
            <MoonIcon className="w-[18px] h-[18px] block dark:hidden" />
          </button>

          {session?.user ? (
            <>
              <HeaderMeMenu />
              <LanguageSwitcher />
            </>
          ) : (
            <>
              <Link href={`/${lang}/login`} className="hidden sm:block">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-4 text-[13px] font-medium rounded-lg border-zinc-700/60 bg-transparent text-zinc-300 hover:text-white hover:border-zinc-500 hover:bg-white/[0.06] transition-all duration-200"
                >
                  <ArrowRightEndOnRectangleIcon className="w-4 h-4" />
                  <span className="ml-1.5">{translations.login}</span>
                </Button>
              </Link>
              <Link href={`/${lang}/signup`} className="hidden sm:block">
                <Button
                  size="sm"
                  className="h-8 px-4 text-[13px] font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-500 shadow-sm shadow-blue-600/25 hover:shadow-[0_0_20px_rgba(59,130,246,0.35)] transition-all duration-300"
                >
                  <UserIcon className="w-4 h-4" />
                  <span className="ml-1.5">{translations.signup}</span>
                </Button>
              </Link>
              <LanguageSwitcher />
            </>
          )}
          <HeaderHamburger lang={lang} translations={translations} className="lg:hidden" />
        </div>
      </div>
    </header>
  );
};

export default Headers;
