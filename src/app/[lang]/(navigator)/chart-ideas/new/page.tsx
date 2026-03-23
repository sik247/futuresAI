import Container from "@/components/ui/container";
import { getDictionary } from "@/i18n";
import ChartIdeaForm from "./chart-idea-form";

export default async function NewChartIdea({
  params: { lang },
}: {
  params: { lang: string };
}) {
  const translations = await getDictionary(lang);

  return (
    <Container className="flex flex-col gap-16 pb-16 max-md:px-4">
      <ChartIdeaForm lang={lang} translations={translations} />
    </Container>
  );
}
