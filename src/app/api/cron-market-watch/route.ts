import { NextRequest, NextResponse } from "next/server";
import { runMarketWatch } from "@/lib/services/notifications/market-watch.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 55;

/**
 * Market Watch — change-detection cron
 * Runs every 10 minutes. Only sends alerts when meaningful changes are detected:
 * - Breaking news (new headlines)
 * - Signal direction flips or big price moves (>3%)
 * - Polymarket odds shifts (>5%)
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const force = req.nextUrl.searchParams.get("force") === "1";
    const result = await runMarketWatch(force);
    return NextResponse.json({
      ok: true,
      type: "market-watch",
      ...result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[cron-market-watch]", error);
    return NextResponse.json({ ok: false, error: String(error) }, { status: 500 });
  }
}
