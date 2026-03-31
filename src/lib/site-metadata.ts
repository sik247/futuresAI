/**
 * Canonical site URL for Open Graph / Twitter image resolution (metadataBase).
 */
export function resolveMetadataBase(): URL {
  try {
    const url = process.env.NEXT_PUBLIC_APP_URL;
    if (url) return new URL(url);
  } catch {
    /* invalid NEXT_PUBLIC_APP_URL */
  }
  if (process.env.VERCEL_URL) {
    return new URL(`https://${process.env.VERCEL_URL}`);
  }
  return new URL("https://futuresai.co");
}
