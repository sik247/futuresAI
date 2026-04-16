import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

/**
 * Admin endpoint: Full payback report across all users and exchanges.
 * Shows total payback, unpaid amounts, and per-user breakdown.
 *
 * GET /api/admin/payback-report
 */
export async function GET() {
  const session = await auth();
  if (!session || (session.user as { role?: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const accounts = await prisma.exchangeAccount.findMany({
      include: {
        exchange: true,
        user: { select: { email: true, name: true } },
        trades: { where: { status: "SUCCESS" } },
      },
    });

    let grandTotalPayback = 0;
    let grandTotalUnpaid = 0;

    const rows = accounts.map((acc) => {
      const totalPayback = acc.trades.reduce((s, t) => s + t.payback, 0);
      const unpaid = acc.trades
        .filter((t) => !t.withdrawId)
        .reduce((s, t) => s + t.payback, 0);
      grandTotalPayback += totalPayback;
      grandTotalUnpaid += unpaid;

      return {
        exchange: acc.exchange.name,
        uid: acc.uid,
        status: acc.status,
        user: acc.user.email || acc.user.name || "unknown",
        totalCommission: acc.totalCommission,
        totalPayback,
        unpaid,
        paid: totalPayback - unpaid,
        tradeCount: acc.trades.length,
      };
    });

    rows.sort((a, b) => a.exchange.localeCompare(b.exchange));

    // Withdrawal requests
    const withdrawals = await prisma.withdrawal.findMany({
      include: {
        exchangeAccounts: { include: { exchange: true } },
        user: { select: { email: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const withdrawalRows = withdrawals.map((w) => ({
      status: w.status,
      amount: w.amount,
      network: w.network,
      address: w.address,
      user: w.user?.email || w.user?.name || "unknown",
      exchanges: w.exchangeAccounts.map((ea) => ea.exchange.name),
      createdAt: w.createdAt.toISOString(),
      paidAt: w.paidAt?.toISOString() || null,
    }));

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      summary: {
        totalAccounts: accounts.length,
        grandTotalPayback,
        totalUnpaid: grandTotalUnpaid,
        totalPaid: grandTotalPayback - grandTotalUnpaid,
      },
      accounts: rows,
      withdrawals: withdrawalRows,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
