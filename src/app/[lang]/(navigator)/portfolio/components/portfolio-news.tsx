"use client";

import React from "react";
import { Card } from "@/components/ui/card";

type NewsItem = {
  id: string;
  title: string;
  titleKo: string;
  description: string;
  descriptionKo: string;
  sourceName: string;
  publishedAt: string;
  sourceUrl: string;
};

export default function PortfolioNews({
  news,
  lang,
}: {
  news: NewsItem[];
  lang: string;
}) {
  if (news.length === 0) return null;

  return (
    <Card className="p-6 bg-white/[0.03] border-white/[0.06] backdrop-blur-xl">
      <h3 className="text-[10px] text-zinc-500 font-mono uppercase tracking-[0.2em] mb-4">
        News For Your Holdings
      </h3>
      <div className="space-y-3">
        {news.map((n) => {
          const title = lang === "ko" && n.titleKo ? n.titleKo : n.title;
          const desc =
            lang === "ko" && n.descriptionKo
              ? n.descriptionKo
              : n.description;
          const ago = getTimeAgo(n.publishedAt);

          return (
            <a
              key={n.id}
              href={n.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block p-3 rounded-xl hover:bg-white/[0.03] transition-colors group"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-zinc-200 group-hover:text-white transition-colors line-clamp-2">
                    {title}
                  </p>
                  <p className="text-xs text-zinc-500 mt-1 line-clamp-1">
                    {desc}
                  </p>
                </div>
                <div className="flex-shrink-0 text-right">
                  <p className="text-[10px] text-zinc-600 font-mono">
                    {n.sourceName}
                  </p>
                  <p className="text-[10px] text-zinc-700 font-mono">{ago}</p>
                </div>
              </div>
            </a>
          );
        })}
      </div>
    </Card>
  );
}

function getTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}
