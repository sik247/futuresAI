"use client";

import { useState, useMemo } from "react";

/* ─── Types ─────────────────────────────────────────────── */

type Market = {
  question: string;
  outcomePrices: number[];
  outcomes: string[];
  volume: number | string;
  groupItemTitle?: string;
  groupItemThreshold?: string;
};

type Event = {
  id: string;
  title: string;
  slug: string;
  image: string;
  volume: number | string;
  liquidity: number | string;
  endDate: string;
  startDate: string;
  volume24hr: number;
  markets: Market[];
};

type TimeCategory =
  | "all"
  | "5min"
  | "15min"
  | "1h"
  | "4h"
  | "daily"
  | "weekly"
  | "monthly"
  | "yearly"
  | "premarket"
  | "etf";

type TypeFilter = "all" | "updown" | "abovebelow" | "pricerange" | "hitprice";

/* ─── Helpers ───────────────────────────────────────────── */

function formatVol(vol: number | string) {
  const n = typeof vol === "string" ? parseFloat(vol) : vol;
  if (isNaN(n) || n === 0) return "";
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(0)}M Vol.`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K Vol.`;
  return `$${n.toFixed(0)} Vol.`;
}

function getTimeCategory(event: Event): TimeCategory {
  if (!event.endDate) return "yearly";
  const msLeft = new Date(event.endDate).getTime() - Date.now();
  const mins = msLeft / (1000 * 60);
  if (mins <= 5) return "5min";
  if (mins <= 15) return "15min";
  if (mins <= 60) return "1h";
  if (mins <= 240) return "4h";
  const days = mins / (60 * 24);
  if (days <= 1) return "daily";
  if (days <= 7) return "weekly";
  if (days <= 31) return "monthly";
  return "yearly";
}

function getEventType(event: Event): TypeFilter {
  const t = event.title.toLowerCase();
  if (t.includes("up or down") || t.includes("up/down")) return "updown";
  if (t.includes("above")) return "abovebelow";
  if (t.includes("price range") || t.includes("price on") || t.includes("price will")) return "pricerange";
  if (t.includes("hit")) return "hitprice";
  return "all";
}

function isEtfEvent(event: Event): boolean {
  const t = event.title.toLowerCase();
  return t.includes("etf");
}

function isPremarketEvent(event: Event): boolean {
  const t = event.title.toLowerCase();
  return (
    t.includes("fdv") ||
    t.includes("market cap") ||
    t.includes("after launch") ||
    t.includes("pre-market")
  );
}

const COINS: { name: string; patterns: string[]; color: string }[] = [
  { name: "Bitcoin", patterns: ["bitcoin", "btc"], color: "#f7931a" },
  { name: "Ethereum", patterns: ["ethereum", "eth"], color: "#627eea" },
  { name: "Solana", patterns: ["solana", "sol "], color: "#9945ff" },
  { name: "XRP", patterns: ["xrp"], color: "#23292f" },
  { name: "Dogecoin", patterns: ["dogecoin", "doge"], color: "#c3a634" },
  { name: "BNB", patterns: ["bnb"], color: "#f3ba2f" },
  { name: "Microstrategy", patterns: ["microstrategy", "mstr"], color: "#c23431" },
];

function getEventCoins(event: Event): string[] {
  const t = event.title.toLowerCase();
  return COINS.filter((c) => c.patterns.some((p) => t.includes(p))).map(
    (c) => c.name
  );
}

/* ─── Donut Chart (Polymarket circular %) ───────────────── */

function DonutChart({
  pct,
  label,
  size = 56,
  color = "#22c55e",
}: {
  pct: number;
  label: string;
  size?: number;
  color?: string;
}) {
  const r = (size - 6) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - pct / 100);
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={4} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={4}
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-500"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[13px] font-bold text-white leading-none">{pct}%</span>
        <span className="text-[9px] text-[#858d9a] leading-none mt-0.5">{label}</span>
      </div>
    </div>
  );
}

/* ─── Sidebar Icons ─────────────────────────────────────── */

