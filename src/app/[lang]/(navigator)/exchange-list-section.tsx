"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Exchange } from "@prisma/client";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useRouter } from "next/navigation";
import React, { useCallback, useEffect, useRef } from "react";

gsap.registerPlugin(ScrollTrigger);

type TExchangeListSection = {
  exchanges: Exchange[];
};

const ExchangeListSection = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & TExchangeListSection
>(({ exchanges, ...props }, ref) => {
  const router = useRouter();
  const sectionRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);

  // GSAP staggered entrance
  useEffect(() => {
    const ctx = gsap.context(() => {
      // Title entrance
      if (titleRef.current) {
        gsap.fromTo(
          titleRef.current.children,
          { opacity: 0, y: 30 },
          {
            opacity: 1,
            y: 0,
            duration: 0.7,
            stagger: 0.1,
            ease: "power3.out",
            scrollTrigger: {
              trigger: titleRef.current,
              start: "top 85%",
              once: true,
            },
          }
        );
      }

      // Cards staggered entrance
      if (gridRef.current) {
        gsap.fromTo(
          gridRef.current.querySelectorAll("[data-exchange-card]"),
          { opacity: 0, y: 50, scale: 0.95 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.6,
            stagger: 0.12,
            ease: "power3.out",
            scrollTrigger: {
              trigger: gridRef.current,
              start: "top 85%",
              once: true,
            },
          }
        );
      }
    }, sectionRef);

    return () => ctx.revert();
  }, [exchanges]);

  // Pixel-grid hover effect handler
  const handleMouseLeave = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    const overlay = card.querySelector("[data-pixel-overlay]") as HTMLElement;
    if (!overlay) return;

    // Show pixel overlay briefly
    overlay.style.opacity = "1";

    // Create pixel grid cells
    const cols = 8;
    const rows = 6;
    overlay.innerHTML = "";
    const cellW = 100 / cols;
    const cellH = 100 / rows;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cell = document.createElement("div");
        cell.style.cssText = `
          position: absolute;
          left: ${c * cellW}%;
          top: ${r * cellH}%;
          width: ${cellW}%;
          height: ${cellH}%;
          background: rgba(37, 99, 235, 0.12);
          border: 1px solid rgba(37, 99, 235, 0.06);
        `;
        overlay.appendChild(cell);
      }
    }

    // Animate cells out in random stagger
    const cells = overlay.children;
    const indices = Array.from({ length: cells.length }, (_, i) => i);
    // Shuffle
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }

    indices.forEach((idx, order) => {
      gsap.to(cells[idx], {
        opacity: 0,
        duration: 0.15,
        delay: order * 0.02,
        ease: "power1.out",
      });
    });

    // Hide entire overlay after animation
    gsap.to(overlay, {
      opacity: 0,
      duration: 0.1,
      delay: indices.length * 0.02 + 0.15,
    });
  }, []);

  return (
    <section
      ref={(node: HTMLDivElement | null) => {
        (sectionRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
        if (typeof ref === "function") ref(node);
        else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
      }}
      {...props}
      className="px-5 md:px-20 py-16 bg-gradient-to-b from-zinc-950 to-zinc-900"
    >
      {/* Section Title */}
      <div ref={titleRef} className="flex flex-col gap-2 mb-10">
        <p className="text-xs font-mono uppercase tracking-widest text-blue-400">
          Our Partners
        </p>
        <p className="text-2xl md:text-3xl font-bold text-white">
          Partner Exchanges
        </p>
        <p className="text-sm text-zinc-400 max-w-md">
          Payback deals and trading competitions with our partners
        </p>
      </div>

      {/* Exchange Cards Grid */}
      <div
        ref={gridRef}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
      >
        {exchanges.map((exchange) => (
          <div
            key={exchange.id}
            data-exchange-card
            onClick={() => router.push(`/exchanges/${exchange.id}`)}
            onMouseLeave={handleMouseLeave}
            className="group relative rounded-xl p-6 cursor-pointer
              backdrop-blur-md bg-white/5 border border-white/10
              hover:border-blue-500/50 hover:bg-white/[0.07]
              hover:-translate-y-1 hover:scale-[1.02]
              hover:shadow-[0_8px_40px_rgba(37,99,235,0.15)]
              transition-all duration-300 ease-out
              overflow-hidden"
          >
            {/* Pixel overlay container */}
            <div
              data-pixel-overlay
              className="absolute inset-0 pointer-events-none z-10"
              style={{ opacity: 0 }}
            />

            {/* Card top: logo + name + tag */}
            <div className="flex items-center gap-4 mb-5">
              <Avatar className="w-12 h-12 ring-2 ring-white/10 group-hover:ring-blue-500/30 transition-all duration-300">
                <AvatarImage
                  src={exchange.titleImageUrl}
                  alt={`${exchange.name} logo`}
                />
                <AvatarFallback className="bg-zinc-800 text-zinc-300 font-bold">
                  {exchange.name.substring(0, 2)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-lg font-bold text-white group-hover:text-blue-300 transition-colors duration-200">
                  {exchange.name}
                </p>
                <p className="text-xs font-mono text-zinc-500">
                  {exchange.type === "new"
                    ? "Exclusive Partner"
                    : "Recommended"}
                </p>
              </div>
            </div>

            {/* Payback Rate - Large Gradient */}
            <div className="mb-5">
              <p className="text-xs font-mono uppercase tracking-wider text-zinc-500 mb-1">
                Payback Rate
              </p>
              <p className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                {exchange.paybackRatio.toFixed(0)}%
              </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-3 pt-4 border-t border-white/5">
              <div>
                <p className="text-[10px] font-mono uppercase tracking-wider text-zinc-600 mb-0.5">
                  Discount
                </p>
                <p className="text-sm font-bold text-zinc-300">
                  {exchange.discountRatio}%
                </p>
              </div>
              <div>
                <p className="text-[10px] font-mono uppercase tracking-wider text-zinc-600 mb-0.5">
                  Maker Fee
                </p>
                <p className="text-sm font-bold text-zinc-300">
                  {exchange.limitFee}%
                </p>
              </div>
              <div>
                <p className="text-[10px] font-mono uppercase tracking-wider text-zinc-600 mb-0.5">
                  Taker Fee
                </p>
                <p className="text-sm font-bold text-zinc-300">
                  {exchange.marketFee}%
                </p>
              </div>
            </div>

            {/* Hover glow accent */}
            <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-blue-600/0 group-hover:bg-blue-600/10 rounded-full blur-2xl transition-all duration-500 pointer-events-none" />
          </div>
        ))}
      </div>
    </section>
  );
});

ExchangeListSection.displayName = "ExchangeListSection";

export { ExchangeListSection };
