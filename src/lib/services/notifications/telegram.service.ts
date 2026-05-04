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
 * Admin DM notifications. Re-enabled for high-signal alerts (payback requests).
 * Set TELEGRAM_ADMIN_CHAT_ID env var to the admin's personal chat ID — the
 * bot must already have a DM with that user (send /start once).
 * If unset, this is a no-op so callers won't break in dev.
 */
export async function notifyAdmin(text: string): Promise<boolean> {
  const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID;
  if (!chatId || !text) return true;
  return sendTelegramMessage(chatId, text, "HTML");
}

/**
 * Dedicated payback-alert bot — separate from the main FuturesAI bot.
 * Fires when a user submits a payback withdrawal request.
 *
 * Setup:
 *   1. /newbot in @BotFather → get a new token
 *   2. Start a DM with that bot (or add it to a private group)
 *   3. Get the chat_id (https://api.telegram.org/bot<token>/getUpdates)
 *   4. Set TELEGRAM_PAYBACK_BOT_TOKEN and TELEGRAM_PAYBACK_CHAT_ID in Vercel
 *
 * No-op if either env var is missing — won't break the request flow.
 */
export async function notifyPaybackBot(text: string): Promise<boolean> {
  const token = process.env.TELEGRAM_PAYBACK_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_PAYBACK_CHAT_ID;
  if (!token || !chatId || !text) return true;

  try {
    const res = await fetch(`${TELEGRAM_API}${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    });
    const data = await res.json();
    if (!data.ok) {
      console.error("[telegram-payback] send failed:", data.description);
      return false;
    }
    return true;
  } catch (error) {
    console.error("[telegram-payback] send error:", error);
    return false;
  }
}

const escapeHtml = (s: string) =>
  String(s).replace(/[&<>]/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c] || c,
  );

export function formatWithdrawalRequest(data: {
  userId: string;
  userName: string;
  email: string;
  amount: number;
  network: string;
  address: string;
  exchanges: string[];
}): string {
  const amount = Number(data.amount).toFixed(2);
  const exchanges = data.exchanges.length ? data.exchanges.join(", ") : "—";
  const ts = new Date().toLocaleString("ko-KR", { timeZone: "Asia/Seoul" });
  return [
    "💰 <b>New payback request</b>",
    "",
    `<b>User:</b> ${escapeHtml(data.userName)} (${escapeHtml(data.email)})`,
    `<b>UID:</b> <code>${escapeHtml(data.userId)}</code>`,
    `<b>Amount:</b> $${amount} USDT`,
    `<b>Network:</b> ${escapeHtml(data.network)}`,
    `<b>Exchanges:</b> ${escapeHtml(exchanges)}`,
    `<b>Address:</b> <code>${escapeHtml(data.address)}</code>`,
    `<b>Time:</b> ${escapeHtml(ts)} KST`,
    "",
    "Review at /dashboard/admin/paybacks",
  ].join("\n");
}

export function formatNewSignup(data: {
  userId: string;
  userName: string;
  email: string;
  provider: "email" | "telegram" | "oauth";
  telegramUsername?: string | null;
}): string {
  const providerLabel =
    data.provider === "telegram"
      ? `Telegram${data.telegramUsername ? ` (@${data.telegramUsername})` : ""}`
      : data.provider === "email"
        ? "Email/Password"
        : "OAuth";
  const ts = new Date().toLocaleString("ko-KR", { timeZone: "Asia/Seoul" });
  return [
    "🎉 <b>New signup</b>",
    "",
    `<b>User:</b> ${escapeHtml(data.userName || "(no name)")}`,
    `<b>Email:</b> ${escapeHtml(data.email)}`,
    `<b>UID:</b> <code>${escapeHtml(data.userId)}</code>`,
    `<b>Provider:</b> ${escapeHtml(providerLabel)}`,
    `<b>Time:</b> ${escapeHtml(ts)} KST`,
    "",
    "View at /dashboard/admin/users",
  ].join("\n");
}

// Other admin templates retained as no-ops for legacy callers.
export function formatTradeNotification(_trades: any[]): string { return ""; }
export function formatDailySummary(_data: any): string { return ""; }
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

/* ================================================================== */
/*  Blog broadcast — reuses the main news bot to push to KO + EN chans */
/* ================================================================== */

async function sendBotPhoto(
  chatId: string,
  photoUrl: string,
  caption: string,
): Promise<boolean> {
  try {
    const res = await fetch(`${TELEGRAM_API}${getBotToken()}/sendPhoto`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        photo: photoUrl,
        caption,
        parse_mode: "HTML",
      }),
    });
    const data = await res.json();
    if (!data.ok) {
      console.error("[telegram-blog] sendPhoto failed:", data.description);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[telegram-blog] sendPhoto error:", err);
    return false;
  }
}

async function sendBotMessage(
  chatId: string,
  text: string,
): Promise<boolean> {
  try {
    const res = await fetch(`${TELEGRAM_API}${getBotToken()}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: false,
      }),
    });
    const data = await res.json();
    if (!data.ok) {
      console.error("[telegram-blog] sendMessage failed:", data.description);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[telegram-blog] sendMessage error:", err);
    return false;
  }
}

