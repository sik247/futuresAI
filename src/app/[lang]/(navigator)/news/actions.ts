"use server";

import { fetchCryptoNews } from "@/lib/services/news/crypto-news.service";
import { newsService } from "@/lib/services/news/news.service";

export async function getCryptoNews() {
  try {
    return await fetchCryptoNews();
  } catch (error) {
    console.error("Failed to fetch crypto news:", error);
    return [];
  }
}

export async function getCoinessNews(page: number) {
  try {
    return await newsService.getAllByPage(page);
  } catch (error) {
    console.error("Failed to fetch coiness news:", error);
    return [];
  }
}

export async function getTotalNews() {
  try {
    return await newsService.getAllCount();
  } catch (error) {
    console.error("Failed to fetch total news count:", error);
    return 0;
  }
}
