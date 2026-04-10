import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * One-time webhook setup endpoint.
 *
 * GET /api/admin/telegram/setup-webhook?secret=<CRON_SECRET>
 *
 * Registers our webhook URL with Telegram so @FuturesAIAdminbot starts
 * receiving group messages. Hit this once after deploy.
 *
 * Optional query params:
 *   - url: override the webhook URL (default: auto-derived from request)
 *   - reset: if "1", deletes the current webhook first
 */
export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    return NextResponse.json({ error: "TELEGRAM_BOT_TOKEN not configured" }, { status: 500 });
  }

  // Derive webhook URL from request host unless overridden
  const customUrl = req.nextUrl.searchParams.get("url");
  const host = req.headers.get("host") || req.nextUrl.host;
  const proto = host.includes("localhost") ? "http" : "https";
  const webhookUrl = customUrl || `${proto}://${host}/api/telegram-bot`;

  // Optional reset first
  if (req.nextUrl.searchParams.get("reset") === "1") {
    await fetch(`https://api.telegram.org/bot${token}/deleteWebhook?drop_pending_updates=true`);
  }

  // Register
  const registerRes = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      url: webhookUrl,
      allowed_updates: ["message", "edited_message", "chat_member", "my_chat_member"],
      drop_pending_updates: true,
    }),
  });
  const registerData = await registerRes.json();

  // Confirm
  const infoRes = await fetch(`https://api.telegram.org/bot${token}/getWebhookInfo`);
  const infoData = await infoRes.json();

  return NextResponse.json({
    registered: registerData,
    currentWebhookInfo: infoData.result,
    webhookUrl,
  });
}
