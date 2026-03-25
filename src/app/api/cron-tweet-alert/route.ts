import { NextRequest, NextResponse } from "next/server";
import { sendTweetAlert } from "@/lib/services/notifications/telegram-group.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

/** Every 2-3 hours: check for significant tweets, send only if worthy */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const sent = await sendTweetAlert();
    return NextResponse.json({
      ok: true,
      type: "tweet-alert",
      sent,
      skipped: !sent,
      reason: sent ? "significant tweet found" : "nothing significant right now",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[cron-tweet-alert]", error);
    return NextResponse.json({ ok: false, error: String(error) }, { status: 500 });
  }
}
