import { Prisma } from "@prisma/client";
import { CoreService } from "../core/core.service";

class ExchangesService extends CoreService {
  async getAll() {
    return this.db.exchange.findMany();
  }

  async getById(id: string) {
    return this.db.exchange.findUnique({
      where: { id },
    });
  }

  async create(data: Prisma.ExchangeCreateInput) {
    return this.db.exchange.create({
      data,
    });
  }

  async update(id: string, data: Prisma.ExchangeUpdateInput) {
    return this.db.exchange.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    return this.db.exchange.delete({
      where: { id },
    });
  }
}

export const exchangesService = new ExchangesService();
