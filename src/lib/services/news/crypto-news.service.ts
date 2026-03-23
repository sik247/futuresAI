export interface CryptoNewsItem {
  id: string;
  title: string;
  body: string;
  source: string;
  sourceImg: string;
  url: string;
  imageUrl: string;
  publishedAt: Date;
  categories: string[];
}

export interface NewsSource {
  name: string;
  logo: string;
  type: "rss" | "api";
}

const SOURCE_LOGOS: Record<string, string> = {
  CoinTelegraph: "https://cointelegraph.com/favicon-32x32.png",
  CoinDesk:
    "https://www.coindesk.com/resizer/fk6SjZ6skTXrf9SuJVUeWghqJBY=/144x32/downloads.coindesk.com/arc/failsafe/feeds/coindesk-logo.png",
  Decrypt: "https://decrypt.co/favicon-32x32.png",
  "The Block": "https://www.theblock.co/favicon-32x32.png",
  "Bitcoin Magazine": "https://bitcoinmagazine.com/favicon-32x32.png",
  BeInCrypto: "https://beincrypto.com/favicon-32x32.png",
  CryptoSlate: "https://cryptoslate.com/favicon.ico",
  NewsBTC: "https://www.newsbtc.com/favicon.ico",
  Bitcoinist: "https://bitcoinist.com/favicon.ico",
  "U.Today": "https://u.today/favicon-32x32.png",
  CoinGecko: "https://www.coingecko.com/favicon-32x32.png",
  CryptoPanic: "https://cryptopanic.com/favicon.ico",
};

let cachedNews: CryptoNewsItem[] | null = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 3 * 60 * 1000; // 3 minutes

// ---------------------------------------------------------------------------
// XML / RSS helpers (preserved from original)
// ---------------------------------------------------------------------------

function parseXmlTag(xml: string, tag: string): string {
  const open = xml.indexOf(`<${tag}>`);
  const close = xml.indexOf(`</${tag}>`);
  if (open === -1 || close === -1) return "";
  const start = open + tag.length + 2;
  let content = xml.substring(start, close).trim();
  // Strip CDATA
  if (content.startsWith("<![CDATA[")) {
    content = content.slice(9, content.indexOf("]]>"));
  }
  return content;
}

function parseItems(xml: string): CryptoNewsItem[] {
  const items: CryptoNewsItem[] = [];
  let pos = 0;

  while (true) {
    const itemStart = xml.indexOf("<item>", pos);
    if (itemStart === -1) break;
    const itemEnd = xml.indexOf("</item>", itemStart);
    if (itemEnd === -1) break;
    const itemXml = xml.substring(itemStart, itemEnd);
    pos = itemEnd + 7;

    const title = parseXmlTag(itemXml, "title");
    const link = parseXmlTag(itemXml, "link");
    const description = parseXmlTag(itemXml, "description");
    const pubDate = parseXmlTag(itemXml, "pubDate");
    const creator = parseXmlTag(itemXml, "dc:creator");

    // Extract image from media:content or enclosure
    let imageUrl = "";
    const mediaMatch = itemXml.match(
      /url="([^"]+\.(jpg|jpeg|png|webp|gif)[^"]*)"/i
    );
    if (mediaMatch) imageUrl = mediaMatch[1];

    // Extract categories
    const cats: string[] = [];
    const catRegex =
      /<category[^>]*>(?:<!\[CDATA\[)?([^<\]]+)(?:\]\]>)?<\/category>/g;
    let catMatch;
    while ((catMatch = catRegex.exec(itemXml)) !== null) {
      cats.push(catMatch[1].trim());
    }

    if (title) {
      items.push({
        id: link || `news-${items.length}`,
        title,
        body: description.replace(/<[^>]*>/g, "").slice(0, 300),
        source: creator || "CoinTelegraph",
        sourceImg: SOURCE_LOGOS[creator] || "",
        url: link,
        imageUrl,
        publishedAt: pubDate ? new Date(pubDate) : new Date(),
        categories: cats.length > 0 ? cats : ["Crypto"],
      });
    }
  }

  return items;
}

// ---------------------------------------------------------------------------
// Feed / API source definitions
// ---------------------------------------------------------------------------

