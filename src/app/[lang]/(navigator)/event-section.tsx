"use client";

import { getImageUrl } from "@/lib/utils/get-image-url";
import { Event } from "@prisma/client";
import Image from "next/image";
import Link from "next/link";
import React, { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

type TEventSection = {
  events: Event[];
};

const EventSection = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & TEventSection
>(({ events, ...props }, ref) => {
  const headerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Header entrance
      if (headerRef.current) {
        gsap.from(headerRef.current.children, {
          y: 30,
          opacity: 0,
          duration: 0.8,
          ease: "power3.out",
          stagger: 0.15,
          scrollTrigger: {
            trigger: headerRef.current,
            start: "top 85%",
            once: true,
          },
        });
      }

      // Staggered card entrance
      if (scrollRef.current) {
        const cards = scrollRef.current.querySelectorAll(".event-card");
        gsap.from(cards, {
          x: 80,
          opacity: 0,
          duration: 0.7,
          ease: "power3.out",
          stagger: 0.12,
          scrollTrigger: {
            trigger: scrollRef.current,
            start: "top 85%",
            once: true,
          },
        });
      }

      // Drag scrolling
      if (scrollRef.current) {
        const el = scrollRef.current;
        let startX = 0;
        let scrollLeft = 0;
        let isDragging = false;

        const onPointerDown = (e: PointerEvent) => {
          isDragging = true;
          startX = e.pageX - el.offsetLeft;
          scrollLeft = el.scrollLeft;
          el.style.cursor = "grabbing";
        };

        const onPointerMove = (e: PointerEvent) => {
          if (!isDragging) return;
          e.preventDefault();
          const x = e.pageX - el.offsetLeft;
          const walk = (x - startX) * 1.5;
          gsap.to(el, {
            scrollLeft: scrollLeft - walk,
            duration: 0.3,
            ease: "power2.out",
            overwrite: true,
          });
        };

        const onPointerUp = () => {
          isDragging = false;
          el.style.cursor = "grab";
        };

        el.addEventListener("pointerdown", onPointerDown);
        el.addEventListener("pointermove", onPointerMove);
        el.addEventListener("pointerup", onPointerUp);
        el.addEventListener("pointerleave", onPointerUp);

        return () => {
          el.removeEventListener("pointerdown", onPointerDown);
          el.removeEventListener("pointermove", onPointerMove);
          el.removeEventListener("pointerup", onPointerUp);
          el.removeEventListener("pointerleave", onPointerUp);
        };
      }
    });

    return () => ctx.revert();
  }, [events]);

  return (
    <section ref={ref} {...props} className="flex flex-col gap-8">
      <div ref={headerRef} className="flex flex-col gap-1.5">
        <span className="text-xs font-mono uppercase tracking-[0.2em] text-blue-400">
          Upcoming
        </span>
        <h2 className="text-2xl md:text-3xl font-bold text-white leading-tight">
          Trading Events
        </h2>
      </div>

      <div
        ref={scrollRef}
        className="overflow-x-auto whitespace-nowrap w-full no-scrollbar cursor-grab select-none"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        <div className="gap-4 inline-flex">
          {events.map((event, index) => (
            <EventCard key={index} index={index} event={event} />
          ))}
        </div>
      </div>
    </section>
  );
});

EventSection.displayName = "EventSection";

export { EventSection };

type TEventCard = {
  event: Event;
  index: number;
};

const EventCard: React.FC<TEventCard> = ({ index, event }) => {
  const cardRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    if (!cardRef.current) return;
    const card = cardRef.current;
    const img = card.querySelector(".event-img") as HTMLElement;

    const onEnter = (e: MouseEvent) => {
      gsap.to(card, {
        y: -6,
        duration: 0.35,
        ease: "power2.out",
      });
      if (img) {
        const rect = card.getBoundingClientRect();
        const xPercent = ((e.clientX - rect.left) / rect.width - 0.5) * 8;
        const yPercent = ((e.clientY - rect.top) / rect.height - 0.5) * 8;
        gsap.to(img, {
          scale: 1.08,
          x: xPercent,
          y: yPercent,
          duration: 0.5,
          ease: "power2.out",
        });
      }
    };

    const onMove = (e: MouseEvent) => {
      if (!img) return;
      const rect = card.getBoundingClientRect();
      const xPercent = ((e.clientX - rect.left) / rect.width - 0.5) * 12;
      const yPercent = ((e.clientY - rect.top) / rect.height - 0.5) * 12;
      gsap.to(img, {
        x: xPercent,
        y: yPercent,
        duration: 0.4,
        ease: "power2.out",
        overwrite: "auto",
      });
    };

    const onLeave = () => {
      gsap.to(card, {
        y: 0,
        duration: 0.35,
        ease: "power2.out",
      });
      if (img) {
        gsap.to(img, {
          scale: 1,
          x: 0,
          y: 0,
          duration: 0.5,
          ease: "power2.out",
        });
      }
    };

    card.addEventListener("mouseenter", onEnter);
    card.addEventListener("mousemove", onMove);
    card.addEventListener("mouseleave", onLeave);
    return () => {
      card.removeEventListener("mouseenter", onEnter);
      card.removeEventListener("mousemove", onMove);
      card.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  return (
    <Link
      ref={cardRef}
      key={index}
      href={`${event.linkUrl}`}
      className="event-card max-md:w-[300px] w-[520px] flex flex-col rounded-xl overflow-hidden
        backdrop-blur-md bg-white/[0.04] border border-white/[0.08]
        hover:border-blue-500/40 hover:shadow-[0_0_30px_-5px_rgba(37,99,235,0.15)]
        transition-[border-color,box-shadow] duration-300 max-w-full"
    >
      <div className="relative w-full h-48 overflow-hidden bg-zinc-900">
        <Image
          fill
          src={getImageUrl(event.imageUrl)}
          alt={event.title}
          className="event-img object-cover will-change-transform"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
      </div>

      <div className="relative flex flex-col items-start px-5 py-4 gap-2 backdrop-blur-sm bg-white/[0.02]">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono uppercase tracking-wider text-blue-300 bg-blue-500/20 backdrop-blur-sm px-2 py-0.5 rounded-full border border-blue-400/20">
            Event
          </span>
          <span className="text-[11px] font-mono text-zinc-500">
            {event.startDate.toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
            {" -- "}
            {event.endDate.toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </span>
        </div>
        <p className="text-xs font-medium text-zinc-400">{event.title}</p>
        <p className="text-base font-bold text-zinc-100 whitespace-pre-line leading-snug">
          {event.content}
        </p>
      </div>
    </Link>
  );
};

export default EventCard;
