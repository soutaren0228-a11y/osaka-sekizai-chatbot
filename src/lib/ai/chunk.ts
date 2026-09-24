/**
 * 本文をチャンク（検索・埋め込みの単位）に分割する。
 * 日本語は単語間に空白がないため、単語区切りではなく文字数ベースで分割する簡易実装。
 */
const CHUNK_SIZE = 800;
const CHUNK_OVERLAP = 100;

export function chunkText(text: string): string[] {
  const normalized = text.replace(/\r\n/g, "\n").trim();
  if (!normalized) return [];
  if (normalized.length <= CHUNK_SIZE) return [normalized];

  const chunks: string[] = [];
  let start = 0;
  while (start < normalized.length) {
    const end = Math.min(start + CHUNK_SIZE, normalized.length);
    chunks.push(normalized.slice(start, end).trim());
    if (end === normalized.length) break;
    start = end - CHUNK_OVERLAP;
  }
  return chunks.filter((c) => c.length > 0);
}
