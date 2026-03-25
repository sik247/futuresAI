import { NextRequest, NextResponse } from "next/server";
import { sendWeeklySummary } from "@/lib/services/notifications/weekly-summary.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

/** Sunday 9 AM KST: comprehensive weekly performance summary */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const sent = await sendWeeklySummary();
    return NextResponse.json({
      ok: true,
      type: "weekly-summary",
      sent,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[cron-weekly-summary]", error);
    return NextResponse.json({ ok: false, error: String(error) }, { status: 500 });
  }
}
