import { describe, expect, it } from "vitest";
import { cosineSimilarity, topKBySimilarity } from "./similarity";

describe("cosineSimilarity", () => {
  it("returns 1 for identical vectors", () => {
    expect(cosineSimilarity([1, 2, 3], [1, 2, 3])).toBeCloseTo(1);
  });

  it("returns 0 for orthogonal vectors", () => {
    expect(cosineSimilarity([1, 0], [0, 1])).toBeCloseTo(0);
  });

  it("returns -1 for opposite vectors", () => {
    expect(cosineSimilarity([1, 0], [-1, 0])).toBeCloseTo(-1);
  });

  it("returns 0 when either vector is all zeros", () => {
    expect(cosineSimilarity([0, 0], [1, 2])).toBe(0);
  });
});

describe("topKBySimilarity", () => {
  const items = [
    { label: "a", embedding: [1, 0] },
    { label: "b", embedding: [0, 1] },
    { label: "c", embedding: [0.9, 0.1] },
  ];

  it("ranks items by similarity to the query, most similar first", () => {
    const results = topKBySimilarity([1, 0], items, (i) => i.embedding, 2);
    expect(results.map((r) => r.label)).toEqual(["a", "c"]);
  });

  it("treats missing embeddings as least similar", () => {
    const withMissing = [...items, { label: "d", embedding: null }];
    const results = topKBySimilarity([1, 0], withMissing, (i) => i.embedding, 4);
    expect(results[results.length - 1].label).toBe("d");
  });
});
