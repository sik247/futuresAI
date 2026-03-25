import { NextRequest, NextResponse } from "next/server";
import { sendQuantReport } from "@/lib/services/notifications/quant-report.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 45;

/** 2-3x daily: detailed quant chart analysis report in Korean */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const sent = await sendQuantReport();
    return NextResponse.json({
      ok: true,
      type: "quant-report",
      sent,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[cron-quant-report]", error);
    return NextResponse.json({ ok: false, error: String(error) }, { status: 500 });
  }
}
