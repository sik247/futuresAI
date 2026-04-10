"use client";

import { useState, useEffect } from "react";

type TradingProfile = {
  experience?: "beginner" | "intermediate" | "advanced" | "pro";
  riskAppetite?: "conservative" | "moderate" | "aggressive" | "degen";
  style?: "scalper" | "day_trader" | "swing_trader" | "position_trader" | "hodler";
  preferredTimeframes?: string[];
  preferredAssets?: string[];
  avgPositionSize?: string;
  leverage?: "none" | "low" | "medium" | "high";
  goals?: string;
  notes?: string;
};

interface Props {
  open: boolean;
  onClose: () => void;
  ko: boolean;
}

const TIMEFRAMES = ["1m", "5m", "15m", "1h", "4h", "1d", "1w"];
const COMMON_ASSETS = ["BTC", "ETH", "SOL", "XRP", "BNB", "DOGE", "ADA", "AVAX", "LINK", "DOT"];

export default function TradingProfileModal({ open, onClose, ko }: Props) {
  const [profile, setProfile] = useState<TradingProfile>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetch("/api/user/trading-profile")
      .then((r) => r.json())
      .then((data) => {
        setProfile(data.profile || {});
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [open]);

  async function handleSave() {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/user/trading-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });
      if (res.ok) {
        setMessage(ko ? "저장되었습니다" : "Saved successfully");
        setTimeout(() => {
          setMessage(null);
          onClose();
        }, 1000);
      } else {
        setMessage(ko ? "저장 실패" : "Failed to save");
      }
    } catch {
      setMessage(ko ? "네트워크 오류" : "Network error");
    } finally {
      setSaving(false);
    }
  }

  function toggleTimeframe(tf: string) {
    const current = profile.preferredTimeframes || [];
    setProfile({
      ...profile,
      preferredTimeframes: current.includes(tf) ? current.filter((t) => t !== tf) : [...current, tf],
    });
  }

  function toggleAsset(asset: string) {
    const current = profile.preferredAssets || [];
    setProfile({
      ...profile,
      preferredAssets: current.includes(asset) ? current.filter((a) => a !== asset) : [...current, asset],
    });
  }

  if (!open) return null;

  const experienceOpts: { value: NonNullable<TradingProfile["experience"]>; labelKo: string; labelEn: string }[] = [
    { value: "beginner", labelKo: "초보자", labelEn: "Beginner" },
    { value: "intermediate", labelKo: "중급자", labelEn: "Intermediate" },
    { value: "advanced", labelKo: "고급자", labelEn: "Advanced" },
    { value: "pro", labelKo: "전문가", labelEn: "Pro" },
  ];

  const riskOpts: { value: NonNullable<TradingProfile["riskAppetite"]>; labelKo: string; labelEn: string; color: string }[] = [
    { value: "conservative", labelKo: "보수적", labelEn: "Conservative", color: "emerald" },
    { value: "moderate", labelKo: "중도", labelEn: "Moderate", color: "blue" },
    { value: "aggressive", labelKo: "공격적", labelEn: "Aggressive", color: "orange" },
    { value: "degen", labelKo: "하이리스크", labelEn: "Degen", color: "red" },
  ];

  const styleOpts: { value: NonNullable<TradingProfile["style"]>; labelKo: string; labelEn: string }[] = [
    { value: "scalper", labelKo: "스캘퍼", labelEn: "Scalper" },
    { value: "day_trader", labelKo: "데이트레이더", labelEn: "Day Trader" },
    { value: "swing_trader", labelKo: "스윙트레이더", labelEn: "Swing Trader" },
    { value: "position_trader", labelKo: "포지션트레이더", labelEn: "Position Trader" },
    { value: "hodler", labelKo: "홀더", labelEn: "HODLer" },
  ];

  const leverageOpts: { value: NonNullable<TradingProfile["leverage"]>; labelKo: string; labelEn: string }[] = [
    { value: "none", labelKo: "없음 (현물)", labelEn: "None (spot)" },
    { value: "low", labelKo: "낮음 (1-5x)", labelEn: "Low (1-5x)" },
    { value: "medium", labelKo: "중간 (5-20x)", labelEn: "Medium (5-20x)" },
    { value: "high", labelKo: "높음 (20x+)", labelEn: "High (20x+)" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-zinc-950 border border-white/[0.08] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-zinc-950 border-b border-white/[0.06] px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-lg font-bold text-white">
              {ko ? "트레이딩 프로필" : "Trading Profile"}
            </h2>
            <p className="text-[11px] text-zinc-500 mt-0.5">
              {ko ? "AI가 귀하의 성향에 맞춰 분석합니다" : "AI will tailor analysis to your style"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-white/[0.06] text-zinc-400 hover:text-white flex items-center justify-center transition-colors"
          >
            ✕
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center text-zinc-500 text-sm">
            {ko ? "불러오는 중..." : "Loading..."}
          </div>
        ) : (
          <div className="p-6 space-y-5">
            {/* Experience */}
            <div>
              <label className="text-[11px] font-mono uppercase tracking-wider text-zinc-500 block mb-2">
                {ko ? "경험 수준" : "Experience Level"}
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {experienceOpts.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setProfile({ ...profile, experience: opt.value })}
                    className={`px-2 py-2 rounded-lg border text-xs font-medium transition-colors ${
                      profile.experience === opt.value
                        ? "border-blue-500/50 bg-blue-500/10 text-blue-300"
                        : "border-white/[0.08] bg-white/[0.02] text-zinc-400 hover:border-white/[0.15]"
                    }`}
                  >
                    {ko ? opt.labelKo : opt.labelEn}
                  </button>
                ))}
              </div>
            </div>

            {/* Risk Appetite */}
            <div>
              <label className="text-[11px] font-mono uppercase tracking-wider text-zinc-500 block mb-2">
                {ko ? "리스크 성향" : "Risk Appetite"}
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {riskOpts.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setProfile({ ...profile, riskAppetite: opt.value })}
                    className={`px-2 py-2 rounded-lg border text-xs font-medium transition-colors ${
                      profile.riskAppetite === opt.value
                        ? `border-${opt.color}-500/50 bg-${opt.color}-500/10 text-${opt.color}-300`
                        : "border-white/[0.08] bg-white/[0.02] text-zinc-400 hover:border-white/[0.15]"
                    }`}
                  >
                    {ko ? opt.labelKo : opt.labelEn}
                  </button>
                ))}
              </div>
            </div>

            {/* Trading Style */}
            <div>
              <label className="text-[11px] font-mono uppercase tracking-wider text-zinc-500 block mb-2">
                {ko ? "트레이딩 스타일" : "Trading Style"}
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                {styleOpts.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setProfile({ ...profile, style: opt.value })}
                    className={`px-2 py-2 rounded-lg border text-[11px] font-medium transition-colors ${
                      profile.style === opt.value
                        ? "border-purple-500/50 bg-purple-500/10 text-purple-300"
                        : "border-white/[0.08] bg-white/[0.02] text-zinc-400 hover:border-white/[0.15]"
                    }`}
                  >
                    {ko ? opt.labelKo : opt.labelEn}
                  </button>
                ))}
              </div>
            </div>

            {/* Preferred Timeframes */}
            <div>
              <label className="text-[11px] font-mono uppercase tracking-wider text-zinc-500 block mb-2">
                {ko ? "선호 타임프레임" : "Preferred Timeframes"}
              </label>
              <div className="flex flex-wrap gap-1.5">
                {TIMEFRAMES.map((tf) => {
                  const selected = profile.preferredTimeframes?.includes(tf);
                  return (
                    <button
                      key={tf}
                      onClick={() => toggleTimeframe(tf)}
                      className={`px-3 py-1.5 rounded-full border text-xs font-mono transition-colors ${
                        selected
                          ? "border-cyan-500/50 bg-cyan-500/10 text-cyan-300"
                          : "border-white/[0.08] bg-white/[0.02] text-zinc-400 hover:border-white/[0.15]"
                      }`}
                    >
                      {tf}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Preferred Assets */}
            <div>
              <label className="text-[11px] font-mono uppercase tracking-wider text-zinc-500 block mb-2">
                {ko ? "관심 자산" : "Preferred Assets"}
              </label>
              <div className="flex flex-wrap gap-1.5">
                {COMMON_ASSETS.map((a) => {
                  const selected = profile.preferredAssets?.includes(a);
                  return (
                    <button
                      key={a}
                      onClick={() => toggleAsset(a)}
                      className={`px-3 py-1.5 rounded-full border text-xs font-mono font-semibold transition-colors ${
                        selected
                          ? "border-amber-500/50 bg-amber-500/10 text-amber-300"
                          : "border-white/[0.08] bg-white/[0.02] text-zinc-400 hover:border-white/[0.15]"
                      }`}
                    >
                      {a}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Position Size */}
            <div>
              <label className="text-[11px] font-mono uppercase tracking-wider text-zinc-500 block mb-2">
                {ko ? "평균 포지션 크기" : "Avg Position Size"}
              </label>
              <input
                type="text"
                value={profile.avgPositionSize || ""}
                onChange={(e) => setProfile({ ...profile, avgPositionSize: e.target.value })}
                placeholder={ko ? "예: $100-500, $1k-10k" : "e.g. $100-500, $1k-10k"}
                maxLength={50}
                className="w-full bg-white/[0.02] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-blue-500/50"
              />
            </div>

            {/* Leverage */}
            <div>
              <label className="text-[11px] font-mono uppercase tracking-wider text-zinc-500 block mb-2">
                {ko ? "레버리지" : "Leverage"}
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {leverageOpts.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setProfile({ ...profile, leverage: opt.value })}
                    className={`px-2 py-2 rounded-lg border text-[11px] font-medium transition-colors ${
                      profile.leverage === opt.value
                        ? "border-rose-500/50 bg-rose-500/10 text-rose-300"
                        : "border-white/[0.08] bg-white/[0.02] text-zinc-400 hover:border-white/[0.15]"
                    }`}
                  >
                    {ko ? opt.labelKo : opt.labelEn}
                  </button>
                ))}
              </div>
            </div>

            {/* Goals */}
            <div>
              <label className="text-[11px] font-mono uppercase tracking-wider text-zinc-500 block mb-2">
                {ko ? "트레이딩 목표" : "Trading Goals"}
              </label>
              <textarea
                value={profile.goals || ""}
                onChange={(e) => setProfile({ ...profile, goals: e.target.value })}
                placeholder={ko ? "예: 장기 자산 증식, 월 수익 10% 목표" : "e.g. long-term wealth building, 10% monthly returns"}
                maxLength={500}
                rows={2}
                className="w-full bg-white/[0.02] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-blue-500/50 resize-none"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="text-[11px] font-mono uppercase tracking-wider text-zinc-500 block mb-2">
                {ko ? "추가 메모 (AI가 기억할 내용)" : "Additional Notes (AI will remember)"}
              </label>
              <textarea
                value={profile.notes || ""}
                onChange={(e) => setProfile({ ...profile, notes: e.target.value })}
                placeholder={ko ? "AI가 모든 대화에서 기억해야 할 정보" : "Anything the AI should remember across all chats"}
                maxLength={1000}
                rows={3}
                className="w-full bg-white/[0.02] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-blue-500/50 resize-none"
              />
            </div>

            {message && (
              <div className="text-xs text-center text-emerald-400 font-mono">{message}</div>
            )}

            {/* Save button */}
            <div className="flex gap-2 pt-2 border-t border-white/[0.06]">
              <button
                onClick={onClose}
                className="flex-1 py-2.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-zinc-300 text-sm font-semibold transition-colors"
              >
                {ko ? "취소" : "Cancel"}
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-sm font-semibold transition-colors"
              >
                {saving ? (ko ? "저장 중..." : "Saving...") : (ko ? "저장" : "Save")}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
