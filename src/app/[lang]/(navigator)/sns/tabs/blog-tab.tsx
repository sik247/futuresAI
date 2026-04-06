"use client";

import { useEffect, useState } from "react";

interface BlogArticle {
  id: string;
  title: string;
  titleKo: string;
  content: string;
  contentKo: string;
  excerpt: string;
  excerptKo: string;
  imageUrl: string;
  category: string;
  tags: string[];
  publishedAt: string | null;
  author: {
    id: string;
    name: string;
    nickname: string;
    imageUrl: string;
  };
}

interface BlogTabProps {
  lang?: string;
}

const CATEGORIES = [
  { key: "all", label: "All", labelKo: "전체" },
  { key: "guide", label: "Guide", labelKo: "가이드" },
  { key: "research", label: "Research", labelKo: "리서치" },
  { key: "news", label: "News", labelKo: "뉴스" },
  { key: "general", label: "General", labelKo: "일반" },
];

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}d ago`;
}

export default function BlogTab({ lang }: BlogTabProps) {
  const [articles, setArticles] = useState<BlogArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("all");
  const isKo = lang === "ko";

  useEffect(() => {
    setLoading(true);
    fetch(`/api/blog?category=${category}`)
      .then((res) => res.json())
      .then((data) => {
        setArticles(data.articles || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [category]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-5">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl bg-white/[0.03] border border-white/[0.06] overflow-hidden animate-pulse"
          >
            <div className="h-[180px] bg-white/[0.04]" />
            <div className="p-4 flex flex-col gap-3">
              <div className="h-3 w-20 rounded bg-white/[0.06]" />
              <div className="h-4 w-full rounded bg-white/[0.06]" />
              <div className="h-4 w-3/4 rounded bg-white/[0.06]" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Category filter */}
      <div className="flex gap-2 flex-wrap">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.key}
            onClick={() => setCategory(cat.key)}
            className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
              category === cat.key
                ? "bg-blue-600/25 text-blue-400 border border-blue-500/35"
                : "bg-white/[0.04] text-zinc-400 border border-white/[0.06] hover:bg-white/[0.08] hover:text-zinc-200"
            }`}
          >
            {isKo ? cat.labelKo : cat.label}
          </button>
        ))}
      </div>

      {articles.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="text-4xl">📝</div>
          <p className="text-zinc-400 text-sm">
            {isKo ? "아직 게시된 글이 없습니다" : "No articles published yet"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-5">
          {articles.map((article) => {
            const title = isKo && article.titleKo ? article.titleKo : article.title;
            const excerpt = isKo && article.excerptKo ? article.excerptKo : article.excerpt;
            const catLabel = CATEGORIES.find((c) => c.key === article.category);

            return (
              <a
                key={article.id}
                href={`/${lang || "en"}/blog/${article.id}`}
                className="community-card group relative flex flex-col rounded-xl bg-white/[0.03] border border-white/[0.06] overflow-hidden hover:border-indigo-500/25 hover:shadow-[0_0_25px_-5px_rgba(99,102,241,0.12)] transition-all duration-300"
              >
                {/* Category badge */}
                <div className="absolute top-3 right-3 z-10 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-indigo-500/15 text-indigo-400 border border-indigo-500/25">
                  {isKo ? catLabel?.labelKo : catLabel?.label}
                </div>

                {article.imageUrl && (
                  <div className="relative h-[180px] overflow-hidden">
                    <img
                      src={article.imageUrl}
                      alt={title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-transparent to-transparent" />
                  </div>
                )}

                <div className="flex flex-col gap-2.5 p-4 flex-1">
                  {article.publishedAt && (
                    <span className="text-[11px] text-zinc-500 font-mono">
                      {timeAgo(article.publishedAt)}
                    </span>
                  )}
                  <h3 className="text-sm font-semibold text-zinc-100 leading-snug line-clamp-2">
                    {title}
                  </h3>
                  {excerpt && (
                    <p className="text-xs text-zinc-500 line-clamp-2 flex-1">
                      {excerpt}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-auto pt-2">
                    <img
                      src={article.author.imageUrl}
                      alt=""
                      className="w-5 h-5 rounded-full"
                    />
                    <span className="text-xs text-zinc-500">
                      {article.author.nickname || article.author.name}
                    </span>
                  </div>
                  {article.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {article.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 text-[9px] font-mono uppercase tracking-wider rounded-full bg-white/[0.05] text-zinc-500 border border-white/[0.06]"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}
