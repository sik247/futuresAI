"use client";

import React, { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { getChartIdeas, getChartIdeasCount } from "./actions";
import ChartIdeaCard, { type ChartIdeaData } from "./chart-idea-card";
import { Button } from "@/components/ui/button";
import { Dictionary } from "@/i18n";
import gsap from "gsap";

type TChartIdeasFeed = {
  initialIdeas: ChartIdeaData[];
  initialCount: number;
  translations: Dictionary;
};

const ChartIdeasFeed: React.FC<TChartIdeasFeed> = ({
  initialIdeas,
  initialCount,
  translations,
}) => {
  const [ideas, setIdeas] = useState<ChartIdeaData[]>(initialIdeas);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const newCardsRef = useRef<HTMLDivElement>(null);

  const allFetched = useMemo(
    () => ideas.length >= initialCount,
    [ideas, initialCount]
  );

  const fetchMore = useCallback(async () => {
    setLoading(true);
    try {
      const nextPage = currentPage + 1;
      const nextIdeas = await getChartIdeas(nextPage);
      setCurrentPage(nextPage);
      setIdeas((prev) => [...prev, ...nextIdeas]);
    } catch (error) {
      console.error("Failed to load more chart ideas:", error);
    } finally {
      setLoading(false);
    }
  }, [currentPage]);

  // Animate newly loaded cards
  useEffect(() => {
    if (currentPage <= 1) return;
    // Animate cards that were just added
    const startIndex = (currentPage - 1) * 12;
    const newCards = document.querySelectorAll(
      `[data-chart-idea-index]`
    );
    newCards.forEach((card) => {
      const index = Number(card.getAttribute("data-chart-idea-index"));
      if (index >= startIndex) {
        gsap.fromTo(
          card,
          { opacity: 0, y: 40, scale: 0.95 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.6,
            delay: (index - startIndex) * 0.08,
            ease: "power3.out",
          }
        );
      }
    });
  }, [ideas.length, currentPage]);

  if (ideas.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-16 h-16 rounded-full bg-zinc-900/50 border border-white/[0.08] flex items-center justify-center mb-4">
          <svg
            className="w-8 h-8 text-zinc-600"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5"
            />
          </svg>
        </div>
        <p className="text-zinc-400 text-lg">{translations.chartIdeas_empty}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {ideas.map((idea, index) => (
          <div key={idea.id} data-chart-idea-index={index}>
            <ChartIdeaCard
              idea={idea}
              index={index}
              translations={translations}
            />
          </div>
        ))}
      </div>

      {!allFetched && (
        <Button
          variant="outline"
          className="w-full bg-zinc-950/60 backdrop-blur-sm border-white/[0.08] text-zinc-400 hover:text-white hover:border-white/20 transition-all"
          onClick={fetchMore}
          disabled={loading}
        >
          {loading ? "..." : "Load More"}
        </Button>
      )}
    </div>
  );
};

export default ChartIdeasFeed;
