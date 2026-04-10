"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { Exchange } from "@prisma/client";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import React, { useCallback, useEffect, useRef, useState } from "react";

gsap.registerPlugin(ScrollTrigger);

const PARTNER_LOGOS: { src: string; name: string; href: string }[] = [
  { src: "/icons/footer-icons/bybit-logo.png", name: "Bybit", href: "https://partner.bybit.com/b/FUTURESAI" },
  { src: "/icons/footer-icons/bitget.svg", name: "Bitget", href: "https://partner.bitget.com/bg/FuturesAI" },
  { src: "/icons/footer-icons/bingX.webp", name: "BingX", href: "https://bingx.com/en/invite/FCC9QDJK" },
  { src: "/icons/footer-icons/okx.svg", name: "OKX", href: "https://www.okx.com/join/futuresai" },
];

type TIntroSection = {
  exchanges: Exchange[];
};

const IntroSection = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & TIntroSection
>(({ exchanges, ...props }, ref) => {
  const [exchange, setExchange] = useState<Exchange | null>(
    exchanges[0] ?? null
  );
  const session = useSession();
  const router = useRouter();
  const _pathname = usePathname();
  const _lang = _pathname.split("/")[1] || "en";

  const sectionRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLDivElement>(null);
  const marqueeRef = useRef<HTMLDivElement>(null);
  const marqueeInnerRef = useRef<HTMLDivElement>(null);
  const searchBarRef = useRef<HTMLDivElement>(null);
  const badgesRef = useRef<HTMLDivElement>(null);
  const exchangeNameRef = useRef<HTMLDivElement>(null);
  const exchangeAvatarRef = useRef<HTMLDivElement>(null);

  // GSAP crossfade for exchange rotation
  const rotateExchange = useCallback(() => {
    if (exchanges.length === 0) return;

    setExchange((prev) => {
      if (!prev) return exchanges[0];
      const idx = exchanges.findIndex((info) => info.id === prev.id);
      const next = exchanges[(idx + 1) % exchanges.length];

      // Animate out then in
      const nameEl = exchangeNameRef.current;
      const avatarEl = exchangeAvatarRef.current;
      if (nameEl && avatarEl) {
        const tl = gsap.timeline();
        tl.to([nameEl, avatarEl], {
          opacity: 0,
          y: -8,
          duration: 0.3,
          ease: "power2.in",
        }).set([nameEl, avatarEl], {
          y: 8,
        }).to([nameEl, avatarEl], {
          opacity: 1,
          y: 0,
          duration: 0.3,
          ease: "power2.out",
        });
      }

      return next;
    });
  }, [exchanges]);

  useEffect(() => {
    if (exchanges.length === 0) return;
    const interval = setInterval(rotateExchange, 4000);
    return () => clearInterval(interval);
  }, [exchanges, rotateExchange]);

  // GSAP scroll-triggered entrance animations
  useEffect(() => {
    const ctx = gsap.context(() => {
      // Headline entrance
      if (headlineRef.current) {
        gsap.fromTo(
          headlineRef.current.children,
          { opacity: 0, y: 40 },
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
            stagger: 0.15,
            ease: "power3.out",
            scrollTrigger: {
              trigger: headlineRef.current,
              start: "top 85%",
              once: true,
            },
          }
        );
      }

      // Search bar entrance
      if (searchBarRef.current) {
        gsap.fromTo(
          searchBarRef.current,
          { opacity: 0, y: 30, scale: 0.97 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.7,
            ease: "power3.out",
            scrollTrigger: {
              trigger: searchBarRef.current,
              start: "top 85%",
              once: true,
            },
          }
        );
      }

      // Badges staggered entrance
      if (badgesRef.current) {
        gsap.fromTo(
          badgesRef.current.querySelectorAll("[data-badge]"),
          { opacity: 0, y: 20, scale: 0.95 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.5,
            stagger: 0.08,
            ease: "power2.out",
            scrollTrigger: {
              trigger: badgesRef.current,
              start: "top 90%",
              once: true,
            },
          }
        );
      }
    }, sectionRef);

    return () => ctx.revert();
  }, [exchanges]);

  // GSAP-powered infinite marquee
  useEffect(() => {
    if (!marqueeInnerRef.current) return;

    const inner = marqueeInnerRef.current;
    const totalWidth = inner.scrollWidth / 2;

    const tween = gsap.to(inner, {
      x: -totalWidth,
      duration: 20,
      ease: "none",
      repeat: -1,
      modifiers: {
        x: gsap.utils.unitize((x: number) => {
          return parseFloat(String(x)) % totalWidth;
        }),
      },
    });

    return () => {
      tween.kill();
    };
  }, []);

  if (!exchange) {
    return (
      <section
        ref={ref}
        {...props}
        className="px-8 md:px-20 pt-32 pb-14 flex flex-col bg-zinc-950"
      >
        <div className="text-center pb-12">
          <p className="text-3xl font-bold text-white pb-4">
            Welcome to Futures AI
          </p>
          <p className="text-zinc-400">No exchange data available</p>
        </div>
      </section>
    );
  }

  return (
    <section
      className="relative px-8 md:px-20 pt-32 pb-14 flex flex-col bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950 overflow-hidden"
      ref={(node: HTMLDivElement | null) => {
        (sectionRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
        if (typeof ref === "function") ref(node);
        else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
      }}
      {...props}
    >
      {/* Subtle radial glow behind headline */}
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Headline */}
      <div ref={headlineRef} className="text-center pb-12 relative z-10">
        <p className="text-sm md:text-base font-mono font-medium tracking-widest uppercase text-zinc-500 pb-4">
          Welcome to Futures AI
        </p>
        <h1 className="text-4xl md:text-6xl font-bold leading-tight">
          <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent bg-[length:200%_auto] animate-[gradient-shift_4s_ease-in-out_infinite]">
            Maximize Your
          </span>
          <br />
          <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent bg-[length:200%_auto] animate-[gradient-shift_4s_ease-in-out_infinite]">
            Trading Paybacks
          </span>
        </h1>
        <p className="text-zinc-400 mt-5 max-w-lg mx-auto text-sm md:text-base">
          Connect your exchange account and start earning rebates on every trade
          you make.
        </p>
      </div>

      {/* Partner Exchange Logos - Infinite Marquee */}
      <div
        ref={marqueeRef}
        className="relative mb-12 overflow-hidden mx-auto w-full max-w-2xl"
      >
        {/* Fade edges */}
        <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-zinc-950 to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-zinc-950 to-transparent z-10 pointer-events-none" />

        <div ref={marqueeInnerRef} className="flex items-center gap-12 w-max">
          {/* Duplicate logos for seamless loop */}
          {[...PARTNER_LOGOS, ...PARTNER_LOGOS, ...PARTNER_LOGOS, ...PARTNER_LOGOS].map((logo, i) => (
            <a
              key={`${logo.name}-${i}`}
              href={logo.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-2 shrink-0"
            >
              <div className="w-10 h-10 relative grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all duration-300">
                <Image
                  src={logo.src}
                  alt={logo.name}
                  fill
                  className="object-contain"
                />
              </div>
              <span className="text-xs font-mono text-zinc-500">
                {logo.name}
              </span>
            </a>
          ))}
        </div>
      </div>

      {/* Search Bar - Glassmorphism */}
      <div
        ref={searchBarRef}
        className="mb-8 py-2.5 px-6 flex items-center gap-3 rounded-xl max-w-2xl mx-auto w-full backdrop-blur-md bg-white/5 border border-white/10 shadow-lg shadow-black/20"
      >
        <div ref={exchangeAvatarRef} className="shrink-0">
          <Avatar className="w-8 h-8">
            <AvatarImage src={exchange.titleImageUrl} />
            <AvatarFallback className="bg-zinc-800 text-zinc-300 text-xs">
              {exchange.name.substring(0, 2)}
            </AvatarFallback>
          </Avatar>
        </div>
        <div ref={exchangeNameRef} className="shrink-0">
          <p className="text-lg font-bold text-white">
            {exchange.name}
          </p>
        </div>
        <Input
          className="border-none bg-transparent text-white placeholder:text-zinc-500 focus-visible:ring-0 text-sm"
          placeholder="Enter your exchange UID..."
        />
        <MagnifyingGlassIcon
          className="w-8 h-8 text-zinc-400 hover:text-blue-400 cursor-pointer shrink-0 transition-colors duration-200"
          onClick={() => {
            if (session.data) {
              router.push(`/${_lang}/me/refund-withdraw`);
            } else {
              router.push("/login");
            }
          }}
        />
      </div>

      {/* Exchange Badges */}
      <div ref={badgesRef} className="flex flex-col gap-3 max-w-2xl mx-auto w-full relative z-10">
        <p className="text-xs font-mono uppercase tracking-wider text-zinc-500">
          Average payback per user
        </p>
        <div className="flex gap-3 overflow-x-auto no-scrollbar">
          {exchanges.map((info) => (
            <Link
              href={`/exchanges/${info.id}`}
              key={info.id}
              className="group shrink-0"
              data-badge
            >
              <Badge className="px-3.5 py-2.5 bg-white/5 backdrop-blur-sm border border-white/10 hover:border-blue-500/50 hover:bg-blue-500/10 hover:shadow-[0_0_20px_rgba(37,99,235,0.15)] transition-all duration-300 cursor-pointer">
                <Avatar className="w-5 h-5 mr-2">
                  <AvatarImage src={info.titleImageUrl} />
                  <AvatarFallback className="bg-zinc-800 text-zinc-400 text-[10px]">
                    {info.name.substring(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs font-medium text-zinc-200 flex gap-1.5 items-center">
                  <span>{info.name}</span>
                  <span className="text-blue-400">
                    ${info.averageIncome ? `${info.averageIncome}k` : "--"}
                  </span>
                </span>
              </Badge>
            </Link>
          ))}
        </div>
      </div>

      {/* Gradient shift keyframes */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes gradient-shift {
          0%, 100% { background-position: 0% center; }
          50% { background-position: 100% center; }
        }
      `}} />
    </section>
  );
});

IntroSection.displayName = "IntroSection";

export { IntroSection };
