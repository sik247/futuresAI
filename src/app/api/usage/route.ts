import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { checkDailyLimit } from "@/lib/services/usage.service";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const [chart, chat] = await Promise.all([
      checkDailyLimit(user.id, user.isPremium, "chart"),
      checkDailyLimit(user.id, user.isPremium, "chat"),
    ]);

    return NextResponse.json({
      isPremium: user.isPremium,
      chart: { used: chart.used, limit: chart.limit },
      chat: { used: chat.used, limit: chat.limit },
    });
  } catch (error) {
    console.error("Usage check error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
