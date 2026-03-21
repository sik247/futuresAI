import React from "react";
import Container from "./ui/container";
import Link from "next/link";
import Image from "next/image";

type TFooter = {
  translations: any;
};

const PoweredByIconsPathList = [
  { item: "/icons/footer-icons/trading-view.png", alt: "TradingView" },
  { item: "/icons/footer-icons/okx.svg", alt: "OKX" },
  { item: "/icons/footer-icons/bingX.webp", alt: "BingX" },
  { item: "/icons/footer-icons/bitget.svg", alt: "Bitget" },
  { item: "/icons/footer-icons/bybit-logo.png", alt: "Bybit" },
];

const CommunityIconsPathList = [
  { item: "/icons/footer-icons/instagram.png", alt: "Instagram", href: "#" },
  { item: "/icons/footer-icons/facebook.png", alt: "Facebook", href: "#" },
  {
    item: "/icons/footer-icons/youtube.png",
    alt: "YouTube",
    href: "https://www.youtube.com/@TetherBase",
  },
  { item: "/icons/footer-icons/X.png", alt: "X", href: "#" },
  { item: "/icons/footer-icons/kakaoTalk.png", alt: "KakaoTalk", href: "#" },
];

const Footer: React.FC<TFooter> = ({ translations }) => {
  return (
    <footer className="relative bg-zinc-950 overflow-hidden">
      {/* Top gradient border */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-blue-600/20 to-transparent" />

      {/* Decorative background elements */}
      <div className="absolute top-12 left-8 w-px h-24 bg-gradient-to-b from-zinc-800/40 to-transparent" />
      <div className="absolute top-12 right-8 w-px h-24 bg-gradient-to-b from-zinc-800/40 to-transparent" />
      <div className="absolute bottom-20 left-16 grid grid-cols-3 gap-1.5 opacity-[0.04]">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="w-1 h-1 rounded-full bg-white" />
        ))}
      </div>
      <div className="absolute top-16 right-24 grid grid-cols-3 gap-1.5 opacity-[0.04]">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="w-1 h-1 rounded-full bg-white" />
        ))}
      </div>

      <Container className="relative py-16 max-md:px-6">
        {/* Main grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
          {/* Brand info */}
          <div className="lg:col-span-1 flex flex-col gap-4">
            <span className="text-2xl font-bold bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
              Futures & AI
            </span>
            <p className="text-zinc-500 text-sm leading-relaxed max-w-xs">
              Your premium gateway to crypto markets, analytics, and community insights.
            </p>
            <div className="text-zinc-600 text-sm space-y-1 mt-1">
              <p>support@futuresai.hk</p>
              <p>Live Chat Support (24/7)</p>
            </div>
          </div>

          {/* Quick Links */}
          <div className="flex flex-col gap-4">
            <span className="text-xs font-semibold uppercase tracking-widest text-zinc-400">
              Quick Links
            </span>
            <div className="flex flex-col gap-3">
              <Link
                href="/calculator"
                className="text-sm text-zinc-500 hover:text-white transition-colors duration-300"
              >
                Payback Calculator
              </Link>
              <Link
                href="/exchanges"
                className="text-sm text-zinc-500 hover:text-white transition-colors duration-300"
              >
                Partner Exchanges
              </Link>
              <Link
                href="/team"
                className="text-sm text-zinc-500 hover:text-white transition-colors duration-300"
              >
                Our Team
              </Link>
            </div>
          </div>

          {/* Resources */}
          <div className="flex flex-col gap-4">
            <span className="text-xs font-semibold uppercase tracking-widest text-zinc-400">
              Resources
            </span>
            <div className="flex flex-col gap-3">
              <Link
                href="/news"
                className="text-sm text-zinc-500 hover:text-white transition-colors duration-300"
              >
                Crypto News
              </Link>
              <Link
                href="/charts"
                className="text-sm text-zinc-500 hover:text-white transition-colors duration-300"
              >
                Live Charts
              </Link>
              <Link
                href="/markets"
                className="text-sm text-zinc-500 hover:text-white transition-colors duration-300"
              >
                Market Data
              </Link>
            </div>
          </div>

          {/* Social */}
          <div className="flex flex-col gap-4">
            <span className="text-xs font-semibold uppercase tracking-widest text-zinc-400">
              Community
            </span>
            <ul className="flex gap-3">
              {CommunityIconsPathList.map((path, idx) => (
                <li key={idx}>
                  <a
                    href={path.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center justify-center w-10 h-10 rounded-full bg-white/[0.03] border border-white/[0.06] backdrop-blur-sm hover:bg-blue-600/10 hover:border-blue-500/20 hover:shadow-[0_0_12px_rgba(37,99,235,0.15)] transition-all duration-300"
                  >
                    <Image
                      src={path.item}
                      alt={path.alt}
                      width={18}
                      height={18}
                      className="opacity-50 group-hover:opacity-100 transition-opacity duration-300"
                    />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Partners section */}
        <div className="mt-14 pt-8 border-t border-white/[0.04]">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <span className="text-xs font-semibold uppercase tracking-widest text-zinc-600 shrink-0">
              Powered By
            </span>
            <ul className="flex flex-wrap gap-8 items-center">
              {PoweredByIconsPathList.map((path, idx) => (
                <li key={idx}>
                  <Image
                    src={path.item}
                    alt={path.alt}
                    width={36}
                    height={36}
                    className="grayscale opacity-30 hover:grayscale-0 hover:opacity-100 transition-all duration-500"
                  />
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 pt-6 border-t border-white/[0.04] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-zinc-600 text-xs">
            &copy; {new Date().getFullYear()} Futures & AI. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <Link
              href="/terms"
              className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors duration-300"
            >
              Terms of Service
            </Link>
            <Link
              href="/privacy"
              className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors duration-300"
            >
              Privacy Policy
            </Link>
            <Link
              href="/disclaimer"
              className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors duration-300"
            >
              Disclaimer
            </Link>
          </div>
        </div>
      </Container>
    </footer>
  );
};

export default Footer;
