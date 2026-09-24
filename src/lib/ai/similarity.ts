/**
 * 公開版のFAQスナップショット（埋め込みをJSON配列で保持している）に対して、
 * DBの類似検索を使わずアプリ側でコサイン類似度を計算するためのユーティリティ。
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

export function topKBySimilarity<T>(
  queryEmbedding: number[],
  items: T[],
  getEmbedding: (item: T) => number[] | null | undefined,
  k: number
): (T & { similarity: number })[] {
  return items
    .map((item) => {
      const embedding = getEmbedding(item);
      const similarity = embedding ? cosineSimilarity(queryEmbedding, embedding) : -1;
      return { ...item, similarity };
    })
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, k);
}
