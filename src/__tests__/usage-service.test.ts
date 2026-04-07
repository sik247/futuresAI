import { describe, it, expect } from "vitest";
import { getUserTier } from "@/lib/services/usage.service";

describe("getUserTier", () => {
  it("returns FREE for non-premium user with no credits", () => {
    expect(getUserTier(false, 0)).toBe("FREE");
  });

  it("returns FREE for non-premium user with small credits", () => {
    expect(getUserTier(false, 10)).toBe("FREE");
  });

  it("returns BASIC for non-premium user with credits >= 25", () => {
    expect(getUserTier(false, 25)).toBe("BASIC");
    expect(getUserTier(false, 50)).toBe("BASIC");
  });

  it("returns BASIC for isPremium with low credits", () => {
    expect(getUserTier(true, 0)).toBe("BASIC");
    expect(getUserTier(true, 25)).toBe("BASIC");
  });

  it("returns PREMIUM for isPremium with credits >= 99", () => {
    expect(getUserTier(true, 99)).toBe("PREMIUM");
    expect(getUserTier(true, 200)).toBe("PREMIUM");
  });

  it("returns BASIC for non-premium with credits between 25 and 98", () => {
    expect(getUserTier(false, 30)).toBe("BASIC");
    expect(getUserTier(false, 98)).toBe("BASIC");
  });
});
