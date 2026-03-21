"use server";

import { auth } from "@/auth";
import { tradesService } from "@/lib/services/trades/trades.service";
import { redirect } from "next/navigation";

export async function getTotalPayback() {
  const session = await auth();
  if (!session) {
    throw redirect("/login");
  }
  const {
    user: { id },
  } = session;

  const totalPayback = await tradesService.getTotalPaybackByUserId(id);

  return totalPayback;
}
