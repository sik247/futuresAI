/**
 * TradingProfile types and utilities.
 * Used as memory/context for the agentic chat framework.
 */

export type TradingProfile = {
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

/**
 * Build a system prompt snippet from the trading profile.
 * Used by the chat API to inject user context into every conversation.
 */
export function formatProfileForPrompt(
  profile: TradingProfile | null | undefined,
  lang: "ko" | "en" = "en"
): string {
  if (!profile || Object.keys(profile).length === 0) return "";

  const parts: string[] = [];

  if (lang === "ko") {
    if (profile.experience) {
      const expMap = { beginner: "초보자", intermediate: "중급자", advanced: "고급자", pro: "전문가" };
      parts.push(`경험 수준: ${expMap[profile.experience]}`);
    }
    if (profile.riskAppetite) {
      const riskMap = { conservative: "보수적", moderate: "중도", aggressive: "공격적", degen: "하이리스크" };
      parts.push(`리스크 성향: ${riskMap[profile.riskAppetite]}`);
    }
    if (profile.style) {
      const styleMap = { scalper: "스캘퍼", day_trader: "데이트레이더", swing_trader: "스윙트레이더", position_trader: "포지션트레이더", hodler: "홀더" };
      parts.push(`트레이딩 스타일: ${styleMap[profile.style]}`);
    }
    if (profile.preferredTimeframes?.length) parts.push(`선호 타임프레임: ${profile.preferredTimeframes.join(", ")}`);
    if (profile.preferredAssets?.length) parts.push(`관심 자산: ${profile.preferredAssets.join(", ")}`);
    if (profile.avgPositionSize) parts.push(`평균 포지션 크기: ${profile.avgPositionSize}`);
    if (profile.leverage) {
      const levMap = { none: "없음 (현물)", low: "낮음 (1-5x)", medium: "중간 (5-20x)", high: "높음 (20x+)" };
      parts.push(`레버리지: ${levMap[profile.leverage]}`);
    }
    if (profile.goals) parts.push(`목표: ${profile.goals}`);
    if (profile.notes) parts.push(`추가 참고: ${profile.notes}`);

    if (parts.length === 0) return "";
    return `\n\n=== 사용자 트레이딩 프로필 (이 사용자에 맞춰 분석하세요) ===\n${parts.join("\n")}\n=== 프로필 끝 ===\n`;
  }

  // English
  if (profile.experience) parts.push(`Experience: ${profile.experience}`);
  if (profile.riskAppetite) parts.push(`Risk appetite: ${profile.riskAppetite}`);
  if (profile.style) parts.push(`Trading style: ${profile.style.replace("_", " ")}`);
  if (profile.preferredTimeframes?.length) parts.push(`Preferred timeframes: ${profile.preferredTimeframes.join(", ")}`);
  if (profile.preferredAssets?.length) parts.push(`Preferred assets: ${profile.preferredAssets.join(", ")}`);
  if (profile.avgPositionSize) parts.push(`Avg position size: ${profile.avgPositionSize}`);
  if (profile.leverage) {
    const levMap = { none: "none (spot only)", low: "low (1-5x)", medium: "medium (5-20x)", high: "high (20x+)" };
    parts.push(`Leverage: ${levMap[profile.leverage]}`);
  }
  if (profile.goals) parts.push(`Goals: ${profile.goals}`);
  if (profile.notes) parts.push(`Notes: ${profile.notes}`);

  if (parts.length === 0) return "";
  return `\n\n=== USER TRADING PROFILE (tailor analysis to this user) ===\n${parts.join("\n")}\n=== END PROFILE ===\n`;
}
