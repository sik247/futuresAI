import { Prisma } from "@prisma/client";
import { CoreService } from "../core/core.service";

class WithdrawsService extends CoreService {
  async getAllByUserId(userId: string) {
    return this.db.withdrawal.findMany({
      where: {
        exchangeAccounts: {
          some: {
            user: {
              id: userId,
            },
          },
        },
      },
      include: {
        exchangeAccounts: {
          include: {
            exchange: true,
          },
        },
        trades: true,
      },
    });
  }

  async create(data: Prisma.WithdrawalCreateInput) {
    return this.db.withdrawal.create({
      data,
    });
  }
}

export const withdrawsService = new WithdrawsService();
