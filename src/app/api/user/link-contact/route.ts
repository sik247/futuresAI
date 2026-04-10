import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

const TELEGRAM_ID_REGEX = /^[0-9]{5,15}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * POST /api/user/link-contact
 * Body: { telegramId?: string, telegramUsername?: string, realEmail?: string }
 *
 * Links missing contact info to the signed-in user. If the user ends up with
 * BOTH a telegramId and realEmail AND we haven't hit 200 founding members yet,
 * assigns the next inviteNumber atomically.
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = (session.user as { id: string }).id;

  let body: { telegramId?: string; telegramUsername?: string; realEmail?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const telegramId = body.telegramId?.trim();
  const telegramUsername = body.telegramUsername?.trim().replace(/^@/, "") || undefined;
  const realEmail = body.realEmail?.trim().toLowerCase();

  if (!telegramId && !realEmail) {
    return NextResponse.json({ error: "Provide telegramId or realEmail" }, { status: 400 });
  }
  if (telegramId && !TELEGRAM_ID_REGEX.test(telegramId)) {
    return NextResponse.json({ error: "Invalid telegramId format" }, { status: 400 });
  }
  if (realEmail && !EMAIL_REGEX.test(realEmail)) {
    return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
  }

  // Check for conflicts with other users
  if (telegramId) {
    const existing = await prisma.user.findUnique({ where: { telegramId } });
    if (existing && existing.id !== userId) {
      return NextResponse.json({ error: "This Telegram ID is already linked to another account" }, { status: 409 });
    }
  }

  // Update user with provided fields
  const updateData: Record<string, unknown> = {};
  if (telegramId) updateData.telegramId = telegramId;
  if (telegramUsername) updateData.telegramUsername = telegramUsername;
  if (realEmail) updateData.realEmail = realEmail;

  const updated = await prisma.user.update({
    where: { id: userId },
    data: updateData,
  });

  // Check if user now has both contact methods and is eligible for founding 200
  let foundingAssigned = false;
  if (updated.telegramId && updated.realEmail && !updated.isFounding200) {
    try {
      const foundingCount = await prisma.user.count({ where: { isFounding200: true } });
      if (foundingCount < 200) {
        // Atomically assign inviteNumber and mark as founding member
        const nextNumber = foundingCount + 1;
        await prisma.user.update({
          where: { id: userId },
          data: {
            inviteNumber: nextNumber,
            isFounding200: true,
          },
        });
        foundingAssigned = true;
      }
    } catch (error) {
      // Race condition — another user got the slot. Not fatal.
      console.error("[link-contact] founding assignment race:", error);
    }
  }

  return NextResponse.json({
    ok: true,
    telegramId: updated.telegramId,
    telegramUsername: updated.telegramUsername,
    realEmail: updated.realEmail,
    isFounding200: foundingAssigned || updated.isFounding200,
    inviteNumber: updated.inviteNumber,
    foundingAssignedJustNow: foundingAssigned,
  });
}

/**
 * GET /api/user/link-contact
 * Returns the signed-in user's link status.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = (session.user as { id: string }).id;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      email: true,
      telegramId: true,
      telegramUsername: true,
      realEmail: true,
      inviteNumber: true,
      isFounding200: true,
    },
  });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const foundingCount = await prisma.user.count({ where: { isFounding200: true } });

  // A user is "email-based" if their login email is NOT a synthetic tg_*@telegram.user
  const isTelegramLogin = user.email.startsWith("tg_") && user.email.endsWith("@telegram.user");
  const needsTelegram = !user.telegramId;
  const needsEmail = isTelegramLogin && !user.realEmail;

  return NextResponse.json({
    telegramId: user.telegramId,
    telegramUsername: user.telegramUsername,
    realEmail: user.realEmail || (isTelegramLogin ? null : user.email),
    inviteNumber: user.inviteNumber,
    isFounding200: user.isFounding200,
    foundingCount,
    foundingSlotsLeft: Math.max(0, 200 - foundingCount),
    needsTelegram,
    needsEmail,
  });
}
