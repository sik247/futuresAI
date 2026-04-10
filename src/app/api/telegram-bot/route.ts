import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Telegram bot webhook — disabled.
 * Payment and subscription handled via web at /pricing.
 * Bot is channel-only for announcements (cron jobs).
 */
export async function POST(_req: NextRequest) {
  return NextResponse.json({ ok: true });
}
