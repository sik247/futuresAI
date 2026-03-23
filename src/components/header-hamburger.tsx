// components/header-hamburger.tsx
"use client";

import React from "react";
import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from "./ui/sheet";
import Link from "next/link";
import {
  Bars3Icon,
  ChartBarIcon,
  PresentationChartLineIcon,
  BeakerIcon,
  GlobeAltIcon,
  CurrencyDollarIcon,
  ChatBubbleLeftRightIcon,
  NewspaperIcon,
  CalculatorIcon,
  SparklesIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
import { useSession } from "next-auth/react";
import { Dictionary } from "@/i18n";
import Image from "next/image";
import { usePathname } from "next/navigation";

interface HeaderHamburgerProps {
  className?: string;
  lang: string;
  translations: Dictionary;
}

const MENU_ITEMS = [
  { path: "dashboard", key: "dashboard" as const, icon: ChartBarIcon },
  { path: "charts", key: "charts" as const, icon: PresentationChartLineIcon },
  { path: "quant", key: "quant" as const, icon: BeakerIcon },
  { path: "markets", key: "markets" as const, icon: GlobeAltIcon },
  { path: "whales", key: "whales" as const, icon: CurrencyDollarIcon },
  { path: "sns", key: "sns" as const, icon: ChatBubbleLeftRightIcon },
  { path: "news", key: "news" as const, icon: NewspaperIcon },
  { path: "calculator", key: "calculator" as const, icon: CalculatorIcon },
  { path: "insights", key: "insights" as const, icon: SparklesIcon },
  { path: "team", key: "team" as const, icon: UserGroupIcon },
] as const;

const SOCIAL_LINKS = [
  { icon: "/icons/footer-icons/X.png", alt: "X", href: "#" },
  { icon: "/icons/footer-icons/youtube.png", alt: "YouTube", href: "https://www.youtube.com/@TetherBase" },
  { icon: "/icons/footer-icons/instagram.png", alt: "Instagram", href: "#" },
  { icon: "/icons/footer-icons/kakaoTalk.png", alt: "KakaoTalk", href: "#" },
];

const HeaderHamburger: React.FC<HeaderHamburgerProps> = ({
  className,
  lang,
  translations,
}) => {
  const { data: session } = useSession();
  const pathname = usePathname();
  const isActive = (path: string) => pathname?.includes(`/${path}`);

  return (
    <div className={className}>
      <Sheet>
        <SheetTrigger className="flex items-center">
          <Bars3Icon className="w-6 text-foreground" />
        </SheetTrigger>
        <SheetContent side="left" className="w-full sm:w-[380px] p-0 bg-zinc-950 border-zinc-800/50">
          <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
          <nav className="flex flex-col h-full pt-16">
            {/* Nav items */}
            <div className="flex-1 flex flex-col gap-0.5 px-4">
              {MENU_ITEMS.map(({ path, key, icon: Icon }, index) => {
                const active = isActive(path);
                return (
                  <SheetClose key={path} asChild>
                    <Link
                      href={`/${lang}/${path}`}
                      className={`group flex items-center gap-4 px-4 py-3.5 rounded-xl text-2xl sm:text-3xl font-serif transition-all duration-300 ${
                        active
                          ? "text-white bg-gradient-to-r from-blue-600/15 to-cyan-600/10 border border-blue-500/20 shadow-[0_0_20px_rgba(59,130,246,0.1)]"
                          : "text-zinc-200 hover:text-white hover:bg-white/[0.04] border border-transparent"
                      }`}
                      style={{ animationDelay: `${index * 40}ms` }}
                    >
                      <span className="text-[10px] font-mono text-zinc-600 w-5 tabular-nums">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <Icon
                        className={`w-5 h-5 flex-shrink-0 transition-all duration-300 ${
                          active
                            ? "text-blue-400"
                            : "text-zinc-500 group-hover:text-zinc-300 group-hover:scale-110"
                        }`}
                      />
                      <span className="flex-1">{translations[key]}</span>
                      {active && (
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_6px_rgba(59,130,246,0.6)]" />
                      )}
                    </Link>
                  </SheetClose>
                );
              })}

              <div className="mt-3 pt-3 border-t border-zinc-800/60 px-4">
                <SheetClose asChild>
                  {session ? (
                    <Link
                      href={`/${lang}/me`}
                      className="py-3 text-base font-medium text-zinc-400 hover:text-white transition-colors block"
                    >
                      My Page
                    </Link>
                  ) : (
                    <Link
                      href={`/${lang}/login`}
                      className="py-3 text-base font-medium text-zinc-400 hover:text-white transition-colors block"
                    >
                      {translations.login} / {translations.signup}
                    </Link>
                  )}
                </SheetClose>
              </div>
            </div>

            {/* Social icons at bottom */}
            <div className="px-8 py-6 border-t border-zinc-800/40">
              <div className="flex gap-3">
                {SOCIAL_LINKS.map((link) => (
                  <a
                    key={link.alt}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center w-9 h-9 rounded-lg bg-white/[0.03] border border-white/[0.06] opacity-60 hover:opacity-100 hover:bg-white/[0.06] transition-all duration-200"
                  >
                    <Image
                      src={link.icon}
                      alt={link.alt}
                      width={18}
                      height={18}
                      className="dark:invert"
                    />
                  </a>
                ))}
              </div>
            </div>
          </nav>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default HeaderHamburger;
