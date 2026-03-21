"use server";

import { auth } from "@/auth";

import { postLikesService } from "@/lib/services/post-likes/post-likes.service";
import { postsService } from "@/lib/services/posts/posts.service";
import { usersService } from "@/lib/services/users/users.service";
import { redirect } from "next/navigation";

export async function getPosts(page: number, category?: string) {
  try {
    return await postsService.findMany(page, category);
  } catch (error) {
    console.error("Failed to fetch posts:", error);
    return [];
  }
}

export async function getPostCount(category?: string) {
  try {
    return await postsService.getPostCount(category);
  } catch (error) {
    console.error("Failed to fetch post count:", error);
    return 0;
  }
}

export async function createPostLikes(postId: string) {
  const session = await auth();
  if (!session) {
    throw redirect("/login");
  }

  const {
    user: { email },
  } = session;

  const postLikes = await postLikesService.create({
    post: {
      connect: {
        id: postId,
      },
    },
    user: {
      connect: {
        email,
      },
    },
  });

  return postLikes;
}

export async function deletePostLikes(postId: string) {
  const session = await auth();
  if (!session) {
    throw redirect("/login");
  }

  const {
    user: { email },
  } = session;

  const postLikes = await postLikesService.getOne({
    where: {
      postId,
      user: {
        email,
      },
    },
  });

  if (!postLikes) {
    return;
  }

  await postLikesService.delete(postLikes.id);
}

export async function follow(toId: string) {
  return await usersService.follow(toId);
}

export async function unfollow(toId: string) {
  return await usersService.unfollow(toId);
}
