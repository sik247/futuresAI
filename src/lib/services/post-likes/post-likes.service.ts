import { Prisma } from "@prisma/client";
import { CoreService } from "../core/core.service";

class PostLikesService extends CoreService {
  async create(data: Prisma.PostLikeCreateInput) {
    return this.db.postLike.create({
      data,
    });
  }

  async delete(id: string) {
    return this.db.postLike.delete({
      where: {
        id,
      },
    });
  }

  async getOne(data: Prisma.PostLikeFindFirstArgs) {
    return this.db.postLike.findFirst({
      ...data,
    });
  }
}

export const postLikesService = new PostLikesService();
