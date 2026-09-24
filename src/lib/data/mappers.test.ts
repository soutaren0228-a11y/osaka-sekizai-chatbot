import { describe, expect, it } from "vitest";
import { mapSourceRow, type SourceRow } from "./mappers";

describe("mapSourceRow", () => {
  it("converts a DB row (snake_case) to the app-facing SourceRecord (camelCase)", () => {
    const row: SourceRow = {
      id: "src_1",
      type: "url",
      name: "大阪石材 コーポレートサイト",
      detail: "https://www.osaka-sekizai.jp/",
      size_label: "42ページ・約58,000文字",
      status: "ready",
      error_message: null,
      active: true,
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-02T00:00:00Z",
    };

    expect(mapSourceRow(row)).toEqual({
      id: "src_1",
      type: "url",
      name: "大阪石材 コーポレートサイト",
      detail: "https://www.osaka-sekizai.jp/",
      sizeLabel: "42ページ・約58,000文字",
      status: "ready",
      errorMessage: undefined,
      active: true,
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-02T00:00:00Z",
    });
  });

  it("converts null error_message to undefined, and passes through a real message", () => {
    const base: SourceRow = {
      id: "src_2",
      type: "pdf",
      name: "価格表",
      detail: "price.pdf",
      size_label: "―",
      status: "error",
      error_message: "取り込みに失敗しました",
      active: false,
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
    };
    expect(mapSourceRow(base).errorMessage).toBe("取り込みに失敗しました");
    expect(mapSourceRow({ ...base, error_message: null }).errorMessage).toBeUndefined();
  });
});
