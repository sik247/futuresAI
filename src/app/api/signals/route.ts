import { NextResponse } from "next/server";
import { fetchMarketSignals } from "@/lib/services/signals/signals.service";

export const dynamic = "force-dynamic";
export const revalidate = 300;

export async function GET() {
  try {
    const data = await fetchMarketSignals();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to fetch market signals:", error);
    return NextResponse.json(
      { error: "Failed to fetch market signals" },
      { status: 500 }
    );
  }
}
