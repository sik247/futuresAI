"use server";

import { auth } from "@/auth";
import { paybackRequestService } from "@/lib/services/payback/payback-request.service";

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