const icons: Record<string, React.ReactNode> = {
  all: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="1" y="1" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.3" />
      <rect x="9.5" y="1" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.3" />
      <rect x="1" y="9.5" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.3" />
      <rect x="9.5" y="9.5" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  ),
  "5min": (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M3 8h4V3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 4l3 4-3 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  "15min": (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.3" strokeDasharray="3 2" />
      <path d="M8 5v3.5l2 1.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  ),
  "1h": (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M8 4.5V8.5L10.5 10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  ),
  "4h": (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M8 4v4l2 2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <circle cx="8" cy="8" r="1" fill="currentColor" />
    </svg>
  ),
  daily: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="2" y="3" width="12" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M2 6.5h12" stroke="currentColor" strokeWidth="1.3" />
      <path d="M5.5 1.5v3M10.5 1.5v3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  ),
  weekly: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M2 12l3-4 2.5 2L11 5l3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  monthly: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M2 13l2.5-3.5L7 11.5 10 6l4 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="13" cy="3.5" r="1.5" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  ),
  yearly: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="2" y="3" width="12" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M2 6.5h12" stroke="currentColor" strokeWidth="1.3" />
      <path d="M5.5 1.5v3M10.5 1.5v3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <rect x="4.5" y="8.5" width="2.5" height="2" rx="0.5" fill="currentColor" opacity="0.5" />
      <rect x="9" y="8.5" width="2.5" height="2" rx="0.5" fill="currentColor" opacity="0.5" />
    </svg>
  ),
  premarket: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="2" y="4" width="12" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M5 7.5h6M5 10h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  ),
  etf: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="2" y="3" width="12" height="10" rx="2" stroke="currentColor" strokeWidth="1.3" />
      <path d="M5 8h6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M8 6v4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  ),
};

/* ─── Main Component ────────────────────────────────────── */

