// Per-IP burst limiter. In-memory, scoped to one serverless instance —
// not a distributed limit, but enough to stop a single-source scraper or
// runaway script from hammering an expensive endpoint inside one warm lambda.
// For cross-instance limits, swap the Map for Upstash Redis later.

const HITS = new Map<string, number[]>();
const MAX_KEYS = 5000;

export function getClientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }
  return (
    req.headers.get("x-real-ip") ||
    req.headers.get("cf-connecting-ip") ||
    "unknown"
  );
}

export interface IpRateOptions {
  limit: number;
  windowSeconds: number;
}

export interface IpRateResult {
  allowed: boolean;
  retryAfterSeconds: number;
  remaining: number;
}

export function checkIpRate(ip: string, opts: IpRateOptions): IpRateResult {
  const now = Date.now();
  const windowMs = opts.windowSeconds * 1000;
  const cutoff = now - windowMs;

  if (HITS.size > MAX_KEYS) {
    HITS.forEach((ts: number[], k: string) => {
      const fresh = ts.filter((t: number) => t > cutoff);
      if (fresh.length === 0) HITS.delete(k);
      else HITS.set(k, fresh);
    });
  }

  const arr = (HITS.get(ip) || []).filter((t: number) => t > cutoff);
  if (arr.length >= opts.limit) {
    const oldest = arr[0];
    const retryAfterSeconds = Math.max(1, Math.ceil((oldest + windowMs - now) / 1000));
    HITS.set(ip, arr);
    return { allowed: false, retryAfterSeconds, remaining: 0 };
  }
  arr.push(now);
  HITS.set(ip, arr);
  return { allowed: true, retryAfterSeconds: 0, remaining: opts.limit - arr.length };
}
