import { NextRequest, NextResponse } from "next/server";
import { checkExchangeFlowAlert } from "@/lib/services/notifications/market-alerts.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 15;

/** Daily: taker buy/sell ratio as exchange flow proxy */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const sent = await checkExchangeFlowAlert();
    return NextResponse.json({
      ok: true,
      type: "exchange-flow",
      sent,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[cron-exchange-flow]", error);
    return NextResponse.json({ ok: false, error: String(error) }, { status: 500 });
  }
}
