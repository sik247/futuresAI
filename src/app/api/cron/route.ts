export const dynamic = "force-dynamic";

import { exchangeAccountsService } from "@/lib/services/exchange-accounts/exchange-accounts.service";
import { bingXService } from "@/lib/services/exchanges/bingx.service";
import { bitgetService } from "@/lib/services/exchanges/bitget.service";
// OKX removed — HTX added
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
      console.error(error);
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
  const exchange = exchangeAccount.exchange;
  switch (exchange.id) {
    case "3":
      return handleBitget;
    // case "5": OKX removed
    case "2":
      return handleBingx;
    // case "4":
    //   return handleBybit;
    default:
      return null;
  }
}

// OKX handler removed

const handleBitget: IHandler = async (exchangeAccount: TExchangeAccount) => {
  let result: IHandlerReturn = { newTrades: [] };
  const data = await bitgetService.getAffiliateData(exchangeAccount.uid);
  if (data.length === 0) return result;
  if (exchangeAccount.status !== "ACTIVE") {
    exchangeAccountsService.activate(exchangeAccount.id);
  }

  for (const item of data) {
    const hasSame = await exchangeAccountsService.findSameTrade({
      exchangeAccountId: exchangeAccount.id,
      amount: item.payback,
      apiCreatedAt: item.date,
    });
    if (hasSame) continue;
    const newTrades = await exchangeAccountsService.addTrades([
      {
        amount: item.payback,
        exchangeAccount: {
          connect: {
            id: exchangeAccount.id,
          },
        },
        apiCreatedAt: item.date,
        payback: item.payback,
      },
    ]);
    result.newTrades.push(...newTrades);
  }
  return result;
};

// const handleBybit: IHandler = async (exchangeAccount: TExchangeAccount) => {
//   const data = await byBitService.getAffiliateData(exchangeAccount.uid);
// };

const handleBingx: IHandler = async (exchangeAccount: TExchangeAccount) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const data = await bingXService.getAffiliateData(exchangeAccount.uid, today);
  console.log("BINGX");
  console.log(data);
  return { newTrades: [] };
};
