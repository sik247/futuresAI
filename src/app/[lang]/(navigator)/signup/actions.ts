"use server";

import { action } from "@/lib/safe-action";
import { usersService } from "@/lib/services/users/users.service";
import { z } from "zod";

const createUserSchema = z.object({
  email: z.string().min(2),
  name: z.string().default(""),
  nickname: z.string().default(""),
  password: z.string().min(3),
  phoneNumber: z.string().default(""),
  imageUrl: z.string(),
});

export const createUser = action(createUserSchema, async (data) => {
  const user = await usersService.create(data);

  return user;
});
