// components/header-hamburger.tsx
"use client";

import React from "react";
import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from "./ui/sheet";
import Link from "next/link";
import { Bars3Icon } from "@heroicons/react/24/outline";
import { useSession } from "next-auth/react";
import { Dictionary } from "@/i18n";
import Image from "next/image";

interface HeaderHamburgerProps {
  className?: string;
  lang: string;
  translations: Dictionary;
}

const MENU_ITEMS = [
  { path: "dashboard", key: "dashboard" as const },
  { path: "charts", key: "charts" as const },
  { path: "signals", key: "signals" as const },
  { path: "markets", key: "markets" as const },
  { path: "whales", key: "whales" as const },
  { path: "sns", key: "sns" as const },
  { path: "news", key: "news" as const },
  { path: "calculator", key: "calculator" as const },
  { path: "insights", key: "insights" as const },
  { path: "team", key: "team" as const },
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

  return (
    <div className={className}>
      <Sheet>
        <SheetTrigger className="flex items-center">
          <Bars3Icon className="w-6 text-foreground" />
        </SheetTrigger>
        <SheetContent side="left" className="w-full sm:w-[380px] p-0 bg-background border-border">
          <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
          <nav className="flex flex-col h-full pt-16">
            {/* Nav items */}
            <div className="flex-1 flex flex-col">
              {MENU_ITEMS.map(({ path, key }) => (
                <SheetClose key={path} asChild>
                  <Link
                    href={`/${lang}/${path}`}
                    className="px-8 py-4 text-3xl md:text-4xl font-serif text-foreground hover:text-muted-foreground transition-colors"
                  >
                    {translations[key]}
                  </Link>
                </SheetClose>
              ))}

              <div className="mt-4 border-t border-border">
                <SheetClose asChild>
                  {session ? (
                    <Link
                      href={`/${lang}/me`}
                      className="px-8 py-4 text-lg font-serif text-muted-foreground hover:text-foreground transition-colors block"
                    >
                      My Page
                    </Link>
                  ) : (
                    <Link
                      href={`/${lang}/login`}
                      className="px-8 py-4 text-lg font-serif text-muted-foreground hover:text-foreground transition-colors block"
                    >
                      {translations.login} / {translations.signup}
                    </Link>
                  )}
                </SheetClose>
              </div>
            </div>

            {/* Social icons at bottom */}
            <div className="px-8 py-8 border-t border-border">
              <div className="flex gap-4">
                {SOCIAL_LINKS.map((link) => (
                  <a
                    key={link.alt}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="opacity-60 hover:opacity-100 transition-opacity"
                  >
                    <Image
                      src={link.icon}
                      alt={link.alt}
                      width={24}
                      height={24}
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
