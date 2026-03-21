"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function PaybackAnimations() {
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const ctx = gsap.context(() => {
      /* Hero entrance */
      const heroBadge = document.querySelector("[data-anim='hero-badge']");
      const heroTitle = document.querySelector("[data-anim='hero-title']");
      const heroSub = document.querySelector("[data-anim='hero-subtitle']");

      if (heroBadge) {
        gsap.fromTo(heroBadge, { y: 15, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, delay: 0.1, ease: "power2.out" });
      }
      if (heroTitle) {
        gsap.fromTo(heroTitle, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, delay: 0.2, ease: "power2.out" });
      }
      if (heroSub) {
        gsap.fromTo(heroSub, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, delay: 0.35, ease: "power2.out" });
      }

      /* Stats bar */
      const statsCards = document.querySelectorAll("[data-anim='stat-card']");
      if (statsCards.length > 0) {
        gsap.fromTo(statsCards, { y: 20, opacity: 0 }, {
          y: 0, opacity: 1, duration: 0.5, stagger: 0.08, delay: 0.5, ease: "power2.out",
        });
      }

      /* Exchange cards */
      const exchangeCards = document.querySelectorAll("[data-anim='exchange-card']");
      if (exchangeCards.length > 0) {
        gsap.fromTo(exchangeCards, { y: 40, opacity: 0 }, {
          y: 0, opacity: 1, duration: 0.6, stagger: 0.1, ease: "power2.out",
          scrollTrigger: { trigger: exchangeCards[0], start: "top 85%", once: true },
        });
      }

      /* Section headings */
      const sectionHeadings = document.querySelectorAll("[data-anim='section-heading']");
      sectionHeadings.forEach((heading) => {
        gsap.fromTo(heading, { y: 30, opacity: 0 }, {
          y: 0, opacity: 1, duration: 0.6, ease: "power2.out",
          scrollTrigger: { trigger: heading, start: "top 85%", once: true },
        });
      });

      /* Table rows */
      const tableRows = document.querySelectorAll("[data-anim='table-row']");
      if (tableRows.length > 0) {
        gsap.fromTo(tableRows, { y: 15, opacity: 0 }, {
          y: 0, opacity: 1, duration: 0.4, stagger: 0.04, ease: "power2.out",
          scrollTrigger: { trigger: tableRows[0], start: "top 85%", once: true },
        });
      }

      /* Counter animation */
      const counterEls = document.querySelectorAll("[data-anim='counter']");
      counterEls.forEach((el) => {
        const target = parseFloat(el.getAttribute("data-value") || "0");
        const suffix = el.getAttribute("data-suffix") || "";
        const prefix = el.getAttribute("data-prefix") || "";
        const decimals = parseInt(el.getAttribute("data-decimals") || "0", 10);
        const obj = { val: 0 };

        ScrollTrigger.create({
          trigger: el,
          start: "top 85%",
          onEnter: () => {
            gsap.to(obj, {
              val: target, duration: 1.2, ease: "power2.out",
              onUpdate: () => { el.textContent = prefix + obj.val.toFixed(decimals) + suffix; },
            });
          },
          once: true,
        });
      });

      /* CTA section */
      const ctaSection = document.querySelector("[data-anim='cta-section']");
      if (ctaSection) {
        const ctaChildren = ctaSection.querySelectorAll("[data-anim='cta-child']");
        gsap.fromTo(ctaChildren, { y: 30, opacity: 0 }, {
          y: 0, opacity: 1, duration: 0.6, stagger: 0.1, ease: "power2.out",
          scrollTrigger: { trigger: ctaSection, start: "top 80%", once: true },
        });
      }
    });

    return () => ctx.revert();
  }, []);

  return null;
}
