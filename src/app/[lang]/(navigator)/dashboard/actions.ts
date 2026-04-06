"use server";

import { auth } from "@/auth";
import { paybackRequestService } from "@/lib/services/payback/payback-request.service";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

async function verifyAdmin() {
  const session = await auth();
  if (!session || (session.user as { role?: string }).role !== "ADMIN") {
    throw new Error("Unauthorized");
  }
  return session;
}

export async function getPendingRequests() {
  await verifyAdmin();
  try {
    return await paybackRequestService.getAllPending();
  } catch (error) {
    console.error("Failed to fetch pending requests:", error);
    return [];
  }
}

export async function getAllRequests(status?: "PENDING" | "SUCCESS" | "FAILED") {
  await verifyAdmin();
  try {
    return await paybackRequestService.getAll(status);
  } catch (error) {
    console.error("Failed to fetch requests:", error);
    return [];
  }
}

export async function approveRequest(id: string, note?: string) {
  await verifyAdmin();
  try {
    await paybackRequestService.approve(id, note);
    return { success: true };
  } catch (error) {
    console.error("Failed to approve request:", error);
    return { success: false, error: "Failed to approve request" };
  }
}

export async function rejectRequest(id: string, note: string) {
  await verifyAdmin();
  try {
    await paybackRequestService.reject(id, note);
    return { success: true };
  } catch (error) {
    console.error("Failed to reject request:", error);
    return { success: false, error: "Failed to reject request" };
  }
}

export async function getPendingAccountLinks() {
  const session = await auth();
  if (!session || (session.user as any).role !== "ADMIN") return [];

  return prisma.exchangeAccount.findMany({
    where: { status: "PENDING" },
    include: {
      user: { select: { id: true, name: true, email: true } },
      exchange: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function approveAccountLink(id: string) {
  const session = await auth();
  if (!session || (session.user as any).role !== "ADMIN") {
    return { success: false, error: "Unauthorized" };
  }

  await prisma.exchangeAccount.update({
    where: { id },
    data: { status: "ACTIVE" },
  });
  return { success: true };
}

export async function rejectAccountLink(id: string) {
  const session = await auth();
  if (!session || (session.user as any).role !== "ADMIN") {
    return { success: false, error: "Unauthorized" };
  }

  await prisma.exchangeAccount.update({
    where: { id },
    data: { status: "INACTIVE" },
  });
  return { success: true };
}

/* ------------------------------------------------------------------ */
/*  Premium Payment Actions                                             */
/* ------------------------------------------------------------------ */

export async function getPendingPayments() {
  await verifyAdmin();
  return prisma.payment.findMany({
    where: { status: "PENDING" },
    include: {
      user: { select: { id: true, name: true, email: true, nickname: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getAllPayments() {
  await verifyAdmin();
  return prisma.payment.findMany({
    include: {
      user: { select: { id: true, name: true, email: true, nickname: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function approvePayment(id: string) {
  await verifyAdmin();
  try {
    const payment = await prisma.payment.findUnique({ where: { id } });
    if (!payment) return { success: false, error: "Payment not found" };

    await prisma.$transaction([
      prisma.payment.update({
        where: { id },
        data: { status: "VERIFIED", verifiedAt: new Date() },
      }),
      prisma.user.update({
        where: { id: payment.userId },
        data: { isPremium: true, chatEnabled: true },
      }),
    ]);
    revalidatePath("/[lang]/(navigator)/dashboard", "page");
    return { success: true };
  } catch (error) {
    console.error("Failed to approve payment:", error);
    return { success: false, error: "Failed to approve payment" };
  }
}

export async function rejectPayment(id: string, note: string) {
  await verifyAdmin();
  try {
    await prisma.payment.update({
      where: { id },
      data: { status: "REJECTED", adminNote: note },
    });
    revalidatePath("/[lang]/(navigator)/dashboard", "page");
    return { success: true };
  } catch (error) {
    console.error("Failed to reject payment:", error);
    return { success: false, error: "Failed to reject payment" };
  }
}
