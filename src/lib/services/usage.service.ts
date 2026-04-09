import prisma from "@/lib/prisma";
import { RATE_LIMITS } from "@/lib/constants/usage-limits";

export type UserTier = "FREE" | "BASIC" | "PREMIUM";

export function getUserTier(isPremium: boolean, credits: number = 0): UserTier {
  if (isPremium && credits >= 99) return "PREMIUM";
  if (isPremium || credits >= 25) return "BASIC";
  return "FREE";
}

function getRollingWindowStart(hours: number): Date {
  return new Date(Date.now() - hours * 60 * 60 * 1000);
}

export async function checkRateLimit(
  userId: string,
  isPremium: boolean,
  type: "chart" | "chat",
  credits: number = 0
): Promise<{
  allowed: boolean;
  tier: UserTier;
  retryAfterMinutes?: number;
  shouldUpgrade?: boolean;
}> {
  const tier = getUserTier(isPremium, credits);
  const config = RATE_LIMITS[tier];
  const limit = type === "chart" ? config.chartAnalysis : config.chat;
  const windowStart = getRollingWindowStart(config.windowHours);

  let used: number;
  if (type === "chart") {
    used = await prisma.chartAnalysis.count({
      where: { userId, createdAt: { gte: windowStart } },
    });
  } else {
    used = await prisma.chatMessage.count({
      where: { userId, role: "user", createdAt: { gte: windowStart } },
    });
  }

  if (used >= limit) {
    // Find when the oldest message in the window will expire
    let retryAfterMinutes = 30; // default
    try {
      const oldest = type === "chart"
        ? await prisma.chartAnalysis.findFirst({
            where: { userId, createdAt: { gte: windowStart } },
            orderBy: { createdAt: "asc" },
            select: { createdAt: true },
          })
        : await prisma.chatMessage.findFirst({
            where: { userId, role: "user", createdAt: { gte: windowStart } },
            orderBy: { createdAt: "asc" },
            select: { createdAt: true },
          });

      if (oldest) {
        const expiresAt = new Date(oldest.createdAt.getTime() + config.windowHours * 60 * 60 * 1000);
        retryAfterMinutes = Math.max(1, Math.ceil((expiresAt.getTime() - Date.now()) / 60000));
      }
    } catch {}

    return {
      allowed: false,
      tier,
      retryAfterMinutes,
      shouldUpgrade: tier === "FREE",
    };
  }

  return { allowed: true, tier };
}

// Legacy compatibility
export async function checkDailyLimit(
  userId: string,
  isPremium: boolean,
  type: "chart" | "chat",
  credits: number = 0
) {
  const result = await checkRateLimit(userId, isPremium, type, credits);
  const tier = result.tier;
  const config = RATE_LIMITS[tier];
  const limit = type === "chart" ? config.chartAnalysis : config.chat;

  return {
    allowed: result.allowed,
    used: result.allowed ? 0 : limit,
    limit,
    tier,
    resetMessage: result.shouldUpgrade
      ? "Upgrade to continue using AI analysis."
      : result.retryAfterMinutes
        ? `Try again in ~${result.retryAfterMinutes} minutes.`
        : undefined,
  };
}
