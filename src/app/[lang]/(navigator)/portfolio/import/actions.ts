"use server";

import { parseOrderScreenshot, parseOrderCSV } from "@/lib/services/portfolio/order-ocr.service";

export async function analyzeOrderScreenshot(imageUrl: string) {
  return parseOrderScreenshot(imageUrl);
}

export async function analyzeOrderCSV(csvText: string) {
  return parseOrderCSV(csvText);
}
