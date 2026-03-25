import { NextRequest, NextResponse } from "next/server";
import { sendGroupDigest } from "@/lib/services/notifications/telegram-group.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  // Validate cron secret
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Determine period based on UTC hour
    // 0 UTC = 9 AM KST (morning), 11 UTC = 8 PM KST (evening)
    const hour = new Date().getUTCHours();
    const period = hour < 6 ? "morning" : "evening";

    const success = await sendGroupDigest(period);

    return NextResponse.json({
      ok: true,
      period,
      sent: success,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Telegram group cron error:", error);
    return NextResponse.json(
      { ok: false, error: String(error) },
      { status: 500 }
    );
  }
}
