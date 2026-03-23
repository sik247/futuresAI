// YouTube feed service
// Fetches videos from crypto YouTube channels via RSS feeds (no API key needed)
// Uses in-memory caching with 10-minute TTL

export interface YouTubeVideoItem {
  videoId: string;
  title: string;
  description: string;
  channelName: string;
  channelId: string;
  publishedAt: Date;
  thumbnailUrl: string;
  category: 'education' | 'analysis' | 'news' | 'trading' | 'shorts';
}

export interface TrackedChannel {
  channelId: string;
  name: string;
  category: YouTubeVideoItem['category'];
}

const CRYPTO_CHANNELS: TrackedChannel[] = [
  { channelId: 'UCRvqjQPSeaWn-uEx-w0XOIg', name: 'CoinBureau', category: 'education' },
  { channelId: 'UCCatR7nWbYrkVXdxXb4cGXw', name: 'DataDash', category: 'analysis' },
  { channelId: 'UCqK_GSMbpiV8spgD3ZGloSw', name: 'CryptosRUs', category: 'analysis' },
  { channelId: 'UClgJyzwGs-GyaNxUHcLZrkg', name: 'InvestAnswers', category: 'education' },
  { channelId: 'UCAl9Ld79qaZxp9JzEOwd3aA', name: 'BenjaminCowen', category: 'analysis' },
  { channelId: 'UCbLhGKVY-bJPcawebgtNfbw', name: 'Altcoin Daily', category: 'news' },
  { channelId: 'UCN9Nj4tjXbVTLYWN0EKly_Q', name: 'Crypto Banter', category: 'trading' },
  { channelId: 'UCa0nvMcv3bQzxFTjSyp_Vvg', name: '매억남 (MAEUKNAM)', category: 'trading' },
  { channelId: 'UCvhsQm_E8wx2t5haDnCejMg', name: '코인이슈 (Coin Issue)', category: 'news' },
];

// ── In-memory cache ──────────────────────────────────────────────────
type CacheEntry = {
  items: YouTubeVideoItem[];
  fetchedAt: number;
};

const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes
let youtubeCache: CacheEntry | null = null;

// ── XML parsing helpers ──────────────────────────────────────────────

function parseXmlTag(xml: string, tag: string): string {
  const open = xml.indexOf(`<${tag}>`);
  const close = xml.indexOf(`</${tag}>`);
  if (open === -1 || close === -1) return '';
  const start = open + tag.length + 2;
  let content = xml.substring(start, close).trim();
  // Strip CDATA
  if (content.startsWith('<![CDATA[')) {
    content = content.slice(9, content.indexOf(']]>'));
  }
  return content;
}

function parseNamespacedTag(xml: string, tag: string): string {
  // Handles tags like <yt:videoId> or <media:description>
  const openPattern = new RegExp(`<${tag.replace(':', '\\:')}>`);
  const closePattern = new RegExp(`</${tag.replace(':', '\\:')}>`);
  const openMatch = openPattern.exec(xml);
  const closeMatch = closePattern.exec(xml);
  if (!openMatch || !closeMatch) return '';
  const start = openMatch.index + openMatch[0].length;
  const end = closeMatch.index;
  let content = xml.substring(start, end).trim();
  if (content.startsWith('<![CDATA[')) {
    content = content.slice(9, content.indexOf(']]>'));
  }
  return content;
}

