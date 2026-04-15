import prisma from "@/lib/prisma";
import {
  banChatMember,
  unbanChatMember,
  kickChatMember,
  restrictChatMember,
  deleteMessage,
  pinChatMessage,
  unpinChatMessage,
  promoteChatMember,
  demoteChatMember,
  replyToChat,
  getChatAdministrators,
} from "@/lib/services/notifications/telegram.service";
import {
  isAdmin,
  resolveTarget,
  parseDuration,
  formatDuration,
  findUserByTelegramId,
  findUserByTelegramUsername,
  logAction,
  incrementWarn,
  decrementWarn,
  WARN_BAN_THRESHOLD,
  invalidateAdminCache,
  formatMention,
  type TelegramMessage,
  type ResolvedTarget,
} from "./moderation.service";

/* ================================================================== */
/*  Types                                                              */
/* ================================================================== */

export type CommandContext = {
  message: TelegramMessage;
  chatId: number | string;
  fromUserId: number;
  args: string[];
  replyTo?: TelegramMessage;
};

export type CommandHandler = (ctx: CommandContext) => Promise<void>;

/* ================================================================== */
/*  Helpers                                                            */
/* ================================================================== */

async function requireAdmin(ctx: CommandContext): Promise<boolean> {
  return isAdmin(ctx.chatId, ctx.fromUserId);
}

async function requireTarget(ctx: CommandContext): Promise<ResolvedTarget | null> {
  const target = resolveTarget(ctx.message, ctx.args);
  if (!target.tgUserId && !target.tgUsername) {
    await reply(ctx, "⚠ Reply to a user or mention with @username to target them.");
    return null;
  }

  // If only username, try to resolve via our DB
  if (!target.tgUserId && target.tgUsername) {
    const user = await findUserByTelegramUsername(target.tgUsername);
    if (user?.telegramId) {
      target.tgUserId = parseInt(user.telegramId, 10);
    }
  }

  if (!target.tgUserId) {
    await reply(ctx, `⚠ Can't resolve user ID for @${target.tgUsername}. Ask them to message the group first so I can track them.`);
    return null;
  }

  return target;
}

async function reply(ctx: CommandContext, text: string): Promise<void> {
  await replyToChat(ctx.chatId, text, ctx.message.message_id);
}

function reasonFromArgs(args: string[]): string | undefined {
  // Drop the first arg if it's a @mention
  const rest = args[0]?.startsWith("@") ? args.slice(1) : args;
  const joined = rest.join(" ").trim();
  return joined || undefined;
}

/* ================================================================== */
/*  Admin commands                                                     */
/* ================================================================== */

export const handleBan: CommandHandler = async (ctx) => {
  if (!(await requireAdmin(ctx))) return;
  const target = await requireTarget(ctx);
  if (!target?.tgUserId) return;

  const reason = reasonFromArgs(ctx.args);
  const ok = await banChatMember(ctx.chatId, target.tgUserId);
  if (!ok) {
    await reply(ctx, "❌ Ban failed. Do I have permission to ban members?");
    return;
  }

  // Update DB if user exists
  const user = await findUserByTelegramId(target.tgUserId);
  if (user) {
    await prisma.user.update({
      where: { id: user.id },
      data: { isBanned: true, banReason: reason ?? "admin ban", bannedAt: new Date() },
    });
  }

  await logAction({ actorTgId: ctx.fromUserId, targetTgId: target.tgUserId, chatId: ctx.chatId, action: "ban", reason });
  const mention = formatMention({ id: target.tgUserId, first_name: target.firstName, username: target.tgUsername ?? undefined });
  await reply(ctx, `🔨 Banned ${mention}${reason ? `\n<i>Reason: ${escapeHtml(reason)}</i>` : ""}`);
};

export const handleUnban: CommandHandler = async (ctx) => {
  if (!(await requireAdmin(ctx))) return;
  const target = await requireTarget(ctx);
  if (!target?.tgUserId) return;

  const ok = await unbanChatMember(ctx.chatId, target.tgUserId);
  if (!ok) {
    await reply(ctx, "❌ Unban failed.");
    return;
  }

  const user = await findUserByTelegramId(target.tgUserId);
  if (user) {
    await prisma.user.update({
      where: { id: user.id },
      data: { isBanned: false, banReason: null, bannedAt: null },
    });
  }

  await logAction({ actorTgId: ctx.fromUserId, targetTgId: target.tgUserId, chatId: ctx.chatId, action: "unban" });
  const mention = formatMention({ id: target.tgUserId, first_name: target.firstName, username: target.tgUsername ?? undefined });
  await reply(ctx, `✅ Unbanned ${mention}`);
};

