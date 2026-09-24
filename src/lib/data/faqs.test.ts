import { describe, expect, it } from "vitest";
import { mapFaqRow, truncateForLog, type FaqRow } from "./faqs";

describe("mapFaqRow", () => {
  it("converts a DB row to the app-facing FaqRecord", () => {
    const row: FaqRow = {
      id: "faq_1",
      question: "お墓じまいの金額・相場は？",
      answer: "20万円〜60万円が目安です。",
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
    };
    expect(mapFaqRow(row)).toEqual({
      id: "faq_1",
      question: "お墓じまいの金額・相場は？",
      answer: "20万円〜60万円が目安です。",
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-01T00:00:00Z",
    });
  });
});

describe("truncateForLog", () => {
  it("leaves short text untouched", () => {
    expect(truncateForLog("短い質問")).toBe("短い質問");
  });

  it("truncates long text and appends an ellipsis", () => {
    const long = "あ".repeat(30);
    const result = truncateForLog(long);
    expect(result.endsWith("…")).toBe(true);
    expect(result.length).toBe(21);
  });
});
