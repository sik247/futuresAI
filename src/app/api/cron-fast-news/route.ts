import { NextRequest, NextResponse } from "next/server";
import { sendFastNewsFlash } from "@/lib/services/notifications/telegram-group.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 45;

/** 3x daily: send rapid-fire short news items to Telegram */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await sendFastNewsFlash();
    return NextResponse.json({
      ok: true,
      type: "fast-news",
      ...result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[cron-fast-news]", error);
    return NextResponse.json({ ok: false, error: String(error) }, { status: 500 });
  }
}
