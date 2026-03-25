import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getDictionary } from "@/i18n";
import { getPortfolioData, getPortfolioNews } from "./actions";
import { fetchPortfolioPrices } from "@/lib/services/portfolio/portfolio-prices";
import PortfolioDashboard from "./portfolio-dashboard";

export const metadata = {
  title: "Portfolio - CryptoX",
  description: "Track your crypto portfolio with live prices and P&L",
};

export default async function PortfolioPage({
  params: { lang },
}: {
  params: { lang: string };
}) {
  const session = await auth();
  if (!session?.user?.email) {
    redirect(`/${lang}/login`);
  }

  const translations = await getDictionary(lang);
  const { portfolio, snapshots } = await getPortfolioData();

  // Fetch live prices for all holdings
  const coinIds = portfolio.holdings.map((h) => h.coinId);
  const prices = coinIds.length > 0 ? await fetchPortfolioPrices(coinIds) : {};

  // Fetch personalized news
  const symbols = portfolio.holdings.map((h) => h.symbol);
  const news = symbols.length > 0 ? await getPortfolioNews(symbols) : [];

  return (
    <div className="bg-zinc-950 min-h-screen">
      <PortfolioDashboard
        lang={lang}
        translations={translations}
        portfolio={JSON.parse(JSON.stringify(portfolio))}
        snapshots={JSON.parse(JSON.stringify(snapshots))}
        initialPrices={prices}
        initialNews={news}
      />
    </div>
  );
}
