"use client";

import { useState } from "react";

type WhaleTab = "tracker" | "figures";

export default function WhaleTabs({
  trackerContent,
  figuresContent,
  lang,
}: {
  trackerContent: React.ReactNode;
  figuresContent: React.ReactNode;
  lang: string;
}) {
  const isKo = lang === "ko";
  const [tab, setTab] = useState<WhaleTab>("tracker");

  const tabs: { key: WhaleTab; label: string; labelKo: string; icon: React.ReactNode }[] = [
    {
      key: "tracker",
      label: "Whale Tracker",
      labelKo: "고래 추적",
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 12V7H5a2 2 0 010-4h14v4" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M3 5v14a2 2 0 002 2h16v-5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M18 12a2 2 0 100 4 2 2 0 000-4z" />
        </svg>
      ),
    },
    {
      key: "figures",
      label: "Key Figures",
      labelKo: "주요 인물",
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
    },
  ];

  return (
    <div>
      <div className="flex items-center gap-2 mb-8">
        {tabs.map((t) => {
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-semibold transition-all ${
                active
                  ? "bg-white/[0.08] text-white border border-white/[0.12] shadow-lg shadow-black/20"
                  : "text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.04] border border-transparent"
              }`}
            >
              <span className={active ? "opacity-100" : "opacity-50"}>{t.icon}</span>
              {isKo ? t.labelKo : t.label}
            </button>
          );
        })}
      </div>

      {tab === "tracker" && trackerContent}
      {tab === "figures" && figuresContent}
    </div>
  );
}
