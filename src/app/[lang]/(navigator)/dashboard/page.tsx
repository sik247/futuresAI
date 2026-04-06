import { Metadata } from "next";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getDictionary } from "@/i18n";
import { fetchMarketSignals } from "@/lib/services/signals/signals.service";
import QuantClient from "../quant/quant-client";

export const metadata: Metadata = {
  title: "Dashboard - CryptoX",
  description: "Real-time AI-powered crypto trading signals and quantitative market insights.",
};

export const revalidate = 60;

export default async function DashboardPage({
  params: { lang },
}: {
  params: { lang: string };
}) {
  const session = await auth();
  if (!session?.user?.email) {
    redirect(`/${lang}/login`);
  }

  if (session.user.role === "ADMIN") {
    redirect(`/${lang}/dashboard/admin`);
  }

  const [data, translations] = await Promise.all([
    fetchMarketSignals().catch(() => ({
      signals: [],
      fearGreed: { value: 50, classification: "Neutral" },
      btcTrend: "below_sma" as const,
      marketSummary: "Unable to load market data. Please try refreshing.",
      updatedAt: new Date().toISOString(),
    })),
    getDictionary(lang),
  ]);

  return <QuantClient initialData={data} lang={lang} translations={translations} />;
}
