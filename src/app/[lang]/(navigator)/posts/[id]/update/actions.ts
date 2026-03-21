"use server";

import { auth } from "@/auth";
import { action } from "@/lib/safe-action";
import { postsService } from "@/lib/services/posts/posts.service";
import { redirect } from "next/navigation";
import { z } from "zod";

const formSchema = z.object({
  id: z.string(),
  isLong: z.boolean(),
  imageUrl: z.string(),
  title: z.string(),
  content: z.string(),
});

export const updatePostAction = action(formSchema, async (data) => {
  const session = await auth();
  if (!session) {
    throw redirect("/login");
  }

  const {
    user: { email },
  } = session;

  const post = await postsService.update(data.id, {
    title: data.title,
    content: data.content,
    imageUrl: data.imageUrl,
    isLong: data.isLong,
  });

  return post;
});

export async function getPostById(id: string) {
  return postsService.findUnique(id);
}
