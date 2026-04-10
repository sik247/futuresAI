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
