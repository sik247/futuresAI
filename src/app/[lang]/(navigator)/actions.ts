"use server";

import { eventsService } from "@/lib/services/events/events.service";
import { exchangesService } from "@/lib/services/exchanges/exchanges.service";
import { newsService } from "@/lib/services/news/news.service";
import { postsService } from "@/lib/services/posts/posts.service";
import { fetchCryptoNews, CryptoNewsItem } from "@/lib/services/news/crypto-news.service";

export async function getExchanges() {
  try {
    return await exchangesService.getAll();
  } catch (error) {
    console.error("Failed to fetch exchanges:", error);
    return [];
  }
}

export async function getNews() {
  try {
    return await newsService.getAll();
  } catch (error) {
    console.error("Failed to fetch news:", error);
    return [];
  }
}

export async function getEvents() {
  try {
    return await eventsService.getAll();
  } catch (error) {
    console.error("Failed to fetch events:", error);
    return [];
  }
}

export async function getPosts() {
  try {
    return await postsService.findMany(1);
  } catch (error) {
    console.error("Failed to fetch posts:", error);
    return [];
  }
}

export async function getCoinessNews(): Promise<CryptoNewsItem[]> {
  try {
    const cryptoNews = await fetchCryptoNews();
    return cryptoNews.slice(0, 20);
  } catch (error) {
    console.error("Failed to fetch crypto news:", error);
    return [];
  }
}
