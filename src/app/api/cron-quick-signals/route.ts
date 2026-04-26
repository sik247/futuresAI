import { NextRequest, NextResponse } from "next/server";
import { sendQuickSignals } from "@/lib/services/notifications/telegram-group.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

/** 3x daily: send condensed trading signal digest to Telegram */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const sent = await sendQuickSignals();
    return NextResponse.json({
      ok: true,
      type: "quick-signals",
      sent,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[cron-quick-signals]", error);
    return NextResponse.json({ ok: false, error: String(error) }, { status: 500 });
  }
}
