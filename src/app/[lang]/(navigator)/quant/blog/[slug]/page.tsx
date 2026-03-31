import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { QUANT_BLOG_POSTS, type QuantBlogPost, type TradeSetup } from "@/lib/data/quant-blog-posts";
import AdSenseUnit from "./adsense-unit";

/* ------------------------------------------------------------------ */
/*  Helpers                                                             */
/* ------------------------------------------------------------------ */

function formatPrice(n: number, symbol: string): string {
  if (symbol === "TOTAL") {
    const t = n / 1_000_000_000_000;
    return `$${t.toFixed(2)}T`;
  }
  if (n >= 1000) {
    return `$${n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  }
  if (n < 0.01) {
    return `$${n.toFixed(5)}`;
  }
  return `$${n.toFixed(2)}`;
}

function formatLevel(n: number): string {
  if (n >= 1000) {
    return `$${n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  }
  if (n < 0.01) {
    return `$${n.toFixed(5)}`;
  }
  return `$${n.toFixed(2)}`;
}

/* ------------------------------------------------------------------ */
/*  Direction badge                                                     */
/* ------------------------------------------------------------------ */
function DirectionBadge({ direction }: { direction: QuantBlogPost["direction"] }) {
  const styles = {
    LONG: "bg-emerald-500/90 text-white border border-emerald-400/50",
    SHORT: "bg-red-500/90 text-white border border-red-400/50",
    NEUTRAL: "bg-zinc-700/90 text-zinc-200 border border-zinc-500/50",
  };
  const labels = {
    LONG: "\u25B2 LONG",
    SHORT: "\u25BC SHORT",
    NEUTRAL: "\u25C6 NEUTRAL",
  };
  return (
    <span
      className={`px-3 py-1.5 text-xs font-mono font-bold rounded-md backdrop-blur-sm ${styles[direction]}`}
    >
      {labels[direction]}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  RSI pill                                                            */
/* ------------------------------------------------------------------ */
function RsiPill({ rsi }: { rsi: number }) {
  let color = "text-yellow-400 bg-yellow-500/10 border-yellow-500/20";
  if (rsi >= 70) color = "text-red-400 bg-red-500/10 border-red-500/20";
  else if (rsi <= 30) color = "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
  else if (rsi >= 55) color = "text-orange-400 bg-orange-500/10 border-orange-500/20";
  else if (rsi <= 45) color = "text-blue-400 bg-blue-500/10 border-blue-500/20";
  return (
    <span className={`px-2 py-0.5 text-[10px] font-mono font-semibold rounded border ${color}`}>
      RSI {rsi}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Trade setup panel                                                   */
/* ------------------------------------------------------------------ */
function TradeSetupPanel({
  setup,
  direction,
  supportLevels,
  resistanceLevels,
  isKo,
}: {
  setup: TradeSetup;
  direction: QuantBlogPost["direction"];
  supportLevels: number[];
  resistanceLevels: number[];
  isKo: boolean;
}) {
  const fmt = (n: number) =>
    n >= 1000
      ? `$${n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
      : n < 0.01
      ? `$${n.toFixed(5)}`
      : `$${n.toFixed(2)}`;

  const isNa = setup.entry === 0 && setup.stopLoss === 0 && setup.takeProfit === 0;

  if (isNa) return null;

  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
      <div
        className={`px-4 py-2.5 text-[10px] font-mono font-bold uppercase tracking-[0.15em] ${
          direction === "LONG"
            ? "bg-emerald-500/10 text-emerald-400 border-b border-emerald-500/20"
            : direction === "SHORT"
            ? "bg-red-500/10 text-red-400 border-b border-red-500/20"
            : "bg-zinc-800/50 text-zinc-400 border-b border-white/[0.06]"
        }`}
      >
        {isKo ? "트레이드 셋업" : "Trade Setup"} —{" "}
        {direction === "LONG" ? "LONG" : direction === "SHORT" ? "SHORT" : "WAIT"}
      </div>

      <div className="grid grid-cols-3 divide-x divide-white/[0.04]">
        <div className="p-4 text-center">
          <p className="text-[9px] font-mono text-zinc-600 uppercase mb-1.5">
            {isKo ? "진입가" : "Entry"}
          </p>
          <p className="text-base font-mono font-bold text-blue-400">{fmt(setup.entry)}</p>
        </div>
        <div className="p-4 text-center">
          <p className="text-[9px] font-mono text-zinc-600 uppercase mb-1.5">
            {isKo ? "손절가" : "Stop Loss"}
          </p>
          <p className="text-base font-mono font-bold text-red-400">{fmt(setup.stopLoss)}</p>
        </div>
        <div className="p-4 text-center">
          <p className="text-[9px] font-mono text-zinc-600 uppercase mb-1.5">
            {isKo ? "목표가" : "Take Profit"}
          </p>
          <p className="text-base font-mono font-bold text-emerald-400">{fmt(setup.takeProfit)}</p>
        </div>
      </div>

      <div className="px-4 py-3 border-t border-white/[0.04] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-zinc-500">R:R</span>
          <span className="text-sm font-mono font-bold text-purple-400">{setup.riskReward}</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {supportLevels.slice(0, 3).map((l, i) => (
            <span
              key={`s${i}`}
              className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-500/70 border border-emerald-500/15"
            >
              S{i + 1}: {fmt(l)}
            </span>
          ))}
          {resistanceLevels.slice(0, 3).map((l, i) => (
            <span
              key={`r${i}`}
              className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-red-500/10 text-red-500/70 border border-red-500/15"
            >
              R{i + 1}: {fmt(l)}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Content renderer                                                    */
/* ------------------------------------------------------------------ */
function ContentBody({ content }: { content: string }) {
  const lines = content.split("\n");
  return (
    <div className="text-sm text-zinc-400 leading-relaxed space-y-3 font-mono">
      {lines.map((line, i) => {
        if (line.startsWith("## ")) {
          return (
            <h2
              key={i}
              className="text-base font-bold text-zinc-100 uppercase tracking-[0.1em] mt-8 mb-2 font-mono border-b border-white/[0.06] pb-2"
            >
              {line.replace("## ", "")}
            </h2>
          );
        }
        if (line.startsWith("**") && line.endsWith("**")) {
          return (
            <p key={i} className="text-zinc-200 font-semibold text-sm">
              {line.replace(/\*\*/g, "")}
            </p>
          );
        }
        if (line.trim() === "") return null;
        const parts = line.split(/(\*\*[^*]+\*\*)/g);
        return (
          <p key={i} className="text-[14px] text-zinc-400 leading-relaxed">
            {parts.map((part, j) =>
              part.startsWith("**") && part.endsWith("**") ? (
                <strong key={j} className="text-zinc-200 font-semibold">
                  {part.replace(/\*\*/g, "")}
                </strong>
              ) : (
                part
              )
            )}
          </p>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Related posts                                                       */
/* ------------------------------------------------------------------ */
function RelatedPosts({
  current,
  lang,
  isKo,
}: {
  current: QuantBlogPost;
  lang: string;
  isKo: boolean;
}) {
  const related = QUANT_BLOG_POSTS.filter(
    (p) =>
      p.id !== current.id &&
      p.publishedAt.slice(0, 10) === current.publishedAt.slice(0, 10)
  ).slice(0, 3);

  if (related.length === 0) return null;

  return (
    <div className="mt-16 border-t border-white/[0.06] pt-10">
      <h2 className="text-lg font-bold text-zinc-100 mb-6 font-mono tracking-[0.08em]">
        {isKo ? "관련 분석" : "Related Analysis"}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {related.map((r) => (
          <Link
            key={r.id}
            href={`/${lang}/quant/blog/${r.slug}`}
            className="group rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden hover:bg-white/[0.04] hover:border-white/[0.1] transition-all duration-200"
          >
            <div className="relative overflow-hidden">
              <img
                src={r.chartImage}
                alt={`${r.coin} chart`}
                className="w-full h-28 object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-transparent to-transparent" />
              <span className="absolute bottom-2 left-2 text-xs font-mono font-bold text-white">
                {r.symbol}
              </span>
            </div>
            <div className="p-3">
              <p className="text-xs font-semibold text-zinc-200 leading-snug line-clamp-2 group-hover:text-blue-300 transition-colors">
                {isKo ? r.titleKo : r.title}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Metadata                                                            */
/* ------------------------------------------------------------------ */
export async function generateMetadata({
  params,
}: {
  params: { lang: string; slug: string };
}): Promise<Metadata> {
  const post = QUANT_BLOG_POSTS.find((p) => p.slug === params.slug);
  if (!post) return {};

  const isKo = params.lang === "ko";
  const title = isKo ? post.titleKo : post.title;
  const description = isKo ? post.excerptKo : post.excerpt;

  return {
    title: `${title} | FuturesAI Quant`,
    description,
    openGraph: {
      title: `${title} | FuturesAI Quant`,
      description,
      images: [
        {
          url: post.chartImage,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      type: "article",
      publishedTime: post.publishedAt,
      authors: [post.author],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | FuturesAI Quant`,
      description,
      images: [post.chartImage],
    },
  };
}

/* ------------------------------------------------------------------ */
/*  Static params                                                       */
/* ------------------------------------------------------------------ */
export function generateStaticParams() {
  const langs = ["en", "ko"];
  return langs.flatMap((lang) =>
    QUANT_BLOG_POSTS.map((post) => ({ lang, slug: post.slug }))
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                                */
/* ------------------------------------------------------------------ */
export default function QuantBlogPostPage({
  params,
}: {
  params: { lang: string; slug: string };
}) {
  const { lang, slug } = params;
  const isKo = lang === "ko";

  const post = QUANT_BLOG_POSTS.find((p) => p.slug === slug);
  if (!post) notFound();

  const priceFormatted = formatPrice(post.price, post.symbol);

  const dateFormatted = new Date(post.publishedAt).toLocaleDateString(
    isKo ? "ko-KR" : "en-US",
    { year: "numeric", month: "long", day: "numeric" }
  );

  return (
    <div className="min-h-screen pt-20 pb-24 bg-zinc-950">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        {/* Back link */}
        <Link
          href={`/${lang}/quant`}
          className="inline-flex items-center gap-2 text-sm font-mono text-zinc-500 hover:text-zinc-300 transition-colors mb-8"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          {isKo ? "퀀트 리서치로 돌아가기" : "Back to Quant Research"}
        </Link>

        {/* Article header */}
        <header className="mb-6">
          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <DirectionBadge direction={post.direction} />
            <RsiPill rsi={post.rsi} />
            <span className="text-[11px] font-mono text-zinc-600">{dateFormatted}</span>
            <span className="text-[11px] font-mono text-zinc-700 ml-auto hidden sm:inline">
              {post.author}
            </span>
          </div>

          {/* Title */}
          <h1 className="text-2xl sm:text-3xl font-bold text-zinc-100 leading-snug mb-4">
            {isKo ? post.titleKo : post.title}
          </h1>

          {/* Price row */}
          <div className="flex items-baseline gap-3 mb-4">
            <span className="text-lg font-mono font-bold text-white">{post.symbol}</span>
            <span className="text-lg font-mono text-zinc-300">{priceFormatted}</span>
            <span
              className={`text-sm font-mono font-semibold ${
                post.change24h >= 0 ? "text-emerald-400" : "text-red-400"
              }`}
            >
              {post.change24h >= 0 ? "+" : ""}
              {post.change24h.toFixed(2)}%
            </span>
          </div>

          {/* Excerpt */}
          <p className="text-[15px] text-zinc-400 leading-relaxed border-l-2 border-blue-500/50 pl-4">
            {isKo ? post.excerptKo : post.excerpt}
          </p>
        </header>

        {/* Chart image */}
        <div className="relative rounded-2xl overflow-hidden border border-white/[0.06] mb-2">
          <img
            src={post.chartImage}
            alt={`${post.coin} 4H chart`}
            className="w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/60 via-transparent to-transparent pointer-events-none" />
          {/* Direction badge overlay */}
          <div className="absolute top-4 right-4">
            <DirectionBadge direction={post.direction} />
          </div>
        </div>

        {/* AdSense — after chart */}
        <AdSenseUnit />

        {/* Trade setup panel */}
        {(post.tradeSetup.entry !== 0 || post.symbol === post.symbol) && (
          <div className="mb-8">
            <TradeSetupPanel
              setup={post.tradeSetup}
              direction={post.direction}
              supportLevels={post.supportLevels}
              resistanceLevels={post.resistanceLevels}
              isKo={isKo}
            />
          </div>
        )}

        {/* Support / Resistance levels (macro posts with empty arrays are skipped automatically) */}
        {(post.supportLevels.length > 0 || post.resistanceLevels.length > 0) && (
          <div className="grid grid-cols-2 gap-4 mb-8">
            {post.supportLevels.length > 0 && (
              <div className="rounded-xl border border-emerald-500/15 bg-emerald-500/[0.03] p-4">
                <p className="text-[9px] font-mono text-emerald-600 uppercase tracking-[0.2em] mb-3">
                  {isKo ? "지지선" : "Support Levels"}
                </p>
                <ul className="space-y-1.5">
                  {post.supportLevels.map((l, i) => (
                    <li key={i} className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-emerald-600/70">S{i + 1}</span>
                      <span className="text-sm font-mono font-semibold text-emerald-400">
                        {formatLevel(l)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {post.resistanceLevels.length > 0 && (
              <div className="rounded-xl border border-red-500/15 bg-red-500/[0.03] p-4">
                <p className="text-[9px] font-mono text-red-600 uppercase tracking-[0.2em] mb-3">
                  {isKo ? "저항선" : "Resistance Levels"}
                </p>
                <ul className="space-y-1.5">
                  {post.resistanceLevels.map((l, i) => (
                    <li key={i} className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-red-600/70">R{i + 1}</span>
                      <span className="text-sm font-mono font-semibold text-red-400">
                        {formatLevel(l)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Article content */}
        <article className="mb-8">
          <ContentBody content={post.content} />
        </article>

        {/* Author row */}
        <div className="flex items-center gap-3 py-4 border-t border-b border-white/[0.06] mb-8">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
            F
          </div>
          <div>
            <p className="text-sm font-semibold text-zinc-200">{post.author}</p>
            <p className="text-[11px] font-mono text-zinc-600">{dateFormatted}</p>
          </div>
        </div>

        {/* AdSense — bottom */}
        <AdSenseUnit />

        {/* Disclaimer */}
        <p className="text-[11px] text-zinc-700 font-mono leading-relaxed mt-8 text-center max-w-xl mx-auto">
          {isKo
            ? "본 분석은 정보 제공 목적으로만 작성되었으며 투자 조언이 아닙니다. 모든 거래는 본인의 판단과 책임 하에 이루어져야 합니다."
            : "This analysis is for informational purposes only and does not constitute investment advice. All trades are made at your own risk and discretion."}
        </p>

        {/* Related posts */}
        <RelatedPosts current={post} lang={lang} isKo={isKo} />
      </div>
    </div>
  );
}
