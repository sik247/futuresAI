import { fetchCryptoNews } from "@/lib/services/news/crypto-news.service";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const news = await fetchCryptoNews();
    return NextResponse.json(news);
  } catch (error) {
    console.error("Failed to fetch crypto news:", error);
    return NextResponse.json([], { status: 500 });
  }
}
