import {
  fetchTrendingNews,
  getAvailableSources,
} from "@/lib/services/news/crypto-news.service";
import { NextResponse } from "next/server";

export const revalidate = 120; // 2 minutes

/**
 * GET /api/news/trending
 * Returns trending/breaking news from the last 2 hours.
 */
export async function GET() {
  try {
    const allTrending = await fetchTrendingNews();

    // Filter to only items from the last 2 hours
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    const recent = allTrending.filter(
      (item) => new Date(item.publishedAt) >= twoHoursAgo
    );

    // If very few recent items, fall back to latest trending regardless of time
    const trending = recent.length >= 3 ? recent : allTrending.slice(0, 20);

    const sources = getAvailableSources().map((s) => s.name);

    return NextResponse.json(
      {
        trending,
        sources,
        updatedAt: new Date().toISOString(),
      },
      {
        headers: {
          "Cache-Control":
            "public, s-maxage=120, stale-while-revalidate=60",
        },
      }
    );
  } catch (error) {
    console.error("[news/trending] Failed to fetch trending news:", error);
    return NextResponse.json(
      {
        trending: [],
        sources: [],
        updatedAt: new Date().toISOString(),
        error: "Failed to fetch trending news",
      },
      { status: 500 }
    );
  }
}
