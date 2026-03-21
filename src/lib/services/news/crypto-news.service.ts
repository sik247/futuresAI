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

let cachedNews: CryptoNewsItem[] | null = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

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
    const mediaMatch = itemXml.match(/url="([^"]+\.(jpg|jpeg|png|webp|gif)[^"]*)"/i);
    if (mediaMatch) imageUrl = mediaMatch[1];

    // Extract categories
    const cats: string[] = [];
    const catRegex = /<category[^>]*>(?:<!\[CDATA\[)?([^<\]]+)(?:\]\]>)?<\/category>/g;
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
        sourceImg: "",
        url: link,
        imageUrl,
        publishedAt: pubDate ? new Date(pubDate) : new Date(),
        categories: cats.length > 0 ? cats : ["Crypto"],
      });
    }
  }

  return items;
}

const RSS_FEEDS = [
  { url: "https://cointelegraph.com/rss", source: "CoinTelegraph" },
  { url: "https://www.coindesk.com/arc/outboundfeeds/rss/", source: "CoinDesk" },
];

export async function fetchCryptoNews(): Promise<CryptoNewsItem[]> {
  const now = Date.now();
  if (cachedNews && now - cacheTimestamp < CACHE_DURATION) {
    return cachedNews;
  }

  const results = await Promise.allSettled(
    RSS_FEEDS.map(async (feed) => {
      const res = await fetch(feed.url, { next: { revalidate: 300 } });
      if (!res.ok) return [];
      const xml = await res.text();
      const items = parseItems(xml);
      return items.map((item) => ({
        ...item,
        source: item.source || feed.source,
      }));
    })
  );

  const allNews: CryptoNewsItem[] = [];
  for (const result of results) {
    if (result.status === "fulfilled") {
      allNews.push(...result.value);
    }
  }

  // Sort by date descending
  allNews.sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );

  if (allNews.length > 0) {
    cachedNews = allNews;
    cacheTimestamp = now;
  }

  return cachedNews ?? [];
}

export async function fetchCryptoNewsByCategory(
  category?: string
): Promise<CryptoNewsItem[]> {
  const allNews = await fetchCryptoNews();
  if (!category || category === "All") return allNews;
  return allNews.filter((item) =>
    item.categories.some(
      (c) => c.toLowerCase() === category.toLowerCase()
    )
  );
}
