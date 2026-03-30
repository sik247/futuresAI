import React from "react";
import Container from "./ui/container";
import Link from "next/link";
import Image from "next/image";

type TFooter = {
  lang?: string;
  translations: any;
};

const PoweredByIconsPathList = [
  { item: "/icons/footer-icons/trading-view.png", alt: "TradingView" },
  { item: "/icons/footer-icons/bingX.webp", alt: "BingX" },
  { item: "/icons/footer-icons/bitget.svg", alt: "Bitget" },
  { item: "/icons/footer-icons/bybit-logo.png", alt: "Bybit" },
];

const CommunityIconsPathList = [
  {
    item: "/icons/footer-icons/telegram.svg",
    alt: "Telegram",
    href: "https://t.me/moneyboutique_ms",
  },
  {
    item: "/icons/footer-icons/telegram.svg",
    alt: "Futures AI Official",
    href: "https://t.me/FuturesAIOfficial",
  },
  {
    item: "/icons/footer-icons/youtube.png",
    alt: "YouTube",
    href: "https://www.youtube.com/@TetherBase",
  },
];

const Footer: React.FC<TFooter> = ({ lang = "en", translations }) => {
  const ko = lang === "ko";

  const QUICK_LINKS = [
    { href: "calculator", label: ko ? "페이백 계산기" : "Payback Calculator" },
    { href: "exchanges", label: ko ? "파트너 거래소" : "Partner Exchanges" },
    { href: "team", label: ko ? "팀 소개" : "Our Team" },
  ];

  const RESOURCE_LINKS = [
    { href: "news", label: ko ? "크립토 뉴스" : "Crypto News" },
    { href: "charts", label: ko ? "실시간 차트" : "Live Charts" },
    { href: "markets", label: ko ? "시장 데이터" : "Market Data" },
  ];

  const LEGAL_LINKS = [
    { href: "terms", label: ko ? "이용약관" : "Terms of Service" },
    { href: "privacy", label: ko ? "개인정보처리방침" : "Privacy Policy" },
    { href: "disclaimer", label: ko ? "면책조항" : "Disclaimer" },
  ];

  return (
    <footer className="relative bg-zinc-950 overflow-hidden">
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-zinc-700/40 to-transparent" />
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/[0.03] rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-cyan-500/[0.02] rounded-full blur-[100px] pointer-events-none" />

      <Container className="relative py-16 lg:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
          {/* Brand */}
          <div className="lg:col-span-1 flex flex-col gap-5">
            <span className="text-2xl font-bold bg-gradient-to-r from-white via-blue-100 to-blue-400 bg-clip-text text-transparent">
              Futures AI
            </span>
            <p className="text-zinc-500 text-sm leading-relaxed max-w-xs">
              {ko
                ? "AI 기반 크립토 트레이딩 시그널, 고래 추적, 시장 분석, 수수료 페이백 플랫폼."
                : "AI-powered crypto trading signals, whale tracking, market analytics, and trading rebates."}
            </p>
            <div className="text-zinc-600 text-sm space-y-1.5 mt-1">
              <a href="mailto:support@futuresai.io" className="hover:text-zinc-400 transition-colors duration-300">support@futuresai.io</a>
              <p>{ko ? "24시간 실시간 지원" : "Live Chat Support (24/7)"}</p>
            </div>
          </div>

          {/* Quick Links */}
          <div className="flex flex-col gap-5">
            <span className="text-xs font-semibold uppercase tracking-widest text-zinc-400">
              {ko ? "빠른 링크" : "Quick Links"}
            </span>
            <div className="flex flex-col gap-3.5">
              {QUICK_LINKS.map((link) => (
                <Link key={link.href} href={`/${lang}/${link.href}`}
                  className="group text-sm text-zinc-500 hover:text-white transition-all duration-300 flex items-center gap-2">
                  <span className="w-0 group-hover:w-2 h-px bg-blue-500 transition-all duration-300" />
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Resources */}
          <div className="flex flex-col gap-5">
            <span className="text-xs font-semibold uppercase tracking-widest text-zinc-400">
              {ko ? "리소스" : "Resources"}
            </span>
            <div className="flex flex-col gap-3.5">
              {RESOURCE_LINKS.map((link) => (
                <Link key={link.href} href={`/${lang}/${link.href}`}
                  className="group text-sm text-zinc-500 hover:text-white transition-all duration-300 flex items-center gap-2">
                  <span className="w-0 group-hover:w-2 h-px bg-blue-500 transition-all duration-300" />
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Community */}
          <div className="flex flex-col gap-5">
            <span className="text-xs font-semibold uppercase tracking-widest text-zinc-400">
              {ko ? "커뮤니티" : "Community"}
            </span>
            <ul className="flex gap-3">
              {CommunityIconsPathList.map((path, idx) => (
                <li key={idx}>
                  <a href={path.href} target="_blank" rel="noopener noreferrer"
                    className="group flex items-center justify-center w-10 h-10 rounded-full bg-white/[0.03] border border-white/[0.06] backdrop-blur-sm hover:bg-blue-600/10 hover:border-blue-500/30 hover:shadow-[0_0_16px_rgba(59,130,246,0.2)] hover:-translate-y-0.5 transition-all duration-300">
                    <Image src={path.item} alt={path.alt} width={18} height={18} className="opacity-50 group-hover:opacity-100 transition-opacity duration-300" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Partners */}
        <div className="mt-14 pt-8 border-t border-zinc-800/40">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <span className="text-xs font-semibold uppercase tracking-widest text-zinc-600 shrink-0">
              {ko ? "파트너" : "Powered By"}
            </span>
            <ul className="flex flex-wrap gap-8 items-center">
              {PoweredByIconsPathList.map((path, idx) => (
                <li key={idx}>
                  <Image src={path.item} alt={path.alt} width={36} height={36}
                    className="grayscale opacity-30 hover:grayscale-0 hover:opacity-100 hover:scale-110 transition-all duration-500" />
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-10 pt-6 border-t border-zinc-800/40 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-zinc-600 text-xs">
            &copy; {new Date().getFullYear()} Futures AI. {ko ? "모든 권리 보유." : "All rights reserved."}
          </p>
          <div className="flex items-center gap-6">
            {LEGAL_LINKS.map((link) => (
              <Link key={link.href} href={`/${lang}/${link.href}`} className="text-xs text-zinc-600 hover:text-zinc-300 transition-colors duration-300">
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </Container>
    </footer>
  );
};

export default Footer;
