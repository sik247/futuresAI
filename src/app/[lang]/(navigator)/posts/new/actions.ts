"use server";

import { auth } from "@/auth";
import { action } from "@/lib/safe-action";
import { redirect } from "next/navigation";

import { postsService } from "@/lib/services/posts/posts.service";
import { z } from "zod";
const formSchema = z.object({
  isLong: z.boolean(),
  imageUrl: z.string(),
  title: z.string(),
  content: z.string(),
});

export const createPostAction = action(formSchema, async (data) => {
  const session = await auth();
  if (!session) {
    throw redirect("/login");
  }

  const {
    user: { email },
  } = session;

  const post = await postsService.create({
    title: data.title,
    content: data.content,
    imageUrl: data.imageUrl,
    isLong: data.isLong,
    user: {
      connect: {
        email,
      },
    },
  });

  return post;
});
