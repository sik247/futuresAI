import prisma from "@/lib/prisma";

const MONTHLY_PRICE = 75.0;
const MONTHLY_LIMIT = 10;

export { MONTHLY_PRICE };

export async function getActiveSubscription(userId: string) {
  return prisma.subscription.findFirst({
    where: {
      userId,
      status: "ACTIVE",
      currentPeriodEnd: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function checkUsageAllowance(userId: string): Promise<{
  allowed: boolean;
  subscription: Awaited<ReturnType<typeof getActiveSubscription>>;
  periodEnd?: Date;
}> {
  const subscription = await getActiveSubscription(userId);
  if (!subscription) {
    return { allowed: false, subscription: null };
  }

  const usage = await prisma.analysisUsage.findUnique({
    where: {
      userId_periodStart: {
        userId,
        periodStart: subscription.currentPeriodStart,
      },
    },
  });

  if (usage && usage.usageCount >= MONTHLY_LIMIT) {
    return {
      allowed: false,
      subscription,
      periodEnd: subscription.currentPeriodEnd,
    };
  }

  return {
    allowed: true,
    subscription,
    periodEnd: subscription.currentPeriodEnd,
  };
}

export async function incrementUsage(userId: string): Promise<void> {
  const subscription = await getActiveSubscription(userId);
  if (!subscription) return;

  await prisma.analysisUsage.upsert({
    where: {
      userId_periodStart: {
        userId,
        periodStart: subscription.currentPeriodStart,
      },
    },
    create: {
      userId,
      periodStart: subscription.currentPeriodStart,
      usageCount: 1,
    },
    update: {
      usageCount: { increment: 1 },
    },
  });
}

export async function createSubscription(userId: string) {
  const now = new Date();
  const periodEnd = new Date(now);
  periodEnd.setMonth(periodEnd.getMonth() + 1);

  const [subscription] = await prisma.$transaction([
    prisma.subscription.create({
      data: {
        userId,
        status: "ACTIVE",
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
      },
    }),
    prisma.user.update({
      where: { id: userId },
      data: { credits: { decrement: MONTHLY_PRICE } },
    }),
  ]);

  return subscription;
}

export async function cancelSubscription(userId: string) {
  const subscription = await getActiveSubscription(userId);
  if (!subscription) throw new Error("No active subscription");

  return prisma.subscription.update({
    where: { id: subscription.id },
    data: { status: "CANCELED" },
  });
}
