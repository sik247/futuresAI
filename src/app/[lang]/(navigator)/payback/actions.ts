"use server";

import { auth } from "@/auth";
import { paybackRequestService } from "@/lib/services/payback/payback-request.service";
import prisma from "@/lib/prisma";
import {
  notifyAdmin,
  formatWithdrawalRequest,
} from "@/lib/services/notifications/telegram.service";

export async function getUserPaybackSummary() {
  const session = await auth();
  if (!session) return { accounts: [], totalUnpaid: 0 };

  try {
    const accounts = await prisma.exchangeAccount.findMany({
      where: { userId: session.user.id, status: "ACTIVE" },
      include: {
        exchange: true,
        trades: {
          where: { withdrawId: null, status: "SUCCESS" },
          select: { payback: true },
        },
      },
    });

    const result = accounts.map((acc) => {
      const unpaidPayback = acc.trades.reduce((sum, t) => sum + t.payback, 0);
      return {
        id: acc.id,
        uid: acc.uid,
        exchangeName: acc.exchange.name,
        exchangeImage: acc.exchange.imageUrl,
        totalCommission: acc.totalCommission,
        unpaidPayback,
      };
    });

    const totalUnpaid = result.reduce((sum, a) => sum + a.unpaidPayback, 0);

    return { accounts: result, totalUnpaid };
  } catch (error) {
    console.error("Failed to get user payback summary:", error);
    return { accounts: [], totalUnpaid: 0 };
  }
}

export async function submitPaybackRequest(data: {
  exchangeAccountIds: string[];
  address: string;
  network: string;
  amount: number;
}) {
  const session = await auth();
  if (!session) return { success: false, error: "Not authenticated" };

  if (!data.address || data.address.trim().length < 10) {
    return { success: false, error: "Invalid wallet address" };
  }

  if (data.exchangeAccountIds.length === 0) {
    return { success: false, error: "No exchange accounts selected" };
  }

  try {
    // Get exchange names for notification
    const accounts = await prisma.exchangeAccount.findMany({
      where: { id: { in: data.exchangeAccountIds } },
      include: { exchange: true },
    });
    const exchangeNames = accounts.map((a) => a.exchange.name);

    await paybackRequestService.createRequest(
      session.user.id,
      data.exchangeAccountIds,
      data.amount,
      data.address.trim(),
      data.network
    );

    // Notify admin via Telegram
    try {
      await notifyAdmin(
        formatWithdrawalRequest({
          userName: session.user.name || "Unknown",
          email: session.user.email || "",
          amount: data.amount,
          network: data.network,
          address: data.address.trim(),
          exchanges: exchangeNames,
        })
      );
    } catch {
      // Don't fail the request if notification fails
    }

    return { success: true };
  } catch (error) {
    console.error("Failed to submit payback request:", error);
    return { success: false, error: "Failed to submit request" };
  }
}

export async function getUserRequestHistory() {
  const session = await auth();
  if (!session) return [];

  try {
    return await paybackRequestService.getByUserId(session.user.id);
  } catch (error) {
    console.error("Failed to get request history:", error);
    return [];
  }
}
