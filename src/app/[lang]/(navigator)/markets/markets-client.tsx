"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import type { MarketSignals, SignalItem } from "@/lib/services/signals/signals.service";
import MobileMarkets from "./mobile-markets";
import ControversialTakes from "./controversial-takes";

/* ═══════════════════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════════════════ */

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
  category: string;
  markets: Market[];
};

type ViewMode = "predictions" | "signals";
type CategoryFilter = "all" | "crypto" | "politics" | "business" | "korea";
type TimeCategory = "all" | "5min" | "15min" | "1h" | "4h" | "daily" | "weekly" | "monthly" | "yearly" | "premarket" | "etf";
type TypeFilter = "all" | "updown" | "abovebelow" | "pricerange" | "hitprice";
type SignalFilter = "all" | "bullish" | "bearish";

/* ═══════════════════════════════════════════════════════════
   Polymarket Helpers
   ═══════════════════════════════════════════════════════════ */

function formatVol(vol: number | string) {
  const n = typeof vol === "string" ? parseFloat(vol) : vol;
  if (isNaN(n) || n === 0) return "";
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(0)}M Vol.`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K Vol.`;
  return `$${n.toFixed(0)} Vol.`;
}

function getTimeCategory(event: Event): TimeCategory {
  if (!event.endDate) return "yearly";
  const mins = (new Date(event.endDate).getTime() - Date.now()) / (1000 * 60);
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

function isPremarketEvent(e: Event) {
  const t = e.title.toLowerCase();
  return t.includes("fdv") || t.includes("market cap") || t.includes("after launch") || t.includes("pre-market");
}

function isEtfEvent(e: Event) {
  return e.title.toLowerCase().includes("etf");
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
  return COINS.filter((c) => c.patterns.some((p) => t.includes(p))).map((c) => c.name);
}

const KOREA_ASIA_KEYWORDS = [
  "korea", "korean", "south korea", "north korea", "dprk",
  "kim jong", "samsung", "hyundai", "kpop", "k-pop",
  "asia", "asian", "japan", "japanese", "china", "chinese", "taiwan",
  "won", "krw", "kospi", "nikkei", "hang seng",
  "tariff", "trade war",
];

function isKoreaAsiaRelevant(event: Event): boolean {
  const text = `${event.title} ${event.markets.map((m) => m.question).join(" ")}`.toLowerCase();
  return KOREA_ASIA_KEYWORDS.some((kw) => text.includes(kw));
}

const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  politics: { bg: "bg-violet-500/15", text: "text-violet-400" },
  business: { bg: "bg-amber-500/15", text: "text-amber-400" },
};

/* ═══════════════════════════════════════════════════════════
   Korean Translation — pattern-based for Polymarket titles
   ═══════════════════════════════════════════════════════════ */

const COIN_KO: Record<string, string> = {
  Bitcoin: "비트코인", BTC: "BTC",
  Ethereum: "이더리움", ETH: "ETH",
  Solana: "솔라나", SOL: "SOL",
  XRP: "XRP", Dogecoin: "도지코인", DOGE: "도지",
  BNB: "BNB", MicroStrategy: "마이크로스트래티지", MSTR: "MSTR",
  "Bitcoin Cash": "비트코인캐시", Cardano: "카르다노", ADA: "ADA",
  Avalanche: "아발란체", AVAX: "AVAX", Polkadot: "폴카닷", DOT: "DOT",
  Chainlink: "체인링크", LINK: "LINK",
};

function localizeCoin(text: string): string {
  let result = text;
  for (const [en, ko] of Object.entries(COIN_KO)) {
    const regex = new RegExp(`\\b${en}\\b`, "gi");
    result = result.replace(regex, ko);
  }
  return result;
}

function translateToKo(title: string): string {
  const t = title.trim();
  const lower = t.toLowerCase();

  // "What price will X hit in YYYY?"
  const hitYearMatch = t.match(/What price will (\w+) hit in (\d{4})\??/i);
  if (hitYearMatch) return `${localizeCoin(hitYearMatch[1])}이(가) ${hitYearMatch[2]}년에 도달할 가격은?`;

  // "What price will X hit in Month?"
  const hitMonthMatch = t.match(/What price will (\w+) hit in (\w+)\??/i);
  if (hitMonthMatch) return `${localizeCoin(hitMonthMatch[1])}이(가) ${hitMonthMatch[2]}에 도달할 가격은?`;

  // "Will X hit $Y by DATE?"
  const willHitMatch = t.match(/Will (\w+) hit \$?([\d,]+[KkMm]?) by (.+?)\??$/i);
  if (willHitMatch) return `${localizeCoin(willHitMatch[1])}이(가) ${willHitMatch[3]}까지 $${willHitMatch[2]}에 도달할까?`;

  // "Will X reach $Y ..."
  const willReachMatch = t.match(/Will (\w+) reach \$?([\d,]+[KkMm]?)/i);
  if (willReachMatch) return `${localizeCoin(willReachMatch[1])}이(가) $${willReachMatch[2]}에 도달할까?`;

  // "X all time high by DATE?"
  const athMatch = t.match(/(\w+) all[- ]?time high by (.+?)\??$/i);
  if (athMatch) return `${localizeCoin(athMatch[1])} ${athMatch[2]}까지 역대 최고가 경신?`;

  // "Will X launch a token by DATE?"
  const launchMatch = t.match(/Will (.+?) launch a token by (.+?)\??$/i);
  if (launchMatch) return `${localizeCoin(launchMatch[1])}이(가) ${launchMatch[2]}까지 토큰 출시?`;

  // "X market cap (FDV) one day after launch?"
  const fdvMatch = t.match(/(.+?) market cap \(FDV\) one day after launch\??$/i);
  if (fdvMatch) return `${localizeCoin(fdvMatch[1])} 출시 1일 후 시가총액(FDV)은?`;

  // "X FDV above ___ one day after launch?"
  const fdvAboveMatch = t.match(/(.+?) FDV above (.+?) one day after launch\??$/i);
  if (fdvAboveMatch) return `${localizeCoin(fdvAboveMatch[1])} 출시 1일 후 FDV ${fdvAboveMatch[2]} 이상?`;

  // "X sells any Bitcoin by DATE?"
  const sellsMatch = t.match(/(.+?) sells any Bitcoin by (.+?)\??$/i);
  if (sellsMatch) return `${localizeCoin(sellsMatch[1])}이(가) ${sellsMatch[2]}까지 비트코인을 매도할까?`;

  // "Bitcoin Up or Down", "ETH Up or Down on DATE?"
  const upDownMatch = t.match(/(\w+) Up or Down( on (.+?))?\??$/i);
  if (upDownMatch) {
    const coinKo = localizeCoin(upDownMatch[1]);
    return upDownMatch[3] ? `${coinKo} ${upDownMatch[3]} 상승 또는 하락?` : `${coinKo} 상승 또는 하락?`;
  }

  // "Bitcoin above $X on DATE?"
  const aboveMatch = t.match(/(\w+) above \$?([\d,]+[KkMm]?)( on (.+?))?\??$/i);
  if (aboveMatch) {
    const coinKo = localizeCoin(aboveMatch[1]);
    return aboveMatch[4] ? `${coinKo} ${aboveMatch[4]} $${aboveMatch[2]} 이상?` : `${coinKo} $${aboveMatch[2]} 이상?`;
  }

  // "Bitcoin price on DATE?"
  const priceOnMatch = t.match(/(\w+) price on (.+?)\??$/i);
  if (priceOnMatch) return `${localizeCoin(priceOnMatch[1])} ${priceOnMatch[2]} 가격은?`;

  // "Bitcoin ETF approved by DATE?"
  const etfMatch = t.match(/(\w+) ETF (.+?) by (.+?)\??$/i);
  if (etfMatch) return `${localizeCoin(etfMatch[1])} ETF ${etfMatch[3]}까지 ${etfMatch[2]}?`;

  // ─── Political / News patterns ─────────────

  // "Democratic Presidential Nominee 2028"
  const nomineeMatch = t.match(/^(Democratic|Republican) Presidential Nominee (\d{4})\??$/i);
  if (nomineeMatch) {
    const party = nomineeMatch[1].toLowerCase() === "democratic" ? "민주당" : "공화당";
    return `${nomineeMatch[2]}년 ${party} 대선후보는?`;
  }

  // "Presidential Election Winner YYYY"
  const electionWinnerMatch = t.match(/Presidential Election Winner (\d{4})\??$/i);
  if (electionWinnerMatch) return `${electionWinnerMatch[1]}년 대통령 선거 승자는?`;

  // "X out by...?" / "X out by DATE?"
  const outByMatch = t.match(/(.+?) out by\.{0,3}\??\s*$/i);
  if (outByMatch && lower.includes("out by")) return `${outByMatch[1]} 퇴임할까?`;

  // "Next Prime Minister of X" / "Next President of X"
  const nextLeaderMatch = t.match(/Next (Prime Minister|President|Leader|Chancellor) of (.+?)\??$/i);
  if (nextLeaderMatch) {
    const role: Record<string, string> = { "prime minister": "총리", "president": "대통령", "leader": "지도자", "chancellor": "총리" };
    return `${nextLeaderMatch[2]}의 차기 ${role[nextLeaderMatch[1].toLowerCase()] || nextLeaderMatch[1]}는?`;
  }

  // "X leader end of YYYY?" / "X leader at end of YYYY?"
  const leaderEndMatch = t.match(/(.+?) leader (?:at )?end of (\d{4})\??$/i);
  if (leaderEndMatch) return `${leaderEndMatch[2]}년 말 ${leaderEndMatch[1]} 지도자는?`;

  // "Will X win Y?"
  const winMatch = t.match(/Will (.+?) win (.+?)\??$/i);
  if (winMatch) return `${winMatch[1]}이(가) ${winMatch[2]} 승리할까?`;

  // "Will X be Y by DATE?"
  const willBeMatch = t.match(/Will (.+?) be (.+?) by (.+?)\??$/i);
  if (willBeMatch) return `${willBeMatch[1]}이(가) ${willBeMatch[3]}까지 ${willBeMatch[2]}?`;

  // "Will X happen by DATE?"
  const willHappenMatch = t.match(/Will (.+?) by (.+?)\??$/i);
  if (willHappenMatch) return `${willHappenMatch[2]}까지 ${willHappenMatch[1]}?`;

  // "X approval rating above/below Y%?"
  const approvalMatch = t.match(/(.+?) approval rating (above|below) (\d+%?)/i);
  if (approvalMatch) {
    const dir = approvalMatch[2].toLowerCase() === "above" ? "이상" : "이하";
    return `${approvalMatch[1]} 지지율 ${approvalMatch[3]}% ${dir}?`;
  }

  // "Will X resign?"
  const resignMatch = t.match(/Will (.+?) resign\??$/i);
  if (resignMatch) return `${resignMatch[1]} 사임할까?`;

  // "Will X be impeached?"
  const impeachMatch = t.match(/Will (.+?) be impeached\??$/i);
  if (impeachMatch) return `${impeachMatch[1]} 탄핵될까?`;

  // Fallback — translate coin names but leave structure
  if (/what price will|will .+ hit|will .+ reach|above \$|below \$|market cap|FDV/i.test(t)) {
    return localizeCoin(t);
  }

  // Default — return original with coin localization
  return localizeCoin(t);
}