export const handleKick: CommandHandler = async (ctx) => {
  if (!(await requireAdmin(ctx))) return;
  const target = await requireTarget(ctx);
  if (!target?.tgUserId) return;

  const ok = await kickChatMember(ctx.chatId, target.tgUserId);
  if (!ok) {
    await reply(ctx, "❌ Kick failed.");
    return;
  }

  await logAction({ actorTgId: ctx.fromUserId, targetTgId: target.tgUserId, chatId: ctx.chatId, action: "kick" });
  const mention = formatMention({ id: target.tgUserId, first_name: target.firstName, username: target.tgUsername ?? undefined });
  await reply(ctx, `👢 Kicked ${mention}`);
};

export const handleMute: CommandHandler = async (ctx) => {
  if (!(await requireAdmin(ctx))) return;
  const target = await requireTarget(ctx);
  if (!target?.tgUserId) return;

  // Parse duration from args (first non-mention arg)
  const durationArg = ctx.args.find((a) => !a.startsWith("@") && /^\d+[smhd]$/.test(a));
  const seconds = durationArg ? parseDuration(durationArg) : null;
  const untilDate = seconds ? Math.floor(Date.now() / 1000) + seconds : undefined;

  const ok = await restrictChatMember(ctx.chatId, target.tgUserId, false, untilDate);
  if (!ok) {
    await reply(ctx, "❌ Mute failed.");
    return;
  }

  if (seconds) {
    const user = await findUserByTelegramId(target.tgUserId);
    if (user) {
      await prisma.user.update({
        where: { id: user.id },
        data: { mutedUntil: new Date(Date.now() + seconds * 1000) },
      });
    }
  }

  await logAction({
    actorTgId: ctx.fromUserId,
    targetTgId: target.tgUserId,
    chatId: ctx.chatId,
    action: "mute",
    metadata: seconds ? { durationSeconds: seconds } : undefined,
  });
  const mention = formatMention({ id: target.tgUserId, first_name: target.firstName, username: target.tgUsername ?? undefined });
  const durText = seconds ? ` for <b>${formatDuration(seconds)}</b>` : " <b>indefinitely</b>";
  await reply(ctx, `🔇 Muted ${mention}${durText}`);
};

export const handleUnmute: CommandHandler = async (ctx) => {
  if (!(await requireAdmin(ctx))) return;
  const target = await requireTarget(ctx);
  if (!target?.tgUserId) return;

  const ok = await restrictChatMember(ctx.chatId, target.tgUserId, true);
  if (!ok) {
    await reply(ctx, "❌ Unmute failed.");
    return;
  }

  const user = await findUserByTelegramId(target.tgUserId);
  if (user) {
    await prisma.user.update({ where: { id: user.id }, data: { mutedUntil: null } });
  }

  await logAction({ actorTgId: ctx.fromUserId, targetTgId: target.tgUserId, chatId: ctx.chatId, action: "unmute" });
  const mention = formatMention({ id: target.tgUserId, first_name: target.firstName, username: target.tgUsername ?? undefined });
  await reply(ctx, `🔊 Unmuted ${mention}`);
};

export const handleWarn: CommandHandler = async (ctx) => {
  if (!(await requireAdmin(ctx))) return;
  const target = await requireTarget(ctx);
  if (!target?.tgUserId) return;

  const reason = reasonFromArgs(ctx.args);
  const { newCount, autoBanned } = await incrementWarn(target.tgUserId, ctx.chatId);

  await logAction({ actorTgId: ctx.fromUserId, targetTgId: target.tgUserId, chatId: ctx.chatId, action: "warn", reason });
  const mention = formatMention({ id: target.tgUserId, first_name: target.firstName, username: target.tgUsername ?? undefined });

  if (autoBanned) {
    await reply(ctx, `⚠ ${mention} reached ${WARN_BAN_THRESHOLD}/${WARN_BAN_THRESHOLD} warns and has been <b>auto-banned</b>.${reason ? `\n<i>Reason: ${escapeHtml(reason)}</i>` : ""}`);
  } else {
    await reply(ctx, `⚠ Warned ${mention} (${newCount}/${WARN_BAN_THRESHOLD})${reason ? `\n<i>Reason: ${escapeHtml(reason)}</i>` : ""}`);
  }
};