const RSS_FEEDS = [
  { url: "https://cointelegraph.com/rss", source: "CoinTelegraph" },
  {
    url: "https://www.coindesk.com/arc/outboundfeeds/rss/",
    source: "CoinDesk",
  },
  { url: "https://decrypt.co/feed", source: "Decrypt" },
  { url: "https://beincrypto.com/feed/", source: "BeInCrypto" },
  // New RSS sources
  { url: "https://www.theblock.co/rss.xml", source: "The Block" },
  { url: "https://bitcoinmagazine.com/feed", source: "Bitcoin Magazine" },
  { url: "https://cryptoslate.com/feed/", source: "CryptoSlate" },
  { url: "https://www.newsbtc.com/feed/", source: "NewsBTC" },
  { url: "https://bitcoinist.com/feed/", source: "Bitcoinist" },
  { url: "https://u.today/rss", source: "U.Today" },
];

// ---------------------------------------------------------------------------
// API-based source fetchers
// ---------------------------------------------------------------------------

async function fetchCoinGeckoNews(): Promise<CryptoNewsItem[]> {
  try {
    const res = await fetch("https://api.coingecko.com/api/v3/news", {
      next: { revalidate: 180 },
    });
    if (!res.ok) return [];
    const data = await res.json();

    // CoinGecko returns { data: [...] } or a direct array depending on version
    const items: unknown[] = Array.isArray(data) ? data : data?.data ?? [];

    return items.map((item: unknown) => {
      const n = item as Record<string, unknown>;
      const title = (n.title as string) || "";
      const url = (n.url as string) || "";
      return {
        id: url || `coingecko-${title.slice(0, 30)}`,
        title,
        body: ((n.description as string) || "").replace(/<[^>]*>/g, "").slice(0, 300),
        source: "CoinGecko",
        sourceImg: SOURCE_LOGOS["CoinGecko"],
        url,
        imageUrl: (n.thumb_2x as string) || "",
        publishedAt: n.created_at ? new Date(n.created_at as string) : new Date(),
        categories: ["Crypto"],
      };
    });
  } catch (err) {
    console.error("[news] CoinGecko fetch failed:", err);
    return [];
  }
}

async function fetchCryptoPanicNews(): Promise<CryptoNewsItem[]> {
  try {
    const res = await fetch(
      "https://cryptopanic.com/api/free/v1/posts/?auth_token=free&public=true&kind=news",
      { next: { revalidate: 180 } }
    );
    if (!res.ok) return [];
    const data = await res.json();

    const results: unknown[] = data?.results ?? [];

    return results.map((item: unknown) => {
      const n = item as Record<string, unknown>;
      const title = (n.title as string) || "";
      const url = (n.url as string) || "";
      const sourceObj = n.source as Record<string, unknown> | undefined;
      const sourceName = (sourceObj?.title as string) || "CryptoPanic";
      const domain = (n.domain as string) || "cryptopanic.com";

      return {
        id: url || `cryptopanic-${title.slice(0, 30)}`,
        title,
        body: "",
        source: sourceName,
        sourceImg:
          SOURCE_LOGOS[sourceName] || `https://${domain}/favicon.ico`,
        url,
        imageUrl: "",
        publishedAt: n.published_at
          ? new Date(n.published_at as string)
          : new Date(),
        categories: ["Crypto"],
      };
    });
  } catch (err) {
    console.error("[news] CryptoPanic fetch failed:", err);
    return [];
  }
}

// ---------------------------------------------------------------------------
// Deduplication helpers
// ---------------------------------------------------------------------------

/** Normalize a title for fuzzy comparison */
function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Simple Jaccard-like similarity on word sets */
function titleSimilarity(a: string, b: string): number {
  const arrA = normalizeTitle(a).split(" ").filter(Boolean);
  const arrB = normalizeTitle(b).split(" ").filter(Boolean);
  if (arrA.length === 0 || arrB.length === 0) return 0;
  const setB = new Set(arrB);
  let intersection = 0;
  arrA.forEach((w) => {
    if (setB.has(w)) intersection++;
  });
  // Union = unique words from both
  const unionSet = new Set(arrA.concat(arrB));
  return intersection / unionSet.size;
}

const SIMILARITY_THRESHOLD = 0.7;

