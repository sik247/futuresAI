"use client";

import { Tweet } from "react-tweet";
import { useState } from "react";

/* ═══════════════════════════════════════════════════════════
   Controversial Takes — curated X/Twitter posts per category.
   ───────────────────────────────────────────────────────────
   To swap a tweet: open the post on X, copy the numeric ID
   from the URL (twitter.com/<user>/status/<ID>) and paste it
   into the array below. Order matters — first tweet shows as
   the "hottest" pinned take.
   ═══════════════════════════════════════════════════════════ */

type Category = "all" | "crypto" | "politics" | "business" | "korea";

type Take = {
  id: string;
  /** Short editorial label rendered as a badge above the tweet. */
  label: { en: string; ko: string };
  /** Optional one-line "why this matters" hot-take from us. */
  blurb?: { en: string; ko: string };
};

const TAKES_BY_CATEGORY: Record<Category, Take[]> = {
  crypto: [
    {
      id: "1768910425810911300",
      label: { en: "Bear case", ko: "약세론" },
      blurb: {
        en: "Top funding > 0.05% historically marks local tops. Most longs are wrong.",
        ko: "펀딩비 0.05% 초과는 역사적으로 단기 고점. 대부분의 롱은 틀린다.",
      },
    },
    {
      id: "1683920951807971329",
      label: { en: "Contrarian", ko: "반대론" },
      blurb: {
        en: "ETF flows are inflated by basis trades — not real demand.",
        ko: "ETF 자금 유입은 베이시스 트레이드 영향. 진짜 수요가 아니다.",
      },
    },
    {
      id: "1629307668568633344",
      label: { en: "Hot take", ko: "핫테이크" },
      blurb: {
        en: "Polymarket odds are leading indicator — TradFi will copy us in 18 months.",
        ko: "폴리마켓 확률이 선행지표. 트래드파이는 18개월 안에 따라온다.",
      },
    },
  ],
  politics: [
    {
      id: "1648292104436031491",
      label: { en: "Contrarian", ko: "반대론" },
      blurb: {
        en: "Polls and prediction markets disagree more than ever — markets win.",
        ko: "여론조사와 예측시장의 괴리 역대급. 시장이 이긴다.",
      },
    },
    {
      id: "1627428918725816320",
      label: { en: "Hot take", ko: "핫테이크" },
      blurb: {
        en: "Election odds are now mispriced 2x more often during overnight US hours.",
        ko: "미국 야간 시간대 선거 확률이 2배 더 자주 미스프라이싱.",
      },
    },
    {
      id: "1626568720427290624",
      label: { en: "Bull case", ko: "강세론" },
      blurb: {
        en: "Pricing in policy outcomes 6 weeks before legacy media calls them.",
        ko: "기존 매체보다 6주 빨리 정책 결과를 가격에 반영한다.",
      },
    },
  ],
  business: [
    {
      id: "1624140603098533888",
      label: { en: "Bear case", ko: "약세론" },
      blurb: {
        en: "Fed pivot bets are mostly retail copium. Watch the dot plot, not Twitter.",
        ko: "연준 피벗 베팅은 대부분 개미 코핑. 도트플롯을 봐라.",
      },
    },
    {
      id: "1622023535561150464",
      label: { en: "Contrarian", ko: "반대론" },
      blurb: {
        en: "Earnings markets are sharper than analyst consensus 60%+ of the time.",
        ko: "어닝 예측시장이 애널리스트 컨센서스보다 60% 이상 정확하다.",
      },
    },
  ],
  korea: [
    {
      id: "1648292104436031491",
      label: { en: "KR/Asia", ko: "한국/아시아" },
      blurb: {
        en: "Asia-hours liquidity creates the cleanest mispricings on Polymarket.",
        ko: "아시아 시간대 유동성이 폴리마켓에서 가장 큰 미스프라이싱을 만든다.",
      },
    },
  ],
  all: [
    {
      id: "1768910425810911300",
      label: { en: "Hot take", ko: "핫테이크" },
      blurb: {
        en: "Most consensus is wrong at the margin — that's where the edge lives.",
        ko: "대부분의 컨센서스는 한계에서 틀린다. 거기에 엣지가 있다.",
      },
    },
    {
      id: "1683920951807971329",
      label: { en: "Contrarian", ko: "반대론" },
      blurb: {
        en: "Liquidity beats narrative. The crowd-funded markets always win.",
        ko: "유동성이 내러티브를 이긴다. 군중이 자금을 댄 시장이 항상 이긴다.",
      },
    },
  ],
};

export default function ControversialTakes({
  category = "all",
  lang,
}: {
  category?: Category;
  lang: string;
}) {
  const ko = lang === "ko";
  const takes = TAKES_BY_CATEGORY[category]?.length
    ? TAKES_BY_CATEGORY[category]
    : TAKES_BY_CATEGORY.all;

  const [collapsed, setCollapsed] = useState(false);

  if (!takes.length) return null;

  return (
    <section
      data-theme="dark"
      className="relative rounded-2xl border border-white/[0.06] bg-gradient-to-br from-orange-500/[0.04] via-white/[0.02] to-rose-500/[0.04] overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-3 px-4 sm:px-5 py-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-500 opacity-60" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-400" />
          </span>
          <h3 className="text-[13px] sm:text-sm font-bold text-white tracking-tight">
            {ko ? "🔥 컨트로버셜 테이크" : "🔥 Controversial Takes"}
          </h3>
          <span className="hidden sm:inline text-[10px] font-mono text-zinc-500 uppercase tracking-[0.15em]">
            {ko ? "시장 컨센서스에 도전하는 의견" : "Voices going against consensus"}
          </span>
        </div>
        <button
          onClick={() => setCollapsed((v) => !v)}
          className="shrink-0 text-[11px] font-mono text-zinc-500 hover:text-white px-2 py-1 rounded-md hover:bg-white/[0.05] transition-colors cursor-pointer"
          aria-label={collapsed ? "Expand" : "Collapse"}
        >
          {collapsed ? (ko ? "펼치기" : "Expand") : (ko ? "접기" : "Collapse")}
        </button>
      </div>

      {/* Tweet rail */}
      {!collapsed && (
        <div className="px-4 sm:px-5 py-4">
          <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory no-scrollbar pb-2">
            {takes.map((take) => (
              <div
                key={take.id}
                className="snap-start shrink-0 w-[320px] sm:w-[360px] flex flex-col gap-2"
              >
                {/* Editorial label */}
                <div className="flex items-center gap-2 px-1">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-orange-500/15 text-orange-300 border border-orange-500/20">
                    {ko ? take.label.ko : take.label.en}
                  </span>
                  {take.blurb && (
                    <span className="text-[11px] text-zinc-400 line-clamp-1 italic">
                      "{ko ? take.blurb.ko : take.blurb.en}"
                    </span>
                  )}
                </div>

                {/* Tweet embed */}
                <div className="rounded-xl overflow-hidden border border-white/[0.06] bg-black/40 [&_div]:!bg-transparent">
                  <Tweet id={take.id} />
                </div>
              </div>
            ))}
          </div>

          {/* Footer note */}
          <p className="mt-3 text-[10px] font-mono text-zinc-600 text-center sm:text-left">
            {ko
              ? "* 게시물은 큐레이션된 외부 의견이며 투자 조언이 아닙니다."
              : "* Curated external opinions. Not financial advice."}
          </p>
        </div>
      )}
    </section>
  );
}
