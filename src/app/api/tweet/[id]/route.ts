import { NextRequest, NextResponse } from "next/server";
import { getTweet } from "react-tweet/api";

// Cache tweet data in memory for 1 hour
const cache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  // Check memory cache first
  const cached = cache.get(id);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return NextResponse.json(
      { data: cached.data },
      {
        headers: {
          "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200",
        },
      }
    );
  }

  try {
    const tweet = await getTweet(id);

    if (tweet) {
      // Cache successful fetches
      cache.set(id, { data: tweet, timestamp: Date.now() });

      // Evict old entries if cache grows too large
      if (cache.size > 500) {
        const now = Date.now();
        const keys = Array.from(cache.keys());
        keys.forEach((key) => {
          const val = cache.get(key);
          if (val && now - val.timestamp > CACHE_TTL) cache.delete(key);
        });
      }
    }

    return NextResponse.json(
      { data: tweet ?? null },
      {
        status: tweet ? 200 : 404,
        headers: {
          "Cache-Control": tweet
            ? "public, s-maxage=3600, stale-while-revalidate=7200"
            : "public, s-maxage=60",
        },
      }
    );
  } catch (error) {
    console.error(`[tweet-api] Failed to fetch tweet ${id}:`, error);
    return NextResponse.json(
      { data: null, error: "Failed to fetch tweet" },
      { status: 500 }
    );
  }
}