export default function MarketsClient({
  events,
  lang,
}: {
  events: Event[];
  lang: string;
}) {
  const isKo = lang === "ko";
  const [timeCat, setTimeCat] = useState<TimeCategory>("all");
  const [typeFil, setTypeFil] = useState<TypeFilter>("all");
  const [coinFilter, setCoinFilter] = useState<string | null>(null);

  // Counts per time category
  const counts = useMemo(() => {
    const tc: Record<string, number> = {
      all: events.length,
      "5min": 0,
      "15min": 0,
      "1h": 0,
      "4h": 0,
      daily: 0,
      weekly: 0,
      monthly: 0,
      yearly: 0,
      premarket: 0,
      etf: 0,
    };
    const coins: Record<string, number> = {};
    for (const ev of events) {
      const cat = getTimeCategory(ev);
      tc[cat] = (tc[cat] || 0) + 1;
      if (isPremarketEvent(ev)) tc.premarket++;
      if (isEtfEvent(ev)) tc.etf++;
      for (const c of getEventCoins(ev)) coins[c] = (coins[c] || 0) + 1;
    }
    return { tc, coins };
  }, [events]);

  // Filtered events
  const filtered = useMemo(() => {
    let result = events;

    // Time category filter
    if (timeCat === "premarket") {
      result = result.filter(isPremarketEvent);
    } else if (timeCat === "etf") {
      result = result.filter(isEtfEvent);
    } else if (timeCat !== "all") {
      result = result.filter((e) => getTimeCategory(e) === timeCat);
    }

    // Type filter
    if (typeFil !== "all") {
      result = result.filter((e) => getEventType(e) === typeFil);
    }

    // Coin filter
    if (coinFilter) {
      result = result.filter((e) => getEventCoins(e).includes(coinFilter));
    }

    return result.sort(
      (a, b) =>
        parseFloat(String(b.volume || 0)) - parseFloat(String(a.volume || 0))
    );
  }, [events, timeCat, typeFil, coinFilter]);

  const coinEntries = useMemo(
    () => Object.entries(counts.coins).sort((a, b) => b[1] - a[1]),
    [counts.coins]
  );

  const sidebarItems: { key: TimeCategory; label: string }[] = [
    { key: "all", label: "All" },
    { key: "5min", label: "5 Min" },
    { key: "15min", label: "15 Min" },
    { key: "1h", label: "1 Hour" },
    { key: "4h", label: "4 Hours" },
    { key: "daily", label: "Daily" },
    { key: "weekly", label: "Weekly" },
    { key: "monthly", label: "Monthly" },
    { key: "yearly", label: "Yearly" },
    { key: "premarket", label: "Pre-Market" },
    { key: "etf", label: "ETF" },
  ];

  const typeFilters: { key: TypeFilter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "updown", label: "Up / Down" },
    { key: "abovebelow", label: "Above / Below" },
    { key: "pricerange", label: "Price Range" },
    { key: "hitprice", label: "Hit Price" },
  ];

  const resetFilters = () => {
    setCoinFilter(null);
    setTypeFil("all");
  };

  return (
    <div className="min-h-screen bg-[#0d0e14]">
      {/* ─── Top: Title + Type Tabs ───────────────────────── */}
      <div className="max-w-[1440px] mx-auto flex pt-24 sm:pt-[108px]">
        <div className="hidden lg:block w-[200px] shrink-0" />
        <div className="flex-1 px-4 sm:px-6 pb-4">
          <div className="flex items-center gap-4 flex-wrap">
            <h1 className="text-[22px] font-bold text-white tracking-tight">
              Crypto
            </h1>

            {/* Type filter pills */}
            <div className="flex items-center gap-1">
              {typeFilters.map((f) => {
                const active = typeFil === f.key;
                return (
                  <button
                    key={f.key}
                    onClick={() => {
                      setTypeFil(f.key);
                      setCoinFilter(null);
                    }}
                    className={`px-3 py-1 rounded-full text-[13px] font-medium transition-colors ${
                      active
                        ? "bg-[#2563eb] text-white"
                        : "text-[#858d9a] hover:text-white hover:bg-white/[0.06]"
                    }`}
                  >
                    {f.label}
                  </button>
                );
              })}
            </div>

            <div className="flex-1" />

            {/* Search + filter icons */}
            <div className="flex items-center gap-2">
              <button className="p-1.5 rounded-md text-[#858d9a] hover:text-white hover:bg-white/[0.06] transition-colors">
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="7" />
                  <path d="M21 21l-4.35-4.35" strokeLinecap="round" />
                </svg>
              </button>
              <button className="p-1.5 rounded-md text-[#858d9a] hover:text-white hover:bg-white/[0.06] transition-colors">
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Body: Sidebar + Grid ──────────────────────────── */}
      <div className="max-w-[1440px] mx-auto flex px-4 sm:px-6 pb-8">
        {/* Sidebar */}
        <aside className="hidden lg:block w-[200px] shrink-0 pr-6">
          <nav className="sticky top-[108px] space-y-0.5">
            {sidebarItems.map((item) => {
              const active = timeCat === item.key && !coinFilter;
              const count = counts.tc[item.key] || 0;
              return (
                <button
                  key={item.key}
                  onClick={() => {
                    setTimeCat(item.key);
                    resetFilters();
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-[7px] rounded-lg text-[13px] transition-colors ${
                    active
                      ? "bg-white/[0.07] text-white"
                      : "text-[#858d9a] hover:text-white hover:bg-white/[0.04]"
                  }`}
                >
                  <span className="w-4 flex justify-center opacity-70">
                    {icons[item.key]}
                  </span>
                  <span className="flex-1 text-left">{item.label}</span>
                  <span className="text-[12px] text-[#555c69] tabular-nums">
                    {count}
                  </span>
                </button>
              );
            })}

            {/* Divider */}
            <div className="!my-3 h-px bg-white/[0.06]" />

            {/* Coin filters */}
            {coinEntries.map(([coin, count]) => {
              const active = coinFilter === coin;
              const c = COINS.find((x) => x.name === coin);
              return (
                <button
                  key={coin}
                  onClick={() => {
                    setCoinFilter(active ? null : coin);
                    setTimeCat("all");
                    setTypeFil("all");
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-[7px] rounded-lg text-[13px] transition-colors ${
                    active
                      ? "bg-white/[0.07] text-white"
                      : "text-[#858d9a] hover:text-white hover:bg-white/[0.04]"
                  }`}
                >
                  <span
                    className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold text-white shrink-0"
                    style={{ backgroundColor: c?.color || "#555" }}
                  >
                    {coin.charAt(0)}
                  </span>
                  <span className="flex-1 text-left truncate">{coin}</span>
                  <span className="text-[12px] text-[#555c69] tabular-nums">
                    {count}
                  </span>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Mobile bottom filter bar */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-[#0d0e14]/95 backdrop-blur-md border-t border-white/[0.06] px-3 py-2.5 flex gap-2 overflow-x-auto no-scrollbar">
          {sidebarItems.slice(0, 8).map((item) => (
            <button
              key={item.key}
              onClick={() => {
                setTimeCat(item.key);
                resetFilters();
              }}
              className={`shrink-0 px-3 py-1.5 rounded-full text-[12px] font-medium transition-colors ${
                timeCat === item.key && !coinFilter
                  ? "bg-[#2563eb] text-white"
                  : "bg-white/[0.06] text-[#858d9a]"
              }`}
            >
              {item.label}
            </button>
          ))}
          {coinEntries.map(([coin, count]) => {
            const c = COINS.find((x) => x.name === coin);
            return (
              <button
                key={coin}
                onClick={() => {
                  setCoinFilter(coinFilter === coin ? null : coin);
                  setTimeCat("all");
                }}
                className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium transition-colors ${
                  coinFilter === coin
                    ? "bg-[#2563eb] text-white"
                    : "bg-white/[0.06] text-[#858d9a]"
                }`}
              >
                <span
                  className="w-3.5 h-3.5 rounded-full inline-block shrink-0"
                  style={{ backgroundColor: c?.color || "#555" }}
                />
                {coin}
              </button>
            );
          })}
        </div>

        {/* Grid */}
        <div className="flex-1 min-w-0">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 text-center">
              <svg className="w-12 h-12 text-[#2a2d3a] mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
              <p className="text-[#858d9a] text-sm">
                {isKo
                  ? "해당 필터에 맞는 마켓이 없습니다"
                  : "No markets match this filter"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 pb-24 lg:pb-0">
              {filtered.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Attribution footer */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 pb-10">
        <div className="h-px bg-white/[0.04] mb-4" />
        <p className="text-center text-[11px] text-[#3a3f4a]">
          {isKo
            ? "데이터 출처: Polymarket. 가격은 시장 확률을 반영합니다."
            : "Data from Polymarket. Prices reflect market probability."}
        </p>
      </div>
    </div>
  );
}

/* ─── Event Card ──────────────────────────────────────────── */

function EventCard({ event }: { event: Event }) {
  const vol = parseFloat(String(event.volume || 0));
  const volLabel = formatVol(vol);

  const isUpDown =
    event.title.toLowerCase().includes("up or down") ||
    event.title.toLowerCase().includes("up/down");

  // Binary event with single market (show donut)
  const isBinary =
    !isUpDown &&
    event.markets.length === 1 &&
    event.markets[0].outcomes?.length === 2;

  // Up/Down card
  if (isUpDown && event.markets.length >= 1) {
    const market = event.markets[0];
    const yesRaw = market.outcomePrices?.[0]
      ? parseFloat(String(market.outcomePrices[0]))
      : 0.5;
    const yesPct = Math.round(yesRaw * 100);
    const isUp = yesRaw > 0.5;

    return (
      <a
        href={`https://polymarket.com/event/${event.slug || event.id}`}
        target="_blank"
        rel="noopener noreferrer"
        className="block group"
      >
        <div className="rounded-xl bg-[#171923] border border-[#1e2030] p-4 flex flex-col h-full transition-all duration-150 hover:border-[#2e3050] hover:bg-[#1c1e2e]">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-start gap-3 min-w-0">
              {event.image && (
                <img
                  src={event.image}
                  alt=""
                  className="w-9 h-9 rounded-full object-cover shrink-0 mt-0.5"
                />
              )}
              <h3 className="text-[14px] font-semibold text-white leading-snug line-clamp-2">
                {event.title}
              </h3>
            </div>
            <DonutChart
              pct={yesPct}
              label={isUp ? "Up" : "Down"}
              color={isUp ? "#22c55e" : "#ef4444"}
            />
          </div>

          {/* Up / Down buttons */}
          <div className="flex gap-2 mt-auto">
            <button className="flex-1 py-2 rounded-lg text-[13px] font-semibold bg-[#132b1f] text-emerald-400 hover:bg-[#1a3d2a] transition-colors text-center">
              Up
            </button>
            <button className="flex-1 py-2 rounded-lg text-[13px] font-semibold bg-[#2d1219] text-rose-400 hover:bg-[#3d1a24] transition-colors text-center">
              Down
            </button>
          </div>

          <CardFooter volLabel={volLabel} hasGift={false} />
        </div>
      </a>
    );
  }

  // Binary single-outcome card with donut
  if (isBinary) {
    const market = event.markets[0];
    const yesRaw = market.outcomePrices?.[0]
      ? parseFloat(String(market.outcomePrices[0]))
      : 0.5;
    const yesPct = Math.round(yesRaw * 100);

    return (
      <a
        href={`https://polymarket.com/event/${event.slug || event.id}`}
        target="_blank"
        rel="noopener noreferrer"
        className="block group"
      >
        <div className="rounded-xl bg-[#171923] border border-[#1e2030] p-4 flex flex-col h-full transition-all duration-150 hover:border-[#2e3050] hover:bg-[#1c1e2e]">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-start gap-3 min-w-0">
              {event.image && (
                <img
                  src={event.image}
                  alt=""
                  className="w-9 h-9 rounded-full object-cover shrink-0 mt-0.5"
                />
              )}
              <h3 className="text-[14px] font-semibold text-white leading-snug line-clamp-2">
                {event.title}
              </h3>
            </div>
            <DonutChart pct={yesPct} label="chance" color="#22c55e" />
          </div>

          {/* Yes / No buttons */}
          <div className="flex gap-2 mt-auto">
            <button className="flex-1 py-2 rounded-lg text-[13px] font-semibold bg-[#132b1f] text-emerald-400 hover:bg-[#1a3d2a] transition-colors text-center">
              Yes
            </button>
            <button className="flex-1 py-2 rounded-lg text-[13px] font-semibold bg-[#2d1219] text-rose-400 hover:bg-[#3d1a24] transition-colors text-center">
              No
            </button>
          </div>

          <CardFooter volLabel={volLabel} hasGift={volLabel !== ""} />
        </div>
      </a>
    );
  }

  // Multi-outcome card (list rows)
  return (
    <a
      href={`https://polymarket.com/event/${event.slug || event.id}`}
      target="_blank"
      rel="noopener noreferrer"
      className="block group"
    >
      <div className="rounded-xl bg-[#171923] border border-[#1e2030] p-4 flex flex-col h-full transition-all duration-150 hover:border-[#2e3050] hover:bg-[#1c1e2e]">
        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          {event.image && (
            <img
              src={event.image}
              alt=""
              className="w-9 h-9 rounded-full object-cover shrink-0 mt-0.5"
            />
          )}
          <h3 className="text-[14px] font-semibold text-white leading-snug line-clamp-2">
            {event.title}
          </h3>
        </div>

        {/* Market outcome rows */}
        <div className="space-y-1 flex-1">
          {event.markets.slice(0, 3).map((market, i) => {
            const yesRaw = market.outcomePrices?.[0]
              ? parseFloat(String(market.outcomePrices[0]))
              : 0.5;
            const yesPct = Math.round(yesRaw * 100);

            let label = "";
            if (market.groupItemTitle) {
              label = market.groupItemTitle;
            } else if (event.markets.length > 1) {
              label = market.question || market.outcomes?.[0] || "Yes";
              if (label.length > 40) label = label.slice(0, 37) + "...";
            } else {
              label = market.outcomes?.[0] || "Yes";
            }

            // Detect directional arrows from label
            const hasArrow =
              label.startsWith("$") ||
              /^\d/.test(label) ||
              /^[<>]/.test(label);
            const isDown = market.question?.toLowerCase().includes("down") ||
              label.includes("\u2193") || label.startsWith("\u2193");

            return (
              <div key={i} className="flex items-center gap-2 py-1">
                {/* Direction arrow if price target */}
                {hasArrow && (
                  <span className={`text-[11px] ${isDown ? "text-rose-400" : "text-[#858d9a]"}`}>
                    {isDown ? "\u2193" : "\u2191"}
                  </span>
                )}
                <span className="text-[13px] text-[#c5cad3] flex-1 min-w-0 truncate">
                  {label}
                </span>
                <span className="text-[13px] font-bold text-white tabular-nums shrink-0 mr-1.5">
                  {yesPct}%
                </span>
                <span className="px-2 py-[3px] rounded text-[11px] font-semibold bg-[#132b1f] text-emerald-400 hover:bg-[#1a3d2a] transition-colors cursor-pointer">
                  Yes
                </span>
                <span className="px-2 py-[3px] rounded text-[11px] font-semibold bg-[#2d1219] text-rose-400 hover:bg-[#3d1a24] transition-colors cursor-pointer">
                  No
                </span>
              </div>
            );
          })}
        </div>

        <CardFooter volLabel={volLabel} hasGift={event.markets.length > 3} />
      </div>
    </a>
  );
}

/* ─── Card Footer ────────────────────────────────────────── */

function CardFooter({
  volLabel,
  hasGift,
}: {
  volLabel: string;
  hasGift: boolean;
}) {
  return (
    <div className="flex items-center gap-2.5 mt-3 pt-2.5 border-t border-white/[0.05]">
      {/* LIVE indicator */}
      <span className="flex items-center gap-1.5">
        <span className="relative flex h-[6px] w-[6px]">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-40" />
          <span className="relative inline-flex rounded-full h-[6px] w-[6px] bg-red-500" />
        </span>
        <span className="text-[11px] font-semibold text-red-400 tracking-wide">
          LIVE
        </span>
      </span>

      {volLabel && (
        <span className="text-[11px] text-[#555c69] tabular-nums">
          {volLabel}
        </span>
      )}

      <div className="flex-1" />

      {/* Gift icon */}
      {hasGift && (
        <svg
          className="w-[14px] h-[14px] text-[#3a3f4a] group-hover:text-[#555c69] transition-colors"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H4.5a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"
          />
        </svg>
      )}

      {/* Bookmark icon */}
      <svg
        className="w-[14px] h-[14px] text-[#3a3f4a] group-hover:text-[#555c69] transition-colors"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z"
        />
      </svg>
    </div>
  );
}