export const handleUnwarn: CommandHandler = async (ctx) => {
  if (!(await requireAdmin(ctx))) return;
  const target = await requireTarget(ctx);
  if (!target?.tgUserId) return;

  const newCount = await decrementWarn(target.tgUserId);
  await logAction({ actorTgId: ctx.fromUserId, targetTgId: target.tgUserId, chatId: ctx.chatId, action: "unwarn" });
  const mention = formatMention({ id: target.tgUserId, first_name: target.firstName, username: target.tgUsername ?? undefined });
  await reply(ctx, `✅ Removed a warn from ${mention} (now ${newCount}/${WARN_BAN_THRESHOLD})`);
};

export const handleDelete: CommandHandler = async (ctx) => {
  if (!(await requireAdmin(ctx))) return;
  if (!ctx.replyTo) {
    await reply(ctx, "⚠ Reply to the message you want to delete.");
    return;
  }

  await deleteMessage(ctx.chatId, ctx.replyTo.message_id);
  // Also delete the command message to keep chat clean
  await deleteMessage(ctx.chatId, ctx.message.message_id);

  await logAction({ actorTgId: ctx.fromUserId, chatId: ctx.chatId, action: "delete", metadata: { messageId: ctx.replyTo.message_id } });
};

export const handlePurge: CommandHandler = async (ctx) => {
  if (!(await requireAdmin(ctx))) return;
  if (!ctx.replyTo) {
    await reply(ctx, "⚠ Reply to the message you want to purge FROM (everything between it and now will be deleted).");
    return;
  }

  const startId = ctx.replyTo.message_id;
  const endId = ctx.message.message_id;
  const count = endId - startId + 1;

  if (count > 200) {
    await reply(ctx, "⚠ Cowardly refusing to purge more than 200 messages at once.");
    return;
  }

  let deleted = 0;
  for (let id = startId; id <= endId; id++) {
    const ok = await deleteMessage(ctx.chatId, id);
    if (ok) deleted++;
  }

  await logAction({
    actorTgId: ctx.fromUserId,
    chatId: ctx.chatId,
    action: "purge",
    metadata: { startId, endId, deleted },
  });

  // Send a transient confirmation (admin can manually delete if noisy)
  const confirmation = await replyToChat(ctx.chatId, `🧹 Purged ${deleted} message${deleted === 1 ? "" : "s"}.`);
  // Auto-delete confirmation after 5s is nice but Next edge has no reliable setTimeout; leave it.
};

export const handlePin: CommandHandler = async (ctx) => {
  if (!(await requireAdmin(ctx))) return;
  if (!ctx.replyTo) {
    await reply(ctx, "⚠ Reply to the message you want to pin.");
    return;
  }

  const ok = await pinChatMessage(ctx.chatId, ctx.replyTo.message_id);
  if (!ok) {
    await reply(ctx, "❌ Pin failed.");
    return;
  }

  await logAction({ actorTgId: ctx.fromUserId, chatId: ctx.chatId, action: "pin", metadata: { messageId: ctx.replyTo.message_id } });
  await reply(ctx, "📌 Pinned.");
};

export const handleUnpin: CommandHandler = async (ctx) => {
  if (!(await requireAdmin(ctx))) return;
  const messageId = ctx.replyTo?.message_id;
  const ok = await unpinChatMessage(ctx.chatId, messageId);
  if (!ok) {
    await reply(ctx, "❌ Unpin failed.");
    return;
  }
  await logAction({ actorTgId: ctx.fromUserId, chatId: ctx.chatId, action: "unpin" });
  await reply(ctx, "📍 Unpinned.");
};

export const handlePromote: CommandHandler = async (ctx) => {
  if (!(await requireAdmin(ctx))) return;
  const target = await requireTarget(ctx);
  if (!target?.tgUserId) return;

  const ok = await promoteChatMember(ctx.chatId, target.tgUserId);
  if (!ok) {
    await reply(ctx, "❌ Promote failed. Do I have 'add new admins' permission?");
    return;
  }

  invalidateAdminCache(ctx.chatId);
  await logAction({ actorTgId: ctx.fromUserId, targetTgId: target.tgUserId, chatId: ctx.chatId, action: "promote" });
  const mention = formatMention({ id: target.tgUserId, first_name: target.firstName, username: target.tgUsername ?? undefined });
  await reply(ctx, `⭐ Promoted ${mention} to admin.`);
};