async function sendBotPhotoBuffer(
  chatId: string,
  photoBuffer: Uint8Array,
  caption: string,
  filename = "chart.png",
): Promise<boolean> {
  try {
    const fd = new FormData();
    fd.append("chat_id", chatId);
    fd.append("photo", new Blob([photoBuffer], { type: "image/png" }), filename);
    fd.append("caption", caption);
    fd.append("parse_mode", "HTML");
    const res = await fetch(`${TELEGRAM_API}${getBotToken()}/sendPhoto`, {
      method: "POST",
      body: fd,
    });
    const data = await res.json();
    if (!data.ok) {
      console.error("[telegram-blog] sendPhoto(buffer) failed:", data.description);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[telegram-blog] sendPhoto(buffer) error:", err);
    return false;
  }
}

/**
 * Send blog broadcast to the KO or EN channel via the main news bot.
 *  - ko: reuses TELEGRAM_GROUP_CHAT_ID (existing news channel)
 *  - en: TELEGRAM_GROUP_EN_CHAT_ID (new — global channel)
 * If `photoBuffer` is provided it's uploaded as multipart (works before the
 * image is deployed to a public URL); otherwise falls back to `photoUrl`.
 * No-op if the channel's chat id isn't configured.
 */
export async function sendBlogToChannel(
  channel: "ko" | "en",
  opts: { photoUrl?: string; photoBuffer?: Uint8Array; photoFilename?: string; text: string },
): Promise<boolean> {
  const chatId =
    channel === "ko"
      ? process.env.TELEGRAM_GROUP_CHAT_ID
      : process.env.TELEGRAM_GROUP_EN_CHAT_ID;
  if (!chatId) {
    console.warn(`[telegram-blog] ${channel.toUpperCase()} chat id not configured`);
    return false;
  }
  if (opts.photoBuffer) {
    return sendBotPhotoBuffer(chatId, opts.photoBuffer, opts.text, opts.photoFilename);
  }
  if (opts.photoUrl) {
    return sendBotPhoto(chatId, opts.photoUrl, opts.text);
  }
  return sendBotMessage(chatId, opts.text);
}

/* ================================================================== */
/*  Bot Moderation API Wrappers (MissRose-style group management)     */
/* ================================================================== */

async function callBotApi<T = any>(method: string, body: Record<string, unknown>): Promise<T | null> {
  try {
    const res = await fetch(`${TELEGRAM_API}${getBotToken()}/${method}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!data.ok) {
      console.error(`[telegram] ${method} failed:`, data.description);
      return null;
    }
    return data.result as T;
  } catch (error) {
    console.error(`[telegram] ${method} error:`, error);
    return null;
  }
}

/** Send a reply to a specific message in a chat (not hardcoded to group). */
export async function replyToChat(
  chatId: number | string,
  text: string,
  replyToMessageId?: number,
  parseMode: "HTML" | "Markdown" = "HTML"
): Promise<boolean> {
  const result = await callBotApi("sendMessage", {
    chat_id: chatId,
    text,
    parse_mode: parseMode,
    reply_to_message_id: replyToMessageId,
    allow_sending_without_reply: true,
  });
  return result !== null;
}

/** Permanently ban a user from a chat (until unbanned). */
export async function banChatMember(
  chatId: number | string,
  userId: number,
  untilDate?: number
): Promise<boolean> {
  const result = await callBotApi("banChatMember", {
    chat_id: chatId,
    user_id: userId,
    until_date: untilDate,
    revoke_messages: true,
  });
  return result !== null;
}

/** Lift a ban (also allows them to rejoin). */
export async function unbanChatMember(
  chatId: number | string,
  userId: number
): Promise<boolean> {
  const result = await callBotApi("unbanChatMember", {
    chat_id: chatId,
    user_id: userId,
    only_if_banned: true,
  });
  return result !== null;
}

/** Kick without permanent ban — ban then immediately unban. */
export async function kickChatMember(
  chatId: number | string,
  userId: number
): Promise<boolean> {
  const banned = await banChatMember(chatId, userId);
  if (!banned) return false;
  // Unban immediately so they can rejoin (but with a fresh invite/search)
  await unbanChatMember(chatId, userId);
  return true;
}

/** Restrict a user's ability to send messages. Used for mutes. */
export async function restrictChatMember(
  chatId: number | string,
  userId: number,
  canSendMessages: boolean,
  untilDate?: number
): Promise<boolean> {
  const result = await callBotApi("restrictChatMember", {
    chat_id: chatId,
    user_id: userId,
    permissions: {
      can_send_messages: canSendMessages,
      can_send_audios: canSendMessages,
      can_send_documents: canSendMessages,
      can_send_photos: canSendMessages,
      can_send_videos: canSendMessages,
      can_send_video_notes: canSendMessages,
      can_send_voice_notes: canSendMessages,
      can_send_polls: canSendMessages,
      can_send_other_messages: canSendMessages,
      can_add_web_page_previews: canSendMessages,
      can_invite_users: true,
    },
    until_date: untilDate,
  });
  return result !== null;
}

/** Delete a single message. */
export async function deleteMessage(
  chatId: number | string,
  messageId: number
): Promise<boolean> {
  const result = await callBotApi("deleteMessage", {
    chat_id: chatId,
    message_id: messageId,
  });
  return result !== null;
}

/** Pin a message in the chat. */
export async function pinChatMessage(
  chatId: number | string,
  messageId: number,
  disableNotification = false
): Promise<boolean> {
  const result = await callBotApi("pinChatMessage", {
    chat_id: chatId,
    message_id: messageId,
    disable_notification: disableNotification,
  });
  return result !== null;
}

/** Unpin a specific message (or the current pinned message if not given). */
export async function unpinChatMessage(
  chatId: number | string,
  messageId?: number
): Promise<boolean> {
  const result = await callBotApi("unpinChatMessage", {
    chat_id: chatId,
    message_id: messageId,
  });
  return result !== null;
}

/** Get info about a specific member of a chat. */
export type ChatMemberStatus = "creator" | "administrator" | "member" | "restricted" | "left" | "kicked";
export type ChatMember = {
  status: ChatMemberStatus;
  user: { id: number; username?: string; first_name?: string };
  can_manage_chat?: boolean;
  can_delete_messages?: boolean;
  can_restrict_members?: boolean;
};
export async function getChatMember(
  chatId: number | string,
  userId: number
): Promise<ChatMember | null> {
  return callBotApi<ChatMember>("getChatMember", {
    chat_id: chatId,
    user_id: userId,
  });
}

/** Get all administrators of a chat. */
export async function getChatAdministrators(
  chatId: number | string
): Promise<ChatMember[] | null> {
  return callBotApi<ChatMember[]>("getChatAdministrators", { chat_id: chatId });
}

/** Promote a user to admin with a default permission set. */
export async function promoteChatMember(
  chatId: number | string,
  userId: number
): Promise<boolean> {
  const result = await callBotApi("promoteChatMember", {
    chat_id: chatId,
    user_id: userId,
    can_manage_chat: true,
    can_delete_messages: true,
    can_restrict_members: true,
    can_pin_messages: true,
    can_invite_users: true,
    can_promote_members: false, // only owner can grant this
  });
  return result !== null;
}

/** Remove all admin rights (demote). */
export async function demoteChatMember(
  chatId: number | string,
  userId: number
): Promise<boolean> {
  const result = await callBotApi("promoteChatMember", {
    chat_id: chatId,
    user_id: userId,
    can_manage_chat: false,
    can_delete_messages: false,
    can_restrict_members: false,
    can_pin_messages: false,
    can_invite_users: false,
    can_promote_members: false,
  });
  return result !== null;
}
