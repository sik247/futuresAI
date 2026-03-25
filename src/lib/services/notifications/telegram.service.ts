const TELEGRAM_API = "https://api.telegram.org/bot";

function getBotToken(): string {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error("TELEGRAM_BOT_TOKEN not configured");
  return token;
}

function getAdminChatId(): string {
  const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID;
  if (!chatId) throw new Error("TELEGRAM_ADMIN_CHAT_ID not configured");
  return chatId;
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

export async function notifyAdmin(text: string): Promise<boolean> {
  return sendTelegramMessage(getAdminChatId(), text);
}

// -- Notification templates --

export function formatTradeNotification(trades: {
  exchange: string;
  uid: string;
  amount: number;
  count: number;
}[]): string {
  if (trades.length === 0) return "";

  const totalAmount = trades.reduce((sum, t) => sum + t.amount, 0);
  const totalCount = trades.reduce((sum, t) => sum + t.count, 0);

  let msg = `<b>New Trades Synced</b>\n\n`;
  for (const t of trades) {
    msg += `  <b>${t.exchange}</b> (${t.uid})\n`;
    msg += `  ${t.count} trade(s) — $${t.amount.toFixed(2)}\n\n`;
  }
  msg += `<b>Total:</b> ${totalCount} trades — <b>$${totalAmount.toFixed(2)}</b>`;
  return msg;
}

export function formatDailySummary(data: {
  exchanges: { name: string; payback: number; status: string }[];
  grandTotal: number;
  pendingWithdrawals: number;
  pendingWithdrawalAmount: number;
  pendingAnalyses: number;
  pendingAnalysisRevenue: number;
}): string {
  const now = new Date().toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  let msg = `<b>Daily Admin Summary</b>\n<i>${now}</i>\n\n`;

  // Exchange breakdown
  msg += `<b>Exchange Paybacks</b>\n`;
  for (const ex of data.exchanges) {
    const icon = ex.status === "ok" ? "✅" : "❌";
    msg += `${icon} ${ex.name}: <b>$${ex.payback.toFixed(2)}</b>\n`;
  }
  msg += `\n<b>Total Payback:</b> $${data.grandTotal.toFixed(2)}\n\n`;

  // Pending withdrawals
  if (data.pendingWithdrawals > 0) {
    msg += `<b>Pending Withdrawals:</b> ${data.pendingWithdrawals} ($${data.pendingWithdrawalAmount.toFixed(2)})\n`;
  } else {
    msg += `<b>Pending Withdrawals:</b> None\n`;
  }

  // Chart analysis revenue
  if (data.pendingAnalyses > 0) {
    msg += `<b>Pending Chart Analyses:</b> ${data.pendingAnalyses} ($${data.pendingAnalysisRevenue.toFixed(2)})\n`;
  }

  msg += `\n<i>— FuturesAI</i>`;
  return msg;
}

export function formatWithdrawalRequest(data: {
  userName: string;
  email: string;
  amount: number;
  network: string;
  address: string;
  exchanges: string[];
}): string {
  return (
    `<b>New Withdrawal Request</b>\n\n` +
    `<b>User:</b> ${data.userName} (${data.email})\n` +
    `<b>Amount:</b> $${data.amount.toFixed(2)}\n` +
    `<b>Network:</b> ${data.network}\n` +
    `<b>Address:</b> <code>${data.address}</code>\n` +
    `<b>Exchanges:</b> ${data.exchanges.join(", ")}\n\n` +
    `<i>Please review in the admin dashboard.</i>`
  );
}

export function formatChartAnalysisNotification(data: {
  userName: string;
  trend: string;
  confidence: number;
  cost: number;
}): string {
  return (
    `<b>New Chart Analysis</b>\n\n` +
    `<b>User:</b> ${data.userName}\n` +
    `<b>Trend:</b> ${data.trend}\n` +
    `<b>Confidence:</b> ${data.confidence}%\n` +
    `<b>Charge:</b> ${data.cost.toFixed(0)} USDT (pending approval)\n`
  );
}

// -- Group chat helpers --

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
