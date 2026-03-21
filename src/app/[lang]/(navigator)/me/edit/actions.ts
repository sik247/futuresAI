"use server";

import { auth } from "@/auth";

import { usersService } from "@/lib/services/users/users.service";
import { redirect } from "next/navigation";

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
