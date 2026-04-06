import { NextResponse } from "next/server";
import { detectWhaleMovements } from "@/lib/services/whales/hyperliquid.service";
import { sendGroupMessage } from "@/lib/services/notifications/telegram.service";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function GET() {
  try {
    const movements = await detectWhaleMovements();

    if (movements.length === 0) {
      return NextResponse.json({ ok: true, movements: 0 });
    }

    // Format Telegram alert
    const lines = movements.slice(0, 10).map((m) => {
      const emoji =
        m.type === "LARGE_TRADE" ? (m.direction === "LONG" ? "\u{1F7E2}" : "\u{1F534}") :
        m.type === "LIQUIDATION_RISK" ? "\u26A0\uFE0F" :
        m.type === "NEW_POSITION" ? "\u{1F195}" : "\u274C";
      return `${emoji} <b>${m.whale}</b> — ${m.details}`;
    });

    const message = `\u{1F433} <b>Whale Alert</b>\n\n${lines.join("\n")}\n\n<i>${movements.length} movements detected</i>`;

    try {
      await sendGroupMessage(message);
    } catch {
      // Don't fail if Telegram is down
    }

    return NextResponse.json({ ok: true, movements: movements.length, alerts: movements.slice(0, 10) });
  } catch (error) {
    console.error("[Whale Alert Cron]", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
