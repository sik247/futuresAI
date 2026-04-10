import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  deleteMessage,
  restrictChatMember,
  replyToChat,
} from "@/lib/services/notifications/telegram.service";
import {
  COMMANDS,
  type CommandContext,
} from "@/lib/services/telegram/command-handlers";
import { isAdmin, logAction, type TelegramMessage } from "@/lib/services/telegram/moderation.service";
import { shouldAutoDelete, recordStrike } from "@/lib/services/telegram/anti-spam.service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/* ================================================================== */
/*  Welcome new members                                                */
/* ================================================================== */

async function welcomeNewMembers(msg: TelegramMessage) {
  if (!msg.new_chat_members) return;
  for (const member of msg.new_chat_members) {
    if (member.is_bot) continue;

    // Upsert a minimal record so we can track them
    try {
      const existing = await prisma.user.findUnique({
        where: { telegramId: String(member.id) },
      });
      if (!existing) {
        // Only create if we have enough info; otherwise just skip and let /info handle it later
        const syntheticEmail = `tg_${member.id}@telegram.user`;
        await prisma.user.upsert({
          where: { email: syntheticEmail },
          update: { telegramId: String(member.id), telegramUsername: member.username },
          create: {
            email: syntheticEmail,
            name: member.first_name || `User ${member.id}`,
            nickname: member.username || "",
            telegramId: String(member.id),
            telegramUsername: member.username,
            role: "USER",
          },
        });
      }
    } catch (error) {
      console.error("[telegram-bot] welcome upsert failed:", error);
    }

    const name = member.first_name || member.username || "newcomer";
    const welcomeText = `👋 Welcome <b>${escapeHtml(name)}</b> to FuturesAI!\n\nType /rules to see the group rules. Enjoy the alpha 📈`;
    await replyToChat(msg.chat.id, welcomeText, msg.message_id);
  }
}

/* ================================================================== */
/*  Main webhook handler                                               */
/* ================================================================== */

export async function POST(req: NextRequest) {
  try {
    const update = await req.json();
    const msg: TelegramMessage | undefined = update.message || update.edited_message;
    if (!msg) return NextResponse.json({ ok: true });

    // 1. Welcome new members
    if (msg.new_chat_members && msg.new_chat_members.length > 0) {
      await welcomeNewMembers(msg);
      return NextResponse.json({ ok: true });
    }

    // 2. Need a sender for everything else
    if (!msg.from) return NextResponse.json({ ok: true });

    // 3. Anti-spam check (non-admins only)
    if (msg.text && !(await isAdmin(msg.chat.id, msg.from.id))) {
      const verdict = shouldAutoDelete(msg);
      if (verdict.delete) {
        await deleteMessage(msg.chat.id, msg.message_id);
        const { shouldMute } = recordStrike(msg.from.id);

        await logAction({
          actorTgId: 0, // bot itself
          targetTgId: msg.from.id,
          chatId: msg.chat.id,
          action: "autodelete",
          reason: verdict.reason,
        });

        if (shouldMute) {
          const until = Math.floor(Date.now() / 1000) + 600; // 10 min
          await restrictChatMember(msg.chat.id, msg.from.id, false, until);
          await replyToChat(
            msg.chat.id,
            `🔇 Auto-muted for 10 minutes (3 spam strikes). Cool off.`,
            undefined
          );
        }
        return NextResponse.json({ ok: true });
      }
    }

    // 4. Command dispatch
    if (msg.text?.startsWith("/")) {
      const parts = msg.text.split(/\s+/);
      const rawCmd = parts[0];
      const cmd = rawCmd.split("@")[0].toLowerCase(); // strip @botname suffix
      const args = parts.slice(1);
      const handler = COMMANDS[cmd];

      if (handler) {
        const ctx: CommandContext = {
          message: msg,
          chatId: msg.chat.id,
          fromUserId: msg.from.id,
          args,
          replyTo: msg.reply_to_message,
        };
        try {
          await handler(ctx);
        } catch (error) {
          console.error(`[telegram-bot] ${cmd} handler error:`, error);
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[telegram-bot] webhook error:", error);
    // Always return 200 so Telegram doesn't retry
    return NextResponse.json({ ok: true });
  }
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
