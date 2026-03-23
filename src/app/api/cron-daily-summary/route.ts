export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  notifyAdmin,
  formatDailySummary,
} from "@/lib/services/notifications/telegram.service";
import { bitgetService } from "@/lib/services/exchanges/bitget.service";
import { okxService } from "@/lib/services/exchanges/okx.service";
import { bingXService } from "@/lib/services/exchanges/bingx.service";

export async function GET() {
  try {
    // Fetch exchange payback data
    const exchanges: { name: string; payback: number; status: string }[] = [];

    try {
      const bitgetData = await bitgetService.getAffiliateData("7933563491");
      const total = bitgetData.reduce((sum, item) => sum + (item.payback || 0), 0);
      exchanges.push({ name: "Bitget", payback: total, status: "ok" });
    } catch {
      exchanges.push({ name: "Bitget", payback: 0, status: "error" });
    }

    try {
      const okxData = await okxService.getAffiliateData("594436422380389965");
      exchanges.push({ name: "OKX", payback: okxData?.payback || 0, status: "ok" });
    } catch {
      exchanges.push({ name: "OKX", payback: 0, status: "error" });
    }

    try {
      const bingxData = await bingXService.getAffiliateData("26029939", new Date());
      const parsed = JSON.parse(bingxData.data as string);
      const list = parsed?.data?.list || [];
      const total = list.reduce(
        (sum: number, item: { commission?: string }) =>
          sum + parseFloat(item.commission || "0"),
        0
      );
      exchanges.push({ name: "BingX", payback: total, status: "ok" });
    } catch {
      exchanges.push({ name: "BingX", payback: 0, status: "error" });
    }

    const grandTotal = exchanges.reduce((sum, ex) => sum + ex.payback, 0);

    // Pending withdrawals
    const pendingWithdrawals = await prisma.withdrawal.findMany({
      where: { status: "PENDING" },
    });
    const pendingWithdrawalAmount = pendingWithdrawals.reduce(
      (sum, w) => sum + w.amount,
      0
    );

    // Pending chart analyses
    const pendingAnalyses = await prisma.chartAnalysis.findMany({
      where: { status: "PENDING" },
    });
    const pendingAnalysisRevenue = pendingAnalyses.reduce(
      (sum, a) => sum + a.cost,
      0
    );

    // Send Telegram message
    const message = formatDailySummary({
      exchanges,
      grandTotal,
      pendingWithdrawals: pendingWithdrawals.length,
      pendingWithdrawalAmount,
      pendingAnalyses: pendingAnalyses.length,
      pendingAnalysisRevenue,
    });

    const sent = await notifyAdmin(message);

    return NextResponse.json({
      success: true,
      sent,
      summary: {
        grandTotal,
        pendingWithdrawals: pendingWithdrawals.length,
        pendingAnalyses: pendingAnalyses.length,
      },
    });
  } catch (error) {
    console.error("Daily summary cron error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
