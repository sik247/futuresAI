export const revalidate = 300;

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getLiveKoreanFeed, isStoreEmpty, runContentPipeline } from "@/lib/services/social/content-bot.service";

// GET /api/content-bot/korean-feed - Korean-translated content feed
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = Math.min(
      parseInt(searchParams.get("limit") || "30", 10),
      100
    );
    const type = searchParams.get("type") || "all";

    // Try database first
    try {
      const where: Record<string, unknown> = {
        status: { in: ["translated", "published"] },
        titleKo: { not: "" },
      };

      if (type !== "all") {
        where.type = type;
      }

      const items = await prisma.managedContent.findMany({
        where,
        orderBy: { publishedAt: "desc" },
        take: limit,
        select: {
          id: true,
          type: true,
          titleKo: true,
          descriptionKo: true,
          thumbnailUrl: true,
          sourceName: true,
          sourceUrl: true,
          publishedAt: true,
        },
      });

      if (items.length > 0) {
        const feed = items.map((item) => ({
          id: item.id,
          type: item.type,
          title: item.titleKo,
          description: item.descriptionKo,
          thumbnailUrl: item.thumbnailUrl,
          sourceName: item.sourceName,
          sourceUrl: item.sourceUrl,
          publishedAt: item.publishedAt.toISOString(),
        }));

        return NextResponse.json(
          {
            feed,
            count: feed.length,
            updatedAt: new Date().toISOString(),
          },
          {
            headers: {
              "Cache-Control":
                "public, s-maxage=300, stale-while-revalidate=150",
            },
          }
        );
      }
    } catch {
      console.log("[content-bot] DB unavailable for korean-feed, using in-memory");
    }

    // Fallback to in-memory store
    // Auto-populate if store is empty (serverless cold start / dev hot reload)
    if (isStoreEmpty()) {
      console.log("[content-bot] Korean feed store empty, triggering background aggregation...");
      runContentPipeline().catch(err => console.error("[content-bot] Background pipeline error:", err));
    }

    let items = getLiveKoreanFeed(limit);

    // Filter by type if specified
    if (type !== "all") {
      items = items.filter((item) => item.type === type);
    }

    const feed = items.map((item) => ({
      id: item.id,
      type: item.type,
      title: item.titleKo || item.title,
      description: item.descriptionKo || item.description,
      thumbnailUrl: item.thumbnailUrl,
      sourceName: item.sourceName,
      sourceUrl: item.sourceUrl,
      publishedAt:
        item.publishedAt instanceof Date
          ? item.publishedAt.toISOString()
          : new Date(item.publishedAt).toISOString(),
    }));

    return NextResponse.json(
      {
        feed,
        count: feed.length,
        updatedAt: new Date().toISOString(),
      },
      {
        headers: {
          "Cache-Control":
            "public, s-maxage=300, stale-while-revalidate=150",
        },
      }
    );
  } catch (error) {
    console.error("[content-bot] Korean feed error:", error);
    return NextResponse.json(
      {
        feed: [],
        count: 0,
        updatedAt: new Date().toISOString(),
        error: "Failed to fetch Korean feed",
      },
      { status: 500 }
    );
  }
}
