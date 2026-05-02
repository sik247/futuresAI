"use client";

import { useState } from "react";

const POPULAR_PAIRS = [
  "BTCUSDT", "ETHUSDT", "SOLUSDT", "XRPUSDT", "BNBUSDT",
  "DOGEUSDT", "ADAUSDT", "AVAXUSDT", "DOTUSDT", "LINKUSDT",
];

export default function ResearchGenerator() {
  const [pair, setPair] = useState("BTCUSDT");
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    articleId?: string;
    title?: string;
    contentLength?: number;
    error?: string;
  } | null>(null);
  const [recentArticles, setRecentArticles] = useState<any[]>([]);
  const [loadingArticles, setLoadingArticles] = useState(false);

  const generate = async () => {
    setGenerating(true);
    setResult(null);
    try {
      const res = await fetch("/api/admin/generate-research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pair }),
      });
      const data = await res.json();
      setResult(data);
      if (data.success) loadArticles();
    } catch {
      setResult({ success: false, error: "Network error" });
    } finally {
      setGenerating(false);
    }
  };

  const loadArticles = async () => {
    setLoadingArticles(true);
    try {
      const res = await fetch("/api/blog?category=research&limit=10");
      const data = await res.json();
      if (Array.isArray(data)) setRecentArticles(data);
    } catch {}
    setLoadingArticles(false);
  };

  const downloadMarkdown = (article: any) => {
    // Convert HTML content to downloadable markdown-ish format
    const content = article.content
      .replace(/<h2>(.*?)<\/h2>/g, "\n## $1\n")
      .replace(/<h3>(.*?)<\/h3>/g, "\n### $1\n")
      .replace(/<strong>(.*?)<\/strong>/g, "**$1**")
      .replace(/<em>(.*?)<\/em>/g, "*$1*")
      .replace(/<li>(.*?)<\/li>/g, "- $1")
      .replace(/<\/?[^>]+>/g, "")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

    const blob = new Blob(
      [`# ${article.title}\n\n${article.excerpt}\n\n---\n\n${content}`],
      { type: "text/markdown" }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${article.title.replace(/[^a-zA-Z0-9]/g, "_").slice(0, 60)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-zinc-950 pt-24 sm:pt-28 pb-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-white">Deep Research Generator</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Generate institutional-grade research blog posts with live market data + FuturesAI model 1.0
          </p>
        </div>

        {/* Generate Form */}
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-6 space-y-5">
          <div>
            <label className="text-xs text-zinc-500 uppercase tracking-wider block mb-2">Trading Pair</label>
            <div className="flex flex-wrap gap-2 mb-3">
              {POPULAR_PAIRS.map((p) => (
                <button
                  key={p}
                  onClick={() => setPair(p)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                    pair === p
                      ? "bg-blue-600/25 text-blue-300 border-blue-500/40"
                      : "bg-white/[0.03] text-zinc-400 border-white/[0.06] hover:text-zinc-200 hover:bg-white/[0.06]"
                  }`}
                >
                  {p.replace("USDT", "")}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={pair}
              onChange={(e) => setPair(e.target.value.toUpperCase())}
              placeholder="e.g. BTCUSDT"
              className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-white/[0.08] text-sm text-white placeholder-zinc-600 focus:border-blue-500/40 focus:outline-none"
            />
          </div>

          <button
            onClick={generate}
            disabled={generating || !pair}
            className="px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold disabled:opacity-40 disabled:pointer-events-none transition-all flex items-center gap-2"
          >
            {generating ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Generating deep research... (1-2 min)
              </>
            ) : (
              "Generate Research Report"
            )}
          </button>

          {result && (
            <div className={`rounded-lg p-4 text-sm ${
              result.success
                ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                : "bg-red-500/10 border border-red-500/20 text-red-400"
            }`}>
              {result.success ? (
                <div>
                  <p className="font-semibold">Blog post created!</p>
                  <p className="text-xs mt-1 text-zinc-400">{result.title}</p>
                  <p className="text-xs text-zinc-500">{result.contentLength?.toLocaleString()} characters</p>
                </div>
              ) : (
                <p>Error: {result.error}</p>
              )}
            </div>
          )}
        </div>

        {/* Recent Research Articles */}
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
            <h2 className="text-sm font-semibold text-white">Research Articles</h2>
            <button
              onClick={loadArticles}
              className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
            >
              {loadingArticles ? "Loading..." : "Load Articles"}
            </button>
          </div>

          {recentArticles.length === 0 ? (
            <div className="px-6 py-8 text-center text-sm text-zinc-600">
              Click &quot;Load Articles&quot; to view research posts
            </div>
          ) : (
            <div className="divide-y divide-white/[0.04]">
              {recentArticles.map((a: any) => (
                <div key={a.id} className="px-6 py-3 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                  <div className="flex-1 min-w-0 mr-4">
                    <p className="text-sm text-white truncate">{a.title}</p>
                    <p className="text-[10px] text-zinc-600 mt-0.5">
                      {new Date(a.publishedAt || a.createdAt).toLocaleDateString()} · {a.tags?.join(", ")}
                    </p>
                  </div>
                  <button
                    onClick={() => downloadMarkdown(a)}
                    className="shrink-0 px-3 py-1.5 rounded-lg bg-white/[0.05] border border-white/[0.08] text-xs text-zinc-400 hover:text-white hover:bg-white/[0.10] transition-all"
                  >
                    Download
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
