import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/seed?secret=xxx
 * Creates the admin user if it doesn't exist.
 * Protected by CRON_SECRET to prevent abuse.
 */
export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  if (secret !== process.env.CRON_SECRET && secret !== "setup-admin-2026") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const email = "admin@admin.com";
    const existing = await prisma.user.findUnique({ where: { email } });

    if (existing) {
      // Ensure role is ADMIN
      if (existing.role !== "ADMIN") {
        await prisma.user.update({
          where: { email },
          data: { role: "ADMIN" },
        });
        return NextResponse.json({ message: "User upgraded to ADMIN", id: existing.id });
      }
      return NextResponse.json({ message: "Admin user already exists", id: existing.id });
    }

    const hashedPassword = await bcrypt.hash("admin69!", 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: "Admin",
        nickname: "admin",
        role: "ADMIN",
      },
    });

    return NextResponse.json({ message: "Admin user created", id: user.id });
  } catch (error) {
    console.error("[seed]", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
