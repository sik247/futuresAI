export const dynamic = "force-dynamic";
export const maxDuration = 60;

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { broadcastBlogArticle } from "@/lib/services/notifications/blog-broadcast.service";

// Scans recently published BlogArticles and pushes any not-yet-broadcast ones
// to the Korean + Global Telegram channels via the futuresAIadmin bot.
// Dedup-store keeps each article from firing twice.
export async function GET(request: Request) {
  if (process.env.CRON_SECRET) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const articles = await prisma.blogArticle.findMany({
    where: { published: true, publishedAt: { gte: since } },
    select: {
      id: true,
      title: true,
      titleKo: true,
      excerpt: true,
      excerptKo: true,
      imageUrl: true,
    },
    orderBy: { publishedAt: "asc" },
    take: 20,
  });

  const results: Array<{ id: string; ko: boolean }> = [];
  for (const a of articles) {
    const r = await broadcastBlogArticle(a);
    if (r.ko) results.push({ id: a.id, ko: r.ko });
  }

  return NextResponse.json({
    success: true,
    scanned: articles.length,
    broadcast: results.length,
    results,
  });
}
