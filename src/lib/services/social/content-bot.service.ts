// Content bot orchestrator service
// Aggregates crypto content from X, YouTube, and news sources
// Translates to Korean and manages a live content pipeline

import { fetchCryptoFeed, type XFeedItem } from './x-feed.service';
import { fetchYouTubeFeeds, type YouTubeVideoItem } from './youtube-feed.service';
import { fetchCryptoNews, type CryptoNewsItem } from '../news/crypto-news.service';
import { translateText, translateBatch } from './korean-translator.service';

export interface ManagedContent {
  id: string;
  type: 'tweet' | 'youtube' | 'news' | 'short';
  sourceUrl: string;
  title: string;
  titleKo: string;
  description: string;
  descriptionKo: string;
  thumbnailUrl?: string;
  sourceName: string;
  sourceCategory: string;
  publishedAt: Date;
  fetchedAt: Date;
  status: 'pending' | 'translated' | 'published' | 'archived';
  metadata: Record<string, unknown>;
}

export interface ContentFeedOptions {
  type?: ManagedContent['type'];
  status?: ManagedContent['status'];
  limit?: number;
  lang?: 'en' | 'ko';
}

export interface PipelineStats {
  newItems: number;
  translated: number;
  total: number;
}

export interface ContentStats {
  byType: Record<string, number>;
  byStatus: Record<string, number>;
  total: number;
  oldestItem: Date | null;
  newestItem: Date | null;
}

// ── In-memory content store ──────────────────────────────────────────

const MAX_ITEMS = 500;
const MAX_PER_TYPE = 150; // Ensure fair distribution across content types
const contentStore = new Map<string, ManagedContent>();

function evictOldest(): void {
  if (contentStore.size <= MAX_ITEMS) return;

  // First, cap each type to MAX_PER_TYPE to ensure fair distribution
  const byType = new Map<string, Array<[string, ManagedContent]>>();
  const allEntries = Array.from(contentStore.entries());
  for (const [key, item] of allEntries) {
    const list = byType.get(item.type) || [];
    list.push([key, item]);
    byType.set(item.type, list);
  }

  Array.from(byType.values()).forEach((items) => {
    if (items.length > MAX_PER_TYPE) {
      items.sort((a, b) => a[1].fetchedAt.getTime() - b[1].fetchedAt.getTime());
      const toRemove = items.slice(0, items.length - MAX_PER_TYPE);
      for (const [key] of toRemove) {
        contentStore.delete(key);
      }
    }
  });

  // Then global eviction if still over limit
  if (contentStore.size <= MAX_ITEMS) return;
  const entries = Array.from(contentStore.entries());
  entries.sort((a, b) => a[1].fetchedAt.getTime() - b[1].fetchedAt.getTime());
  const toRemove = entries.slice(0, entries.length - MAX_ITEMS);
  for (const [key] of toRemove) {
    contentStore.delete(key);
  }
}

// ── Content ID generation ────────────────────────────────────────────

function generateContentId(type: string, sourceUrl: string): string {
  // Create a deterministic ID from type + sourceUrl for deduplication
  let hash = 0;
  const str = `${type}:${sourceUrl}`;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0;
  }
  return `${type}-${Math.abs(hash).toString(36)}`;
}

// ── Source converters ────────────────────────────────────────────────

function tweetToContent(item: XFeedItem): ManagedContent {
  const sourceUrl = `https://x.com/${item.username}/status/${item.tweetId}`;
  return {
    id: generateContentId('tweet', sourceUrl),
    type: 'tweet',
    sourceUrl,
    title: `@${item.username}`,
    titleKo: '',
    description: `Tweet by ${item.displayName} (@${item.username})`,
    descriptionKo: '',
    thumbnailUrl: undefined,
    sourceName: item.displayName,
    sourceCategory: item.category,
    publishedAt: new Date(), // Tweet IDs encode time but we don't decode snowflakes here
    fetchedAt: new Date(),
    status: 'pending',
    metadata: {
      tweetId: item.tweetId,
      username: item.username,
    },
  };
}

