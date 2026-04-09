// Rolling window rate limits (like Claude/GPT)
// Messages allowed per rolling window period
export const RATE_LIMITS = {
  FREE: {
    chat: 2,          // 2 msgs then upgrade prompt
    chartAnalysis: 2,
    windowHours: 3,   // 3-hour rolling window
  },
  BASIC: {
    chat: 20,
    chartAnalysis: 15,
    windowHours: 3,
  },
  PREMIUM: {
    chat: 60,
    chartAnalysis: 30,
    windowHours: 3,
  },
} as const;

// Legacy export for backward compatibility
export const USAGE_LIMITS = {
  FREE: { chartAnalysis: 2, chat: 2 },
  BASIC: { chartAnalysis: 15, chat: 20 },
  PREMIUM: { chartAnalysis: 30, chat: 60 },
} as const;
