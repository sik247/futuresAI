"use client";

import { useMemo } from "react";
import { NewsListSection } from "../../news/news-list-section";
import type { CryptoNewsItem } from "@/lib/services/news/crypto-news.service";

// ── Types ────────────────────────────────────────────────────────────

interface SerializedNewsItem {
  id: string;
  title: string;
  body: string;
  source: string;
  sourceImg: string;
  url: string;
  imageUrl: string;
  publishedAt: string;
  categories: string[];
}

interface NewsTabProps {
  newsItems: SerializedNewsItem[];
}

// ── Component ────────────────────────────────────────────────────────

export default function NewsTab({ newsItems }: NewsTabProps) {
  // Convert serialized items to CryptoNewsItem format (Date objects)
  const news: CryptoNewsItem[] = useMemo(
    () =>
      newsItems.map((item) => ({
        ...item,
        publishedAt: new Date(item.publishedAt),
      })),
    [newsItems]
  );

  return <NewsListSection news={news} />;
}
