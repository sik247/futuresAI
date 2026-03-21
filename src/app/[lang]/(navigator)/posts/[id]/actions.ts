"use server";

import { auth } from "@/auth";
import { action } from "@/lib/safe-action";
import { commentLikesService } from "@/lib/services/comment-likes/comment-likes.service";
import { commentsService } from "@/lib/services/comments/comments.service";
import { postsService } from "@/lib/services/posts/posts.service";
import { redirect } from "next/navigation";
import { z } from "zod";

const formSchema = z.object({
  comment: z.string(),
  postId: z.string(),
});

export async function getPostById(id: string) {
  const post = await postsService.findOne(id);

  return post;
}

export const createCommentAction = action(formSchema, async (data) => {
  const session = await auth();
  if (!session) {
    throw redirect("/login");
  }

  const {
    user: { email },
  } = session;

  const comment = await commentsService.create({
    content: data.comment,
    post: {
      connect: {
        id: data.postId,
      },
    },
    user: {
      connect: {
        email,
      },
    },
  });

  return comment;
});

export async function createChild(data: {
  comment: string;
  parentId: string;
  postId: string;
}) {
  const session = await auth();
  if (!session) {
    throw redirect("/login");
  }

  const {
    user: { email },
  } = session;

  const comment = await commentsService.create({
    content: data.comment,
    parent: {
      connect: {
        id: data.parentId,
      },
    },
    user: {
      connect: {
        email,
      },
    },
    post: {
      connect: {
        id: data.postId,
      },
    },
  });

  return comment;
}

export async function updateComment(id: string, content: string) {
  const session = await auth();
  if (!session) {
    throw redirect("/login");
  }

  const {
    user: { email },
  } = session;

  const comment = await commentsService.update(id, {
    content: content,
  });

  return comment;
}

export async function getCommentLike(commentId: string, email: string) {
  const like = await commentLikesService.getOne({
    where: {
      comment: {
        id: commentId,
      },
      user: {
        email,
      },
    },
  });

  return like;
}

export async function createCommentLikes(commentId: string) {
  const session = await auth();
  if (!session) {
    throw redirect("/login");
  }

  const {
    user: { email },
  } = session;

  const commentLikes = await commentLikesService.create({
    comment: {
      connect: {
        id: commentId,
      },
    },
    user: {
      connect: {
        email,
      },
    },
  });

  return commentLikes;
}

export async function deleteCommentLikes(id: string) {
  await commentLikesService.delete(id);
}
