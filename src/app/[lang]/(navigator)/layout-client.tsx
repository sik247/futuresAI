"use client";

import React from "react";
import Headers from "@/components/headers";
import Footer from "@/components/footer";
import { LanguageSwitcher } from "@/components/language-switcher";

type LayoutClientProps = {
  lang: string;
  translations: any;
  children: React.ReactNode;
};

export default function LayoutClient({ lang, translations, children }: LayoutClientProps) {
  return (
    <html lang={lang}>
      <body>
        <header>
          <LanguageSwitcher />
        </header>
        <main>{children}</main>
        <Footer translations={translations} />
      </body>
    </html>
  );
} 