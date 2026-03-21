"use server";

import { exchangesService } from "@/lib/services/exchanges/exchanges.service";
import { paybackService } from "@/lib/services/payback/payback.service";

export async function getExchangesForCalculator() {
  try {
    const exchanges = await exchangesService.getAll();
    return exchanges.map((ex) => ({
      id: ex.id,
      name: ex.name,
      logo: ex.imageUrl || ex.titleImageUrl,
      makerFee: ex.limitFee,
      takerFee: ex.marketFee,
      paybackRate: ex.paybackRatio / 100,
      color: "#000",
      features: [] as string[],
    }));
  } catch (error) {
    console.error("Failed to fetch exchanges for calculator:", error);
    return [];
  }
}

export async function saveCalculation(data: {
  exchangeName: string;
  tradeType: string;
  volume: number;
  leverage: number;
  makerPct: number;
  monthlyFees: number;
  payback: number;
  yearlySavings: number;
}) {
  try {
    const calc = await paybackService.create(data);
    return { success: true, id: calc.id };
  } catch (error) {
    console.error("Failed to save calculation:", error);
    return { success: false, error: "Failed to save calculation" };
  }
}

export async function getRecentCalculations(limit: number = 10) {
  try {
    return await paybackService.getRecent(limit);
  } catch (error) {
    console.error("Failed to fetch recent calculations:", error);
    return [];
  }
}
