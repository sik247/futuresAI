import { Metadata } from "next";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getDictionary } from "@/i18n";
import prisma from "@/lib/prisma";
import { fetchPortfolioPrices } from "@/lib/services/portfolio/portfolio-prices";
import UserDashboard from "./user-dashboard";

export const metadata: Metadata = {
  title: "Dashboard - CryptoX",
  description: "Your personal crypto dashboard with portfolio overview and quick actions.",
};

export default async function DashboardPage({
  params: { lang },
}: {
  params: { lang: string };
}) {
  const session = await auth();
  if (!session?.user?.email) {
    redirect(`/${lang}/login`);
  }

  const translations = await getDictionary(lang);

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) redirect(`/${lang}/login`);

  // Redirect admins to admin dashboard
  if (user.role === "ADMIN") {
    redirect(`/${lang}/dashboard/admin`);
  }

  // Fetch portfolio data
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

  // Fetch live prices
  const coinIds = portfolio.holdings.map((h) => h.coinId);
  const prices = coinIds.length > 0 ? await fetchPortfolioPrices(coinIds) : {};

  // Recent chart analyses
  const recentAnalyses = await prisma.chartAnalysis.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 5,
    select: { id: true, pair: true, trend: true, confidence: true, createdAt: true },
  });

  // Fetch exchange accounts with payback data
  const exchangeAccounts = await prisma.exchangeAccount.findMany({
    where: { userId: user.id, status: "ACTIVE" },
    include: {
      exchange: true,
      trades: {
        where: { status: "SUCCESS" },
        select: { payback: true, withdrawId: true, createdAt: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  const paybackAccounts = exchangeAccounts.map((acc) => {
    const totalEarned = acc.trades.reduce((sum, t) => sum + t.payback, 0);
    const unpaid = acc.trades.filter((t) => !t.withdrawId).reduce((sum, t) => sum + t.payback, 0);
    return {
      id: acc.id,
      uid: acc.uid,
      exchangeName: acc.exchange.name,
      exchangeImage: acc.exchange.imageUrl,
      paybackRate: acc.exchange.paybackRatio,
      totalEarned,
      unpaid,
      tradeCount: acc.trades.length,
    };
  });

  return (
    <div className="bg-zinc-950 min-h-screen">
      <UserDashboard
        lang={lang}
        translations={translations}
        user={{
          name: user.name,
          email: user.email,
          role: user.role,
          credits: user.credits,
        }}
        portfolio={JSON.parse(JSON.stringify(portfolio))}
        prices={prices}
        recentAnalyses={JSON.parse(JSON.stringify(recentAnalyses))}
        paybackAccounts={JSON.parse(JSON.stringify(paybackAccounts))}
      />
    </div>
  );
}
