import { NextRequest, NextResponse } from "next/server";
import { sendPolymarketPrediction } from "@/lib/services/notifications/telegram-group.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

/** 1x daily: one verdict-led Polymarket call. Skips send if verdict is weak. */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Send engaging prediction card with image
    const prediction = await sendPolymarketPrediction();
    return NextResponse.json({
      ok: true,
      type: "polymarket-prediction",
      prediction,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[cron-polymarket]", error);
    return NextResponse.json({ ok: false, error: String(error) }, { status: 500 });
  }
}
