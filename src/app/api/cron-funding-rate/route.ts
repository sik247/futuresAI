import { NextRequest, NextResponse } from "next/server";
import { checkFundingRateAlert } from "@/lib/services/notifications/market-alerts.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 15;

/** Every 8H (aligned with funding): check extreme funding rates */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const sent = await checkFundingRateAlert();
    return NextResponse.json({
      ok: true,
      type: "funding-rate",
      sent,
      skipped: !sent,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[cron-funding-rate]", error);
    return NextResponse.json({ ok: false, error: String(error) }, { status: 500 });
  }
}
