import Container from "@/components/ui/container";
import { NewsSection } from "./news-section";
import { getNews } from "./actions";

export default async function NewsDetail({
  params: { id },
}: {
  params: { id: string };
}) {
  const [news] = await Promise.all([getNews(id)]);

  if (!news) {
    return;
  }

  return (
    <Container className="flex flex-col  pb-16 max-md:px-4">
      <NewsSection news={news} />
    </Container>
  );
}
