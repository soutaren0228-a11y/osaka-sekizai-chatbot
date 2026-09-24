import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { estimateCostYen } from "./pricing";

describe("estimateCostYen", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env.ANTHROPIC_INPUT_PRICE_PER_MTOK_USD = "1";
    process.env.ANTHROPIC_OUTPUT_PRICE_PER_MTOK_USD = "5";
    process.env.USD_TO_JPY_RATE = "150";
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("computes cost proportional to token usage and configured prices", () => {
    // 1,000,000 input tokens @ $1/M + 1,000,000 output tokens @ $5/M = $6 -> ¥900
    const cost = estimateCostYen(1_000_000, 1_000_000);
    expect(cost).toBe(900);
  });

  it("returns 0 for no usage", () => {
    expect(estimateCostYen(0, 0)).toBe(0);
  });

  it("rounds to the nearest yen", () => {
    const cost = estimateCostYen(1234, 5678);
    expect(Number.isInteger(cost)).toBe(true);
  });
});
