"use client";

import { useState, useEffect, useCallback } from "react";

interface ContentItem {
  id: string;
  type: "tweet" | "youtube" | "news" | "short";
  title: string;
  titleKo?: string;
  description?: string;
  descriptionKo?: string;
  sourceUrl: string;
  sourceName: string;
  status: "pending" | "translated" | "published" | "archived";
  publishedAt?: string;
  createdAt: string;
}

interface ContentStats {
  total: number;
  pending: number;
  translated: number;
  published: number;
}

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  pending: { label: "Pending", bg: "bg-amber-500/10", text: "text-amber-400", dot: "bg-amber-400" },
  translated: { label: "Translated", bg: "bg-blue-500/10", text: "text-blue-400", dot: "bg-blue-400" },
  published: { label: "Published", bg: "bg-emerald-500/10", text: "text-emerald-400", dot: "bg-emerald-400" },
  archived: { label: "Archived", bg: "bg-zinc-500/10", text: "text-zinc-400", dot: "bg-zinc-400" },
};

const TYPE_CONFIG: Record<string, { label: string; color: string }> = {
  tweet: { label: "Tweet", color: "bg-blue-500/15 text-blue-400 border-blue-500/30" },
  youtube: { label: "YouTube", color: "bg-red-500/15 text-red-400 border-red-500/30" },
  news: { label: "News", color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
  short: { label: "Short", color: "bg-purple-500/15 text-purple-400 border-purple-500/30" },
};

type PipelineAction = "run-pipeline" | "aggregate" | "translate" | "publish";

function StatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}

function TypeBadge({ type }: { type: string }) {
  const config = TYPE_CONFIG[type] || TYPE_CONFIG.news;
  return (
    <span className={`text-[10px] font-medium uppercase tracking-wider px-2.5 py-1 rounded-full border ${config.color}`}>
      {config.label}
    </span>
  );
}

