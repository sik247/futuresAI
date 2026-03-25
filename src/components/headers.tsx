// components/Headers.tsx
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  ArrowRightEndOnRectangleIcon,
  UserIcon,
  SunIcon,
  MoonIcon,
  ChartBarIcon,
  PresentationChartLineIcon,
  BeakerIcon,
  GlobeAltIcon,
  CurrencyDollarIcon,
  ChatBubbleLeftRightIcon,
  NewspaperIcon,
  CalculatorIcon,
  WalletIcon,
} from "@heroicons/react/24/outline";

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
  { path: "portfolio", key: "portfolio" as const, icon: WalletIcon, group: 0 },
  { path: "dashboard", key: "dashboard" as const, icon: ChartBarIcon, group: 0 },
  { path: "charts", key: "charts" as const, icon: PresentationChartLineIcon, group: 1 },
  { path: "quant", key: "quant" as const, icon: BeakerIcon, group: 1 },
  { path: "markets", key: "markets" as const, icon: GlobeAltIcon, group: 1 },
  { path: "whales", key: "whales" as const, icon: CurrencyDollarIcon, group: 2 },
  { path: "sns", key: "sns" as const, icon: ChatBubbleLeftRightIcon, group: 2 },
  { path: "news", key: "news" as const, icon: NewspaperIcon, group: 2 },
  { path: "calculator", key: "calculator" as const, icon: CalculatorIcon, group: 3 },
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

  // Group items with separators
  let lastGroup = -1;

  return (
    <header
      className={`fixed inset-x-0 top-[30px] z-50 h-16 transition-all duration-500 ease-out ${
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
          {NAV_ITEMS.map(({ path, key, icon: Icon, group }) => {
            const showSeparator = lastGroup !== -1 && group !== lastGroup;
            lastGroup = group;
            const active = isActive(path);

            return (
              <React.Fragment key={path}>
                {showSeparator && (
                  <div className="mx-1 h-4 w-px bg-zinc-700/40" aria-hidden="true" />
                )}
                <Link href={`/${lang}/${path}`} className="group relative">
                  <span
                    className={`relative flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-semibold tracking-wide uppercase rounded-full transition-all duration-300 ${
                      active
                        ? "text-white bg-gradient-to-r from-blue-600/20 to-cyan-600/20 border border-blue-500/30 shadow-[0_0_12px_rgba(59,130,246,0.25)]"
                        : "text-zinc-400 border border-transparent hover:text-zinc-100 hover:bg-white/[0.05] hover:border-white/[0.06]"
                    }`}
                  >
                    {/* Icon */}
                    <Icon
                      className={`w-3.5 h-3.5 flex-shrink-0 transition-all duration-300 ${
                        active
                          ? "text-blue-400"
                          : "text-zinc-500 group-hover:text-zinc-300 group-hover:scale-110"
                      }`}
                    />
                    {/* Label */}
                    <span className="leading-none">{translations[key]}</span>

                    {/* Active glow layer behind pill */}
                    {active && (
                      <span className="absolute inset-0 rounded-full bg-blue-500/[0.08] blur-sm pointer-events-none animate-pulse-subtle" />
                    )}
                  </span>
                </Link>
              </React.Fragment>
            );
          })}
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
