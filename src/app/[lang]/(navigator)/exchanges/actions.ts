"use server";

import { exchangesService } from "@/lib/services/exchanges/exchanges.service";

export async function getExchanges() {
  try {
    return await exchangesService.getAll();
  } catch (error) {
    console.error("Failed to fetch exchanges:", error);
    return [];
  }
}
