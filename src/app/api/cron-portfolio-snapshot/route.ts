import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { fetchPortfolioPrices } from "@/lib/services/portfolio/portfolio-prices";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

/** Daily: snapshot all portfolio values for P&L history charts */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get all portfolios with holdings
    const portfolios = await prisma.portfolio.findMany({
      include: { holdings: true },
    });

    if (portfolios.length === 0) {
      return NextResponse.json({ ok: true, snapshots: 0 });
    }

    // Collect all unique coin IDs across all portfolios
    const allCoinIds = Array.from(
      new Set(portfolios.flatMap((p) => p.holdings.map((h) => h.coinId)))
    );

    // Fetch prices once for all coins
    const prices = allCoinIds.length > 0 ? await fetchPortfolioPrices(allCoinIds) : {};

    // Create snapshots
    let created = 0;
    for (const portfolio of portfolios) {
      if (portfolio.holdings.length === 0) continue;

      const totalValue = portfolio.holdings.reduce(
        (sum, h) => sum + h.quantity * (prices[h.coinId]?.usd ?? 0),
        0
      );
      const totalCost = portfolio.holdings.reduce(
        (sum, h) => sum + h.quantity * h.avgBuyPrice,
        0
      );

      await prisma.portfolioSnapshot.create({
        data: {
          portfolioId: portfolio.id,
          totalValue,
          totalCost,
        },
      });
      created++;
    }

    return NextResponse.json({
      ok: true,
      snapshots: created,
      portfolios: portfolios.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[cron-portfolio-snapshot]", error);
    return NextResponse.json({ ok: false, error: String(error) }, { status: 500 });
  }
}
