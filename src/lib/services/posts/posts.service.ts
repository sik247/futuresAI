import { Prisma } from "@prisma/client";
import { CoreService } from "../core/core.service";
import { auth } from "@/auth";

export interface IGetPosts
  extends Prisma.PostGetPayload<{
    include: {
      user: true;
      comments: true;
      likes: true;
    };
  }> {
  isFollowing: boolean;
  isLiked: boolean;
}

export interface IGetPost
  extends Prisma.PostGetPayload<{
    include: {
      user: {
        include: {
          followers: true;
        };
      };
      comments: {
        where: {
          parentId: null;
        };
        include: {
          user: true;
          likes: true;

          Children: {
            include: {
              user: true;
              likes: true;
            };
          };
        };
      };
      likes: {
        include: {
          user: true;
        };
      };
    };
  }> {
  isFollowing: boolean;
  isLiked: boolean;
}

class PostsService extends CoreService {
  async create(data: Prisma.PostCreateInput) {
    return this.db.post.create({
      data,
    });
  }

  async update(id: string, data: Prisma.PostUpdateInput) {
    return this.db.post.update({
      where: {
        id,
      },
      data,
    });
  }

  async findMany(page: number, category?: string) {
    const session = await auth();

    const posts = await this.db.post.findMany({
      where: {
        ...(category && { isLong: category === "long" }),
      },
      take: 10 * page,
      include: {
        user: {
          include: {
            followers: true,
          },
        },
        comments: true,
        likes: {
          include: {
            user: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    return posts.map((post) => {
      const isFollowing = post.user.followers.some(
        (follower) => follower.email === session?.user?.email
      );

      const isLiked = post.likes
        .map((like) => like.user.email === session?.user?.email)
        .includes(true);

      return {
        ...post,
        isFollowing,
        isLiked,
      };
    });
  }

  async findUnique(id: string) {
    return this.db.post.findUnique({
      where: {
        id,
      },
    });
  }

  async delete(id: string) {
    return this.db.post.delete({
      where: {
        id,
      },
    });
  }

  async getPostCount(category?: string) {
    return this.db.post.count({
      where: {
        ...(category && { isLong: category === "long" }),
      },
    });
  }

  async findOne(id: string) {
    const session = await auth();
    const post = await this.db.post.findUnique({
      where: {
        id,
      },
      include: {
        user: {
          include: {
            followers: true,
          },
        },
        comments: {
          where: {
            parentId: null,
          },
          include: {
            user: true,
            likes: true,

            Children: {
              include: {
                user: true,
                likes: true,
              },
            },
          },
        },
        likes: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!post) {
      return;
    }

    return {
      ...post,
      isFollowing: post.user.followers.some(
        (follower) => follower.email === session?.user?.email
      ),
      isLiked: post.likes.some(
        (like) => like.user.email === session?.user?.email
      ),
    };
  }
}

export const postsService = new PostsService();