function translateLabel(label: string): string {
  const map: Record<string, string> = {
    "Yes": "예", "No": "아니오",
    "Up": "상승", "Down": "하락",
    "chance": "확률",
    "Other": "기타",
  };
  return map[label] || label;
}

/* ═══════════════════════════════════════════════════════════
   Signal Helpers
   ═══════════════════════════════════════════════════════════ */

const COIN_ICONS: Record<string, { emoji: string; gradient: string }> = {
  BTC: { emoji: "\u20BF", gradient: "from-orange-500 to-amber-500" },
  ETH: { emoji: "\u039E", gradient: "from-blue-400 to-indigo-500" },
  SOL: { emoji: "\u25CE", gradient: "from-purple-500 to-fuchsia-500" },
  XRP: { emoji: "\u2715", gradient: "from-zinc-300 to-zinc-500" },
  BNB: { emoji: "B", gradient: "from-yellow-500 to-amber-500" },
  DOGE: { emoji: "D", gradient: "from-amber-400 to-yellow-500" },
  ADA: { emoji: "A", gradient: "from-blue-500 to-cyan-500" },
  AVAX: { emoji: "A", gradient: "from-red-500 to-rose-500" },
  DOT: { emoji: "D", gradient: "from-pink-500 to-rose-500" },
  LINK: { emoji: "L", gradient: "from-blue-400 to-blue-600" },
};

