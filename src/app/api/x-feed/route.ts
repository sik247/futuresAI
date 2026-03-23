import {
  fetchCryptoFeed,
  clearFeedCache,
} from "@/lib/services/social/x-feed.service";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 600; // 10 minutes

export async function GET(request: NextRequest) {
  try {
    // Allow cache-busting via ?refresh=true
    const refresh = request.nextUrl.searchParams.get("refresh") === "true";
    if (refresh) {
      clearFeedCache();
    }

    const feed = await fetchCryptoFeed();

    return NextResponse.json(
      {
        feed,
        count: feed.length,
        fetchedAt: new Date().toISOString(),
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=600, stale-while-revalidate=300",
        },
      }
    );
  } catch (error) {
    console.error("[x-feed] Failed to fetch crypto feed:", error);
    return NextResponse.json(
      {
        feed: [],
        count: 0,
        fetchedAt: new Date().toISOString(),
        error: "Failed to fetch feed",
      },
      { status: 500 }
    );
  }
}
