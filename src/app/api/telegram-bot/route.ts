import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

const TELEGRAM_API = "https://api.telegram.org/bot";
const PREMIUM_PRICE_USD = 99;

// Your USDT wallet address for receiving payments
const PAYMENT_WALLET = process.env.PREMIUM_USDT_WALLET || "0xYOUR_WALLET_ADDRESS_HERE";
const PAYMENT_NETWORK = process.env.PREMIUM_USDT_NETWORK || "ERC-20"; // or "TRC-20"

function getBotToken(): string {
  return process.env.TELEGRAM_BOT_TOKEN || "";
}

async function sendMessage(chatId: number | string, text: string, replyMarkup?: any) {
  await fetch(`${TELEGRAM_API}${getBotToken()}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "HTML",
      ...(replyMarkup ? { reply_markup: replyMarkup } : {}),
    }),
  });
}

/**
 * Verify USDT transfer on Ethereum via Etherscan
 * Checks if TX is a USDT transfer to our wallet with correct amount
 */
async function verifyUsdtTx(txHash: string): Promise<{ valid: boolean; amount: number; from: string }> {
  try {
    const etherscanKey = process.env.ETHERSCAN_API_KEY || "";
    const url = `https://api.etherscan.io/api?module=proxy&action=eth_getTransactionReceipt&txhash=${txHash}&apikey=${etherscanKey}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    const data = await res.json();

    if (!data.result || !data.result.logs) {
      return { valid: false, amount: 0, from: "" };
    }

    // USDT contract: 0xdAC17F958D2ee523a2206206994597C13D831ec7
    const usdtContract = "0xdac17f958d2ee523a2206206994597c13d831ec7";
    // Transfer event topic
    const transferTopic = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";

    for (const log of data.result.logs) {
      if (
        log.address?.toLowerCase() === usdtContract &&
        log.topics?.[0] === transferTopic
      ) {
        // Decode: topics[2] = to address, data = amount
        const to = "0x" + (log.topics[2] || "").slice(26).toLowerCase();
        const amount = parseInt(log.data, 16) / 1e6; // USDT has 6 decimals
        const from = "0x" + (log.topics[1] || "").slice(26).toLowerCase();

        if (to === PAYMENT_WALLET.toLowerCase() && amount >= PREMIUM_PRICE_USD * 0.95) {
          return { valid: true, amount, from };
        }
      }
    }

    return { valid: false, amount: 0, from: "" };
  } catch (error) {
    console.error("[TX Verify]", error);
    return { valid: false, amount: 0, from: "" };
  }
}

/**
 * Telegram Webhook Handler
 * Processes bot commands and TX verification
 */