function deduplicateNews(items: CryptoNewsItem[]): CryptoNewsItem[] {
  const unique: CryptoNewsItem[] = [];
  const seenUrls = new Set<string>();

  for (const item of items) {
    // Exact URL dedup
    if (item.url && seenUrls.has(item.url)) continue;

    // Fuzzy title dedup
    const isDuplicate = unique.some(
      (existing) => titleSimilarity(existing.title, item.title) >= SIMILARITY_THRESHOLD
    );
    if (isDuplicate) continue;

    if (item.url) seenUrls.add(item.url);
    unique.push(item);
  }

  return unique;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function fetchCryptoNews(): Promise<CryptoNewsItem[]> {
  const now = Date.now();
  if (cachedNews && now - cacheTimestamp < CACHE_DURATION) {
    return cachedNews;
  }

  // Fetch all RSS feeds + API sources concurrently
  const rssPromises = RSS_FEEDS.map(async (feed) => {
    try {
      const res = await fetch(feed.url, { next: { revalidate: 180 } });
      if (!res.ok) return [];
      const xml = await res.text();
      const items = parseItems(xml);
      return items.map((item) => ({
        ...item,
        source: item.source || feed.source,
        sourceImg:
          item.sourceImg ||
          SOURCE_LOGOS[item.source] ||
          SOURCE_LOGOS[feed.source] ||
          "",
      }));
    } catch (err) {
      console.error(`[news] RSS fetch failed for ${feed.source}:`, err);
      return [];
    }
  });

  const results = await Promise.allSettled([
    ...rssPromises,
    fetchCoinGeckoNews(),
    fetchCryptoPanicNews(),
  ]);

  const allNews: CryptoNewsItem[] = [];
  for (const result of results) {
    if (result.status === "fulfilled") {
      allNews.push(...result.value);
    }
  }

  // Sort by date descending
  allNews.sort(
    (a, b) =>
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );

  // Deduplicate (fuzzy title + exact URL)
  const dedupedNews = deduplicateNews(allNews);

  if (dedupedNews.length > 0) {
    cachedNews = dedupedNews;
    cacheTimestamp = now;
  }

  return cachedNews ?? [];
}

export async function fetchCryptoNewsByCategory(
  category?: string
): Promise<CryptoNewsItem[]> {
  const allNews = await fetchCryptoNews();
  if (!category || category === "All") return allNews;

  const lowerCat = category.toLowerCase();

  return allNews.filter((item) => {
    // Match against explicit categories
    const categoryMatch = item.categories.some(
      (c) => c.toLowerCase() === lowerCat
    );
    if (categoryMatch) return true;

    // Fallback: check if title or body contains the category keyword
    const titleMatch = item.title.toLowerCase().includes(lowerCat);
    const bodyMatch = item.body.toLowerCase().includes(lowerCat);
    return titleMatch || bodyMatch;
  });
}

/**
 * Returns the latest 5 articles from each source to ensure diversity.
 */
export async function fetchTrendingNews(): Promise<CryptoNewsItem[]> {
  const allNews = await fetchCryptoNews();

  // Group by source
  const bySource: Record<string, CryptoNewsItem[]> = {};
  for (const item of allNews) {
    if (!bySource[item.source]) bySource[item.source] = [];
    bySource[item.source].push(item);
  }

  // Take the latest 5 from each source
  const trending: CryptoNewsItem[] = [];
  Object.keys(bySource).forEach((source) => {
    trending.push(...bySource[source].slice(0, 5));
  });

  // Sort combined result by date
  trending.sort(
    (a, b) =>
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );

  return trending;
}

/**
 * Returns metadata about all configured news sources.
 */
export function getAvailableSources(): NewsSource[] {
  const rssSources: NewsSource[] = RSS_FEEDS.map((feed) => ({
    name: feed.source,
    logo: SOURCE_LOGOS[feed.source] || "",
    type: "rss" as const,
  }));

  const apiSources: NewsSource[] = [
    { name: "CoinGecko", logo: SOURCE_LOGOS["CoinGecko"], type: "api" },
    { name: "CryptoPanic", logo: SOURCE_LOGOS["CryptoPanic"], type: "api" },
  ];

  return [...rssSources, ...apiSources];
}
