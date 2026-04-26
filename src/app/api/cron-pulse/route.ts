import { NextRequest, NextResponse } from "next/server";
import {
  sendFastNewsFlash,
  sendHourlyNewsAlert,
  sendQuickSignals,
  sendTweetAlert,
} from "@/lib/services/notifications/telegram-group.service";
import { pruneOlderThan } from "@/lib/services/notifications/dedup-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Single hourly dispatcher that replaces ~37 individual cron entries:
//   cron-news-alert (12), cron-tweet-alert (7), cron-fast-news (12), cron-quick-signals (6)
// Vercel Pro caps cron jobs at 40 per project; this collapses Telegram-channel
// fan-out so we stay well under that ceiling and the schedule stays in one place.
//
// Schedule: */30 * * * * (every 30 min). Each invocation reads the UTC clock
// and runs whichever senders match the current slot. Persistent dedup
// (TelegramSendLog) handles repeat protection across cold starts and overlap.

type Task = {
  name: string;
  // matches if utcHour is in the list (when minute matches `atMinute`).
  hours: number[];
  atMinute: 0 | 30;
  run: () => Promise<unknown>;
};

const TASKS: Task[] = [
  {
    name: "news-alert",
    // even hours UTC, on the hour — matches the old hourly-news cadence
    hours: [22, 0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20],
    atMinute: 0,
    run: () => sendHourlyNewsAlert(),
  },
  {
    name: "fast-news",
    // odd hours UTC, on the hour — interleaved with news-alert so we never
    // collide on the same minute. Dedup also covers hourly-alert overlap.
    hours: [1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23],
    atMinute: 0,
    run: () => sendFastNewsFlash(),
  },
  {
    name: "quick-signals",
    hours: [0, 4, 8, 12, 16, 20],
    atMinute: 30,
    run: () => sendQuickSignals(),
  },
  {
    name: "tweet-alert",
    hours: [23, 2, 5, 8, 11, 14, 17],
    atMinute: 30,
    run: () => sendTweetAlert(),
  },
];

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const utcHour = now.getUTCHours();
  const utcMinute = now.getUTCMinutes();
  // Bucket to nearest 30-minute slot. Vercel cron can fire a few seconds
  // off-the-hour; floor to 30-min granularity so we don't miss a slot.
  const slotMinute: 0 | 30 = utcMinute < 15 || utcMinute >= 45 ? 0 : 30;

  const due = TASKS.filter((t) => t.atMinute === slotMinute && t.hours.includes(utcHour));

  // Run sequentially so a slow Gemini call doesn't compound into a 60s
  // timeout cliff. Each individual sender already self-limits.
  const results: Record<string, unknown> = {};
  for (const task of due) {
    try {
      const out = await task.run();
      results[task.name] = { ok: true, out };
    } catch (err) {
      results[task.name] = { ok: false, error: err instanceof Error ? err.message : String(err) };
    }
  }

  // Cheap housekeeping once a day at 03:00 UTC.
  if (utcHour === 3 && slotMinute === 0) {
    try {
      const pruned = await pruneOlderThan(14);
      results._prune = { ok: true, deleted: pruned };
    } catch (err) {
      results._prune = { ok: false, error: err instanceof Error ? err.message : String(err) };
    }
  }

  return NextResponse.json({
    ok: true,
    type: "pulse",
    utc: now.toISOString(),
    slot: { hour: utcHour, minute: slotMinute },
    ran: due.map((t) => t.name),
    results,
  });
}
