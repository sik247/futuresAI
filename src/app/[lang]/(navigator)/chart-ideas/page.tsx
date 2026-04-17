import Link from "next/link";
import Container from "@/components/ui/container";
import { getDictionary } from "@/i18n";
import { getChartIdeas, getChartIdeasCount } from "./actions";
import ChartIdeasFeed from "./chart-ideas-feed";
import { Button } from "@/components/ui/button";

export default async function ChartIdeasPage({
  params: { lang },
}: {
  params: { lang: string };
}) {
  const translations = await getDictionary(lang);
  const [ideas, count] = await Promise.all([
    getChartIdeas(1),
    getChartIdeasCount(),
  ]);
  const ko = lang === "ko";

  return (
    <div className="bg-zinc-950 min-h-screen">
    <Container className="flex flex-col gap-8 lg:gap-16 pb-16 max-md:px-4">
      <section className="flex flex-col gap-6 lg:gap-16 pt-20 lg:pt-16 pb-16 w-full">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
          <div className="flex flex-col gap-1.5">
            <h1 className="text-2xl lg:text-4xl text-zinc-100 font-extrabold tracking-tight">
              {translations.chartIdeas}
            </h1>
            <p className="text-sm lg:text-xl font-medium lg:font-semibold text-zinc-400">
              {translations.chartIdeas_subtitle}
            </p>
          </div>
          {/* Desktop buttons */}
          <div className="hidden lg:flex items-center gap-3">
            <Link href={`/${lang}/chart-ideas/analyze`}>
              <Button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20">
                {translations.chartAnalysis || "AI Analysis"} — Free
              </Button>
            </Link>
            <Link href={`/${lang}/chart-ideas/new`}>
              <Button variant="outline" className="flex items-center gap-2 border-white/[0.06] bg-white/[0.03] text-zinc-100 hover:border-white/[0.12] hover:bg-white/[0.05]">
                {translations.chartIdeas_new}
              </Button>
            </Link>
          </div>
        </div>

        {/* Mobile: Prominent AI Analysis CTA card */}
        <Link
          href={`/${lang}/chart-ideas/analyze`}
          className="lg:hidden group relative block overflow-hidden rounded-2xl border border-blue-500/30 bg-gradient-to-br from-blue-600/15 via-blue-500/10 to-cyan-500/10 p-4 transition-all duration-200 active:scale-[0.99] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 shadow-lg shadow-blue-500/10"
        >
          {/* Animated accent line */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-blue-500/0 via-blue-500/80 to-cyan-500/0 animate-pulse" />

          <div className="flex items-center gap-3">
            {/* Icon */}
            <div className="relative shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <h3 className="text-[15px] font-bold text-white">
                  {ko ? "내 차트 분석하기" : "Analyze My Chart"}
                </h3>
                <span className="px-1.5 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Free
                </span>
              </div>
              <p className="text-xs text-zinc-400 leading-snug">
                {ko
                  ? "AI가 즉시 진입/손절/목표가를 분석합니다"
                  : "AI instantly reads Entry / SL / TP from your chart"}
              </p>
            </div>

            <svg className="w-5 h-5 text-blue-300 shrink-0 group-active:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </div>
        </Link>

        {/* Mobile: Secondary share-idea link */}
        <Link
          href={`/${lang}/chart-ideas/new`}
          className="lg:hidden flex items-center justify-center gap-2 h-11 rounded-xl border border-white/[0.08] bg-white/[0.03] text-sm font-medium text-zinc-300 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer -mt-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          {translations.chartIdeas_new}
        </Link>

        {/* Feed */}
        <ChartIdeasFeed
          initialIdeas={ideas}
          initialCount={count}
          translations={translations}
        />
      </section>
    </Container>
    </div>
  );
}
