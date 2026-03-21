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
          ? "bg-zinc-950/80 backdrop-blur-xl border-b border-white/5 shadow-lg shadow-black/10"
          : "bg-transparent border-b border-transparent"
      }`}
    >
      <div className="h-full max-w-7xl mx-auto flex items-center justify-between px-6">
        {/* Logo */}
        <div className="flex-shrink-0">
          <Logo />
        </div>

        {/* Center nav (hidden on mobile) */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV_ITEMS.map(({ path, key }) => (
            <Link key={path} href={`/${lang}/${path}`}>
              <span
                className={`relative px-3 py-2 text-sm tracking-wide transition-colors duration-300 ${
                  isActive(path)
                    ? "text-white"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                {translations[key]}
                {/* Active indicator dot */}
                <span
                  className={`absolute bottom-0 left-1/2 -translate-x-1/2 h-[2px] rounded-full bg-blue-500 transition-all duration-300 ${
                    isActive(path)
                      ? "w-4 opacity-100 shadow-[0_0_8px_rgba(37,99,235,0.6)]"
                      : "w-0 opacity-0"
                  }`}
                />
              </span>
            </Link>
          ))}
        </nav>

        {/* Auth, theme toggle & mobile menu */}
        <div className="flex items-center gap-2">
          {/* Theme toggle */}
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="relative p-2 rounded-full text-zinc-400 hover:text-white hover:bg-white/5 transition-all duration-300"
            aria-label="Toggle theme"
          >
            <SunIcon className="w-[18px] h-[18px] hidden dark:block transition-transform duration-300" />
            <MoonIcon className="w-[18px] h-[18px] block dark:hidden transition-transform duration-300" />
          </button>

          {session?.user ? (
            <>
              <HeaderMeMenu />
              <LanguageSwitcher />
            </>
          ) : (
            <>
              <Link href={`/${lang}/login`}>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-4 text-sm font-medium rounded-full border-zinc-700 bg-transparent text-zinc-300 hover:text-white hover:border-zinc-500 hover:bg-white/5 transition-all duration-300"
                >
                  <ArrowRightEndOnRectangleIcon className="w-4 h-4" />
                  <span className="ml-1.5">{translations.login}</span>
                </Button>
              </Link>
              <Link href={`/${lang}/signup`}>
                <Button
                  size="sm"
                  className="h-8 px-4 text-sm font-medium rounded-full bg-blue-600 text-white hover:bg-blue-500 shadow-md shadow-blue-600/20 hover:shadow-blue-500/30 transition-all duration-300"
                >
                  <UserIcon className="w-4 h-4" />
                  <span className="ml-1.5">{translations.signup}</span>
                </Button>
              </Link>
              <LanguageSwitcher />
            </>
          )}
          <HeaderHamburger lang={lang} translations={translations} className="md:hidden" />
        </div>
      </div>
    </header>
  );
};

export default Headers;
