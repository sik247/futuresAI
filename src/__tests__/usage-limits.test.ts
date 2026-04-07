import { describe, it, expect } from "vitest";
import { USAGE_LIMITS } from "@/lib/constants/usage-limits";

describe("Usage Limits", () => {
  it("has correct free tier limits", () => {
    expect(USAGE_LIMITS.FREE.chat).toBe(5);
    expect(USAGE_LIMITS.FREE.chartAnalysis).toBe(3);
  });

  it("has correct basic tier limits", () => {
    expect(USAGE_LIMITS.BASIC.chat).toBe(25);
    expect(USAGE_LIMITS.BASIC.chartAnalysis).toBe(10);
  });

  it("has correct premium tier limits", () => {
    expect(USAGE_LIMITS.PREMIUM.chat).toBe(100);
    expect(USAGE_LIMITS.PREMIUM.chartAnalysis).toBe(30);
  });

  it("premium > basic > free for all limits", () => {
    expect(USAGE_LIMITS.PREMIUM.chat).toBeGreaterThan(USAGE_LIMITS.BASIC.chat);
    expect(USAGE_LIMITS.BASIC.chat).toBeGreaterThan(USAGE_LIMITS.FREE.chat);
    expect(USAGE_LIMITS.PREMIUM.chartAnalysis).toBeGreaterThan(USAGE_LIMITS.BASIC.chartAnalysis);
    expect(USAGE_LIMITS.BASIC.chartAnalysis).toBeGreaterThan(USAGE_LIMITS.FREE.chartAnalysis);
  });
});
