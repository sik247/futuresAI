"use client";

import { useState, useEffect, useCallback } from "react";

interface UserResult {
  id: string;
  name: string;
  email: string;
  nickname: string;
}

interface NotifRow {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
  user: { name: string; email: string; nickname: string };
}

const TYPE_OPTIONS = [
  { value: "info", label: "Info", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  { value: "success", label: "Success", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
  { value: "warning", label: "Warning", color: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
  { value: "system", label: "System", color: "bg-purple-500/20 text-purple-400 border-purple-500/30" },
];

function getTypeStyle(type: string) {
  return TYPE_OPTIONS.find((t) => t.value === type)?.color || TYPE_OPTIONS[0].color;
}

export default function NotificationsAdmin() {
  /* ── Send form state ── */
  const [mode, setMode] = useState<"single" | "broadcast">("single");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState("info");
  const [userSearch, setUserSearch] = useState("");
  const [userResults, setUserResults] = useState<UserResult[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserResult | null>(null);
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<string | null>(null);

  /* ── History state ── */
  const [notifications, setNotifications] = useState<NotifRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loadingHistory, setLoadingHistory] = useState(true);

  /* ── User search (debounced) ── */
  useEffect(() => {
    if (userSearch.length < 2) { setUserResults([]); return; }
    const t = setTimeout(() => {
      fetch(`/api/admin/notifications?searchUsers=${encodeURIComponent(userSearch)}`)
        .then((r) => r.json())
        .then((d) => d.users && setUserResults(d.users))
        .catch(() => {});
    }, 300);
    return () => clearTimeout(t);
  }, [userSearch]);

  /* ── Load notification history ── */
  const loadHistory = useCallback(() => {
    setLoadingHistory(true);
    fetch(`/api/admin/notifications?page=${page}&limit=20`)
      .then((r) => r.json())
      .then((d) => {
        setNotifications(d.notifications || []);
        setTotal(d.total || 0);
      })
      .catch(() => {})
      .finally(() => setLoadingHistory(false));
  }, [page]);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  /* ── Send notification ── */
  const handleSend = async () => {
    if (!title.trim() || !message.trim()) return;
    if (mode === "single" && !selectedUser) return;

    if (mode === "broadcast" && !confirm("Send this notification to ALL users?")) return;

    setSending(true);
    setSendResult(null);
    try {
      const res = await fetch("/api/admin/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          message: message.trim(),
          type,
          ...(mode === "broadcast" ? { broadcast: true } : { userId: selectedUser!.id }),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSendResult(mode === "broadcast" ? `Sent to ${data.sent} users` : `Sent to ${selectedUser!.name}`);
        setTitle("");
        setMessage("");
        setSelectedUser(null);
        setUserSearch("");
        loadHistory();
      } else {
        setSendResult(`Error: ${data.error}`);
      }
    } catch {
      setSendResult("Failed to send");
    } finally {
      setSending(false);
    }
  };

  const totalPages = Math.ceil(total / 20);

  return (
    <div className="min-h-screen bg-zinc-950 pt-24 sm:pt-28 pb-24">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-white">Notifications</h1>
          <p className="text-sm text-zinc-500 mt-1">Send alerts & messages to users</p>
        </div>

        {/* ── Send Form ── */}
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-6 space-y-5">
          <div className="flex items-center gap-1 text-sm">
            <span className="text-zinc-500 mr-2">To:</span>
            <button
              onClick={() => { setMode("single"); setSelectedUser(null); }}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                mode === "single"
                  ? "bg-blue-600 text-white"
                  : "bg-white/[0.05] text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Single User
            </button>
            <button
              onClick={() => setMode("broadcast")}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                mode === "broadcast"
                  ? "bg-blue-600 text-white"
                  : "bg-white/[0.05] text-zinc-400 hover:text-zinc-200"
              }`}
            >
              All Users
            </button>
          </div>

          {/* User search (single mode) */}
          {mode === "single" && (
            <div className="relative">
              {selectedUser ? (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-600/10 border border-blue-500/20">
                  <span className="text-sm text-white">{selectedUser.name}</span>
                  <span className="text-xs text-zinc-500">{selectedUser.email}</span>
                  {selectedUser.nickname && (
                    <span className="text-xs text-zinc-600">({selectedUser.nickname})</span>
                  )}
                  <button
                    onClick={() => { setSelectedUser(null); setUserSearch(""); }}
                    className="ml-auto text-xs text-zinc-500 hover:text-white"
                  >
                    Change
                  </button>
                </div>
              ) : (
                <>
                  <input
                    type="text"
                    placeholder="Search by name, email, or nickname..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-white/[0.08] text-sm text-white placeholder-zinc-600 focus:border-blue-500/40 focus:outline-none transition-colors"
                  />
                  {userResults.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 rounded-lg border border-white/[0.08] bg-zinc-900/95 backdrop-blur-xl shadow-2xl z-50 max-h-48 overflow-y-auto">
                      {userResults.map((u) => (
                        <button
                          key={u.id}
                          onClick={() => { setSelectedUser(u); setUserResults([]); setUserSearch(""); }}
                          className="w-full text-left px-3 py-2 hover:bg-white/[0.05] transition-colors flex items-center gap-2"
                        >
                          <span className="text-sm text-white">{u.name}</span>
                          <span className="text-xs text-zinc-500">{u.email}</span>
                          {u.nickname && <span className="text-xs text-zinc-600">({u.nickname})</span>}
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Type selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-500">Type:</span>
            {TYPE_OPTIONS.map((t) => (
              <button
                key={t.value}
                onClick={() => setType(t.value)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                  type === t.value ? t.color : "bg-white/[0.03] text-zinc-500 border-transparent hover:text-zinc-300"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Title */}
          <input
            type="text"
            placeholder="Notification title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-white/[0.08] text-sm text-white placeholder-zinc-600 focus:border-blue-500/40 focus:outline-none transition-colors"
          />

          {/* Message */}
          <textarea
            placeholder="Notification message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-white/[0.08] text-sm text-white placeholder-zinc-600 focus:border-blue-500/40 focus:outline-none transition-colors resize-none"
          />

          {/* Send */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleSend}
              disabled={sending || !title.trim() || !message.trim() || (mode === "single" && !selectedUser)}
              className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium disabled:opacity-40 disabled:pointer-events-none transition-all"
            >
              {sending ? "Sending..." : mode === "broadcast" ? "Send to All" : "Send"}
            </button>
            {sendResult && (
              <span className={`text-sm ${sendResult.startsWith("Error") ? "text-red-400" : "text-emerald-400"}`}>
                {sendResult}
              </span>
            )}
          </div>
        </div>

        {/* ── History ── */}
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
          <div className="px-6 py-4 border-b border-white/[0.06] flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">Sent Notifications</h2>
            <span className="text-xs text-zinc-600">{total} total</span>
          </div>

          {loadingHistory ? (
            <div className="px-6 py-8 text-center text-sm text-zinc-600">Loading...</div>
          ) : notifications.length === 0 ? (
            <div className="px-6 py-8 text-center text-sm text-zinc-600">No notifications sent yet</div>
          ) : (
            <div className="divide-y divide-white/[0.04]">
              {notifications.map((n) => (
                <div key={n.id} className="px-6 py-3 flex items-start gap-4 hover:bg-white/[0.02] transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${getTypeStyle(n.type)}`}>
                        {n.type}
                      </span>
                      <span className="text-sm font-medium text-white truncate">{n.title}</span>
                    </div>
                    <p className="text-xs text-zinc-400 truncate">{n.message}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-zinc-600">
                        To: {n.user.name} ({n.user.email})
                      </span>
                      <span className={`w-1.5 h-1.5 rounded-full ${n.read ? "bg-zinc-600" : "bg-emerald-500"}`} />
                      <span className="text-[10px] text-zinc-700">
                        {new Date(n.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-3 border-t border-white/[0.06] flex items-center justify-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-3 py-1 rounded text-xs text-zinc-400 hover:text-white disabled:opacity-30 transition-colors"
              >
                Prev
              </button>
              <span className="text-xs text-zinc-600">{page} / {totalPages}</span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1 rounded text-xs text-zinc-400 hover:text-white disabled:opacity-30 transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
