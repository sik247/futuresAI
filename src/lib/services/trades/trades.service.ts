import { CoreService } from "../core/core.service";

class TradesService extends CoreService {
  async getTotalTradesByUserId(userId: string) {
    return this.db.trade.findMany({
      where: {
        exchangeAccount: {
          user: {
            id: userId,
          },
        },
      },
    });
  }

  async getTotalPaybackByUserId(userId: string) {
    const trades = await this.getTotalTradesByUserId(userId);
    return trades.reduce((acc, trade) => acc + trade.payback, 0);
  }
}

export const tradesService = new TradesService();
