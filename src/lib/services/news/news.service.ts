import axios from "axios";
import { CoreService } from "../core/core.service";
import { News, Prisma } from "@prisma/client";

class NewsService extends CoreService {
  async getAll() {
    return this.db.news.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  async getAllByPage(page: number) {
    return this.db.news.findMany({
      orderBy: {
        createdAt: "desc",
      },
      skip: 10 * (page - 1),
      take: 10 * page,
    });
  }

  async getTenNews() {
    return this.db.news.findMany({
      orderBy: {
        createdAt: "desc",
      },
      take: 10,
    });
  }

  async getAllCount() {
    return this.db.news.count();
  }

  async create(data: Prisma.NewsCreateInput) {
    return this.db.news.create({
      data,
    });
  }

  async getCoinessNews(updatedAt: Date, limit: number): Promise<News[]> {
    let news: News[] = [];
    const apiUrl = new URL(
      `https://api.coinness.com/feed/v1/partners/ko/news?exceptAd=false&apiKey=${
        process.env.COINESS_API_KEY
      }&updatedAt=${updatedAt.toISOString()}&limit=${limit}`
    );
    console.log("apiUrl", apiUrl.toString());
    const { data } = await axios.get(apiUrl.toString(), {
      headers: {
        "Content-Type": "application/json",
        Authorization: process.env.COINESS_API_KEY!,
      },
    });
    console.log("data", data);
    news = [...news, ...data.map(this.convertCoinessNewsToNews)];
    // if (news.length < 10) {
    //   updatedAt = new Date(updatedAt.getTime() - 24 * 60 * 60 * 1000);
    //   const newsYesterday: News[] = await new Promise((resolve) => {
    //     setTimeout(() => {
    //       resolve(this.getCoinessNews(updatedAt, 10 - news.length));
    //     }, 2000);
    //   });
    //   news = [...news, ...newsYesterday];
    // }
    return news.reverse();
  }

  async getById(id: string) {
    return this.db.news.findUnique({
      where: {
        id,
      },
    });
  }

  private convertCoinessNewsToNews(data: any): News {
    return {
      id: data.id,
      title: data.title,
      content: data.content,
      createdAt: new Date(data.publishAt),
      updatedAt: new Date(data.updatedAt),
      linkUrl: data.id,
    };
  }
}

export const newsService = new NewsService();
