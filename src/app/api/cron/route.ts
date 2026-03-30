export const dynamic = "force-dynamic";

import { exchangeAccountsService } from "@/lib/services/exchange-accounts/exchange-accounts.service";
import { bingXService } from "@/lib/services/exchanges/bingx.service";
import { bitgetService } from "@/lib/services/exchanges/bitget.service";
import { byBitService } from "@/lib/services/exchanges/bybit.service";
import { okxService } from "@/lib/services/exchanges/okx.service";
import { gateService } from "@/lib/services/exchanges/gate.service";
import { htxService } from "@/lib/services/exchanges/htx.service";
import { Prisma, Trade } from "@prisma/client";
import {
  notifyAdmin,
  formatTradeNotification,
} from "@/lib/services/notifications/telegram.service";

interface IHandlerReturn {
  newTrades: Trade[];
}

interface IHandler {
  (exchangeAccount: TExchangeAccount): Promise<IHandlerReturn>;
}

type TExchangeAccount = Prisma.ExchangeAccountGetPayload<{
  include: {
    exchange: true;
    user: true;
  };
}>;

export async function GET(request: Request) {
  // Validate cron secret in production
  if (process.env.CRON_SECRET) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const exchangeAccounts = await exchangeAccountsService.getAll();
  const tradesSummary: {
    exchange: string;
    uid: string;
    amount: number;
    count: number;
  }[] = [];

  for (const exchangeAccount of exchangeAccounts) {
    try {
      const handler = getHandler(exchangeAccount);
      if (!handler) continue;
      const result = await handler(exchangeAccount);

      if (result.newTrades.length > 0) {
        const totalAmount = result.newTrades.reduce(
          (sum, t) => sum + t.payback,
          0
        );
        tradesSummary.push({
          exchange: exchangeAccount.exchange.name,
          uid: exchangeAccount.uid,
          amount: totalAmount,
          count: result.newTrades.length,
        });
      }
    } catch (error) {
      console.error(`Cron sync error for ${exchangeAccount.exchange.name}:`, error);
      continue;
    }
  }

  // Send Telegram notification if new trades were synced
  if (tradesSummary.length > 0) {
    try {
      const message = formatTradeNotification(tradesSummary);
      await notifyAdmin(message);
    } catch (error) {
      console.error("Telegram notification failed:", error);
    }
  }

  return Response.json({
    synced: tradesSummary.length,
    trades: tradesSummary,
  });
}

function getHandler(exchangeAccount: TExchangeAccount): IHandler | null {
  const exchangeName = exchangeAccount.exchange.name.toLowerCase();
  if (exchangeName.includes("bitget")) return handleBitget;
  if (exchangeName.includes("bingx")) return handleBingx;
  if (exchangeName.includes("bybit")) return handleBybit;
  if (exchangeName.includes("okx")) return handleOkx;
  if (exchangeName.includes("gate")) return handleGate;
  if (exchangeName.includes("htx") || exchangeName.includes("huobi")) return handleHtx;
  return null;
}

/* -- Helper to save trades without duplicates -- */
async function saveTrades(
  exchangeAccountId: string,
  items: { amount: number; payback: number; date: Date }[]
): Promise<Trade[]> {
  const newTrades: Trade[] = [];
  for (const item of items) {
    const hasSame = await exchangeAccountsService.findSameTrade({
      exchangeAccountId,
      amount: item.amount,
      apiCreatedAt: item.date,
    });
    if (hasSame) continue;
    const created = await exchangeAccountsService.addTrades([
      {
        amount: item.amount,
        exchangeAccount: { connect: { id: exchangeAccountId } },
        apiCreatedAt: item.date,
        payback: item.payback,
      },
    ]);
    newTrades.push(...created);
  }
  return newTrades;
}

const handleBitget: IHandler = async (exchangeAccount) => {
  const data = await bitgetService.getAffiliateData(exchangeAccount.uid);
  if (data.length === 0) return { newTrades: [] };
  if (exchangeAccount.status !== "ACTIVE") {
    exchangeAccountsService.activate(exchangeAccount.id);
  }
  const newTrades = await saveTrades(
    exchangeAccount.id,
    data.map((item: any) => ({ amount: item.payback, payback: item.payback, date: item.date }))
  );
  return { newTrades };
};

const handleBingx: IHandler = async (exchangeAccount) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const { data: rawData } = await bingXService.getAffiliateData(exchangeAccount.uid, today);
  const parsed = JSON.parse(rawData);
  if (parsed.code !== 0 || !parsed.data?.list?.length) return { newTrades: [] };

  if (exchangeAccount.status !== "ACTIVE") {
    exchangeAccountsService.activate(exchangeAccount.id);
  }

  const newTrades = await saveTrades(
    exchangeAccount.id,
    parsed.data.list.map((item: any) => ({
      amount: parseFloat(item.commission || "0"),
      payback: parseFloat(item.commission || "0"),
      date: new Date(parseInt(item.time || Date.now())),
    }))
  );
  return { newTrades };
};

const handleBybit: IHandler = async (exchangeAccount) => {
  const response = await byBitService.getAffiliateData(exchangeAccount.uid);
  if (response.retCode !== 0) return { newTrades: [] };

  const result = response.result as any;
  const commission = parseFloat(result?.totalCommission || result?.commission || "0");
  if (commission <= 0) return { newTrades: [] };

  if (exchangeAccount.status !== "ACTIVE") {
    exchangeAccountsService.activate(exchangeAccount.id);
  }

  const newTrades = await saveTrades(exchangeAccount.id, [
    { amount: commission, payback: commission, date: new Date() },
  ]);
  return { newTrades };
};

const handleOkx: IHandler = async (exchangeAccount) => {
  const data: any = await okxService.getAffiliateData(exchangeAccount.uid);
  if (!data.ok || !data.payback) return { newTrades: [] };

  if (exchangeAccount.status !== "ACTIVE") {
    exchangeAccountsService.activate(exchangeAccount.id);
  }

  const payback = typeof data.payback === "number" ? data.payback : parseFloat(data.payback);
  const newTrades = await saveTrades(exchangeAccount.id, [
    { amount: payback, payback, date: new Date() },
  ]);
  return { newTrades };
};

const handleGate: IHandler = async (exchangeAccount) => {
  const data = await gateService.getAffiliateData(exchangeAccount.uid);
  if (!data.ok || !data.payback) return { newTrades: [] };

  if (exchangeAccount.status !== "ACTIVE") {
    exchangeAccountsService.activate(exchangeAccount.id);
  }

  const newTrades = await saveTrades(exchangeAccount.id, [
    { amount: data.payback, payback: data.payback, date: new Date() },
  ]);
  return { newTrades };
};

const handleHtx: IHandler = async (exchangeAccount) => {
  const data = await htxService.getAffiliateData(exchangeAccount.uid);
  if (!data.ok || !data.payback) return { newTrades: [] };

  if (exchangeAccount.status !== "ACTIVE") {
    exchangeAccountsService.activate(exchangeAccount.id);
  }

  const newTrades = await saveTrades(exchangeAccount.id, [
    { amount: data.payback, payback: data.payback, date: new Date() },
  ]);
  return { newTrades };
};
