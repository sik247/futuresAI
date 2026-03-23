export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin only" }, { status: 403 });
    }

    const analyses = await prisma.chartAnalysis.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        user: {
          select: {
            name: true,
            email: true,
            nickname: true,
          },
        },
      },
    });

    return NextResponse.json({ analyses });
  } catch (error) {
    console.error("Admin chart analyses error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
