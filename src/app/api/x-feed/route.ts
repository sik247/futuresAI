import { fetchCryptoFeed } from "@/lib/services/social/x-feed.service";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 600; // 10 minutes

export async function GET() {
  try {
    const feed = await fetchCryptoFeed();

    return NextResponse.json(
      { feed, fetchedAt: new Date().toISOString() },
      {
        headers: {
          "Cache-Control": "public, s-maxage=600, stale-while-revalidate=300",
        },
      }
    );
  } catch (error) {
    console.error("[x-feed] Failed to fetch crypto feed:", error);
    return NextResponse.json(
      { feed: [], fetchedAt: new Date().toISOString(), error: "Failed to fetch feed" },
      { status: 500 }
    );
  }
}
