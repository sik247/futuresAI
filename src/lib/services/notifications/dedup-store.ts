import prisma from "@/lib/prisma";
import { createHash } from "crypto";

// Postgres-backed dedup for Telegram sends. The previous in-memory `Set`s
// reset on every Vercel cold start, which let the same headlines re-fire to
// the channel multiple times per day. This persists send fingerprints across
// invocations and prunes itself.

const TABLE = `"TelegramSendLog"`;
let schemaReady = false;

async function ensureSchema(): Promise<void> {
  if (schemaReady) return;
  // Idempotent: safe to run on every cold start. Prisma raw is unparameterized
  // here because identifiers can't be bound, but the SQL is static.
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS ${TABLE} (
      "kind" TEXT NOT NULL,
      "hash" TEXT NOT NULL,
      "sentAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY ("kind", "hash")
    )
  `);
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "TelegramSendLog_sentAt_idx"
    ON ${TABLE} ("sentAt")
  `);
  schemaReady = true;
}

export function hashContent(...parts: string[]): string {
  return createHash("sha256").update(parts.join("")).digest("hex").slice(0, 32);
}

export async function wasSent(kind: string, hash: string, withinDays = 7): Promise<boolean> {
  try {
    await ensureSchema();
    const rows = await prisma.$queryRawUnsafe<{ exists: boolean }[]>(
      `SELECT EXISTS(
         SELECT 1 FROM ${TABLE}
         WHERE "kind" = $1 AND "hash" = $2
         AND "sentAt" > NOW() - ($3::int || ' days')::interval
       ) AS "exists"`,
      kind,
      hash,
      withinDays,
    );
    return rows[0]?.exists === true;
  } catch (err) {
    console.error("[dedup-store] wasSent failed:", err);
    return false; // fail-open — better to risk a dup than block all sends
  }
}

export async function markSent(kind: string, hash: string): Promise<void> {
  try {
    await ensureSchema();
    await prisma.$executeRawUnsafe(
      `INSERT INTO ${TABLE} ("kind", "hash", "sentAt")
       VALUES ($1, $2, NOW())
       ON CONFLICT ("kind", "hash") DO UPDATE SET "sentAt" = NOW()`,
      kind,
      hash,
    );
  } catch (err) {
    console.error("[dedup-store] markSent failed:", err);
  }
}

// Filter helper: returns items whose content hash is not yet logged.
export async function filterUnsent<T>(
  kind: string,
  items: T[],
  hasher: (item: T) => string,
  withinDays = 7,
): Promise<T[]> {
  if (items.length === 0) return items;
  const checked = await Promise.all(
    items.map(async (item) => ({ item, seen: await wasSent(kind, hasher(item), withinDays) })),
  );
  return checked.filter((c) => !c.seen).map((c) => c.item);
}

// Cron-friendly cleanup. Call from /api/cron-pulse occasionally to keep the
// table from growing forever — anything older than the dedup window is dead.
export async function pruneOlderThan(days = 14): Promise<number> {
  try {
    await ensureSchema();
    const result = await prisma.$executeRawUnsafe(
      `DELETE FROM ${TABLE} WHERE "sentAt" < NOW() - ($1::int || ' days')::interval`,
      days,
    );
    return Number(result) || 0;
  } catch (err) {
    console.error("[dedup-store] pruneOlderThan failed:", err);
    return 0;
  }
}