const SIGNAL_COLORS: Record<string, { bg: string; glow: string }> = {
  "Strong Buy": { bg: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30", glow: "shadow-[0_0_12px_rgba(16,185,129,0.3)]" },
  Buy: { bg: "bg-green-500/20 text-green-400 border-green-500/30", glow: "shadow-[0_0_10px_rgba(34,197,94,0.2)]" },
  Neutral: { bg: "bg-zinc-500/20 text-zinc-300 border-zinc-500/30", glow: "" },
  Sell: { bg: "bg-amber-500/20 text-amber-400 border-amber-500/30", glow: "shadow-[0_0_10px_rgba(245,158,11,0.2)]" },
  "Strong Sell": { bg: "bg-red-500/20 text-red-400 border-red-500/30", glow: "shadow-[0_0_12px_rgba(239,68,68,0.3)]" },
};

function confidenceColor(v: number) {
  if (v >= 75) return "from-emerald-500 to-emerald-400";
  if (v >= 50) return "from-green-500 to-green-400";
  if (v >= 35) return "from-amber-500 to-amber-400";
  return "from-red-500 to-red-400";
}

function fearGreedColor(v: number) {
  if (v <= 25) return "from-red-500 to-red-400";
  if (v <= 45) return "from-orange-500 to-orange-400";
  if (v <= 55) return "from-yellow-500 to-yellow-400";
  if (v <= 75) return "from-lime-500 to-lime-400";
  return "from-emerald-500 to-emerald-400";
}

function Sparkline({ data }: { data?: number[] }) {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const w = 56, h = 18;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`).join(" ");
  const color = data[data.length - 1] >= data[0] ? "#22c55e" : "#ef4444";
  return (
    <svg width={w} height={h}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════
   Shared: Donut Chart
   ═══════════════════════════════════════════════════════════ */

function DonutChart({ pct, label, size = 56, color = "#22c55e" }: { pct: number; label: string; size?: number; color?: string }) {
  const r = (size - 6) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - pct / 100);
  return (
    <div className="relative flex items-center justify-center cursor-default" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={4} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={4} strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" className="transition-all duration-500" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[13px] font-bold text-white leading-none">{pct}%</span>
        <span className="text-[9px] text-[#858d9a] leading-none mt-0.5">{label}</span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Sidebar Icons
   ═══════════════════════════════════════════════════════════ */

const sideIcons: Record<string, React.ReactNode> = {
  all: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1" y="1" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.3"/><rect x="9.5" y="1" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.3"/><rect x="1" y="9.5" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.3"/><rect x="9.5" y="9.5" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.3"/></svg>,
  "5min": <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h4V3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/><path d="M10 4l3 4-3 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  "15min": <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.3" strokeDasharray="3 2"/><path d="M8 5v3.5l2 1.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
  "1h": <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.3"/><path d="M8 4.5V8.5L10.5 10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
  "4h": <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.3"/><path d="M8 4v4l2 2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><circle cx="8" cy="8" r="1" fill="currentColor"/></svg>,
  daily: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="2" y="3" width="12" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><path d="M2 6.5h12" stroke="currentColor" strokeWidth="1.3"/><path d="M5.5 1.5v3M10.5 1.5v3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
  weekly: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 12l3-4 2.5 2L11 5l3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  monthly: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 13l2.5-3.5L7 11.5 10 6l4 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/><circle cx="13" cy="3.5" r="1.5" stroke="currentColor" strokeWidth="1.2"/></svg>,
  yearly: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="2" y="3" width="12" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><path d="M2 6.5h12" stroke="currentColor" strokeWidth="1.3"/><path d="M5.5 1.5v3M10.5 1.5v3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><rect x="4.5" y="8.5" width="2.5" height="2" rx="0.5" fill="currentColor" opacity="0.5"/><rect x="9" y="8.5" width="2.5" height="2" rx="0.5" fill="currentColor" opacity="0.5"/></svg>,
  premarket: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="2" y="4" width="12" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><path d="M5 7.5h6M5 10h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>,
  etf: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="2" y="3" width="12" height="10" rx="2" stroke="currentColor" strokeWidth="1.3"/><path d="M5 8h6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><path d="M8 6v4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
};

/* ═══════════════════════════════════════════════════════════
   Main Component
   ═══════════════════════════════════════════════════════════ */

export default function MarketsClient({
  events,
  signals: initialSignals,
  lang,
}: {
  events: Event[];
  signals: MarketSignals;
  lang: string;
}) {
  const isKo = lang === "ko";

  // View toggle
  const [view, setView] = useState<ViewMode>(events.length > 0 ? "predictions" : "signals");

  // ─── Prediction state ──────────────────────
  const [categoryCat, setCategoryCat] = useState<CategoryFilter>("all");
  const [timeCat, setTimeCat] = useState<TimeCategory>("all");
  const [typeFil, setTypeFil] = useState<TypeFilter>("all");
  const [coinFilter, setCoinFilter] = useState<string | null>(null);

  // ─── Signals state ─────────────────────────
  const [sigData, setSigData] = useState<MarketSignals>(initialSignals);
  const [sigLoading, setSigLoading] = useState(initialSignals.signals.length === 0);
  const [sigFilter, setSigFilter] = useState<SignalFilter>("all");
  const [expanded, setExpanded] = useState<string | null>(null);

  // Auto-fetch signals if empty
  const refreshSignals = useCallback(async () => {
    setSigLoading(true);
    try {
      const res = await fetch("/api/signals", { cache: "no-store" });
      if (res.ok) setSigData(await res.json());
    } finally {
      setSigLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialSignals.signals.length === 0) refreshSignals();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Retry if signals empty
  useEffect(() => {
    if (sigData.signals.length === 0 && !sigLoading && view === "signals") {
      const t = setTimeout(refreshSignals, 3000);
      return () => clearTimeout(t);
    }
  }, [sigData.signals.length, sigLoading, view, refreshSignals]);

  // ─── Prediction filters ────────────────────
  const categoryEvents = useMemo(() => {
    if (categoryCat === "korea") return events.filter(isKoreaAsiaRelevant);
    if (categoryCat !== "all") return events.filter((e) => e.category === categoryCat);
    return events;
  }, [events, categoryCat]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: events.length, crypto: 0, politics: 0, business: 0, korea: 0 };
    for (const ev of events) {
      counts[ev.category] = (counts[ev.category] || 0) + 1;
      if (isKoreaAsiaRelevant(ev)) counts.korea++;
    }
    return counts;
  }, [events]);

  const predCounts = useMemo(() => {
    const tc: Record<string, number> = { all: categoryEvents.length, "5min": 0, "15min": 0, "1h": 0, "4h": 0, daily: 0, weekly: 0, monthly: 0, yearly: 0, premarket: 0, etf: 0 };
    const coins: Record<string, number> = {};
    for (const ev of categoryEvents) {
      tc[getTimeCategory(ev)]++;
      if (isPremarketEvent(ev)) tc.premarket++;
      if (isEtfEvent(ev)) tc.etf++;
      for (const c of getEventCoins(ev)) coins[c] = (coins[c] || 0) + 1;
    }
    return { tc, coins };
  }, [categoryEvents]);

  const showCryptoFilters = categoryCat === "all" || categoryCat === "crypto";

  const filteredEvents = useMemo(() => {
    let result = categoryEvents;
    if (timeCat === "premarket") result = result.filter(isPremarketEvent);
    else if (timeCat === "etf") result = result.filter(isEtfEvent);
    else if (timeCat !== "all") result = result.filter((e) => getTimeCategory(e) === timeCat);
    if (showCryptoFilters && typeFil !== "all") result = result.filter((e) => getEventType(e) === typeFil);
    if (coinFilter) result = result.filter((e) => getEventCoins(e).includes(coinFilter));
    return result.sort((a, b) => parseFloat(String(b.volume || 0)) - parseFloat(String(a.volume || 0)));
  }, [categoryEvents, timeCat, typeFil, coinFilter, showCryptoFilters]);

  const coinEntries = useMemo(() => Object.entries(predCounts.coins).sort((a, b) => b[1] - a[1]), [predCounts.coins]);

  // ─── Signal filters ────────────────────────
  const filteredSignals = useMemo(() => {
    if (sigFilter === "bullish") return sigData.signals.filter((s) => s.signal === "Strong Buy" || s.signal === "Buy");
    if (sigFilter === "bearish") return sigData.signals.filter((s) => s.signal === "Strong Sell" || s.signal === "Sell");
    return sigData.signals;
  }, [sigData.signals, sigFilter]);

  const bullCount = sigData.signals.filter((s) => s.signal === "Strong Buy" || s.signal === "Buy").length;
  const bearCount = sigData.signals.filter((s) => s.signal === "Strong Sell" || s.signal === "Sell").length;
  const neutralCount = sigData.signals.filter((s) => s.signal === "Neutral").length;

  const sidebarItems: { key: TimeCategory; label: string }[] = isKo ? [
    { key: "all", label: "전체" }, { key: "5min", label: "5분" }, { key: "15min", label: "15분" },
    { key: "1h", label: "1시간" }, { key: "4h", label: "4시간" }, { key: "daily", label: "일간" },
    { key: "weekly", label: "주간" }, { key: "monthly", label: "월간" }, { key: "yearly", label: "연간" },
    { key: "premarket", label: "프리마켓" }, { key: "etf", label: "ETF" },
  ] : [
    { key: "all", label: "All" }, { key: "5min", label: "5 Min" }, { key: "15min", label: "15 Min" },
    { key: "1h", label: "1 Hour" }, { key: "4h", label: "4 Hours" }, { key: "daily", label: "Daily" },
    { key: "weekly", label: "Weekly" }, { key: "monthly", label: "Monthly" }, { key: "yearly", label: "Yearly" },
    { key: "premarket", label: "Pre-Market" }, { key: "etf", label: "ETF" },
  ];

  const categoryFilters: { key: CategoryFilter; label: string }[] = isKo ? [
    { key: "all", label: "전체" }, { key: "crypto", label: "크립토" },
    { key: "politics", label: "정치" }, { key: "business", label: "경제" },
    { key: "korea", label: "한국/아시아" },
  ] : [
    { key: "all", label: "All" }, { key: "crypto", label: "Crypto" },
    { key: "politics", label: "Politics" }, { key: "business", label: "Business" },
    { key: "korea", label: "Korea/Asia" },
  ];

  const typeFilters: { key: TypeFilter; label: string }[] = isKo ? [
    { key: "all", label: "전체" }, { key: "updown", label: "상승 / 하락" },
    { key: "abovebelow", label: "이상 / 이하" }, { key: "pricerange", label: "가격 범위" },
    { key: "hitprice", label: "목표가 도달" },
  ] : [
    { key: "all", label: "All" }, { key: "updown", label: "Up / Down" },
    { key: "abovebelow", label: "Above / Below" }, { key: "pricerange", label: "Price Range" },
    { key: "hitprice", label: "Hit Price" },
  ];

  return (
    <div className="min-h-screen bg-[#0d0e14]">
      {/* ═══ View Toggle Bar ═══════════════════════════════ */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 pt-24 sm:pt-[108px] pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setView("predictions")}
            className={`px-4 py-2 rounded-lg text-[13px] font-semibold transition-all cursor-pointer ${
              view === "predictions"
                ? "bg-[#2563eb] text-white shadow-lg shadow-blue-500/20"
                : "bg-white/[0.05] text-[#858d9a] hover:text-white hover:bg-white/[0.08]"
            }`}
          >
            <span className="flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2" strokeLinecap="round"/></svg>
              {isKo ? "예측시장" : "Predictions"}
            </span>
          </button>
          <button
            onClick={() => setView("signals")}
            className={`px-4 py-2 rounded-lg text-[13px] font-semibold transition-all cursor-pointer ${
              view === "signals"
                ? "bg-[#2563eb] text-white shadow-lg shadow-blue-500/20"
                : "bg-white/[0.05] text-[#858d9a] hover:text-white hover:bg-white/[0.08]"
            }`}
          >
            <span className="flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3" strokeLinecap="round" strokeLinejoin="round"/></svg>
              {isKo ? "퀀트 시그널" : "Quant Signals"}
            </span>
          </button>
        </div>
      </div>

      {/* ═══ PREDICTIONS VIEW ══════════════════════════════ */}
      {view === "predictions" && (
        <>
          {/* Featured top section — Hero + Movers + Controversial Takes (all viewports) */}
          {events.length > 0 && (
            <div className="max-w-[1440px] mx-auto px-4 sm:px-6 pb-3 lg:pb-4 space-y-3 lg:space-y-4">
              {/* Hero: top-volume event */}
              <HeroMarket
                event={[...events].sort((a, b) => parseFloat(String(b.volume || 0)) - parseFloat(String(a.volume || 0)))[0]}
                isKo={isKo}
              />

              {/* Two-column layout on desktop: Movers + Controversial Takes side-by-side */}
              <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-3 lg:gap-4">
                <MoversRail
                  events={[...events]
                    .sort((a, b) => (b.volume24hr || 0) - (a.volume24hr || 0))
                    .slice(0, 6)}
                  isKo={isKo}
                />
                <ControversialTakes
                  category={categoryCat === "korea" ? "korea" : (categoryCat as "all" | "crypto" | "politics" | "business")}
                  lang={lang}
                />
              </div>
            </div>
          )}

          {/* Mobile verdict-led feed (<1024px) */}
          <MobileMarkets events={events} lang={lang} />

          {/* Desktop layout (≥1024px) — unchanged */}
          <div className="hidden lg:block">
          {/* Category Tabs + Type Tabs */}
          <div className="max-w-[1440px] mx-auto flex">
            <div className="hidden lg:block w-[200px] shrink-0" />
            <div className="flex-1 px-4 sm:px-6 pb-4 space-y-3">
              {/* Category row */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {categoryFilters.map((f) => (
                  <button key={f.key} onClick={() => { setCategoryCat(f.key); setCoinFilter(null); setTypeFil("all"); setTimeCat("all"); }}
                    className={`px-3.5 py-1.5 rounded-lg text-[13px] font-semibold transition-all cursor-pointer ${categoryCat === f.key ? "bg-[#2563eb] text-white shadow-lg shadow-blue-500/20" : "bg-white/[0.05] text-[#858d9a] hover:text-white hover:bg-white/[0.08]"}`}>
                    {f.label}
                    <span className="ml-1.5 text-[11px] opacity-60">{categoryCounts[f.key] || 0}</span>
                  </button>
                ))}
              </div>
              {/* Type filter row (crypto-specific) */}
              {showCryptoFilters && (
                <div className="flex items-center gap-1">
                  {typeFilters.map((f) => (
                    <button key={f.key} onClick={() => { setTypeFil(f.key); setCoinFilter(null); }}
                      className={`px-3 py-1 rounded-full text-[13px] font-medium transition-colors cursor-pointer ${typeFil === f.key ? "bg-white/[0.10] text-white" : "text-[#555c69] hover:text-white hover:bg-white/[0.06]"}`}>{f.label}</button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Body: Sidebar + Grid */}
          <div className="max-w-[1440px] mx-auto flex px-4 sm:px-6 pb-8">
            {/* Sidebar */}
            <aside className="hidden lg:block w-[200px] shrink-0 pr-6">
              <nav className="sticky top-[108px] space-y-0.5">
                {sidebarItems.map((item) => {
                  const active = timeCat === item.key && !coinFilter;
                  return (
                    <button key={item.key} onClick={() => { setTimeCat(item.key); setCoinFilter(null); setTypeFil("all"); }}
                      className={`w-full flex items-center gap-2.5 px-3 py-[7px] rounded-lg text-[13px] transition-colors cursor-pointer ${active ? "bg-white/[0.07] text-white" : "text-[#858d9a] hover:text-white hover:bg-white/[0.04]"}`}>
                      <span className="w-4 flex justify-center opacity-70">{sideIcons[item.key]}</span>
                      <span className="flex-1 text-left">{item.label}</span>
                      <span className="text-[12px] text-[#555c69] tabular-nums">{predCounts.tc[item.key] || 0}</span>
                    </button>
                  );
                })}
                {showCryptoFilters && coinEntries.length > 0 && <>
                <div className="!my-3 h-px bg-white/[0.06]" />
                {coinEntries.map(([coin, count]) => {
                  const c = COINS.find((x) => x.name === coin);
                  return (
                    <button key={coin} onClick={() => { setCoinFilter(coinFilter === coin ? null : coin); setTimeCat("all"); setTypeFil("all"); }}
                      className={`w-full flex items-center gap-2.5 px-3 py-[7px] rounded-lg text-[13px] transition-colors cursor-pointer ${coinFilter === coin ? "bg-white/[0.07] text-white" : "text-[#858d9a] hover:text-white hover:bg-white/[0.04]"}`}>
                      <span className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold text-white shrink-0" style={{ backgroundColor: c?.color || "#555" }}>{coin.charAt(0)}</span>
                      <span className="flex-1 text-left truncate">{coin}</span>
                      <span className="text-[12px] text-[#555c69] tabular-nums">{count}</span>
                    </button>
                  );
                })}
                </>}
              </nav>
            </aside>

            {/* Mobile bottom filter */}
            <div className="lg:hidden fixed bottom-[56px] left-0 right-0 z-30 bg-[#0d0e14]/95 backdrop-blur-md border-t border-white/[0.06] px-3 py-2.5 flex gap-2 overflow-x-auto no-scrollbar">
              {categoryFilters.map((f) => (
                <button key={f.key} onClick={() => { setCategoryCat(f.key); setCoinFilter(null); setTypeFil("all"); setTimeCat("all"); }}
                  className={`shrink-0 px-3 py-1.5 rounded-full text-[12px] font-semibold transition-colors cursor-pointer ${categoryCat === f.key ? "bg-[#2563eb] text-white" : "bg-white/[0.08] text-[#858d9a]"}`}>{f.label}</button>
              ))}
              <span className="shrink-0 w-px h-5 bg-white/[0.08] self-center" />
              {sidebarItems.slice(0, 6).map((item) => (
                <button key={item.key} onClick={() => { setTimeCat(item.key); setCoinFilter(null); setTypeFil("all"); }}
                  className={`shrink-0 px-3 py-1.5 rounded-full text-[12px] font-medium transition-colors cursor-pointer ${timeCat === item.key && !coinFilter ? "bg-white/[0.10] text-white" : "bg-white/[0.06] text-[#858d9a]"}`}>{item.label}</button>
              ))}
              {showCryptoFilters && coinEntries.map(([coin]) => {
                const c = COINS.find((x) => x.name === coin);
                return (
                  <button key={coin} onClick={() => { setCoinFilter(coinFilter === coin ? null : coin); setTimeCat("all"); }}
                    className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium transition-colors cursor-pointer ${coinFilter === coin ? "bg-[#2563eb] text-white" : "bg-white/[0.06] text-[#858d9a]"}`}>
                    <span className="w-3.5 h-3.5 rounded-full inline-block shrink-0" style={{ backgroundColor: c?.color || "#555" }} />
                    {coin}
                  </button>
                );
              })}
            </div>

            {/* Grid */}
            <div className="flex-1 min-w-0">
              {filteredEvents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-32 text-center">
                  <svg className="w-12 h-12 text-[#2a2d3a] mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"/></svg>
                  <p className="text-[#858d9a] text-sm">{categoryCat === "korea" ? (isKo ? "현재 한국/아시아 관련 예측이 없습니다" : "No Korea/Asia predictions currently available") : (isKo ? "해당 필터에 맞는 마켓이 없습니다" : "No markets match this filter")}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 pb-32 lg:pb-0">
                  {filteredEvents.map((event) => <EventCard key={event.id} event={event} isKo={isKo} />)}
                </div>
              )}
            </div>
          </div>

          <div className="max-w-[1440px] mx-auto px-4 sm:px-6 pb-10">
            <div className="h-px bg-white/[0.04] mb-4" />
            <p className="text-center text-[11px] text-[#3a3f4a]">{isKo ? "데이터 출처: Polymarket. 가격은 시장 확률을 반영합니다." : "Data from Polymarket. Prices reflect market probability."}</p>
          </div>
          </div>
        </>
      )}

      {/* ═══ SIGNALS VIEW ══════════════════════════════════ */}
      {view === "signals" && (
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 pb-10">
          {/* Header */}
          <div className="flex items-center justify-between flex-wrap gap-3 pb-3">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                {isKo ? "퀀트 시그널" : "Quant Signals"}
              </h1>
              <p className="text-xs text-zinc-500 mt-0.5 font-mono">
                {isKo ? "RSI, MACD, 방향, 신뢰도 - 실시간 분석" : "RSI, MACD, Direction, Confidence - Live Analysis"}
              </p>
            </div>
            <button onClick={refreshSignals} disabled={sigLoading}
              className="px-3 py-1.5 rounded-lg bg-white/[0.06] text-xs font-medium text-zinc-300 hover:bg-white/[0.10] transition-colors disabled:opacity-40">
              {sigLoading ? "..." : (isKo ? "새로고침" : "Refresh")}
            </button>
          </div>

          {/* Market Regime Bar */}
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] overflow-hidden mb-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-white/[0.04]">
              <div className="p-4">
                <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider mb-1.5">{isKo ? "공포 & 탐욕" : "Fear & Greed"}</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-mono font-bold text-white">{sigData.fearGreed.value}</span>
                  <span className={`text-[11px] font-mono font-semibold ${sigData.fearGreed.value <= 25 ? "text-red-400" : sigData.fearGreed.value <= 45 ? "text-orange-400" : sigData.fearGreed.value <= 55 ? "text-yellow-400" : sigData.fearGreed.value <= 75 ? "text-lime-400" : "text-emerald-400"}`}>{sigData.fearGreed.classification}</span>
                </div>
                <div className="h-1 rounded-full bg-white/[0.06] mt-1.5 overflow-hidden">
                  <div className={`h-full rounded-full bg-gradient-to-r ${fearGreedColor(sigData.fearGreed.value)} transition-all duration-700`} style={{ width: `${sigData.fearGreed.value}%` }} />
                </div>
              </div>
              <div className="p-4">
                <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider mb-1.5">{isKo ? "BTC 추세" : "BTC Trend"}</p>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${sigData.btcTrend === "above_sma" ? "bg-emerald-500" : "bg-red-500"}`} />
                  <span className={`text-sm font-mono font-bold ${sigData.btcTrend === "above_sma" ? "text-emerald-400" : "text-red-400"}`}>{sigData.btcTrend === "above_sma" ? (isKo ? "SMA 상회" : "Above SMA") : (isKo ? "SMA 하회" : "Below SMA")}</span>
                </div>
                <p className="text-[10px] text-zinc-600 font-mono mt-1">7-Day SMA</p>
              </div>
              <div className="p-4">
                <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider mb-1.5">{isKo ? "시그널 비율" : "Signal Ratio"}</p>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-emerald-400 text-sm font-mono font-bold">{bullCount}</span>
                  <span className="text-zinc-600 text-xs font-mono">/</span>
                  <span className="text-zinc-400 text-sm font-mono font-bold">{neutralCount}</span>
                  <span className="text-zinc-600 text-xs font-mono">/</span>
                  <span className="text-red-400 text-sm font-mono font-bold">{bearCount}</span>
                </div>
                <p className="text-[10px] text-zinc-600 font-mono mt-1">{isKo ? "매수 / 중립 / 매도" : "Buy / Neutral / Sell"}</p>
              </div>
              <div className="p-4">
                <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider mb-1.5">BTC/USDT</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-mono font-bold text-white">${sigData.signals[0]?.price?.toLocaleString(undefined, { maximumFractionDigits: 0 }) || "—"}</span>
                  {sigData.signals[0] && <span className={`text-[11px] font-mono font-semibold ${sigData.signals[0].change24h >= 0 ? "text-emerald-400" : "text-red-400"}`}>{sigData.signals[0].change24h >= 0 ? "+" : ""}{sigData.signals[0].change24h.toFixed(2)}%</span>}
                </div>
              </div>
            </div>
          </div>

          {/* Signal Filter Tabs */}
          <div className="flex items-center gap-2 pb-3">
            {([
              { key: "all" as SignalFilter, label: isKo ? "전체" : "All", count: sigData.signals.length },
              { key: "bullish" as SignalFilter, label: isKo ? "매수" : "Bullish", count: bullCount },
              { key: "bearish" as SignalFilter, label: isKo ? "매도" : "Bearish", count: bearCount },
            ]).map((f) => (
              <button key={f.key} onClick={() => setSigFilter(f.key)}
                className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors cursor-pointer ${sigFilter === f.key ? "bg-blue-600/20 text-blue-400 border border-blue-500/30" : "bg-white/[0.04] text-zinc-500 border border-transparent hover:text-zinc-300"}`}>
                {f.label} <span className="text-[10px] ml-0.5 opacity-60">{f.count}</span>
              </button>
            ))}
          </div>

          {/* Signals Table */}
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
            {/* Desktop Header */}
            <div className="hidden lg:grid gap-0 px-5 py-2.5 border-b border-white/[0.06] text-[9px] font-mono text-zinc-600 uppercase tracking-[0.15em]"
              style={{ gridTemplateColumns: "2fr 1.4fr 0.9fr 0.8fr 1.2fr 1.2fr 1fr 1.2fr 1.2fr" }}>
              <div>{isKo ? "자산" : "Asset"}</div>
              <div className="text-right">{isKo ? "가격" : "Price"}</div>
              <div className="text-right">24h</div>
              <div className="text-center">{isKo ? "추세" : "Trend"}</div>
              <div className="text-center">RSI</div>
              <div className="text-center">MACD</div>
              <div className="text-center">{isKo ? "방향" : "Dir"}</div>
              <div className="text-center">{isKo ? "시그널" : "Signal"}</div>
              <div className="text-right">{isKo ? "신뢰도" : "Conf"}</div>
            </div>

            {/* Loading */}
            {sigData.signals.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 gap-4">
                <div className="relative w-14 h-14">
                  <div className="absolute inset-0 rounded-full border-2 border-blue-500/20 animate-ping" />
                  <div className="absolute inset-1 rounded-full border-2 border-t-blue-500 border-r-blue-500/30 border-b-transparent border-l-transparent animate-spin" />
                </div>
                <p className="text-sm font-medium text-zinc-300">{isKo ? "시장 분석 중..." : "Analyzing Markets..."}</p>
                <button onClick={refreshSignals} disabled={sigLoading}
                  className="mt-1 px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-500 transition-colors disabled:opacity-50">
                  {sigLoading ? "..." : (isKo ? "다시 시도" : "Retry")}
                </button>
              </div>
            )}

            {/* Rows */}
            {filteredSignals.map((s) => <SignalRow key={s.symbol} s={s} isKo={isKo} expanded={expanded} setExpanded={setExpanded} />)}
          </div>

          {/* Legend */}
          <div className="mt-6 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
            <h3 className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider mb-3">{isKo ? "지표 가이드" : "Indicator Guide"}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <LegendItem name="RSI" title={isKo ? "상대강도지수 (14)" : "Relative Strength Index (14)"} desc={isKo ? "70+ = 과매수, 30- = 과매도" : ">70 = Overbought, <30 = Oversold"} />
              <LegendItem name="MACD" title={isKo ? "이동평균수렴확산" : "MACD (12,26,9)"} desc={isKo ? "양수 = 상승 모멘텀, 음수 = 하락" : "+ve = Bullish momentum, -ve = Bearish"} />
              <LegendItem name={isKo ? "신뢰" : "Conf"} title={isKo ? "시그널 신뢰도" : "Confidence Score"} desc={isKo ? "24h 변동, 공포/탐욕, RSI 기반" : "24h change, Fear/Greed, RSI based"} />
            </div>
          </div>

          <p className="text-center text-[10px] text-zinc-700 font-mono mt-4">{isKo ? "투자 조언이 아닙니다." : "Not financial advice."}</p>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Signal Row Component
   ═══════════════════════════════════════════════════════════ */

function SignalRow({ s, isKo, expanded, setExpanded }: { s: SignalItem; isKo: boolean; expanded: string | null; setExpanded: (v: string | null) => void }) {
  const icon = COIN_ICONS[s.symbol];
  const gradient = icon?.gradient ?? "from-zinc-500 to-zinc-700";
  const label = icon?.emoji ?? s.symbol.charAt(0);
  const sigStyle = SIGNAL_COLORS[s.signal] ?? { bg: "", glow: "" };
  const rsiColor = s.rsi > 70 ? "text-red-400" : s.rsi < 30 ? "text-emerald-400" : "text-zinc-300";
  const macdColor = s.macd?.histogram >= 0 ? "text-emerald-400" : "text-red-400";
  const isExp = expanded === s.symbol;

  return (
    <div>
      {/* Desktop */}
      <div className="hidden lg:grid items-center px-5 py-3.5 border-b border-white/[0.03] hover:bg-white/[0.03] transition-colors cursor-pointer"
        style={{ gridTemplateColumns: "2fr 1.4fr 0.9fr 0.8fr 1.2fr 1.2fr 1fr 1.2fr 1.2fr" }}
        onClick={() => setExpanded(isExp ? null : s.symbol)}>
        <div className="flex items-center gap-3">
          <div className={`h-8 w-8 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-bold text-xs shrink-0`}>{label}</div>
          <div><h3 className="text-sm font-semibold text-white leading-tight">{s.coin}</h3><p className="text-[10px] text-zinc-500 font-mono">{s.symbol}/USDT</p></div>
        </div>
        <div className="text-right"><span className="text-sm font-mono font-bold text-white tabular-nums">${s.price.toLocaleString(undefined, { maximumFractionDigits: s.price > 100 ? 0 : s.price > 1 ? 2 : 4 })}</span></div>
        <div className="text-right"><span className={`text-xs font-mono font-bold tabular-nums ${s.change24h >= 0 ? "text-emerald-400" : "text-red-400"}`}>{s.change24h >= 0 ? "+" : ""}{s.change24h.toFixed(2)}%</span></div>
        <div className="flex justify-center"><Sparkline data={s.sparkline} /></div>
        <div className="text-center"><span className={`text-xs font-mono font-bold tabular-nums ${rsiColor}`}>{s.rsi?.toFixed(1) || "—"}</span><p className="text-[9px] text-zinc-600 font-mono">{s.rsi > 70 ? (isKo ? "과매수" : "OB") : s.rsi < 30 ? (isKo ? "과매도" : "OS") : ""}</p></div>
        <div className="text-center"><span className={`text-xs font-mono font-bold tabular-nums ${macdColor}`}>{s.macd?.histogram != null ? (s.macd.histogram >= 0 ? "+" : "") + s.macd.histogram.toFixed(2) : "—"}</span></div>
        <div className="flex justify-center"><span className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded-md border ${s.direction === "LONG" ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : s.direction === "SHORT" ? "bg-red-500/20 text-red-400 border-red-500/30" : "bg-zinc-500/20 text-zinc-400 border-zinc-500/30"}`}>{s.direction === "LONG" ? "\u25B2 LONG" : s.direction === "SHORT" ? "\u25BC SHORT" : "\u25C6 WAIT"}</span></div>
        <div className="flex justify-center"><span className={`px-2.5 py-0.5 text-[10px] font-mono font-bold rounded-full border ${sigStyle.bg} ${sigStyle.glow}`}>{s.signal}</span></div>
        <div className="flex items-center gap-2 justify-end">
          <div className="w-14 h-1.5 rounded-full bg-white/[0.06] overflow-hidden"><div className={`h-full rounded-full bg-gradient-to-r ${confidenceColor(s.confidence)} transition-all duration-700`} style={{ width: `${s.confidence}%` }} /></div>
          <span className="text-[11px] font-mono font-semibold text-zinc-400 tabular-nums w-7 text-right">{s.confidence}%</span>
        </div>
      </div>

      {/* Desktop expanded */}
      {isExp && (
        <div className="hidden lg:block px-5 py-4 bg-white/[0.02] border-b border-white/[0.06]">
          <SignalDetail s={s} isKo={isKo} />
        </div>
      )}

      {/* Mobile */}
      <div className="lg:hidden border-b border-white/[0.04]">
        <div className="px-4 py-3.5 cursor-pointer active:bg-white/[0.03]" onClick={() => setExpanded(isExp ? null : s.symbol)}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2.5">
              <div className={`h-7 w-7 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-bold text-[10px] shrink-0`}>{label}</div>
              <div><span className="text-sm font-bold text-white">{s.symbol}</span><span className="text-[10px] text-zinc-600 font-mono ml-1.5">{s.coin}</span></div>
            </div>
            <span className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded-full border ${sigStyle.bg}`}>{s.signal}</span>
          </div>
          <div className="grid grid-cols-4 gap-2 text-center">
            <div><p className="text-[9px] text-zinc-600 font-mono mb-0.5">{isKo ? "가격" : "Price"}</p><p className="text-[11px] font-mono font-bold text-white">${s.price > 100 ? s.price.toLocaleString(undefined, { maximumFractionDigits: 0 }) : s.price.toFixed(2)}</p></div>
            <div><p className="text-[9px] text-zinc-600 font-mono mb-0.5">RSI</p><p className={`text-[11px] font-mono font-bold ${rsiColor}`}>{s.rsi?.toFixed(1) || "—"}</p></div>
            <div><p className="text-[9px] text-zinc-600 font-mono mb-0.5">MACD</p><p className={`text-[11px] font-mono font-bold ${macdColor}`}>{s.macd?.histogram != null ? (s.macd.histogram >= 0 ? "+" : "") + s.macd.histogram.toFixed(1) : "—"}</p></div>
            <div><p className="text-[9px] text-zinc-600 font-mono mb-0.5">{isKo ? "방향" : "Dir"}</p><p className={`text-[11px] font-mono font-bold ${s.direction === "LONG" ? "text-emerald-400" : s.direction === "SHORT" ? "text-red-400" : "text-zinc-400"}`}>{s.direction}</p></div>
          </div>
        </div>
        {isExp && <div className="px-4 pb-4"><SignalDetail s={s} isKo={isKo} /></div>}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Signal Detail (expanded)
   ═══════════════════════════════════════════════════════════ */

function SignalDetail({ s, isKo }: { s: SignalItem; isKo: boolean }) {
  const rsiColor = s.rsi > 70 ? "text-red-400" : s.rsi < 30 ? "text-emerald-400" : "text-blue-400";
  const macdColor = s.macd?.histogram >= 0 ? "text-emerald-400" : "text-red-400";

  return (
    <div className="space-y-3">
      {/* RSI Gauge */}
      <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">RSI (14)</span>
          <span className={`text-sm font-mono font-bold ${rsiColor}`}>{s.rsi?.toFixed(1)}</span>
        </div>
        <div className="relative h-2 rounded-full bg-zinc-800 overflow-hidden">
          <div className="absolute left-0 h-full w-[30%] bg-emerald-500/10" />
          <div className="absolute right-0 h-full w-[30%] bg-red-500/10" />
          <div className={`absolute top-0 h-full w-1 rounded-full ${s.rsi > 70 ? "bg-red-400" : s.rsi < 30 ? "bg-emerald-400" : "bg-blue-400"}`}
            style={{ left: `${Math.min(Math.max(s.rsi, 0), 100)}%`, transform: "translateX(-50%)" }} />
        </div>
        <div className="flex justify-between mt-1 text-[8px] font-mono text-zinc-600">
          <span>{isKo ? "과매도" : "Oversold"}</span><span>50</span><span>{isKo ? "과매수" : "Overbought"}</span>
        </div>
      </div>

      {/* MACD */}
      <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">MACD (12,26,9)</span>
          <span className={`text-sm font-mono font-bold ${macdColor}`}>{s.macd?.histogram != null ? (s.macd.histogram >= 0 ? "+" : "") + s.macd.histogram.toFixed(3) : "—"}</span>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div><p className="text-[9px] text-zinc-600 font-mono">Line</p><p className="text-[11px] font-mono font-bold text-zinc-300">{s.macd?.value?.toFixed(3) || "—"}</p></div>
          <div><p className="text-[9px] text-zinc-600 font-mono">Signal</p><p className="text-[11px] font-mono font-bold text-zinc-300">{s.macd?.signal?.toFixed(3) || "—"}</p></div>
          <div><p className="text-[9px] text-zinc-600 font-mono">Hist</p><p className={`text-[11px] font-mono font-bold ${macdColor}`}>{s.macd?.histogram != null ? (s.macd.histogram >= 0 ? "+" : "") + s.macd.histogram.toFixed(3) : "—"}</p></div>
        </div>
      </div>

      {/* Reasons */}
      {s.reasons.length > 0 && (
        <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-3">
          <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider mb-2">{isKo ? "분석 근거" : "Reasons"}</p>
          <div className="space-y-1.5">
            {s.reasons.map((r, i) => (
              <div key={i} className="flex items-start gap-2"><span className="mt-1.5 w-1 h-1 rounded-full bg-zinc-600 shrink-0" /><span className="text-[11px] text-zinc-400 leading-relaxed">{r}</span></div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Prediction Card Components
   ═══════════════════════════════════════════════════════════ */

function CategoryBadge({ category, isKo }: { category: string; isKo: boolean }) {
  if (category === "crypto") return null;
  const colors = CATEGORY_COLORS[category] || { bg: "bg-zinc-500/15", text: "text-zinc-400" };
  const label = category === "politics" ? (isKo ? "정치" : "Politics") : category === "business" ? (isKo ? "경제" : "Business") : category;
  return <span className={`px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wider ${colors.bg} ${colors.text}`}>{label}</span>;
}

function EventCard({ event, isKo }: { event: Event; isKo: boolean }) {
  const vol = parseFloat(String(event.volume || 0));
  const volLabel = formatVol(vol);
  const isUpDown = event.title.toLowerCase().includes("up or down") || event.title.toLowerCase().includes("up/down");
  const isBinary = !isUpDown && event.markets.length === 1 && event.markets[0].outcomes?.length === 2;
  const title = isKo ? translateToKo(event.title) : event.title;
  const yesLabel = isKo ? "예" : "Yes";
  const noLabel = isKo ? "아니오" : "No";
  const upLabel = isKo ? "상승" : "Up";
  const downLabel = isKo ? "하락" : "Down";
  const chanceLabel = isKo ? "확률" : "chance";

  if (isUpDown && event.markets.length >= 1) {
    const m = event.markets[0];
    const yesRaw = m.outcomePrices?.[0] ? parseFloat(String(m.outcomePrices[0])) : 0.5;
    const yesPct = Math.round(yesRaw * 100);
    const isUp = yesRaw > 0.5;
    return (
      <a href={`https://polymarket.com/event/${event.slug || event.id}`} target="_blank" rel="noopener noreferrer" className="block group">
        <div className="rounded-xl bg-[#171923] border border-[#1e2030] p-4 flex flex-col h-full transition-all duration-200 hover:border-[#2e3050] hover:bg-[#1c1e2e]">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-start gap-3 min-w-0">{event.image && <img src={event.image} alt="" className="w-9 h-9 rounded-full object-cover shrink-0 mt-0.5" />}<h3 className="text-[14px] font-semibold text-white leading-snug line-clamp-2">{title}</h3></div>
            <DonutChart pct={yesPct} label={isUp ? upLabel : downLabel} color={isUp ? "#22c55e" : "#ef4444"} />
          </div>
          <div className="flex gap-2 mt-auto">
            <button className="flex-1 py-2 rounded-lg text-[13px] font-semibold bg-[#132b1f] text-emerald-400 hover:bg-[#1a3d2a] transition-colors text-center cursor-pointer">{upLabel}</button>
            <button className="flex-1 py-2 rounded-lg text-[13px] font-semibold bg-[#2d1219] text-rose-400 hover:bg-[#3d1a24] transition-colors text-center cursor-pointer">{downLabel}</button>
          </div>
          <CardFooter volLabel={volLabel} hasGift={false} />
        </div>
      </a>
    );
  }

  if (isBinary) {
    const m = event.markets[0];
    const yesRaw = m.outcomePrices?.[0] ? parseFloat(String(m.outcomePrices[0])) : 0.5;
    const yesPct = Math.round(yesRaw * 100);
    return (
      <a href={`https://polymarket.com/event/${event.slug || event.id}`} target="_blank" rel="noopener noreferrer" className="block group">
        <div className="rounded-xl bg-[#171923] border border-[#1e2030] p-4 flex flex-col h-full transition-all duration-200 hover:border-[#2e3050] hover:bg-[#1c1e2e]">
          {event.category !== "crypto" && <div className="mb-2"><CategoryBadge category={event.category} isKo={isKo} /></div>}
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-start gap-3 min-w-0">{event.image && <img src={event.image} alt="" className="w-9 h-9 rounded-full object-cover shrink-0 mt-0.5" />}<h3 className="text-[14px] font-semibold text-white leading-snug line-clamp-2">{title}</h3></div>
            <DonutChart pct={yesPct} label={chanceLabel} color="#22c55e" />
          </div>
          <div className="flex gap-2 mt-auto">
            <button className="flex-1 py-2 rounded-lg text-[13px] font-semibold bg-[#132b1f] text-emerald-400 hover:bg-[#1a3d2a] transition-colors text-center cursor-pointer">{yesLabel}</button>
            <button className="flex-1 py-2 rounded-lg text-[13px] font-semibold bg-[#2d1219] text-rose-400 hover:bg-[#3d1a24] transition-colors text-center cursor-pointer">{noLabel}</button>
          </div>
          <CardFooter volLabel={volLabel} hasGift={volLabel !== ""} />
        </div>
      </a>
    );
  }

  return (
    <a href={`https://polymarket.com/event/${event.slug || event.id}`} target="_blank" rel="noopener noreferrer" className="block group">
      <div className="rounded-xl bg-[#171923] border border-[#1e2030] p-4 flex flex-col h-full transition-all duration-200 hover:border-[#2e3050] hover:bg-[#1c1e2e]">
        {event.category !== "crypto" && <div className="mb-2"><CategoryBadge category={event.category} isKo={isKo} /></div>}
        <div className="flex items-start gap-3 mb-3">{event.image && <img src={event.image} alt="" className="w-9 h-9 rounded-full object-cover shrink-0 mt-0.5" />}<h3 className="text-[14px] font-semibold text-white leading-snug line-clamp-2">{title}</h3></div>
        <div className="space-y-1 flex-1">
          {event.markets.slice(0, 3).map((market, i) => {
            const yesRaw = market.outcomePrices?.[0] ? parseFloat(String(market.outcomePrices[0])) : 0.5;
            const yesPct = Math.round(yesRaw * 100);
            let lbl = market.groupItemTitle || (event.markets.length > 1 ? (market.question || market.outcomes?.[0] || "Yes") : (market.outcomes?.[0] || "Yes"));
            if (isKo) lbl = translateToKo(lbl);
            if (lbl.length > 40) lbl = lbl.slice(0, 37) + "...";
            return (
              <div key={i} className="flex items-center gap-2 py-1">
                <span className="text-[13px] text-[#c5cad3] flex-1 min-w-0 truncate">{lbl}</span>
                <span className="text-[13px] font-bold text-white tabular-nums shrink-0 mr-1.5">{yesPct}%</span>
                <span className="px-2 py-[3px] rounded text-[11px] font-semibold bg-[#132b1f] text-emerald-400 hover:bg-[#1a3d2a] transition-colors cursor-pointer">{yesLabel}</span>
                <span className="px-2 py-[3px] rounded text-[11px] font-semibold bg-[#2d1219] text-rose-400 hover:bg-[#3d1a24] transition-colors cursor-pointer">{noLabel}</span>
              </div>
            );
          })}
        </div>
        <CardFooter volLabel={volLabel} hasGift={event.markets.length > 3} />
      </div>
    </a>
  );
}

