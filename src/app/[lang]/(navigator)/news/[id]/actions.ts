import { newsService } from "@/lib/services/news/news.service";

export async function getNews(id: string) {
  return await newsService.getById(id);
}
