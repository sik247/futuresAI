"use client";

import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function WhalesAnimations() {
  useEffect(() => {
    // Section heading reveals
    gsap.utils.toArray<HTMLElement>("[data-whale-heading]").forEach((el) => {
      gsap.fromTo(
        el,
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: "power3.out",
          scrollTrigger: {
            trigger: el,
            start: "top 85%",
            toggleActions: "play none none none",
          },
        }
      );
    });

    // Staggered card entrances
    gsap.utils.toArray<HTMLElement>("[data-whale-grid]").forEach((grid) => {
      const cards = grid.querySelectorAll("[data-whale-card]");
      gsap.fromTo(
        cards,
        { opacity: 0, y: 60, scale: 0.96 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.6,
          stagger: 0.08,
          ease: "power3.out",
          scrollTrigger: {
            trigger: grid,
            start: "top 82%",
            toggleActions: "play none none none",
          },
        }
      );
    });

    // Counter animation for ETH balances
    gsap.utils.toArray<HTMLElement>("[data-eth-balance]").forEach((el) => {
      const target = parseFloat(el.getAttribute("data-eth-balance") || "0");
      const obj = { val: 0 };

      gsap.to(obj, {
        val: target,
        duration: 2,
        ease: "power2.out",
        scrollTrigger: {
          trigger: el,
          start: "top 85%",
          toggleActions: "play none none none",
        },
        onUpdate: () => {
          el.textContent = obj.val.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 4,
          });
        },
      });
    });

    // Counter animation for USD values
    gsap.utils.toArray<HTMLElement>("[data-usd-value]").forEach((el) => {
      const target = parseFloat(el.getAttribute("data-usd-value") || "0");
      const obj = { val: 0 };

      gsap.to(obj, {
        val: target,
        duration: 2.2,
        ease: "power2.out",
        scrollTrigger: {
          trigger: el,
          start: "top 85%",
          toggleActions: "play none none none",
        },
        onUpdate: () => {
          el.textContent = `$${obj.val.toLocaleString(undefined, {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          })}`;
        },
      });
    });

    // Counter animation for hero stat numbers
    gsap.utils.toArray<HTMLElement>("[data-counter]").forEach((el) => {
      const target = parseFloat(el.getAttribute("data-counter") || "0");
      const prefix = el.getAttribute("data-counter-prefix") || "";
      const suffix = el.getAttribute("data-counter-suffix") || "";
      const obj = { val: 0 };

      gsap.to(obj, {
        val: target,
        duration: 2,
        ease: "power2.out",
        delay: 0.5,
        onUpdate: () => {
          if (target >= 1000) {
            el.textContent = `${prefix}${obj.val.toLocaleString(undefined, {
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            })}${suffix}`;
          } else {
            el.textContent = `${prefix}${obj.val.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}${suffix}`;
          }
        },
      });
    });

    // Hero decorative line animation
    const heroLine = document.querySelector("[data-hero-line]");
    if (heroLine) {
      gsap.fromTo(
        heroLine,
        { scaleX: 0 },
        { scaleX: 1, duration: 1.2, ease: "power3.inOut", delay: 0.3 }
      );
    }

    // Activity feed entrance
    const feedEl = document.querySelector("[data-activity-feed]");
    if (feedEl) {
      gsap.fromTo(
        feedEl,
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: "power3.out",
          scrollTrigger: {
            trigger: feedEl,
            start: "top 85%",
            toggleActions: "play none none none",
          },
        }
      );
    }

    // LIVE pulse animation (continuous)
    gsap.utils.toArray<HTMLElement>("[data-live-pulse]").forEach((el) => {
      gsap.to(el, {
        scale: 1.3,
        opacity: 0.7,
        duration: 1,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
      });
    });

    // Copy to clipboard functionality
    function handleCopyClick(e: Event) {
      const target = (e.currentTarget as HTMLElement);
      const address = target.getAttribute("data-copy-address");
      if (!address) return;

      navigator.clipboard.writeText(address).then(() => {
        const originalText = target.textContent;
        target.textContent = "Copied!";
        target.classList.add("text-emerald-400");
        setTimeout(() => {
          target.textContent = originalText;
          target.classList.remove("text-emerald-400");
        }, 1500);
      });
    }

    const copyButtons = document.querySelectorAll("[data-copy-address]");
    copyButtons.forEach((btn) => {
      btn.addEventListener("click", handleCopyClick);
    });

    return () => {
      ScrollTrigger.getAll().forEach((t) => t.kill());
      copyButtons.forEach((btn) => {
        btn.removeEventListener("click", handleCopyClick);
      });
    };
  }, []);

  return null;
}
