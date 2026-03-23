"use client";

import { useEffect, useRef, useCallback } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Link from "next/link";
import { ArrowDown, ChevronRight } from "lucide-react";
import { usePathname } from "next/navigation";

gsap.registerPlugin(ScrollTrigger);

/* ------------------------------------------------
   Stat card data
   ------------------------------------------------ */
const STATS = [
  { label: "Max Payback", value: 50, suffix: "%", description: "On trading fees" },
  { label: "Partner Exchanges", value: 4, suffix: "+", description: "Major platforms" },
  { label: "Uptime Support", value: 24, suffix: "/7", description: "Always available" },
];

/* ------------------------------------------------
   Pixel grid overlay for card hover effect
   ------------------------------------------------ */
function PixelOverlay() {
  return (
    <div
      className="pointer-events-none absolute inset-0 z-10 opacity-0 transition-opacity duration-300"
      data-pixel-overlay
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg width='8' height='8' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='4' height='4' fill='%233b82f6' fill-opacity='0.12'/%3E%3C/svg%3E\")",
        backgroundSize: "8px 8px",
      }}
    />
  );
}

/* ------------------------------------------------
   Animated counter component
   ------------------------------------------------ */
function StatCard({
  label,
  value,
  suffix,
  description,
  index,
}: {
  label: string;
  value: number;
  suffix: string;
  description: string;
  index: number;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const numberRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const card = cardRef.current;
    const numberEl = numberRef.current;
    if (!card || !numberEl) return;

    // Pixel overlay on mouse leave
    const overlay = card.querySelector("[data-pixel-overlay]") as HTMLElement;

    const handleMouseEnter = () => {
      if (overlay) {
        gsap.to(overlay, { opacity: 0, duration: 0.3 });
      }
      gsap.to(card, {
        scale: 1.02,
        duration: 0.3,
        ease: "power2.out",
      });
    };

    const handleMouseLeave = () => {
      if (overlay) {
        gsap.fromTo(
          overlay,
          { opacity: 0.6 },
          { opacity: 0, duration: 0.8, ease: "power2.out" }
        );
      }
      gsap.to(card, {
        scale: 1,
        duration: 0.3,
        ease: "power2.out",
      });
    };

    card.addEventListener("mouseenter", handleMouseEnter);
    card.addEventListener("mouseleave", handleMouseLeave);

    // Counter animation on scroll
    const counter = { val: 0 };
    ScrollTrigger.create({
      trigger: card,
      start: "top 85%",
      once: true,
      onEnter: () => {
        gsap.to(counter, {
          val: value,
          duration: 2,
          delay: index * 0.15,
          ease: "power2.out",
          onUpdate: () => {
            numberEl.textContent = Math.round(counter.val).toString();
          },
        });
      },
    });

    return () => {
      card.removeEventListener("mouseenter", handleMouseEnter);
      card.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [value, index]);

  return (
    <div
      ref={cardRef}
      className="glass-card glow-border relative overflow-hidden rounded-xl p-6 md:p-8 cursor-default"
      data-stat-card
    >
      <PixelOverlay />
      <p className="text-xs font-mono uppercase tracking-[0.15em] text-zinc-400 mb-3">
        {label}
      </p>
      <div className="flex items-baseline gap-1">
        <span
          ref={numberRef}
          className="text-4xl md:text-5xl font-bold font-mono tabular-nums text-gradient-blue"
        >
          0
        </span>
        <span className="text-2xl md:text-3xl font-bold text-blue-400/80">
          {suffix}
        </span>
      </div>
      <p className="text-sm text-zinc-500 mt-2">{description}</p>
    </div>
  );
}

/* ------------------------------------------------
   Main Hero Component
   ------------------------------------------------ */
export function DashboardHeroClient() {
  const pathname = usePathname();
  const lang = pathname?.split("/")[1] || "en";
  const heroRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const sublineRef = useRef<HTMLParagraphElement>(null);
  const labelRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const decorRef = useRef<HTMLDivElement>(null);
  const particlesRef = useRef<HTMLDivElement>(null);
  const geometryRef = useRef<SVGSVGElement>(null);

  /* Mouse parallax tracking */
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!heroRef.current) return;
    const rect = heroRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;

    if (decorRef.current) {
      gsap.to(decorRef.current, {
        x: x * 30,
        y: y * 20,
        duration: 1,
        ease: "power2.out",
      });
    }
    if (geometryRef.current) {
      gsap.to(geometryRef.current, {
        x: x * -20,
        y: y * -15,
        duration: 1.2,
        ease: "power2.out",
      });
    }
  }, []);

  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;

    hero.addEventListener("mousemove", handleMouseMove);

    const ctx = gsap.context(() => {
      /* ---- Timeline: text reveal ---- */
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      // Label fade in
      if (labelRef.current) {
        tl.fromTo(
          labelRef.current,
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.8 },
          0.2
        );
      }

      // Split headline words for staggered reveal
      if (headlineRef.current) {
        const words = headlineRef.current.querySelectorAll("[data-word]");
        if (words.length > 0) {
          tl.fromTo(
            words,
            { opacity: 0, y: 60, rotateX: -15 },
            {
              opacity: 1,
              y: 0,
              rotateX: 0,
              duration: 1,
              stagger: 0.12,
            },
            0.3
          );
        }
      }

      // Subline
      if (sublineRef.current) {
        tl.fromTo(
          sublineRef.current,
          { opacity: 0, y: 30 },
          { opacity: 1, y: 0, duration: 0.8 },
          0.8
        );
      }

      // CTA
      if (ctaRef.current) {
        tl.fromTo(
          ctaRef.current,
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.6 },
          1.1
        );
      }

      // Stat cards
      const statCards = hero.querySelectorAll("[data-stat-card]");
      if (statCards.length > 0) {
        tl.fromTo(
          statCards,
          { opacity: 0, y: 40, scale: 0.95 },
          { opacity: 1, y: 0, scale: 1, duration: 0.7, stagger: 0.1 },
          1.0
        );
      }

      /* ---- Floating particles ---- */
      if (particlesRef.current) {
        const particles = particlesRef.current.children;
        Array.from(particles).forEach((p, i) => {
          gsap.set(p, {
            x: Math.random() * 100 - 50,
            y: Math.random() * 100 - 50,
          });
          gsap.to(p, {
            y: `+=${30 + Math.random() * 40}`,
            x: `+=${(Math.random() - 0.5) * 60}`,
            opacity: 0,
            duration: 3 + Math.random() * 4,
            repeat: -1,
            delay: i * 0.5,
            ease: "none",
            onRepeat: function () {
              gsap.set(p, {
                y: Math.random() * 100 - 50,
                x: Math.random() * 100 - 50,
                opacity: 0.6,
              });
            },
          });
        });
      }

      /* ---- Geometry animation ---- */
      if (geometryRef.current) {
        const circles = geometryRef.current.querySelectorAll("[data-geo-circle]");
        const lines = geometryRef.current.querySelectorAll("[data-geo-line]");

        gsap.fromTo(
          circles,
          { scale: 0, opacity: 0, transformOrigin: "center" },
          {
            scale: 1,
            opacity: 0.3,
            duration: 1.5,
            stagger: 0.2,
            ease: "elastic.out(1, 0.5)",
            delay: 0.5,
          }
        );

        gsap.fromTo(
          lines,
          { strokeDashoffset: 200 },
          {
            strokeDashoffset: 0,
            duration: 2,
            stagger: 0.15,
            ease: "power2.out",
            delay: 0.8,
          }
        );
      }

      /* ---- Parallax on scroll ---- */
      if (headlineRef.current) {
        gsap.to(headlineRef.current, {
          y: -60,
          scrollTrigger: {
            trigger: hero,
            start: "top top",
            end: "bottom top",
            scrub: 1,
          },
        });
      }

      if (decorRef.current) {
        gsap.to(decorRef.current, {
          y: -100,
          scale: 0.8,
          opacity: 0,
          scrollTrigger: {
            trigger: hero,
            start: "top top",
            end: "bottom top",
            scrub: 1.5,
          },
        });
      }
    }, hero);

    return () => {
      hero.removeEventListener("mousemove", handleMouseMove);
      ctx.revert();
    };
  }, [handleMouseMove]);

  return (
    <div
      ref={heroRef}
      className="relative min-h-screen flex flex-col justify-center overflow-hidden bg-zinc-950"
    >
      {/* Background layers */}
      <div className="absolute inset-0 bg-dot-pattern opacity-30" />
      <div className="absolute inset-0 bg-gradient-to-b from-zinc-950 via-transparent to-zinc-950" />

      {/* Radial glow */}
      <div
        ref={decorRef}
        className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] md:w-[900px] md:h-[900px] pointer-events-none"
      >
        <div className="absolute inset-0 rounded-full bg-blue-600/8 blur-[120px]" />
        <div className="absolute inset-[15%] rounded-full bg-blue-500/5 blur-[80px]" />
        <div className="absolute inset-[35%] rounded-full bg-cyan-500/4 blur-[60px]" />
      </div>

      {/* Geometric SVG decorations */}
      <svg
        ref={geometryRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="0 0 1200 800"
        preserveAspectRatio="xMidYMid slice"
      >
        {/* Circles */}
        <circle
          data-geo-circle
          cx="150"
          cy="200"
          r="60"
          fill="none"
          stroke="rgba(37, 99, 235, 0.15)"
          strokeWidth="1"
        />
        <circle
          data-geo-circle
          cx="1050"
          cy="150"
          r="40"
          fill="none"
          stroke="rgba(6, 182, 212, 0.12)"
          strokeWidth="1"
        />
        <circle
          data-geo-circle
          cx="950"
          cy="600"
          r="80"
          fill="none"
          stroke="rgba(37, 99, 235, 0.1)"
          strokeWidth="1"
        />
        <circle
          data-geo-circle
          cx="200"
          cy="650"
          r="30"
          fill="none"
          stroke="rgba(6, 182, 212, 0.15)"
          strokeWidth="1"
        />
        {/* Lines */}
        <line
          data-geo-line
          x1="100"
          y1="400"
          x2="300"
          y2="350"
          stroke="rgba(37, 99, 235, 0.1)"
          strokeWidth="1"
          strokeDasharray="200"
        />
        <line
          data-geo-line
          x1="900"
          y1="250"
          x2="1100"
          y2="300"
          stroke="rgba(6, 182, 212, 0.08)"
          strokeWidth="1"
          strokeDasharray="200"
        />
        <line
          data-geo-line
          x1="500"
          y1="700"
          x2="700"
          y2="680"
          stroke="rgba(37, 99, 235, 0.06)"
          strokeWidth="1"
          strokeDasharray="200"
        />
      </svg>

      {/* Floating particles */}
      <div
        ref={particlesRef}
        className="absolute inset-0 pointer-events-none overflow-hidden"
      >
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              width: `${2 + Math.random() * 3}px`,
              height: `${2 + Math.random() * 3}px`,
              top: `${10 + Math.random() * 80}%`,
              left: `${5 + Math.random() * 90}%`,
              background:
                i % 2 === 0
                  ? "rgba(37, 99, 235, 0.5)"
                  : "rgba(6, 182, 212, 0.4)",
              opacity: 0.6,
            }}
          />
        ))}
      </div>

      {/* Hero content */}
      <div className="relative z-10 flex justify-center w-full px-6">
        <div className="max-w-6xl w-full">
          {/* Label */}
          <p
            ref={labelRef}
            className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-[0.25em] text-blue-400/70 mb-8 opacity-0"
          >
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse-glow" />
            AI-Powered Crypto Trading Intelligence
          </p>

          {/* Headline */}
          <h1
            ref={headlineRef}
            className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-extrabold leading-[0.9] tracking-tighter mb-8"
            style={{ perspective: "800px" }}
          >
            <span data-word className="inline-block text-white opacity-0">
              MAXIMIZE
            </span>
            <br />
            <span data-word className="inline-block text-white opacity-0">
              YOUR&nbsp;
            </span>
            <span data-word className="inline-block text-gradient opacity-0 animate-gradient-shift">
              CRYPTO
            </span>
            <br />
            <span data-word className="inline-block text-white opacity-0">
              PAYBACKS
            </span>
          </h1>

          {/* Subline */}
          <p
            ref={sublineRef}
            className="text-lg md:text-xl text-zinc-400 max-w-xl leading-relaxed mb-10 opacity-0"
          >
            Get up to <span className="text-white font-semibold">50% back</span> on every trade. Connect your exchange, trade as
            usual, and watch your rebates grow automatically.
          </p>

          {/* CTA */}
          <div ref={ctaRef} className="flex flex-wrap items-center gap-4 mb-20 opacity-0">
            <Link
              href={`/${lang}/calculator`}
              className="group relative inline-flex items-center gap-2 rounded-full bg-blue-600 px-8 py-4 text-sm font-semibold text-white transition-all duration-300 hover:bg-blue-500 hover:shadow-[0_0_40px_rgba(59,130,246,0.4)] overflow-hidden"
            >
              {/* Shimmer sweep on hover */}
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              <span className="relative">Calculate Your Payback</span>
              <ChevronRight className="relative w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href={`/${lang}/exchanges`}
              className="inline-flex items-center gap-2 rounded-full border border-zinc-700 px-8 py-4 text-sm font-medium text-zinc-300 transition-all duration-300 hover:border-zinc-500 hover:text-white hover:bg-white/[0.04]"
            >
              View Exchanges
            </Link>
          </div>

          {/* Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
            {STATS.map((stat, i) => (
              <StatCard key={stat.label} {...stat} index={i} />
            ))}
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3">
        <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-zinc-500">
          Scroll
        </span>
        <ArrowDown className="w-4 h-4 text-zinc-500 animate-scroll-bounce" />
      </div>
    </div>
  );
}
