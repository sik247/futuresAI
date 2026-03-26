import { NextRequest, NextResponse } from "next/server";
import { sendPolymarketAlert } from "@/lib/services/notifications/polymarket-alerts.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 20;

/** 2x daily: interesting polymarket prediction changes in Korean */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const sent = await sendPolymarketAlert();
    return NextResponse.json({
      ok: true,
      type: "polymarket",
      sent,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[cron-polymarket]", error);
    return NextResponse.json({ ok: false, error: String(error) }, { status: 500 });
  }
}
