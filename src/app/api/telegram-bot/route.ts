import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

const TELEGRAM_API = "https://api.telegram.org/bot";
const PREMIUM_PRICE_USD = 99;

// USDT TRC-20 wallet for receiving payments
const PAYMENT_WALLET = process.env.PREMIUM_USDT_WALLET || "TW7qfQgXLaW3HD4NP1PCorYiU5iaSGjyEG";
const PAYMENT_NETWORK = "TRC-20";

// Admin Telegram user ID (only this user can run admin commands)
const ADMIN_USER_ID = process.env.TELEGRAM_ADMIN_USER_ID || "";

function getBotToken(): string {
  return process.env.TELEGRAM_BOT_TOKEN || "";
}

function isAdmin(userId: number): boolean {
  return ADMIN_USER_ID !== "" && String(userId) === ADMIN_USER_ID;
}

async function sendMessage(chatId: number | string, text: string) {
  await fetch(`${TELEGRAM_API}${getBotToken()}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
  });
}

/* ── TRC-20 USDT Verification via TronGrid ─────────────────────────── */

async function verifyTrc20Tx(txId: string): Promise<{ valid: boolean; amount: number; from: string }> {
  try {
    // TronGrid transaction info endpoint
    const url = `https://api.trongrid.io/v1/transactions/${txId}/events`;
    const headers: Record<string, string> = { Accept: "application/json" };
    const tronKey = process.env.TRONGRID_API_KEY;
    if (tronKey) headers["TRON-PRO-API-KEY"] = tronKey;

    const res = await fetch(url, { headers, signal: AbortSignal.timeout(10000) });
    if (!res.ok) return { valid: false, amount: 0, from: "" };
    const data = await res.json();

    if (!data.data || !Array.isArray(data.data)) {
      return { valid: false, amount: 0, from: "" };
    }

    // USDT TRC-20 contract
    const usdtContract = "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t";

    for (const event of data.data) {
      if (
        event.contract_address === usdtContract &&
        event.event_name === "Transfer"
      ) {
        const to = event.result?.to || event.result?._to || "";
        const from = event.result?.from || event.result?._from || "";
        const rawAmount = event.result?.value || event.result?._value || "0";
        const amount = parseFloat(rawAmount) / 1e6; // USDT has 6 decimals

        // Convert addresses to base58 for comparison
        if (to === PAYMENT_WALLET && amount >= PREMIUM_PRICE_USD * 0.95) {
          return { valid: true, amount, from };
        }
      }
    }

    // Fallback: check transaction detail directly
    const txUrl = `https://api.trongrid.io/wallet/gettransactioninfobyid`;
    const txRes = await fetch(txUrl, {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ value: txId }),
      signal: AbortSignal.timeout(10000),
    });
    if (txRes.ok) {
      const txData = await txRes.json();
      // Check contract result for successful execution
      if (txData.receipt?.result === "SUCCESS") {
        // Transaction succeeded, but we couldn't parse the transfer event
        // Return partial result so admin can manually verify
        return { valid: false, amount: 0, from: "TX_FOUND_BUT_PARSE_FAILED" };
      }
    }

    return { valid: false, amount: 0, from: "" };
  } catch (error) {
    console.error("[TRC-20 Verify]", error);
    return { valid: false, amount: 0, from: "" };
  }
}

/* ── Admin Commands ──────────────────────────────────────────────────── */

