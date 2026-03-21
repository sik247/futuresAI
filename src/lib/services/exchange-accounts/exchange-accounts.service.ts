import { Prisma, Trade } from "@prisma/client";
import { CoreService } from "../core/core.service";

class ExchangeAccountsService extends CoreService {
  async getAllByUserId(userId: string) {
    const exchangeAccounts = await this.db.exchangeAccount.findMany({
      where: {
        user: {
          id: userId,
        },
      },
      include: {
        exchange: true,
        trades: {
          where: {
            withdrawId: null,
          },
        },
      },
    });
    return exchangeAccounts;
  }
  async create(data: Prisma.ExchangeAccountCreateInput) {
    return this.db.exchangeAccount.create({
      data,
    });
  }
  async getAll() {
    return this.db.exchangeAccount.findMany({
      include: {
        exchange: true,
        user: true,
      },
    });
  }
  async activate(id: string) {
    return this.db.exchangeAccount.update({
      where: {
        id,
      },
      data: {
        status: "ACTIVE",
      },
    });
  }

  async addTrades(trades: Prisma.TradeCreateInput[]) {
    const result: Trade[] = [];
    for (const trade of trades) {
      const created = await this.db.trade.create({
        data: trade,
      });
      result.push(created);
    }
    return result;
  }

  async findSameTrade({
    exchangeAccountId,
    amount,
    apiCreatedAt,
  }: {
    exchangeAccountId: string;
    amount: number;
    apiCreatedAt: Date;
  }) {
    return this.db.trade.findUnique({
      where: {
        unique_trade: {
          accountId: exchangeAccountId,
          amount,
          apiCreatedAt,
        },
      },
    });
  }
}

export const exchangeAccountsService = new ExchangeAccountsService();