export const handleDemote: CommandHandler = async (ctx) => {
  if (!(await requireAdmin(ctx))) return;
  const target = await requireTarget(ctx);
  if (!target?.tgUserId) return;

  const ok = await demoteChatMember(ctx.chatId, target.tgUserId);
  if (!ok) {
    await reply(ctx, "❌ Demote failed.");
    return;
  }

  invalidateAdminCache(ctx.chatId);
  await logAction({ actorTgId: ctx.fromUserId, targetTgId: target.tgUserId, chatId: ctx.chatId, action: "demote" });
  const mention = formatMention({ id: target.tgUserId, first_name: target.firstName, username: target.tgUsername ?? undefined });
  await reply(ctx, `📉 Demoted ${mention}.`);
};

export const handleSetRules: CommandHandler = async (ctx) => {
  if (!(await requireAdmin(ctx))) return;
  const rulesText = ctx.args.join(" ").trim();
  if (!rulesText) {
    await reply(ctx, "⚠ Usage: /setrules <rules text>");
    return;
  }

  await prisma.groupSettings.upsert({
    where: { chatId: String(ctx.chatId) },
    update: { rules: rulesText },
    create: { chatId: String(ctx.chatId), rules: rulesText },
  });

  await reply(ctx, "✅ Rules updated.");
};

/* ================================================================== */
/*  Public commands                                                    */
/* ================================================================== */

export const handleInfo: CommandHandler = async (ctx) => {
  // Default to the sender if no target specified
  let target: ResolvedTarget = resolveTarget(ctx.message, ctx.args);
  if (!target.tgUserId && !target.tgUsername) {
    target = {
      tgUserId: ctx.fromUserId,
      tgUsername: ctx.message.from?.username || null,
      firstName: ctx.message.from?.first_name,
    };
  }

  if (!target.tgUserId && target.tgUsername) {
    const user = await findUserByTelegramUsername(target.tgUsername);
    if (user?.telegramId) target.tgUserId = parseInt(user.telegramId, 10);
  }

  if (!target.tgUserId) {
    await reply(ctx, `⚠ Unknown user. They need to message the group once before I can track them.`);
    return;
  }

  const user = await findUserByTelegramId(target.tgUserId);

  const lines: string[] = [`<b>User Info</b>`];
  lines.push(`ID: <code>${target.tgUserId}</code>`);
  if (target.tgUsername || user?.telegramUsername) {
    lines.push(`Username: @${target.tgUsername || user?.telegramUsername}`);
  }
  if (user) {
    lines.push(`FuturesAI: ${user.name || user.email}`);
    lines.push(`Joined: ${new Date(user.createdAt).toLocaleDateString()}`);
    lines.push(`Warns: <b>${user.warnCount}</b> / ${WARN_BAN_THRESHOLD}`);
    if (user.isPremium) lines.push(`Tier: <b>PREMIUM</b>`);
    else if (user.credits >= 25) lines.push(`Tier: <b>BASIC</b>`);
    if (user.isBanned) lines.push(`🚫 <b>Banned</b>${user.banReason ? `: ${escapeHtml(user.banReason)}` : ""}`);
    if (user.mutedUntil && user.mutedUntil > new Date()) {
      lines.push(`🔇 Muted until ${user.mutedUntil.toLocaleString()}`);
    }
  } else {
    lines.push(`<i>Not linked to a FuturesAI account</i>`);
  }

  await reply(ctx, lines.join("\n"));
};

export const handleRules: CommandHandler = async (ctx) => {
  const settings = await prisma.groupSettings.findUnique({
    where: { chatId: String(ctx.chatId) },
  });

  if (!settings?.rules) {
    await reply(
      ctx,
      "<b>Group Rules</b>\n\n1. Be respectful to other members\n2. No spam, no scams, no shilling\n3. No private signal groups / DM sales\n4. English and Korean welcome\n5. Admins have final say\n\n<i>Admins can customize with /setrules</i>"
    );
    return;
  }

  await reply(ctx, `<b>Group Rules</b>\n\n${settings.rules}`);
};

