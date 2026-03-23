// Korean translation service
// Uses Google Translate's free endpoint (no API key required)
// Includes rate limiting, caching, and smart text chunking

export interface TranslatedContent {
  original: string;
  translated: string;
  sourceLang: string;
  targetLang: string;
  translatedAt: Date;
}

// ── Translation cache ────────────────────────────────────────────────

type CachedTranslation = TranslatedContent & { cachedAt: number };

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
const translationCache = new Map<string, CachedTranslation>();

function getCacheKey(text: string, from: string, to: string): string {
  return `${from}:${to}:${text}`;
}

function getCachedTranslation(text: string, from: string, to: string): TranslatedContent | null {
  const key = getCacheKey(text, from, to);
  const cached = translationCache.get(key);
  if (!cached) return null;

  if (Date.now() - cached.cachedAt > CACHE_TTL_MS) {
    translationCache.delete(key);
    return null;
  }

  return {
    original: cached.original,
    translated: cached.translated,
    sourceLang: cached.sourceLang,
    targetLang: cached.targetLang,
    translatedAt: cached.translatedAt,
  };
}

function setCachedTranslation(content: TranslatedContent, from: string, to: string): void {
  const key = getCacheKey(content.original, from, to);
  translationCache.set(key, {
    ...content,
    cachedAt: Date.now(),
  });

  // Evict old entries if cache grows too large
  if (translationCache.size > 2000) {
    const entries = Array.from(translationCache.entries());
    entries.sort((a, b) => a[1].cachedAt - b[1].cachedAt);
    const toRemove = entries.slice(0, entries.length - 1500);
    for (const [key] of toRemove) {
      translationCache.delete(key);
    }
  }
}

// ── Rate limiter ─────────────────────────────────────────────────────
// Max 5 requests per second with queue

type QueuedRequest = {
  execute: () => Promise<void>;
  resolve: () => void;
  reject: (err: Error) => void;
};

const MAX_REQUESTS_PER_SECOND = 5;
const requestTimestamps: number[] = [];
const requestQueue: QueuedRequest[] = [];
let isProcessingQueue = false;

async function processQueue(): Promise<void> {
  if (isProcessingQueue) return;
  isProcessingQueue = true;

  while (requestQueue.length > 0) {
    const now = Date.now();
    // Remove timestamps older than 1 second
    while (requestTimestamps.length > 0 && now - requestTimestamps[0] > 1000) {
      requestTimestamps.shift();
    }

    if (requestTimestamps.length >= MAX_REQUESTS_PER_SECOND) {
      // Wait until the oldest request in the window expires
      const waitTime = 1000 - (now - requestTimestamps[0]) + 10;
      await new Promise((resolve) => setTimeout(resolve, waitTime));
      continue;
    }

    const request = requestQueue.shift();
    if (!request) break;

    requestTimestamps.push(Date.now());
    try {
      await request.execute();
      request.resolve();
    } catch (err) {
      request.reject(err instanceof Error ? err : new Error(String(err)));
    }
  }

  isProcessingQueue = false;
}

function enqueueRequest(execute: () => Promise<void>): Promise<void> {
  return new Promise((resolve, reject) => {
    requestQueue.push({ execute, resolve, reject });
    processQueue();
  });
}

// ── Core translation function ────────────────────────────────────────

