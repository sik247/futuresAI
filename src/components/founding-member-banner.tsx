"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

type Status = {
  telegramId: string | null;
  telegramUsername: string | null;
  realEmail: string | null;
  inviteNumber: number | null;
  isFounding100: boolean;
  foundingCount: number;
  foundingSlotsLeft: number;
  needsTelegram: boolean;
  needsEmail: boolean;
};

export default function FoundingMemberBanner({ ko }: { ko: boolean }) {
  const { status: sessionStatus } = useSession();
  const [status, setStatus] = useState<Status | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [open, setOpen] = useState(false);
  const [telegramIdInput, setTelegramIdInput] = useState("");
  const [telegramUsernameInput, setTelegramUsernameInput] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (sessionStatus !== "authenticated") return;
    if (typeof window !== "undefined" && sessionStorage.getItem("founding-banner-dismissed") === "true") {
      setDismissed(true);
      return;
    }
    fetch("/api/user/link-contact")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => data && setStatus(data))
      .catch(() => {});
  }, [sessionStatus]);

  if (sessionStatus !== "authenticated" || !status || dismissed) return null;
  // Hide if already a founding member and all fields are linked
  if (status.isFounding100 && !status.needsTelegram && !status.needsEmail) return null;
  // Hide if slots are full and user isn't a founder
  if (status.foundingSlotsLeft === 0 && !status.isFounding100) return null;

  const handleSubmit = async () => {
    setSubmitting(true);
    setMessage(null);
    try {
      const body: Record<string, string> = {};
      if (status.needsTelegram && telegramIdInput) {
        body.telegramId = telegramIdInput.trim();
        if (telegramUsernameInput) body.telegramUsername = telegramUsernameInput.trim();
      }
      if (status.needsEmail && emailInput) {
        body.realEmail = emailInput.trim();
      }

      const res = await fetch("/api/user/link-contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: "error", text: data.error || (ko ? "오류가 발생했습니다" : "Something went wrong") });
      } else {
        setMessage({
          type: "success",
          text: data.foundingAssignedJustNow
            ? ko
              ? `축하합니다! Founding Member #${data.inviteNumber} 획득!`
              : `Congrats! You're Founding Member #${data.inviteNumber}!`
            : ko
            ? "연락처가 업데이트되었습니다"
            : "Contact info updated",
        });
        setTimeout(() => {
          // Refresh status
          fetch("/api/user/link-contact")
            .then((r) => r.json())
            .then((d) => setStatus(d));
          setOpen(false);
        }, 2000);
      }
    } catch {
      setMessage({ type: "error", text: ko ? "오류가 발생했습니다" : "Something went wrong" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    if (typeof window !== "undefined") sessionStorage.setItem("founding-banner-dismissed", "true");
  };

  return (
    <>
      {/* Banner */}
      <div className="bg-gradient-to-r from-amber-500/10 via-blue-500/10 to-purple-500/10 border-b border-amber-500/20">
        <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20 shrink-0">
              {ko ? "한정" : "Limited"}
            </span>
            <p className="text-xs sm:text-sm text-zinc-200 truncate">
              {status.isFounding100 ? (
                <>
                  <span className="font-semibold text-amber-400">
                    {ko ? `Founding Member #${status.inviteNumber}` : `Founding Member #${status.inviteNumber}`}
                  </span>
                  {" · "}
                  {ko ? "연락처를 완성해주세요" : "Complete your contact info"}
                </>
              ) : (
                <>
                  <span className="font-semibold text-white">
                    {ko
                      ? `첫 100명 Founding Members · ${status.foundingSlotsLeft}자리 남음`
                      : `First 100 Founding Members · ${status.foundingSlotsLeft} slots left`}
                  </span>
                  {" · "}
                  {ko ? "초대 & 독점 리서치 받기" : "Get invites & exclusive research"}
                </>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setOpen(true)}
              className="text-xs sm:text-sm font-semibold px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-900 transition-colors"
            >
              {ko ? "참여하기" : "Join"}
            </button>
            <button
              onClick={handleDismiss}
              className="text-zinc-500 hover:text-zinc-300 p-1"
              aria-label="dismiss"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Modal */}
      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-zinc-900 border border-white/[0.08] rounded-2xl p-6 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-5">
              <h2 className="text-lg font-bold text-white">
                {ko ? "Founding 100 멤버 가입" : "Join Founding 100"}
              </h2>
              <p className="text-sm text-zinc-400 mt-1">
                {ko
                  ? "연락처를 연결하면 독점 리서치 포스트, 초대 프로그램 및 프리미엄 혜택을 받습니다."
                  : "Link your contacts to receive exclusive research posts, invites, and premium perks."}
              </p>
              <p className="text-xs text-amber-400 mt-2">
                {status.foundingSlotsLeft}/{100} {ko ? "자리 남음" : "slots remaining"}
              </p>
            </div>

            <div className="space-y-4">
              {status.needsTelegram && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                      {ko ? "Telegram ID (숫자)" : "Telegram ID (numeric)"}
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={telegramIdInput}
                      onChange={(e) => setTelegramIdInput(e.target.value)}
                      placeholder="123456789"
                      className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-amber-500/50"
                    />
                    <p className="text-[10px] text-zinc-500 mt-1">
                      {ko
                        ? "Telegram에서 @userinfobot 에게 메시지 보내면 ID를 알려줍니다"
                        : "Message @userinfobot on Telegram to get your ID"}
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                      {ko ? "Telegram 사용자명 (선택)" : "Telegram Username (optional)"}
                    </label>
                    <input
                      type="text"
                      value={telegramUsernameInput}
                      onChange={(e) => setTelegramUsernameInput(e.target.value)}
                      placeholder="@yourusername"
                      className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-amber-500/50"
                    />
                  </div>
                </>
              )}
              {status.needsEmail && (
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                    {ko ? "이메일 (리서치 포스트 수신용)" : "Email (for research posts)"}
                  </label>
                  <input
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-amber-500/50"
                  />
                </div>
              )}
            </div>

            {message && (
              <div
                className={`mt-4 p-3 rounded-lg text-sm ${
                  message.type === "success"
                    ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-300"
                    : "bg-red-500/10 border border-red-500/20 text-red-300"
                }`}
              >
                {message.text}
              </div>
            )}

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setOpen(false)}
                className="flex-1 py-2.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-zinc-300 text-sm font-medium transition-colors"
              >
                {ko ? "나중에" : "Later"}
              </button>
              <button
                onClick={handleSubmit}
                disabled={
                  submitting ||
                  (status.needsTelegram && !telegramIdInput) ||
                  (status.needsEmail && !emailInput)
                }
                className="flex-1 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:bg-amber-500/30 disabled:cursor-not-allowed text-zinc-900 text-sm font-semibold transition-colors"
              >
                {submitting ? (ko ? "저장 중..." : "Saving...") : ko ? "참여하기" : "Join"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
