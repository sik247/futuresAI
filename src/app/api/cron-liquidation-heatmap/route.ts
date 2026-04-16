import { NextRequest, NextResponse } from "next/server";
import { generateLiquidationHeatmap } from "@/lib/services/notifications/liquidation-heatmap.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const sent = await generateLiquidationHeatmap();
    return NextResponse.json({
      ok: true,
      type: "liquidation-heatmap",
      sent,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[cron-liquidation-heatmap]", error);
    return NextResponse.json(
      { error: "Failed to generate liquidation heatmap" },
      { status: 500 }
    );
  }
}
