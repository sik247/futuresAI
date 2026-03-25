import Container from "@/components/ui/container";
import { Metadata } from "next";
import MarketsClient from "./markets-client";

export const metadata: Metadata = {
  title: "Crypto Prediction Markets",
  description:
    "Live prediction markets from Polymarket. Track real-time probabilities, volume, and trends across crypto and global events. Market intelligence by Futures AI.",
  keywords: ["prediction markets", "Polymarket", "crypto predictions", "market probabilities", "event trading"],
};

function formatVolume(vol: number | string) {
  const n = typeof vol === "string" ? parseFloat(vol) : vol;
  if (isNaN(n)) return "$0";
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
}

function parseEvent(e: any) {
  return {
    id: e.id,
    title: e.title,
    image: e.image,
    volume: e.volume,
    liquidity: e.liquidity,
    endDate: e.endDate,
    markets: (e.markets || []).map((m: any) => ({
      question: m.question,
      outcomePrices:
        typeof m.outcomePrices === "string"
          ? JSON.parse(m.outcomePrices)
          : m.outcomePrices || [],
      outcomes:
        typeof m.outcomes === "string"
          ? JSON.parse(m.outcomes)
          : m.outcomes || ["Yes", "No"],
      volume: m.volume,
    })),
  };
}

async function getCryptoEvents() {
  try {
    const res = await fetch(
      "https://gamma-api.polymarket.com/events?closed=false&tag=crypto&limit=20",
      { next: { revalidate: 300 } }
    );
    const events = await res.json();
    return events.map(parseEvent);
  } catch {
    return [];
  }
}

async function getPoliticsEvents() {
  try {
    const res = await fetch(
      "https://gamma-api.polymarket.com/events?closed=false&tag=politics&order=volume&ascending=false&limit=12",
      { next: { revalidate: 300 } }
    );
    const events = await res.json();
    return events.map(parseEvent);
  } catch {
    return [];
  }
}