export const handleReport: CommandHandler = async (ctx) => {
  if (!ctx.replyTo) {
    await reply(ctx, "⚠ Reply to the message you want to report.");
    return;
  }

  const admins = await getChatAdministrators(ctx.chatId);
  if (!admins || admins.length === 0) {
    await reply(ctx, "⚠ No admins found to report to.");
    return;
  }

  const adminMentions = admins
    .filter((a) => !a.user.username?.endsWith("bot"))
    .slice(0, 5)
    .map((a) => `<a href="tg://user?id=${a.user.id}">‎</a>`) // zero-width mentions
    .join("");

  const reporter = formatMention({
    id: ctx.fromUserId,
    first_name: ctx.message.from?.first_name,
    username: ctx.message.from?.username,
  });

  await replyToChat(
    ctx.chatId,
    `${adminMentions}🚨 <b>Report</b> from ${reporter}\nPlease review the replied message.`,
    ctx.replyTo.message_id
  );
};

export const handleId: CommandHandler = async (ctx) => {
  const chatId = ctx.chatId;
  const userId = ctx.fromUserId;
  const lines = [
    `<b>IDs</b>`,
    `Chat: <code>${chatId}</code>`,
    `You: <code>${userId}</code>`,
  ];
  if (ctx.replyTo?.from) {
    lines.push(`Replied user: <code>${ctx.replyTo.from.id}</code>`);
  }
  await reply(ctx, lines.join("\n"));
};

/* ================================================================== */
/*  Public Commands — Market Data                                      */
/* ================================================================== */

