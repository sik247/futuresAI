import { CoreService } from "../core/core.service";

class PaybackRequestService extends CoreService {
  async getAllPending() {
    return this.db.withdrawal.findMany({
      where: { status: "PENDING" },
      include: {
        user: { select: { id: true, name: true, email: true, nickname: true } },
        exchangeAccounts: { include: { exchange: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async getAll(status?: "PENDING" | "SUCCESS" | "FAILED") {
    return this.db.withdrawal.findMany({
      where: status ? { status } : {},
      include: {
        user: { select: { id: true, name: true, email: true, nickname: true } },
        exchangeAccounts: { include: { exchange: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async approve(id: string, adminNote?: string) {
    return this.db.withdrawal.update({
      where: { id },
      data: {
        status: "SUCCESS",
        paidAt: new Date(),
        adminNote: adminNote || null,
      },
    });
  }

  async reject(id: string, adminNote: string) {
    return this.db.withdrawal.update({
      where: { id },
      data: {
        status: "FAILED",
        adminNote,
      },
    });
  }

  async createRequest(
    userId: string,
    exchangeAccountIds: string[],
    amount: number,
    address: string,
    network: string = "TRC20"
  ) {
    return this.db.withdrawal.create({
      data: {
        userId,
        amount,
        address,
        network,
        status: "PENDING",
        exchangeAccounts: {
          connect: exchangeAccountIds.map((id) => ({ id })),
        },
      },
    });
  }

  async getByUserId(userId: string) {
    return this.db.withdrawal.findMany({
      where: { userId },
      include: {
        exchangeAccounts: { include: { exchange: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }
}

export const paybackRequestService = new PaybackRequestService();
