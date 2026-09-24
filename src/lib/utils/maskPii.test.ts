import { describe, expect, it } from "vitest";
import { maskPii } from "./maskPii";

describe("maskPii", () => {
  it("masks phone numbers", () => {
    const result = maskPii("電話番号は080-1234-5678です。折り返しください。");
    expect(result).not.toContain("080-1234-5678");
    expect(result).toContain("電話番号を伏せました");
  });

  it("masks email addresses", () => {
    const result = maskPii("メールはtest@example.comまで。");
    expect(result).not.toContain("test@example.com");
    expect(result).toContain("メールアドレスを伏せました");
  });

  it("masks both when present", () => {
    const result = maskPii("080-1234-5678 / test@example.com");
    expect(result).not.toContain("080-1234-5678");
    expect(result).not.toContain("test@example.com");
  });

  it("leaves ordinary text untouched", () => {
    const text = "お墓じまいの金額・相場は？";
    expect(maskPii(text)).toBe(text);
  });
});
