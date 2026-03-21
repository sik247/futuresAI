"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  tradingInsights,
  CATEGORY_COLORS,
  CATEGORY_LABELS,
  type TradingInsight,
} from "@/lib/data/insights";

const CATEGORIES = [
  "all",
  "technical-analysis",
  "quant",
  "risk-management",
  "market-structure",
  "funding-rates",
] as const;

function InsightCard({ insight, lang }: { insight: TradingInsight; lang: string }) {
  return (
    <Link href={`/${lang}/insights/${insight.id}`}>
      <article className="group bg-card border border-border rounded-lg overflow-hidden hover:bg-accent hover:border-border transition-all duration-200">
        <div className="p-6">
          {/* Category + Reading time */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-secondary text-secondary-foreground border border-border">
              {CATEGORY_LABELS[insight.category]}
            </span>
            <span className="text-xs text-muted-foreground">{insight.readingTime} min read</span>
          </div>

          {/* Title */}
          <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors line-clamp-2">
            {insight.title}
          </h3>

          {/* Summary */}
          <p className="text-sm text-muted-foreground mb-4 line-clamp-3">{insight.summary}</p>

          {/* Metrics preview */}
          {insight.metrics && insight.metrics.length > 0 && (
            <div className="grid grid-cols-2 gap-2 mb-4">
              {insight.metrics.slice(0, 4).map((metric) => (
                <div
                  key={metric.label}
                  className="bg-secondary border border-border rounded-lg px-3 py-2"
                >
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
                    {metric.label}
                  </div>
                  <div className="text-sm font-semibold text-foreground">{metric.value}</div>
                </div>
              ))}
            </div>
          )}

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5 mb-4">
            {insight.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border"
              >
                {tag}
              </span>
            ))}
          </div>

          {/* Author + Date */}
          <div className="flex items-center justify-between pt-3 border-t border-border">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-[10px] font-bold text-foreground">
                {insight.author.name.charAt(0)}
              </div>
              <div>
                <div className="text-xs text-foreground">{insight.author.name}</div>
                <div className="text-[10px] text-muted-foreground">{insight.author.role}</div>
              </div>
            </div>
            <span className="text-[10px] text-muted-foreground">
              {new Date(insight.publishedAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}

export default function InsightsPage() {
  const params = useParams();
  const lang = (params?.lang as string) || "en";
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const filtered =
    activeCategory === "all"
      ? tradingInsights
      : tradingInsights.filter((i) => i.category === activeCategory);

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Hero */}
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-serif font-bold text-foreground mb-4">
            Trading Insights
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Data-driven analysis for smarter trading. Quantitative research,
            backtested strategies, and market structure deep-dives.
          </p>
        </div>

        {/* Category filters */}
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm font-medium border transition-all duration-200 ${
                activeCategory === cat
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-secondary text-muted-foreground border-border hover:bg-accent hover:text-foreground"
              }`}
            >
              {cat === "all"
                ? "All"
                : CATEGORY_LABELS[cat as TradingInsight["category"]]}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((insight) => (
            <InsightCard key={insight.id} insight={insight} lang={lang} />
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-20 text-muted-foreground">
            No insights found for this category.
          </div>
        )}
      </div>
    </div>
  );
}