export default function ContentBotClient() {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [stats, setStats] = useState<ContentStats>({ total: 0, pending: 0, translated: 0, published: 0 });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [botActive, setBotActive] = useState(false);

  const fetchContent = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/content-bot?limit=50&status=all");
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
        setStats(data.stats || { total: 0, pending: 0, translated: 0, published: 0 });
        setBotActive(data.botActive ?? false);
      }
    } catch {
      // keep previous data
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  async function runAction(action: PipelineAction) {
    setActionLoading(action);
    try {
      const res = await fetch("/api/content-bot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        await fetchContent();
      }
    } catch {
      // silently fail
    } finally {
      setActionLoading(null);
    }
  }

  async function handlePublish(id: string) {
    setActionLoading(`publish-${id}`);
    try {
      const res = await fetch("/api/content-bot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "publish-item", id }),
      });
      if (res.ok) await fetchContent();
    } catch {
      // silently fail
    } finally {
      setActionLoading(null);
    }
  }

  async function handleArchive(id: string) {
    setActionLoading(`archive-${id}`);
    try {
      const res = await fetch("/api/content-bot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "archive-item", id }),
      });
      if (res.ok) await fetchContent();
    } catch {
      // silently fail
    } finally {
      setActionLoading(null);
    }
  }

  const STATS_CARDS = [
    {
      label: "Total Content",
      value: stats.total,
      icon: (
        <svg className="w-5 h-5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
        </svg>
      ),
    },
    {
      label: "Pending Translation",
      value: stats.pending,
      icon: (
        <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      label: "Translated",
      value: stats.translated,
      icon: (
        <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 21l5.25-11.25L21 21m-9-3h7.5M3 5.621a48.474 48.474 0 016-.371m0 0c1.12 0 2.233.038 3.334.114M9 5.25V3m3.334 2.364C11.176 10.658 7.69 15.08 3 17.502m9.334-12.138c.896.061 1.785.147 2.666.257m-4.589 8.495a18.023 18.023 0 01-3.827-5.802" />
        </svg>
      ),
    },
    {
      label: "Published",
      value: stats.published,
      icon: (
        <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
  ];

  const ACTION_BUTTONS: { label: string; action: PipelineAction; color: string }[] = [
    { label: "Run Full Pipeline", action: "run-pipeline", color: "bg-blue-600 hover:bg-blue-500 text-white" },
    { label: "Aggregate Only", action: "aggregate", color: "bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700" },
    { label: "Translate Only", action: "translate", color: "bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700" },
    { label: "Publish All", action: "publish", color: "bg-emerald-600/80 hover:bg-emerald-600 text-white" },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-24 pb-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-10">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">Content Bot Manager</h1>
              <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${botActive ? "bg-emerald-500/10 text-emerald-400" : "bg-zinc-800 text-zinc-500"}`}>
                <span className={`relative flex h-1.5 w-1.5`}>
                  {botActive && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />}
                  <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${botActive ? "bg-emerald-400" : "bg-zinc-600"}`} />
                </span>
                {botActive ? "Active" : "Inactive"}
              </div>
            </div>
            <p className="text-zinc-500 text-sm mt-1">
              Automated content aggregation, translation, and publishing pipeline
            </p>
          </div>
          <button
            onClick={fetchContent}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-zinc-700 bg-zinc-900 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-white disabled:opacity-50"
          >
            {loading ? (
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" className="opacity-25" />
                <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            )}
            Refresh
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 mb-8">
          {ACTION_BUTTONS.map((btn) => (
            <button
              key={btn.action}
              onClick={() => runAction(btn.action)}
              disabled={actionLoading === btn.action}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 disabled:opacity-50 ${btn.color}`}
            >
              {actionLoading === btn.action && (
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" className="opacity-25" />
                  <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              )}
              {btn.label}
            </button>
          ))}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {STATS_CARDS.map((card) => (
            <div
              key={card.label}
              className="rounded-xl border border-zinc-800 bg-zinc-900/50 backdrop-blur-sm p-5 transition-colors duration-200 hover:border-zinc-700/80"
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-zinc-500 uppercase tracking-wider font-medium">
                  {card.label}
                </p>
                {card.icon}
              </div>
              <p className="text-2xl font-bold font-mono tabular-nums text-white">
                {loading && !items.length ? (
                  <span className="inline-block h-7 w-12 rounded bg-zinc-800 animate-pulse" />
                ) : (
                  card.value
                )}
              </p>
            </div>
          ))}
        </div>

        {/* Content Table (Desktop) */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
          <div className="px-6 py-4 border-b border-zinc-800">
            <h2 className="text-sm font-semibold text-zinc-300">Content Items</h2>
          </div>

          {loading && !items.length ? (
            <div className="animate-pulse">
              <div className="border-b border-zinc-800 px-6 py-3 flex gap-6">
                {[60, 120, 100, 80, 60, 80, 60].map((w, i) => (
                  <div key={i} className="h-3 rounded bg-zinc-800" style={{ width: `${w}px` }} />
                ))}
              </div>
              {[0, 1, 2, 3, 4].map((i) => (
                <div key={i} className="border-b border-zinc-800/50 px-6 py-4 flex items-center gap-6">
                  <div className="h-5 w-16 rounded-full bg-zinc-800" />
                  <div className="h-4 w-32 rounded bg-zinc-800" />
                  <div className="h-4 w-28 rounded bg-zinc-800" />
                  <div className="h-4 w-20 rounded bg-zinc-800" />
                  <div className="h-5 w-20 rounded-full bg-zinc-800" />
                  <div className="h-4 w-16 rounded bg-zinc-800" />
                  <div className="h-4 w-20 rounded bg-zinc-800" />
                </div>
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="flex items-center justify-center py-16 text-zinc-600 text-sm">
              No content items found. Run the pipeline to aggregate content.
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-800">
                      <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Title</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Korean Title</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Source</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Published</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => (
                      <tr key={item.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors">
                        <td className="px-6 py-4">
                          <TypeBadge type={item.type} />
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-zinc-200 max-w-[200px] truncate block text-sm" title={item.title}>
                            {item.title}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-zinc-400 max-w-[200px] truncate block text-sm" title={item.titleKo}>
                            {item.titleKo || <span className="text-zinc-600 italic">Not translated</span>}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-zinc-400 text-xs">{item.sourceName}</td>
                        <td className="px-6 py-4">
                          <StatusBadge status={item.status} />
                        </td>
                        <td className="px-6 py-4 text-zinc-400 text-xs">
                          {item.publishedAt
                            ? new Date(item.publishedAt).toLocaleDateString()
                            : <span className="text-zinc-600">--</span>
                          }
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {item.status === "translated" && (
                              <button
                                onClick={() => handlePublish(item.id)}
                                disabled={actionLoading === `publish-${item.id}`}
                                className="px-3 py-1.5 rounded-lg bg-emerald-600/20 text-emerald-400 text-xs font-medium hover:bg-emerald-600/30 transition-colors disabled:opacity-50"
                              >
                                {actionLoading === `publish-${item.id}` ? "..." : "Publish"}
                              </button>
                            )}
                            {item.status !== "archived" && (
                              <button
                                onClick={() => handleArchive(item.id)}
                                disabled={actionLoading === `archive-${item.id}`}
                                className="px-3 py-1.5 rounded-lg bg-zinc-700/30 text-zinc-400 text-xs font-medium hover:bg-zinc-700/50 transition-colors disabled:opacity-50"
                              >
                                Archive
                              </button>
                            )}
                            <a
                              href={item.sourceUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-1.5 rounded-lg bg-zinc-700/30 text-zinc-400 text-xs font-medium hover:bg-zinc-700/50 hover:text-zinc-200 transition-colors"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                              </svg>
                            </a>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card List */}
              <div className="lg:hidden divide-y divide-zinc-800/50">
                {items.map((item) => (
                  <div key={item.id} className="px-4 py-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <TypeBadge type={item.type} />
                      <StatusBadge status={item.status} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-zinc-200 line-clamp-2">{item.title}</p>
                      {item.titleKo && (
                        <p className="text-xs text-zinc-500 mt-1 line-clamp-1">{item.titleKo}</p>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-zinc-600">{item.sourceName}</span>
                      <div className="flex items-center gap-2">
                        {item.status === "translated" && (
                          <button
                            onClick={() => handlePublish(item.id)}
                            disabled={actionLoading === `publish-${item.id}`}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600/20 text-emerald-400 text-xs font-medium hover:bg-emerald-600/30 transition-colors disabled:opacity-50"
                          >
                            Publish
                          </button>
                        )}
                        {item.status !== "archived" && (
                          <button
                            onClick={() => handleArchive(item.id)}
                            disabled={actionLoading === `archive-${item.id}`}
                            className="px-3 py-1.5 rounded-lg bg-zinc-700/30 text-zinc-400 text-xs font-medium hover:bg-zinc-700/50 transition-colors disabled:opacity-50"
                          >
                            Archive
                          </button>
                        )}
                        <a
                          href={item.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 rounded-lg bg-zinc-700/30 text-zinc-400 text-xs font-medium hover:bg-zinc-700/50 transition-colors"
                        >
                          View
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
