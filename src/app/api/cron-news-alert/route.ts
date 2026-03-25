import { NextRequest, NextResponse } from "next/server";
import { sendHourlyNewsAlert } from "@/lib/services/notifications/telegram-group.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

/** Hourly: send 1 significant news item in Korean */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const sent = await sendHourlyNewsAlert();
    return NextResponse.json({
      ok: true,
      type: "news-alert",
      sent,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[cron-news-alert]", error);
    return NextResponse.json({ ok: false, error: String(error) }, { status: 500 });
  }
}
