"use server";

import { auth } from "@/auth";
import { action } from "@/lib/safe-action";
import { postsService } from "@/lib/services/posts/posts.service";

import { usersService } from "@/lib/services/users/users.service";
import { redirect } from "next/navigation";
import { z } from "zod";

const updateUserSchema = z.object({
  id: z.string(),

  name: z.string().default(""),
  nickname: z.string().default(""),

  imageUrl: z.string(),
});

export async function getUser() {
  const session = await auth();
  if (!session) {
    throw redirect("/login");
  }
  const {
    user: { email },
  } = session;
  const user = await usersService.findByEmail(email);

  return user;
}

export async function deletePost(id: string) {
  const post = await postsService.delete(id);
  return post;
}

export const updateUser = action(updateUserSchema, async (data) => {
  const user = await usersService.update(data.id, data);
  return user;
});
