/**
 * Simple in-memory cache for AI-generated content.
 * Prevents hitting Gemini rate limits on repeated calls.
 * Cache entries expire after TTL (default 30 minutes).
 */

const cache = new Map<string, { data: string; timestamp: number }>();
const DEFAULT_TTL = 30 * 60 * 1000; // 30 minutes

export function getCached(key: string): string | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > DEFAULT_TTL) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

export function setCache(key: string, data: string, ttl = DEFAULT_TTL): void {
  // Evict old entries if cache gets large
  if (cache.size > 200) {
    const now = Date.now();
    const keys = Array.from(cache.keys());
    keys.forEach((k) => {
      const v = cache.get(k);
      if (v && now - v.timestamp > ttl) cache.delete(k);
    });
  }
  cache.set(key, { data, timestamp: Date.now() });
}

/**
 * Wrapper: check cache first, call generator if miss.
 * Use a stable key based on input params.
 */
export async function cachedAI(
  key: string,
  generator: () => Promise<string>,
  ttl = DEFAULT_TTL
): Promise<string> {
  const cached = getCached(key);
  if (cached) return cached;

  try {
    const result = await generator();
    if (result) setCache(key, result, ttl);
    return result;
  } catch (error) {
    // Return empty on rate limit — don't crash
    console.error(`[ai-cache] ${key} failed:`, (error as Error)?.message || error);
    return "";
  }
}
