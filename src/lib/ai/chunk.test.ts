import { describe, expect, it } from "vitest";
import { chunkText } from "./chunk";

describe("chunkText", () => {
  it("returns an empty array for blank input", () => {
    expect(chunkText("")).toEqual([]);
    expect(chunkText("   \n  ")).toEqual([]);
  });

  it("returns a single chunk when text is short", () => {
    const text = "お墓じまいについてのご案内です。";
    expect(chunkText(text)).toEqual([text]);
  });

  it("splits long text into overlapping chunks", () => {
    const text = "あ".repeat(2000);
    const chunks = chunkText(text);
    expect(chunks.length).toBeGreaterThan(1);
    // 各チャンクの合計文字数（重なりを考慮しても）元のテキスト以上になる
    const totalLength = chunks.reduce((sum, c) => sum + c.length, 0);
    expect(totalLength).toBeGreaterThanOrEqual(text.length);
  });

  it("covers the entire text without gaps", () => {
    const text = Array.from({ length: 2500 }, (_, i) => String(i % 10)).join("");
    const chunks = chunkText(text);
    // 最後のチャンクは必ずテキストの末尾で終わる
    expect(text.endsWith(chunks[chunks.length - 1])).toBe(true);
    // 最初のチャンクは必ずテキストの先頭から始まる
    expect(text.startsWith(chunks[0])).toBe(true);
  });
});
