"use server";

import { auth } from "@/auth";
import prisma from "@/lib/prisma";

export async function linkExchangeAccount(data: {
  exchangeId: string;
  uid: string;
  screenshotUrl: string;
}) {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };

  if (!data.uid || data.uid.trim().length < 2) {
    return { success: false, error: "Invalid UID" };
  }

  try {
    // Check for duplicate UID
    const existing = await prisma.exchangeAccount.findUnique({
      where: { uid: data.uid.trim() },
    });
    if (existing) {
      return { success: false, error: "This UID is already registered" };
    }

    await prisma.exchangeAccount.create({
      data: {
        uid: data.uid.trim(),
        userId: session.user.id,
        exchangeId: data.exchangeId,
        status: "PENDING",
        screenshotUrl: data.screenshotUrl || null,
      },
    });

    return { success: true };
  } catch (error: any) {
    console.error("Failed to link exchange account:", error);
    return { success: false, error: "Failed to link account" };
  }
}

export async function getAvailableExchanges() {
  return prisma.exchange.findMany({
    select: { id: true, name: true, imageUrl: true },
    orderBy: { name: "asc" },
  });
}
