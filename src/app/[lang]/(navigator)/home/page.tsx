import { Metadata } from "next";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { fetchMarketSignals } from "@/lib/services/signals/signals.service";
import { fetchPortfolioPrices } from "@/lib/services/portfolio/portfolio-prices";
import { fetchAllHLTrades } from "@/lib/services/whales/hyperliquid.service";
import { fetchCryptoNews } from "@/lib/services/news/crypto-news.service";
import UnifiedDashboard from "../dashboard/unified-dashboard";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "CryptoX - Crypto Command Center",
  description:
    "Real-time crypto dashboard: signals, whale tracking, payback, predictions, news, and AI analysis — all at a glance.",
  openGraph: {
    title: "CryptoX - Crypto Command Center",
    description:
      "Real-time crypto dashboard with whale tracking, live prices, AI trading signals, and market intelligence.",
    type: "website",
  },
};

export default async function HomePage({
  params: { lang },
}: {
  params: { lang: string };
}) {
  const session = await auth();
  const userEmail = session?.user?.email;

  // Public data (always fetched)
  const publicFetches = Promise.allSettled([
    fetchMarketSignals(),
    fetchAllHLTrades().catch(() => []),
    fetchCryptoNews().catch(() => []),
  ]);

  // User-specific data (only if logged in)
  let user = null;
  let portfolio = { totalValue: 0, totalCost: 0, holdingCount: 0, change24h: 0 };
  let paybackAccounts: { exchangeName: string; exchangeImage: string | null; totalEarned: number; unpaid: number; tradeCount: number }[] = [];
  let analyses: { id: string; pair: string | null; trend: string; confidence: number; createdAt: Date }[] = [];

  if (userEmail) {
    const dbUser = await prisma.user.findUnique({ where: { email: userEmail } });
    if (dbUser) {
      user = { name: dbUser.name, email: dbUser.email, role: dbUser.role, credits: dbUser.credits, isPremium: dbUser.isPremium };

      // Fetch user data in parallel
      const [portfolioR, accountsR, analysesR] = await Promise.allSettled([
        prisma.portfolio.findFirst({ where: { userId: dbUser.id }, include: { holdings: true } }),
        prisma.exchangeAccount.findMany({
          where: { userId: dbUser.id },
          include: {
            exchange: true,
            trades: { where: { status: "SUCCESS" }, select: { payback: true, withdrawId: true } },
          },
        }),
        prisma.chartAnalysis.findMany({
          where: { userId: dbUser.id },
          orderBy: { createdAt: "desc" },
          take: 5,
          select: { id: true, pair: true, trend: true, confidence: true, createdAt: true },
        }),
      ]);

      // Portfolio
      if (portfolioR.status === "fulfilled" && portfolioR.value) {
        const p = portfolioR.value;
        const coinIds = p.holdings.map((h) => h.coinId);
        if (coinIds.length > 0) {
          const prices = await fetchPortfolioPrices(coinIds).catch(() => ({})) as Record<string, { usd: number; usd_24h_change: number }>;
          let tv = 0, tc = 0, c24 = 0;
          p.holdings.forEach((h) => {
            const pr = prices[h.coinId];
            if (pr) {
              const val = h.quantity * pr.usd;
              tv += val;
              tc += h.quantity * h.avgBuyPrice;
              c24 += val * (pr.usd_24h_change / 100);
            }
          });
          portfolio = { totalValue: tv, totalCost: tc, holdingCount: p.holdings.length, change24h: c24 };
        }
      }

      // Payback
      if (accountsR.status === "fulfilled") {
        paybackAccounts = accountsR.value.map((acc) => ({
          exchangeName: acc.exchange.name,
          exchangeImage: acc.exchange.imageUrl,
          totalEarned: acc.trades.reduce((s, t) => s + t.payback, 0),
          unpaid: acc.trades.filter((t) => !t.withdrawId).reduce((s, t) => s + t.payback, 0),
          tradeCount: acc.trades.length,
        }));
      }

      // Analyses
      if (analysesR.status === "fulfilled") {
        analyses = analysesR.value;
      }
    }
  }

  // Wait for public data
  const [signalsR, tradesR, newsR] = await publicFetches;

  const signals = signalsR.status === "fulfilled" ? signalsR.value : {
    signals: [], fearGreed: { value: 50, classification: "Neutral" },
    btcTrend: "below_sma" as const, marketSummary: "Data unavailable", updatedAt: new Date().toISOString(),
  };
  const trades = tradesR.status === "fulfilled" ? tradesR.value : [];
  const news = newsR.status === "fulfilled" ? newsR.value : [];

  return (
    <UnifiedDashboard
      lang={lang}
      user={user || { name: "Guest", email: "", role: "USER", credits: 0, isPremium: false }}
      signals={signals}
      portfolio={portfolio}
      paybackAccounts={JSON.parse(JSON.stringify(paybackAccounts))}
      whalesTrades={JSON.parse(JSON.stringify(trades.slice(0, 8)))}
      recentAnalyses={JSON.parse(JSON.stringify(analyses))}
      news={JSON.parse(JSON.stringify(news.slice(0, 8)))}
    />
  );
}
