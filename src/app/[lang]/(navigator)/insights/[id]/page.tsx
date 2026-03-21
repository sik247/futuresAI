"use client";

import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { notFound } from "next/navigation";
import {
  getInsightById,
  getRelatedInsights,
  CATEGORY_COLORS,
  CATEGORY_LABELS,
  type TradingInsight,
} from "@/lib/data/insights";

function getCategoryPillClass(category: TradingInsight["category"]) {
  const map: Record<string, string> = {
    blue: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    purple: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
    red: "bg-red-500/20 text-red-300 border-red-500/30",
    green: "bg-green-500/20 text-green-300 border-green-500/30",
    yellow: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  };
  return map[CATEGORY_COLORS[category]] || map.blue;
}

function getCategoryBorderClass(category: TradingInsight["category"]) {
  const map: Record<string, string> = {
    blue: "from-blue-500 to-blue-400",
    purple: "from-cyan-500 to-cyan-400",
    red: "from-red-500 to-red-400",
    green: "from-green-500 to-green-400",
    yellow: "from-yellow-500 to-yellow-400",
  };
  return map[CATEGORY_COLORS[category]] || map.blue;
}

export default function InsightDetailPage() {
  const params = useParams();
  const lang = (params?.lang as string) || "en";
  const id = params?.id as string;

  const insight = getInsightById(id);
  if (!insight) {
    notFound();
  }

  const related = getRelatedInsights(id, 3);

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Back link */}
        <Link
          href={`/${lang}/insights`}
          className="inline-flex items-center gap-2 text-sm text-white/40 hover:text-white/70 transition-colors mb-8"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to Insights
        </Link>

        {/* Header */}
        <div className="mb-8">
          {/* Category + Reading time */}
          <div className="flex items-center gap-3 mb-4">
            <span
              className={`text-xs font-medium px-2.5 py-1 rounded-full border ${getCategoryPillClass(insight.category)}`}
            >
              {CATEGORY_LABELS[insight.category]}
            </span>
            <span className="text-xs text-white/40">
              {insight.readingTime} min read
            </span>
            <span className="text-xs text-white/30">
              {new Date(insight.publishedAt).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </div>

          {/* Title */}
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            {insight.title}
          </h1>

          {/* Summary */}
          <p className="text-lg text-white/50 mb-6">{insight.summary}</p>

          {/* Author */}
          <div className="flex items-center gap-3 pb-6 border-b border-white/10">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center text-sm font-bold text-white">
              {insight.author.name.charAt(0)}
            </div>
            <div>
              <div className="text-sm font-medium text-white">
                {insight.author.name}
              </div>
              <div className="text-xs text-white/40">{insight.author.role}</div>
            </div>
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-6">
          {insight.tags.map((tag) => (
            <span
              key={tag}
              className="text-xs px-3 py-1 rounded-full bg-white/[0.06] text-white/50 border border-white/[0.08]"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Key Metrics */}
        {insight.metrics && insight.metrics.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
            {insight.metrics.map((metric) => (
              <div
                key={metric.label}
                className="bg-white/[0.04] border border-white/[0.06] rounded-xl p-4"
              >
                <div className="text-[11px] text-white/40 uppercase tracking-wider mb-1">
                  {metric.label}
                </div>
                <div className="text-xl font-bold text-white">{metric.value}</div>
                {metric.change && (
                  <div
                    className={`text-xs mt-1 ${
                      metric.change.startsWith("+") || metric.change.startsWith("-")
                        ? metric.change.startsWith("+")
                          ? "text-green-400"
                          : "text-red-400"
                        : "text-white/40"
                    }`}
                  >
                    {metric.change}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Content */}
        <div
          className="prose prose-invert prose-sm max-w-none mb-16
            [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-white [&_h2]:mt-8 [&_h2]:mb-4
            [&_p]:text-white/60 [&_p]:leading-relaxed [&_p]:mb-4
            [&_ul]:text-white/60 [&_ul]:mb-4 [&_ul]:space-y-2
            [&_li]:text-white/60
            [&_strong]:text-white/80
            [&_table]:w-full [&_table]:mb-6 [&_table]:border-collapse
            [&_thead]:border-b [&_thead]:border-white/20
            [&_th]:text-left [&_th]:text-xs [&_th]:font-medium [&_th]:text-white/50 [&_th]:uppercase [&_th]:tracking-wider [&_th]:py-3 [&_th]:px-4
            [&_td]:py-3 [&_td]:px-4 [&_td]:text-sm [&_td]:text-white/60 [&_td]:border-b [&_td]:border-white/[0.06]
            [&_tr:hover_td]:bg-white/[0.02]"
          dangerouslySetInnerHTML={{ __html: insight.content }}
        />

        {/* Related Insights */}
        {related.length > 0 && (
          <div className="border-t border-white/10 pt-10">
            <h2 className="text-2xl font-bold text-white mb-6">
              Related Insights
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {related.map((r) => (
                <Link key={r.id} href={`/${lang}/insights/${r.id}`}>
                  <div className="group bg-white/[0.04] border border-white/[0.08] rounded-xl overflow-hidden hover:bg-white/[0.08] hover:border-white/15 transition-all duration-200">
                    <div
                      className={`h-1 w-full bg-gradient-to-r ${getCategoryBorderClass(r.category)}`}
                    />
                    <div className="p-4">
                      <span
                        className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${getCategoryPillClass(r.category)}`}
                      >
                        {CATEGORY_LABELS[r.category]}
                      </span>
                      <h3 className="text-sm font-semibold text-white mt-2 group-hover:text-blue-300 transition-colors line-clamp-2">
                        {r.title}
                      </h3>
                      <p className="text-xs text-white/40 mt-1 line-clamp-2">
                        {r.summary}
                      </p>
                      <div className="text-[10px] text-white/30 mt-3">
                        {r.readingTime} min read
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
