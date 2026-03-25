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
    const success = await sendGroupDigest();

    const kstTime = new Date().toLocaleString("ko-KR", {
      timeZone: "Asia/Seoul",
      hour: "2-digit",
      minute: "2-digit",
    });

    return NextResponse.json({
      ok: true,
      sent: success,
      kstTime,
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
