import { describe, it, expect } from "vitest";
import { QUANT_BLOG_POSTS } from "@/lib/data/quant-blog-posts";

describe("Quant Blog Posts", () => {
  it("has at least 30 posts", () => {
    expect(QUANT_BLOG_POSTS.length).toBeGreaterThanOrEqual(30);
  });

  it("all posts have required fields", () => {
    for (const post of QUANT_BLOG_POSTS) {
      expect(post.slug).toBeTruthy();
      expect(post.title).toBeTruthy();
      expect(post.titleKo).toBeTruthy();
      expect(post.content).toBeTruthy();
      expect(post.contentKo).toBeTruthy();
      expect(post.symbol).toBeTruthy();
      expect(["LONG", "SHORT", "NEUTRAL"]).toContain(post.direction);
      expect(post.chartImage).toBeTruthy();
      expect(typeof post.price).toBe("number");
      expect(typeof post.rsi).toBe("number");
      expect(post.tradeSetup).toBeDefined();
      expect(Array.isArray(post.supportLevels)).toBe(true);
      expect(Array.isArray(post.resistanceLevels)).toBe(true);
    }
  });

  it("slugs are unique", () => {
    const slugs = QUANT_BLOG_POSTS.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("trade setups have valid risk/reward", () => {
    for (const post of QUANT_BLOG_POSTS) {
      const { entry, stopLoss, takeProfit } = post.tradeSetup;
      if (entry > 0) {
        expect(typeof stopLoss).toBe("number");
        expect(typeof takeProfit).toBe("number");
        expect(post.tradeSetup.riskReward).toBeTruthy();
      }
    }
  });

  it("RSI values are between 0 and 100", () => {
    for (const post of QUANT_BLOG_POSTS) {
      expect(post.rsi).toBeGreaterThanOrEqual(0);
      expect(post.rsi).toBeLessThanOrEqual(100);
    }
  });
});
