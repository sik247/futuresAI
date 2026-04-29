/**
 * Stable, URL-safe deep-link anchor for a news item.
 *
 * Telegram messages reference an article via the news page's anchor:
 *   https://futuresai.io/ko/news#news-<hash>
 *
 * The article card on /ko/news renders with a matching `id="news-<hash>"`
 * attribute so the browser scrolls the user straight to that article.
 *
 * The hash is derived from the source URL (or title as fallback) using a
 * fast non-crypto FNV-1a, then truncated to 12 base36 chars. We don't need
 * collision resistance — just a short, deterministic, URL-safe token.
 */

// 32-bit FNV-1a — collision-resistant enough for ~thousand news items per
// page. Two passes with different seeds give us a 64-bit equivalent we can
// concat into one base36 token, all without BigInt.
function fnv1a32(input: string, seed: number): number {
  let hash = seed >>> 0;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    // Math.imul keeps it within 32-bit signed; >>> 0 normalizes to unsigned.
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash >>> 0;
}

/**
 * Returns a short URL-safe token (12 base36 chars) for the given news URL.
 * Same input → same token, every time, on server and client.
 */
export function newsAnchorHash(urlOrId: string, fallback?: string): string {
  const seed = (urlOrId && urlOrId.length > 0 ? urlOrId : fallback) ?? "";
  if (!seed) return "x";
  const a = fnv1a32(seed, 0x811c9dc5);
  const b = fnv1a32(seed, 0xdeadbeef);
  return (a.toString(36) + b.toString(36)).padStart(13, "0").slice(0, 12);
}

/**
 * The full DOM `id` we render on each card. Mirrors the fragment used in
 * Telegram links so anchors line up exactly.
 */
export function newsAnchorId(urlOrId: string, fallback?: string): string {
  return `news-${newsAnchorHash(urlOrId, fallback)}`;
}

/**
 * Build the public URL the bot should send. Always points back to our page.
 */
export function newsAnchorUrl(
  urlOrId: string,
  opts?: { lang?: "ko" | "en"; fallback?: string; origin?: string }
): string {
  const lang = opts?.lang ?? "ko";
  const origin = opts?.origin ?? "https://futuresai.io";
  return `${origin}/${lang}/news#${newsAnchorId(urlOrId, opts?.fallback)}`;
}
