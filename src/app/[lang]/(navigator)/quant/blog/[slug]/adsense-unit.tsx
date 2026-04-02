"use client";

import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    adsbygoogle: unknown[];
  }
}

export default function AdSenseUnit() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hasAd, setHasAd] = useState(false);

  useEffect(() => {
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // adsbygoogle not loaded
    }

    // Check if ad loaded after a delay — hide empty container
    const timer = setTimeout(() => {
      if (containerRef.current) {
        const ins = containerRef.current.querySelector("ins");
        if (ins && ins.getAttribute("data-ad-status") === "filled") {
          setHasAd(true);
        }
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      ref={containerRef}
      className={`w-full my-6 ${hasAd ? "" : "hidden"}`}
    >
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client="ca-pub-2718044648644151"
        data-ad-slot="auto"
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}
