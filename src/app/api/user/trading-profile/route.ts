import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import type { TradingProfile } from "@/lib/services/user/trading-profile";

export const dynamic = "force-dynamic";

/* ------------------------------------------------------------------ */
/*  GET /api/user/trading-profile                                      */
/* ------------------------------------------------------------------ */
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { tradingProfile: true },
  });

  return NextResponse.json({ profile: user?.tradingProfile ?? null });
}

/* ------------------------------------------------------------------ */
/*  POST /api/user/trading-profile                                     */
/* ------------------------------------------------------------------ */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;

  let body: TradingProfile;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  // Validate/sanitize fields
  const profile: TradingProfile = {
    experience: body.experience,
    riskAppetite: body.riskAppetite,
    style: body.style,
    preferredTimeframes: Array.isArray(body.preferredTimeframes) ? body.preferredTimeframes.slice(0, 10) : undefined,
    preferredAssets: Array.isArray(body.preferredAssets) ? body.preferredAssets.slice(0, 20) : undefined,
    avgPositionSize: typeof body.avgPositionSize === "string" ? body.avgPositionSize.slice(0, 50) : undefined,
    leverage: body.leverage,
    goals: typeof body.goals === "string" ? body.goals.slice(0, 500) : undefined,
    notes: typeof body.notes === "string" ? body.notes.slice(0, 1000) : undefined,
  };

  await prisma.user.update({
    where: { id: userId },
    data: { tradingProfile: profile as any },
  });

  return NextResponse.json({ ok: true, profile });
}
