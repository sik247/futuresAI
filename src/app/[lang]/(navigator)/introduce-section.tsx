"use client";

import { Button } from "@/components/ui/button";
import React, { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

type TIntroduceSection = {};

const IntroduceSection = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & TIntroduceSection
>((props, ref) => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const icon1Ref = useRef<HTMLDivElement>(null);
  const icon2Ref = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Feature cards entrance
      if (cardsRef.current) {
        const cards = cardsRef.current.children;
        gsap.from(cards, {
          y: 40,
          opacity: 0,
          duration: 0.8,
          ease: "power3.out",
          stagger: 0.2,
          scrollTrigger: {
            trigger: cardsRef.current,
            start: "top 85%",
            once: true,
          },
        });
      }

      // Icon pulse/glow animation
      [icon1Ref, icon2Ref].forEach((iconRef) => {
        if (iconRef.current) {
          gsap.to(iconRef.current, {
            boxShadow: "0 0 20px 4px rgba(37,99,235,0.3)",
            scale: 1.08,
            duration: 1.5,
            ease: "sine.inOut",
            yoyo: true,
            repeat: -1,
          });
        }
      });

      // CTA section entrance
      if (ctaRef.current) {
        gsap.from(ctaRef.current, {
          y: 50,
          opacity: 0,
          duration: 1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ctaRef.current,
            start: "top 85%",
            once: true,
          },
        });

        const children = ctaRef.current.querySelectorAll(".cta-child");
        gsap.from(children, {
          y: 30,
          opacity: 0,
          duration: 0.8,
          ease: "power3.out",
          stagger: 0.15,
          delay: 0.3,
          scrollTrigger: {
            trigger: ctaRef.current,
            start: "top 85%",
            once: true,
          },
        });
      }

      // Button glow shimmer
      if (btnRef.current) {
        gsap.to(btnRef.current, {
          boxShadow:
            "0 0 25px 5px rgba(37,99,235,0.35), 0 0 60px 10px rgba(37,99,235,0.1)",
          duration: 2,
          ease: "sine.inOut",
          yoyo: true,
          repeat: -1,
        });
      }
    });

    return () => ctx.revert();
  }, []);

  return (
    <section ref={ref} {...props} className="flex flex-col gap-12">
      {/* Feature Cards */}
      <div ref={cardsRef} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div
          className="rounded-xl p-6 flex items-center gap-5
            backdrop-blur-md bg-white/[0.04] border border-white/[0.08]
            hover:border-blue-500/40 hover:shadow-[0_0_30px_-5px_rgba(37,99,235,0.15)]
            transition-[border-color,box-shadow] duration-300"
        >
          <div
            ref={icon1Ref}
            className="w-14 h-14 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center shrink-0"
          >
            <svg
              className="w-7 h-7 text-blue-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div className="flex flex-col gap-1">
            <p className="text-zinc-400 text-sm">Nice to meet you!</p>
            <p className="text-zinc-100 font-semibold">
              Get cashback on every trade you make
            </p>
          </div>
        </div>

        <div
          className="rounded-xl p-6 flex items-center gap-5
            backdrop-blur-md bg-white/[0.04] border border-white/[0.08]
            hover:border-blue-500/40 hover:shadow-[0_0_30px_-5px_rgba(37,99,235,0.15)]
            transition-[border-color,box-shadow] duration-300"
        >
          <div
            ref={icon2Ref}
            className="w-14 h-14 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center shrink-0"
          >
            <svg
              className="w-7 h-7 text-blue-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
          </div>
          <div className="flex flex-col gap-1">
            <p className="text-zinc-400 text-sm">Have questions?</p>
            <p className="text-zinc-100 font-semibold">
              24/7 live support available
            </p>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div
        ref={ctaRef}
        className="relative w-full flex flex-col gap-7 items-center py-14 px-6 rounded-2xl overflow-hidden
          bg-gradient-to-br from-zinc-950 via-zinc-900 to-blue-950
          border border-white/[0.08]"
      >
        {/* Ambient glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />

        <p className="cta-child relative text-3xl md:text-4xl font-bold text-white text-center leading-tight max-w-lg">
          Ready to start earning paybacks?
        </p>
        <p className="cta-child relative text-sm text-zinc-400 text-center max-w-md leading-relaxed">
          Join thousands of traders maximizing their returns with our exchange
          partnership program.
        </p>
        <Button
          ref={btnRef}
          className="cta-child relative bg-blue-600 text-white font-bold rounded-full px-10 py-6
            hover:bg-blue-500 transition-colors text-base
            border border-blue-400/30"
        >
          Apply for Exchange Partnership
        </Button>
      </div>
    </section>
  );
});

IntroduceSection.displayName = "IntroduceSection";

export { IntroduceSection };
