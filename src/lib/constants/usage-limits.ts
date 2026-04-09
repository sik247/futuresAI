export const USAGE_LIMITS = {
  FREE: {
    chartAnalysis: 1,
    chat: 1,
  },
  BASIC: {
    chartAnalysis: 10,
    chat: 25,
  },
  PREMIUM: {
    chartAnalysis: 30,
    chat: 100,
  },
} as const;
