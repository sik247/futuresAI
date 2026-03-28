const TELEGRAM_API = "https://api.telegram.org/bot";

function getBotToken(): string {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error("TELEGRAM_BOT_TOKEN not configured");
  return token;
}

export async function sendTelegramMessage(
  chatId: string,
  text: string,
  parseMode: "HTML" | "Markdown" = "HTML"
): Promise<boolean> {
  try {
    const res = await fetch(
      `${TELEGRAM_API}${getBotToken()}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: parseMode,
        }),
      }
    );
    const data = await res.json();
    if (!data.ok) {
      console.error("Telegram send failed:", data.description);
      return false;
    }
    return true;
  } catch (error) {
    console.error("Telegram send error:", error);
    return false;
  }
}

/**
 * Admin notifications DISABLED — bot is now channel-only.
 * Admin duties moved to web dashboard at /dashboard/admin.
 * Keeping the function signature so callers don't break.
 */
export async function notifyAdmin(_text: string): Promise<boolean> {
  // Admin notifications disabled — check admin dashboard instead
  return true;
}

// Admin template functions kept for compatibility but not used
export function formatTradeNotification(_trades: any[]): string { return ""; }
export function formatDailySummary(_data: any): string { return ""; }
export function formatWithdrawalRequest(_data: any): string { return ""; }
export function formatChartAnalysisNotification(_data: any): string { return ""; }

// -- Channel (Korean content bot) --

function getGroupChatId(): string {
  const chatId = process.env.TELEGRAM_GROUP_CHAT_ID;
  if (!chatId) throw new Error("TELEGRAM_GROUP_CHAT_ID not configured");
  return chatId;
}

export async function sendGroupMessage(
  text: string,
  parseMode: "HTML" | "Markdown" = "HTML"
): Promise<boolean> {
  return sendTelegramMessage(getGroupChatId(), text, parseMode);
}

export async function sendGroupPhoto(
  photoUrl: string,
  caption: string,
  parseMode: "HTML" | "Markdown" = "HTML"
): Promise<boolean> {
  try {
    const res = await fetch(
      `${TELEGRAM_API}${getBotToken()}/sendPhoto`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: getGroupChatId(),
          photo: photoUrl,
          caption,
          parse_mode: parseMode,
        }),
      }
    );
    const data = await res.json();
    if (!data.ok) {
      console.error("Telegram sendPhoto failed:", data.description);
      return false;
    }
    return true;
  } catch (error) {
    console.error("Telegram sendPhoto error:", error);
    return false;
  }
}
