import prisma from "@/lib/prisma";
import { USAGE_LIMITS } from "@/lib/constants/usage-limits";

function getStartOfDay(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export type UserTier = "FREE" | "BASIC" | "PREMIUM";

export function getUserTier(isPremium: boolean, credits: number = 0): UserTier {
  if (isPremium && credits >= 99) return "PREMIUM";
  if (isPremium || credits >= 25) return "BASIC";
  return "FREE";
}

export async function checkDailyLimit(
  userId: string,
  isPremium: boolean,
  type: "chart" | "chat",
  credits: number = 0
): Promise<{ allowed: boolean; used: number; limit: number; tier: UserTier; resetMessage?: string }> {
  const today = getStartOfDay();
  const userTier = getUserTier(isPremium, credits);
  const tierLimits = USAGE_LIMITS[userTier];
  const limit = type === "chart" ? tierLimits.chartAnalysis : tierLimits.chat;

  let used: number;

  if (type === "chart") {
    used = await prisma.chartAnalysis.count({
      where: { userId, createdAt: { gte: today } },
    });
  } else {
    used = await prisma.chatMessage.count({
      where: { userId, role: "user", createdAt: { gte: today } },
    });
  }

  if (used >= limit) {
    const resetMessage = userTier === "FREE"
      ? "You've reached your daily limit. Upgrade to Basic ($25/month) for 25 messages/day."
      : userTier === "BASIC"
      ? "You've reached your daily limit. Upgrade to Premium ($99/month) for 100 messages/day."
      : "You've reached your daily limit. Resets at midnight UTC.";
    return { allowed: false, used, limit, tier: userTier, resetMessage };
  }

  return { allowed: true, used, limit, tier: userTier };
}