function youtubeToContent(item: YouTubeVideoItem): ManagedContent {
  const sourceUrl = `https://www.youtube.com/watch?v=${item.videoId}`;
  const type = item.category === 'shorts' ? 'short' : 'youtube';
  return {
    id: generateContentId(type, sourceUrl),
    type,
    sourceUrl,
    title: item.title,
    titleKo: '',
    description: item.description,
    descriptionKo: '',
    thumbnailUrl: item.thumbnailUrl,
    sourceName: item.channelName,
    sourceCategory: item.category,
    publishedAt: item.publishedAt,
    fetchedAt: new Date(),
    status: 'pending',
    metadata: {
      videoId: item.videoId,
      channelId: item.channelId,
    },
  };
}

function newsToContent(item: CryptoNewsItem): ManagedContent {
  return {
    id: generateContentId('news', item.url),
    type: 'news',
    sourceUrl: item.url,
    title: item.title,
    titleKo: '',
    description: item.body,
    descriptionKo: '',
    thumbnailUrl: item.imageUrl || undefined,
    sourceName: item.source,
    sourceCategory: item.categories[0] || 'crypto',
    publishedAt: item.publishedAt,
    fetchedAt: new Date(),
    status: 'pending',
    metadata: {
      categories: item.categories,
      sourceImg: item.sourceImg,
    },
  };
}

/**
 * Check if the content store has been populated.
 */
export function isStoreEmpty(): boolean {
  return contentStore.size === 0;
}

// ── Public API ───────────────────────────────────────────────────────

/**
 * Fetch content from all sources (X, YouTube, News), deduplicate, and add to store.
 * Returns the number of new items added.
 */
export async function aggregateAllContent(): Promise<number> {
  console.log('[content-bot] Aggregating content from all sources...');

  const [tweetResult, youtubeResult, newsResult] = await Promise.allSettled([
    fetchCryptoFeed(),
    fetchYouTubeFeeds(),
    fetchCryptoNews(),
  ]);

  let newCount = 0;

  // Process tweets
  if (tweetResult.status === 'fulfilled') {
    for (const item of tweetResult.value) {
      const content = tweetToContent(item);
      if (!contentStore.has(content.id)) {
        contentStore.set(content.id, content);
        newCount++;
      }
    }
    console.log(`[content-bot] Processed ${tweetResult.value.length} tweets`);
  } else {
    console.log(`[content-bot] Failed to fetch tweets: ${tweetResult.reason}`);
  }

  // Process YouTube videos
  if (youtubeResult.status === 'fulfilled') {
    for (const item of youtubeResult.value) {
      const content = youtubeToContent(item);
      if (!contentStore.has(content.id)) {
        contentStore.set(content.id, content);
        newCount++;
      }
    }
    console.log(`[content-bot] Processed ${youtubeResult.value.length} YouTube videos`);
  } else {
    console.log(`[content-bot] Failed to fetch YouTube: ${youtubeResult.reason}`);
  }

  // Process news
  if (newsResult.status === 'fulfilled') {
    for (const item of newsResult.value) {
      const content = newsToContent(item);
      if (!contentStore.has(content.id)) {
        contentStore.set(content.id, content);
        newCount++;
      }
    }
    console.log(`[content-bot] Processed ${newsResult.value.length} news articles`);
  } else {
    console.log(`[content-bot] Failed to fetch news: ${newsResult.reason}`);
  }

  // Evict oldest if over capacity
  evictOldest();

  console.log(`[content-bot] Aggregation complete: ${newCount} new items, ${contentStore.size} total`);
  return newCount;
}

/**
 * Translate all pending content to Korean.
 * Returns the number of items translated.
 */
