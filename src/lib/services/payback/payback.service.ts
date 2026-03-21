import { CoreService } from "../core/core.service";

export interface PaybackCalculationInput {
  exchangeName: string;
  tradeType: string;
  volume: number;
  leverage: number;
  makerPct: number;
  monthlyFees: number;
  payback: number;
  yearlySavings: number;
}

class PaybackService extends CoreService {
  async getAll() {
    return (this.db as any).paybackCalculation.findMany({
      orderBy: { createdAt: "desc" },
    });
  }

  async getById(id: string) {
    return (this.db as any).paybackCalculation.findUnique({
      where: { id },
    });
  }

  async create(data: PaybackCalculationInput) {
    return (this.db as any).paybackCalculation.create({
      data,
    });
  }

  async getRecent(limit: number = 10) {
    return (this.db as any).paybackCalculation.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  }

  async delete(id: string) {
    return (this.db as any).paybackCalculation.delete({
      where: { id },
    });
  }
}

export const paybackService = new PaybackService();
