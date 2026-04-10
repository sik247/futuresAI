import prisma from "@/lib/prisma";
import { getChatAdministrators, getChatMember, banChatMember } from "@/lib/services/notifications/telegram.service";

/* ================================================================== */
/*  Types                                                              */
/* ================================================================== */

export type TelegramUser = {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  is_bot?: boolean;
};

export type TelegramMessage = {
  message_id: number;
  from?: TelegramUser;
  chat: { id: number | string; type: string; title?: string };
  date: number;
  text?: string;
  reply_to_message?: TelegramMessage;
  new_chat_members?: TelegramUser[];
  entities?: { type: string; offset: number; length: number; user?: TelegramUser }[];
};

export type ResolvedTarget = {
  tgUserId: number | null;
  tgUsername: string | null;
  firstName?: string;
};

/* ================================================================== */
/*  Admin check (cached 5 min)                                         */
/* ================================================================== */

type AdminCacheEntry = { adminIds: Set<number>; expiresAt: number };
const adminCache = new Map<string, AdminCacheEntry>();
const ADMIN_CACHE_TTL = 5 * 60 * 1000;

/** Is this Telegram user an admin of this chat? Checks native TG admins + our DB. */
export async function isAdmin(chatId: number | string, userId: number): Promise<boolean> {
  const key = String(chatId);
  const now = Date.now();
  let entry = adminCache.get(key);

  if (!entry || entry.expiresAt < now) {
    const admins = await getChatAdministrators(chatId);
    const ids = new Set<number>();
    if (admins) for (const a of admins) ids.add(a.user.id);
    entry = { adminIds: ids, expiresAt: now + ADMIN_CACHE_TTL };
    adminCache.set(key, entry);
  }

  if (entry.adminIds.has(userId)) return true;

  // Fallback: our DB role
  try {
    const user = await prisma.user.findUnique({
      where: { telegramId: String(userId) },
      select: { role: true },
    });
    return user?.role === "ADMIN";
  } catch {
    return false;
  }
}

/** Invalidate the admin cache for a chat (after a promote/demote). */
export function invalidateAdminCache(chatId: number | string) {
  adminCache.delete(String(chatId));
}

/* ================================================================== */
/*  Target resolution                                                  */
/* ================================================================== */

/**
 * Figure out who a moderation command is targeting.
 * Priority: reply-to message > text_mention entity > @username in args.
 */
export function resolveTarget(
  message: TelegramMessage,
  args: string[]
): ResolvedTarget {
  // 1. Reply-to wins
  if (message.reply_to_message?.from) {
    const from = message.reply_to_message.from;
    return {
      tgUserId: from.id,
      tgUsername: from.username || null,
      firstName: from.first_name,
    };
  }

  // 2. text_mention entity (username carries user object directly)
  if (message.entities) {
    for (const e of message.entities) {
      if (e.type === "text_mention" && e.user) {
        return {
          tgUserId: e.user.id,
          tgUsername: e.user.username || null,
          firstName: e.user.first_name,
        };
      }
    }
  }

  // 3. @username in args
  const mention = args.find((a) => a.startsWith("@"));
  if (mention) {
    return {
      tgUserId: null, // we may not know the numeric ID
      tgUsername: mention.slice(1),
    };
  }

  return { tgUserId: null, tgUsername: null };
}

/* ================================================================== */
/*  Duration parsing (e.g. "1h", "30m", "2d")                          */
/* ================================================================== */

export function parseDuration(str: string): number | null {
  const match = str.trim().toLowerCase().match(/^(\d+)([smhd])$/);
  if (!match) return null;
  const n = parseInt(match[1], 10);
  const unit = match[2];
  const multipliers: Record<string, number> = { s: 1, m: 60, h: 3600, d: 86400 };
  return n * multipliers[unit];
}

export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  return `${Math.floor(seconds / 86400)}d`;
}

/* ================================================================== */
/*  DB lookups                                                         */
/* ================================================================== */

/** Find our User record by their Telegram numeric ID. */
export async function findUserByTelegramId(tgUserId: number | string) {
  return prisma.user.findUnique({
    where: { telegramId: String(tgUserId) },
  });
}

/** Find our User record by their Telegram username (without @). */
export async function findUserByTelegramUsername(username: string) {
  return prisma.user.findFirst({
    where: { telegramUsername: username.replace(/^@/, "") },
  });
}

/* ================================================================== */
/*  Audit log                                                          */
/* ================================================================== */

export type ModActionInput = {
  actorTgId: number;
  targetTgId?: number | null;
  chatId: number | string;
  action: string;
  reason?: string;
  metadata?: Record<string, unknown>;
};

export async function logAction(input: ModActionInput) {
  try {
    const actor = await findUserByTelegramId(input.actorTgId);
    if (!actor) return; // we only log actions taken by users in our DB
    const target = input.targetTgId ? await findUserByTelegramId(input.targetTgId) : null;

    await prisma.modAction.create({
      data: {
        actorId: actor.id,
        targetId: target?.id ?? null,
        targetTgId: input.targetTgId ? String(input.targetTgId) : null,
        chatId: String(input.chatId),
        action: input.action,
        reason: input.reason,
        metadata: input.metadata as any,
      },
    });
  } catch (error) {
    console.error("[mod] logAction failed:", error);
  }
}

/* ================================================================== */
/*  Warn system                                                        */
/* ================================================================== */

const WARN_BAN_THRESHOLD = 3;

/** Increment warn count; auto-ban if at threshold. Returns new count. */
export async function incrementWarn(
  targetTgId: number,
  chatId: number | string
): Promise<{ newCount: number; autoBanned: boolean }> {
  const user = await findUserByTelegramId(targetTgId);
  if (!user) return { newCount: 0, autoBanned: false };

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { warnCount: { increment: 1 } },
    select: { warnCount: true },
  });

  const autoBanned = updated.warnCount >= WARN_BAN_THRESHOLD;
  if (autoBanned) {
    await prisma.user.update({
      where: { id: user.id },
      data: { isBanned: true, banReason: "3 warns reached", bannedAt: new Date() },
    });
    await banChatMember(chatId, targetTgId);
  }

  return { newCount: updated.warnCount, autoBanned };
}

export async function decrementWarn(targetTgId: number): Promise<number> {
  const user = await findUserByTelegramId(targetTgId);
  if (!user) return 0;
  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { warnCount: { decrement: 1 } },
    select: { warnCount: true },
  });
  const newCount = Math.max(0, updated.warnCount);
  if (newCount !== updated.warnCount) {
    await prisma.user.update({ where: { id: user.id }, data: { warnCount: 0 } });
  }
  return newCount;
}

export { WARN_BAN_THRESHOLD };

/** Format a user mention for HTML output. */
export function formatMention(user: { id: number; first_name?: string; username?: string } | ResolvedTarget & { id?: number }): string {
  const id = "id" in user ? user.id : (user as ResolvedTarget).tgUserId;
  const name =
    ("first_name" in user && user.first_name) ||
    ("firstName" in user && (user as any).firstName) ||
    (("username" in user && user.username) ? `@${user.username}` : null) ||
    (("tgUsername" in user && user.tgUsername) ? `@${user.tgUsername}` : null) ||
    "user";
  if (id) return `<a href="tg://user?id=${id}">${escapeHtml(String(name))}</a>`;
  return escapeHtml(String(name));
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