export async function POST(req: NextRequest) {
  try {
    const update = await req.json();
    const message = update.message;
    if (!message || !message.text) return NextResponse.json({ ok: true });

    const chatId = message.chat.id;
    const text = message.text.trim();
    const username = message.from?.username || "";

    // /start - Welcome message
    if (text === "/start" || text === "/start premium") {
      await sendMessage(chatId, `
<b>🚀 FuturesAI Premium</b>

Welcome! Get full access to:
• 30 AI chat messages/day
• 10 chart analyses/day
• Real-time whale alerts
• Upbit + Kimchi Premium data
• Advanced indicators (RSI, MA)
• Telegram premium alerts

<b>💰 Price: $${PREMIUM_PRICE_USD} USDT/month</b>

To subscribe, send <b>$${PREMIUM_PRICE_USD} USDT</b> to:

<code>${PAYMENT_WALLET}</code>
Network: <b>${PAYMENT_NETWORK}</b>

After sending, paste your <b>TX hash</b> here and I'll verify it automatically.

<i>Need help? Type /help</i>
      `.trim());
      return NextResponse.json({ ok: true });
    }

    // /help
    if (text === "/help") {
      await sendMessage(chatId, `
<b>📋 Commands:</b>

/start - Subscribe to Premium
/status - Check your premium status
/verify &lt;tx_hash&gt; - Verify payment

<b>How to subscribe:</b>
1. Send $${PREMIUM_PRICE_USD} USDT to the wallet address
2. Copy the transaction hash
3. Send it here or use /verify &lt;hash&gt;

<b>Contact:</b> @futuresai_official
      `.trim());
      return NextResponse.json({ ok: true });
    }

    // /status - Check premium status
    if (text === "/status") {
      // Try to find user by looking up telegram chat ID in recent messages
      await sendMessage(chatId, `
<b>📊 Account Status</b>

To check your premium status, please visit:
https://www.futuresai.io

Or contact @futuresai_official for support.
      `.trim());
      return NextResponse.json({ ok: true });
    }

    // /verify <tx_hash> or direct TX hash
    const txHash = text.startsWith("/verify ")
      ? text.replace("/verify ", "").trim()
      : text.startsWith("0x") && text.length === 66
      ? text
      : null;

    if (txHash && txHash.startsWith("0x") && txHash.length === 66) {
      await sendMessage(chatId, "🔍 Verifying transaction... Please wait.");

      const result = await verifyUsdtTx(txHash);

      if (result.valid) {
        // Try to activate premium
        try {
          const activateRes = await fetch(
            `${process.env.NEXT_PUBLIC_URL || "https://www.futuresai.io"}/api/premium/activate`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${process.env.CRON_SECRET}`,
              },
              body: JSON.stringify({
                telegramChatId: chatId.toString(),
                txHash,
                months: 1,
              }),
            }
          );
          const activateData = await activateRes.json();

          if (activateData.ok) {
            await sendMessage(chatId, `
<b>✅ Payment Verified!</b>

Amount: <b>$${result.amount.toFixed(2)} USDT</b>
TX: <code>${txHash.slice(0, 10)}...${txHash.slice(-8)}</code>

<b>🎉 Premium activated!</b>
Your account now has full access to all features.

Thank you for subscribing to FuturesAI Premium!
            `.trim());
          } else {
            await sendMessage(chatId, `
<b>✅ Payment Verified!</b>

Amount: <b>$${result.amount.toFixed(2)} USDT</b>

⚠️ Could not auto-activate. Please share your <b>FuturesAI email</b> so we can link your account.

Or contact @futuresai_official for manual activation.
            `.trim());
          }
        } catch {
          await sendMessage(chatId, `
<b>✅ Payment Verified: $${result.amount.toFixed(2)} USDT</b>

⚠️ Auto-activation error. Please contact @futuresai_official with your TX hash for manual activation.
          `.trim());
        }
      } else {
        await sendMessage(chatId, `
<b>❌ Verification Failed</b>

Could not verify payment. Please check:
• TX hash is correct
• USDT was sent to: <code>${PAYMENT_WALLET}</code>
• Amount is at least $${PREMIUM_PRICE_USD} USDT
• Transaction is confirmed (wait a few minutes)

Try again or contact @futuresai_official
        `.trim());
      }
      return NextResponse.json({ ok: true });
    }

    // Unknown command
    if (text.startsWith("/")) {
      await sendMessage(chatId, "Unknown command. Type /help for available commands.");
    } else {
      // If user sends email, try to link account
      const emailMatch = text.match(/[\w.-]+@[\w.-]+\.\w+/);
      if (emailMatch) {
        const email = emailMatch[0];
        const user = await prisma.user.findUnique({ where: { email } });
        if (user) {
          await sendMessage(chatId, `
<b>📧 Account Found!</b>

Email: ${email}
Premium: ${user.isPremium ? "✅ Active" : "❌ Not active"}

${!user.isPremium ? `To activate premium, send $${PREMIUM_PRICE_USD} USDT to:\n<code>${PAYMENT_WALLET}</code>\n\nThen paste your TX hash here.` : "Your premium is already active! Enjoy all features."}
          `.trim());
        } else {
          await sendMessage(chatId, `No account found for ${email}. Please sign up at https://www.futuresai.io first.`);
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[Telegram Bot]", error);
    return NextResponse.json({ ok: true });
  }
}
