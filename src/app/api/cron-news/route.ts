export const dynamic = "force-dynamic";

import { newsService } from "@/lib/services/news/news.service";
import { News } from "@prisma/client";

export async function GET() {
  const createdNews: News[] = [];

  const news = await newsService.getCoinessNews(
    new Date(new Date().getTime() - 24 * 60 * 60 * 1000 * 1),
    10
  );

  for (const n of news) {
    const exist = await newsService.getById(n.id.toString());
    if (exist) continue;
    const created = await newsService.create({
      id: n.id.toString(),
      title: n.title,
      content: n.content,
      createdAt: n.createdAt,
      updatedAt: n.updatedAt,
      linkUrl: n.id.toString(),
    });
    createdNews.push(created);
  }

  return Response.json({ createdNews });
}
