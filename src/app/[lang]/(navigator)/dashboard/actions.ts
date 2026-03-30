"use server";

import { auth } from "@/auth";
import { paybackRequestService } from "@/lib/services/payback/payback-request.service";
import prisma from "@/lib/prisma";

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