async function callGoogleTranslate(text: string, from: string, to: string): Promise<string> {
  const encodedText = encodeURIComponent(text);
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${from}&tl=${to}&dt=t&q=${encodedText}`;

  const res = await fetch(url, {
    signal: AbortSignal.timeout(10000),
    headers: {
      'User-Agent': 'CryptoX/1.0',
    },
  });

  if (!res.ok) {
    throw new Error(`Google Translate returned HTTP ${res.status}`);
  }

  // Response is a nested array structure
  // response[0] contains translation segments, each segment[0] is the translated text
  const data = await res.json();

  if (!Array.isArray(data) || !Array.isArray(data[0])) {
    throw new Error('Unexpected response format from Google Translate');
  }

  const translatedParts: string[] = [];
  for (const segment of data[0]) {
    if (Array.isArray(segment) && typeof segment[0] === 'string') {
      translatedParts.push(segment[0]);
    }
  }

  return translatedParts.join('');
}

// ── Smart text chunking ─────────────────────────────────────────────

const MAX_CHUNK_LENGTH = 5000;

function splitIntoChunks(text: string): string[] {
  if (text.length <= MAX_CHUNK_LENGTH) {
    return [text];
  }

  const chunks: string[] = [];
  // Split by sentences (period, exclamation, question mark followed by space or newline)
  const sentences = text.split(/(?<=[.!?])\s+/);
  let currentChunk = '';

  for (const sentence of sentences) {
    if (sentence.length > MAX_CHUNK_LENGTH) {
      // If a single sentence is too long, split by newlines or at max length
      if (currentChunk) {
        chunks.push(currentChunk.trim());
        currentChunk = '';
      }
      const subParts = sentence.split(/\n+/);
      for (const part of subParts) {
        if (part.length <= MAX_CHUNK_LENGTH) {
          chunks.push(part.trim());
        } else {
          // Hard split at max length as last resort
          for (let i = 0; i < part.length; i += MAX_CHUNK_LENGTH) {
            chunks.push(part.slice(i, i + MAX_CHUNK_LENGTH).trim());
          }
        }
      }
      continue;
    }

    if (currentChunk.length + sentence.length + 1 > MAX_CHUNK_LENGTH) {
      chunks.push(currentChunk.trim());
      currentChunk = sentence;
    } else {
      currentChunk = currentChunk ? `${currentChunk} ${sentence}` : sentence;
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks.filter((c) => c.length > 0);
}

// ── Public API ───────────────────────────────────────────────────────

/**
 * Translate a single text string.
 * Uses cache and rate limiting. Falls back to original text on error.
 * @param text - The text to translate
 * @param from - Source language code (default: 'en')
 * @param to - Target language code (default: 'ko')
 */
export async function translateText(
  text: string,
  from: string = 'en',
  to: string = 'ko'
): Promise<TranslatedContent> {
  if (!text || text.trim().length === 0) {
    return {
      original: text,
      translated: text,
      sourceLang: from,
      targetLang: to,
      translatedAt: new Date(),
    };
  }

  // Check cache first
  const cached = getCachedTranslation(text, from, to);
  if (cached) return cached;

  try {
    const chunks = splitIntoChunks(text);
    const translatedChunks: string[] = [];

    for (const chunk of chunks) {
      // Check if individual chunk is cached
      const cachedChunk = getCachedTranslation(chunk, from, to);
      if (cachedChunk) {
        translatedChunks.push(cachedChunk.translated);
        continue;
      }

      let translatedText = '';
      await enqueueRequest(async () => {
        translatedText = await callGoogleTranslate(chunk, from, to);
      });

      translatedChunks.push(translatedText);

      // Cache the individual chunk
      if (chunks.length > 1) {
        setCachedTranslation(
          {
            original: chunk,
            translated: translatedText,
            sourceLang: from,
            targetLang: to,
            translatedAt: new Date(),
          },
          from,
          to
        );
      }
    }

    const fullTranslation = translatedChunks.join(' ');
    const result: TranslatedContent = {
      original: text,
      translated: fullTranslation,
      sourceLang: from,
      targetLang: to,
      translatedAt: new Date(),
    };

    // Cache the full result
    setCachedTranslation(result, from, to);
    return result;
  } catch (err) {
    console.log(
      `[translator] Translation failed, returning original: ${err instanceof Error ? err.message : 'unknown'}`
    );
    // Fallback: return original text
    return {
      original: text,
      translated: text,
      sourceLang: from,
      targetLang: to,
      translatedAt: new Date(),
    };
  }
}

/**
 * Translate an array of texts with rate limiting between each request.
 * @param texts - Array of texts to translate
 * @param from - Source language code (default: 'en')
 * @param to - Target language code (default: 'ko')
 */
export async function translateBatch(
  texts: string[],
  from: string = 'en',
  to: string = 'ko'
): Promise<TranslatedContent[]> {
  const results: TranslatedContent[] = [];

  for (const text of texts) {
    const result = await translateText(text, from, to);
    results.push(result);
  }

  return results;
}

/**
 * Force-clear the translation cache.
 */
export function clearTranslationCache(): void {
  translationCache.clear();
}