export async function translatePendingContent(): Promise<number> {
  const pendingItems = Array.from(contentStore.values()).filter(
    (item) => item.status === 'pending'
  );

  if (pendingItems.length === 0) {
    console.log('[content-bot] No pending items to translate');
    return 0;
  }

  console.log(`[content-bot] Translating ${pendingItems.length} pending items...`);

  let translatedCount = 0;

  for (const item of pendingItems) {
    try {
      // Skip items that already have Korean text (e.g., Korean YouTube channels)
      const isKorean = /[\uac00-\ud7af]/.test(item.title);

      if (isKorean) {
        // Already Korean - copy as-is
        item.titleKo = item.title;
        item.descriptionKo = item.description;
      } else {
        // Translate title and description in batch
        const [titleResult, descResult] = await translateBatch(
          [item.title, item.description],
          'en',
          'ko'
        );
        item.titleKo = titleResult.translated;
        item.descriptionKo = descResult.translated;
      }

      item.status = 'translated';
      contentStore.set(item.id, item);
      translatedCount++;
    } catch (err) {
      console.log(
        `[content-bot] Failed to translate ${item.id}: ${err instanceof Error ? err.message : 'unknown'}`
      );
      // Keep as pending for retry
    }
  }

  console.log(`[content-bot] Translation complete: ${translatedCount}/${pendingItems.length} items`);
  return translatedCount;
}

/**
 * Mark a content item as published.
 */
export function publishContent(id: string): boolean {
  const item = contentStore.get(id);
  if (!item) {
    console.log(`[content-bot] Content not found: ${id}`);
    return false;
  }

  item.status = 'published';
  contentStore.set(id, item);
  console.log(`[content-bot] Published: ${id}`);
  return true;
}

/**
 * Get filtered content feed.
 * If lang='ko', returns Korean versions of title/description.
 */
export function getContentFeed(options: ContentFeedOptions = {}): ManagedContent[] {
  const { type, status, limit = 50, lang } = options;

  let items = Array.from(contentStore.values());

  // Filter by type
  if (type) {
    items = items.filter((item) => item.type === type);
  }

  // Filter by status
  if (status) {
    items = items.filter((item) => item.status === status);
  }

  // Sort by publishedAt descending
  items.sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());

  // Apply limit
  items = items.slice(0, limit);

  // If Korean language requested, swap title/description to Korean versions
  if (lang === 'ko') {
    items = items.map((item) => ({
      ...item,
      title: item.titleKo || item.title,
      description: item.descriptionKo || item.description,
    }));
  }

  return items;
}

/**
 * Run the full content pipeline: aggregate -> translate -> return stats.
 */
export async function runContentPipeline(): Promise<PipelineStats> {
  console.log('[content-bot] Running content pipeline...');

  const newItems = await aggregateAllContent();
  const translated = await translatePendingContent();

  const stats: PipelineStats = {
    newItems,
    translated,
    total: contentStore.size,
  };

  console.log(
    `[content-bot] Pipeline complete: ${stats.newItems} new, ${stats.translated} translated, ${stats.total} total`
  );

  return stats;
}

/**
 * Get content statistics by type and status.
 */
export function getContentStats(): ContentStats {
  const items = Array.from(contentStore.values());

  const byType: Record<string, number> = {};
  const byStatus: Record<string, number> = {};
  let oldestItem: Date | null = null;
  let newestItem: Date | null = null;

  for (const item of items) {
    byType[item.type] = (byType[item.type] || 0) + 1;
    byStatus[item.status] = (byStatus[item.status] || 0) + 1;

    if (!oldestItem || item.publishedAt < oldestItem) {
      oldestItem = item.publishedAt;
    }
    if (!newestItem || item.publishedAt > newestItem) {
      newestItem = item.publishedAt;
    }
  }

  return {
    byType,
    byStatus,
    total: items.length,
    oldestItem,
    newestItem,
  };
}

/**
 * Get the latest translated content ready for a Korean audience.
 * Combines tweets (with Korean context), YouTube videos (with Korean titles),
 * and news (with Korean summaries), sorted newest first.
 */
export function getLiveKoreanFeed(limit: number = 30): ManagedContent[] {
  let items = Array.from(contentStore.values()).filter(
    (item) => item.status === 'translated' || item.status === 'published'
  );

  // Sort by publishedAt descending
  items.sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());

  // Apply limit
  items = items.slice(0, limit);

  // Return with Korean content in the primary fields
  return items.map((item) => ({
    ...item,
    title: item.titleKo || item.title,
    description: item.descriptionKo || item.description,
  }));
}
