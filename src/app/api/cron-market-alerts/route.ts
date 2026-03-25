import { NextRequest, NextResponse } from "next/server";
import { runMarketAlertChecks } from "@/lib/services/notifications/market-alerts.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 45;

/** Every 4H: check price movement, volume spikes, liquidations, OI */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const results = await runMarketAlertChecks();
    return NextResponse.json({
      ok: true,
      type: "market-alerts",
      ...results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[cron-market-alerts]", error);
    return NextResponse.json({ ok: false, error: String(error) }, { status: 500 });
  }
}
