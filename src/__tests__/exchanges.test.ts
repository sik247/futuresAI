import { describe, it, expect } from "vitest";
import { EXCHANGES } from "@/lib/data/exchanges";

describe("Exchange Data", () => {
  it("has at least 6 exchanges", () => {
    expect(EXCHANGES.length).toBeGreaterThanOrEqual(6);
  });

  it("all exchanges have required fields", () => {
    for (const ex of EXCHANGES) {
      expect(ex.id).toBeTruthy();
      expect(ex.name).toBeTruthy();
      expect(ex.logo).toBeTruthy();
      expect(typeof ex.makerFee).toBe("number");
      expect(typeof ex.takerFee).toBe("number");
      expect(typeof ex.paybackRate).toBe("number");
      expect(ex.referralLink).toBeTruthy();
    }
  });

  it("includes EdgeX as DEX", () => {
    const edgex = EXCHANGES.find((e) => e.id === "edgex");
    expect(edgex).toBeDefined();
    expect(edgex!.paybackRate).toBe(0);
    expect(edgex!.features).toContain("DEX");
    expect(edgex!.referralLink).toContain("FUTURESAI");
  });

  it("all referral links are valid URLs", () => {
    for (const ex of EXCHANGES) {
      if (ex.referralLink) {
        expect(ex.referralLink).toMatch(/^https?:\/\//);
      }
    }
  });

  it("payback rates are between 0 and 1", () => {
    for (const ex of EXCHANGES) {
      expect(ex.paybackRate).toBeGreaterThanOrEqual(0);
      expect(ex.paybackRate).toBeLessThanOrEqual(1);
    }
  });
});
