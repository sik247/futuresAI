import prisma from "@/lib/prisma";
import { USAGE_LIMITS } from "@/lib/constants/usage-limits";

function getStartOfDay(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function checkDailyLimit(
  userId: string,
  isPremium: boolean,
  type: "chart" | "chat"
): Promise<{ allowed: boolean; used: number; limit: number }> {
  const today = getStartOfDay();
  const tier = isPremium ? USAGE_LIMITS.PREMIUM : USAGE_LIMITS.FREE;
  const limit = type === "chart" ? tier.chartAnalysis : tier.chat;

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

  return { allowed: used < limit, used, limit };
}