async function handleAdminCommand(chatId: number, text: string): Promise<boolean> {
  // /premium_add <email>
  if (text.startsWith("/premium_add ")) {
    const email = text.replace("/premium_add ", "").trim();
    try {
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        await sendMessage(chatId, `❌ User not found: ${email}`);
        return true;
      }
      await prisma.user.update({
        where: { id: user.id },
        data: { isPremium: true, chatEnabled: true },
      });
      await sendMessage(chatId, `✅ Premium activated for <b>${user.name || email}</b>\nEmail: ${email}`);
    } catch (e) {
      await sendMessage(chatId, `❌ Error: ${String(e)}`);
    }
    return true;
  }

  // /premium_remove <email>
  if (text.startsWith("/premium_remove ")) {
    const email = text.replace("/premium_remove ", "").trim();
    try {
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        await sendMessage(chatId, `❌ User not found: ${email}`);
        return true;
      }
      await prisma.user.update({
        where: { id: user.id },
        data: { isPremium: false },
      });
      await sendMessage(chatId, `✅ Premium removed for <b>${user.name || email}</b>`);
    } catch (e) {
      await sendMessage(chatId, `❌ Error: ${String(e)}`);
    }
    return true;
  }

  // /premium_list
  if (text === "/premium_list") {
    try {
      const premiumUsers = await prisma.user.findMany({
        where: { isPremium: true },
        select: { name: true, email: true, createdAt: true },
        take: 50,
      });
      if (premiumUsers.length === 0) {
        await sendMessage(chatId, "No premium users.");
        return true;
      }
      const list = premiumUsers
        .map((u, i) => `${i + 1}. ${u.name || "?"} — ${u.email}`)
        .join("\n");
      await sendMessage(chatId, `<b>Premium Users (${premiumUsers.length}):</b>\n\n${list}`);
    } catch (e) {
      await sendMessage(chatId, `❌ Error: ${String(e)}`);
    }
    return true;
  }

  // /user_info <email>
  if (text.startsWith("/user_info ")) {
    const email = text.replace("/user_info ", "").trim();
    try {
      const user = await prisma.user.findUnique({
        where: { email },
        select: { name: true, email: true, isPremium: true, chatEnabled: true, role: true, credits: true, createdAt: true },
      });
      if (!user) {
        await sendMessage(chatId, `❌ User not found: ${email}`);
        return true;
      }
      await sendMessage(chatId, `<b>User Info</b>\n\nName: ${user.name || "?"}\nEmail: ${user.email}\nRole: ${user.role}\nPremium: ${user.isPremium ? "✅" : "❌"}\nChat: ${user.chatEnabled ? "✅" : "❌"}\nCredits: ${user.credits}\nJoined: ${new Date(user.createdAt).toLocaleDateString()}`);
    } catch (e) {
      await sendMessage(chatId, `❌ Error: ${String(e)}`);
    }
    return true;
  }

  // /stats
  if (text === "/stats") {
    try {
      const [totalUsers, premiumCount, chatCount] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { isPremium: true } }),
        prisma.chatMessage.count(),
      ]);
      await sendMessage(chatId, `<b>📊 Platform Stats</b>\n\nTotal Users: ${totalUsers}\nPremium: ${premiumCount}\nChat Messages: ${chatCount}`);
    } catch (e) {
      await sendMessage(chatId, `❌ Error: ${String(e)}`);
    }
    return true;
  }

  // /admin_help
  if (text === "/admin_help") {
    await sendMessage(chatId, `<b>🔧 Admin Commands</b>\n\n/premium_add &lt;email&gt; — Activate premium\n/premium_remove &lt;email&gt; — Deactivate premium\n/premium_list — List all premium users\n/user_info &lt;email&gt; — Show user details\n/stats — Platform statistics`);
    return true;
  }

  return false;
}

/* ── Main Webhook Handler ────────────────────────────────────────────── */

