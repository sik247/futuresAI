"use server";
import { revalidatePath } from "next/cache";

export const revalidateAll = async (path?: string) => {
  if (path) {
    revalidatePath(path);
    return;
  }
  revalidatePath("/");
};
