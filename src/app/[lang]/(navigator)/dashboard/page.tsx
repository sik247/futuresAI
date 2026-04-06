import { Metadata } from "next";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { fetchMarketSignals } from "@/lib/services/signals/signals.service";
import { fetchPortfolioPrices } from "@/lib/services/portfolio/portfolio-prices";
import { fetchAllHLTrades } from "@/lib/services/whales/hyperliquid.service";
import { fetchCryptoNews } from "@/lib/services/news/crypto-news.service";
import UnifiedDashboard from "./unified-dashboard";

export const metadata: Metadata = {
  title: "Dashboard - CryptoX",
  description:
    "Your crypto command center — portfolio, signals, whales, payback, and more.",
};

export const revalidate = 60;

export default async function DashboardPage({
  params: { lang },
}: {
  params: { lang: string };
}) {
  const session = await auth();
  if (!session?.user?.email) redirect(`/${lang}/login`);

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  if (!user) redirect(`/${lang}/login`);
  if (user.role === "ADMIN") redirect(`/${lang}/dashboard/admin`);

  // Step 1: Get portfolio (needed for coin IDs)
  let portfolio = await prisma.portfolio.findFirst({
    where: { userId: user.id },
    include: { holdings: true },
  });
  if (!portfolio) {
    portfolio = await prisma.portfolio.create({
      data: { userId: user.id, name: "My Portfolio" },
      include: { holdings: true },
    });
  }
  const coinIds = portfolio.holdings.map((h) => h.coinId);

  // Step 2: Fetch everything else in parallel
  const [signalsR, pricesR, accountsR, tradesR, newsR, analysesR] =
    await Promise.allSettled([
      fetchMarketSignals(),
      coinIds.length > 0 ? fetchPortfolioPrices(coinIds) : Promise.resolve({}),
      prisma.exchangeAccount.findMany({
        where: { userId: user.id },
        include: {
          exchange: true,
          trades: {
            where: { status: "SUCCESS" },
            select: { payback: true, withdrawId: true },
          },
        },
      }),
      fetchAllHLTrades().catch(() => []),
      fetchCryptoNews().catch(() => []),
      prisma.chartAnalysis.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          pair: true,
          trend: true,
          confidence: true,
          createdAt: true,
        },
      }),
    ]);

  // Extract with fallbacks
  const signals =
    signalsR.status === "fulfilled"
      ? signalsR.value
      : {
          signals: [],
          fearGreed: { value: 50, classification: "Neutral" },
          btcTrend: "below_sma" as const,
          marketSummary: "Data unavailable",
          updatedAt: new Date().toISOString(),
        };
  const prices = pricesR.status === "fulfilled" ? pricesR.value : {};
  const accounts = accountsR.status === "fulfilled" ? accountsR.value : [];
  const trades = tradesR.status === "fulfilled" ? tradesR.value : [];
  const news = newsR.status === "fulfilled" ? newsR.value : [];
  const analyses = analysesR.status === "fulfilled" ? analysesR.value : [];

  // Compute portfolio stats
  let totalValue = 0,
    totalCost = 0,
    change24h = 0;
  portfolio.holdings.forEach((h) => {
    const p = (
      prices as Record<string, { usd: number; usd_24h_change: number }>
    )[h.coinId];
    if (p) {
      const val = h.quantity * p.usd;
      totalValue += val;
      totalCost += h.quantity * h.avgBuyPrice;
      change24h += val * (p.usd_24h_change / 100);
    }
  });

  // Compute payback stats
  const paybackAccounts = accounts.map((acc) => {
    const totalEarned = acc.trades.reduce((s, t) => s + t.payback, 0);
    const unpaid = acc.trades
      .filter((t) => !t.withdrawId)
      .reduce((s, t) => s + t.payback, 0);
    return {
      exchangeName: acc.exchange.name,
      exchangeImage: acc.exchange.imageUrl,
      totalEarned,
      unpaid,
      tradeCount: acc.trades.length,
    };
  });

  return (
    <UnifiedDashboard
      lang={lang}
      user={{
        name: user.name,
        email: user.email,
        role: user.role,
        credits: user.credits,
        isPremium: user.isPremium,
      }}
      signals={signals}
      portfolio={{
        totalValue,
        totalCost,
        holdingCount: portfolio.holdings.length,
        change24h,
      }}
      paybackAccounts={JSON.parse(JSON.stringify(paybackAccounts))}
      whalesTrades={JSON.parse(JSON.stringify(trades.slice(0, 8)))}
      recentAnalyses={JSON.parse(JSON.stringify(analyses))}
      news={JSON.parse(JSON.stringify(news.slice(0, 8)))}
    />
  );
}
