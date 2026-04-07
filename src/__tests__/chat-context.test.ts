import { describe, it, expect } from "vitest";
import { extractTicker } from "@/lib/services/chat/chat-context.service";

describe("extractTicker", () => {
  it("extracts BTC from message", () => {
    const result = extractTicker("What is BTC price?", "crypto");
    expect(result).toEqual({ ticker: "BTCUSDT", exchange: "BINANCE" });
  });

  it("extracts ethereum/ETH", () => {
    expect(extractTicker("analyze ethereum", "crypto")).toEqual({ ticker: "ETHUSDT", exchange: "BINANCE" });
    expect(extractTicker("ETH price", "crypto")).toEqual({ ticker: "ETHUSDT", exchange: "BINANCE" });
  });

  it("extracts solana/SOL", () => {
    expect(extractTicker("solana trend", "crypto")).toEqual({ ticker: "SOLUSDT", exchange: "BINANCE" });
  });

  it("extracts $SYMBOL format", () => {
    expect(extractTicker("$DOGE to the moon", "crypto")).toEqual({ ticker: "DOGEUSDT", exchange: "BINANCE" });
  });

  it("extracts SYMBOL/USDT format", () => {
    expect(extractTicker("BNB/USDT", "crypto")).toEqual({ ticker: "BNBUSDT", exchange: "BINANCE" });
  });

  it("returns null for no ticker", () => {
    expect(extractTicker("hello world", "crypto")).toBeNull();
    expect(extractTicker("what is the market?", "crypto")).toBeNull();
  });

  it("handles Korean messages with bitcoin", () => {
    const result = extractTicker("bitcoin 분석해줘", "crypto");
    expect(result).toEqual({ ticker: "BTCUSDT", exchange: "BINANCE" });
  });

  it("extracts newer tokens", () => {
    expect(extractTicker("what about PEPE?", "crypto")).toEqual({ ticker: "PEPEUSDT", exchange: "BINANCE" });
    expect(extractTicker("sui analysis", "crypto")).toEqual({ ticker: "SUIUSDT", exchange: "BINANCE" });
  });
});
