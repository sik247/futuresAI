import { Prisma } from "@prisma/client";
import { CoreService } from "../core/core.service";

class CommentsService extends CoreService {
  async create(data: Prisma.CommentCreateInput) {
    return this.db.comment.create({
      data,
      include: {
        Children: true,
      },
    });
  }

  async update(id: string, data: Prisma.CommentUpdateInput) {
    return this.db.comment.update({
      where: { id },
      data,
      include: {
        Children: true,
      },
    });
  }
}

export const commentsService = new CommentsService();