const handleSignal: CommandHandler = async (ctx) => {
  try {
    const { fetchMarketSignals } = await import("@/lib/services/signals/signals.service");
    const signals = await fetchMarketSignals();
    const top = signals.signals.slice(0, 6);

    const EMOJI: Record<string, string> = {
      "Strong Buy": "🟢🟢", "Buy": "🟢", "Neutral": "⚪", "Sell": "🔴", "Strong Sell": "🔴🔴",
    };

    let msg = `<b>📡 Live Signals</b>\n\n`;
    for (const s of top) {
      const emoji = EMOJI[s.signal] || "";
      const price = s.price > 100 ? `$${s.price.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : `$${s.price.toFixed(4)}`;
      const change = `${s.change24h >= 0 ? "+" : ""}${s.change24h.toFixed(1)}%`;
      msg += `${emoji} <b>${s.symbol}</b> ${price} (${change})\n`;
      msg += `   ${s.signal} | ${s.direction} | ${s.confidence.toFixed(0)}%\n\n`;
    }

    const fgVal = signals.fearGreed.value;
    const fgLabel = fgVal <= 25 ? "Extreme Fear" : fgVal <= 45 ? "Fear" : fgVal <= 55 ? "Neutral" : fgVal <= 75 ? "Greed" : "Extreme Greed";
    const longCount = signals.signals.filter(s => s.direction === "LONG").length;
    const shortCount = signals.signals.filter(s => s.direction === "SHORT").length;

    msg += `Fear & Greed: ${fgVal}/100 (${fgLabel})\n`;
    msg += `Long ${longCount} / Short ${shortCount} / Watch ${signals.signals.length - longCount - shortCount}\n`;
    msg += `${signals.btcTrend === "above_sma" ? "BTC above 7D SMA ↑" : "BTC below 7D SMA ↓"}`;

    await reply(ctx, msg);
  } catch {
    await reply(ctx, "⚠ Could not fetch signals. Try again shortly.");
  }
};

const handlePrice: CommandHandler = async (ctx) => {
  const symbol = (ctx.args[0] || "BTC").toUpperCase();
  try {
    const res = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}USDT`, {
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) {
      await reply(ctx, `⚠ Coin <b>${symbol}</b> not found on Binance. Try: /p BTC`);
      return;
    }
    const data = await res.json();
    const price = parseFloat(data.lastPrice);
    const change = parseFloat(data.priceChangePercent);
    const vol = parseFloat(data.quoteVolume) / 1e6;
    const high = parseFloat(data.highPrice);
    const low = parseFloat(data.lowPrice);

    const arrow = change >= 0 ? "📈" : "📉";
    let msg = `${arrow} <b>${symbol}/USDT</b>\n\n`;
    msg += `Price: $${price.toLocaleString(undefined, { maximumFractionDigits: price > 100 ? 0 : 4 })}\n`;
    msg += `24h: ${change >= 0 ? "+" : ""}${change.toFixed(2)}%\n`;
    msg += `High: $${high.toLocaleString(undefined, { maximumFractionDigits: high > 100 ? 0 : 4 })}\n`;
    msg += `Low: $${low.toLocaleString(undefined, { maximumFractionDigits: low > 100 ? 0 : 4 })}\n`;
    msg += `Volume: $${vol.toFixed(1)}M`;

    await reply(ctx, msg);
  } catch {
    await reply(ctx, "⚠ Could not fetch price. Try again shortly.");
  }
};

const handleNews: CommandHandler = async (ctx) => {
  try {
    const { fetchCryptoNews } = await import("@/lib/services/news/crypto-news.service");
    const news = await fetchCryptoNews();
    if (news.length === 0) {
      await reply(ctx, "No recent news available.");
      return;
    }

    let msg = `<b>📰 Latest Crypto News</b>\n\n`;
    for (const n of news.slice(0, 5)) {
      msg += `• ${escapeHtml(n.title)}\n  <i>${n.source}</i> · <a href="${n.url}">Read</a>\n\n`;
    }
    msg += `<a href="https://futuresai.io/en/news">More on FuturesAI →</a>`;

    await reply(ctx, msg);
  } catch {
    await reply(ctx, "⚠ Could not fetch news. Try again shortly.");
  }
};

const handleFearGreed: CommandHandler = async (ctx) => {
  try {
    const res = await fetch("https://api.alternative.me/fng/?limit=7", { signal: AbortSignal.timeout(3000) });
    const data = await res.json();
    const entries = data?.data || [];
    if (entries.length === 0) {
      await reply(ctx, "⚠ Could not fetch Fear & Greed Index.");
      return;
    }

    const current = entries[0];
    const val = parseInt(current.value);
    const emoji = val <= 25 ? "😱" : val <= 45 ? "😟" : val <= 55 ? "😐" : val <= 75 ? "🤑" : "🤯";

    let msg = `${emoji} <b>Fear & Greed Index: ${val}/100</b>\n`;
    msg += `${current.value_classification}\n\n`;
    msg += `<b>7-Day History:</b>\n`;

    for (const entry of entries) {
      const date = new Date(parseInt(entry.timestamp) * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric" });
      const v = parseInt(entry.value);
      const bar = "█".repeat(Math.floor(v / 10)) + "░".repeat(10 - Math.floor(v / 10));
      msg += `${date}: ${bar} ${v}\n`;
    }

    await reply(ctx, msg);
  } catch {
    await reply(ctx, "⚠ Could not fetch Fear & Greed data.");
  }
};

const handleHelp: CommandHandler = async (ctx) => {
  const msg = [
    `<b>🤖 FuturesAI Bot Commands</b>\n`,
    `<b>Market Data:</b>`,
    `/signal — Live trading signals (top 6 coins)`,
    `/p [COIN] — Price check (e.g. /p SOL)`,
    `/news — Latest crypto headlines`,
    `/fg — Fear & Greed Index (7-day)\n`,
    `<b>Community:</b>`,
    `/rules — Group rules`,
    `/info — Your profile info`,
    `/report — Report a message\n`,
    `<b>Links:</b>`,
    `<a href="https://futuresai.io">FuturesAI Dashboard</a>`,
    `<a href="https://futuresai.io/en/chat">AI Chat Analysis</a>`,
    `<a href="https://futuresai.io/en/news">News Feed</a>`,
  ].join("\n");
  await reply(ctx, msg);
};

/* ================================================================== */
/*  Dispatcher                                                         */
/* ================================================================== */

export const COMMANDS: Record<string, CommandHandler> = {
  // Admin
  "/ban": handleBan,
  "/unban": handleUnban,
  "/kick": handleKick,
  "/mute": handleMute,
  "/unmute": handleUnmute,
  "/warn": handleWarn,
  "/unwarn": handleUnwarn,
  "/del": handleDelete,
  "/delete": handleDelete,
  "/purge": handlePurge,
  "/pin": handlePin,
  "/unpin": handleUnpin,
  "/promote": handlePromote,
  "/demote": handleDemote,
  "/setrules": handleSetRules,
  // Public
  "/info": handleInfo,
  "/rules": handleRules,
  "/report": handleReport,
  "/id": handleId,
  "/signal": handleSignal,
  "/signals": handleSignal,
  "/price": handlePrice,
  "/p": handlePrice,
  "/news": handleNews,
  "/fear": handleFearGreed,
  "/fg": handleFearGreed,
  "/help": handleHelp,
  "/start": handleHelp,
};

/* ================================================================== */
/*  Helpers                                                            */
/* ================================================================== */

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