export async function POST(req: NextRequest) {
  try {
    const update = await req.json();
    const message = update.message;
    if (!message || !message.text) return NextResponse.json({ ok: true });

    const chatId = message.chat.id;
    const userId = message.from?.id || 0;
    const text = message.text.trim();
    const isGroup = message.chat.type === "group" || message.chat.type === "supergroup";

    // In groups, only respond to commands (ignore regular messages)
    if (isGroup && !text.startsWith("/")) {
      return NextResponse.json({ ok: true });
    }

    // Admin commands (any chat, only for admin user)
    if (isAdmin(userId) && text.startsWith("/premium_") || text === "/stats" || text === "/admin_help" || text.startsWith("/user_info ")) {
      if (isAdmin(userId)) {
        const handled = await handleAdminCommand(chatId, text);
        if (handled) return NextResponse.json({ ok: true });
      }
    }

    // /start
    if (text === "/start" || text === "/start premium") {
      await sendMessage(chatId, `<b>FuturesAI Premium</b>

Full access to all features:
• 30 AI chat messages/day
• 10 chart analyses/day
• Real-time whale alerts
• Upbit + Kimchi Premium data
• Advanced indicators (RSI, MA)
• Telegram premium alerts

<b>Price: $${PREMIUM_PRICE_USD} USDT/month</b>

Send <b>$${PREMIUM_PRICE_USD} USDT (TRC-20)</b> to:
<code>${PAYMENT_WALLET}</code>

After sending, paste your <b>TX hash</b> here.

Type /help for more info.`);
      return NextResponse.json({ ok: true });
    }

    // /help
    if (text === "/help") {
      const adminHelp = isAdmin(userId) ? "\n\n<b>Admin:</b> /admin_help" : "";
      await sendMessage(chatId, `<b>Commands:</b>

/start — Subscribe to Premium
/status — Check premium status
/verify &lt;tx_hash&gt; — Verify payment

<b>How to subscribe:</b>
1. Send $${PREMIUM_PRICE_USD} USDT (TRC-20) to wallet
2. Copy the transaction hash (starts with TX ID)
3. Paste it here or use /verify${adminHelp}`);
      return NextResponse.json({ ok: true });
    }

    // /status
    if (text === "/status") {
      await sendMessage(chatId, `Visit https://www.futuresai.io to check your premium status.\nOr send your email here to look up your account.`);
      return NextResponse.json({ ok: true });
    }

    // TX hash detection — Tron TX hashes are 64-char hex
    const txInput = text.startsWith("/verify ") ? text.replace("/verify ", "").trim() : text;
    const isTronTx = /^[a-fA-F0-9]{64}$/.test(txInput);

    if (isTronTx) {
      await sendMessage(chatId, "Verifying TRC-20 transaction...");

      const result = await verifyTrc20Tx(txInput);

      if (result.valid) {
        await sendMessage(chatId, `<b>✅ Payment Verified!</b>\n\nAmount: <b>$${result.amount.toFixed(2)} USDT</b>\nTX: <code>${txInput.slice(0, 12)}...${txInput.slice(-8)}</code>\n\nPlease send your <b>FuturesAI account email</b> to activate premium.`);
      } else if (result.from === "TX_FOUND_BUT_PARSE_FAILED") {
        await sendMessage(chatId, `Transaction found but could not auto-verify the USDT amount.\n\nPlease contact @futuresai_official with your TX hash for manual verification.`);
      } else {
        await sendMessage(chatId, `<b>❌ Verification Failed</b>\n\nPlease check:\n• TX hash is correct (64 hex characters)\n• USDT TRC-20 was sent to: <code>${PAYMENT_WALLET}</code>\n• Amount is at least $${PREMIUM_PRICE_USD}\n• Transaction is confirmed\n\nOr contact @futuresai_official`);
      }
      return NextResponse.json({ ok: true });
    }

    // Email detection — try to link account
    const emailMatch = text.match(/[\w.-]+@[\w.-]+\.\w+/);
    if (emailMatch) {
      const email = emailMatch[0];
      try {
        const user = await prisma.user.findUnique({ where: { email } });
        if (user) {
          await sendMessage(chatId, `<b>Account Found</b>\n\nName: ${user.name || "?"}\nEmail: ${email}\nPremium: ${user.isPremium ? "✅ Active" : "❌ Not active"}\n\n${!user.isPremium ? `Send $${PREMIUM_PRICE_USD} USDT (TRC-20) to:\n<code>${PAYMENT_WALLET}</code>\n\nThen paste your TX hash here.` : "Your premium is active!"}`);
        } else {
          await sendMessage(chatId, `No account for ${email}. Sign up at https://www.futuresai.io first.`);
        }
      } catch {
        await sendMessage(chatId, "Error looking up account. Try again.");
      }
      return NextResponse.json({ ok: true });
    }

    // In DM, show help for unknown input
    if (!isGroup && text.startsWith("/")) {
      await sendMessage(chatId, "Unknown command. Type /help");
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[Telegram Bot]", error);
    return NextResponse.json({ ok: true });
  }
}
