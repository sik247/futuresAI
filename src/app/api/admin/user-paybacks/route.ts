import { auth } from "@/auth";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session || (session.user as { role?: string }).role !== "ADMIN") {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const accounts = await prisma.exchangeAccount.findMany({
    include: {
      exchange: true,
      user: { select: { id: true, name: true, email: true } },
      trades: {
        where: { status: "SUCCESS" },
        select: { payback: true, withdrawId: true, createdAt: true },
        orderBy: { createdAt: "desc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const userPaybacks = accounts.map((acc) => {
    const totalEarned = acc.trades.reduce((s, t) => s + t.payback, 0);
    const unpaid = acc.trades.filter((t) => !t.withdrawId).reduce((s, t) => s + t.payback, 0);
    const lastTrade = acc.trades[0]?.createdAt || null;
    return {
      id: acc.id,
      uid: acc.uid,
      status: acc.status,
      exchangeName: acc.exchange.name,
      paybackRate: acc.exchange.paybackRatio,
      userName: acc.user.name,
      userEmail: acc.user.email,
      totalEarned,
      unpaid,
      tradeCount: acc.trades.length,
      lastTrade,
      createdAt: acc.createdAt,
    };
  });

  const summary = {
    totalAccounts: userPaybacks.length,
    activeAccounts: userPaybacks.filter((a) => a.status === "ACTIVE").length,
    totalEarned: userPaybacks.reduce((s, a) => s + a.totalEarned, 0),
    totalUnpaid: userPaybacks.reduce((s, a) => s + a.unpaid, 0),
    totalTrades: userPaybacks.reduce((s, a) => s + a.tradeCount, 0),
  };

  return Response.json({ accounts: userPaybacks, summary });
}
