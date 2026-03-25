import { NextRequest, NextResponse } from "next/server";
import { sendDailySentiment } from "@/lib/services/notifications/telegram-group.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 45;

/** Once daily (9 AM KST): comprehensive sentiment + quant analysis */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const sent = await sendDailySentiment();
    return NextResponse.json({
      ok: true,
      type: "daily-sentiment",
      sent,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[cron-daily-sentiment]", error);
    return NextResponse.json({ ok: false, error: String(error) }, { status: 500 });
  }
}
