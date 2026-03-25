import { NextRequest, NextResponse } from "next/server";
import { fetchPortfolioPrices } from "@/lib/services/portfolio/portfolio-prices";

export async function GET(req: NextRequest) {
  const coins = req.nextUrl.searchParams.get("coins");
  if (!coins) {
    return NextResponse.json({ error: "Missing coins param" }, { status: 400 });
  }

  const coinIds = coins.split(",").filter(Boolean).slice(0, 50);
  const prices = await fetchPortfolioPrices(coinIds);

  return NextResponse.json(prices);
}
