export const USAGE_LIMITS = {
  FREE: {
    chartAnalysis: 3,
    chat: 5,
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
