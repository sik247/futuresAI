export const dynamic = "force-dynamic";

import { exchangeAccountsService } from "@/lib/services/exchange-accounts/exchange-accounts.service";
import { bingXService } from "@/lib/services/exchanges/bingx.service";
import { bitgetService } from "@/lib/services/exchanges/bitget.service";
import { okxService } from "@/lib/services/exchanges/okx.service";
import { Prisma, Trade } from "@prisma/client";

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

export async function GET() {
  const data = {};
  const exchangeAccounts = await exchangeAccountsService.getAll();
  console.log(exchangeAccounts.length);
  for (const exchangeAccount of exchangeAccounts) {
    try {
      const handler = getHandler(exchangeAccount);
      if (!handler) continue;
      const result = await handler(exchangeAccount);
      console.log(result);
    } catch (error) {
      console.error(error);
      continue;
    }
  }
  return Response.json({ data });
}

function getHandler(exchangeAccount: TExchangeAccount): IHandler | null {
  const exchange = exchangeAccount.exchange;
  switch (exchange.id) {
    case "3":
      return handleBitget;
    case "5":
      return handleOkx;
    case "2":
      return handleBingx;
    // case "4":
    //   return handleBybit;
    default:
      return null;
  }
}

const handleOkx: IHandler = async (exchangeAccount: TExchangeAccount) => {
  let result: IHandlerReturn = { newTrades: [] };
  const data = await okxService.getAffiliateData(exchangeAccount.uid);
  if (data === undefined || data.payback === undefined) return result;
  if (exchangeAccount.status !== "ACTIVE") {
    exchangeAccountsService.activate(exchangeAccount.id);
  }
  if (data.payback === 0) return result;
  const totalCommission = exchangeAccount.totalCommission;
  const delta = data.payback - totalCommission;
  if (delta === 0) return result;
  const newTrades = await exchangeAccountsService.addTrades([
    {
      amount: delta,
      exchangeAccount: {
        connect: {
          id: exchangeAccount.id,
        },
      },
      payback: delta,
    },
  ]);
  return { newTrades };
};

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
