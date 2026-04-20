import Container from "@/components/ui/container";
import { getDictionary } from "@/i18n";
import ChartAnalyzer from "./chart-analyzer";

export default async function AnalyzeChartPage({
  params: { lang },
}: {
  params: { lang: string };
}) {
  const translations = await getDictionary(lang);
  const walletAddress = process.env.PAYMENT_WALLET_TRC20 || process.env.PAYMENT_WALLET_ADDRESS || "";

  return (
    <Container className="flex flex-col gap-16 pb-16 max-md:px-4">
      <ChartAnalyzer lang={lang} translations={translations} walletAddress={walletAddress} />
    </Container>
  );
}
