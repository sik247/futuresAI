import { Prisma } from "@prisma/client";
import { CoreService } from "../core/core.service";

class CommentLikesService extends CoreService {
  async create(data: Prisma.CommentLikeCreateInput) {
    return this.db.commentLike.create({
      data,
    });
  }

  async delete(id: string) {
    return this.db.commentLike.delete({
      where: {
        id,
      },
    });
  }

  async getOne(data: Prisma.CommentLikeFindFirstArgs) {
    return this.db.commentLike.findFirst({
      ...data,
    });
  }
}

export const commentLikesService = new CommentLikesService();
