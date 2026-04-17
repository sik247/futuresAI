import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * Admin notification management.
 * GET  — list sent notifications (paginated, filterable)
 * POST — send notification to single user or broadcast to all
 */

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || (session.user as { role?: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sp = req.nextUrl.searchParams;
  const page = Math.max(1, parseInt(sp.get("page") || "1"));
  const limit = Math.min(100, parseInt(sp.get("limit") || "50"));
  const type = sp.get("type") || undefined;
  const searchUsers = sp.get("searchUsers") || undefined;

  // User search mode (for autocomplete)
  if (searchUsers) {
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { name: { contains: searchUsers, mode: "insensitive" } },
          { email: { contains: searchUsers, mode: "insensitive" } },
          { nickname: { contains: searchUsers, mode: "insensitive" } },
        ],
      },
      select: { id: true, name: true, email: true, nickname: true },
      take: 10,
    });
    return NextResponse.json({ users });
  }

  const where: any = {};
  if (type) where.type = type;

  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({
      where,
      include: { user: { select: { name: true, email: true, nickname: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.notification.count({ where }),
  ]);

  return NextResponse.json({ notifications, total, page, limit });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || (session.user as { role?: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { userId, broadcast, title, message, type } = await req.json();

  if (!title || !message) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const notifType = type || "info";

  if (broadcast) {
    const allUsers = await prisma.user.findMany({ select: { id: true } });
    await prisma.notification.createMany({
      data: allUsers.map((u) => ({
        userId: u.id,
        title,
        message,
        type: notifType,
      })),
    });
    return NextResponse.json({ success: true, sent: allUsers.length });
  }

  if (!userId) {
    return NextResponse.json({ error: "userId or broadcast required" }, { status: 400 });
  }

  const notification = await prisma.notification.create({
    data: { userId, title, message, type: notifType },
  });

  return NextResponse.json({ success: true, notification });
}
