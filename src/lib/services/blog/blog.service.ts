import { Prisma } from "@prisma/client";
import { CoreService } from "../core/core.service";

class BlogService extends CoreService {
  async create(data: Prisma.BlogArticleCreateInput) {
    return this.db.blogArticle.create({ data });
  }

  async update(id: string, data: Prisma.BlogArticleUpdateInput) {
    return this.db.blogArticle.update({ where: { id }, data });
  }

  async delete(id: string) {
    return this.db.blogArticle.delete({ where: { id } });
  }

  async findPublished(page = 1, category?: string) {
    const take = 20;
    const skip = (page - 1) * take;

    return this.db.blogArticle.findMany({
      where: {
        published: true,
        ...(category && category !== "all" ? { category } : {}),
      },
      include: {
        author: {
          select: { id: true, name: true, nickname: true, imageUrl: true },
        },
      },
      orderBy: { publishedAt: "desc" },
      take,
      skip,
    });
  }

  async findAll(page = 1) {
    const take = 20;
    const skip = (page - 1) * take;

    return this.db.blogArticle.findMany({
      include: {
        author: {
          select: { id: true, name: true, nickname: true, imageUrl: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take,
      skip,
    });
  }

  async findOne(id: string) {
    return this.db.blogArticle.findUnique({
      where: { id },
      include: {
        author: {
          select: { id: true, name: true, nickname: true, imageUrl: true },
        },
      },
    });
  }

  async getPublishedCount(category?: string) {
    return this.db.blogArticle.count({
      where: {
        published: true,
        ...(category && category !== "all" ? { category } : {}),
      },
    });
  }
}

export const blogService = new BlogService();