function formatDate(dateStr: string) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getTimeLeft(endDate: string): string {
  const diff = new Date(endDate).getTime() - Date.now();
  if (diff <= 0) return "마감됨";
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  if (days > 0) return `${days}일 ${hours}시간 남음`;
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}시간 ${mins}분 남음`;
}

function groupByTimeframe(events: any[]) {
  const now = Date.now();
  const daily: any[] = [];
  const weekly: any[] = [];
  const monthly: any[] = [];
  const later: any[] = [];

  for (const e of events) {
    if (!e.endDate) { later.push(e); continue; }
    const daysLeft = (new Date(e.endDate).getTime() - now) / (1000 * 60 * 60 * 24);
    if (daysLeft <= 1) daily.push(e);
    else if (daysLeft <= 7) weekly.push(e);
    else if (daysLeft <= 30) monthly.push(e);
    else later.push(e);
  }
  return { daily, weekly, monthly, later };
}

export default async function MarketsPage({
  params: { lang },
}: {
  params: { lang: string };
}) {
  const isKo = lang === "ko";

  const [cryptoEvents, politicsEvents] = await Promise.all([
    getCryptoEvents(),
    getPoliticsEvents(),
  ]);

  const totalMarkets = cryptoEvents.reduce(
    (acc: number, e: any) => acc + (e.markets?.length || 0),
    0
  );
  const aggregateVolume = cryptoEvents.reduce(
    (acc: number, e: any) => acc + (parseFloat(String(e.volume || 0)) || 0),
    0
  );
  const now = new Date().toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  });

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Hero Section */}
      <section className="relative pt-24 pb-14 overflow-hidden">
        {/* Decorative geometric elements */}
        <div className="absolute top-16 right-[10%] w-64 h-64 border border-white/[0.03] rotate-45 rounded-3xl" />
        <div className="absolute top-32 right-[15%] w-40 h-40 border border-white/[0.04] rotate-12 rounded-2xl" />
        <div className="absolute bottom-0 left-[5%] w-32 h-32 border border-white/[0.03] -rotate-12 rounded-xl" />
        <div className="absolute top-20 left-[8%] w-1.5 h-1.5 rounded-full bg-emerald-500/30" />
        <div className="absolute top-40 right-[20%] w-1 h-1 rounded-full bg-rose-500/30" />

        <Container className="flex flex-col gap-6 relative z-10">
          <p className="text-[11px] font-mono uppercase tracking-[0.25em] text-zinc-500">
            {isKo ? "예측 시장" : "Prediction Markets"}
          </p>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-zinc-100 tracking-tight leading-[1.05]">
            {isKo ? (
              <>
                시장
                <br />
                인텔리전스
              </>
            ) : (
              <>
                Market
                <br />
                Intelligence
              </>
            )}
          </h1>
          <p className="text-base text-zinc-500 max-w-lg">
            {isKo
              ? "실시간 예측 시장 데이터. 크립토 및 글로벌 이벤트의 확률과 거래량을 추적하세요."
              : "Real-time prediction market data. Track probabilities, volume, and sentiment across crypto and global events."}
          </p>

          {/* Stats bar */}
          <div className="flex flex-wrap items-center gap-6 mt-4 pt-5 border-t border-white/[0.06]">
            <div className="flex flex-col">
              <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-600">
                {isKo ? "마켓 수" : "Markets"}
              </span>
              <span className="text-lg font-mono font-bold text-zinc-200">
                {totalMarkets}
              </span>
            </div>
            <div className="w-px h-8 bg-white/[0.06]" />
            <div className="flex flex-col">
              <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-600">
                {isKo ? "총 거래량" : "Total Volume"}
              </span>
              <span className="text-lg font-mono font-bold text-zinc-200">
                {formatVolume(aggregateVolume)}
              </span>
            </div>
            <div className="w-px h-8 bg-white/[0.06]" />
            <div className="flex flex-col">
              <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-600">
                {isKo ? "업데이트" : "Updated"}
              </span>
              <span className="text-lg font-mono font-bold text-zinc-200">
                {now}
              </span>
            </div>
          </div>
        </Container>
      </section>

      {/* Crypto Markets — Daily */}
      <CryptoTimeframeSection
        title={isKo ? "크립토 — 오늘 마감" : "Crypto — Daily"}
        color="bg-red-500/70"
        badge={isKo ? "오늘 마감" : "Closing Today"}
        events={groupByTimeframe(cryptoEvents).daily}
        formatVolume={formatVolume}
        formatDate={formatDate}
        getTimeLeft={getTimeLeft}
      />

      {/* Crypto Markets — Weekly */}
      <CryptoTimeframeSection
        title={isKo ? "크립토 — 이번 주" : "Crypto — Weekly"}
        color="bg-amber-500/70"
        badge={isKo ? "이번 주" : "This Week"}
        events={groupByTimeframe(cryptoEvents).weekly}
        formatVolume={formatVolume}
        formatDate={formatDate}
        getTimeLeft={getTimeLeft}
      />

      {/* Crypto Markets — Monthly */}
      <CryptoTimeframeSection
        title={isKo ? "크립토 — 이번 달" : "Crypto — Monthly"}
        color="bg-emerald-500/70"
        badge={isKo ? "이번 달" : "This Month"}
        events={[...groupByTimeframe(cryptoEvents).monthly, ...groupByTimeframe(cryptoEvents).later]}
        formatVolume={formatVolume}
        formatDate={formatDate}
        getTimeLeft={getTimeLeft}
      />

      {/* Divider */}
      <Container>
        <div className="w-full h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />
      </Container>

      {/* All Crypto (Sortable) */}
      <section className="py-16">
        <Container>
          <div className="flex items-center gap-3 mb-8">
            <div className="w-1.5 h-6 rounded-full bg-emerald-500/70" />
            <h2 className="text-xl font-semibold text-zinc-200 tracking-tight">
              {isKo ? "전체 크립토 마켓" : "All Crypto Markets"}
            </h2>
            <span className="ml-2 px-2 py-0.5 rounded bg-white/[0.05] text-[11px] font-mono text-zinc-500">
              {cryptoEvents.length} {isKo ? "이벤트" : "events"}
            </span>
          </div>
          {cryptoEvents.length > 0 ? (
            <MarketsClient events={cryptoEvents} lang={lang} />
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <span className="text-4xl mb-4">🎯</span>
              <p className="text-zinc-300 text-sm font-medium">
                {isKo ? "현재 활성 예측 시장이 없습니다" : "No crypto prediction markets available."}
              </p>
              <p className="text-zinc-600 text-xs mt-1">
                {isKo ? "곧 새로운 마켓이 열립니다!" : "New markets coming soon!"}
              </p>
            </div>
          )}
        </Container>
      </section>

      {/* Divider */}
      <Container>
        <div className="w-full h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />
      </Container>

      {/* Politics Markets */}
      <section className="py-16">
        <Container>
          <div className="flex items-center gap-3 mb-8">
            <div className="w-1.5 h-6 rounded-full bg-violet-500/70" />
            <h2 className="text-xl font-semibold text-zinc-200 tracking-tight">
              {isKo ? "정치 마켓" : "Politics Markets"}
            </h2>
            <span className="ml-2 px-2 py-0.5 rounded bg-white/[0.05] text-[11px] font-mono text-zinc-500">
              {politicsEvents.length} {isKo ? "이벤트" : "events"}
            </span>
          </div>
          {politicsEvents.length > 0 ? (
            <MarketsClient events={politicsEvents} lang={lang} />
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <span className="text-4xl mb-4">🎯</span>
              <p className="text-zinc-300 text-sm font-medium">
                {isKo ? "현재 활성 예측 시장이 없습니다" : "No politics markets available."}
              </p>
              <p className="text-zinc-600 text-xs mt-1">
                {isKo ? "곧 새로운 마켓이 열립니다!" : "New markets coming soon!"}
              </p>
            </div>
          )}
        </Container>
      </section>

      {/* Attribution */}
      <section className="pb-16">
        <Container>
          <div className="w-full h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent mb-6" />
          <p className="text-center text-[11px] font-mono text-zinc-700">
            {isKo
              ? "데이터 출처: Polymarket. 가격은 시장 확률을 반영합니다."
              : "Data from Polymarket. Prices reflect market probability."}
          </p>
        </Container>
      </section>
    </div>
  );
}

function CryptoTimeframeSection({
  title, color, badge, events, formatVolume, formatDate, getTimeLeft,
}: {
  title: string; color: string; badge: string;
  events: any[]; formatVolume: (v: number | string) => string; formatDate: (d: string) => string; getTimeLeft: (d: string) => string;
}) {
  if (events.length === 0) return null;
  return (
    <section className="pb-12">
      <Container>
        <div className="flex items-center gap-3 mb-6">
          <div className={`w-1.5 h-6 rounded-full ${color}`} />
          <h2 className="text-xl font-semibold text-zinc-200 tracking-tight">{title}</h2>
          <span className="ml-2 px-2 py-0.5 rounded bg-white/[0.05] text-[11px] font-mono text-zinc-500">
            {badge} &middot; {events.length}
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {events.map((event: any) => (
            <EventCard key={event.id} event={event} formatVolume={formatVolume} formatDate={formatDate} getTimeLeft={getTimeLeft} />
          ))}
        </div>
      </Container>
    </section>
  );
}

function EventCard({ event, formatVolume, formatDate, getTimeLeft }: { event: any; formatVolume: (v: number | string) => string; formatDate: (d: string) => string; getTimeLeft: (d: string) => string }) {
  const volume = parseFloat(String(event.volume || 0));
  const isHot = volume >= 1_000_000;
  const isClosingSoon = event.endDate && (new Date(event.endDate).getTime() - Date.now()) <= 24 * 60 * 60 * 1000 && (new Date(event.endDate).getTime() - Date.now()) > 0;

  return (
    <a
      href={`https://polymarket.com/event/${event.id}`}
      target="_blank"
      rel="noopener noreferrer"
      className="block"
    >
      <div className="rounded-xl backdrop-blur-md bg-white/[0.03] border border-white/[0.06] p-5 flex flex-col transition-all duration-300 hover:border-white/[0.12] hover:bg-white/[0.05] hover:-translate-y-1 hover:shadow-[0_0_30px_rgba(255,255,255,0.03)]">
        <div className="flex items-start gap-3.5 mb-4">
          {event.image && (
            <img src={event.image} alt="" loading="lazy" className="w-12 h-12 rounded-lg object-cover flex-shrink-0 border border-white/[0.06]" />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-semibold text-zinc-100 leading-snug line-clamp-2">{event.title}</h3>
              {isHot && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-orange-500/15 text-[10px] font-bold text-orange-400 border border-orange-500/20 flex-shrink-0">
                  🔥 HOT
                </span>
              )}
              {isClosingSoon && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-red-500/15 text-[10px] font-bold text-red-400 border border-red-500/20 animate-pulse flex-shrink-0">
                  ⏰ 마감 임박
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              {event.volume && (
                <span className="inline-flex items-center px-2 py-0.5 rounded bg-white/[0.06] text-[11px] font-mono text-zinc-400">
                  VOL {formatVolume(event.volume)}
                </span>
              )}
              {event.liquidity && (
                <span className="inline-flex items-center px-2 py-0.5 rounded bg-white/[0.06] text-[11px] font-mono text-zinc-400">
                  LIQ {formatVolume(event.liquidity)}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="space-y-3.5 flex-1">
          {event.markets.slice(0, 2).map((market: any, mi: number) => {
            const yesRaw = market.outcomePrices?.[0] ? parseFloat(market.outcomePrices[0]) : 0.5;
            const noRaw = market.outcomePrices?.[1] ? parseFloat(market.outcomePrices[1]) : 0.5;
            const yesPct = (yesRaw * 100).toFixed(0);
            const noPct = (noRaw * 100).toFixed(0);
            const yesWidth = yesRaw * 100;
            const yesDominant = yesRaw >= noRaw;
            const yesNum = parseFloat(yesPct);
            return (
              <div key={mi} className="space-y-1.5">
                {event.markets.length > 1 && <p className="text-xs text-zinc-500 line-clamp-1">{market.question}</p>}
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-mono font-bold w-11 text-right ${yesDominant ? "text-emerald-400" : "text-emerald-400/60"}`}>
                    {yesPct}%{yesNum > 50 ? " ↑" : yesNum < 50 ? " ↓" : ""}
                  </span>
                  <div className="flex-1 h-2.5 rounded-full bg-zinc-800/80 overflow-hidden flex">
                    <div className="h-full rounded-l-full transition-all duration-500" style={{ width: `${yesWidth}%`, background: yesDominant ? "linear-gradient(90deg, #059669, #34d399)" : "rgba(52, 211, 153, 0.3)" }} />
                    <div className="h-full rounded-r-full transition-all duration-500" style={{ width: `${100 - yesWidth}%`, background: !yesDominant ? "linear-gradient(90deg, #f43f5e, #fb7185)" : "rgba(244, 63, 94, 0.3)" }} />
                  </div>
                  <span className={`text-xs font-mono font-bold w-11 ${!yesDominant ? "text-rose-400" : "text-rose-400/60"}`}>{noPct}%</span>
                </div>
                <div className="flex justify-between px-[calc(2.75rem+0.5rem)]">
                  <span className={`text-[10px] ${yesDominant ? "text-emerald-400/80 font-medium" : "text-zinc-600"}`}>{market.outcomes?.[0] || "Yes"}</span>
                  <span className={`text-[10px] ${!yesDominant ? "text-rose-400/80 font-medium" : "text-zinc-600"}`}>{market.outcomes?.[1] || "No"}</span>
                </div>
              </div>
            );
          })}
        </div>
        {event.endDate && (
          <div className="mt-4 pt-3 border-t border-white/[0.06]">
            <span className="text-[11px] font-mono text-zinc-600">
              ⏱ {getTimeLeft(event.endDate)}
            </span>
          </div>
        )}
      </div>
    </a>
  );
}
