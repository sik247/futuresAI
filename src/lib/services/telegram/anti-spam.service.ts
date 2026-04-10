import type { TelegramMessage } from "./moderation.service";

/* ================================================================== */
/*  Pure analysis helpers                                              */
/* ================================================================== */

const URL_RE = /https?:\/\/[^\s]+|t\.me\/[^\s]+|\b[a-z0-9-]+\.(com|io|xyz|org|net|app|finance|exchange|wtf|click|link)\b/gi;

export function countLinks(text: string): number {
  const matches = text.match(URL_RE);
  return matches ? matches.length : 0;
}

export function capsRatio(text: string): number {
  const letters = text.replace(/[^a-zA-Z]/g, "");
  if (letters.length < 5) return 0;
  const upper = letters.replace(/[^A-Z]/g, "");
  return upper.length / letters.length;
}

const SCAM_PATTERNS: { pattern: RegExp; label: string }[] = [
  { pattern: /\bfree\s+(airdrop|giveaway|usdt|btc)\b/i, label: "free-giveaway" },
  { pattern: /\bclaim\s+(your|the)\s+(airdrop|reward|token)/i, label: "claim-airdrop" },
  { pattern: /\bdm\s+me\b/i, label: "dm-me" },
  { pattern: /\b(private|paid|vip)\s+(signal|group|channel)\b/i, label: "private-signal" },
  { pattern: /guaranteed\s+profit/i, label: "guaranteed-profit" },
  { pattern: /\b(send|deposit)\s+\d+\s+(usdt|btc|eth)\s+(and|to)\s+(get|receive)/i, label: "send-to-receive" },
  { pattern: /\bdouble\s+your\s+(usdt|btc|eth|money|crypto)\b/i, label: "double-your-money" },
  { pattern: /\b(hack|crack|leak)\s+(wallet|seed|private\s+key)\b/i, label: "wallet-hack" },
  { pattern: /telegram\.me\/\+/i, label: "invite-link" },
  { pattern: /\bt\.me\/\+/i, label: "invite-link" },
];

export function matchesScamPattern(text: string): string | null {
  for (const { pattern, label } of SCAM_PATTERNS) {
    if (pattern.test(text)) return label;
  }
  return null;
}

/* ================================================================== */
/*  Verdict                                                            */
/* ================================================================== */

export type AutoDeleteVerdict = { delete: boolean; reason?: string };

export function shouldAutoDelete(message: TelegramMessage): AutoDeleteVerdict {
  const text = message.text || "";
  if (!text) return { delete: false };

  // Rule 1: too many links
  if (countLinks(text) > 3) {
    return { delete: true, reason: "too-many-links" };
  }

  // Rule 2: excessive caps (only for long messages)
  if (text.length > 20 && capsRatio(text) > 0.7) {
    return { delete: true, reason: "excessive-caps" };
  }

  // Rule 3: scam pattern match
  const scam = matchesScamPattern(text);
  if (scam) {
    return { delete: true, reason: `scam:${scam}` };
  }

  return { delete: false };
}

/* ================================================================== */
/*  Strike tracking (3 auto-deletes in 5 min → auto-mute)              */
/* ================================================================== */

type StrikeEntry = { count: number; firstAt: number };
const strikes = new Map<number, StrikeEntry>();
const STRIKE_WINDOW_MS = 5 * 60 * 1000;
const STRIKE_THRESHOLD = 3;

export function recordStrike(userId: number): {
  strikeCount: number;
  shouldMute: boolean;
} {
  const now = Date.now();
  const existing = strikes.get(userId);

  if (!existing || now - existing.firstAt > STRIKE_WINDOW_MS) {
    strikes.set(userId, { count: 1, firstAt: now });
    return { strikeCount: 1, shouldMute: false };
  }

  existing.count += 1;
  if (existing.count >= STRIKE_THRESHOLD) {
    strikes.delete(userId);
    return { strikeCount: STRIKE_THRESHOLD, shouldMute: true };
  }

  return { strikeCount: existing.count, shouldMute: false };
}

export function clearStrikes(userId: number) {
  strikes.delete(userId);
}
