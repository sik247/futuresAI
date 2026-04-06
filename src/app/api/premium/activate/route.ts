import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * Activate premium for a user after verified USDT payment.
 * Called by the Telegram bot after TX verification.
 * Protected by CRON_SECRET.
 */
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { email, telegramChatId, txHash, months = 1 } = await req.json();

    if (!email && !telegramChatId) {
      return NextResponse.json({ error: "email or telegramChatId required" }, { status: 400 });
    }

    // Find user by email or telegram chat ID
    let user;
    if (email) {
      user = await prisma.user.findUnique({ where: { email } });
    }

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Activate premium
    await prisma.user.update({
      where: { id: user.id },
      data: {
        isPremium: true,
        chatEnabled: true,
      },
    });

    return NextResponse.json({
      ok: true,
      user: { email: user.email, name: user.name, isPremium: true },
      txHash,
      months,
    });
  } catch (error) {
    console.error("[Premium Activate]", error);
    return NextResponse.json({ error: "Activation failed" }, { status: 500 });
  }
}
