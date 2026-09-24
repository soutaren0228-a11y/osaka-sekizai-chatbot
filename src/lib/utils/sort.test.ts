import { describe, expect, it } from "vitest";
import { compareDesc } from "./sort";

describe("compareDesc", () => {
  it("sorts newer ISO timestamps first", () => {
    const dates = ["2026-01-01T00:00:00Z", "2026-03-01T00:00:00Z", "2026-02-01T00:00:00Z"];
    expect([...dates].sort(compareDesc)).toEqual([
      "2026-03-01T00:00:00Z",
      "2026-02-01T00:00:00Z",
      "2026-01-01T00:00:00Z",
    ]);
  });

  it("keeps the original order stable when timestamps are equal", () => {
    const items = [
      { id: "a", at: "2026-01-01T00:00:00Z" },
      { id: "b", at: "2026-01-01T00:00:00Z" },
      { id: "c", at: "2026-01-01T00:00:00Z" },
    ];
    const sorted = [...items].sort((a, b) => compareDesc(a.at, b.at));
    expect(sorted.map((i) => i.id)).toEqual(["a", "b", "c"]);
  });
});
