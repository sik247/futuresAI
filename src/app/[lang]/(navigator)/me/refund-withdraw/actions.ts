"use server";

import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { exchangeAccountsService } from "@/lib/services/exchange-accounts/exchange-accounts.service";
import { exchangesService } from "@/lib/services/exchanges/exchanges.service";
import { withdrawsService } from "@/lib/services/withdraws/withdraws.service";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function getExchanges() {
  return await exchangesService.getAll();
}

export async function getExchangeAccounts() {
  const session = await auth();
  if (!session) {
    throw redirect("/login");
  }
  return await exchangeAccountsService.getAllByUserId(session.user.id);
}

export async function createExchangeAccount(exchangeId: string, uid: string) {
  const session = await auth();
  if (!session?.user?.email) {
    throw new Error("Unauthorized: 로그인이 필요합니다.");
  }
  if (!exchangeId || !uid?.trim()) {
    throw new Error("거래소와 UID를 모두 입력해주세요.");
  }

  const trimmedUid = uid.trim();

  const existing = await prisma.exchangeAccount.findFirst({
    where: { userId: session.user.id, exchangeId },
  });
  if (existing) {
    throw new Error("이미 해당 거래소를 연동하셨습니다.");
  }

  const exchangeAccount = await exchangeAccountsService.create({
    exchange: {
      connect: {
        id: exchangeId,
      },
    },
    user: {
      connect: {
        email: session.user.email,
      },
    },
    uid: trimmedUid,
  });
  revalidatePath("/me/refund-withdraw");

  return exchangeAccount;
}

export async function getWithdrawals() {
  const session = await auth();
  if (!session) {
    throw redirect("/login");
  }
  return await withdrawsService.getAllByUserId(session.user.id);
}

export async function createWithdrawal(
  amount: number,
  tradeIds: string[],
  exchangeAccountIds: string[],
  network: string,
  address: string
) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized: 로그인이 필요합니다.");
  }
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("유효한 금액이 아닙니다.");
  }
  if (!Array.isArray(tradeIds) || tradeIds.length === 0) {
    throw new Error("환급받을 거래 내역을 선택해주세요.");
  }
  if (!Array.isArray(exchangeAccountIds) || exchangeAccountIds.length === 0) {
    throw new Error("환급받을 거래소를 선택해주세요.");
  }
  if (!network || !address?.trim()) {
    throw new Error("네트워크와 지갑주소를 입력해주세요.");
  }

  // Ownership check: every submitted exchangeAccount must belong to this user,
  // and every submitted trade must belong to one of those accounts and not yet
  // be attached to another withdrawal. This prevents forged trade IDs from
  // draining other users' payback.
  const ownedAccounts = await prisma.exchangeAccount.findMany({
    where: { id: { in: exchangeAccountIds }, userId: session.user.id },
    select: { id: true },
  });
  if (ownedAccounts.length !== exchangeAccountIds.length) {
    throw new Error("ownership: 선택한 거래소 계정에 대한 권한이 없습니다.");
  }

  const ownedTrades = await prisma.trade.findMany({
    where: {
      id: { in: tradeIds },
      accountId: { in: ownedAccounts.map((a) => a.id) },
      withdrawId: null,
      status: "SUCCESS",
    },
    select: { id: true, payback: true },
  });
  if (ownedTrades.length !== tradeIds.length) {
    throw new Error("ownership: 선택한 거래 내역에 대한 권한이 없거나 이미 신청된 항목입니다.");
  }

  const claimableTotal = ownedTrades.reduce((s, t) => s + t.payback, 0);
  // Tolerate sub-cent rounding noise (0.01 USDT).
  if (amount > claimableTotal + 0.01) {
    throw new Error("신청 금액이 선택한 환급 내역 합계를 초과합니다.");
  }

  const withdrawal = await withdrawsService.create({
    user: { connect: { id: session.user.id } },
    trades: {
      connect: ownedTrades.map((t) => ({ id: t.id })),
    },
    exchangeAccounts: {
      connect: ownedAccounts.map((a) => ({ id: a.id })),
    },
    network,
    address: address.trim(),
    amount,
  });
  revalidatePath("/me/refund-withdraw");
  return withdrawal;
}
