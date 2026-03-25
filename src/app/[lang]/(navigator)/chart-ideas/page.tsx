import Link from "next/link";
import Container from "@/components/ui/container";
import { getDictionary } from "@/i18n";
import { getChartIdeas, getChartIdeasCount } from "./actions";
import ChartIdeasFeed from "./chart-ideas-feed";
import { Button } from "@/components/ui/button";

export default async function ChartIdeasPage({
  params: { lang },
}: {
  params: { lang: string };
}) {
  const translations = await getDictionary(lang);
  const [ideas, count] = await Promise.all([
    getChartIdeas(1),
    getChartIdeasCount(),
  ]);

  return (
    <div className="bg-zinc-950 min-h-screen">
    <Container className="flex flex-col gap-16 pb-16 max-md:px-4">
      <section className="flex flex-col gap-16 py-16 w-full max-md:gap-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="flex flex-col gap-2">
            <h1 className="text-4xl max-md:text-2xl text-zinc-100 font-extrabold">
              {translations.chartIdeas}
            </h1>
            <p className="text-xl max-md:text-sm font-semibold text-zinc-400">
              {translations.chartIdeas_subtitle}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link href={`/${lang}/chart-ideas/analyze`}>
              <Button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20">
                {translations.chartAnalysis || "AI Analysis"} — Free
              </Button>
            </Link>
            <Link href={`/${lang}/chart-ideas/new`}>
              <Button variant="outline" className="flex items-center gap-2 border-white/[0.06] bg-white/[0.03] text-zinc-100 hover:border-white/[0.12] hover:bg-white/[0.05]">
                {translations.chartIdeas_new}
              </Button>
            </Link>
          </div>
        </div>

        {/* Feed */}
        <ChartIdeasFeed
          initialIdeas={ideas}
          initialCount={count}
          translations={translations}
        />
      </section>
    </Container>
    </div>
  );
}
