"use server";

import { auth } from "@/auth";
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
  if (!session) {
    throw redirect("/login");
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
    uid: uid,
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
  if (!session) {
    throw redirect("/login");
  }

  return await withdrawsService.create({
    trades: {
      connect: tradeIds.map((id) => ({
        id,
      })),
    },
    exchangeAccounts: {
      connect: exchangeAccountIds.map((id) => ({
        id,
      })),
    },
    network,
    address,
    amount: amount,
  });
}