function parseEntries(xml: string, channel: TrackedChannel): YouTubeVideoItem[] {
  const items: YouTubeVideoItem[] = [];
  let pos = 0;

  while (true) {
    const entryStart = xml.indexOf('<entry>', pos);
    if (entryStart === -1) break;
    const entryEnd = xml.indexOf('</entry>', entryStart);
    if (entryEnd === -1) break;
    const entryXml = xml.substring(entryStart, entryEnd);
    pos = entryEnd + 8;

    const videoId = parseNamespacedTag(entryXml, 'yt:videoId');
    const title = parseXmlTag(entryXml, 'title');
    const published = parseXmlTag(entryXml, 'published');

    // media:description may contain the video description
    const description = parseNamespacedTag(entryXml, 'media:description');

    // media:title as fallback for title
    const mediaTitle = parseNamespacedTag(entryXml, 'media:title');

    if (!videoId) continue;

    const finalTitle = title || mediaTitle || 'Untitled';
    const thumbnailUrl = `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`;

    // Detect shorts by title patterns or short description
    let category = channel.category;
    const lowerTitle = finalTitle.toLowerCase();
    if (
      lowerTitle.includes('#shorts') ||
      lowerTitle.includes('#short') ||
      lowerTitle.includes('| shorts')
    ) {
      category = 'shorts';
    }

    items.push({
      videoId,
      title: decodeHtmlEntities(finalTitle),
      description: decodeHtmlEntities(description).slice(0, 500),
      channelName: channel.name,
      channelId: channel.channelId,
      publishedAt: published ? new Date(published) : new Date(),
      thumbnailUrl,
      category: category as YouTubeVideoItem['category'],
    });
  }

  return items;
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/');
}

// ── Channel feed fetcher ─────────────────────────────────────────────

async function fetchChannelFeed(channel: TrackedChannel): Promise<YouTubeVideoItem[]> {
  const url = `https://www.youtube.com/feeds/videos.xml?channel_id=${channel.channelId}`;

  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(10000),
      headers: {
        'User-Agent': 'CryptoX/1.0',
        Accept: 'application/xml, text/xml',
      },
    });

    if (!res.ok) {
      console.log(`[youtube-feed] Failed to fetch ${channel.name}: HTTP ${res.status}`);
      return [];
    }

    const xml = await res.text();
    const items = parseEntries(xml, channel);
    console.log(`[youtube-feed] Got ${items.length} videos from ${channel.name}`);
    return items;
  } catch (err) {
    console.log(`[youtube-feed] Error fetching ${channel.name}: ${err instanceof Error ? err.message : 'unknown'}`);
    return [];
  }
}

// ── Main feed fetcher ────────────────────────────────────────────────

/**
 * Fetch recent videos from all tracked crypto YouTube channels.
 * Results are cached in memory for 10 minutes.
 */
export async function fetchYouTubeFeeds(): Promise<YouTubeVideoItem[]> {
  // Return cached data if still fresh
  if (youtubeCache && Date.now() - youtubeCache.fetchedAt < CACHE_TTL_MS) {
    console.log('[youtube-feed] Returning cached feed');
    return youtubeCache.items;
  }

  console.log('[youtube-feed] Fetching live feeds...');

  // Fetch all channels in parallel
  const results = await Promise.allSettled(
    CRYPTO_CHANNELS.map((channel) => fetchChannelFeed(channel))
  );

  const allVideos: YouTubeVideoItem[] = [];
  let successCount = 0;

  for (const result of results) {
    if (result.status === 'fulfilled' && result.value.length > 0) {
      allVideos.push(...result.value);
      successCount++;
    }
  }

  // Sort by publishedAt descending (newest first)
  allVideos.sort(
    (a, b) => b.publishedAt.getTime() - a.publishedAt.getTime()
  );

  console.log(
    `[youtube-feed] Feed built: ${allVideos.length} videos from ${successCount}/${CRYPTO_CHANNELS.length} channels`
  );

  // Update cache only if we got some results
  if (allVideos.length > 0) {
    youtubeCache = {
      items: allVideos,
      fetchedAt: Date.now(),
    };
  }

  return youtubeCache?.items ?? [];
}

/**
 * Returns the list of tracked crypto YouTube channels.
 */
export function getTrackedChannels(): TrackedChannel[] {
  return CRYPTO_CHANNELS;
}

/**
 * Force-clear the in-memory cache (useful for manual refresh).
 */
export function clearYouTubeCache(): void {
  youtubeCache = null;
}