function CardFooter({ volLabel, hasGift }: { volLabel: string; hasGift: boolean }) {
  return (
    <div className="flex items-center gap-2.5 mt-3 pt-2.5 border-t border-white/[0.05]">
      <span className="flex items-center gap-1.5">
        <span className="relative flex h-[6px] w-[6px]"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-40" /><span className="relative inline-flex rounded-full h-[6px] w-[6px] bg-red-500" /></span>
        <span className="text-[11px] font-semibold text-red-400 tracking-wide">LIVE</span>
      </span>
      {volLabel && <span className="text-[11px] text-[#555c69] tabular-nums">{volLabel}</span>}
      <div className="flex-1" />
      {hasGift && <svg className="w-[14px] h-[14px] text-[#3a3f4a] group-hover:text-[#555c69] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H4.5a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" /></svg>}
      <svg className="w-[14px] h-[14px] text-[#3a3f4a] group-hover:text-[#555c69] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" /></svg>
    </div>
  );
}

function LegendItem({ name, title, desc }: { name: string; title: string; desc: string }) {
  return (
    <div className="flex gap-2.5">
      <div className="shrink-0 w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center"><span className="text-[10px] font-mono font-bold text-zinc-400">{name}</span></div>
      <div><p className="text-[11px] text-zinc-300 font-medium">{title}</p><p className="text-[10px] text-zinc-600 leading-relaxed">{desc}</p></div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Hero Market — featured top-volume event
   ═══════════════════════════════════════════════════════════ */

function HeroMarket({ event, isKo }: { event: Event; isKo: boolean }) {
  const vol = parseFloat(String(event.volume || 0));
  const volLabel = formatVol(vol);
  const title = isKo ? translateToKo(event.title) : event.title;
  const isUpDown = event.title.toLowerCase().includes("up or down") || event.title.toLowerCase().includes("up/down");
  const firstMarket = event.markets[0];
  const yesRaw = firstMarket?.outcomePrices?.[0] ? parseFloat(String(firstMarket.outcomePrices[0])) : 0.5;
  const yesPct = Math.round(yesRaw * 100);
  const noPct = 100 - yesPct;
  const dominantSide = yesPct > 60 ? "yes" : yesPct < 40 ? "no" : "split";

  const accentBg = dominantSide === "yes"
    ? "from-emerald-500/[0.10] via-emerald-500/[0.04] to-transparent"
    : dominantSide === "no"
    ? "from-rose-500/[0.10] via-rose-500/[0.04] to-transparent"
    : "from-blue-500/[0.10] via-violet-500/[0.04] to-transparent";

  const yesLabel = isUpDown ? (isKo ? "상승" : "Up") : (isKo ? "예" : "Yes");
  const noLabel = isUpDown ? (isKo ? "하락" : "Down") : (isKo ? "아니오" : "No");

  return (
    <a
      href={`https://polymarket.com/event/${event.slug || event.id}`}
      target="_blank"
      rel="noopener noreferrer"
      className="relative block rounded-2xl border border-white/[0.08] bg-white/[0.02] overflow-hidden group hover:border-white/[0.14] transition-all duration-200"
    >
      {/* Accent gradient */}
      <div className={`absolute inset-0 bg-gradient-to-br ${accentBg} pointer-events-none`} />

      <div className="relative p-5 sm:p-6 flex flex-col sm:flex-row gap-5 sm:gap-6">
        {/* Image / icon */}
        {event.image && (
          <div className="shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border border-white/[0.08] bg-white/[0.04]">
            <img src={event.image} alt="" className="w-full h-full object-cover" />
          </div>
        )}

        {/* Body */}
        <div className="flex-1 min-w-0 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-300 border border-amber-500/20">
              {isKo ? "오늘의 마켓" : "Featured"}
            </span>
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-[0.15em]">
              {event.category === "crypto" ? "Crypto" : event.category === "politics" ? (isKo ? "정치" : "Politics") : event.category === "business" ? (isKo ? "경제" : "Business") : "Other"}
            </span>
            {volLabel && (
              <>
                <span className="text-zinc-700">·</span>
                <span className="text-[10px] font-mono text-zinc-400 tabular-nums">{volLabel}</span>
              </>
            )}
          </div>

          <h2 className="text-lg sm:text-xl font-bold text-white leading-tight tracking-tight line-clamp-2">
            {title}
          </h2>

          {/* Probability bar */}
          <div className="mt-1">
            <div className="flex items-center justify-between text-[12px] font-mono mb-1.5">
              <span className="text-emerald-400 font-bold">{yesLabel} {yesPct}%</span>
              <span className="text-rose-400 font-bold">{noLabel} {noPct}%</span>
            </div>
            <div className="h-2.5 rounded-full overflow-hidden bg-white/[0.06] flex">
              <div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-700" style={{ width: `${yesPct}%` }} />
              <div className="h-full bg-gradient-to-r from-rose-500 to-rose-400 transition-all duration-700" style={{ width: `${noPct}%` }} />
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="shrink-0 flex sm:flex-col items-center sm:items-end gap-2 sm:justify-between">
          <div className="text-right">
            <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">{isKo ? "결과" : "Verdict"}</div>
            <div className={`text-2xl sm:text-3xl font-bold tabular-nums ${dominantSide === "yes" ? "text-emerald-400" : dominantSide === "no" ? "text-rose-400" : "text-zinc-300"}`}>
              {dominantSide === "yes" ? yesLabel : dominantSide === "no" ? noLabel : (isKo ? "접전" : "Toss")}
            </div>
          </div>
          <span className="text-[11px] font-mono text-zinc-600 group-hover:text-zinc-400 transition-colors">
            {isKo ? "자세히 →" : "Open →"}
          </span>
        </div>
      </div>
    </a>
  );
}

/* ═══════════════════════════════════════════════════════════
   Movers Rail — horizontal scroll of biggest 24h volume events
   ═══════════════════════════════════════════════════════════ */

function MoversRail({ events, isKo }: { events: Event[]; isKo: boolean }) {
  if (!events.length) return null;
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
      <div className="flex items-center gap-2 px-4 sm:px-5 py-3 border-b border-white/[0.06]">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-emerald-400">
          <path d="M3 17l6-6 4 4 8-8" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M14 7h7v7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <h3 className="text-[13px] font-bold text-white tracking-tight">
          {isKo ? "거래량 급증" : "Biggest Movers"}
        </h3>
        <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-[0.15em]">24h</span>
      </div>
      <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory no-scrollbar p-3">
        {events.map((event) => {
          const m = event.markets[0];
          const yesRaw = m?.outcomePrices?.[0] ? parseFloat(String(m.outcomePrices[0])) : 0.5;
          const yesPct = Math.round(yesRaw * 100);
          const isUp = yesRaw >= 0.5;
          const title = isKo ? translateToKo(event.title) : event.title;
          return (
            <a
              key={event.id}
              href={`https://polymarket.com/event/${event.slug || event.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="snap-start shrink-0 w-[240px] rounded-xl border border-white/[0.06] bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/[0.12] transition-all p-3 flex flex-col gap-2"
            >
              <div className="flex items-center gap-2">
                {event.image ? (
                  <img src={event.image} alt="" className="w-7 h-7 rounded-full object-cover shrink-0 border border-white/[0.08]" />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-white/[0.06] shrink-0" />
                )}
                <span className={`text-[10px] font-mono font-bold tabular-nums px-1.5 py-0.5 rounded ${isUp ? "text-emerald-400 bg-emerald-500/10" : "text-rose-400 bg-rose-500/10"}`}>
                  {yesPct}%
                </span>
                <span className="ml-auto text-[10px] font-mono text-emerald-400 tabular-nums">
                  {formatVol(event.volume24hr || 0).replace(" Vol.", "")}
                </span>
              </div>
              <p className="text-[12px] font-medium text-white leading-snug line-clamp-2">{title}</p>
              <div className="h-1 rounded-full overflow-hidden bg-white/[0.06] flex mt-auto">
                <div className={`h-full ${isUp ? "bg-emerald-500" : "bg-rose-500"} transition-all`} style={{ width: `${yesPct}%` }} />
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}
